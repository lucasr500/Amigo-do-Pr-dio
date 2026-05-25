"use client";

import { useEffect, useState } from "react";
import {
  getAgendaEvents,
  getMemoriaOperacional,
  getProfile,
  type AgendaEvent,
} from "@/lib/session";

const WEEK_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const EVENT_TYPE_ICONS: Record<string, string> = {
  assembleia: "👥", manutencao: "🔧", dedetizacao: "🐛", caixa_agua: "💧",
  extintores: "🧯", vistoria: "🔍", obra: "🏗️", cobranca: "💰",
  reuniao: "🤝", fornecedor: "🛠️", comunicado: "📢", retorno: "📞", outro: "📅",
};

const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function addDaysToISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getWeekDays(today: Date): Date[] {
  const dow = today.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function buildEventDateSet(): Set<string> {
  const set = new Set<string>();
  const m = getMemoriaOperacional();
  const profile = getProfile();

  getAgendaEvents()
    .filter((e) => !e.completedAt)
    .forEach((e) => set.add(e.date));

  if (m.vencimentoAVCB)            set.add(m.vencimentoAVCB);
  if (m.vencimentoSeguro)          set.add(m.vencimentoSeguro);
  if (m.fimMandatoSindico)         set.add(m.fimMandatoSindico);
  if (m.ultimaAGO)                 set.add(addDaysToISO(m.ultimaAGO, 365));
  if (m.ultimaDedetizacao)         set.add(addDaysToISO(m.ultimaDedetizacao, 180));
  if (m.ultimaLimpezaCaixaDAgua)   set.add(addDaysToISO(m.ultimaLimpezaCaixaDAgua, 180));
  if (m.ultimaManutencaoElevador && profile?.hasElevador)
                                   set.add(addDaysToISO(m.ultimaManutencaoElevador, 30));
  if (m.ultimaInspecaoExtintores)  set.add(addDaysToISO(m.ultimaInspecaoExtintores, 365));
  if (m.ultimaVistoriaSPDA)        set.add(addDaysToISO(m.ultimaVistoriaSPDA, 365));
  if (m.ultimaVistoriaEletrica)    set.add(addDaysToISO(m.ultimaVistoriaEletrica, 365));

  return set;
}

function getUpcoming7Days(todayISO: string): AgendaEvent[] {
  const limitISO = addDaysToISO(todayISO, 6);
  return getAgendaEvents()
    .filter((e) => !e.completedAt && e.date >= todayISO && e.date <= limitISO)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
}

function formatEventDate(isoDate: string, todayISO: string): string {
  const tomorrowISO = addDaysToISO(todayISO, 1);
  if (isoDate === todayISO)     return "Hoje";
  if (isoDate === tomorrowISO)  return "Amanhã";
  const d = new Date(isoDate + "T00:00:00");
  const wd = WEEKDAYS_SHORT[d.getDay()];
  const dd = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${wd} · ${dd}`;
}

type Props = {
  refreshKey?: number;
  onNavigate?: () => void;
};

export default function HomeAgendaCard({ refreshKey, onNavigate }: Props) {
  const [hydrated, setHydrated]         = useState(false);
  const [eventDates, setEventDates]     = useState<Set<string>>(new Set());
  const [upcoming, setUpcoming]         = useState<AgendaEvent[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = getWeekDays(today);
  const todayISO = today.toISOString().slice(0, 10);

  useEffect(() => {
    setEventDates(buildEventDateSet());
    setUpcoming(getUpcoming7Days(todayISO));
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">

        {/* Header row — tappable */}
        <button
          type="button"
          onClick={onNavigate}
          className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/60 active:scale-[0.99]"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-50">
            <svg
              viewBox="0 0 20 20"
              className="h-[17px] w-[17px] text-navy-700"
              fill="none"
              aria-hidden="true"
            >
              <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M3 8.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>

          <div className="min-w-0 flex-1 text-left">
            <p className="text-[14px] font-semibold text-navy-800">Agenda mensal</p>
            <p className="text-[12px] text-navy-400">
              {MONTH_NAMES_PT[today.getMonth()]} de {today.getFullYear()}
            </p>
          </div>

          <svg
            className="h-4 w-4 flex-shrink-0 text-navy-300"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Week strip */}
        <div className="border-t border-navy-50 px-2 pb-3 pt-2.5">
          <div className="grid grid-cols-7">
            {WEEK_LABELS.map((label, i) => (
              <div
                key={i}
                className="pb-2 text-center text-[9px] font-semibold uppercase tracking-[0.05em] text-navy-300"
              >
                {label}
              </div>
            ))}

            {weekDays.map((day, i) => {
              const iso = day.toISOString().slice(0, 10);
              const isToday = iso === todayISO;
              const hasEvent = hydrated && eventDates.has(iso);

              return (
                <div key={i} className="flex flex-col items-center gap-[3px]">
                  <div
                    className={`flex h-[28px] w-[28px] items-center justify-center rounded-full text-[13px] font-medium ${
                      isToday
                        ? "bg-navy-700 font-bold text-white"
                        : "text-navy-600"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div
                    className={`h-[5px] w-[5px] rounded-full transition-opacity ${
                      hasEvent ? "bg-green-500 opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events list — only when events exist */}
        {hydrated && upcoming.length > 0 && (
          <div className="border-t border-navy-50 pb-1">
            {upcoming.map((event, idx) => (
              <div key={event.id}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50/80" />}
                <button
                  type="button"
                  onClick={onNavigate}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-50/40 active:scale-[0.99]"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]">
                    {EVENT_TYPE_ICONS[event.type] ?? "📅"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-navy-800">{event.title}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-medium ${
                    event.date === todayISO ? "text-terracotta-600" : "text-navy-400"
                  }`}>
                    {formatEventDate(event.date, todayISO)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
