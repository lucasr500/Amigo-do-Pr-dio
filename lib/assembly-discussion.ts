// ─── Discussão da Assembleia (ramo "discutir" do loop) ───────────────────────
// Comentários ancorados a um item de pauta. Espelha integralmente o padrão de
// comentários do mural (lib/community-posts.ts): autoria pelo rótulo do papel
// (CommunityRole), moderação por status (publicado/pendente/oculto/removido).
//
// Local-only nesta fatia — sem dual-write. O espelhamento remoto é a migration 008
// (tabela assembly_comments), passo separado e só após o gate de isolamento verde.
//
// Sem lógica de UI. Importa apenas tipos compartilhados e o session-core.

import { safeRead, safeWrite, KEYS } from "./session-core";
import type { CommunityRole, CommentStatus } from "./community-types";

export const MAX_ASSEMBLY_COMMENTS = 5000;

export type AssemblyComment = {
  id: string;
  assemblyId: string;
  itemId: string;
  authorName: string;          // rótulo do papel (ROLE_LABELS), como no mural
  authorRole: CommunityRole;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
  moderatedAt?: string;
};

function uid(): string {
  return `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Persistência ─────────────────────────────────────────────────────────────

export function getAssemblyComments(): AssemblyComment[] {
  return safeRead<AssemblyComment[]>(KEYS.ASSEMBLEIA_COMENTARIOS, []);
}

export function saveAssemblyComments(list: AssemblyComment[]): void {
  safeWrite(KEYS.ASSEMBLEIA_COMENTARIOS, list.slice(-MAX_ASSEMBLY_COMMENTS));
}

// ─── CRUD + moderação ─────────────────────────────────────────────────────────

/**
 * Adiciona um comentário a um item de pauta. `autoApprove` (gestão/conselho) →
 * publicado; caso contrário entra como "pendente" de moderação (mesma regra do mural).
 */
export function addAssemblyComment(
  itemId: string,
  assemblyId: string,
  authorName: string,
  authorRole: CommunityRole,
  body: string,
  autoApprove = false
): AssemblyComment | null {
  const text = body.trim();
  if (!text) return null;
  const now = new Date().toISOString();
  const comment: AssemblyComment = {
    id: uid(),
    assemblyId,
    itemId,
    authorName,
    authorRole,
    body: text,
    status: autoApprove ? "publicado" : "pendente",
    createdAt: now,
  };
  saveAssemblyComments([...getAssemblyComments(), comment]);
  return comment;
}

export function moderateAssemblyComment(id: string, status: CommentStatus): void {
  const now = new Date().toISOString();
  saveAssemblyComments(
    getAssemblyComments().map((c) =>
      c.id === id ? { ...c, status, moderatedAt: now, updatedAt: now } : c
    )
  );
}

export function deleteAssemblyComment(id: string): void {
  saveAssemblyComments(getAssemblyComments().filter((c) => c.id !== id));
}

// ─── Leitura escopada ─────────────────────────────────────────────────────────

/** Todos os comentários de um item, em ordem cronológica (inclui não publicados). */
export function getCommentsForItem(itemId: string): AssemblyComment[] {
  return getAssemblyComments()
    .filter((c) => c.itemId === itemId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Apenas os publicados — o que um morador veria. */
export function getPublishedCommentsForItem(itemId: string): AssemblyComment[] {
  return getCommentsForItem(itemId).filter((c) => c.status === "publicado");
}

/** Contagem de publicados (para o badge do item). */
export function countPublishedForItem(itemId: string): number {
  return getAssemblyComments().filter((c) => c.itemId === itemId && c.status === "publicado").length;
}

/** Contagem de pendentes de moderação (alerta do gestor). */
export function countPendingForItem(itemId: string): number {
  return getAssemblyComments().filter((c) => c.itemId === itemId && c.status === "pendente").length;
}

// ─── Cascata (espelha ON DELETE CASCADE) ──────────────────────────────────────

export function deleteCommentsForItem(itemId: string): void {
  saveAssemblyComments(getAssemblyComments().filter((c) => c.itemId !== itemId));
}

export function deleteCommentsForAssembly(assemblyId: string): void {
  saveAssemblyComments(getAssemblyComments().filter((c) => c.assemblyId !== assemblyId));
}
