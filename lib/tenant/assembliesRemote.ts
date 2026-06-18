// Camada remota da Assembleia — dual-write PUSH (espelha lib/tenant/agendaRemote.ts).
// Best-effort: NUNCA lança, NUNCA bloqueia a UI. Import dinâmico do SDK, cast local
// de tipos, retorno seguro.
//
// Gating em toda função: sem window, flag off ou sem condomínio ativo → no-op.
// Com `assemblies_remote_enabled` desligado (default), zero chamada de rede.
// O flag só deve ser ligado APÓS o gate de isolamento entre condomínios passar verde.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { Assembly, AssemblyAgendaItem } from "@/lib/session-assembleias"; // type-only: sem ciclo runtime

// ─── Tipos locais para queries Supabase (sem depender do SDK genérico) ───────

type DbError = { message: string } | null;

type AssemblyRow = {
  id: string;
  condominio_id: string;
  titulo: string;
  tipo: string;
  data: string | null;
  local: string | null;
  status: string;
  quorum_min: number | null;
  quorum_atingido: number | null;
  ata_document_id: string | null;
  convocada_em: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ItemRow = {
  id: string;
  assembly_id: string;
  condominio_id: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  resultado: string | null;
  decidido_em: string | null;
  linked_decision_id: string | null;
  linked_poll_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Table<Row> = {
  upsert: (row: Row, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => {
    eq: (col: string, val: string) => {
      eq: (col: string, val: string) => Promise<{ error: DbError }>;
    };
  };
  select: (cols: string) => {
    eq: (col: string, val: string) => Promise<{ data: Row[] | null; error: DbError }>;
  };
};

type SupabaseClient = {
  from(table: "assemblies"): Table<AssemblyRow>;
  from(table: "assembly_agenda_items"): Table<ItemRow>;
};

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Mapeamento camelCase ↔ snake_case ───────────────────────────────────────

function assemblyToRow(a: Assembly, condominioId: string): AssemblyRow {
  return {
    id: a.id,
    condominio_id: condominioId,
    titulo: a.titulo,
    tipo: a.tipo,
    data: a.data ?? null,
    local: a.local ?? null,
    status: a.status,
    quorum_min: a.quorumMin ?? null,
    quorum_atingido: a.quorumAtingido ?? null,
    ata_document_id: a.ataDocumentId ?? null,
    convocada_em: a.convocadaEm ?? null,
  };
}

function assemblyFromRow(r: AssemblyRow): Assembly {
  return {
    id: r.id,
    titulo: r.titulo ?? "",
    tipo: (r.tipo ?? "ago") as Assembly["tipo"],
    data: r.data ?? undefined,
    local: r.local ?? undefined,
    status: (r.status ?? "rascunho") as Assembly["status"],
    quorumMin: r.quorum_min ?? undefined,
    quorumAtingido: r.quorum_atingido ?? undefined,
    ataDocumentId: r.ata_document_id ?? undefined,
    convocadaEm: r.convocada_em ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? undefined,
  };
}

function itemToRow(i: AssemblyAgendaItem, condominioId: string): ItemRow {
  return {
    id: i.id,
    assembly_id: i.assemblyId,
    condominio_id: condominioId,
    ordem: i.ordem,
    titulo: i.titulo,
    descricao: i.descricao ?? null,
    tipo: i.tipo,
    resultado: i.resultado ?? null,
    decidido_em: i.decididoEm ?? null,
    linked_decision_id: i.linkedDecisionId ?? null,
    linked_poll_id: i.linkedPollId ?? null,
  };
}

function itemFromRow(r: ItemRow): AssemblyAgendaItem {
  return {
    id: r.id,
    assemblyId: r.assembly_id,
    ordem: r.ordem ?? 0,
    titulo: r.titulo ?? "",
    descricao: r.descricao ?? undefined,
    tipo: (r.tipo ?? "deliberacao") as AssemblyAgendaItem["tipo"],
    resultado: r.resultado ?? undefined,
    decididoEm: r.decidido_em ?? undefined,
    linkedDecisionId: r.linked_decision_id ?? undefined,
    linkedPollId: r.linked_poll_id ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? undefined,
  };
}

// ─── Guard comum + acesso ao cliente ──────────────────────────────────────────

async function withClient<T>(
  fn: (sb: SupabaseClient, condId: string) => Promise<T>,
  fallback: T
): Promise<T> {
  if (typeof window === "undefined") return fallback;
  if (!isEnabled("assemblies_remote_enabled")) return fallback;
  const condId = getActiveCondominioId();
  if (!condId) return fallback;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return fallback;
    return await fn(asClient(rawClient), condId);
  } catch {
    return fallback;
  }
}

// ─── Escritas espelhadas (best-effort) — assembleias ──────────────────────────

export async function mirrorUpsertAssembly(a: Assembly): Promise<void> {
  await withClient(async (sb, condId) => {
    await sb.from("assemblies").upsert(assemblyToRow(a, condId), { onConflict: "id" });
  }, undefined);
}

export async function mirrorDeleteAssembly(id: string): Promise<void> {
  await withClient(async (sb, condId) => {
    await sb.from("assemblies").delete().eq("condominio_id", condId).eq("id", id);
  }, undefined);
}

export async function listRemoteAssemblies(condominioId?: string): Promise<Assembly[]> {
  return withClient(async (sb, condId) => {
    const target = condominioId || condId;
    const { data, error } = await sb.from("assemblies").select("*").eq("condominio_id", target);
    if (error || !data) return [];
    return data.map(assemblyFromRow);
  }, []);
}

// ─── Escritas espelhadas (best-effort) — itens de pauta ───────────────────────

export async function mirrorUpsertItem(i: AssemblyAgendaItem): Promise<void> {
  await withClient(async (sb, condId) => {
    await sb.from("assembly_agenda_items").upsert(itemToRow(i, condId), { onConflict: "id" });
  }, undefined);
}

export async function mirrorDeleteItem(id: string): Promise<void> {
  await withClient(async (sb, condId) => {
    await sb.from("assembly_agenda_items").delete().eq("condominio_id", condId).eq("id", id);
  }, undefined);
}

export async function listRemoteItems(condominioId?: string): Promise<AssemblyAgendaItem[]> {
  return withClient(async (sb, condId) => {
    const target = condominioId || condId;
    const { data, error } = await sb.from("assembly_agenda_items").select("*").eq("condominio_id", target);
    if (error || !data) return [];
    return data.map(itemFromRow);
  }, []);
}
