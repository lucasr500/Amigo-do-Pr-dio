"use client";

import { useEffect, useState } from "react";
import {
  getMemoriaOperacional,
  getChecklistStorage,
  getFavorites,
  logInteraction,
  MemoriaOperacional,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type TimelineEvent = {
  id: string;
  date: Date;
  label: string;
  detalhe?: string;
  icon: string;
  tipo: "manutencao" | "vencimento" | "checklist" | "favorito";
};

const MEMORIA_MAP: Partial<
  Record<keyof MemoriaOperacional, { label: string; icon: string; tipo: TimelineEvent["tipo"] }>
> = {
  ultimaAGO:               { label: "AGO realizada",              icon: "👥", tipo: "manutencao" },
  ultimaDedetizacao:        { label: "Dedetização",               icon: "🐛", tipo: "manutencao" },
  ultimaLimpezaCaixaDAgua:  { label: "Limpeza da caixa d'água",   icon: "💧", tipo: "manutencao" },
  ultimaManutencaoElevador: { label: "Manutenção do elevador",    icon: "🛗", tipo: "manutencao" },
  ultimaInspecaoExtintores: { label: "Inspeção de extintores",    icon: "🧯", tipo: "manutencao" },
  ultimaVistoriaSPDA:       { label: "Vistoria do para-raios",    icon: "⚡", tipo: "manutencao" },
  ultimaVistoriaEletrica:   { label: "Vistoria elétrica",         icon: "🔌", tipo: "manutencao" },
  vencimentoAVCB:           { label: "AVCB atualizado",           icon: "📋", tipo: "vencimento" },
  vencimentoSeguro:         { label: "Seguro atualizado",         icon: "🛡️", tipo: "vencimento" },
};

const CHECKLIST_LABELS: Record<string, string> = {
  assembleia:    "Checklist Assembleia concluído",
  admissao:      "Checklist Admissão concluído",
  manutencao:    "Checklist Manutenção concluído",
  "sindico-novo": "Checklist Síndico novo concluído",
};

function formatRelativeDate(date: Date): string {
  const ds = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (ds === 0) return "Hoje";
  if (ds === 1) return "Ontem";
  if (ds <= 6) return `${ds} dias atrás`;
  if (ds <= 13) return "1 semana atrás";
  if (ds <= 29) return `${Math.floor(ds / 7)} semanas atrás`;
  const meses = Math.floor(ds / 30);
  return `${meses} mês${meses > 1 ? "es" : ""} atrás`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function buildTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date();

  const memoria = getMemoriaOperacional();
  for (const [key, meta] of Object.entries(MEMORIA_MAP)) {
    const val = memoria[key as keyof MemoriaOperacional] as string | undefined;
    if (!val) continue;
    const date = new Date(val);
    if (isNaN(date.getTime())) continue;
    const isFuture = date > now;
    events.push({
      id: `mem-${key}`,
      date,
      label: isFuture
        ? `${meta.label} — vence ${date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`
        : meta.label,
      detalhe: isFuture ? undefined : formatRelativeDate(date),
      icon: meta.icon,
      tipo: meta.tipo,
    });
  }

  const storage = getChecklistStorage();
  for (const [id, data] of Object.entries(storage)) {
    if (!CHECKLIST_LABELS[id]) continue;
    const total = 10;
    const done = Object.values(data.checked).filter(Boolean).length;
    if (done < total) continue;
    events.push({
      id: `cl-${id}`,
      date: new Date(data.lastUsed),
      label: CHECKLIST_LABELS[id],
      detalhe: formatRelativeDate(new Date(data.lastUsed)),
      icon: "✓",
      tipo: "checklist",
    });
  }

  const favorites = getFavorites().slice(-5);
  for (const fav of favorites) {
    events.push({
      id: `fav-${fav.id}`,
      date: new Date(fav.ts),
      label: `Favorito: "${fav.q.length > 45 ? fav.q.slice(0, 45) + "…" : fav.q}"`,
      detalhe: formatRelativeDate(new Date(fav.ts)),
      icon: "★",
      tipo: "favorito",
    });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);
}

type TimelineOperacionalProps = {
  refreshKey?: number;
};

export default function TimelineOperacional({ refreshKey }: TimelineOperacionalProps) {
  const [hydrated, setHydrated] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const built = buildTimeline();
    setEvents(built);
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || events.length === 0) return null;

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      logInteraction("timeline-aberta", "");
      void trackEvent("timeline_viewed", { event_count: events.length });
    }
  };

  let lastMonth = "";

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center gap-2.5 rounded-xl border border-navy-100 bg-white/70 px-4 py-2.5 text-left transition-colors hover:bg-white active:bg-navy-50"
      >
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[11px]"
          aria-hidden="true"
        >
          ◷
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-medium text-navy-800">Histórico do condomínio</p>
          <p className="text-[11px] text-navy-400">
            {events.length} evento{events.length !== 1 ? "s" : ""} registrado{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="flex-shrink-0 text-[11px] text-navy-400">
          {expanded ? "Recolher ↑" : "Ver →"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 rounded-2xl border border-navy-100 bg-white/90 p-4">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-navy-100" aria-hidden="true" />
            <div className="space-y-0">
              {events.map((event) => {
                const month = formatMonthLabel(event.date);
                const showMonth = month !== lastMonth;
                lastMonth = month;
                return (
                  <div key={event.id}>
                    {showMonth && (
                      <p className="mb-2 mt-3 pl-7 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-navy-300 first:mt-0">
                        {month}
                      </p>
                    )}
                    <div className="relative flex items-start gap-3 pb-3">
                      <div
                        className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${
                          event.tipo === "checklist"
                            ? "bg-sage-100 text-sage-600"
                            : event.tipo === "vencimento"
                            ? "bg-navy-100 text-navy-600"
                            : event.tipo === "favorito"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-navy-50 text-navy-500"
                        }`}
                      >
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[12px] font-medium leading-snug text-navy-800">{event.label}</p>
                        {event.detalhe && (
                          <p className="text-[10.5px] text-navy-400">{event.detalhe}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
