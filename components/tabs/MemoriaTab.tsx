"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import LoadingState from "@/components/ui/LoadingState";
import { buildInstitutionalMemorySummary } from "@/lib/institutional-memory";
import { buildInstitutionalReport } from "@/lib/institutional-report";

// Reaproveita os painéis de domínio existentes — sem nova lógica de dados.
const TimelinePanel = dynamic(() => import("@/components/community/TimelinePanel"), {
  ssr: false,
  loading: () => <div className="px-5 py-4 sm:px-6"><LoadingState label="Carregando linha do tempo…" rows={4} /></div>,
});
const DecisionsPanel = dynamic(() => import("@/components/DecisionsPanel"), {
  ssr: false,
  loading: () => <div className="px-5 py-4 sm:px-6"><LoadingState label="Carregando decisões…" rows={4} /></div>,
});
const AssembleiasPanel = dynamic(() => import("@/components/AssembleiasPanel"), {
  ssr: false,
  loading: () => <div className="px-5 py-4 sm:px-6"><LoadingState label="Carregando assembleias…" rows={4} /></div>,
});
const DocumentosEssenciaisPanel = dynamic(() => import("@/components/DocumentosEssenciaisPanel"), {
  ssr: false,
  loading: () => <div className="px-5 py-4 sm:px-6"><LoadingState label="Carregando documentos…" rows={4} /></div>,
});
const SuppliersPanel = dynamic(() => import("@/components/SuppliersPanel"), {
  ssr: false,
  loading: () => <div className="px-5 py-4 sm:px-6"><LoadingState label="Carregando fornecedores…" rows={4} /></div>,
});
const HandoffPanel = dynamic(() => import("@/components/HandoffPanel"), {
  ssr: false,
  loading: () => <div className="px-5 py-4 sm:px-6"><LoadingState label="Carregando passagem de gestão…" rows={4} /></div>,
});

type MemoriaSection = "overview" | "assembleias" | "timeline" | "decisoes" | "documentos" | "fornecedores" | "continuidade";

const SECTION_TABS: { id: MemoriaSection; label: string }[] = [
  { id: "overview",      label: "Visão geral" },
  { id: "assembleias",   label: "Assembleias" },
  { id: "timeline",      label: "Linha do tempo" },
  { id: "decisoes",      label: "Decisões" },
  { id: "documentos",    label: "Documentos" },
  { id: "fornecedores",  label: "Fornecedores" },
  { id: "continuidade",  label: "Continuidade" },
];

type Props = {
  refreshKey: number;
  onRefresh: () => void;
};

