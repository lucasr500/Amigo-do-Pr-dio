// Camada remota do Mural/Comunicados — dual-write PUSH (009, gated-off).
// Best-effort: NUNCA lança, NUNCA bloqueia a UI. Segue o padrão de decisionsRemote.ts
// (import dinâmico do SDK, cast local de tipos, retorno seguro). Gating em toda função:
// sem window, flag off ou sem condomínio ativo → no-op. Com `mural_remote_enabled`
// desligado (default), zero rede.
//
// DIFERENÇA vs. decisionsRemote: a `nature` (opiniao|comunicado) é DERIVADA de `origin`
// via natureOfPost (lib/content-nature.ts) e gravada denormalizada — a separação de
// natureza vira fato de banco, nunca rótulo escolhido. O pull ignora a coluna `nature`
// (o tipo local a deriva sob demanda), logo ela é write-only no espelho.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import { natureOfPost } from "@/lib/content-nature";
import type { InstitutionalPost, AttachmentLite, PostCategory, PostOrigin, Visibility } from "@/lib/community-types"; // type-only: sem ciclo runtime

// ─── Tipos locais para queries Supabase (sem depender do SDK genérico) ───────

type DbError = { message: string } | null;

type PostRow = {
  id: string;
  condominio_id: string;
  title: string | null;
  body: string | null;
  category: string | null;
  origin: string | null;
  nature: string | null;          // derivada (write-only) — não volta ao tipo local
  visibility: string | null;
  allow_comments: boolean | null;
  pinned: boolean | null;
  archived: boolean | null;
  link_url: string | null;
  attachments: AttachmentLite[] | null;
  related_document_ids: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PostsTable = {
  upsert: (row: PostRow, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => {
    eq: (col: string, val: string) => {
      eq: (col: string, val: string) => Promise<{ error: DbError }>;
    };
  };
  select: (cols: string) => {
    eq: (col: string, val: string) => Promise<{ data: PostRow[] | null; error: DbError }>;
  };
};

type SupabaseClient = { from: (table: "community_posts") => PostsTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Mapeamento camelCase ↔ snake_case ───────────────────────────────────────

function toRow(p: InstitutionalPost, condominioId: string): PostRow {
  return {
    id: p.id,
    condominio_id: condominioId,
    title: p.title ?? "",
    body: p.body ?? null,
    category: p.category ?? "outro",
    origin: p.origin ?? null,
    nature: natureOfPost(p),                 // derivada — separação de natureza é fato de banco
    visibility: p.visibility ?? "moradores", // default seguro (paridade com a coluna)
    allow_comments: p.allowComments ?? false,
    pinned: p.pinned ?? false,
    archived: p.archived ?? false,
    link_url: p.linkUrl ?? null,
    attachments: p.attachments ?? null,
    related_document_ids: p.relatedDocumentIds ?? null,
  };
}

function fromRow(r: PostRow): InstitutionalPost {
  return {
    id: r.id,
    title: r.title ?? "",
    body: r.body ?? "",
    category: (r.category ?? "outro") as PostCategory,
    origin: (r.origin ?? undefined) as PostOrigin | undefined,
    visibility: (r.visibility ?? "moradores") as Visibility,
    allowComments: r.allow_comments ?? false,
    pinned: r.pinned ?? false,
    archived: r.archived ?? false,
    linkUrl: r.link_url ?? undefined,
    attachments: r.attachments ?? undefined,
    relatedDocumentIds: r.related_document_ids ?? undefined,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

// ─── Escritas espelhadas (best-effort) ────────────────────────────────────────

/** Espelha criação/atualização de um post para a tabela relacional. */
export async function mirrorUpsertPost(post: InstitutionalPost): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("mural_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("community_posts").upsert(toRow(post, condId), { onConflict: "id" });
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Espelha a exclusão de um post na tabela relacional. */
export async function mirrorDeletePost(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("mural_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    const sb = asClient(rawClient);
    await sb.from("community_posts").delete().eq("condominio_id", condId).eq("id", id);
  } catch {
    /* best-effort — nunca lança */
  }
}

/** Lista os posts remotos do condomínio ativo (sujeito à RLS de papel × visibilidade). */
export async function listRemotePosts(condominioId?: string): Promise<InstitutionalPost[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("mural_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const sb = asClient(rawClient);
    const { data, error } = await sb.from("community_posts").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch {
    return [];
  }
}
