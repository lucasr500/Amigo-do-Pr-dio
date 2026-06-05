"use client";

import { useMemo } from "react";
import type { CondominioOverviewModel, CondominioOverviewMetric } from "@/lib/condominio-overview";
import { buildCondominioOverview } from "@/lib/condominio-overview";
import type { AppTab } from "@/components/BottomNav";

// ─── Status colors & icons ────────────────────────────────────────────────────

const STATUS_RING: Record<string, string> = {
  bom:       "ring-emerald-200",
  atencao:   "ring-amber-200",
  critico:   "ring-red-200",
  incompleto:"ring-navy-150",
};

const STATUS_BG: Record<string, string> = {
  bom:       "bg-emerald-50",
  atencao:   "bg-amber-50",
  critico:   "bg-red-50",
  incompleto:"bg-navy-50",
};

const STATUS_DOT: Record<string, string> = {
  bom:       "bg-emerald-400",
  atencao:   "bg-amber-400",
  critico:   "bg-red-400",
  incompleto:"bg-navy-300",
};

const STATUS_TEXT: Record<string, string> = {
  bom:       "text-emerald-700",
  atencao:   "text-amber-700",
  critico:   "text-red-700",
  incompleto:"text-navy-500",
};

const METRIC_VALUE_COLOR: Record<string, string> = {
  bom:       "text-emerald-700",
  atencao:   "text-amber-700",
  critico:   "text-red-700",
  incompleto:"text-navy-400",
};

