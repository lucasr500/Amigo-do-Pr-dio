"use client";

import { useState, useEffect } from "react";
import {
  getPosts, addPost, updatePost, archivePost, pinPost,
  getActivePosts, getCommentsForPost, addComment, moderateComment, seedDemoPosts,
  type InstitutionalPost,
} from "@/lib/community-posts";
import { emitPostPublished } from "@/lib/community-timeline";
import {
  POST_CATEGORY_LABELS, VISIBILITY_LABELS, type PostCategory, type Visibility,
  type CommunityRole, type Comment, type PostOrigin,
} from "@/lib/community-types";
import { can, filterByVisibility, isAllDemoData } from "@/lib/community-permissions";
import EmptyState from "@/components/ui/EmptyState";

const CATEGORIES = Object.entries(POST_CATEGORY_LABELS) as [PostCategory, string][];
const VISIBILITIES = Object.entries(VISIBILITY_LABELS) as [Visibility, string][];

type FormState = Omit<InstitutionalPost, "id" | "createdAt" | "updatedAt">;
const EMPTY_FORM: FormState = {
  title: "", body: "", category: "aviso", origin: "oficial",
  visibility: "moradores", allowComments: false, pinned: false, archived: false,
  linkUrl: "",
};

const ORIGIN_BADGE: Record<PostOrigin, { label: string; style: string }> = {
  oficial:  { label: "Mural Oficial", style: "bg-navy-100 text-navy-600" },
  morador:  { label: "Participação",  style: "bg-sage-100 text-sage-700" },
  sistema:  { label: "Sistema",       style: "bg-navy-50 text-navy-400" },
};

const CAT_COLORS: Partial<Record<PostCategory, string>> = {
  urgencia:    "bg-red-100 text-red-700",
  assembleia:  "bg-navy-100 text-navy-700",
  obra:        "bg-amber-100 text-amber-700",
  seguranca:   "bg-orange-100 text-orange-700",
  manutencao:  "bg-blue-100 text-blue-700",
  prestacao_de_contas: "bg-green-100 text-green-700",
};
function catColor(cat: PostCategory) {
  return CAT_COLORS[cat] ?? "bg-navy-50 text-navy-500";
}

type Props = { role: CommunityRole; onSeed?: () => void };

