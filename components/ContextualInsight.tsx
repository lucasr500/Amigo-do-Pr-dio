"use client";

import { useEffect, useState } from "react";
import {
  getMemoriaOperacional,
  getProfile,
  hasMemoriaOperacional,
  computeCondominioHealth,
  getResolutionEvents,
} from "@/lib/session";
import { buildInsight, InsightItem, InsightTone } from "@/lib/insights";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  refreshKey?: number;
};

const TONE_STYLE: Record<InsightTone, { container: string; text: string; sub: string }> = {
  stable:   { container: "bg-sage-50/60",  text: "text-sage-700",  sub: "text-sage-500"  },
  positive: { container: "bg-sage-50/70",  text: "text-sage-800",  sub: "text-sage-600"  },
  notice:   { container: "bg-navy-50/50",  text: "text-navy-600",  sub: "text-navy-400"  },
  upcoming: { container: "bg-amber-50/60", text: "text-amber-800", sub: "text-amber-600" },
};

export default function ContextualInsight({ refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [insight, setInsight] = useState<InsightItem | null>(null);

  useEffect(() => {
    if (!hasMemoriaOperacional()) {
      setHydrated(true);
      return;
    }

    const m = getMemoriaOperacional();
    const profile = getProfile();
    const health = computeCondominioHealth();
    const events = getResolutionEvents();

    const built = buildInsight(m, profile, health, events);
    setInsight(built);
    setHydrated(true);

    if (built) {
      void trackEvent("insight_shown", { id: built.id, tone: built.tone });
    }
  }, [refreshKey]);

  if (!hydrated || !insight) return null;

  const t = TONE_STYLE[insight.tone];

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className={`rounded-xl px-4 py-3 ${t.container}`}>
        <div className="flex items-start gap-2.5">
          {insight.icon && (
            <span
              className={`flex-shrink-0 text-[12px] leading-[1.6] ${t.text}`}
              aria-hidden="true"
            >
              {insight.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className={`text-[12px] leading-relaxed ${t.text}`}>
              {insight.text}
            </p>
            {insight.subtext && (
              <p className={`mt-0.5 text-[10.5px] ${t.sub}`}>
                {insight.subtext}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
