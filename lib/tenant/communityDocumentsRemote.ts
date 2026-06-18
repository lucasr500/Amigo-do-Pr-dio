// Camada remota dos Documentos — dual-write PUSH (012, gated-off). Best-effort.
// Gating em toda função: sem window, flag off ou sem condomínio → no-op. Com
// `documents_remote_enabled` desligado (default), zero rede.
//
// created_by (autoria) e storage_path (Bloco 3 / Storage) são colunas do servidor: o push
// NÃO as envia (insert → DEFAULT/null; update → retidas). Assim o upload do arquivo (Bloco 3)
// pode setar storage_path sem que uma atualização de metadado o sobrescreva.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { PublicDocument, PublicDocumentCategory, Visibility } from "@/lib/community-types"; // type-only

type DbError = { message: string } | null;

type DocRow = {
  id: string;
  condominio_id: string;
  created_by?: string | null;
  title: string | null;
  category: string | null;
  description: string | null;
  visibility: string | null;
  url: string | null;
  storage_path?: string | null;
  version: string | null;
  valid_until: string | null;
  published_at: string | null;
  linked_internal_doc_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
// Push: sem created_by/storage_path (server/Storage-managed) nem timestamps de servidor.
type DocUpsert = Omit<DocRow, "created_by" | "storage_path" | "created_at" | "updated_at">;

type DocsTable = {
  upsert: (row: DocUpsert, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: DbError }> } };
  select: (cols: string) => { eq: (c: string, v: string) => Promise<{ data: DocRow[] | null; error: DbError }> };
};
type SupabaseClient = { from: (table: "community_documents") => DocsTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

function toRow(d: PublicDocument, condominioId: string): DocUpsert {
  return {
    id: d.id,
    condominio_id: condominioId,
    title: d.title ?? "",
    category: d.category ?? "outro",
    description: d.description ?? null,
    visibility: d.visibility ?? "moradores",
    url: d.url ?? null,
    version: d.version ?? null,
    valid_until: d.validUntil ?? null,
    published_at: d.publishedAt ?? null,
    linked_internal_doc_id: d.linkedInternalDocId ?? null,
  };
}

function fromRow(r: DocRow): PublicDocument {
  return {
    id: r.id,
    title: r.title ?? "",
    category: (r.category ?? "outro") as PublicDocumentCategory,
    description: r.description ?? undefined,
    visibility: (r.visibility ?? "moradores") as Visibility,
    url: r.url ?? undefined,
    version: r.version ?? undefined,
    validUntil: r.valid_until ?? undefined,
    publishedAt: r.published_at ?? "",
    linkedInternalDocId: r.linked_internal_doc_id ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

export async function mirrorUpsertDocument(doc: PublicDocument): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("documents_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("community_documents").upsert(toRow(doc, condId), { onConflict: "id" });
  } catch { /* best-effort */ }
}

export async function mirrorDeleteDocument(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("documents_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("community_documents").delete().eq("condominio_id", condId).eq("id", id);
  } catch { /* best-effort */ }
}

export async function listRemoteDocuments(condominioId?: string): Promise<PublicDocument[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("documents_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const { data, error } = await asClient(rawClient).from("community_documents").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch { return []; }
}
