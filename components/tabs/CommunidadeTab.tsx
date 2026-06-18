"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getViewMode, setViewMode } from "@/lib/community-permissions";
import type { CommunityRole } from "@/lib/community-types";
import type { CentralSectionId } from "@/lib/visibility-guards";

// Comunidade — a rede social do condomínio, agora aba de 1ª classe (W7).
// Extraída da antiga Seção 2 do "Mais"; acrescenta a sub-seção Transparência, que
// é a casa do financeiro→transparência (W3) E da Revisão detalhada como camada de
// gestão por papel: morador vê o agregado; síndico vê o agregado + o detalhe.

type CommSection = "hub" | "mural" | "canal" | "reservas" | "enquetes" | "documentos" | "transparencia" | "timeline" | "relatorio";

const ViewModeSelector               = dynamic(() => import("@/components/community/ViewModeSelector"), { ssr: false });
const MuralPanel                     = dynamic(() => import("@/components/community/MuralPanel"), { ssr: false });
const ReservasPanel                  = dynamic(() => import("@/components/community/ReservasPanel"), { ssr: false });
const CentralDigitalHub              = dynamic(() => import("@/components/community/CentralDigitalHub"), { ssr: false });
const RequestsPanel                  = dynamic(() => import("@/components/community/RequestsPanel"), { ssr: false });
const PollsPanel                     = dynamic(() => import("@/components/community/PollsPanel"), { ssr: false });
const PublicDocumentsPanel           = dynamic(() => import("@/components/community/PublicDocumentsPanel"), { ssr: false });
const TimelinePanel                  = dynamic(() => import("@/components/community/TimelinePanel"), { ssr: false });
const CommunityReportPanel           = dynamic(() => import("@/components/community/CommunityReportPanel"), { ssr: false });
const TransparencyPanel              = dynamic(() => import("@/components/TransparencyPanel"), { ssr: false });
const MonthlyReviewPanel             = dynamic(() => import("@/components/MonthlyReviewPanel"), { ssr: false });
const MonthlyOperationalSummaryPanel = dynamic(() => import("@/components/MonthlyOperationalSummaryPanel"), { ssr: false });
const MonthlyReviewHistoryPanel      = dynamic(() => import("@/components/MonthlyReviewHistoryPanel"), { ssr: false });

type Props = {
  refreshKey: number;
  condoName: string;
  focusedCentralSection?: CentralSectionId | null;
  onRefresh: () => void;
  onOpenMonthlyReview: () => void;
};

const RESIDENT_SECTIONS: CommSection[] = ["mural", "canal", "reservas", "enquetes", "documentos", "transparencia"];

export default function CommunidadeTab({ refreshKey, condoName, focusedCentralSection, onRefresh, onOpenMonthlyReview }: Props) {
  const [communityRole, setCommunityRole] = useState<CommunityRole>("manager");
  const [section, setSection] = useState<CommSection>("hub");

  useEffect(() => { setCommunityRole(getViewMode()); }, []);

  const isResidentView = communityRole === "resident";

  const handleRoleChange = (role: CommunityRole) => {
    setViewMode(role);
    setCommunityRole(role);
    setSection(role === "resident" ? "mural" : "hub");
  };

  // Deep-link: focusedCentralSection vem da navegação (ex.: onOpenMonthlyReview → transparencia).
  useEffect(() => {
    if (!focusedCentralSection) return;
    const target = focusedCentralSection as CommSection;
    if (isResidentView && !RESIDENT_SECTIONS.includes(target)) { setSection("mural"); return; }
    setSection(target);
  }, [focusedCentralSection, isResidentView]);

  const TABS: { id: CommSection; label: string; managerOnly?: boolean }[] = [
    { id: "hub",           label: "Visão Geral",   managerOnly: true },
    { id: "mural",         label: "Mural" },
    { id: "canal",         label: "Canal" },
    { id: "reservas",      label: "Reservas" },
    { id: "enquetes",      label: "Enquetes" },
    { id: "documentos",    label: "Documentos" },
    { id: "transparencia", label: "Transparência" },
    { id: "timeline",      label: "Linha do tempo", managerOnly: true },
    { id: "relatorio",     label: "Relatório",      managerOnly: true },
  ];

  return (
    <div key="comunidade" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="px-5 pb-1 pt-2 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">Rede do condomínio</p>
        <h2 className="mt-0.5 font-display text-[22px] font-semibold leading-tight text-navy-900">Comunidade</h2>
        <p className="mt-1 max-w-[440px] text-[12.5px] leading-relaxed text-navy-500">
          Mural, canal do morador, reservas, enquetes, documentos e transparência — o condomínio na mesma página.
        </p>
      </div>

      <section className="px-5 pb-2 sm:px-6">
        <ViewModeSelector onChange={handleRoleChange} />
      </section>

      <section className="px-5 pb-3 sm:px-6">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex gap-1.5 rounded-full border border-navy-100/70 bg-white/[0.70] p-1 shadow-card" style={{ minWidth: "max-content" }} role="tablist" aria-label="Seções da comunidade">
            {TABS.filter((t) => !(t.managerOnly && isResidentView)).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={section === t.id}
                onClick={() => setSection(t.id)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all active:scale-[0.98] ${
                  section === t.id ? "bg-navy-800 text-white shadow-card" : "text-navy-500 hover:bg-white hover:text-navy-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {section === "hub" && !isResidentView && <CentralDigitalHub />}
      {section === "mural" && <MuralPanel role={communityRole} />}
      {section === "canal" && <RequestsPanel role={communityRole} />}
      {section === "reservas" && <ReservasPanel role={communityRole} />}
      {section === "enquetes" && <PollsPanel role={communityRole} />}
      {section === "documentos" && <PublicDocumentsPanel role={communityRole} />}
      {section === "timeline" && !isResidentView && <TimelinePanel role={communityRole} />}
      {section === "relatorio" && !isResidentView && <CommunityReportPanel role={communityRole} condoName={condoName || "Condomínio"} />}

      {section === "transparencia" && (
        <div className="px-5 pb-4 sm:px-6">
          {/* Morador e todos: o agregado */}
          <TransparencyPanel refreshKey={refreshKey} />

          {/* Camada de GESTÃO por papel: o detalhe (revisão mensal) só para gestão */}
          {!isResidentView && (
            <div className="mt-4">
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">
                Gestão — revisão detalhada
              </p>
              <MonthlyReviewPanel refreshKey={refreshKey} onRefresh={onRefresh} />
              <MonthlyOperationalSummaryPanel />
              <MonthlyReviewHistoryPanel refreshKey={refreshKey} onStartReview={onOpenMonthlyReview} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
