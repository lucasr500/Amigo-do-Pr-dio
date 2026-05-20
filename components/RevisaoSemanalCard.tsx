"use client";

import { useEffect, useRef, useState } from "react";
import {
  completeWeeklyReview,
  getCurrentMonthKey,
  getCurrentWeekKey,
  getMemoriaOperacional,
  getOcorrencias,
  getPendenciasAbertas,
  getProfile,
  getRevisaoMensalHomeMeta,
  getSessionMeta,
  getWeeklyReviewState,
  hasMemoriaOperacional,
} from "@/lib/session";
import { buildGuidanceItems } from "@/lib/guidance";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  refreshKey?: number;
  onDone?: () => void;
};

type WeeklySummary = {
  weekKey: string;
  occurrenceCount: number;
  openStepsCount: number;
  staleStepsCount: number;
  guidanceCount: number;
  hasMonthlyReview: boolean;
  reviewedThisWeek: boolean;
};

function isDoneThisMonth(lastAt: string | null): boolean {
  if (!lastAt) return false;
  const last = new Date(lastAt);
  const now = new Date();
  return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
}

function isInMonthlyWindow(): boolean {
  const day = new Date().getDate();
  return day >= 1 && day <= 7;
}

function isStale(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > 14 * 86_400_000;
}

export default function RevisaoSemanalCard({ refreshKey, onDone }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasMemoriaOperacional()) {
      setSummary(null);
      setHydrated(true);
      return;
    }

    const weekKey = getCurrentWeekKey();
    const weeklyState = getWeeklyReviewState();
    const reviewedThisWeek = weeklyState.lastCompletedWeekKey === weekKey;
    const occurrences = getOcorrencias().filter((o) => getCurrentWeekKey(new Date(o.createdAt)) === weekKey);
    const openSteps = getPendenciasAbertas();
    const staleSteps = openSteps.filter((p) => isStale(p.createdAt));
    const guidance = buildGuidanceItems(getMemoriaOperacional(), getProfile());
    const monthKey = getCurrentMonthKey();
    const monthlyHomeMeta = getRevisaoMensalHomeMeta();
    const sessionMeta = getSessionMeta();
    const hasMonthlyReview =
      !isDoneThisMonth(sessionMeta.lastRevisaoMensalAt) &&
      (isInMonthlyWindow() || monthlyHomeMeta.seenMonthKey !== monthKey);

    const next: WeeklySummary = {
      weekKey,
      occurrenceCount: occurrences.length,
      openStepsCount: openSteps.length,
      staleStepsCount: staleSteps.length,
      guidanceCount: guidance.length,
      hasMonthlyReview,
      reviewedThisWeek,
    };

    setSummary(next);
    setHydrated(true);
    setJustCompleted(false);

    const hasUsefulSignal =
      next.occurrenceCount > 0 ||
      next.openStepsCount > 0 ||
      next.staleStepsCount > 0 ||
      next.guidanceCount > 0 ||
      next.hasMonthlyReview;

    if (!reviewedThisWeek && hasUsefulSignal && trackedRef.current !== weekKey) {
      trackedRef.current = weekKey;
      void trackEvent("weekly_review_viewed", {
        week_key: weekKey,
        occurrence_count: next.occurrenceCount,
        open_steps_count: next.openStepsCount,
        stale_steps_count: next.staleStepsCount,
        has_guidance: next.guidanceCount > 0,
        has_monthly_review: next.hasMonthlyReview,
      });
    }
  }, [refreshKey]);

  if (!hydrated || !summary) return null;

  const hasUsefulSignal =
    summary.occurrenceCount > 0 ||
    summary.openStepsCount > 0 ||
    summary.staleStepsCount > 0 ||
    summary.guidanceCount > 0 ||
    summary.hasMonthlyReview;

  if ((!hasUsefulSignal || summary.reviewedThisWeek) && !justCompleted) return null;

  const handleDone = () => {
    completeWeeklyReview(summary.weekKey);
    void trackEvent("weekly_review_completed", {
      week_key: summary.weekKey,
      occurrence_count: summary.occurrenceCount,
      open_steps_count: summary.openStepsCount,
      stale_steps_count: summary.staleStepsCount,
      has_guidance: summary.guidanceCount > 0,
      has_monthly_review: summary.hasMonthlyReview,
    });
    setSummary({ ...summary, reviewedThisWeek: true });
    setJustCompleted(true);
    onDone?.();
  };

  const indicators = [
    summary.occurrenceCount > 0
      ? `${summary.occurrenceCount} ocorrência${summary.occurrenceCount !== 1 ? "s" : ""} na semana`
      : null,
    summary.openStepsCount > 0
      ? `${summary.openStepsCount} próximo${summary.openStepsCount !== 1 ? "s" : ""} passo${summary.openStepsCount !== 1 ? "s" : ""} aberto${summary.openStepsCount !== 1 ? "s" : ""}`
      : null,
    summary.staleStepsCount > 0
      ? `${summary.staleStepsCount} parado${summary.staleStepsCount !== 1 ? "s" : ""} há mais de 14 dias`
      : null,
    summary.guidanceCount > 0
      ? `${summary.guidanceCount} alerta${summary.guidanceCount !== 1 ? "s" : ""} ativo${summary.guidanceCount !== 1 ? "s" : ""}`
      : null,
    summary.hasMonthlyReview ? "Revisão mensal disponível" : null,
  ].filter(Boolean).slice(0, 5);

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/82 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Revisão rápida da semana
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-snug text-navy-800">
              {justCompleted ? "Semana revisada" : "Veja se ficou algo parado antes que vire problema."}
            </p>
          </div>
          {justCompleted && (
            <span className="shrink-0 rounded-full bg-navy-50 px-2.5 py-1 text-[10.5px] font-medium text-navy-500">
              Concluída
            </span>
          )}
        </div>

        {!justCompleted && (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {indicators.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-500"
                >
                  {label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleDone}
              className="mt-3 inline-flex min-h-9 items-center rounded-full bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-cream-50 transition-all duration-200 hover:bg-navy-800 active:scale-[0.98]"
            >
              Revisar agora
            </button>
          </>
        )}

        {justCompleted && (
          <p className="mt-2 text-[12px] leading-relaxed text-navy-500">
            A revisão entrou no histórico operacional.
          </p>
        )}
      </div>
    </section>
  );
}
