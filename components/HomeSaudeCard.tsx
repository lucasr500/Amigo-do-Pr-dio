"use client";

import { useEffect, useState } from "react";
import {
  computeHealthScore,
  type HealthStatusKey,
  type HealthScoreResult,
} from "@/lib/health-score";

const RING_COLOR: Record<HealthStatusKey, string> = {
  critico:         "#ef4444",
  atencao:         "#f59e0b",
  "em-evolucao":   "#60a5fa",
  "bem-acompanhado": "#22c55e",
  "tudo-em-ordem":   "#22c55e",
};

const CARD_BG: Record<HealthStatusKey, string> = {
  critico:           "bg-red-50   border-red-100/60",
  atencao:           "bg-amber-50 border-amber-100/60",
  "em-evolucao":     "bg-navy-50/50 border-navy-100/50",
  "bem-acompanhado": "bg-green-50 border-green-100/60",
  "tudo-em-ordem":   "bg-green-50 border-green-100/60",
};

const SHORT_PHRASE: Record<HealthStatusKey, string> = {
  critico:           "Requer atenção imediata.",
  atencao:           "Resolva os alertas ativos.",
  "em-evolucao":     "Complete as informações.",
  "bem-acompanhado": "Seu condomínio está no caminho certo.",
  "tudo-em-ordem":   "Organização operacional em dia.",
};

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

type Props = { refreshKey?: number; onClick?: () => void };

export default function HomeSaudeCard({ refreshKey, onClick }: Props) {
  const [result, setResult]   = useState<HealthScoreResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setResult(computeHealthScore());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !result) return null;

  const ringColor = RING_COLOR[result.statusKey];
  const cardBg    = CARD_BG[result.statusKey];
  const phrase    = SHORT_PHRASE[result.statusKey];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`flex w-full items-center gap-3.5 rounded-[18px] border px-4 py-4 text-left shadow-card ${cardBg} ${onClick ? "transition-all hover:shadow-card-md active:scale-[0.99]" : ""}`}
      >
        <RingIndicator pct={result.percentage} color={ringColor} />

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-navy-800">
            Saúde operacional
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-navy-600">{phrase}</p>
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
