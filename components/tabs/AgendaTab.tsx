"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AgendaQuickStats from "@/components/AgendaQuickStats";

const AgendaMensal = dynamic(() => import("@/components/AgendaMensal"), { ssr: false });
const AgendaPredio = dynamic(() => import("@/components/AgendaPredio"), { ssr: false });
const AgendaMonthGrid = dynamic(() => import("@/components/AgendaMonthGrid"), { ssr: false });
const CalendarioOperacionalPanel = dynamic(() => import("@/components/CalendarioOperacionalPanel"), { ssr: false });
const AgendaReservasSummary = dynamic(() => import("@/components/AgendaReservasSummary"), { ssr: false });

type AgendaSection = "agenda" | "vencimentos" | "reservas";

const SECTION_TABS: { id: AgendaSection; label: string }[] = [
  { id: "agenda", label: "Agenda" },
  { id: "vencimentos", label: "Vencimentos" },
  { id: "reservas", label: "Reservas" },
];

type Props = {
  refreshKey: number;
  onSaved: () => void;
};

export default function AgendaTab({ refreshKey, onSaved }: Props) {
  const [section, setSection] = useState<AgendaSection>("agenda");

  return (
    <div key="agenda" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="px-5 pb-2 pt-1 sm:px-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
          Gestão
        </p>
        <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
          Rotina do prédio
        </p>
        <p className="mt-1 max-w-[34rem] text-[12.5px] leading-relaxed text-navy-500">
          Prazos, manutenções e compromissos organizados por prioridade.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="no-scrollbar overflow-x-auto px-5 pb-3 sm:px-6">
        <div className="flex gap-1.5 rounded-full border border-navy-100/70 bg-white/[0.70] p-1 shadow-card" style={{ minWidth: "max-content" }}>
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.98] ${
                section === tab.id
                  ? "bg-navy-800 text-white shadow-card"
                  : "text-navy-500 hover:bg-white hover:text-navy-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {section === "agenda" && (
        <>
          <AgendaQuickStats refreshKey={refreshKey} />
          <AgendaMonthGrid />
          <AgendaMensal refreshKey={refreshKey} onNavigateToAgenda={() => {}} />
          <AgendaPredio onSaved={onSaved} />
        </>
      )}

      {section === "vencimentos" && (
        <CalendarioOperacionalPanel refreshKey={refreshKey} />
      )}

      {section === "reservas" && (
        <AgendaReservasSummary refreshKey={refreshKey} />
      )}
    </div>
  );
}
