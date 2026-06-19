// Camada remota dos Comentários — dual-write PUSH (014, gated-off). Best-effort.
// Gating em toda função: sem window, flag off ou sem condomínio → no-op. Com
// `comments_remote_enabled` desligado (default), zero rede.
//
// NÃO HÁ mirrorDelete: remoção de comentário é SOFT (status 'removido', preservado para
// auditoria) — nunca hard-delete. created_by/sensitive são colunas do servidor (autoria +
// pré-moderação); o push NÃO as envia (insert → DEFAULT/trigger; update → retidas).

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { Comment, CommentStatus, CommunityRole } from "@/lib/community-types"; // type-only

type DbError = { message: string } | null;

type CommentRow = {
  id: string;
  condominio_id: string;
  post_id: string;
  created_by?: string | null;
  author_name: string | null;
  author_role: string | null;
  body: string | null;
  status: string | null;
  sensitive?: boolean | null;
  moderated_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
// Push: sem created_by/sensitive (server/trigger-managed) nem timestamps de servidor.
type CommentUpsert = Omit<CommentRow, "created_by" | "sensitive" | "created_at" | "updated_at">;

type CommentsTable = {
  upsert: (row: CommentUpsert, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  select: (cols: string) => { eq: (c: string, v: string) => Promise<{ data: CommentRow[] | null; error: DbError }> };
};
type SupabaseClient = { from: (table: "community_comments") => CommentsTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

function toRow(c: Comment, condominioId: string): CommentUpsert {
  return {
    id: c.id,
    condominio_id: condominioId,
    post_id: c.postId,
    author_name: c.authorName ?? null,
    author_role: c.authorRole ?? "resident",
    body: c.body ?? "",
    status: c.status ?? "pendente",
    moderated_at: c.moderatedAt ?? null,
  };
}

function fromRow(r: CommentRow): Comment {
  return {
    id: r.id,
    postId: r.post_id,
    authorName: r.author_name ?? "",
    authorRole: (r.author_role ?? "resident") as CommunityRole,
    body: r.body ?? "",
    status: (r.status ?? "pendente") as CommentStatus,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? undefined,
    moderatedAt: r.moderated_at ?? undefined,
  };
}

/** Espelha criação/moderação de um comentário. Inclui mudança de status (aprovar/ocultar/remover). */
export async function mirrorUpsertComment(comment: Comment): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("comments_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("community_comments").upsert(toRow(comment, condId), { onConflict: "id" });
  } catch { /* best-effort */ }
}

/** Lista os comentários remotos do condomínio ativo (sujeito à RLS de moderação status×papel). */
export async function listRemoteComments(condominioId?: string): Promise<Comment[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("comments_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const { data, error } = await asClient(rawClient).from("community_comments").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch { return []; }
}
