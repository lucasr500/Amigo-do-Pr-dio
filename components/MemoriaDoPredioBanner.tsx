"use client";

import { useEffect, useState } from "react";
import {
  getDocumentos,
  getFuncionarios,
  getOcorrencias,
  getPendenciasConcluidas,
  getHealthHistory,
  getSessionMeta,
} from "@/lib/session";
import {
  getAllCondominios,
  getPortfolioStats,
  hasMultipleCondominios,
  type CondominioQuickStats,
} from "@/lib/condominios";

type Stat = { label: string; value: number; unit: string };

function buildSingleCondoStats(): Stat[] {
  const docs       = getDocumentos().filter((d) => d.status === "tenho").length;
  const funcs      = getFuncionarios().length;
  const ocorr      = getOcorrencias().length;
  const resolvidos = getPendenciasConcluidas().length;
  const historico  = getHealthHistory().length;
  const sessoes    = getSessionMeta().sessionCount;

  const computed: Stat[] = [];
  if (docs      > 0) computed.push({ label: "documentos confirmados",  value: docs,       unit: docs === 1      ? "documento"    : "documentos" });
  if (funcs     > 0) computed.push({ label: "funcionários monitorados", value: funcs,      unit: funcs === 1     ? "funcionário"  : "funcionários" });
  if (ocorr     > 0) computed.push({ label: "ocorrências registradas",  value: ocorr,      unit: ocorr === 1     ? "ocorrência"   : "ocorrências" });
  if (resolvidos > 0) computed.push({ label: "pendências resolvidas",   value: resolvidos, unit: resolvidos === 1 ? "resolvida"    : "resolvidas" });
  if (historico  > 0) computed.push({ label: "dias de histórico",       value: historico,  unit: historico === 1 ? "dia"          : "dias" });
  if (sessoes    > 1) computed.push({ label: "sessões no app",          value: sessoes,    unit: sessoes === 1   ? "sessão"       : "sessões" });
  return computed;
}

function buildPortfolioStats(portfolio: CondominioQuickStats[]): Stat[] {
  const count      = portfolio.length;
  const totalOcorr = portfolio.reduce((s, c) => {
    // Only active has live data; for inactive we use what we can from cached data
    return s;
  }, 0);
  const total = count;

  const withScores = portfolio.filter((c) => c.healthScore !== null);
  const avgScore   = withScores.length > 0
    ? Math.round(withScores.reduce((s, c) => s + (c.healthScore ?? 0), 0) / withScores.length)
    : null;

  const totalPend   = portfolio.reduce((s, c) => s + c.pendenciasAbertas, 0);
  const totalCrit   = portfolio.reduce((s, c) => s + c.pendenciasVencidas, 0);
  const condos      = getAllCondominios();
  const totalDocs   = getDocumentos().filter((d) => d.status === "tenho").length;

  const computed: Stat[] = [
    { label: "condomínios monitorados", value: total,   unit: total === 1 ? "condomínio" : "condomínios" },
  ];
  if (avgScore !== null)  computed.push({ label: "health score médio",    value: avgScore,  unit: "%" });
  if (totalPend > 0)      computed.push({ label: "pendências abertas",     value: totalPend, unit: totalPend === 1 ? "aberta" : "abertas" });
  if (totalCrit > 0)      computed.push({ label: "pendências vencidas",    value: totalCrit, unit: totalCrit === 1 ? "vencida" : "vencidas" });
  if (totalDocs > 0)      computed.push({ label: "documentos confirmados", value: totalDocs, unit: totalDocs === 1 ? "documento" : "documentos" });
  void totalOcorr;
  return computed.slice(0, 6);
}

export default function MemoriaDoPredioBanner() {
  const [stats,         setStats]         = useState<Stat[]>([]);
  const [isPortfolio,   setIsPortfolio]   = useState(false);
  const [condoCount,    setCondoCount]    = useState(1);
  const [hydrated,      setHydrated]      = useState(false);

  useEffect(() => {
    const multi = hasMultipleCondominios();
    setIsPortfolio(multi);
    setCondoCount(getAllCondominios().length);

    if (multi) {
      const portfolio = getPortfolioStats();
      setStats(buildPortfolioStats(portfolio));
    } else {
      setStats(buildSingleCondoStats());
    }
    setHydrated(true);
  }, []);

  if (!hydrated || stats.length === 0) return null;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="rounded-[18px] border border-navy-100/70 bg-white/90 px-4 py-4 shadow-sm">
        <p className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
          {isPortfolio ? "Patrimônio da carteira" : "Patrimônio informacional"}
        </p>
        <p className="mb-3 text-[13px] font-semibold leading-snug text-navy-800">
          {isPortfolio
            ? `${condoCount} condomínios monitorados`
            : "O que este app sabe sobre seu prédio"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-navy-50/60 px-3 py-2.5">
              <p className="text-[20px] font-bold leading-none text-navy-800">{s.value}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-navy-500">{s.unit}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed text-navy-400">
          {isPortfolio
            ? "Dados de todos os condomínios monitorados neste dispositivo."
            : "Esses dados são seus. Ficam neste dispositivo e podem ser exportados a qualquer momento."}
        </p>
      </div>
    </div>
  );
}