const METRIC_BG: Record<string, string> = {
  bom:       "bg-emerald-50 ring-emerald-100",
  atencao:   "bg-amber-50 ring-amber-100",
  critico:   "bg-red-50 ring-red-100",
  incompleto:"bg-navy-50 ring-navy-100",
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  condoName?: string;
  onNavigateTab?: (tab: AppTab) => void;
  onNavigateToSection?: (id: string) => void;
  onOpenMonthlyReview?: () => void;
};

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  metric,
  onPress,
}: {
  metric: CondominioOverviewMetric;
  onPress: () => void;
}) {
  const st = metric.status;
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex min-w-[88px] flex-1 flex-col items-start rounded-2xl px-3 py-2.5 ring-1 transition-all active:scale-[0.97] ${METRIC_BG[st]}`}
      aria-label={`${metric.label}: ${metric.value}${metric.detail ? `, ${metric.detail}` : ""}`}
    >
      <span className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
        {metric.label}
      </span>
      <span className={`text-[12.5px] font-bold leading-none ${METRIC_VALUE_COLOR[st]}`}>
        {metric.value}
      </span>
      {metric.detail && (
        <span className="mt-0.5 text-[10px] leading-snug text-navy-400">{metric.detail}</span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CondominioOverview({
  refreshKey,
  condoName,
  onNavigateTab,
  onNavigateToSection,
  onOpenMonthlyReview,
}: Props) {
  const model: CondominioOverviewModel = useMemo(
    () => buildCondominioOverview(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey],
  );

  function handleMetricPress(metric: CondominioOverviewMetric) {
    if (metric.sectionTarget) {
      onNavigateToSection?.(metric.sectionTarget);
    } else if (metric.tabTarget) {
      onNavigateTab?.(metric.tabTarget);
    }
  }

  function handleNextActionPress() {
    const a = model.nextAction;
    if (!a) return;
    if (a.sectionTarget) {
      onNavigateToSection?.(a.sectionTarget);
    } else if (a.tabTarget === "condominio") {
      onNavigateToSection?.("visao-geral");
    } else if (a.tabTarget) {
      onNavigateTab?.(a.tabTarget);
    }
  }

  const st = model.status;
  const displayName = condoName || "Meu prédio";
  const showHealthBar = model.healthScore !== undefined;

  return (
    <section
      id="overview"
      aria-label="Visão executiva do condomínio"
      className={`mx-5 mb-3 mt-2 rounded-[20px] ring-1 sm:mx-6 ${STATUS_RING[st]} ${STATUS_BG[st]} overflow-hidden`}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-2 pt-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Condomínio
            </p>
            <p className="mt-0.5 font-display text-[17px] font-semibold leading-snug text-navy-800 truncate">
              {displayName}
            </p>
          </div>
          {/* Status pill */}
          <div
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${STATUS_RING[st]} bg-white/70`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[st]}`} aria-hidden="true" />
            <span className={`text-[10.5px] font-semibold ${STATUS_TEXT[st]}`}>
              {model.headline}
            </span>
          </div>
        </div>

        {/* Health score bar */}
        {showHealthBar && (
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10.5px] text-navy-500">
                {model.healthLabel ?? "Saúde operacional"}
              </span>
              <span className={`text-[11px] font-bold ${STATUS_TEXT[st]}`}>
                {model.healthScore}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/70 ring-1 ring-navy-100/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  st === "critico" ? "bg-red-400" :
                  st === "atencao" ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${model.healthScore}%` }}
                aria-valuenow={model.healthScore}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
                aria-label={`Saúde operacional: ${model.healthScore}%`}
              />
            </div>
          </div>
        )}

        {/* Subtitle */}
        {st === "incompleto" ? (
          <p className="mb-1 text-[12.5px] leading-relaxed text-navy-500">{model.subtitle}</p>
        ) : (
          <p className="mb-1 text-[12px] leading-relaxed text-navy-500 line-clamp-2">
            {model.subtitle}
          </p>
        )}
      </div>

      {/* ── Metric grid ───────────────────────────────────────────────── */}
      {model.metrics.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {model.metrics.map((m) => (
              <MetricCard
                key={m.id}
                metric={m}
                onPress={() => handleMetricPress(m)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Warnings ─────────────────────────────────────────────────── */}
      {model.warnings.length > 0 && (
        <div className="mx-4 mb-3 rounded-[14px] bg-white/60 px-3 py-2.5 ring-1 ring-red-100">
          {model.warnings.map((w, i) => (
            <p key={i} className="text-[11.5px] font-medium leading-snug text-red-700">
              {i === 0 ? "⚠ " : "  "}{w}
            </p>
          ))}
        </div>
      )}

      {/* ── Próxima ação ─────────────────────────────────────────────── */}
      {model.nextAction && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleNextActionPress}
            className="flex w-full items-center gap-3 rounded-[14px] bg-white/80 px-3.5 py-3 text-left ring-1 ring-navy-100/60 shadow-sm transition-all hover:bg-white active:scale-[0.98]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-navy-400">
                Próxima ação
              </p>
              <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-navy-800">
                {model.nextAction.title}
              </p>
              {model.nextAction.reason && (
                <p className="mt-0.5 text-[11px] leading-snug text-navy-500 line-clamp-1">
                  {model.nextAction.reason}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 rounded-full bg-navy-800 px-3 py-1.5">
              <span className="text-[11px] font-semibold text-white">
                {model.nextAction.cta}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── Estado incompleto — CTA setup ────────────────────────────── */}
      {st === "incompleto" && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onNavigateToSection?.("visao-geral")}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-navy-800 px-4 py-3 transition-all hover:bg-navy-700 active:scale-[0.98]"
          >
            <span className="text-[13px] font-semibold text-white">Configurar prédio</span>
            <svg className="h-4 w-4 text-white/70" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Revisão mensal compacta (se não for incompleto) ──────────── */}
      {st !== "incompleto" && (
        <button
          type="button"
          onClick={() => {
            if (model.monthlyReview.status === "pendente" || model.monthlyReview.status === "em_andamento") {
              onOpenMonthlyReview?.();
            } else {
              onNavigateToSection?.("revisao-mensal");
            }
          }}
          className="flex w-full items-center justify-between border-t border-white/60 px-4 py-2.5 transition-colors hover:bg-white/20 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                model.monthlyReview.status === "concluida" ? "bg-emerald-400" :
                model.monthlyReview.status === "em_andamento" ? "bg-amber-400" : "bg-navy-300"
              }`}
              aria-hidden="true"
            />
            <span className="text-[11.5px] font-medium text-navy-600">
              Revisão: {model.monthlyReview.label}
            </span>
            <span className="text-[10.5px] text-navy-400">{model.monthlyReview.detail}</span>
          </div>
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </section>
  );
}
