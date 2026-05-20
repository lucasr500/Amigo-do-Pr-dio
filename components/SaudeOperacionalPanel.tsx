"use client";

import { useEffect, useState } from "react";
import {
  computeHealthScore,
  type HealthScoreResult,
  type HealthStatusKey,
} from "@/lib/health-score";

const BAR_COLOR: Record<HealthStatusKey, string> = {
  "critico":         "bg-terracotta-500",
  "atencao":         "bg-amber-400",
  "em-evolucao":     "bg-navy-300",
  "bem-acompanhado": "bg-navy-500",
  "tudo-em-ordem":   "bg-navy-600",
};

const BADGE_STYLE: Record<HealthStatusKey, string> = {
  "critico":         "bg-terracotta-50 text-terracotta-800 ring-terracotta-200/70",
  "atencao":         "bg-amber-50/80 text-amber-800 ring-amber-200/70",
  "em-evolucao":     "bg-navy-50/80 text-navy-500 ring-navy-100",
  "bem-acompanhado": "bg-navy-50/80 text-navy-600 ring-navy-100",
  "tudo-em-ordem":   "bg-navy-50/80 text-navy-700 ring-navy-100",
};

const BADGE_DOT: Record<HealthStatusKey, string> = {
  "critico":         "bg-terracotta-500",
  "atencao":         "bg-amber-400",
  "em-evolucao":     "bg-navy-300",
  "bem-acompanhado": "bg-navy-500",
  "tudo-em-ordem":   "bg-navy-500",
};

const FACTOR_DOT: Record<"ok" | "partial" | "missing", string> = {
  ok:      "bg-navy-400",
  partial: "bg-amber-400",
  missing: "bg-terracotta-500",
};

type Props = { refreshKey?: number; variant?: "full" | "compact" };

export default function SaudeOperacionalPanel({ refreshKey, variant = "full" }: Props) {
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setResult(computeHealthScore());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !result) return null;

  const barColor   = BAR_COLOR[result.statusKey];
  const badgeStyle = BADGE_STYLE[result.statusKey];
  const badgeDot   = BADGE_DOT[result.statusKey];

  if (variant === "compact") {
    const signals = result.factors
      .filter((f) => f.status !== "ok")
      .slice(0, 3)
      .map((f) => f.label);

    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="rounded-[18px] border border-navy-100/80 bg-white/80 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
                Saúde operacional
              </p>
              <p className="mt-1 font-display text-[26px] font-semibold leading-none tracking-tight text-navy-800">
                {result.percentage}%
              </p>
            </div>
            <span
              className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ${badgeStyle}`}
            >
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${badgeDot}`}
                aria-hidden="true"
              />
              {result.statusLabel}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-100/60">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>

          <p className="mt-2 text-[12.5px] leading-snug text-navy-600">
            {result.diagnosticPhrase}
          </p>

          {signals.length > 0 && (
            <p className="mt-1.5 text-[11px] leading-snug text-navy-400">
              {signals.join(" · ")}
            </p>
          )}

          <p className="mt-2.5 text-[10px] leading-relaxed text-navy-300">
            Baseado nos dados cadastrados no app.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pb-4 sm:px-6">
      <div className="overflow-hidden rounded-[18px] border border-navy-100/80 bg-white/80 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">

        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <div className="px-4 pb-3 pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
                Saúde operacional
              </p>
              <p className="mt-1 font-display text-[26px] font-semibold leading-none tracking-tight text-navy-800">
                {result.percentage}%
              </p>
            </div>
            <span
              className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ${badgeStyle}`}
            >
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${badgeDot}`}
                aria-hidden="true"
              />
              {result.statusLabel}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-100/60">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>

          {/* Frase diagnóstica */}
          <p className="mt-2.5 text-[12.5px] leading-snug text-navy-600">
            {result.diagnosticPhrase}
          </p>
        </div>

        {/* ── Fatores ───────────────────────────────────────── */}
        <div className="mx-4 border-t border-navy-50" />
        <div className="px-4 pb-3 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Fatores
          </p>
          <ul className="space-y-2">
            {result.factors.map((factor) => (
              <li key={factor.label} className="flex items-start gap-2.5">
                <span
                  className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${FACTOR_DOT[factor.status]}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span className="text-[12.5px] leading-snug text-navy-700">
                    {factor.label}
                  </span>
                  {factor.note && (
                    <span className="ml-1 text-[11px] text-navy-400">{factor.note}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Sugestões ─────────────────────────────────────── */}
        {result.suggestions.length > 0 && (
          <>
            <div className="mx-4 border-t border-navy-50" />
            <div className="px-4 pb-3 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Para melhorar
              </p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span
                      className="mt-[5px] h-1 w-1 flex-shrink-0 rounded-full bg-navy-300"
                      aria-hidden="true"
                    />
                    <span className="text-[12.5px] leading-snug text-navy-500">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ── Disclaimer ────────────────────────────────────── */}
        <div className="border-t border-navy-50 px-4 py-3">
          <p className="text-[10.5px] leading-relaxed text-navy-400">
            Este índice é apenas operacional e depende dos dados cadastrados no app.
          </p>
        </div>

      </div>
    </section>
  );
}
