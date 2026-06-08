"use client";

import { useMemo } from "react";
import { buildFinancialChartData } from "@/lib/financial-chart";

function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`;
  return `R$${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type Props = {
  refreshKey?: number;
};

const CHART_HEIGHT = 72; // px para as barras
const BAR_W = 10;        // largura fixa de cada barra
const GAP   = 6;         // gap entre par de barras

export default function FinancialMonthlyChart({ refreshKey }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => buildFinancialChartData(6), [refreshKey]);

  if (!data.hasAnyData) {
    return (
      <div className="px-5 pb-3 sm:px-6">
        <div className="rounded-xl border border-navy-100/80 bg-white/[0.86] px-4 py-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400 mb-1">
            Evolução financeira
          </p>
          <p className="text-[12px] text-navy-400">
            Adicione lançamentos financeiros para ver a evolução mensal.
          </p>
        </div>
      </div>
    );
  }

  const max = data.maxAbsValue || 1;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-navy-100/80 bg-white/[0.86] shadow-card">
        <div className="px-4 pt-3.5 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400 mb-3">
            Evolução financeira — últimos meses
          </p>

          {/* Gráfico SVG */}
          <div className="overflow-x-auto">
            <div className="flex items-end gap-4 pb-1" style={{ minWidth: data.bars.length * 52 }}>
              {data.bars.map((bar) => {
                const recH = Math.max(2, Math.round((bar.receitas / max) * CHART_HEIGHT));
                const desH = Math.max(2, Math.round((bar.despesas / max) * CHART_HEIGHT));
                const isCurrent = bar.month === data.currentMonth;

                return (
                  <div key={bar.month} className="flex flex-col items-center gap-1.5 flex-1">
                    {/* Barra SVG */}
                    <svg
                      width={BAR_W * 2 + GAP}
                      height={CHART_HEIGHT + 4}
                      viewBox={`0 0 ${BAR_W * 2 + GAP} ${CHART_HEIGHT + 4}`}
                      aria-label={`${bar.monthLabel}: receitas ${formatMoneyCompact(bar.receitas)}, despesas ${formatMoneyCompact(bar.despesas)}`}
                    >
                      {/* Barra receitas (verde/sage) */}
                      <rect
                        x={0}
                        y={CHART_HEIGHT + 2 - recH}
                        width={BAR_W}
                        height={recH}
                        rx={2}
                        fill={isCurrent ? "#5d8a6a" : "#9dbfab"}
                        opacity={bar.hasData ? 1 : 0.3}
                      />
                      {/* Barra despesas (terracotta) */}
                      <rect
                        x={BAR_W + GAP}
                        y={CHART_HEIGHT + 2 - desH}
                        width={BAR_W}
                        height={desH}
                        rx={2}
                        fill={isCurrent ? "#c1654a" : "#d9a090"}
                        opacity={bar.hasData ? 1 : 0.3}
                      />
                    </svg>

                    {/* Label do mês */}
                    <p className={`text-[9.5px] text-center leading-none whitespace-nowrap
                      ${isCurrent ? "font-semibold text-navy-700" : "text-navy-400"}
                    `}>
                      {bar.monthLabel}
                    </p>

                    {/* Saldo */}
                    {bar.hasData && (
                      <p className={`text-[9px] text-center leading-none whitespace-nowrap font-medium
                        ${bar.saldo >= 0 ? "text-sage-700" : "text-terracotta-600"}
                      `}>
                        {bar.saldo >= 0 ? "+" : ""}{formatMoneyCompact(bar.saldo)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-2.5 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-sage-500" aria-hidden="true" />
              <p className="text-[10px] text-navy-400">Receitas</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-terracotta-400" aria-hidden="true" />
              <p className="text-[10px] text-navy-400">Despesas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
