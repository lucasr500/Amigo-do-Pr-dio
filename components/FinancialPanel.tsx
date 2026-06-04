"use client";

import { useEffect, useState } from "react";
import {
  addFinancialEntry,
  buildMonthlyFinancialExecutiveSummary,
  currentMonthKey,
  deleteFinancialEntry,
  getCurrentFinancialSnapshot,
  getFinancialSummary,
  isFinancialEntryOverdue,
  markFinancialEntryPaid,
  parseFinancialQuickText,
  reopenFinancialEntry,
  updateFinancialEntry,
  updateFinancialSnapshot,
  type FinancialEntry,
  type FinancialEntryType,
  type MonthlyFinancialSnapshot,
  type ParsedFinancialLine,
} from "@/lib/financial";
import EmptyState from "@/components/ui/EmptyState";
import ActionButton from "@/components/ui/ActionButton";

type Props = {
  onSaved?: () => void;
};

const ENTRY_LABEL: Record<FinancialEntryType, string> = {
  receita: "Receita",
  despesa: "Despesa",
  conta_a_pagar: "Conta a pagar",
  investimento: "Investimento",
};

const FILTERS = ["todos", "receitas", "despesas", "contas", "vencidas", "pagas", "investimentos"] as const;
type FinancialFilter = (typeof FILTERS)[number];