export default function MemoriaTab({ refreshKey, onRefresh }: Props) {
  const [section, setSection] = useState<MemoriaSection>("overview");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = useMemo(() => buildInstitutionalMemorySummary(), [refreshKey]);
  const [copied, setCopied] = useState(false);

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildInstitutionalReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  const overviewCards: { id: MemoriaSection; eyebrow: string; title: string; detail: string }[] = [
    {
      id: "assembleias",
      eyebrow: "Governança",
      title: "Assembleias",
      detail: "Convoque, organize a pauta e delibere — cada decisão fica registrada",
    },
    {
      id: "timeline",
      eyebrow: "Histórico",
      title: "Linha do tempo",
      detail: summary.timelineEventCount > 0
        ? `${summary.timelineEventCount} evento${summary.timelineEventCount !== 1 ? "s" : ""} registrado${summary.timelineEventCount !== 1 ? "s" : ""}`
        : "O fio cronológico do prédio",
    },
    {
      id: "decisoes",
      eyebrow: "Governança",
      title: "Decisões",
      detail: summary.decisionCount > 0
        ? `${summary.decisionCount} decisão${summary.decisionCount !== 1 ? "ões" : ""} com contexto e fundamento`
        : "Por que cada escolha foi feita",
    },
    {
      id: "documentos",
      eyebrow: "Biblioteca",
      title: "Documentos",
      detail: "Convenção, AVCB, seguro, laudos e contratos",
    },
    {
      id: "fornecedores",
      eyebrow: "Rede",
      title: "Fornecedores",
      detail: summary.supplierCount > 0
        ? `${summary.supplierCount} fornecedor${summary.supplierCount !== 1 ? "es" : ""} ativo${summary.supplierCount !== 1 ? "s" : ""}`
        : "Quem cuida de cada parte do prédio",
    },
    {
      id: "continuidade",
      eyebrow: "Transição",
      title: "Continuidade",
      detail: summary.handoffPct > 0
        ? `Passagem de gestão ${summary.handoffPct}% organizada`
        : "Entregue o prédio organizado ao próximo síndico",
    },
  ];

  return (
    <div key="memoria" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

      {/* ── Título do hub ──────────────────────────────────────────── */}
      <div className="px-5 pb-1 pt-2 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">
          Segundo cérebro do condomínio
        </p>
        <h2 className="mt-0.5 font-display text-[22px] font-semibold leading-tight text-navy-900">
          Memória
        </h2>
        <p className="mt-1 max-w-[440px] text-[12.5px] leading-relaxed text-navy-500">
          {summary.hasData
            ? summary.highlight
            : "Decisões, documentos, fornecedores e histórico num só lugar — o que impede a gestão de recomeçar do zero."}
        </p>
      </div>

      {/* ── Chip strip de seções ───────────────────────────────────── */}
      <section className="px-5 pb-3 pt-2 sm:px-6">
        <div className="no-scrollbar overflow-x-auto">
          <div
            className="flex gap-1.5 rounded-full border border-navy-100/70 bg-white/[0.70] p-1 shadow-card"
            style={{ minWidth: "max-content" }}
            role="tablist"
            aria-label="Seções da memória"
          >
            {SECTION_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={section === tab.id}
                onClick={() => setSection(tab.id)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all active:scale-[0.98] ${
                  section === tab.id ? "bg-navy-800 text-white shadow-card" : "text-navy-500 hover:bg-white hover:text-navy-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conteúdo por seção ─────────────────────────────────────── */}
      {section === "overview" && (
        <div className="px-5 pb-4 sm:px-6">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {overviewCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSection(card.id)}
                className="flex items-start gap-3 rounded-xl border border-navy-100/80 bg-white/[0.82] px-4 py-3.5 text-left shadow-card transition-all hover:border-navy-200 hover:bg-white active:scale-[0.98]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400">{card.eyebrow}</p>
                  <p className="mt-0.5 text-[14px] font-semibold leading-snug text-navy-800">{card.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-navy-500">{card.detail}</p>
                </div>
                <svg className="mt-1 h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>

          {/* Relatório institucional consolidado */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-navy-100/80 bg-navy-50/60 px-4 py-2.5 text-[11.5px] font-semibold text-navy-600 transition-all hover:bg-navy-50 active:scale-[0.99]"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-sage-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sage-700">Relatório copiado</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 4V3a1 1 0 011-1h7a1 1 0 011 1v9a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Copiar relatório institucional
              </>
            )}
          </button>

          {summary.nextStep && (
            <p className="mt-3 rounded-lg bg-navy-50/60 px-3.5 py-3 text-[11.5px] leading-snug text-navy-600">
              <span className="font-semibold text-navy-700">Próximo passo: </span>
              {summary.nextStep}
            </p>
          )}
        </div>
      )}

      {section === "assembleias"  && <AssembleiasPanel />}
      {section === "timeline"     && <TimelinePanel role="manager" />}
      {section === "decisoes"     && <DecisionsPanel />}
      {section === "documentos"   && <DocumentosEssenciaisPanel onSaved={onRefresh} />}
      {section === "fornecedores" && <SuppliersPanel />}
      {section === "continuidade" && <HandoffPanel />}

    </div>
  );
}
