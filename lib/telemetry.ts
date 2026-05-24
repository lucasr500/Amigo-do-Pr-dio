// Telemetria centralizada — Supabase via REST (zero dependências externas).
// Supabase aqui é observabilidade interna opcional; não persiste nem sincroniza
// dados do condomínio, não substitui localStorage e não deve receber PII.
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
//      CREATE POLICY "read_anon" ON events FOR SELECT TO anon USING (true);
//
//      O /admin usa NEXT_PUBLIC_ADMIN_KEY para proteger a interface e lê eventos
//      via fetchRecentEvents() com a anon key. Por isso, a leitura remota depende
//      de policy SELECT para anon. Ver docs/setup-supabase-telemetria.md.
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

// Publishable keys (sb_publishable_...) are not JWTs — using them as Bearer tokens
// causes preflight failures. Legacy anon keys (eyJ...) are JWTs and still work with Bearer.
// Prefer: return=minimal is omitted intentionally — it triggers an extra CORS preflight header.
function buildSupabaseHeaders(options?: {
  json?: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = { apikey: SUPABASE_KEY };
  if (!SUPABASE_KEY.startsWith("sb_publishable_")) {
    headers["Authorization"] = `Bearer ${SUPABASE_KEY}`;
  }
  if (options?.json) headers["Content-Type"] = "application/json";
  return headers;
}

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
  | "home_refreshed_manual"
  | "home_summary_viewed"
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
  | "local_context_notice_shown"
  | "comunicado_gerado"
  | "comunicado_copiado"
  | "simulador_calculado"
  | "simulador_reajuste_calculado"
  | "pendencia_created_manual"
  | "pendencia_created_from_response"
  | "pendencia_created_from_guidance"
  | "pendencia_created_from_memoria"
  | "pendencia_completed"
  | "pendencia_completed_from_guidance_resolution"
  | "revisao_mensal_surface_seen"
  | "revisao_mensal_opened_from_home"
  | "revisao_mensal_progress_viewed"
  | "ocorrencia_created"
  | "admin_message_generated"
  | "admin_message_copied"
  | "weekly_review_viewed"
  | "weekly_review_completed"
  | "data_cleared"
  | "agenda_event_created"
  | "agenda_event_completed"
  | "agenda_event_deleted"
  | "urgency_banner_tap"
  | "profile_completion_cta_tap"
  | "assistant_response_feedback"
  | "comunicado_followup_created";

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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      headers: buildSupabaseHeaders({ json: true }),
      body: JSON.stringify(batch),
    });
    if (!res.ok && process.env.NODE_ENV !== "production") {
      console.warn("[telemetry] insert failed", res.status, res.statusText, "(insert)");
    }
  } catch {
    // Silent fallback — telemetry never blocks product
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
// Requer RLS policy SELECT para anon, conforme o guia de setup.

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
      { headers: buildSupabaseHeaders() }
    );
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[telemetry] read failed", res.status, res.statusText, "(read)");
      }
      return [];
    }
    return (await res.json()) as RawEvent[];
  } catch {
    return [];
  }
}

export { ENABLED as telemetryEnabled };
