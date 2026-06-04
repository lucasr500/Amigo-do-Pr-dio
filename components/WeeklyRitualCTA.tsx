"use client";

import { useEffect, useState } from "react";
import { getWeeklyReviewState, getCurrentWeekKey, hasMemoriaOperacional } from "@/lib/session";

type Props = {
  refreshKey?: number;
  onOpen?: () => void;
};

export default function WeeklyRitualCTA({ refreshKey, onOpen }: Props) {
  const [show, setShow] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hasMemoriaOperacional()) {
      setHydrated(true);
      return;
    }
    const weekly = getWeeklyReviewState();
    const weekKey = getCurrentWeekKey();
    const notDoneThisWeek = weekly.lastCompletedWeekKey !== weekKey;
    setShow(notDoneThisWeek);
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !show) return null;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-[16px] border border-teal-200/80 bg-teal-50/70 px-4 py-3.5 text-left transition-all hover:bg-teal-50 active:scale-[0.98]"
      >
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[15px]"
          aria-hidden="true"
        >
          📋
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-teal-800">Feche a revisão da semana</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-teal-600">
            Vale +10 pts no Health Score. Leva menos de 2 minutos.
          </p>
        </div>
        <svg
          className="h-4 w-4 flex-shrink-0 text-teal-400"
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
    </div>
  );
}
