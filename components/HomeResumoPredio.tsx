"use client";

import { useEffect, useRef, useState } from "react";
import {
  computeCondominioHealth,
  getMemoriaOperacional,
  getOcorrencias,
  getPendenciasAbertas,
  getPendenciasConcluidas,
  getProfile,
  type CondominioHealthStatus,
} from "@/lib/session";
import { buildGuidanceItems } from "@/lib/guidance";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  refreshKey?: number;
};

type SummaryState = {
  status: CondominioHealthStatus;
  pendingCount: number;
  completedMonthCount: number;
  occurrenceWeekCount: number;
  staleStepsCount: number;
  guidanceCount: number;
  nextAttention: string | null;
  mainLine: string;
};

function isThisMonth(iso?: string): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function statusLabel(status: CondominioHealthStatus): string {
  switch (status) {
    case "critico": return "Atenção urgente";
    case "pendente": return "Uma pendência";
    case "atencao": return "Em observação";
    default: return "Tudo em ordem";
  }
}

function buildMainLineWithRoutine(
  pendingCount: number,
  completedMonthCount: number,
  guidanceCount: number,
  occurrenceWeekCount: number,
  staleStepsCount: number
): string {
  if (pendingCount > 0 || occurrenceWeekCount > 0 || staleStepsCount > 0) {
    const parts: string[] = [];
    if (pendingCount > 0) {
      parts.push(`${pendingCount} próximo${pendingCount !== 1 ? "s" : ""} passo${pendingCount !== 1 ? "s" : ""} aberto${pendingCount !== 1 ? "s" : ""}`);
    }
    if (occurrenceWeekCount > 0) {
      parts.push(`${occurrenceWeekCount} ocorrência${occurrenceWeekCount !== 1 ? "s" : ""} na semana`);
    }
    if (staleStepsCount > 0) {
      parts.push(`${staleStepsCount} parado${staleStepsCount !== 1 ? "s" : ""} há mais de 14 dias`);
    }
    return parts.slice(0, 2).join(" · ");
  }
  if (pendingCount > 0 || completedMonthCount > 0) {
    const completedLabel = completedMonthCount === 1 ? "1 ação concluída" : `${completedMonthCount} ações concluídas`;
    if (pendingCount === 0) return `${completedLabel} este mês`;
    return `${pendingCount} próximo${pendingCount !== 1 ? "s" : ""} passo${pendingCount !== 1 ? "s" : ""} aberto${pendingCount !== 1 ? "s" : ""} · ${completedLabel} este mês`;
  }
  if (guidanceCount > 0) {
    return "Há pontos que merecem atenção — confira os alertas acima";
  }
  return "Tudo certo por enquanto — revise o prédio quando tiver um minuto";
}

export default function HomeResumoPredio({ refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const pending = getPendenciasAbertas();
    const completedMonth = getPendenciasConcluidas().filter((p) => isThisMonth(p.completedAt));
    const staleSteps = pending.filter((p) => Date.now() - new Date(p.createdAt).getTime() > 14 * 86_400_000);
    const weekAgo = Date.now() - 7 * 86_400_000;
    const occurrenceWeek = getOcorrencias().filter((o) => new Date(o.createdAt).getTime() >= weekAgo);
    const health = computeCondominioHealth();
    const guidance = buildGuidanceItems(getMemoriaOperacional(), getProfile());
    const nextAttention = guidance[0]?.urgencyLabel ?? null;

    setSummary({
      status: health.status,
      pendingCount: pending.length,
      completedMonthCount: completedMonth.length,
      occurrenceWeekCount: occurrenceWeek.length,
      staleStepsCount: staleSteps.length,
      guidanceCount: guidance.length,
      nextAttention,
      mainLine: buildMainLineWithRoutine(
        pending.length,
        completedMonth.length,
        guidance.length,
        occurrenceWeek.length,
        staleSteps.length
      ),
    });
    setHydrated(true);

    if (!trackedRef.current) {
      trackedRef.current = true;
      void trackEvent("home_summary_viewed", {
        pending_count: pending.length,
        completed_month_count: completedMonth.length,
        occurrence_week_count: occurrenceWeek.length,
        stale_steps_count: staleSteps.length,
        has_guidance: guidance.length > 0,
        has_memoria: true,
      });
    }
  }, [refreshKey]);

  if (!hydrated || !summary) return null;

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/82 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Hoje no prédio
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-snug text-navy-800">
              {summary.mainLine}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-navy-50 px-2.5 py-1 text-[10.5px] font-medium text-navy-500">
            {statusLabel(summary.status)}
          </span>
        </div>

        {summary.guidanceCount > 0 ? (
          <p className="mt-2 text-[12px] leading-relaxed text-navy-500">
            Confira os alertas acima para os detalhes.
          </p>
        ) : (
          <p className="mt-2 text-[12px] leading-relaxed text-navy-500">
            Sem alertas ativos agora. Mantenha as datas essenciais atualizadas.
          </p>
        )}
      </div>
    </section>
  );
}
