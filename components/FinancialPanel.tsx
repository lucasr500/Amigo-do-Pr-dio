"use client";

import { useEffect, useState } from "react";
import {
  addFinancialEntry,
  buildFinancialExecutiveInsight,
  buildFinancialCouncilMessage,
  buildPendenciaPayloadFromEntry,
  buildAgendaPayloadFromEntry,
  currentMonthKey,
  deleteFinancialEntry,
  getCurrentFinancialSnapshot,
  getFinancialSummary,
  getMonthOverMonthComparison,
  getUpcomingBillsByWindow,
  isFinancialEntryOverdue,
  markFinancialEntryPaid,
  parseFinancialQuickText,
  reopenFinancialEntry,
  updateFinancialEntry,
  updateFinancialSnapshot,
  FINANCIAL_CATEGORIES,
  type FinancialEntry,
  type FinancialEntryType,
  type MonthlyFinancialSnapshot,
  type ParsedFinancialLine,
} from "@/lib/financial";
import { addPendencia, getPendencias } from "@/lib/session-pendencias";
import { addAgendaEvent, getAgendaEvents } from "@/lib/session-agenda";
import EmptyState from "@/components/ui/EmptyState";
import ActionButton from "@/components/ui/ActionButton";
import AlertBox from "@/components/ui/AlertBox";
import FormField from "@/components/ui/FormField";
import FinancialExecutiveCards from "@/components/financial/FinancialExecutiveCards";
import FinancialFilters from "@/components/financial/FinancialFilters";
import { ENTRY_LABEL, type FinancialFilter, formatMoneyCompact } from "@/components/financial/financial-ui";

