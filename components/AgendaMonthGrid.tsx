"use client";

import { useMemo, useState } from "react";
import { getEventsForMonth, type CalendarEvent } from "@/lib/calendar-events";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const SEV_DOT: Record<CalendarEvent["severity"], string> = {
  critical: "bg-terracotta-500",
  warning:  "bg-amber-400",
  info:     "bg-navy-400",
  neutral:  "bg-navy-200",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

type Props = {
  onDaySelect?: (date: string, events: CalendarEvent[]) => void;
};

export default function AgendaMonthGrid({ onDaySelect }: Props) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const events = useMemo(() => getEventsForMonth(monthKey), [monthKey]);

  // Indexar eventos por dia
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of events) {
      const day = parseInt(e.date.slice(8, 10), 10);
      const list = map.get(day) ?? [];
      list.push(e);
      map.set(day, list);
    }
    return map;
  }, [events]);

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
  const todayStr     = today.toISOString().slice(0, 10);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const handleDayClick = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const evts = eventsByDay.get(day) ?? [];
    setSelectedDate(dateStr);
    onDaySelect?.(dateStr, evts);
  };

  // Determinar top severity do dia para cor do dot
  function topSeverity(evts: CalendarEvent[]): CalendarEvent["severity"] {
    if (evts.some(e => e.severity === "critical")) return "critical";
    if (evts.some(e => e.severity === "warning"))  return "warning";
    if (evts.some(e => e.severity === "info"))      return "info";
    return "neutral";
  }

  // Gerar células: padding + dias
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const day = parseInt(selectedDate.slice(8, 10), 10);
    return eventsByDay.get(day) ?? [];
  }, [selectedDate, eventsByDay]);

  return (
    <div className="px-5 pb-4 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-navy-100/80 bg-white/[0.86] shadow-card">
        {/* Header de navegação */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-full text-navy-400 hover:bg-navy-100 active:scale-95"
            aria-label="Mês anterior"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-[13px] font-semibold text-navy-800">
            {monthNames[viewMonth]} {viewYear}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-full text-navy-400 hover:bg-navy-100 active:scale-95"
            aria-label="Próximo mês"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 px-3 pb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-navy-300 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          {cells.map((cell, idx) => {
            if (!cell.day) return <div key={`empty-${idx}`} />;

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
            const isToday     = dateStr === todayStr;
            const isSelected  = dateStr === selectedDate;
            const dayEvents   = eventsByDay.get(cell.day) ?? [];
            const hasSev      = dayEvents.length > 0 ? topSeverity(dayEvents) : null;

            return (
              <button
                key={cell.day}
                type="button"
                onClick={() => handleDayClick(cell.day!)}
                className={`relative flex flex-col items-center justify-start rounded-lg py-1.5 transition-colors
                  ${isSelected ? "bg-navy-800 text-white" : isToday ? "bg-navy-100" : "hover:bg-navy-50"}
                `}
                aria-label={`${cell.day} ${monthNames[viewMonth]}`}
              >
                <span className={`text-[12px] font-medium leading-none
                  ${isSelected ? "text-white" : isToday ? "text-navy-800 font-semibold" : "text-navy-700"}
                `}>
                  {cell.day}
                </span>
                {hasSev && (
                  <span
                    className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white/80" : SEV_DOT[hasSev]}`}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Painel de eventos do dia selecionado */}
        {selectedDate && (
          <div className="border-t border-navy-50 px-4 pb-3 pt-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-[12px] text-navy-400">Nenhum evento registrado.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-2">
                    <span
                      className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${SEV_DOT[e.severity]}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-navy-700 leading-snug">{e.title}</p>
                      {e.detail && (
                        <p className="text-[10.5px] text-navy-400">{e.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
