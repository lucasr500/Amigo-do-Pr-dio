"use client";

import { useMemo } from "react";
import { buildRecentActivitySummary, type ActivityItem } from "@/lib/recent-activity";

type Props = {
  refreshKey?: number;
};

const TYPE_ICON: Record<ActivityItem["type"], React.ReactNode> = {
  pendencia: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  agenda: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 5.5h10M5 2v1.5M9 2v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  saude: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7.5L4.5 10l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  backup: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v8M7 10L4.5 7.5M7 10l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  revisao: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  documento: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 2h5l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  outro: (
    <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 5v2.5M7 9v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

export default function RecentActivityCard({ refreshKey }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = useMemo(() => buildRecentActivitySummary(), [refreshKey]);

  // Primeira visita → não mostrar
  if (summary.isFirstVisit) return null;
  // Sem atividade → não mostrar
  if (!summary.hasActivity) return null;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-navy-100/80 bg-white/[0.72] shadow-card">
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400 mb-2">
            {summary.sinceLabel}
          </p>
          <div className="space-y-1.5">
            {summary.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <span className="flex-shrink-0 text-navy-400">
                  {TYPE_ICON[item.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-navy-700 leading-snug">
                    {item.label}
                    {item.detail && (
                      <span className="text-navy-400"> — {item.detail}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
