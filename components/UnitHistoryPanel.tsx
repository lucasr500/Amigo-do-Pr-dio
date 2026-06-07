"use client";

import { useState, useEffect } from "react";
import {
  getUnitEvents, addUnitEvent, updateUnitEvent, deleteUnitEvent, getAllUnits,
  getUnitHistory, getUnitsSummary, buildUnitReport, UNIT_EVENT_TYPE_LABELS,
  type UnitEvent, type UnitEventType, type UnitEventStatus,
} from "@/lib/unit-history";

const EVENT_TYPES = Object.entries(UNIT_EVENT_TYPE_LABELS) as [UnitEventType, string][];

type FormState = Omit<UnitEvent, "id" | "createdAt">;

const EMPTY: FormState = {
  unit: "", type: "ocorrencia", date: new Date().toISOString().slice(0, 10),
  title: "", description: "", status: "aberto",
  resolvedAt: "", responsavel: "", amount: undefined,
  linkedOcorrenciaId: undefined, linkedDecisionId: undefined, linkedComunicadoText: undefined,
};

export default function UnitHistoryPanel() {
  const [view, setView] = useState<"units" | "unit">("units");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [summaries, setSummaries] = useState<ReturnType<typeof getUnitsSummary>>([]);
  const [unitEvents, setUnitEvents] = useState<UnitEvent[]>([]);
  const [allUnits, setAllUnits] = useState<string[]>([]);

  useEffect(() => {
    setSummaries(getUnitsSummary());
    setAllUnits(getAllUnits());
  }, []);

  const refreshAll = () => {
    setSummaries(getUnitsSummary());
    setAllUnits(getAllUnits());
    if (selectedUnit) setUnitEvents(getUnitHistory(selectedUnit));
  };

  const openUnit = (unit: string) => {
    setSelectedUnit(unit);
    setUnitEvents(getUnitHistory(unit));
    setView("unit");
  };

  const handleSubmit = () => {
    if (!form.unit.trim() || !form.title.trim()) return;
    if (editId) {
      updateUnitEvent(editId, form);
    } else {
      addUnitEvent(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    refreshAll();
  };

  const handleEdit = (e: UnitEvent) => {
    setForm({
      unit: e.unit, type: e.type, date: e.date, title: e.title, description: e.description,
      status: e.status, resolvedAt: e.resolvedAt ?? "", responsavel: e.responsavel ?? "",
      amount: e.amount, linkedOcorrenciaId: undefined, linkedDecisionId: undefined, linkedComunicadoText: undefined,
    });
    setEditId(e.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remover este registro?")) return;
    deleteUnitEvent(id);
    refreshAll();
  };

  const handleMarkResolved = (event: UnitEvent) => {
    updateUnitEvent(event.id, { status: "resolvido", resolvedAt: new Date().toISOString().slice(0, 10) });
    refreshAll();
  };

  const handleCopyReport = () => {
    const events = selectedUnit ? getUnitHistory(selectedUnit) : getUnitEvents();
    const report = buildUnitReport(selectedUnit || "Todas as unidades", events);
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const statusColors: Record<UnitEventStatus, string> = {
    aberto: "bg-amber-50 text-amber-700",
    resolvido: "bg-green-50 text-green-700",
    informativo: "bg-navy-50 text-navy-500",
  };

  const highRiskTypes: UnitEventType[] = ["multa", "inadimplencia", "advertencia"];

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div className="flex-1">
            {view === "unit" && (
              <button type="button" onClick={() => { setView("units"); setSelectedUnit(""); }}
                className="mb-1 flex items-center gap-1 text-[11px] text-navy-400 hover:text-navy-600">
                <svg className="h-3 w-3" viewBox="0 0 10 10" fill="none"><path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Todas as unidades
              </button>
            )}
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Memória institucional</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">
              {view === "unit" ? `Unidade ${selectedUnit}` : "Histórico por Unidade"}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              {view === "unit"
                ? "Linha do tempo de eventos desta unidade."
                : "Registros organizados por apartamento. Memória que acompanha o prédio, não o síndico."}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3 mt-0.5">
            {(allUnits.length > 0 || view === "unit") && (
              <button type="button" onClick={handleCopyReport}
                className="rounded-full border border-navy-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
                {copied ? "Copiado!" : "Exportar"}
              </button>
            )}
            <button type="button"
              onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY, unit: selectedUnit }); }}
              className="rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              + Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3">
            <p className="text-[12.5px] font-semibold text-navy-800 mb-3">{editId ? "Editar registro" : "Novo registro de unidade"}</p>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Unidade *</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="Ex: 101, B-02"
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as UnitEventType })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                    {EVENT_TYPES.map(([t, l]) => <option key={t} value={t}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Resumo do evento..."
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Descrição</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Data</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as UnitEventStatus })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                    <option value="aberto">Aberto</option>
                    <option value="resolvido">Resolvido</option>
                    <option value="informativo">Informativo</option>
                  </select>
                </div>
              </div>
              {(form.type === "multa" || form.type === "inadimplencia") && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Valor (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.amount ?? ""}
                    onChange={(e) => setForm({ ...form, amount: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Responsável</label>
                <input type="text" value={form.responsavel ?? ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                {editId ? "Salvar" : "Registrar"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Vista: todas as unidades */}
      {view === "units" && (
        <>
          {summaries.length === 0 && !showForm && (
            <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
              <p className="text-[13px] font-medium text-navy-600 mb-1">Nenhum registro por unidade</p>
              <p className="text-[11.5px] text-navy-400">Registre ocorrências, multas e comunicados vinculados a unidades específicas.</p>
            </div>
          )}
          <div className="space-y-2">
            {summaries.map((s) => (
              <button key={s.unit} type="button" onClick={() => openUnit(s.unit)}
                className="w-full overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 px-5 py-3 text-left shadow-[0_1px_3px_rgba(31,49,71,0.04)] transition-colors hover:bg-navy-50/40 active:bg-navy-50/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-navy-800">Unidade {s.unit}</p>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      {s.totalEvents} registro{s.totalEvents !== 1 ? "s" : ""}
                      {s.openEvents > 0 && ` · ${s.openEvents} aberto${s.openEvents !== 1 ? "s" : ""}`}
                      {s.hasMulta && " · tem multa"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.openEvents > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {s.openEvents} aberto{s.openEvents !== 1 ? "s" : ""}
                      </span>
                    )}
                    <svg className="h-4 w-4 text-navy-300" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Vista: eventos de uma unidade */}
      {view === "unit" && (
        <>
          {unitEvents.length === 0 && !showForm && (
            <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-6 text-center">
              <p className="text-[12.5px] font-medium text-navy-600 mb-1">Nenhum registro para unidade {selectedUnit}</p>
              <p className="text-[11.5px] text-navy-400">Clique em "+ Registrar" para adicionar o primeiro evento.</p>
            </div>
          )}
          <div className="space-y-2">
            {unitEvents.map((e) => (
              <div key={e.id} className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
                <div className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-[12.5px] font-medium ${highRiskTypes.includes(e.type) ? "text-terracotta-700" : "text-navy-800"}`}>
                          {e.title}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[e.status]}`}>
                          {e.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-navy-400">
                        {e.date} · {UNIT_EVENT_TYPE_LABELS[e.type]}
                        {e.amount !== undefined && ` · R$ ${e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        {e.responsavel && ` · ${e.responsavel}`}
                      </p>
                      {e.description && <p className="mt-1.5 text-[11.5px] text-navy-600 leading-relaxed">{e.description}</p>}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-3">
                    {e.status === "aberto" && (
                      <button type="button" onClick={() => handleMarkResolved(e)}
                        className="text-[11px] text-green-600 underline underline-offset-2 hover:text-green-700">
                        Marcar resolvido
                      </button>
                    )}
                    <button type="button" onClick={() => handleEdit(e)}
                      className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">Editar</button>
                    <button type="button" onClick={() => handleDelete(e.id)}
                      className="text-[11px] text-terracotta-500 underline underline-offset-2 hover:text-terracotta-700">Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
