"use client";

import { useEffect, useState } from "react";
import { getNewMilestones, MILESTONE_TEXT, type Milestone } from "@/lib/milestones";

type Props = {
  refreshKey?: number;
  onDismiss?: () => void;
};

export default function MilestoneCelebration({ refreshKey, onDismiss }: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const newOnes = getNewMilestones();
    if (newOnes.length > 0) {
      setMilestones(newOnes);
      setCurrent(0);
      setVisible(true);
    }
  }, [refreshKey]);

  if (!visible || milestones.length === 0) return null;

  const milestone = milestones[current];
  const text = MILESTONE_TEXT[milestone.id];
  if (!text) return null;

  const hasNext = current < milestones.length - 1;

  const handleNext = () => {
    if (hasNext) {
      setCurrent((c) => c + 1);
    } else {
      setVisible(false);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="relative overflow-hidden rounded-[18px] border border-teal-200/80 bg-gradient-to-br from-teal-50 to-emerald-50/60 px-4 py-4 shadow-card">
        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar"
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-teal-400 transition-colors hover:bg-teal-100 hover:text-teal-600"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Ícone */}
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-5 w-5 text-teal-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2l2.1 5.4H18l-4.5 3.4 1.7 5.3L10 13l-5.2 3.1 1.7-5.3L2 7.4h5.9L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal-600">
              Marco atingido{milestones.length > 1 ? ` · ${current + 1}/${milestones.length}` : ""}
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold leading-snug text-teal-900">
              {text.title}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-teal-700">
              {text.message}
            </p>
          </div>
        </div>

        {hasNext && (
          <button
            type="button"
            onClick={handleNext}
            className="mt-3 ml-[52px] inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.97]"
          >
            Ver próximo
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6h7M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
