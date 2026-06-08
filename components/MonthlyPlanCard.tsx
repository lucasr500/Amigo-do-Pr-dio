"use client";

import { useEffect, useState } from "react";
import type { AppTab } from "@/components/BottomNav";
import { buildMonthlyPlan, type MonthlyPlan, type MonthlyPlanTarget } from "@/lib/monthly-plan";

type Props = {
  refreshKey: number;
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSubView: (view: "saude" | "pendencias") => void;
  onNavigateToSection?: (sectionId: string) => void;
  onOpenMonthlyReview: () => void;
};

const SLOT_LABEL: Record<MonthlyPlan["items"][number]["slot"], string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
};

const DOT_CLASS: Record<MonthlyPlan["items"][number]["urgency"], string> = {
  critico: "bg-terracotta-500",
  atencao: "bg-amber-400",
  rotina: "bg-sage-500",
};

function targetLabel(target: MonthlyPlanTarget): string {
  const labels: Record<MonthlyPlanTarget, string> = {
    pendencias: "Ver pendências",
    financeiro: "Ver financeiro",
    documentos: "Ver documentos",
    backup: "Ver backup",
    "monthly-review": "Revisão mensal",
    agenda: "Ver agenda",
    guidance: "Ver Guidance",
    decisions: "Ver decisões",
  };
  return labels[target];
}

export default function MonthlyPlanCard({
  refreshKey,
  onNavigateTab,
  onNavigateToSubView,
  onNavigateToSection,
  onOpenMonthlyReview,
}: Props) {
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);

  useEffect(() => {
    setPlan(buildMonthlyPlan());
  }, [refreshKey]);

  if (!plan) return null;

  const go = (target: MonthlyPlanTarget) => {
    if (target === "pendencias") {
      onNavigateToSubView("pendencias");
      return;
    }
    if (target === "agenda") {
      onNavigateTab("agenda");
      return;
    }
    if (target === "guidance") {
      onNavigateTab("inicio");
      return;
    }
    if (target === "monthly-review") {
      onOpenMonthlyReview();
      return;
    }
    if (target === "decisions") {
      onNavigateToSection?.("memoria-institucional");
      return;
    }
    if (target === "financeiro") {
      onNavigateToSection?.("financeiro");
      return;
    }
    if (target === "documentos") {
      onNavigateToSection?.("documentos");
      return;
    }
    if (target === "backup") {
      onNavigateToSection?.("dados");
      return;
    }
    onNavigateTab("condominio");
  };

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="rounded-[24px] border border-navy-100/80 bg-white/[0.88] px-4 py-4 shadow-card-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sage-700">Rotina de retorno</p>
            <h2 className="mt-1 font-display text-[20px] font-semibold text-navy-900">{plan.title}</h2>
            <p className="mt-1 max-w-[420px] text-[12px] leading-relaxed text-navy-500">{plan.subtitle}</p>
          </div>
          {plan.alerts.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-semibold text-amber-800">
              {plan.alerts.length} alerta{plan.alerts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-3 grid gap-2">
          {plan.items.map((item) => (
            <button
              key={item.slot}
              type="button"
              onClick={() => go(item.target)}
              className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-navy-100/70 bg-cream-50/60 px-3 py-3 text-left transition-colors hover:bg-white active:scale-[0.99]"
            >
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${DOT_CLASS[item.urgency]}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                  {SLOT_LABEL[item.slot]}
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-navy-800">
                  {item.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-navy-500">
                  {item.reason}
                </span>
              </span>
              <span className="hidden flex-shrink-0 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-navy-500 sm:inline-flex">
                {targetLabel(item.target)}
              </span>
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        <p className="mt-3 text-[10.5px] leading-relaxed text-navy-400">
          Alertas locais calculados neste dispositivo. Não são notificações externas nem substituem conferência profissional.
        </p>
      </div>
    </section>
  );
}
