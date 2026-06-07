"use client";

import { useEffect, useState } from "react";
import { getAgendaEvents, type AgendaEvent } from "@/lib/session-agenda";

type Stats = {
  nextEvent: AgendaEvent | null;
  thisMonthTotal: number;
  overdueCount: number;
  nextLabel: string;
};

function buildStats(): Stats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);

  const events = getAgendaEvents().filter((e) => !e.completedAt);

  const upcoming = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const overdue = events.filter((e) => e.date < todayStr);

  const thisMonth = events.filter((e) => e.date.startsWith(monthStr));

  const nextEvent = upcoming[0] ?? null;

  let nextLabel = "";
  if (nextEvent) {
    const diff = Math.round(
      (new Date(nextEvent.date + "T12:00:00").getTime() - today.getTime()) / 86400000
    );
    if (diff === 0) nextLabel = "hoje";
    else if (diff === 1) nextLabel = "amanhã";
    else nextLabel = `em ${diff} dias`;
  }

  return {
    nextEvent,
    thisMonthTotal: thisMonth.length,
    overdueCount: overdue.length,
    nextLabel,
  };
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  assembleia: "Assembleia", manutencao: "Manutenção", dedetizacao: "Dedetização",
  caixa_agua: "Caixa d'água", extintores: "Extintores", vistoria: "Vistoria",
  obra: "Obra", cobranca: "Cobrança", reuniao: "Reunião", fornecedor: "Fornecedor",
  comunicado: "Comunicado", retorno: "Retorno", outro: "Evento",
};

type Props = { refreshKey?: number };

export default function AgendaQuickStats({ refreshKey }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStats(buildStats());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) {
    return <div className="mx-5 h-[62px] animate-pulse rounded-[14px] bg-navy-50/80 sm:mx-6" />;
  }

  if (!stats) return null;

  const { nextEvent, thisMonthTotal, overdueCount, nextLabel } = stats;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="grid grid-cols-3 gap-2">
        {/* Próximo evento */}
        <div className="col-span-2 flex flex-col justify-between rounded-[14px] border border-navy-100/70 bg-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-300">
            Próximo evento
          </p>
          {nextEvent ? (
            <>
              <p className="mt-1 truncate text-[13px] font-semibold leading-snug text-navy-800">
                {nextEvent.title}
              </p>
              <p className="mt-0.5 text-[11px] text-navy-400">
                {EVENT_TYPE_LABEL[nextEvent.type] ?? "Evento"} · {nextLabel}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-[12.5px] font-medium text-navy-400">Nenhum agendado</p>
              <p className="mt-0.5 text-[11px] text-navy-300">Adicione um abaixo</p>
            </>
          )}
        </div>

        {/* Contadores compactos */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] border border-navy-100/70 bg-white py-2 shadow-sm">
            <p className="text-[18px] font-bold leading-none text-navy-800">{thisMonthTotal}</p>
            <p className="mt-0.5 text-center text-[9.5px] font-medium uppercase tracking-[0.08em] text-navy-400">Este mês</p>
          </div>
          {overdueCount > 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] border border-terracotta-200 bg-terracotta-50/60 py-2">
              <p className="text-[18px] font-bold leading-none text-terracotta-700">{overdueCount}</p>
              <p className="mt-0.5 text-center text-[9.5px] font-medium uppercase tracking-[0.08em] text-terracotta-500">Vencidos</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50/50 py-2">
              <svg className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 10l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-0.5 text-center text-[9.5px] font-medium uppercase tracking-[0.08em] text-teal-600">Em dia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
