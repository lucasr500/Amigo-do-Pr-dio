"use client";

import { useEffect, useState } from "react";
import {
  computeHealthScore,
  type HealthScoreResult,
} from "@/lib/health-score";
import {
  HEALTH_RING_COLOR,
  HEALTH_CARD_BG,
  HEALTH_SHORT_PHRASE,
  hasMinimumHealthData as checkMinHealth,
} from "@/lib/health-config";
import { getMemoriaOperacional } from "@/lib/session";
import { getHealthHistoryStats, getScoreStreak } from "@/lib/health-history";

function hasMinimumHealthData(): boolean {
  return checkMinHealth(getMemoriaOperacional());
}

const RING_COLOR  = HEALTH_RING_COLOR;
const CARD_BG     = HEALTH_CARD_BG;
const SHORT_PHRASE = HEALTH_SHORT_PHRASE;

function RingIndicator({ pct, color }: { pct: number; color: string }) {
  const r = 23;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center">
      <svg
        className="absolute inset-0"
        viewBox="0 0 58 58"
        fill="none"
        aria-hidden="true"
      >
        {/* Track */}
        <circle cx="29" cy="29" r={r} stroke="#e5e7eb" strokeWidth="5" />
        {/* Progress — starts at 12 o'clock via transform */}
        <circle
          cx="29"
          cy="29"
          r={r}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 29 29)"
        />
      </svg>
      <span className="relative z-10 text-[12px] font-bold leading-none text-navy-800">
        {pct}%
      </span>
    </div>
  );
}

type TrendBadge = { label: string; color: string } | null;

type Props = { refreshKey?: number; onClick?: () => void };

export default function HomeSaudeCard({ refreshKey, onClick }: Props) {
  const [result, setResult]     = useState<HealthScoreResult | null>(null);
  const [hasData, setHasData]   = useState(false);
  const [trendBadge, setTrendBadge] = useState<TrendBadge>(null);
  const [streak, setStreak]     = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHasData(hasMinimumHealthData());
    setResult(computeHealthScore());

    const stats = getHealthHistoryStats();
    if (stats.trend === "up" && stats.previousWeek !== null) {
      const delta = stats.current - stats.previousWeek;
      if (delta >= 3) setTrendBadge({ label: `↑ +${delta}% esta semana`, color: "text-emerald-600" });
    } else if (stats.trend === "down" && stats.previousWeek !== null) {
      const delta = stats.previousWeek - stats.current;
      if (delta >= 3) setTrendBadge({ label: `↓ −${delta}% esta semana`, color: "text-amber-600" });
    } else if (stats.trend === "stable" && stats.totalDaysTracked >= 3) {
      setTrendBadge({ label: "→ Estável esta semana", color: "text-navy-400" });
    }

    setStreak(getScoreStreak(60));
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="h-[82px] animate-pulse rounded-[18px] bg-navy-50/80" />
      </section>
    );
  }
  if (!result) return null;

  const btnClass = `flex w-full items-center gap-3.5 rounded-[18px] border px-4 py-4 text-left shadow-card ${onClick ? "transition-all hover:shadow-card-md active:scale-[0.99]" : ""}`;

  if (!hasData) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={`${btnClass} border-navy-100/60 bg-white`}
        >
          <div className="relative flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 58 58" fill="none" aria-hidden="true">
              <circle cx="29" cy="29" r={23} stroke="#e5e7eb" strokeWidth="5" />
            </svg>
            <span className="relative z-10 text-[16px] leading-none text-navy-300" aria-hidden="true">—</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-snug text-navy-800">
              Saúde operacional
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-navy-400">
              Sem dados, o app não alerta sobre AVCB vencido ou seguro prestes a expirar.
            </p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>
    );
  }

  const ringColor = RING_COLOR[result.statusKey];
  const cardBg    = CARD_BG[result.statusKey];
  const phrase    = SHORT_PHRASE[result.statusKey];

  // Mapeia statusKey para label de badge e estilo
  const statusBadgeMap: Record<string, { label: string; style: string }> = {
    "critico":         { label: "Crítico",         style: "bg-red-100 text-red-700" },
    "atencao":         { label: "Atenção",          style: "bg-amber-100 text-amber-700" },
    "em-evolucao":     { label: "Em evolução",      style: "bg-blue-100 text-blue-700" },
    "bem-acompanhado": { label: "Bem acompanhado",  style: "bg-teal-100 text-teal-700" },
    "tudo-em-ordem":   { label: "Tudo em ordem",    style: "bg-emerald-100 text-emerald-700" },
  };
  const statusBadge = statusBadgeMap[result.statusKey];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`${btnClass} ${cardBg}`}
      >
        <RingIndicator pct={result.percentage} color={ringColor} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold leading-snug text-navy-800">
              Saúde operacional
            </p>
            {statusBadge && (
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge.style}`}>
                {statusBadge.label}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-navy-600">{phrase}</p>
          {trendBadge && (
            <p className={`mt-0.5 text-[10.5px] font-medium ${trendBadge.color}`}>
              {trendBadge.label}
            </p>
          )}
          {streak >= 3 && (
            <p className="mt-0.5 text-[10.5px] font-medium text-teal-600">
              {streak} dia{streak !== 1 ? "s" : ""} com score acima de 60%
            </p>
          )}
        </div>

        <svg
          className="h-4 w-4 flex-shrink-0 text-navy-300"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}
