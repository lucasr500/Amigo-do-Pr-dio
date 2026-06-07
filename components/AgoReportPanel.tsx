"use client";

import { useState } from "react";
import { buildAgoReport, type AgoReportOptions } from "@/lib/ago-report";
import {
  getProfile, getMemoriaOperacional, getPendencias, getManutencoes, getFuncionarios,
} from "@/lib/session";
import { getDocumentos } from "@/lib/session-documentos";
import { getFinancialSnapshots } from "@/lib/financial";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

type ToggleOpt = { key: keyof AgoReportOptions; label: string };

const TOGGLES: ToggleOpt[] = [
  { key: "includeFinancial", label: "Financeiro" },
  { key: "includeDocuments", label: "Documentos" },
  { key: "includeOperations", label: "Operações" },
  { key: "includePeople", label: "Pessoas" },
  { key: "includeDecisions", label: "Decisões" },
  { key: "includeNextYear", label: "Previsão próximo ano" },
];

export default function AgoReportPanel() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [opts, setOpts] = useState<AgoReportOptions>({
    includeFinancial: true,
    includeDocuments: true,
    includeOperations: true,
    includePeople: true,
    includeDecisions: true,
    includeNextYear: true,
    year: CURRENT_YEAR,
  });
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleOpt = (key: keyof AgoReportOptions) => {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    const profile = getProfile();
    const memoria = getMemoriaOperacional();
    const pendencias = getPendencias();
    const documentos = getDocumentos();
    const funcionarios = getFuncionarios();
    const manutencoes = getManutencoes();
    const snapshots = getFinancialSnapshots();
    const report = buildAgoReport(
      profile, memoria, pendencias, documentos, funcionarios, manutencoes, snapshots,
      { ...opts, year: selectedYear }
    );
    setGenerated(report);
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Assembleia Geral Ordinária</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Relatório Anual de Gestão</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
            Gera um relatório executivo completo para apresentar na AGO: financeiro, documentos, operação, funcionários e decisões do período.
          </p>
        </div>
      </div>

      {/* Configuração */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 space-y-4">
          {/* Ano */}
          <div>
            <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Período de referência</p>
            <div className="flex gap-2">
              {YEAR_OPTIONS.map((y) => (
                <button key={y} type="button"
                  onClick={() => setSelectedYear(y)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${selectedYear === y ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Seções */}
          <div>
            <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Seções a incluir</p>
            <div className="flex flex-wrap gap-2">
              {TOGGLES.map(({ key, label }) => (
                <button key={key} type="button"
                  onClick={() => toggleOpt(key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${opts[key] ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-400 hover:bg-navy-100"}`}>
                  {opts[key] ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleGenerate}
            className="w-full rounded-2xl bg-navy-800 py-2.5 text-[12.5px] font-medium text-white hover:bg-navy-700 active:scale-[0.98] transition-all">
            Gerar relatório {selectedYear}
          </button>
        </div>
      </div>

      {/* Preview do relatório */}
      {generated && (
        <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12.5px] font-semibold text-navy-800">Relatório gerado</p>
              <button type="button" onClick={handleCopy}
                className="rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-navy-700 max-h-80 overflow-y-auto rounded-xl bg-navy-50/60 p-3">
              {generated}
            </pre>
            <p className="mt-2 text-[10.5px] text-navy-400">
              Cole no Word, Google Docs, WhatsApp ou e-mail. Revisar antes de apresentar em assembleia.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