export default function MuralPanel({ role, onSeed }: Props) {
  const [posts, setPosts] = useState<InstitutionalPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<PostCategory | "all">("all");
  const [viewOrigin, setViewOrigin] = useState<"all" | "oficial" | "morador">("all");

  const isManager = role === "manager";

  const load = () => {
    const raw = getActivePosts();
    const visible = filterByVisibility(raw, role);
    setPosts(visible);
  };

  useEffect(() => {
    if (isManager && getPosts().length === 0) { seedDemoPosts(); onSeed?.(); }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadComments = (postId: string) => {
    setPostComments((prev) => ({ ...prev, [postId]: getCommentsForPost(postId) }));
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    if (editId) {
      updatePost(editId, form);
    } else {
      const post = addPost(form);
      if (post.visibility !== "gestao") emitPostPublished(post.id, post.title, post.category, post.visibility);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load();
  };

  const handleEdit = (p: InstitutionalPost) => {
    setForm({ title: p.title, body: p.body, category: p.category, origin: p.origin ?? "oficial", visibility: p.visibility, allowComments: p.allowComments, pinned: p.pinned, archived: false, linkUrl: p.linkUrl ?? "" });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleCopy = (p: InstitutionalPost) => {
    const text = `*${p.title}*\n\n${p.body}\n\n_(Comunicado oficial — ${new Date(p.createdAt).toLocaleDateString("pt-BR")})_`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(p.id);
      setTimeout(() => setCopied(null), 2500);
    }).catch(() => {});
  };

  const handleAddComment = (postId: string) => {
    const body = commentInput[postId]?.trim();
    if (!body) return;
    addComment(postId, ROLE_LABELS[role], body, isManager);
    setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    loadComments(postId);
  };

  const originFiltered = viewOrigin === "oficial"
    ? posts.filter((p) => p.origin !== "morador")
    : viewOrigin === "morador"
      ? posts.filter((p) => p.origin === "morador")
      : posts;
  const filtered = filterCat === "all" ? originFiltered : originFiltered.filter((p) => p.category === filterCat);

  const residentPostCount = posts.filter((p) => p.origin === "morador").length;

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Mural Oficial</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              {isManager ? "Publique comunicados, obras e avisos de forma registrada." : "Comunicados e avisos publicados pela gestão."}
            </p>
          </div>
          {can(role, "canCreatePost") && (
            <button type="button" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              Publicar comunicado
            </button>
          )}
        </div>

        {/* Tabs de origem */}
        {(posts.length > 0 || residentPostCount > 0) && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex gap-1.5">
              {(["all", "oficial", "morador"] as const).map((o) => {
                const labels = { all: "Todos", oficial: "Mural Oficial", morador: "Participação" };
                const count = o === "all" ? posts.length : o === "oficial" ? posts.filter((p) => p.origin !== "morador").length : residentPostCount;
                return (
                  <button key={o} type="button" onClick={() => { setViewOrigin(o); setFilterCat("all"); }}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors flex-shrink-0 ${viewOrigin === o ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                    {labels[o]}{count > 0 ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtros por categoria */}
        {originFiltered.length > 3 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex flex-wrap gap-1.5 overflow-x-auto">
              <button type="button" onClick={() => setFilterCat("all")}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors flex-shrink-0 ${filterCat === "all" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                Todos ({originFiltered.length})
              </button>
              {CATEGORIES.filter(([cat]) => originFiltered.some((p) => p.category === cat)).map(([cat, label]) => (
                <button key={cat} type="button" onClick={() => setFilterCat(cat)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors flex-shrink-0 ${filterCat === cat ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      {showForm && isManager && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">{editId ? "Editar publicação" : "Nova publicação oficial"}</p>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Manutenção da bomba d'água — 15/06"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Texto *</label>
              <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Texto do comunicado..."
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Categoria</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as PostCategory })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Visibilidade</label>
                <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {VISIBILITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Origem</label>
              <select value={form.origin ?? "oficial"} onChange={(e) => setForm({ ...form, origin: e.target.value as PostOrigin })}
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                <option value="oficial">Mural Oficial (gestão)</option>
                <option value="morador">Participação (morador)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Link externo (opcional)</label>
              <input type="url" value={form.linkUrl ?? ""} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[11.5px] text-navy-600">
                <input type="checkbox" checked={form.allowComments} onChange={(e) => setForm({ ...form, allowComments: e.target.checked })}
                  className="h-3.5 w-3.5 accent-navy-700" />
                Permitir comentários
              </label>
              <label className="flex items-center gap-2 text-[11.5px] text-navy-600">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="h-3.5 w-3.5 accent-navy-700" />
                Fixar no topo
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                {editId ? "Salvar" : "Publicar"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {filtered.length === 0 && !showForm && (
        <EmptyState
          title={isManager ? "Nenhum comunicado publicado ainda" : "Nenhum comunicado disponível"}
          description={isManager
            ? "Use o Mural Oficial para manter moradores informados sem depender de grupos de mensagem."
            : "Quando a gestão publicar avisos, obras ou comunicados oficiais, eles aparecerão aqui."}
          actionLabel={can(role, "canCreatePost") ? "Publicar comunicado" : undefined}
          onAction={can(role, "canCreatePost") ? () => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); } : undefined}
        />
      )}

      {/* Aviso de dados demo */}
      {isManager && posts.length > 0 && isAllDemoData(posts) && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-2.5 flex items-start gap-2">
          <span className="text-[11px] text-amber-700 font-medium flex-shrink-0 mt-0.5">Demonstração</span>
          <p className="text-[11px] text-amber-600 leading-relaxed">
            Estes são avisos de exemplo. Crie seu primeiro aviso oficial para substituí-los.
          </p>
        </div>
      )}

      {/* Lista de posts */}
      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className={`overflow-hidden rounded-2xl border bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)] ${p.pinned ? "border-navy-200" : "border-navy-100/80"}`}>
            <button type="button" className="w-full px-5 py-3.5 text-left"
              onClick={() => {
                setExpandedId(expandedId === p.id ? null : p.id);
                if (expandedId !== p.id) loadComments(p.id);
              }}>
              <div className="flex items-start gap-2">
                {p.pinned && <span className="mt-0.5 text-[10px] text-navy-400 flex-shrink-0">📌</span>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-navy-800">{p.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium flex-shrink-0 ${catColor(p.category)}`}>
                      {POST_CATEGORY_LABELS[p.category]}
                    </span>
                    {p.origin && (
                      <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium flex-shrink-0 ${ORIGIN_BADGE[p.origin].style}`}>
                        {ORIGIN_BADGE[p.origin].label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-navy-400">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                    {isManager && ` · ${VISIBILITY_LABELS[p.visibility]}`}
                    {p.allowComments && " · comentários abertos"}
                  </p>
                </div>
                <svg className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${expandedId === p.id ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {expandedId === p.id && (
              <div className="border-t border-navy-50 px-5 pb-3.5 pt-2.5">
                <p className="text-[12.5px] text-navy-700 leading-relaxed whitespace-pre-wrap">{p.body}</p>
                {p.linkUrl && (
                  <a href={p.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-navy-500 underline underline-offset-2 hover:text-navy-700 break-all">
                    <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5L8.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {p.linkUrl}
                  </a>
                )}

                {/* Ações — só manager */}
                {isManager && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" onClick={() => handleCopy(p)}
                      className="text-[11px] text-navy-500 underline underline-offset-2 hover:text-navy-700">
                      {copied === p.id ? "Copiado!" : "Copiar para WhatsApp"}
                    </button>
                    <button type="button" onClick={() => handleEdit(p)}
                      className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">Editar</button>
                    <button type="button" onClick={() => { pinPost(p.id, !p.pinned); load(); }}
                      className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                      {p.pinned ? "Desafixar" : "Fixar"}
                    </button>
                    <button type="button" onClick={() => { archivePost(p.id); load(); }}
                      className="text-[11px] text-navy-300 underline underline-offset-2 hover:text-navy-500">Arquivar</button>
                  </div>
                )}

                {/* Comentários */}
                {p.allowComments && (
                  <div className="mt-3 border-t border-navy-50 pt-3">
                    <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400">Comentários</p>
                    {(postComments[p.id] ?? [])
                      .filter((c) => isManager || c.status === "publicado")
                      .map((c) => (
                        <div key={c.id} className={`mb-2 rounded-xl p-2.5 ${c.status === "oculto" || c.status === "removido" ? "bg-navy-50/50 opacity-60" : "bg-navy-50/80"}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-medium text-navy-700">{c.authorName}</p>
                            {isManager && c.status === "publicado" && (
                              <button type="button" onClick={() => { moderateComment(c.id, "oculto"); loadComments(p.id); }}
                                className="text-[10px] text-navy-400 hover:text-terracotta-600">Ocultar</button>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-navy-600">{c.body}</p>
                          {isManager && c.status !== "publicado" && (
                            <p className="mt-0.5 text-[10px] text-navy-400">[{c.status}]</p>
                          )}
                        </div>
                      ))}
                    {role !== "viewer" && (
                      <div className="mt-2 flex gap-2">
                        <input type="text"
                          value={commentInput[p.id] ?? ""}
                          onChange={(e) => setCommentInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(p.id)}
                          placeholder="Comentar..."
                          className="flex-1 rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                        <button type="button" onClick={() => handleAddComment(p.id)}
                          className="rounded-xl bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
                          Enviar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const ROLE_LABELS: Record<CommunityRole, string> = {
  manager: "Gestão", council: "Conselho", resident: "Morador", viewer: "Visitante",
};
