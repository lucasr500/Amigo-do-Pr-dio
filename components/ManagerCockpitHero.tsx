"use client";

import { useEffect, useState } from "react";
import type { AppTab } from "@/components/BottomNav";
import type { CentralSectionId } from "@/lib/visibility-guards";
import { computeHealthScore } from "@/lib/health-score";
import { buildGuidanceEngine, type GuidanceEngineItem } from "@/lib/guidance-engine";
import { currentMonthKey, getFinancialSummary } from "@/lib/financial";
import { getRecentDecisions, type Decision } from "@/lib/decisions";

type Props = {
  refreshKey: number;
  condoName: string;
  urgentCount: number;
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSubView: (view: "saude" | "pendencias") => void;
  onNavigateToSection?: (sectionId: string, centralSection?: CentralSectionId) => void;
};

type CockpitState = {
  score: number;
  diagnostic: string;
  bottleneck: string;
  topRisk: GuidanceEngineItem | null;
  guidanceCount: number;
  balance: number;
  revenue: number;
  expenses: number;
  delinquency?: number;
  decisions: Decision[];
};

function money(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function Ring({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="relative h-[92px] w-[92px]" aria-label={`Saúde operacional ${value}%`}>
      <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="46" cy="46" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" />
        <circle
          cx="46"
          cy="46"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-sage-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[24px] font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone = "light" }: { label: string; value: string; tone?: "light" | "attention" | "success" }) {
  const cls = tone === "attention"
    ? "border-amber-300/20 bg-amber-300/10 text-amber-50"
    : tone === "success"
      ? "border-sage-300/20 bg-sage-300/10 text-sage-50"
      : "border-white/10 bg-white/[0.07] text-cream-50";
  return (
    <div className={`rounded-2xl border px-3 py-3 ${cls}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-60">{label}</p>
      <p className="mt-1 text-[15px] font-semibold leading-tight">{value}</p>
    </div>
  );
}

export default function ManagerCockpitHero({
  refreshKey,
  condoName,
  urgentCount,
  onNavigateTab,
  onNavigateToSubView,
  onNavigateToSection,
}: Props) {
  const [state, setState] = useState<CockpitState | null>(null);

  useEffect(() => {
    const health = computeHealthScore();
    const guidance = buildGuidanceEngine();
    const fin = getFinancialSummary(currentMonthKey());
    setState({
      score: health.percentage,
      diagnostic: health.diagnosticPhrase,
      bottleneck: health.biggestBottleneck,
      topRisk: guidance.topRisco,
      guidanceCount: guidance.items.length,
      balance: fin.estimatedBalance,
      revenue: fin.totalReceitas,
      expenses: fin.totalDespesas,
      delinquency: fin.delinquencyRate,
      decisions: getRecentDecisions(3).filter((d) => d.status === "em_execucao" || d.status === "registrada"),
    });
  }, [refreshKey]);

  if (!state) return null;

  return (
    <section className="px-5 pb-4 sm:px-6">
      <div className="relative overflow-hidden rounded-[28px] bg-navy-950 px-4 py-5 text-cream-50 shadow-elevated sm:px-6">
        <div className="absolute right-[-7rem] top-[-9rem] h-64 w-64 rounded-full bg-navy-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[-8rem] left-[-7rem] h-56 w-56 rounded-full bg-sage-400/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream-100/50">Cockpit de gestão</p>
              <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight text-white">
                {condoName || "Visão do condomínio"}
              </h2>
              <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-cream-100/68">
                Resumo executivo do que merece atenção agora, com dados locais do prédio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToSubView("saude")}
              className="self-start rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-2 text-[12px] font-semibold text-cream-50 transition-colors hover:bg-white/[0.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-50/50"
            >
              Ver saúde
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <button
              type="button"
              onClick={() => onNavigateToSubView("saude")}
              className="rounded-[24px] border border-white/10 bg-white/[0.07] p-4 text-left transition-colors hover:bg-white/[0.10] focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-50/50"
            >
              <div className="flex items-center gap-4">
                <Ring value={state.score} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-100/72">HealthScore</p>
                  <p className="mt-1 text-[17px] font-semibold leading-snug text-white">{state.diagnostic}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-cream-100/54">
                    Principal fator: {state.bottleneck}. Índice auxiliar; não indica conformidade legal ou contábil.
                  </p>
                </div>
              </div>
            </button>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => onNavigateToSubView("pendencias")}
                className="rounded-[22px] border border-terracotta-300/20 bg-terracotta-300/10 px-4 py-3 text-left transition-colors hover:bg-terracotta-300/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-50/50"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-terracotta-100/70">Riscos ativos</p>
                <p className="mt-1 text-[20px] font-semibold text-white">
                  {urgentCount > 0 ? `${urgentCount} pendência${urgentCount !== 1 ? "s" : ""}` : `${state.guidanceCount} orientação${state.guidanceCount !== 1 ? "ões" : ""}`}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-cream-100/60">
                  {state.topRisk?.proximoPasso ?? "Acompanhe prazos, documentos e próximos passos operacionais."}
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToSection) onNavigateToSection("memoria-institucional");
                  else onNavigateTab("memoria");
                }}
                className="rounded-[22px] border border-white/10 bg-white/[0.07] px-4 py-3 text-left transition-colors hover:bg-white/[0.10] focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-50/50"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cream-100/50">Decisões em curso</p>
                <p className="mt-1 text-[15px] font-semibold text-white">
                  {state.decisions[0]?.title ?? "Nenhuma decisão em execução"}
                </p>
                <p className="mt-1 text-[12px] text-cream-100/56">
                  {state.decisions.length > 0 ? `${state.decisions.length} registro${state.decisions.length !== 1 ? "s" : ""} para acompanhar.` : "Registre decisões para dar ciclo de vida à governança."}
                </p>
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniMetric label="Saldo" value={money(state.balance)} tone={state.balance < 0 ? "attention" : "success"} />
            <MiniMetric label="Receitas" value={money(state.revenue)} />
            <MiniMetric label="Despesas" value={money(state.expenses)} tone={state.expenses > state.revenue && state.revenue > 0 ? "attention" : "light"} />
            <MiniMetric label="Inadimplência" value={state.delinquency !== undefined ? `${state.delinquency}%` : "Sem dado"} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {([
              { label: "Comunicação", target: "central-digital", central: "hub" as CentralSectionId },
              { label: "Documentos", target: "documentos" },
              { label: "Financeiro", target: "financeiro" },
              { label: "Memória", target: "memoria-institucional" },
            ]).map(({ label, target, central }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (onNavigateToSection) onNavigateToSection(target, central);
                  else onNavigateTab("memoria");
                }}
                className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold text-cream-50 transition-colors hover:bg-white/[0.10] focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-50/50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
