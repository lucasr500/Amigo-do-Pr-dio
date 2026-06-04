"use client";

import { useEffect, useState } from "react";
import { computeHabitScore, type HabitScore } from "@/lib/session";

const TIER_LABEL: Record<HabitScore["tier"], string> = {
  new:      "Explorando",
  exploring:"Descobrindo",
  forming:  "Organizando",
  habitual: "Consistente",
  power:    "Gestão Ativa",
};

const TIER_COLOR: Record<HabitScore["tier"], string> = {
  new:      "text-navy-400",
  exploring:"text-teal-600",
  forming:  "text-teal-700",
  habitual: "text-navy-700",
  power:    "text-navy-800",
};

const TIER_BG: Record<HabitScore["tier"], string> = {
  new:      "bg-navy-50",
  exploring:"bg-teal-50",
  forming:  "bg-teal-50",
  habitual: "bg-navy-50",
  power:    "bg-navy-100/60",
};

export default function HabitScoreCard() {
  const [habit, setHabit] = useState<HabitScore | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHabit(computeHabitScore());
    setHydrated(true);
  }, []);

  if (!hydrated || !habit || habit.score === 0) return null;

  const pct = Math.round((habit.score / habit.maxScore) * 100);

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className={`rounded-[18px] border border-navy-100/60 px-4 py-3.5 ${TIER_BG[habit.tier]}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
              Nível de uso
            </p>
            <p className={`mt-0.5 text-[15px] font-bold leading-tight ${TIER_COLOR[habit.tier]}`}>
              {TIER_LABEL[habit.tier]}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-navy-500">
              {habit.nextMilestone}
            </p>
          </div>

          {/* Progress ring */}
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
            <svg className="absolute inset-0 h-12 w-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="19" stroke="#e5e7eb" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="19"
                stroke={habit.tier === "power" ? "#234B63" : habit.tier === "habitual" ? "#234B63" : "#0d9488"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 19}`}
                strokeDashoffset={`${2 * Math.PI * 19 * (1 - pct / 100)}`}
                transform="rotate(-90 24 24)"
              />
            </svg>
            <span className="relative z-10 text-[10px] font-bold text-navy-700">{habit.score}/{habit.maxScore}</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: habit.maxScore }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < habit.score
                  ? habit.tier === "power" || habit.tier === "habitual"
                    ? "bg-navy-600"
                    : "bg-teal-500"
                  : "bg-navy-100"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
