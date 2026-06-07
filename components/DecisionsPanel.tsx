"use client";

import { useState, useEffect } from "react";
import {
  getDecisions, addDecision, updateDecision, deleteDecision, buildDecisionsReport,
  DECISION_CATEGORY_LABELS, type Decision, type DecisionCategory, type DecisionRiskLevel,
} from "@/lib/decisions";

const CATEGORIES = Object.entries(DECISION_CATEGORY_LABELS) as [DecisionCategory, string][];
const RISK_LEVELS: [DecisionRiskLevel, string][] = [["baixo", "Baixo"], ["medio", "Médio"], ["alto", "Alto"]];

type FormState = Omit<Decision, "id" | "createdAt" | "updatedAt">;

const EMPTY: FormState = {
  title: "", date: new Date().toISOString().slice(0, 10),
  category: "outro", context: "", rationale: "", outcome: "",
  riskLevel: undefined, riskNotes: "", nextStep: "", linkedUnit: "",
  linkedDocumentId: undefined, linkedSupplierId: undefined, linkedPendenciaId: undefined,
};

export default function DecisionsPanel() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [filterCat, setFilterCat] = useState<DecisionCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setDecisions(getDecisions()); }, []);
  const refresh = () => setDecisions(getDecisions());

  const handleSubmit = () => {
    if (!form.title.trim() || !form.outcome.trim()) return;
    if (editId) {
      updateDecision(editId, form);
    } else {
      addDecision(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    refresh();
  };

  const handleEdit = (d: Decision) => {
    setForm({
      title: d.title, date: d.date, category: d.category,
      context: d.context, rationale: d.rationale, outcome: d.outcome,
      riskLevel: d.riskLevel, riskNotes: d.riskNotes ?? "", nextStep: d.nextStep ?? "",
      linkedUnit: d.linkedUnit ?? "",
      linkedDocumentId: undefined, linkedSupplierId: undefined, linkedPendenciaId: undefined,
    });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remover esta decisão?")) return;
    deleteDecision(id);
    refresh();
  };

  const handleCopy = () => {
    const report = buildDecisionsReport(decisions);
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const filtered = filterCat === "all"
    ? [...decisions].sort((a, b) => b.date.localeCompare(a.date))
    : decisions.filter((d) => d.category === filterCat).sort((a, b) => b.date.localeCompare(a.date));

  const riskColor: Record<DecisionRiskLevel, string> = {
    baixo: "text-green-600 bg-green-50",
    medio: "text-amber-600 bg-amber-50",
    alto:  "text-red-600 bg-red-50",
  };

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Memória institucional</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Registro de Decisões</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              Documente decisões relevantes com contexto e fundamento. Proteção jurídica e continuidade entre gestões.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3 mt-0.5">
            {decisions.length > 0 && (
              <button type="button" onClick={handleCopy}
                className="rounded-full border border-navy-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
                {copied ? "Copiado!" : "Exportar"}
              </button>
            )}
            <button type="button" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
              className="rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              + Nova
            </button>
          </div>
        </div>

        {decisions.length > 3 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setFilterCat("all")}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${filterCat === "all" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                Todas ({decisions.length})
              </button>
              {CATEGORIES.filter(([cat]) => decisions.some((d) => d.category === cat)).map(([cat, label]) => (
                <button key={cat} type="button" onClick={() => setFilterCat(cat)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${filterCat === cat ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3">
            <p className="text-[12.5px] font-semibold text-navy-800 mb-3">{editId ? "Editar decisão" : "Registrar decisão"}</p>
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Título da decisão *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Contratação de nova empresa de limpeza"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Data</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DecisionCategory })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                    {CATEGORIES.map(([cat, label]) => <option key={cat} value={cat}>{label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Contexto — o que motivou</label>
                <textarea rows={2} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })}
                  placeholder="Situação que exigiu a decisão..."
                  className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Fundamento — por que esta decisão</label>
                <textarea rows={2} value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                  placeholder="Justificativa, base legal ou convencional..."
                  className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Decisão tomada *</label>
                <textarea rows={2} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  placeholder="O que foi decidido, em termos claros..."
                  className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Nível de risco</label>
                  <select value={form.riskLevel ?? ""} onChange={(e) => setForm({ ...form, riskLevel: (e.target.value as DecisionRiskLevel) || undefined })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                    <option value="">— Sem risco mapeado</option>
                    {RISK_LEVELS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Unidade relacionada</label>
                  <input type="text" value={form.linkedUnit ?? ""} onChange={(e) => setForm({ ...form, linkedUnit: e.target.value })}
                    placeholder="Ex: 101, B-03"
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Próximo passo</label>
                <input type="text" value={form.nextStep ?? ""} onChange={(e) => setForm({ ...form, nextStep: e.target.value })}
                  placeholder="Ação a ser tomada após esta decisão..."
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                {editId ? "Salvar" : "Registrar"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-navy-600 mb-1">Nenhuma decisão registrada</p>
          <p className="text-[11.5px] text-navy-400">Registre decisões relevantes para construir um histórico de gestão auditável.</p>
        </div>
      )}

      {filtered.map((d) => (
        <div key={d.id} className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
          <button type="button" className="w-full px-5 py-3.5 text-left"
            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-navy-800">{d.title}</p>
                  {d.riskLevel && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${riskColor[d.riskLevel]}`}>
                      Risco {d.riskLevel}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-navy-400">
                  {d.date} · {DECISION_CATEGORY_LABELS[d.category]}
                  {d.linkedUnit && ` · Unidade ${d.linkedUnit}`}
                </p>
              </div>
              <svg className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${expandedId === d.id ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {expandedId === d.id && (
            <div className="border-t border-navy-50 px-5 pb-3.5 space-y-2.5 pt-2.5">
              {d.context && <div><p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-0.5">Contexto</p><p className="text-[12px] text-navy-700 leading-relaxed">{d.context}</p></div>}
              {d.rationale && <div><p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-0.5">Fundamento</p><p className="text-[12px] text-navy-700 leading-relaxed">{d.rationale}</p></div>}
              <div><p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-0.5">Decisão</p><p className="text-[12px] font-medium text-navy-800 leading-relaxed">{d.outcome}</p></div>
              {d.nextStep && <div><p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-0.5">Próximo passo</p><p className="text-[12px] text-navy-600">{d.nextStep}</p></div>}
              {d.riskNotes && <div><p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-0.5">Obs. de risco</p><p className="text-[11.5px] text-amber-700">{d.riskNotes}</p></div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => handleEdit(d)}
                  className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">Editar</button>
                <button type="button" onClick={() => handleDelete(d.id)}
                  className="text-[11px] text-terracotta-500 underline underline-offset-2 hover:text-terracotta-700">Remover</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
