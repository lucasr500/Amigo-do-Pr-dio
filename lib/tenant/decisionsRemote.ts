// Camada remota de Decisões — dual-write PUSH (D2, gated-off).
// Best-effort: NUNCA lança, NUNCA bloqueia a UI. Segue o padrão defensivo de
// assembliesRemote.ts/agendaRemote.ts (import dinâmico do SDK, cast local de tipos,
// retorno seguro). Gating em toda função: sem window, flag off ou sem condomínio
// ativo → no-op. Com `decisions_remote_enabled` desligado (default), zero rede.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { Decision } from "@/lib/decisions"; // type-only: não cria ciclo runtime

// ─── Tipos locais para queries Supabase (sem depender do SDK genérico) ───────

type DbError = { message: string } | null;

type DecisionRow = {
  id: string;
  condominio_id: string;
  title: string | null;
  date: string | null;
  category: string | null;
  context: string | null;
  rationale: string | null;
  outcome: string | null;
  status: string | null;
  visibility: string | null;
  risk_level: string | null;
  risk_notes: string | null;
  next_step: string | null;
  linked_unit: string | null;
  linked_document_id: string | null;
  linked_supplier_id: string | null;
  linked_pendencia_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DecisionsTable = {
  upsert: (row: DecisionRow, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => {
    eq: (col: string, val: string) => {
      eq: (col: string, val: string) => Promise<{ error: DbError }>;
    };
  };
  select: (cols: string) => {
    eq: (col: string, val: string) => Promise<{ data: DecisionRow[] | null; error: DbError }>;
  };
};

type SupabaseClient = { from: (table: "decisions") => DecisionsTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Mapeamento camelCase ↔ snake_case ───────────────────────────────────────

function toRow(d: Decision, condominioId: string): DecisionRow {
  return {
    id: d.id,
    condominio_id: condominioId,
    title: d.title ?? null,
    date: d.date ?? null,
    category: d.category ?? null,
    context: d.context ?? null,
    rationale: d.rationale ?? null,
    outcome: d.outcome ?? null,
    status: d.status ?? null,
    visibility: d.visibility ?? "gestao", // default seguro (paridade com a coluna)
    risk_level: d.riskLevel ?? null,
    risk_notes: d.riskNotes ?? null,
    next_step: d.nextStep ?? null,
    linked_unit: d.linkedUnit ?? null,
    linked_document_id: d.linkedDocumentId ?? null,
    linked_supplier_id: d.linkedSupplierId ?? null,
    linked_pendencia_id: d.linkedPendenciaId ?? null,
  };
}

function fromRow(r: DecisionRow): Decision {
  return {
    id: r.id,
    title: r.title ?? "",
    date: r.date ?? "",
    category: (r.category ?? "outro") as Decision["category"],
    context: r.context ?? "",
    rationale: r.rationale ?? "",
    outcome: r.outcome ?? "",
    status: (r.status ?? "registrada") as Decision["status"],
    visibility: (r.visibility ?? "gestao") as Decision["visibility"],
    riskLevel: (r.risk_level ?? undefined) as Decision["riskLevel"],
    riskNotes: r.risk_notes ?? undefined,
    nextStep: r.next_step ?? undefined,
    linkedUnit: r.linked_unit ?? undefined,
    linkedDocumentId: r.linked_document_id ?? undefined,
    linkedSupplierId: r.linked_supplier_id ?? undefined,
    linkedPendenciaId: r.linked_pendencia_id ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

// ─── Escritas espelhadas (best-effort) ────────────────────────────────────────

/** Espelha criação/atualização de uma decisão para a tabela relacional. */
export async function mirrorUpsertDecision(decision: Decision): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("decisions_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("decisions").upsert(toRow(decision, condId), { onConflict: "id" });
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Espelha a exclusão de uma decisão na tabela relacional. */
export async function mirrorDeleteDecision(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("decisions_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("decisions").delete().eq("condominio_id", condId).eq("id", id);
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Lista as decisões remotas do condomínio ativo. Pronto para o cutover de leitura (D4). */
export async function listRemoteDecisions(condominioId?: string): Promise<Decision[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("decisions_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const sb = asClient(rawClient);
    const { data, error } = await sb.from("decisions").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch {
    return [];
  }
}
