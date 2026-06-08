"use client";

import { useMemo } from "react";
import { getHealthHistory } from "@/lib/session";

type Props = { refreshKey?: number };

function buildNarrative(refreshKey?: number): {
  show: boolean;
  delta: number;
  current: number;
  horizon: string;
  positive: boolean;
} {
  // refreshKey used as cache-bust signal only
  void refreshKey;
  const hist = getHealthHistory();
  if (hist.length < 2) return { show: false, delta: 0, current: 0, horizon: "", positive: true };

  const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  // Comparar com 30 dias atrás (ou o mais antigo disponível dentro de 30d)
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff30Str = cutoff30.toISOString().slice(0, 10);

  const withinWindow = sorted.filter((s) => s.date >= cutoff30Str && s.date < latest.date);
  const reference = withinWindow.length > 0 ? withinWindow[0] : sorted[sorted.length - 2];

  const delta = latest.percentage - reference.percentage;
  if (Math.abs(delta) < 2) return { show: false, delta, current: latest.percentage, horizon: "", positive: true };

  const daysDiff = Math.round(
    (new Date(latest.date).getTime() - new Date(reference.date).getTime()) / 86400000,
  );
  const horizon = daysDiff <= 7 ? "esta semana" : daysDiff <= 14 ? "em 2 semanas" : "neste mês";

  return { show: true, delta: Math.round(delta), current: latest.percentage, horizon, positive: delta > 0 };
}

export default function HealthScoreProgressCard({ refreshKey }: Props) {
  const narrative = useMemo(() => buildNarrative(refreshKey), [refreshKey]);

  if (!narrative.show) return null;

  const { delta, current, horizon, positive } = narrative;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 shadow-card
        ${positive
          ? "border-sage-200/80 bg-sage-50/60"
          : "border-terracotta-200/80 bg-terracotta-50/60"
        }`}
      >
        {/* Ícone de tendência */}
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
          ${positive ? "bg-sage-100 text-sage-700" : "bg-terracotta-100 text-terracotta-600"}`}
          aria-hidden="true"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
            {positive
              ? <path d="M3 11l4-4 3 2 4-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M3 5l4 4 3-2 4 6"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            }
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className={`text-[12.5px] font-semibold leading-snug
            ${positive ? "text-sage-800" : "text-terracotta-800"}`}
          >
            {positive
              ? `Saúde melhorou ${delta} pp ${horizon}`
              : `Saúde caiu ${Math.abs(delta)} pp ${horizon}`
            }
          </p>
          <p className={`mt-0.5 text-[11px] leading-snug
            ${positive ? "text-sage-600" : "text-terracotta-600"}`}
          >
            Pontuação atual: {current}%
            {positive
              ? " — continue resolvendo pendências e mantendo dados atualizados."
              : " — verifique as pendências prioritárias na aba Saúde."}
          </p>
        </div>
      </div>
    </div>
  );
}
