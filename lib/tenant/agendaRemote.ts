// Camada remota da Agenda — dual-write PUSH (Fatia 2a).
// Best-effort: NUNCA lança, NUNCA bloqueia a UI. Segue o padrão defensivo de
// tenantClient.ts (import dinâmico do SDK, cast local de tipos, retorno seguro).
//
// Gating em toda função: sem window, flag off ou sem condomínio ativo → no-op.
// Com `agenda_remote_enabled` desligado (default), zero chamada de rede.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { AgendaEvent } from "@/lib/session-agenda"; // type-only: não cria ciclo runtime

// ─── Tipos locais para queries Supabase (sem depender do SDK genérico) ───────

type DbError = { message: string } | null;

type AgendaRow = {
  id: string;
  condominio_id: string;
  title: string | null;
  date: string | null;
  type: string | null;
  note: string | null;
  responsavel: string | null;
  prioridade: string | null;
  recurrence: string | null;
  template_id: string | null;
  source: string | null;
  linked_pendencia_id: string | null;
  completed_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AgendaTable = {
  upsert: (row: AgendaRow, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => {
    eq: (col: string, val: string) => {
      eq: (col: string, val: string) => Promise<{ error: DbError }>;
    };
  };
  select: (cols: string) => {
    eq: (col: string, val: string) => Promise<{ data: AgendaRow[] | null; error: DbError }>;
  };
};

type SupabaseClient = {
  from: (table: "agenda_events") => AgendaTable;
};

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Mapeamento camelCase ↔ snake_case ───────────────────────────────────────

function toRow(e: AgendaEvent, condominioId: string): AgendaRow {
  return {
    id: e.id,
    condominio_id: condominioId,
    title: e.title ?? null,
    date: e.date ?? null,
    type: e.type ?? null,
    note: e.note ?? null,
    responsavel: e.responsavel ?? null,
    prioridade: e.prioridade ?? null,
    recurrence: e.recurrence ?? null,
    template_id: e.templateId ?? null,
    source: e.source ?? null,
    linked_pendencia_id: e.linkedPendenciaId ?? null,
    completed_at: e.completedAt ?? null,
  };
}

function fromRow(r: AgendaRow): AgendaEvent {
  return {
    id: r.id,
    title: r.title ?? "",
    date: r.date ?? "",
    type: (r.type ?? "outro") as AgendaEvent["type"],
    note: r.note ?? undefined,
    responsavel: r.responsavel ?? undefined,
    prioridade: (r.prioridade ?? undefined) as AgendaEvent["prioridade"],
    recurrence: (r.recurrence ?? undefined) as AgendaEvent["recurrence"],
    templateId: r.template_id ?? undefined,
    source: (r.source ?? undefined) as AgendaEvent["source"],
    linkedPendenciaId: r.linked_pendencia_id ?? undefined,
    completedAt: r.completed_at ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? undefined,
  };
}

// ─── Escritas espelhadas (best-effort) ────────────────────────────────────────

/** Espelha a criação/atualização de um evento para a tabela relacional. */
export async function mirrorUpsert(event: AgendaEvent): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("agenda_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("agenda_events").upsert(toRow(event, condId), { onConflict: "id" });
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Espelha a exclusão de um evento na tabela relacional. */
export async function mirrorDelete(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("agenda_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("agenda_events").delete().eq("condominio_id", condId).eq("id", id);
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Lista os eventos remotos do condomínio ativo. Pronto para a Fatia 2b (read+merge). */
export async function listRemoteAgenda(condominioId?: string): Promise<AgendaEvent[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("agenda_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const sb = asClient(rawClient);
    const { data, error } = await sb.from("agenda_events").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch {
    return [];
  }
}
