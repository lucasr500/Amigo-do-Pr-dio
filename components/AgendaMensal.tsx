"use client";

import { useEffect, useState } from "react";
import {
  getAgendaEvents,
  getMemoriaOperacional,
  getProfile,
  type AgendaEvent,
  type AgendaEventType,
} from "@/lib/session";

// ── Labels por tipo de evento manual ──────────────────────────────────────────
const TYPE_LABELS: Record<AgendaEventType, string> = {
  assembleia: "Assembleia",
  manutencao: "Manutenção",
  dedetizacao: "Dedetização",
  caixa_agua: "Caixa d'água",
  extintores: "Extintores",
  vistoria: "Vistoria",
  obra: "Obra",
  cobranca: "Cobrança",
  reuniao: "Reunião",
  fornecedor: "Fornecedor",
  comunicado: "Comunicado",
  retorno: "Retorno",
  outro: "Outro",
};

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// ── Tipos internos ────────────────────────────────────────────────────────────

type SystemEntry = {
  date: string;
  label: string;
  isSystem: true;
};

type ManualEntry = {
  date: string;
  label: string;
  subLabel: string;  // título truncado, sem nota
  isSystem: false;
};

type DayEntry = SystemEntry | ManualEntry;

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function truncateTitle(title: string | undefined): string {
  if (!title || title.trim().length === 0) return "";
  const t = title.trim();
  return t.length > 22 ? t.slice(0, 20) + "…" : t;
}

function buildSystemEntries(): SystemEntry[] {
  const m = getMemoriaOperacional();
  const profile = getProfile();
  const result: SystemEntry[] = [];

  if (m.vencimentoAVCB)              result.push({ date: m.vencimentoAVCB,                          label: "AVCB",       isSystem: true });
  if (m.vencimentoSeguro)            result.push({ date: m.vencimentoSeguro,                         label: "Seguro",     isSystem: true });
  if (m.fimMandatoSindico)           result.push({ date: m.fimMandatoSindico,                        label: "Mandato",    isSystem: true });
  if (m.ultimaAGO)                   result.push({ date: addDays(m.ultimaAGO, 365),                  label: "AGO",        isSystem: true });
  if (m.ultimaDedetizacao)           result.push({ date: addDays(m.ultimaDedetizacao, 180),           label: "Dedetização", isSystem: true });
  if (m.ultimaLimpezaCaixaDAgua)     result.push({ date: addDays(m.ultimaLimpezaCaixaDAgua, 180),     label: "Caixa d'água", isSystem: true });
  if (m.ultimaManutencaoElevador && profile?.hasElevador)
                                     result.push({ date: addDays(m.ultimaManutencaoElevador, 30),    label: "Elevador",   isSystem: true });
  if (m.ultimaInspecaoExtintores)    result.push({ date: addDays(m.ultimaInspecaoExtintores, 365),   label: "Extintores", isSystem: true });
  if (m.ultimaVistoriaSPDA)          result.push({ date: addDays(m.ultimaVistoriaSPDA, 365),         label: "SPDA",       isSystem: true });
  if (m.ultimaVistoriaEletrica)      result.push({ date: addDays(m.ultimaVistoriaEletrica, 365),     label: "Elétrica",   isSystem: true });

  return result;
}

function buildEventMap(month: number, year: number): Map<number, DayEntry[]> {
  const map = new Map<number, DayEntry[]>();

  // Eventos manuais não concluídos do mês
  const manualEvents: AgendaEvent[] = getAgendaEvents().filter((e) => {
    if (e.completedAt) return false;
    const parts = e.date.split("-");
    return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month + 1;
  });

  for (const e of manualEvents) {
    const day = parseInt(e.date.split("-")[2], 10);
    const sub = truncateTitle(e.title);
    const entry: ManualEntry = {
      date: e.date,
      label: TYPE_LABELS[e.type] ?? "Item da agenda",
      subLabel: sub,
      isSystem: false,
    };
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(entry);
  }

  // Vencimentos e rotinas monitorados — apenas os que caem neste mês
  const sysEntries = buildSystemEntries();
  for (const s of sysEntries) {
    const parts = s.date.split("-");
    const y = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (y === year && mo === month + 1) {
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    }
  }

  return map;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onNavigateToAgenda?: () => void;
};

export default function AgendaMensal({ refreshKey, onNavigateToAgenda }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [eventMap, setEventMap] = useState<Map<number, DayEntry[]>>(new Map());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());

  useEffect(() => {
    const now = new Date();
    setEventMap(buildEventMap(now.getMonth(), now.getFullYear()));
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return null;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDay = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  // Grade: células vazias + dias do mês
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null as null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEntries = eventMap.get(selectedDay) ?? [];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="overflow-hidden rounded-[18px] border border-navy-100/80 bg-white/80 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">

        {/* Cabeçalho */}
        <div className="px-4 pb-1.5 pt-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
            Agenda do mês
          </p>
          <div className="flex items-baseline gap-1.5">
            <p className="mt-0.5 text-[14px] font-semibold capitalize leading-snug text-navy-800">
              {MONTH_NAMES[month]}
            </p>
            <p className="text-[12px] text-navy-400">{year}</p>
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-400">
            Compromissos, prazos e acompanhamentos do prédio.
          </p>
        </div>

        {/* Grade do calendário */}
        <div className="px-3 pb-2 pt-1">
          {/* Dias da semana */}
          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="py-0.5 text-center text-[9.5px] font-semibold uppercase tracking-[0.06em] text-navy-300"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`e-${idx}`} className="h-[34px]" />;
              }

              const isToday    = day === todayDay;
              const isSelected = day === selectedDay;
              const hasEvents  = eventMap.has(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`Dia ${day}${hasEvents ? ", tem eventos" : ""}`}
                  aria-pressed={isSelected}
                  className={`relative flex h-[34px] w-full flex-col items-center justify-center rounded-lg text-[12.5px] font-medium transition-all active:scale-95 ${
                    isToday && isSelected
                      ? "bg-navy-700 text-white"
                      : isToday
                      ? "bg-navy-100 font-semibold text-navy-800"
                      : isSelected
                      ? "bg-navy-50 text-navy-800 ring-1 ring-navy-200"
                      : "text-navy-600 hover:bg-navy-50/60"
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <span
                      className={`absolute bottom-[3px] h-[3px] w-[3px] rounded-full ${
                        isToday && isSelected ? "bg-white/70" : "bg-navy-400"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhe do dia selecionado */}
        <div className="border-t border-navy-50 px-4 py-3">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-navy-300">
            {selectedDay === todayDay ? "Hoje" : `Dia ${selectedDay}`}
          </p>

          {selectedEntries.length === 0 ? (
            <p className="text-[12.5px] text-navy-400">
              Nada agendado para este dia.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {selectedEntries.map((entry, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      entry.isSystem ? "bg-amber-400" : "bg-navy-300"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="truncate text-[12.5px] text-navy-700">
                    {entry.isSystem
                      ? entry.label
                      : entry.subLabel
                      ? `${entry.label} · ${entry.subLabel}`
                      : entry.label}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={onNavigateToAgenda}
            className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-navy-400 transition-colors hover:text-navy-600 active:scale-[0.97]"
          >
            <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Agendar neste dia
          </button>
        </div>

      </div>
    </section>
  );
}
