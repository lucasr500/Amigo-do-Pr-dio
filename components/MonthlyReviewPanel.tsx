"use client";

import { useCallback, useEffect, useState } from "react";
import { currentMonthKey } from "@/lib/financial";
import { buildMonthlyReview, type MonthlyReviewItem, type MonthlyReviewReport, type MonthlyReviewSectionKey } from "@/lib/monthly-review";
import {
  getMonthlyReviewState,
  startMonthlyReview,
  toggleMonthlyReviewItem,
  completeMonthlyReview,
  resetMonthlyReview,
  type MonthlyReviewState,
} from "@/lib/session-monthly-review";
import { buildMonthlyOperationalSummary } from "@/lib/operational-summary";

// ─── Constantes visuais ───────────────────────────────────────────────────────

const SECTION_LABEL: Record<MonthlyReviewSectionKey, string> = {
  financeiro:  "Financeiro",
  documentos:  "Documentos",
  agenda:      "Agenda",
  pendencias:  "Pendências",
  integridade: "Integridade dos dados",
  resumo:      "Resumo",
};

const SEV_BADGE: Record<MonthlyReviewItem["severity"], string> = {
  critical: "bg-terracotta-100 text-terracotta-700 ring-1 ring-terracotta-200",
  warning:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  info:     "bg-navy-100/80 text-navy-600 ring-1 ring-navy-200/50",
};

const SEV_LABEL: Record<MonthlyReviewItem["severity"], string> = {
  critical: "Crítico",
  warning:  "Atenção",
  info:     "Info",
};

const SECTION_ORDER: MonthlyReviewSectionKey[] = [
  "financeiro", "documentos", "pendencias", "agenda", "integridade",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - score / 100);
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text x="26" y="31" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f3147">
        {score}
      </text>
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onRefresh?: () => void;
};

