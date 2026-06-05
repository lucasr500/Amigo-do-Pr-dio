"use client";

import { useEffect, useState } from "react";
import { currentMonthKey } from "@/lib/financial";
import { getMonthlyReviewState, getLastCompletedMonthlyReview, getMonthlyReviewTrend, type MonthlyReviewState } from "@/lib/session-monthly-review";
import { buildMonthlyReview } from "@/lib/monthly-review";

type Props = {
  refreshKey?: number;
  onOpen: () => void;
};

export default function MonthlyReviewCard({ refreshKey, onOpen }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<MonthlyReviewState | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [lastCompletedLabel, setLastCompletedLabel] = useState<string | null>(null);
  const [trendWarning, setTrendWarning] = useState(false);

  useEffect(() => {
    const month = currentMonthKey();
    const s = getMonthlyReviewState(month);
    setState(s);
    const report = buildMonthlyReview(month, s.status);
    setTotalItems(report.items.length);

    // Última revisão concluída (pode ser mês anterior)
    const last = getLastCompletedMonthlyReview();
    if (last && last.month !== month) {
      const d = new Date(last.completedAt);
      setLastCompletedLabel(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const trend = getMonthlyReviewTrend();
    setTrendWarning(trend === "piorando");
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !state) return null;

  const month = currentMonthKey();
  const mesFormatado = new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long" });
  const checkedCount = state.checkedItems.length;
  const { status } = state;

  let headline: string;
  let sub: string;
  let ctaLabel: string;
  let accentClass: string;

  if (status === "concluida") {
    headline = `Revisão de ${mesFormatado} concluída`;
    sub = trendWarning
      ? "Score caiu em relação à última revisão. Vale revisar os pontos de atenção."
      : "Condomínio revisado este mês.";
    ctaLabel = "Ver resumo";
    accentClass = "border-green-200/70 bg-green-50/60";
  } else if (status === "em_andamento") {
    headline = `${checkedCount} de ${totalItems} pontos revisados`;
    sub = `Revisão de ${mesFormatado} em andamento.`;
    ctaLabel = "Continuar";
    accentClass = "border-amber-200/70 bg-amber-50/50";
  } else {
    headline = `Revisão de ${mesFormatado} pendente`;
    sub = lastCompletedLabel
      ? `Última revisão concluída em ${lastCompletedLabel}.`
      : totalItems > 0
        ? `${totalItems} ponto${totalItems > 1 ? "s" : ""} para verificar este mês.`
        : "Inicie para ver os pontos de atenção do mês.";
    ctaLabel = "Iniciar revisão";
    accentClass = "border-navy-100 bg-white";
  }

  return (
    <div className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left shadow-sm transition-all hover:opacity-90 active:scale-[0.98] ${accentClass}`}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-100/70">
          <svg className="h-5 w-5 text-navy-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 10l3.5 3.5L15 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-navy-800">{headline}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-navy-500">{sub}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <span className="text-[11px] font-medium text-navy-600">{ctaLabel}</span>
          <svg className="h-4 w-4 text-navy-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
    </div>
  );
}
