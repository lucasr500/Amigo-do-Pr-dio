"use client";

import { useMemo } from "react";
import type { CondominioOverviewModel, CondominioOverviewMetric } from "@/lib/condominio-overview";
import { buildCondominioOverview } from "@/lib/condominio-overview";
import type { AppTab } from "@/components/BottomNav";
import MetricCard from "@/components/ui/MetricCard";

const STATUS_RING: Record<string, string> = {
  bom: "ring-sage-200/80",
  atencao: "ring-amber-200/80",
  critico: "ring-terracotta-200/90",
  incompleto: "ring-navy-100/80",
};

const STATUS_BG: Record<string, string> = {
  bom: "bg-sage-50/75",
  atencao: "bg-amber-50/70",
  critico: "bg-terracotta-50/75",
  incompleto: "bg-white/[0.78]",
};

const STATUS_DOT: Record<string, string> = {
  bom: "bg-sage-500",
  atencao: "bg-amber-400",
  critico: "bg-terracotta-500",
  incompleto: "bg-navy-300",
};

const STATUS_TEXT: Record<string, string> = {
  bom: "text-sage-800",
  atencao: "text-amber-800",
  critico: "text-terracotta-800",
  incompleto: "text-navy-500",
};

const HEALTH_BAR: Record<string, string> = {
  bom: "bg-sage-500",
  atencao: "bg-amber-400",
  critico: "bg-terracotta-500",
  incompleto: "bg-navy-300",
};

const METRIC_STATUS: Record<string, "neutral" | "good" | "warning" | "danger"> = {
  bom: "good",
  atencao: "warning",
  critico: "danger",
  incompleto: "neutral",
};

type Props = {
  refreshKey?: number;
  condoName?: string;
  onNavigateTab?: (tab: AppTab) => void;
  onNavigateToSection?: (id: string) => void;
  onOpenMonthlyReview?: () => void;
};

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
      className={`mx-5 mb-4 mt-2 overflow-hidden rounded-lg ring-1 shadow-card sm:mx-6 ${STATUS_RING[st]} ${STATUS_BG[st]}`}
    >
      <div className="px-4 pb-3 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-400">
              Visão do condomínio
            </p>
            <p className="mt-1 truncate font-display text-[19px] font-semibold leading-snug text-navy-800">
              {displayName}
            </p>
          </div>
          <div
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/70 bg-white/[0.78] px-2.5 py-1 shadow-card ${STATUS_TEXT[st]}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[st]}`} aria-hidden="true" />
            <span className="max-w-[138px] truncate text-[10.5px] font-semibold">
              {model.headline}
            </span>
          </div>
        </div>

        {showHealthBar && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10.5px] font-medium text-navy-500">
                {model.healthLabel ?? "Saúde operacional"}
              </span>
              <span className={`text-[11px] font-semibold ${STATUS_TEXT[st]}`}>
                {model.healthScore}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-navy-100/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${HEALTH_BAR[st]}`}
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

        <p className="text-[12.5px] leading-relaxed text-navy-600">
          {model.subtitle}
        </p>
      </div>

      {model.metrics.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {model.metrics.map((m) => (
              <MetricCard
                key={m.id}
                label={m.label}
                value={m.value}
                detail={m.detail}
                status={METRIC_STATUS[m.status]}
                onClick={() => handleMetricPress(m)}
                className="min-w-[88px] flex-1"
              />
            ))}
          </div>
        </div>
      )}

      {model.warnings.length > 0 && (
        <div className="mx-4 mb-3 rounded-lg border border-terracotta-200/80 bg-white/[0.68] px-3 py-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-terracotta-700">
            Precisa de atenção
          </p>
          {model.warnings.map((w, i) => (
            <p key={i} className="text-[11.5px] font-medium leading-snug text-terracotta-800">
              {w}
            </p>
          ))}
        </div>
      )}

      {model.nextAction && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleNextActionPress}
            className="flex w-full items-center gap-3 rounded-lg bg-white/[0.82] px-3.5 py-3 text-left ring-1 ring-navy-100/60 shadow-card transition-all hover:bg-white active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                Próxima ação
              </p>
              <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-navy-800">
                {model.nextAction.title}
              </p>
              {model.nextAction.reason && (
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-navy-500">
                  {model.nextAction.reason}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-semibold text-white">
              {model.nextAction.cta}
            </span>
          </button>
        </div>
      )}

      {st === "incompleto" && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onNavigateToSection?.("visao-geral")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-4 py-3 transition-all hover:bg-navy-900 active:scale-[0.98]"
          >
            <span className="text-[13px] font-semibold text-white">Configurar prédio</span>
            <svg className="h-4 w-4 text-white/70" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

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
          className="flex w-full items-center justify-between border-t border-white/70 px-4 py-2.5 transition-colors hover:bg-white/20 active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                model.monthlyReview.status === "concluida" ? "bg-sage-500" :
                model.monthlyReview.status === "em_andamento" ? "bg-amber-400" : "bg-navy-300"
              }`}
              aria-hidden="true"
            />
            <span className="truncate text-[11.5px] font-medium text-navy-600">
              Revisão: {model.monthlyReview.label}
            </span>
            <span className="hidden text-[10.5px] text-navy-400 sm:inline">{model.monthlyReview.detail}</span>
          </div>
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </section>
  );
}
