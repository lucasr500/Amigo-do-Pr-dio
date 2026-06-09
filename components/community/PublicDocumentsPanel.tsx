"use client";

import { useState, useEffect } from "react";
import {
  getPublicDocuments, addPublicDocument, updatePublicDocument, removePublicDocument,
  type PublicDocument,
} from "@/lib/community-documents";
import { emitDocumentPublished } from "@/lib/community-timeline";
import {
  PUBLIC_DOC_CATEGORY_LABELS, VISIBILITY_LABELS,
  type PublicDocumentCategory, type Visibility, type CommunityRole,
} from "@/lib/community-types";
import { can, filterByVisibility } from "@/lib/community-permissions";
import { formatDateSafe } from "@/lib/date-format";
import EmptyState from "@/components/ui/EmptyState";

const CATEGORIES = Object.entries(PUBLIC_DOC_CATEGORY_LABELS) as [PublicDocumentCategory, string][];
const VISIBILITIES = Object.entries(VISIBILITY_LABELS) as [Visibility, string][];

type FormState = Omit<PublicDocument, "id" | "createdAt" | "updatedAt">;
const EMPTY_FORM: FormState = {
  title: "", category: "outro", description: "", visibility: "moradores",
  url: "", version: "", validUntil: "", publishedAt: new Date().toISOString().slice(0, 10),
};

type Props = { role: CommunityRole };

export default function PublicDocumentsPanel({ role }: Props) {
  const [docs, setDocs] = useState<PublicDocument[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<PublicDocumentCategory | "all">("all");

  const isManager = role === "manager";

  const load = () => {
    const all = getPublicDocuments().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    setDocs(filterByVisibility(all, role));
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editId) {
      updatePublicDocument(editId, form);
    } else {
      const doc = addPublicDocument(form);
      emitDocumentPublished(doc.id, doc.title, doc.visibility);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    load();
  };

  const handleEdit = (d: PublicDocument) => {
    setForm({
      title: d.title, category: d.category, description: d.description ?? "",
      visibility: d.visibility, url: d.url ?? "", version: d.version ?? "",
      validUntil: d.validUntil ?? "", publishedAt: d.publishedAt,
      linkedInternalDocId: d.linkedInternalDocId,
    });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleRemove = (id: string) => {
    if (!confirm("Remover documento?")) return;
    removePublicDocument(id);
    load();
  };

  const filtered = filterCat === "all" ? docs : docs.filter((d) => d.category === filterCat);
  const usedCats = CATEGORIES.filter(([cat]) => docs.some((d) => d.category === cat));

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Biblioteca do Condomínio</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              {isManager ? "Publique documentos para moradores e conselho. Controle o que cada perfil acessa." : "Documentos publicados pela gestão do condomínio."}
            </p>
          </div>
          {can(role, "canPublishDocument") && (
            <button type="button" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              Adicionar documento
            </button>
          )}
        </div>

        {/* Filtros */}
        {docs.length > 3 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setFilterCat("all")}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${filterCat === "all" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                Todos ({docs.length})
              </button>
              {usedCats.map(([cat, label]) => (
                <button key={cat} type="button" onClick={() => setFilterCat(cat)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${filterCat === cat ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      {showForm && isManager && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">{editId ? "Editar documento" : "Publicar documento"}</p>
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              ⚠ Documentos internos sensíveis (financeiro detalhado, dados pessoais) não devem ser publicados aqui. Escolha a visibilidade com cuidado.
            </p>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Categoria</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as PublicDocumentCategory })}
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
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Descrição</label>
              <textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Versão / Revisão</label>
                <input type="text" value={form.version ?? ""} onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="Ex: v3 (2023)"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Válido até</label>
                <input type="date" value={form.validUntil ?? ""} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Link / URL (opcional)</label>
              <input type="url" value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="flex gap-2">
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
          title="Nenhum documento público"
          description={isManager
            ? "Publique regimento, atas, comunicados e arquivos importantes para consulta dos moradores."
            : "Quando a gestão publicar atas, regras ou documentos do prédio, eles aparecerão aqui."}
          actionLabel={can(role, "canPublishDocument") ? "Adicionar documento" : undefined}
          onAction={can(role, "canPublishDocument") ? () => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); } : undefined}
        />
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((d) => {
          const isExpired = d.validUntil && d.validUntil < new Date().toISOString().slice(0, 10);
          return (
            <div key={d.id} className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
              <div className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-navy-800">{d.title}</p>
                      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[9.5px] font-medium text-navy-500">
                        {PUBLIC_DOC_CATEGORY_LABELS[d.category]}
                      </span>
                      {isExpired && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9.5px] font-medium text-red-600">Vencido</span>}
                    </div>
                    {d.description && <p className="mt-0.5 text-[11.5px] text-navy-500 leading-relaxed">{d.description}</p>}
                    <p className="mt-0.5 text-[10.5px] text-navy-400">
                      Publicado em {formatDateSafe(d.publishedAt, undefined, "Data não informada")}
                      {d.version && ` · ${d.version}`}
                      {d.validUntil && ` · Válido até ${formatDateSafe(d.validUntil, undefined, "data não informada")}`}
                      {isManager && ` · ${VISIBILITY_LABELS[d.visibility]}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="rounded-xl bg-navy-800 px-3 py-1.5 text-[10.5px] font-medium text-white hover:bg-navy-700 text-center">
                        Abrir
                      </a>
                    )}
                    {isManager && (
                      <>
                        <button type="button" onClick={() => handleEdit(d)}
                          className="rounded-xl border border-navy-100 px-3 py-1.5 text-[10.5px] text-navy-600 hover:bg-navy-50">
                          Editar
                        </button>
                        <button type="button" onClick={() => handleRemove(d.id)}
                          className="text-[10.5px] text-navy-300 hover:text-terracotta-600 text-center">
                          Remover
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
