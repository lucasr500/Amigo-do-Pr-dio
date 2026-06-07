"use client";

import { useState, useEffect } from "react";
import {
  buildAnnualBudgetProjection, detectFinancialAnomalies, estimateCotaAdjustment,
  buildFinancialIntelligenceReport,
  type AnnualBudgetProjection, type FinancialAnomaly, type CotaAdjustmentEstimate,
} from "@/lib/financial-intelligence";
import { getProfile } from "@/lib/session";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TREND_ICON = { up: "↑", down: "↓", stable: "→", unknown: "–" };
const TREND_COLOR = { up: "text-terracotta-600", down: "text-green-600", stable: "text-navy-400", unknown: "text-navy-300" };

export default function FinancialIntelligencePanel() {
  const [projection, setProjection] = useState<AnnualBudgetProjection | null>(null);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [cotaEstimate, setCotaEstimate] = useState<CotaAdjustmentEstimate | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAllLines, setShowAllLines] = useState(false);

  useEffect(() => {
    const proj = buildAnnualBudgetProjection();
    const anom = detectFinancialAnomalies();
    const profile = getProfile();
    const cota = estimateCotaAdjustment(proj, profile?.numUnidades);
    setProjection(proj);
    setAnomalies(anom);
    setCotaEstimate(cota);
  }, []);

  const handleCopy = () => {
    if (!projection || !cotaEstimate) return;
    const report = buildFinancialIntelligenceReport(projection, anomalies, cotaEstimate);
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const noData = !projection || projection.basedOnMonths === 0;

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Análise automática</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Inteligência Financeira</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              Projeção orçamentária, anomalias e estimativa de reajuste de cota — tudo baseado nos balancetes registrados.
            </p>
          </div>
          {!noData && (
            <button type="button" onClick={handleCopy}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full border border-navy-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
              {copied ? "Copiado!" : "Exportar"}
            </button>
          )}
        </div>
      </div>

      {/* Sem dados */}
      {noData && (
        <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-navy-600 mb-1">Nenhum balancete registrado</p>
          <p className="text-[11.5px] text-navy-400 leading-relaxed">
            Registre pelo menos 3 meses de lançamentos financeiros para gerar projeções e detectar anomalias.
          </p>
        </div>
      )}

      {projection && projection.basedOnMonths > 0 && (
        <>
          {/* Resumo projeção */}
          <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
            <div className="px-5 pt-4 pb-3">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400 mb-3">
                Projeção anual — {projection.basedOnMonths} {projection.basedOnMonths === 1 ? "mês" : "meses"} de dados
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Despesas/mês", value: fmtBRL(projection.totalMonthlyExpenses) },
                  { label: "Receitas/mês", value: fmtBRL(projection.totalMonthlyRevenue) },
                  {
                    label: "Resultado/mês",
                    value: fmtBRL(projection.totalMonthlyRevenue - projection.totalMonthlyExpenses),
                    highlight: projection.totalMonthlyRevenue >= projection.totalMonthlyExpenses ? "text-green-600" : "text-terracotta-600",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-navy-50/50 p-2.5 text-center">
                    <p className="text-[10px] text-navy-400 mb-0.5">{item.label}</p>
                    <p className={`text-[12px] font-semibold ${item.highlight ?? "text-navy-800"}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Despesas anuais", value: fmtBRL(projection.projectedAnnualExpenses) },
                  { label: "Receitas anuais", value: fmtBRL(projection.projectedAnnualRevenue) },
                  {
                    label: "Resultado anual",
                    value: fmtBRL(projection.projectedAnnualResult),
                    highlight: projection.projectedAnnualResult >= 0 ? "text-green-600" : "text-terracotta-600",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-navy-50/30 p-2.5 text-center">
                    <p className="text-[10px] text-navy-400 mb-0.5">{item.label}</p>
                    <p className={`text-[12px] font-semibold ${item.highlight ?? "text-navy-800"}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhamento por categoria */}
            {projection.lines.length > 0 && (
              <div className="border-t border-navy-50 px-5 pb-3 pt-3">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-2">Despesas por categoria</p>
                <div className="space-y-2">
                  {(showAllLines ? projection.lines : projection.lines.slice(0, 5)).map((line) => (
                    <div key={line.category} className="flex items-center gap-2">
                      <span className={`w-3 text-[10px] font-medium flex-shrink-0 ${TREND_COLOR[line.trend]}`}>
                        {TREND_ICON[line.trend]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11.5px] text-navy-700 truncate">{line.category}</span>
                          <span className="flex-shrink-0 text-[11.5px] font-medium text-navy-800">{fmtBRL(line.average)}</span>
                        </div>
                        <div className="mt-0.5 h-1 rounded-full bg-navy-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-navy-300"
                            style={{ width: `${Math.min(100, (line.average / projection.totalMonthlyExpenses) * 100)}%` }}
                          />
                        </div>
                      </div>
                      {line.anomalyMonths.length > 0 && (
                        <span className="flex-shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">
                          var.
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {projection.lines.length > 5 && (
                  <button type="button" onClick={() => setShowAllLines((v) => !v)}
                    className="mt-2 text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                    {showAllLines ? "Mostrar menos" : `Ver mais ${projection.lines.length - 5} categorias`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reajuste de cota */}
          {cotaEstimate && (
            <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400 mb-2">Estimativa de reajuste de cota</p>
                <div className={`rounded-xl p-3 ${cotaEstimate.gap > 0 ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}>
                  <p className={`text-[12.5px] font-medium ${cotaEstimate.gap > 0 ? "text-amber-800" : "text-green-800"}`}>
                    {cotaEstimate.recommendation}
                  </p>
                  {cotaEstimate.adjustmentPct > 0 && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[11px] text-amber-700">
                        Reajuste estimado: <strong>{cotaEstimate.adjustmentPct.toFixed(1)}%</strong>
                      </p>
                      {cotaEstimate.adjustmentPerUnit !== undefined && (
                        <p className="text-[11px] text-amber-700">
                          Por unidade: <strong>{fmtBRL(cotaEstimate.adjustmentPerUnit)}/mês</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[10.5px] text-navy-400">
                  Baseado em {cotaEstimate.basedOnMonths} meses de dados. Não substitui análise da administradora.
                </p>
              </div>
            </div>
          )}

          {/* Anomalias */}
          {anomalies.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400 mb-2.5">
                  Anomalias detectadas ({anomalies.length})
                </p>
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div key={i} className={`rounded-xl p-2.5 ${a.severity === "critical" ? "bg-red-50 border border-red-100" : a.severity === "warning" ? "bg-amber-50 border border-amber-100" : "bg-navy-50 border border-navy-100"}`}>
                      <div className="flex items-start gap-2">
                        <span className={`text-[11px] font-bold flex-shrink-0 ${a.severity === "critical" ? "text-red-500" : a.severity === "warning" ? "text-amber-500" : "text-navy-400"}`}>
                          {a.severity === "critical" ? "⚠" : "△"}
                        </span>
                        <p className={`text-[11.5px] leading-relaxed ${a.severity === "critical" ? "text-red-800" : a.severity === "warning" ? "text-amber-800" : "text-navy-700"}`}>
                          {a.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {anomalies.length === 0 && projection.basedOnMonths >= 3 && (
            <div className="rounded-2xl border border-green-100 bg-green-50/60 px-5 py-3">
              <p className="text-[12px] font-medium text-green-700">Nenhuma anomalia financeira detectada nos dados registrados.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