type Props = {
  onSaved?: () => void;
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
  const [showForm, setShowForm] = useState(false);
  const [showQuickText, setShowQuickText] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  function reload(targetMonth = month) {
    const current = getCurrentFinancialSnapshot(targetMonth);
    setSnapshot(current);
    setBalance(current.estimatedBalance ? String(current.estimatedBalance) : "");
    setDelinquency(current.delinquencyRate !== undefined ? String(current.delinquencyRate) : "");
    setReserve(current.liquidityReserve !== undefined ? String(current.liquidityReserve) : "");
  }

  useEffect(() => {
    reload(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const summary  = getFinancialSummary(month);
  const insight  = buildFinancialExecutiveInsight(month);
  const mom      = getMonthOverMonthComparison(month);
  const windows  = snapshot ? getUpcomingBillsByWindow(snapshot) : { next3Days: [], next7Days: [], next15Days: [] };
  const risk     = summary.cashRiskAnalysis;

  const resultado = summary.totalReceitas - summary.totalDespesas;
  const totalUpcoming = windows.next3Days.length + windows.next7Days.length + windows.next15Days.length;

  function flash(msg: string) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  }

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
    setShowForm(false);
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
    setShowForm(true);
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
    setShowQuickText(false);
    reload();
    onSaved?.();
  }

  async function copyMonthlySummary() {
    try {
      await navigator.clipboard.writeText(buildFinancialCouncilMessage(month));
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2200);
    } catch {
      setSummaryCopied(false);
    }
  }

  function createPendenciaFromEntry(entry: FinancialEntry) {
    const existing = getPendencias().find(
      (p) => p.linkedType === "financeiro" && p.linkedId === entry.id && p.status === "aberta"
    );
    if (existing) {
      flash("Pendência já existe para esta conta.");
      return;
    }
    const payload = buildPendenciaPayloadFromEntry(entry);
    addPendencia({
      titulo: payload.titulo,
      descricao: payload.descricao,
      categoria: payload.categoria,
      origem: payload.origem,
      prioridade: payload.prioridade,
      dueDate: payload.dueDate,
      linkedType: payload.linkedType,
      linkedId: payload.linkedId,
    });
    flash("Pendência criada.");
    onSaved?.();
  }

  function createAgendaFromEntry(entry: FinancialEntry) {
    const existing = getAgendaEvents().find(
      (e) => e.note?.includes(entry.id) && !e.completedAt
    );
    if (existing) {
      flash("Evento de agenda já existe para esta conta.");
      return;
    }
    const payload = buildAgendaPayloadFromEntry(entry);
    addAgendaEvent({
      title: payload.title,
      date: payload.date,
      type: payload.type,
      note: `${payload.note} [id:${entry.id}]`,
      prioridade: payload.prioridade,
      recurrence: "nenhuma",
      source: "manual",
      updatedAt: new Date().toISOString(),
    });
    flash("Evento criado na agenda.");
    onSaved?.();
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

  const hasData = entries.length > 0 || summary.estimatedBalance !== 0;

  return (
    <section className="px-5 pb-3 pt-2 sm:px-6">
      <div className="rounded-lg border border-navy-100/80 bg-white/[0.88] shadow-card">

        {/* ── Cabeçalho ── */}
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-300">
              Financeiro
            </p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">
              {insight.subtitle}
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-navy-400">
              Saúde financeira · dados neste dispositivo
            </p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonthKey())}
            className="max-w-[132px] rounded-lg border border-navy-100 bg-cream-50/50 px-2.5 py-2 text-[12px] text-navy-700 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
          />
        </div>

        <FinancialExecutiveCards
          estimatedBalance={summary.estimatedBalance}
          next3DaysCount={windows.next3Days.length}
          resultado={resultado}
          riskLevel={risk.level}
          totalUpcoming={totalUpcoming}
        />

        {/* ── Frase de insight + ação ── */}
        {hasData && insight.nextAction && (
          <div className="mx-4 mt-3 rounded-lg border border-navy-100/70 bg-navy-50/45 px-3 py-2.5">
            <p className="text-[11.5px] leading-relaxed text-navy-600">
              {insight.nextAction}
            </p>
          </div>
        )}

        {/* ── Alertas ── */}
        {summary.alerts.length > 0 && (
          <div className="mt-3 space-y-1.5 px-4">
            {summary.alerts.map((alert) => (
              <AlertBox
                key={alert.id}
                tone={alert.severity === "critical" ? "danger" : "warning"}
                title={alert.title}
                description={alert.reason}
              />
            ))}
          </div>
        )}

        {/* ── Comparação MoM ── */}
        {mom.hasPreviousMonth && (
          <div className="mx-4 mt-3 rounded-lg border border-navy-100 bg-white/[0.78] px-3 py-2.5">
            <p className="text-[11.5px] font-semibold text-navy-700">
              vs. {mom.previousMonth}
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              <div>
                <p className="text-[10px] text-navy-400">Receitas</p>
                <p className={`text-[11.5px] font-medium ${mom.direction.revenue === "up" ? "text-sage-700" : mom.direction.revenue === "down" ? "text-terracotta-700" : "text-navy-600"}`}>
                  {mom.revenueDelta >= 0 ? "+" : ""}{formatMoneyCompact(mom.revenueDelta)}
                  {mom.revenueDeltaPct !== undefined && ` (${mom.revenueDeltaPct >= 0 ? "+" : ""}${mom.revenueDeltaPct}%)`}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-navy-400">Despesas</p>
                <p className={`text-[11.5px] font-medium ${mom.direction.expenses === "up" ? "text-terracotta-700" : mom.direction.expenses === "down" ? "text-sage-700" : "text-navy-600"}`}>
                  {mom.expenseDelta >= 0 ? "+" : ""}{formatMoneyCompact(mom.expenseDelta)}
                  {mom.expenseDeltaPct !== undefined && ` (${mom.expenseDeltaPct >= 0 ? "+" : ""}${mom.expenseDeltaPct}%)`}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-navy-400">Saldo</p>
                <p className={`text-[11.5px] font-medium ${mom.direction.balance === "up" ? "text-sage-700" : mom.direction.balance === "down" ? "text-terracotta-700" : "text-navy-600"}`}>
                  {mom.balanceDelta >= 0 ? "+" : ""}{formatMoneyCompact(mom.balanceDelta)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Contas próximas ── */}
        {totalUpcoming > 0 && (
          <div className="mx-4 mt-3 rounded-lg border border-navy-100 bg-white/[0.78] px-3 py-2.5">
            <p className="mb-1.5 text-[11.5px] font-semibold text-navy-700">Próximas contas</p>
            {windows.next3Days.length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-terracotta-600">Próximos 3 dias</p>
                {windows.next3Days.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 py-0.5">
                    <p className="truncate text-[11.5px] text-navy-700">{e.title}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-[11.5px] font-medium text-navy-800">{formatMoney(e.amount)}</p>
                      <button
                        type="button"
                        onClick={() => createAgendaFromEntry(e)}
                        className="text-[10px] text-navy-400 hover:text-navy-700"
                        title="Criar evento de agenda"
                      >
                        + agenda
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {windows.next7Days.length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600">4–7 dias</p>
                {windows.next7Days.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 py-0.5">
                    <p className="truncate text-[11.5px] text-navy-700">{e.title}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-[11.5px] font-medium text-navy-800">{formatMoney(e.amount)}</p>
                      <button
                        type="button"
                        onClick={() => createAgendaFromEntry(e)}
                        className="text-[10px] text-navy-400 hover:text-navy-700"
                        title="Criar evento de agenda"
                      >
                        + agenda
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {windows.next15Days.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-navy-400">8–15 dias</p>
                {windows.next15Days.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 py-0.5">
                    <p className="truncate text-[11.5px] text-navy-700">{e.title}</p>
                    <p className="shrink-0 text-[11.5px] font-medium text-navy-800">{formatMoney(e.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Visão executiva copiável ── */}
        <div className="mx-4 mt-3 rounded-lg border border-navy-100 bg-cream-50/45 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-navy-800">Resumo financeiro auxiliar</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-navy-400">
                Texto curto para conselho ou WhatsApp. Não substitui balancete ou prestação oficial.
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

        {/* ── Campos de resumo ── */}
        <div className="mt-4 grid gap-3 px-4 sm:grid-cols-3">
          <FormField label="Saldo estimado">
            <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" className="w-full rounded-lg border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/20" />
          </FormField>
          <FormField label="Inadimplência (%)">
            <input value={delinquency} onChange={(e) => setDelinquency(e.target.value)} inputMode="decimal" className="w-full rounded-lg border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/20" />
          </FormField>
          <FormField label="Reserva com liquidez">
            <input value={reserve} onChange={(e) => setReserve(e.target.value)} inputMode="decimal" className="w-full rounded-lg border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/20" />
          </FormField>
        </div>
        <div className="px-4 pt-2 pb-1">
          <ActionButton onClick={saveSnapshotFields}>
            Atualizar resumo
          </ActionButton>
        </div>

        {/* ── Novo lançamento ── */}
        <div className="mx-4 mt-4 rounded-lg border border-navy-100 bg-navy-50/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-navy-800">
              {editingEntryId ? "Editar lançamento" : "Lançamentos"}
            </p>
            <div className="flex gap-2">
              {editingEntryId && (
                <button type="button" onClick={() => { clearEntryForm(); setShowForm(false); }} className="text-[11px] font-medium text-navy-400 hover:text-navy-600">
                  Cancelar
                </button>
              )}
              {!editingEntryId && (
                <button
                  type="button"
                  onClick={() => { setShowForm(!showForm); clearEntryForm(); }}
                  className={`rounded-full px-3 py-1 text-[11.5px] font-semibold ${showForm ? "bg-navy-100 text-navy-700" : "bg-navy-800 text-white shadow-card hover:bg-navy-900"}`}
                >
                  {showForm ? "Fechar" : "+ Novo"}
                </button>
              )}
            </div>
          </div>

          {(showForm || editingEntryId) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              <select value={entryType} onChange={(e) => setEntryType(e.target.value as FinancialEntryType)} className="rounded-lg border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700">
                {Object.entries(ENTRY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} placeholder="Título" className="rounded-lg border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700 sm:col-span-2" />
              <input value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} inputMode="decimal" placeholder="Valor" className="rounded-lg border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700" />
              <input type="date" value={entryDueDate} onChange={(e) => setEntryDueDate(e.target.value)} className="rounded-lg border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700" />
              <select value={entryCategory} onChange={(e) => setEntryCategory(e.target.value)} className="rounded-lg border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-700 sm:col-span-4">
                <option value="">Categoria (opcional)</option>
                {FINANCIAL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button type="button" onClick={saveEntry} className="rounded-lg bg-navy-800 px-3 py-2 text-[12px] font-semibold text-white shadow-card hover:bg-navy-900">
                {editingEntryId ? "Salvar" : "Adicionar"}
              </button>
            </div>
          )}
        </div>

        {/* ── Entrada rápida ── */}
        <div className="mx-4 mt-3 rounded-lg border border-navy-100 bg-white/[0.78] p-3">
          <button
            type="button"
            onClick={() => setShowQuickText(!showQuickText)}
            className="flex w-full items-center justify-between text-left"
          >
            <p className="text-[12px] font-semibold text-navy-800">Entrada rápida</p>
            <span className="text-[11px] text-navy-400">{showQuickText ? "Fechar" : "Abrir"}</span>
          </button>
          {showQuickText && (
            <>
              <textarea
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="Ex: saldo 42000; limpeza 1200; elevador 980; água 740 vence 10/06; inadimplência 8%; investido 30000"
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-navy-100 bg-cream-50/30 px-3 py-2 text-[12.5px] text-navy-800 placeholder:text-navy-300"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={previewQuickText} className="rounded-full border border-navy-100 px-3 py-1.5 text-[11.5px] font-medium text-navy-600 hover:bg-navy-50">
                  Revisar
                </button>
                {parsedLines.length > 0 && (
                  <button type="button" onClick={applyParsedLines} className="rounded-full bg-navy-700 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-navy-800">
                    Salvar compreendidos
                  </button>
                )}
              </div>
              {parsedLines.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {parsedLines.map((line) => (
                    <div key={line.raw} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${line.warning ? "bg-amber-50 text-amber-700" : "bg-sage-50 text-sage-800"}`}>
                      {line.warning ? line.warning : `Pronto: ${line.entry?.title ?? "campo do resumo"}`}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Lista de lançamentos ── */}
        <div className="mt-4 space-y-2 px-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] font-semibold text-navy-800">Lançamentos do mês</p>
            <span className="text-[10.5px] text-navy-400">controle auxiliar</span>
          </div>
          <FinancialFilters value={activeFilter} onChange={setActiveFilter} />

          {actionFeedback && (
            <div className="rounded-lg bg-sage-50 px-3 py-2 text-[11.5px] text-sage-800">
              {actionFeedback}
            </div>
          )}

          {activeEntries.length === 0 ? (
            <EmptyState
              title={entries.length === 0 ? "Nenhum lançamento financeiro ainda" : "Nenhum item neste filtro"}
              description={entries.length === 0 ? "Comece pelo saldo estimado ou registre as principais receitas e despesas do mês." : "Troque o filtro ou registre um novo lançamento."}
              actionLabel={entries.length === 0 ? "Adicionar lançamento" : undefined}
              onAction={entries.length === 0 ? () => { setEntryTitle("Cota condominial"); setShowForm(true); } : undefined}
            />
          ) : (
            activeEntries.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className={`rounded-[12px] border px-3 py-2 ${
                  isFinancialEntryOverdue(entry)
                    ? "border-terracotta-200 bg-terracotta-50/40"
                    : entry.status === "pago"
                      ? "border-sage-100 bg-sage-50/40"
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
                    {entry.status === "pago" && <p className="text-[10.5px] text-sage-700">Paga</p>}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-navy-50 pt-2">
                  {entry.type === "conta_a_pagar" && entry.status !== "pago" && (
                    <button type="button" onClick={() => { markFinancialEntryPaid(month, entry.id); reload(); onSaved?.(); }} className="text-[11px] font-medium text-sage-700 hover:text-sage-800">
                      Marcar paga
                    </button>
                  )}
                  {entry.type === "conta_a_pagar" && entry.status === "pago" && (
                    <button type="button" onClick={() => { reopenFinancialEntry(month, entry.id); reload(); onSaved?.(); }} className="text-[11px] font-medium text-navy-500 hover:text-navy-700">
                      Reabrir
                    </button>
                  )}
                  {isFinancialEntryOverdue(entry) && (
                    <button type="button" onClick={() => createPendenciaFromEntry(entry)} className="text-[11px] font-medium text-terracotta-700 hover:text-terracotta-800">
                      + pendência
                    </button>
                  )}
                  {entry.type === "conta_a_pagar" && !isFinancialEntryOverdue(entry) && entry.status !== "pago" && (
                    <button type="button" onClick={() => createAgendaFromEntry(entry)} className="text-[11px] font-medium text-navy-500 hover:text-navy-700">
                      + agenda
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
