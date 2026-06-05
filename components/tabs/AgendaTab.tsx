"use client";

import dynamic from "next/dynamic";

const AgendaMensal = dynamic(() => import("@/components/AgendaMensal"), { ssr: false });
const AgendaPredio = dynamic(() => import("@/components/AgendaPredio"), { ssr: false });

type Props = {
  refreshKey: number;
  onSaved: () => void;
};

export default function AgendaTab({ refreshKey, onSaved }: Props) {
  return (
    <div key="agenda" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="px-5 pb-2 pt-1 sm:px-6">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
          Agenda
        </p>
        <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
          Agenda do prédio
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-navy-500">
          Vencimentos, manutenções e compromissos do condomínio.
        </p>
      </div>
      <AgendaMensal refreshKey={refreshKey} onNavigateToAgenda={() => {}} />
      <AgendaPredio onSaved={onSaved} />
    </div>
  );
}
