// ─── Mural Oficial — CRUD de posts institucionais ────────────────────────────
import { safeRead, safeWrite } from "./session-core";
import type {
  InstitutionalPost, Comment, CommentStatus,
  CommunityAuditEntry, AuditAction,
} from "./community-types";

export type { InstitutionalPost, Comment, CommunityAuditEntry };

const KEY_POSTS    = "amigo_community_posts";
const KEY_COMMENTS = "amigo_community_comments";
const KEY_AUDIT    = "amigo_community_audit";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function getPosts(): InstitutionalPost[] {
  return safeRead<InstitutionalPost[]>(KEY_POSTS, []);
}

export function savePosts(posts: InstitutionalPost[]): void {
  safeWrite(KEY_POSTS, posts);
}

export function addPost(
  data: Omit<InstitutionalPost, "id" | "createdAt" | "updatedAt">
): InstitutionalPost {
  const now = new Date().toISOString();
  const post: InstitutionalPost = { ...data, id: uid(), createdAt: now, updatedAt: now };
  savePosts([post, ...getPosts()]);
  appendAudit("post_created", "post", post.id, "manager", `Post criado: ${post.title}`);
  return post;
}

export function updatePost(id: string, patch: Partial<InstitutionalPost>): void {
  savePosts(getPosts().map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
  appendAudit("post_updated", "post", id, "manager", "Post atualizado");
}

export function archivePost(id: string): void {
  updatePost(id, { archived: true });
  appendAudit("post_archived", "post", id, "manager", "Post arquivado");
}

export function pinPost(id: string, pinned: boolean): void {
  updatePost(id, { pinned });
  appendAudit("post_pinned", "post", id, "manager", pinned ? "Post fixado" : "Post desafixado");
}

export function deletePost(id: string): void {
  savePosts(getPosts().filter((p) => p.id !== id));
  saveComments(getComments().filter((c) => c.postId !== id));
}

export function getActivePosts(): InstitutionalPost[] {
  return getPosts()
    .filter((p) => !p.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

// ─── Comentários ──────────────────────────────────────────────────────────────

export function getComments(): Comment[] {
  return safeRead<Comment[]>(KEY_COMMENTS, []);
}

export function saveComments(comments: Comment[]): void {
  safeWrite(KEY_COMMENTS, comments);
}

export function addComment(
  postId: string,
  authorName: string,
  body: string,
  autoApprove = false
): Comment {
  const now = new Date().toISOString();
  const comment: Comment = {
    id: uid(), postId, authorName, authorRole: "resident",
    body, status: autoApprove ? "publicado" : "pendente",
    createdAt: now,
  };
  saveComments([...getComments(), comment]);
  return comment;
}

export function getCommentsForPost(postId: string): Comment[] {
  return getComments()
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function moderateComment(
  id: string,
  status: CommentStatus
): void {
  const now = new Date().toISOString();
  saveComments(
    getComments().map((c) =>
      c.id === id ? { ...c, status, moderatedAt: now, updatedAt: now } : c
    )
  );
  const action: AuditAction = status === "oculto" ? "comment_hidden" :
    status === "removido" ? "comment_removed" : "comment_approved";
  appendAudit(action, "comment", id, "manager", `Comentário ${status}`);
}

// ─── Auditoria ────────────────────────────────────────────────────────────────

export function getCommunityAudit(): CommunityAuditEntry[] {
  return safeRead<CommunityAuditEntry[]>(KEY_AUDIT, []);
}

function appendAudit(
  action: AuditAction,
  entityType: string,
  entityId: string,
  actorRole: CommunityAuditEntry["actorRole"],
  description: string
): void {
  const entries = getCommunityAudit();
  const entry: CommunityAuditEntry = {
    id: uid(), action, entityType, entityId, actorRole, description,
    createdAt: new Date().toISOString(),
  };
  safeWrite(KEY_AUDIT, [entry, ...entries].slice(0, 500));
}

export { appendAudit as addAuditEntry };

// ─── Seed de exemplo ──────────────────────────────────────────────────────────

export function seedDemoPosts(): void {
  if (getPosts().length > 0) return;

  const posts: Omit<InstitutionalPost, "id" | "createdAt" | "updatedAt">[] = [
    {
      title: "Manutenção da bomba d'água — 15/06",
      body: "Informamos que haverá manutenção preventiva na bomba d'água no dia 15 de junho, das 8h às 12h. O abastecimento será interrompido durante esse período. Pedimos compreensão.",
      category: "manutencao",
      visibility: "moradores",
      allowComments: false,
      pinned: true,
      archived: false,
    },
    {
      title: "Regras de uso da garagem — relembrete",
      body: "Conforme o Regimento Interno, é proibido estacionar em vagas alheias, deixar objetos nos corredores de circulação e lavar veículos sem autorização prévia. Infratores estarão sujeitos a advertência e multa.",
      category: "regra",
      visibility: "moradores",
      allowComments: true,
      pinned: false,
      archived: false,
    },
    {
      title: "Ata da assembleia de março disponível",
      body: "A ata da Assembleia Geral Ordinária de março está disponível na seção de Documentos. Os condôminos podem consultá-la a qualquer momento.",
      category: "assembleia",
      visibility: "moradores",
      allowComments: false,
      pinned: false,
      archived: false,
    },
  ];

  const now = new Date().toISOString();
  const prev = new Date(Date.now() - 2 * 86400000).toISOString();
  const built = [
    { ...posts[0], id: `demo-${Date.now()}-1`, createdAt: now, updatedAt: now },
    { ...posts[1], id: `demo-${Date.now()}-2`, createdAt: prev, updatedAt: prev },
    { ...posts[2], id: `demo-${Date.now()}-3`, createdAt: prev, updatedAt: prev },
  ] satisfies InstitutionalPost[];
  savePosts(built);
}
