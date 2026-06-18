// Camada remota do Canal de Solicitações — dual-write PUSH (010, gated-off).
// Best-effort: NUNCA lança, NUNCA bloqueia a UI. Padrão de communityPostsRemote.ts.
// Gating em toda função: sem window, flag off ou sem condomínio → no-op. Com
// `requests_remote_enabled` desligado (default), zero rede.
//
// AUTORIA e VISIBILIDADE são colunas do servidor: `created_by` (DEFAULT auth.uid()) e
// `visibility` (DEFAULT 'gestao' = privado). O dual-write NÃO as envia — no insert os
// DEFAULTs preenchem (autor = usuário autenticado; privado), no update são retidas. Assim
// o espelho é fiel ao comportamento atual (só a gestão opera o canal) sem inventar campos
// no tipo local ResidentRequest.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { ResidentRequest, RequestType, RequestStatus, RequestPriority } from "@/lib/community-types"; // type-only

// ─── Tipos locais para queries Supabase ──────────────────────────────────────

type DbError = { message: string } | null;

// Linha completa (leitura). created_by/visibility existem no banco mas não no tipo local.
type RequestRow = {
  id: string;
  condominio_id: string;
  created_by?: string | null;
  unit_number: string | null;
  author_name: string | null;
  author_contact: string | null;
  type: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  visibility?: string | null;
  assigned_to: string | null;
  due_date: string | null;
  resolution_note: string | null;
  management_response: string | null;
  work_start_date: string | null;
  work_end_date: string | null;
  work_time_window: string | null;
  work_responsible: string | null;
  closed_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// Linha enviada no push: sem created_by/visibility (server-defaulted).
type RequestUpsert = Omit<RequestRow, "created_by" | "visibility" | "created_at" | "updated_at">;

type RequestsTable = {
  upsert: (row: RequestUpsert, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => {
    eq: (col: string, val: string) => {
      eq: (col: string, val: string) => Promise<{ error: DbError }>;
    };
  };
  select: (cols: string) => {
    eq: (col: string, val: string) => Promise<{ data: RequestRow[] | null; error: DbError }>;
  };
};

type SupabaseClient = { from: (table: "community_requests") => RequestsTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Mapeamento camelCase ↔ snake_case ───────────────────────────────────────

function toRow(r: ResidentRequest, condominioId: string): RequestUpsert {
  return {
    id: r.id,
    condominio_id: condominioId,
    unit_number: r.unitNumber ?? null,
    author_name: r.authorName ?? null,
    author_contact: r.authorContact ?? null,
    type: r.type ?? "outro",
    title: r.title ?? "",
    description: r.description ?? null,
    status: r.status ?? "recebido",
    priority: r.priority ?? "normal",
    assigned_to: r.assignedTo ?? null,
    due_date: r.dueDate ?? null,
    resolution_note: r.resolutionNote ?? null,
    management_response: r.managementResponse ?? null,
    work_start_date: r.workStartDate ?? null,
    work_end_date: r.workEndDate ?? null,
    work_time_window: r.workTimeWindow ?? null,
    work_responsible: r.workResponsible ?? null,
    closed_at: r.closedAt ?? null,
  };
}

function fromRow(r: RequestRow): ResidentRequest {
  return {
    id: r.id,
    unitNumber: r.unit_number ?? undefined,
    authorName: r.author_name ?? "",
    authorContact: r.author_contact ?? undefined,
    type: (r.type ?? "outro") as RequestType,
    title: r.title ?? "",
    description: r.description ?? "",
    status: (r.status ?? "recebido") as RequestStatus,
    priority: (r.priority ?? "normal") as RequestPriority,
    assignedTo: r.assigned_to ?? undefined,
    dueDate: r.due_date ?? undefined,
    resolutionNote: r.resolution_note ?? undefined,
    managementResponse: r.management_response ?? undefined,
    workStartDate: r.work_start_date ?? undefined,
    workEndDate: r.work_end_date ?? undefined,
    workTimeWindow: r.work_time_window ?? undefined,
    workResponsible: r.work_responsible ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
    closedAt: r.closed_at ?? undefined,
  };
}

// ─── Escritas espelhadas (best-effort) ────────────────────────────────────────

/** Espelha criação/atualização de uma solicitação para a tabela relacional. */
export async function mirrorUpsertRequest(request: ResidentRequest): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("requests_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("community_requests").upsert(toRow(request, condId), { onConflict: "id" });
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Espelha a exclusão de uma solicitação na tabela relacional. */
export async function mirrorDeleteRequest(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("requests_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("community_requests").delete().eq("condominio_id", condId).eq("id", id);
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Lista as solicitações remotas do condomínio ativo (sujeito à RLS papel×visibilidade+autor). */
export async function listRemoteRequests(condominioId?: string): Promise<ResidentRequest[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("requests_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const sb = asClient(rawClient);
    const { data, error } = await sb.from("community_requests").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch {
    return [];
  }
}
