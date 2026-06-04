"use client";

import { useEffect, useState } from "react";
import { computeFinancialHealth, formatBRL, formatCaixaMeses, type FinancialHealth } from "@/lib/financial-health";

const STATUS_BG: Record<string, string> = {
  saudavel:  "border-teal-200/70 bg-teal-50/60",
  atencao:   "border-amber-200/70 bg-amber-50/60",
  critico:   "border-terracotta-200/70 bg-terracotta-50/60",
  sem_dados: "border-navy-100/60 bg-white/80",
};

const STATUS_DOT: Record<string, string> = {
  saudavel:  "bg-teal-500",
  atencao:   "bg-amber-400",
  critico:   "bg-terracotta-500",
  sem_dados: "bg-navy-300",
};

const STATUS_LABEL: Record<string, string> = {
  saudavel:  "Saudável",
  atencao:   "Atenção",
  critico:   "Crítico",
  sem_dados: "Sem dados",
};

const TENDENCIA_LABEL: Record<string, string> = {
  subindo:   "↑ Subindo",
  estavel:   "→ Estável",
  caindo:    "↓ Caindo",
  indefinido: "— Indefinido",
};

const TENDENCIA_COLOR: Record<string, string> = {
  subindo:   "text-teal-600",
  estavel:   "text-navy-500",
  caindo:    "text-terracotta-600",
  indefinido: "text-navy-400",
};

type Props = {
  refreshKey?: number;
  onNavigateToFinanceiro?: () => void;
};

export default function FinancialHealthCard({ refreshKey, onNavigateToFinanceiro }: Props) {
  const [health,   setHealth]   = useState<FinancialHealth | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHealth(computeFinancialHealth());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="h-24 animate-pulse rounded-[18px] bg-navy-50/80" />
      </section>
    );
  }

  if (!health) return null;

  if (!health.hasData) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <button
          type="button"
          onClick={onNavigateToFinanceiro}
          disabled={!onNavigateToFinanceiro}
          className="flex w-full items-center gap-3 rounded-[18px] border border-navy-100/60 bg-white/80 px-4 py-4 text-left shadow-card transition-all hover:shadow-card-md active:scale-[0.99]"
        >
          <span className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full border-4 border-navy-100 text-[22px]" aria-hidden="true">
            💰
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-navy-800">Saúde financeira</p>
            <p className="mt-0.5 text-[12px] leading-snug text-navy-400">
              Registre receitas e despesas para ativar o monitoramento financeiro.
            </p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>
    );
  }

  const bgClass  = STATUS_BG[health.status];
  const dotColor = STATUS_DOT[health.status];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onNavigateToFinanceiro}
        disabled={!onNavigateToFinanceiro}
        className={`flex w-full flex-col rounded-[18px] border px-4 py-4 text-left shadow-card transition-all hover:shadow-card-md active:scale-[0.99] ${bgClass}`}
      >
        {/* Linha 1: status + score */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 58 58" fill="none" aria-hidden="true">
              <circle cx="29" cy="29" r="23" stroke="#e5e7eb" strokeWidth="5" />
              <circle
                cx="29" cy="29" r="23"
                stroke={health.status === "saudavel" ? "#0d9488" : health.status === "atencao" ? "#d97706" : "#dc6b4a"}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 23}`}
                strokeDashoffset={`${2 * Math.PI * 23 * (1 - health.score / 100)}`}
                transform="rotate(-90 29 29)"
              />
            </svg>
            <span className="relative z-10 text-[12px] font-bold leading-none text-navy-800">
              {health.score}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
              <p className="text-[14px] font-semibold text-navy-800">
                Saúde financeira · {STATUS_LABEL[health.status]}
              </p>
            </div>
            <p className={`mt-0.5 text-[11.5px] font-medium ${TENDENCIA_COLOR[health.tendencia]}`}>
              {TENDENCIA_LABEL[health.tendencia]}
            </p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Linha 2: métricas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/70 px-2.5 py-2 text-center">
            <p className="text-[13px] font-bold leading-none text-navy-800">
              {formatBRL(health.saldoAtual)}
            </p>
            <p className="mt-0.5 text-[9.5px] text-navy-400">saldo</p>
          </div>
          <div className="rounded-xl bg-white/70 px-2.5 py-2 text-center">
            <p className="text-[13px] font-bold leading-none text-teal-700">
              +{formatBRL(health.receitas30d)}
            </p>
            <p className="mt-0.5 text-[9.5px] text-navy-400">rec. 30d</p>
          </div>
          <div className="rounded-xl bg-white/70 px-2.5 py-2 text-center">
            <p className="text-[13px] font-bold leading-none text-terracotta-700">
              -{formatBRL(health.despesas30d)}
            </p>
            <p className="mt-0.5 text-[9.5px] text-navy-400">desp. 30d</p>
          </div>
        </div>

        {/* Linha 3: caixa + problema */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[10.5px] font-medium text-navy-600">
            {formatCaixaMeses(health.caixaMeses)} de caixa
          </span>
          {health.principalProblema && (
            <span className="text-[10.5px] leading-snug text-navy-500 min-w-0 truncate">
              {health.principalProblema}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-[10px] text-navy-400">
          Estimativa baseada nos registros do app. Não substitui contabilidade formal.
        </p>
      </button>
    </section>
  );
}