export default function MonthlyReviewPanel({ refreshKey, onRefresh }: Props) {
  const [hydrated, setHydrated]   = useState(false);
  const [month]                   = useState(() => currentMonthKey());
  const [report, setReport]       = useState<MonthlyReviewReport | null>(null);
  const [state, setState]         = useState<MonthlyReviewState | null>(null);
  const [copied, setCopied]       = useState(false);
  const [done, setDone]           = useState(false);

  const mesFormatado = new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const reload = useCallback(() => {
    const s = getMonthlyReviewState(month);
    setState(s);
    setReport(buildMonthlyReview(month, s.status));
  }, [month]);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload, refreshKey]);

  if (!hydrated || !report || !state) return null;

  const { status } = state;
  const totalItems = report.items.length;
  const checkedCount = state.checkedItems.length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const handleStart = () => {
    startMonthlyReview(month);
    reload();
    onRefresh?.();
  };

  const handleToggle = (itemId: string) => {
    toggleMonthlyReviewItem(month, itemId);
    reload();
    onRefresh?.();
  };

  const handleComplete = () => {
    completeMonthlyReview(month);
    setDone(true);
    reload();
    onRefresh?.();
    setTimeout(() => setDone(false), 3000);
  };

  const handleReset = () => {
    resetMonthlyReview(month);
    reload();
    onRefresh?.();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildMonthlyOperationalSummary(month));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* noop */ }
  };

  // ── Header ────────────────────────────────────────────────────────────────

  return (
    <section className="px-5 pb-4 pt-2 sm:px-6">
      <div className="rounded-[18px] border border-navy-100 bg-white shadow-card">

        {/* Cabeçalho */}
        <div className="flex items-start gap-3 px-4 pb-3 pt-4">
          <ScoreRing score={report.score} />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Revisão mensal — controle auxiliar
            </p>
            <p className="mt-0.5 text-[14px] font-semibold leading-snug text-navy-800">
              {mesFormatado}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-navy-600">
              {report.headline}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Frase executiva */}
        <div className="mx-4 mb-3 rounded-xl bg-navy-50/60 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-navy-600">{report.summary}</p>
        </div>

        {/* Barra de progresso (só se em_andamento ou concluida) */}
        {status !== "pendente" && totalItems > 0 && (
          <div className="mx-4 mb-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10.5px] font-medium text-navy-400">
                {checkedCount} de {totalItems} pontos revisados
              </p>
              <p className="text-[10.5px] font-semibold text-navy-600">{progressPct}%</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
              <div
                className="h-full rounded-full bg-navy-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Estado inicial — pendente */}
        {status === "pendente" && (
          <div className="mx-4 mb-4">
            {report.recommendedFirstAction && (
              <div className="mb-3 rounded-xl border border-navy-100/60 bg-cream-50/50 px-3 py-2.5">
                <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
                  Primeiro ponto a verificar
                </p>
                <p className="text-[12px] font-medium leading-snug text-navy-700">
                  {report.recommendedFirstAction.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-navy-500">
                  {report.recommendedFirstAction.description}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-xl bg-navy-700 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800 active:scale-[0.98]"
            >
              Iniciar revisão mensal
            </button>
          </div>
        )}

        {/* Checklist — em_andamento ou concluida */}
        {status !== "pendente" && totalItems > 0 && (
          <div className="border-t border-navy-50 px-4 pt-3">
            {SECTION_ORDER.map((sectionKey) => {
              const sectionItems = report.sections[sectionKey];
              if (!sectionItems || sectionItems.length === 0) return null;
              return (
                <div key={sectionKey} className="mb-4">
                  <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
                    {SECTION_LABEL[sectionKey]}
                  </p>
                  <div className="space-y-2">
                    {sectionItems.map((item) => {
                      const checked = state.checkedItems.includes(item.id);
                      return (
                        <ReviewItemRow
                          key={item.id}
                          item={item}
                          checked={checked}
                          onToggle={() => handleToggle(item.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado vazio */}
        {status !== "pendente" && totalItems === 0 && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-green-50/70 px-3 py-3 text-center">
              <p className="text-[12px] font-semibold text-green-700">Tudo em ordem este mês</p>
              <p className="mt-0.5 text-[11.5px] text-green-600">
                Nenhum ponto de atenção identificado. Mantenha os dados atualizados.
              </p>
            </div>
          </div>
        )}

        {/* Ações do rodapé */}
        {status !== "pendente" && (
          <div className="border-t border-navy-50 px-4 pb-4 pt-3">
            {done && (
              <div className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-center">
                <p className="text-[12px] font-semibold text-green-700">Revisão mensal concluída</p>
                <p className="text-[11px] text-green-600">Dados informados manualmente — não substitui documentos oficiais.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {status !== "concluida" && (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex-1 rounded-xl bg-navy-700 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-navy-800 active:scale-[0.98]"
                >
                  Concluir revisão
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded-xl border border-navy-200 bg-white py-2 text-[12.5px] font-semibold text-navy-700 transition-colors hover:bg-navy-50 active:scale-[0.98]"
              >
                {copied ? "Copiado!" : "Copiar resumo"}
              </button>
            </div>

            {status === "concluida" && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 w-full rounded-xl py-1.5 text-[11px] text-navy-400 hover:text-navy-600 transition-colors"
              >
                Refazer revisão
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="border-t border-navy-50/80 px-4 pb-3 pt-2.5">
          <p className="text-[10.5px] leading-relaxed text-navy-400">
            Controle auxiliar com dados informados manualmente. Não substitui prestação de contas oficial,
            demonstrativos contábeis ou orientação de administradora e assessoria jurídica.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MonthlyReviewState["status"] }) {
  const styles: Record<MonthlyReviewState["status"], string> = {
    pendente:     "bg-navy-100/80 text-navy-500",
    em_andamento: "bg-amber-100 text-amber-700",
    concluida:    "bg-green-100 text-green-700",
  };
  const labels: Record<MonthlyReviewState["status"], string> = {
    pendente:     "Pendente",
    em_andamento: "Em andamento",
    concluida:    "Concluída",
  };
  return (
    <span className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ReviewItemRow({
  item,
  checked,
  onToggle,
}: {
  item: MonthlyReviewItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
        checked
          ? "border-navy-100/60 bg-navy-50/40 opacity-70"
          : "border-navy-100 bg-white hover:border-navy-200 hover:shadow-sm"
      }`}
    >
      {/* Checkbox visual */}
      <div className={`mt-[1px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
        checked ? "border-navy-400 bg-navy-600" : "border-navy-200 bg-white"
      }`}>
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5 flex-wrap">
          <span className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${SEV_BADGE[item.severity]}`}>
            {SEV_LABEL[item.severity]}
          </span>
          <p className={`text-[12px] font-medium leading-snug ${checked ? "line-through text-navy-400" : "text-navy-700"}`}>
            {item.title}
          </p>
        </div>
        {!checked && (
          <p className="text-[11px] leading-snug text-navy-500">{item.description}</p>
        )}
      </div>
    </button>
  );
}