const FILTER_LABEL: Record<FinancialFilter, string> = {
  todos: "Todos",
  receitas: "Receitas",
  despesas: "Despesas",
  contas: "Contas",
  vencidas: "Vencidas",
  pagas: "Pagas",
  investimentos: "Reserva",
};

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinancialPanel({ onSaved }: Props) {
  const [month, setMonth] = useState(currentMonthKey());
  const [snapshot, setSnapshot] = useState<MonthlyFinancialSnapshot | null>(null);
  const [balance, setBalance] = useState("");
  const [delinquency, setDelinquency] = useState("");
  const [reserve, setReserve] = useState("");
  const [entryType, setEntryType] = useState<FinancialEntryType>("despesa");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDueDate, setEntryDueDate] = useState("");
  const [entryCategory, setEntryCategory] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FinancialFilter>("todos");
  const [quickText, setQuickText] = useState("");
  const [parsedLines, setParsedLines] = useState<ParsedFinancialLine[]>([]);
  const [summaryCopied, setSummaryCopied] = useState(false);

  function reload(targetMonth = month) {
    const current = getCurrentFinancialSnapshot(targetMonth);
    setSnapshot(current);
    setBalance(current.estimatedBalance ? String(current.estimatedBalance) : "");
    setDelinquency(current.delinquencyRate !== undefined ? String(current.delinquencyRate) : "");
    setReserve(current.liquidityReserve !== undefined ? String(current.liquidityReserve) : "");
  }

  useEffect(() => {
    const current = getCurrentFinancialSnapshot(month);
    setSnapshot(current);
    setBalance(current.estimatedBalance ? String(current.estimatedBalance) : "");
    setDelinquency(current.delinquencyRate !== undefined ? String(current.delinquencyRate) : "");
    setReserve(current.liquidityReserve !== undefined ? String(current.liquidityReserve) : "");
  }, [month]);

  const summary = getFinancialSummary(month);

  function saveSnapshotFields() {
    updateFinancialSnapshot(month, {
      estimatedBalance: Number(balance || 0),
      delinquencyRate: delinquency ? Number(delinquency) : undefined,
      liquidityReserve: reserve ? Number(reserve) : undefined,
    });
    reload();
    onSaved?.();
  }

  function clearEntryForm() {
    setEntryType("despesa");
    setEntryTitle("");
    setEntryAmount("");
    setEntryDueDate("");
    setEntryCategory("");
    setEditingEntryId(null);
  }

  function saveEntry() {
    const amount = Number(entryAmount.replace(",", "."));
    if (!entryTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const payload: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt"> = {
      type: entryType,
      title: entryTitle.trim(),
      amount,
      dueDate: entryDueDate || undefined,
      category: entryCategory.trim() || undefined,
      status: "previsto",
    };
    if (editingEntryId) {
      updateFinancialEntry(month, editingEntryId, payload);
    } else {
      addFinancialEntry(month, payload);
    }
    clearEntryForm();
    reload();
    onSaved?.();
  }

  function editEntry(entry: FinancialEntry) {
    setEditingEntryId(entry.id);
    setEntryType(entry.type);
    setEntryTitle(entry.title);
    setEntryAmount(String(entry.amount));
    setEntryDueDate(entry.dueDate ?? "");
    setEntryCategory(entry.category ?? "");
  }

  function confirmDeleteEntry(id: string) {
    deleteFinancialEntry(month, id);
    setConfirmDeleteId(null);
    if (editingEntryId === id) clearEntryForm();
    reload();
    onSaved?.();
  }

  function previewQuickText() {
    setParsedLines(parseFinancialQuickText(quickText));
  }

  function applyParsedLines() {
    if (parsedLines.length === 0) return;
    let patch: Parameters<typeof updateFinancialSnapshot>[1] = {};
    for (const line of parsedLines) {
      if (line.warning) continue;
      if (line.snapshotPatch) patch = { ...patch, ...line.snapshotPatch };
      if (line.entry) addFinancialEntry(month, line.entry);
    }
    if (Object.keys(patch).length > 0) updateFinancialSnapshot(month, patch);
    setQuickText("");
    setParsedLines([]);
    reload();
    onSaved?.();
  }

  async function copyMonthlySummary() {
    try {
      await navigator.clipboard.writeText(buildMonthlyFinancialExecutiveSummary(month));
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2200);
    } catch {
      setSummaryCopied(false);
    }
  }

  const entries = snapshot?.entries ?? [];
  const activeEntries = entries.filter((entry) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "receitas") return entry.type === "receita";
    if (activeFilter === "despesas") return entry.type === "despesa";
    if (activeFilter === "contas") return entry.type === "conta_a_pagar";
    if (activeFilter === "vencidas") return isFinancialEntryOverdue(entry);
    if (activeFilter === "pagas") return entry.status === "pago";
    if (activeFilter === "investimentos") return entry.type === "investimento";
    return true;
  });

  return (
    <section className="px-5 pb-3 pt-2 sm:px-6">
      <div className="rounded-[18px] border border-navy-100 bg-white px-4 py-4 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-300">
              Financeiro local
            </p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">
              Resumo financeiro do mês
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-navy-400">
              Visão operacional simples. Os dados ficam neste dispositivo e entram no backup JSON.
            </p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonthKey())}
            className="max-w-[132px] rounded-xl border border-navy-100 bg-cream-50/50 px-2.5 py-2 text-[12px] text-navy-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Saldo", formatMoney(summary.estimatedBalance)],
            ["Receitas", formatMoney(summary.totalReceitas)],
            ["Despesas", formatMoney(summary.totalDespesas)],
            ["Inadimplência", summary.delinquencyRate !== undefined ? `${summary.delinquencyRate}%` : "Não informada"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-navy-50/60 px-3 py-2.5">
              <p className="text-[10.5px] font-medium text-navy-400">{label}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-navy-800">{value}</p>
            </div>
          ))}
        </div>

        {summary.alerts.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {summary.alerts.map((alert) => (
              <div key={alert.id} className="rounded-[12px] border border-terracotta-200 bg-terracotta-50/60 px-3 py-2">
                <p className="text-[12px] font-semibold text-terracotta-800">{alert.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-terracotta-700">{alert.reason} {alert.impact}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 rounded-[14px] border border-navy-100 bg-cream-50/40 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-semibold text-navy-800">Visão executiva mensal</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-navy-400">
                Resumo copiável para revisão interna com conselho, administradora ou pasta do mês.
              </p>
            </div>
            <button
              type="button"
              onClick={copyMonthlySummary}
              className="shrink-0 rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] font-medium text-navy-600 hover:bg-navy-50"
            >
              {summaryCopied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-[11.5px] font-medium text-navy-500">Saldo estimado</span>
            <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" className="w-full rounded-xl border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800" />
          </label>
          <label className="space-y-1">
            <span className="text-[11.5px] font-medium text-navy-500">Inadimplência (%)</span>
            <input value={delinquency} onChange={(e) => setDelinquency(e.target.value)} inputMode="decimal" className="w-full rounded-xl border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800" />
          </label>
          <label className="space-y-1">
            <span className="text-[11.5px] font-medium text-navy-500">Reserva com liquidez</span>
            <input value={reserve} onChange={(e) => setReserve(e.target.value)} inputMode="decimal" className="w-full rounded-xl border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800" />
          </label>
        </div>
        <ActionButton onClick={saveSnapshotFields} className="mt-3">
          Atualizar resumo
        </ActionButton>

        <div className="mt-5 rounded-[14px] border border-navy-100 bg-navy-50/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-navy-800">
              {editingEntryId ? "Editar lançamento" : "Novo lançamento"}
            </p>
            {editingEntryId && (
              <button type="button" onClick={clearEntryForm} className="text-[11px] font-medium text-navy-400 hover:text-navy-600">
                Cancelar edição
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            <select value={entryType} onChange={(e) => setEntryType(e.target.value as FinancialEntryType)} className="rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700">
              {Object.entries(ENTRY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} placeholder="Título" className="rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700 sm:col-span-2" />
            <input value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} inputMode="decimal" placeholder="Valor" className="rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700" />
            <input type="date" value={entryDueDate} onChange={(e) => setEntryDueDate(e.target.value)} className="rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700" />
            <input value={entryCategory} onChange={(e) => setEntryCategory(e.target.value)} placeholder="Categoria" className="rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700 sm:col-span-4" />
            <button type="button" onClick={saveEntry} className="rounded-xl bg-navy-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-navy-800">
              {editingEntryId ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[14px] border border-navy-100 bg-white p-3">
          <p className="text-[12.5px] font-semibold text-navy-800">Entrada rápida por texto colado</p>
          <textarea
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="Ex: saldo 42000; limpeza 1200; elevador 980; água 740 vence 10/06; inadimplência 8%; investido 30000 liquidez diária"
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-navy-100 bg-cream-50/30 px-3 py-2 text-[12.5px] text-navy-800 placeholder:text-navy-300"
          />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={previewQuickText} className="rounded-full border border-navy-100 px-3 py-1.5 text-[11.5px] font-medium text-navy-600 hover:bg-navy-50">
              Revisar
            </button>
            {parsedLines.length > 0 && (
              <button type="button" onClick={applyParsedLines} className="rounded-full bg-navy-700 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-navy-800">
                Salvar itens compreendidos
              </button>
            )}
          </div>
          {parsedLines.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {parsedLines.map((line) => (
                <div key={line.raw} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${line.warning ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-800"}`}>
                  {line.warning ? line.warning : `Pronto para salvar: ${line.entry?.title ?? "campo do resumo"}`}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] font-semibold text-navy-800">Lançamentos do mês</p>
            <span className="text-[10.5px] text-navy-400">controle auxiliar</span>
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-navy-700 text-white"
                    : "border border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
                }`}
              >
                {FILTER_LABEL[filter]}
              </button>
            ))}
          </div>
          {activeEntries.length === 0 ? (
            <EmptyState
              title={entries.length === 0 ? "Nenhum lançamento financeiro." : "Nenhum item neste filtro."}
              description={entries.length === 0 ? "Comece pelo saldo estimado ou cole um resumo simples do mês." : "Troque o filtro ou registre um novo lançamento para acompanhar este mês."}
              actionLabel={entries.length === 0 ? "Preencher primeiro lançamento" : undefined}
              onAction={entries.length === 0 ? () => setEntryTitle("Cota condominial") : undefined}
            />
          ) : (
            activeEntries.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className={`rounded-[12px] border px-3 py-2 ${
                  isFinancialEntryOverdue(entry)
                    ? "border-terracotta-200 bg-terracotta-50/40"
                    : entry.status === "pago"
                      ? "border-teal-100 bg-teal-50/30"
                      : "border-navy-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-navy-800">{entry.title}</p>
                  <p className="text-[10.5px] text-navy-400">
                    {ENTRY_LABEL[entry.type]} · {entry.category ?? "Sem categoria"}{entry.dueDate ? ` · vence ${entry.dueDate}` : ""}
                  </p>
                  {isFinancialEntryOverdue(entry) && (
                    <p className="mt-0.5 text-[10.5px] font-medium text-terracotta-700">Conta vencida. Revise pagamento ou negociação.</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-semibold text-navy-800">{formatMoney(entry.amount)}</p>
                  {entry.status === "pago" && <p className="text-[10.5px] text-teal-700">Paga</p>}
                </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-navy-50 pt-2">
                  {entry.type === "conta_a_pagar" && entry.status !== "pago" && (
                    <button type="button" onClick={() => { markFinancialEntryPaid(month, entry.id); reload(); onSaved?.(); }} className="text-[11px] font-medium text-teal-700 hover:text-teal-800">
                      Marcar paga
                    </button>
                  )}
                  {entry.type === "conta_a_pagar" && entry.status === "pago" && (
                    <button type="button" onClick={() => { reopenFinancialEntry(month, entry.id); reload(); onSaved?.(); }} className="text-[11px] font-medium text-navy-500 hover:text-navy-700">
                      Reabrir
                    </button>
                  )}
                  <button type="button" onClick={() => editEntry(entry)} className="text-[11px] font-medium text-navy-500 hover:text-navy-700">
                    Editar
                  </button>
                  {confirmDeleteId === entry.id ? (
                    <>
                      <span className="text-[11px] text-navy-400">Excluir?</span>
                      <button type="button" onClick={() => confirmDeleteEntry(entry.id)} className="text-[11px] font-semibold text-terracotta-700 hover:text-terracotta-800">
                        Confirmar
                      </button>
                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-[11px] text-navy-400 hover:text-navy-600">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmDeleteId(entry.id)} className="text-[11px] text-navy-400 hover:text-terracotta-600">
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
