"use client";

import { useMemo } from "react";
import { buildDailyBriefing, type BriefingUrgency } from "@/lib/daily-briefing";

type Props = {
  refreshKey?: number;
};

const URGENCY_BAR: Record<BriefingUrgency, string> = {
  critico:    "bg-terracotta-500",
  atencao:    "bg-amber-400",
  informacao: "bg-navy-300",
  neutro:     "bg-sage-400",
};

const URGENCY_BG: Record<BriefingUrgency, string> = {
  critico:    "bg-terracotta-50/70 border-terracotta-200/80",
  atencao:    "bg-amber-50/70 border-amber-200/80",
  informacao: "bg-white/[0.82] border-navy-100/80",
  neutro:     "bg-sage-50/60 border-sage-200/70",
};

const URGENCY_HEADLINE: Record<BriefingUrgency, string> = {
  critico:    "text-terracotta-800",
  atencao:    "text-amber-900",
  informacao: "text-navy-700",
  neutro:     "text-navy-600",
};

const LINE_URGENCY_DOT: Record<BriefingUrgency, string> = {
  critico:    "bg-terracotta-500",
  atencao:    "bg-amber-400",
  informacao: "bg-navy-300",
  neutro:     "bg-navy-200",
};

const LINE_TEXT: Record<BriefingUrgency, string> = {
  critico:    "text-terracotta-800",
  atencao:    "text-amber-800",
  informacao: "text-navy-700",
  neutro:     "text-navy-500",
};

export default function DailyBriefingCard({ refreshKey }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const briefing = useMemo(() => buildDailyBriefing(), [refreshKey]);

  if (!briefing.hasData) return null;
  if (briefing.lines.length === 0) return null;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className={`overflow-hidden rounded-xl border shadow-card ${URGENCY_BG[briefing.urgency]}`}>
        {/* Barra de urgência */}
        <div className={`h-0.5 w-full ${URGENCY_BAR[briefing.urgency]}`} />

        <div className="px-4 py-3.5">
          {/* Headline */}
          <p className={`text-[11px] font-semibold uppercase tracking-[0.10em] mb-2 ${URGENCY_HEADLINE[briefing.urgency]}`}>
            {briefing.headline}
          </p>

          {/* Lines */}
          <div className="space-y-1.5">
            {briefing.lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${LINE_URGENCY_DOT[line.urgency]}`}
                  aria-hidden="true"
                />
                <p className={`text-[12.5px] leading-snug ${LINE_TEXT[line.urgency]}`}>
                  {line.text}
                </p>
              </div>
            ))}
          </div>

          {/* Ação primária */}
          {briefing.primaryAction && (
            <p className={`mt-2.5 text-[11.5px] font-semibold ${URGENCY_HEADLINE[briefing.urgency]}`}>
              → {briefing.primaryAction}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
