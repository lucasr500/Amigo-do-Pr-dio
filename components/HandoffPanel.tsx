"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getHandoffState, saveHandoffState, updateHandoffItem, getHandoffProgress,
  initHandoff, buildHandoffReport, type HandoffState, type HandoffChecklistItem, type HandoffItemStatus,
} from "@/lib/handoff";
import {
  getProfile, getMemoriaOperacional, getPendencias, getManutencoes, getFuncionarios,
} from "@/lib/session";

type CatKey = HandoffChecklistItem["categoria"];

const CAT_LABELS: Record<CatKey, string> = {
  documentos: "Documentos",
  financeiro:  "Financeiro",
  operacao:    "Operação",
  pessoas:     "Pessoas",
  juridico:    "Jurídico",
  dados:       "Dados e sistemas",
};

const CAT_ORDER: CatKey[] = ["documentos", "financeiro", "operacao", "pessoas", "juridico", "dados"];

export default function HandoffPanel() {
  const [state, setState] = useState<HandoffState | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CatKey>("documentos");

  useEffect(() => {
    initHandoff();
    setState(getHandoffState());
  }, []);

  const refresh = useCallback(() => setState(getHandoffState()), []);

  const handleItemToggle = (id: string, current: HandoffItemStatus) => {
    const next: HandoffItemStatus = current === "pendente" ? "ok" : current === "ok" ? "nao_aplicavel" : "pendente";
    updateHandoffItem(id, next);
    refresh();
  };

  const handleFieldChange = (field: keyof Pick<HandoffState, "successorName" | "successorContact" | "handoffDate" | "notes">, value: string) => {
    if (!state) return;
    const next = { ...state, [field]: value };
    saveHandoffState(next);
    setState(next);
  };

  const handleCopyReport = () => {
    if (!state) return;
    const profile = getProfile();
    const memoria = getMemoriaOperacional();
    const pendencias = getPendencias();
    const manutencoes = getManutencoes();
    const funcionarios = getFuncionarios();
    const report = buildHandoffReport(state, profile, memoria, pendencias, manutencoes, funcionarios);
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});
  };

  if (!state) return null;

  const { done, total, pct } = getHandoffProgress();
  const items = state.items;
  const catItems = items.filter((i) => i.categoria === activeCategory);

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Transição de gestão</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Passagem de gestão</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
            Prepare a entrega do condomínio ao próximo síndico. Uma passagem bem feita protege você e garante continuidade.
          </p>
        </div>

        {/* Progresso */}
        <div className="border-t border-navy-50 px-5 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-medium text-navy-700">{done} de {total} itens concluídos</span>
            <span className={`text-[11.5px] font-semibold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-navy-500"}`}>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-navy-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-navy-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dados do sucessor */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400 mb-2.5">Dados da transição</p>
          <div className="space-y-2.5">
            {([
              ["successorName", "Nome do novo síndico", "text"],
              ["successorContact", "Contato (telefone/e-mail)", "text"],
              ["handoffDate", "Data prevista da entrega", "date"],
            ] as [keyof HandoffState, string, string][]).map(([field, label, type]) => (
              <div key={field}>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">{label}</label>
                <input
                  type={type}
                  value={(state[field] as string | undefined) ?? ""}
                  onChange={(e) => handleFieldChange(field as "successorName" | "successorContact" | "handoffDate", e.target.value)}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Observações gerais</label>
              <textarea
                rows={3}
                value={state.notes ?? ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                placeholder="Instruções especiais, avisos importantes para o próximo síndico..."
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist por categoria */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400 mb-2.5">Checklist de entrega</p>
          {/* Tabs de categoria */}
          <div className="flex flex-wrap gap-1.5">
            {CAT_ORDER.map((cat) => {
              const catItems2 = items.filter((i) => i.categoria === cat);
              const catDone = catItems2.filter((i) => i.status !== "pendente").length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-navy-800 text-white"
                      : "bg-navy-50 text-navy-500 hover:bg-navy-100"
                  }`}
                >
                  {CAT_LABELS[cat]} {catDone}/{catItems2.length}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-navy-50 divide-y divide-navy-50">
          {catItems.map((item) => (
            <div key={item.id} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleItemToggle(item.id, item.status)}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    item.status === "ok"
                      ? "border-green-500 bg-green-500"
                      : item.status === "nao_aplicavel"
                      ? "border-navy-300 bg-navy-100"
                      : "border-navy-200 bg-white"
                  }`}
                  aria-label={`Marcar "${item.titulo}" como ${item.status === "pendente" ? "concluído" : "pendente"}`}
                >
                  {item.status === "ok" && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.status === "nao_aplicavel" && (
                    <svg className="h-2.5 w-2.5 text-navy-400" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-medium ${item.status === "ok" ? "text-navy-400 line-through" : "text-navy-800"}`}>
                    {item.titulo}
                  </p>
                  <p className="mt-0.5 text-[11px] text-navy-400 leading-relaxed">{item.descricao}</p>
                  {item.status === "ok" && item.completedAt && (
                    <p className="mt-0.5 text-[10.5px] text-green-600">
                      Concluído em {new Date(item.completedAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="border-t border-navy-50 px-5 py-2.5">
          <p className="text-[10.5px] text-navy-400">
            Toque para alternar: ○ Pendente → ✓ Concluído → – Não aplicável
          </p>
        </div>
      </div>

      {/* Gerar relatório */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 py-3.5">
          <p className="text-[12.5px] font-semibold text-navy-800 mb-1">Pacote de transição</p>
          <p className="text-[11.5px] text-navy-500 mb-3">
            Gera um relatório completo com checklist, dados operacionais e observações para entregar ao próximo síndico.
          </p>
          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2 text-[12px] font-medium text-white transition-all hover:bg-navy-700 active:scale-[0.97]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 4V3a1 1 0 011-1h7a1 1 0 011 1v9a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {copied ? "Copiado!" : "Copiar pacote de transição"}
          </button>
        </div>
      </div>
    </section>
  );
}
