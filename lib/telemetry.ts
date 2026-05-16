// Telemetria centralizada — Supabase via REST (zero dependências externas).
//
// Setup Supabase (uma vez):
//   1. Criar projeto em https://supabase.com
//   2. SQL Editor → executar:
//      CREATE TABLE events (
//        id        bigserial primary key,
//        event     text not null,
//        properties jsonb default '{}',
//        ts        timestamptz default now(),
//        session_id text
//      );
//      ALTER TABLE events ENABLE ROW LEVEL SECURITY;
//      CREATE POLICY "insert_only" ON events FOR INSERT TO anon WITH CHECK (true);
//      CREATE POLICY "read_admin" ON events FOR SELECT TO authenticated USING (true);
//   3. Adicionar em .env.local:
//      NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
//      NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
//      NEXT_PUBLIC_ADMIN_KEY=<senha-do-painel>
//
// Sem as variáveis configuradas: todas as chamadas são no-op silencioso.

import { getSessionId } from "./session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);

export type TelemetryEvent =
  | "session_open"
  | "session_duration"
  | "query_submitted"
  | "query_fallback"
  | "checklist_open"
  | "checklist_complete"
  | "memoria_saved"
  | "timeline_viewed"
  | "revisao_mensal_shown"
  | "revisao_mensal_done"
  | "whatsapp_shared"
  | "home_contextual_alert_tap"
  | "home_contextual_shown"
  | "onboarding_started"
  | "onboarding_completed"
  | "condominio_status_shown"
  | "guidance_panel_shown"
  | "guidance_item_expanded"
  | "guidance_ask_triggered"
  | "guidance_resolved"
  | "insight_shown"
  | "backup_exported"
  | "backup_imported"
  | "guidance_panel_see_all"
  | "assistant_fallback_contextual"
  | "assistant_fallback_generic"
  | "assistant_suggestion_clicked"
  | "comunicado_gerado"
  | "comunicado_copiado"
  | "simulador_calculado";

type QueuedEvent = {
  event: string;
  properties: Record<string, unknown>;
  ts: string;
  session_id: string;
};

// ─── Batching ─────────────────────────────────────────────────────────────────
// Acumula eventos e envia em lote para reduzir chamadas de rede.

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_MAX = 8;
const BATCH_MS = 7000;

async function flush(): Promise<void> {
  if (!ENABLED || queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });
  } catch {
    // Falha silenciosa — perda de dados aceitável; telemetria nunca bloqueia produto
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, BATCH_MS);
}

export function trackEvent(
  event: TelemetryEvent,
  props?: Record<string, string | number | boolean | null>
): void {
  if (typeof window === "undefined") return;
  queue.push({
    event,
    properties: props ?? {},
    ts: new Date().toISOString(),
    session_id: getSessionId(),
  });
  if (queue.length >= BATCH_MAX) {
    if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
    void flush();
  } else {
    scheduleFlush();
  }
}

// ─── Session duration ─────────────────────────────────────────────────────────
// Registra o tempo de permanência na sessão via Page Visibility API.
// Retorna função de cleanup para usar no useEffect de page.tsx.

export function startSessionTimer(): () => void {
  if (typeof window === "undefined") return () => {};
  const startTime = Date.now();

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      const seconds = Math.round((Date.now() - startTime) / 1000);
      trackEvent("session_duration", { seconds });
      void flush(); // flush imediato ao sair para garantir envio
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

// ─── Supabase read (admin dashboard) ─────────────────────────────────────────
// Busca eventos recentes para o painel do fundador.
// Requer RLS policy "read_admin" ou disable RLS na tabela events.

export type RawEvent = {
  event: string;
  properties: Record<string, unknown>;
  ts: string;
  session_id: string;
};

export async function fetchRecentEvents(limit = 2000): Promise<RawEvent[]> {
  if (!ENABLED) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=event,properties,ts,session_id&order=ts.desc&limit=${limit}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as RawEvent[];
  } catch {
    return [];
  }
}

export { ENABLED as telemetryEnabled };
