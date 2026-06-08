"use client";

import { useMemo } from "react";
import { buildInstitutionalMemorySummary } from "@/lib/institutional-memory";
import type { AppTab } from "@/components/BottomNav";

type Props = {
  refreshKey?: number;
  onNavigateTab?: (tab: AppTab) => void;
  onNavigateToSection?: (sectionId: string) => void;
};

export default function InstitutionalMemoryCard({ refreshKey, onNavigateTab, onNavigateToSection }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = useMemo(() => buildInstitutionalMemorySummary(), [refreshKey]);

  const handleAction = () => {
    onNavigateTab?.("condominio");
    setTimeout(() => onNavigateToSection?.("memoria-institucional"), 80);
  };

  return (
    <div className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={handleAction}
        className="flex w-full items-start gap-3 rounded-xl border border-navy-100/80 bg-white/[0.82] px-4 py-3.5 text-left shadow-card transition-all hover:border-navy-200 hover:bg-white active:scale-[0.98]"
      >
        {/* Ícone */}
        <span
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50"
          aria-hidden="true"
        >
          <svg className="h-[18px] w-[18px] text-navy-600" viewBox="0 0 18 18" fill="none">
            <path d="M3 9a6 6 0 1 0 12 0A6 6 0 0 0 3 9z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9 6v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400">
            Memória institucional
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-navy-800">
            {summary.highlight}
          </p>

          {summary.lastActivityDate && (
            <p className="mt-0.5 text-[11px] text-navy-400">
              Último registro:{" "}
              {new Date(`${summary.lastActivityDate}T12:00:00`).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}

          {summary.hasData ? (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {summary.decisionCount > 0 && (
                <span className="text-[10.5px] text-navy-500">
                  {summary.decisionCount} decisão{summary.decisionCount !== 1 ? "ões" : ""}
                </span>
              )}
              {summary.supplierCount > 0 && (
                <span className="text-[10.5px] text-navy-500">
                  {summary.supplierCount} fornecedor{summary.supplierCount !== 1 ? "es" : ""}
                </span>
              )}
              {summary.monthlyReviewCount > 0 && (
                <span className="text-[10.5px] text-navy-500">
                  {summary.monthlyReviewCount} revisão{summary.monthlyReviewCount !== 1 ? "ões" : ""}
                </span>
              )}
              {summary.timelineEventCount > 0 && (
                <span className="text-[10.5px] text-navy-500">
                  {summary.timelineEventCount} evento{summary.timelineEventCount !== 1 ? "s" : ""} na timeline
                </span>
              )}
            </div>
          ) : (
            summary.nextStep && (
              <p className="mt-0.5 text-[11px] text-navy-400">{summary.nextStep}</p>
            )
          )}
        </div>

        <svg
          className="mt-1 h-4 w-4 flex-shrink-0 text-navy-300"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
