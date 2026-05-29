"use client";

import { useEffect, useState } from "react";
import {
  getMemoriaOperacional,
  getChecklistStorage,
  getFavorites,
  getOcorrencias,
  getPendenciasConcluidas,
  getWeeklyReviewState,
  getAgendaEvents,
  addPendencia,
  updateOcorrencia,
  logInteraction,
  MemoriaOperacional,
  type Ocorrencia,
  type OcorrenciaTipo,
  type OcorrenciaStatus,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type TimelineEvent = {
  id: string;
  date: Date;
  label: string;
  detalhe?: string;
  icon: string;
  tipo: "manutencao" | "vencimento" | "checklist" | "favorito" | "pendencia" | "ocorrencia" | "revisao" | "agenda";
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
  vencimentoAVCB:           { label: "AVCB",                      icon: "📋", tipo: "vencimento" },
  vencimentoSeguro:         { label: "Seguro predial",            icon: "🛡️", tipo: "vencimento" },
  fimMandatoSindico:        { label: "Fim do mandato",            icon: "🗓️", tipo: "vencimento" },
};

const CHECKLIST_LABELS: Record<string, string> = {
  assembleia:             "Checklist Assembleia concluído",
  admissao:               "Checklist Admissão concluído",
  manutencao:             "Checklist Manutenção concluído",
  "sindico-novo":         "Checklist Síndico novo concluído",
  "ago":                  "Checklist AGO concluído",
  "encerramento-mandato": "Checklist Encerramento de mandato concluído",
};

const OCORRENCIA_LABELS: Record<OcorrenciaTipo, string> = {
  barulho: "Barulho",
  vazamento: "Vazamento",
  obra: "Obra",
  inadimplencia: "Inadimplência",
  manutencao: "Manutenção",
  funcionario: "Funcionário",
  "area-comum": "Área comum",
  assembleia: "Assembleia",
  briga: "Briga/Conflito",
  vistoria: "Vistoria",
  reclamacao: "Reclamação",
  lembrete: "Lembrete",
  outro: "Outro",
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

function formatDaysUntil(date: Date): string {
  const ds = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (ds <= 0) return "Hoje";
  if (ds === 1) return "Amanhã";
  if (ds <= 30) return `Em ${ds} dias`;
  if (ds <= 60) return "Em 1 mês";
  const m = Math.round(ds / 30);
  return `Em ${m} meses`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

type BuildResult = { upcoming: TimelineEvent[]; past: TimelineEvent[] };

function buildTimeline(): BuildResult {
  const allEvents: TimelineEvent[] = [];
  const now = new Date();

  const memoria = getMemoriaOperacional();
  for (const [key, meta] of Object.entries(MEMORIA_MAP)) {
    const val = memoria[key as keyof MemoriaOperacional] as string | undefined;
    if (!val) continue;
    const date = new Date(val);
    if (isNaN(date.getTime())) continue;
    const isFuture = date > now;
    allEvents.push({
      id: `mem-${key}`,
      date,
      label: isFuture
        ? `${meta.label} vence ${date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
        : meta.label,
      detalhe: isFuture ? formatDaysUntil(date) : formatRelativeDate(date),
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
    allEvents.push({
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
    allEvents.push({
      id: `fav-${fav.id}`,
      date: new Date(fav.ts),
      label: `Favorito: "${fav.q.length > 45 ? fav.q.slice(0, 45) + "…" : fav.q}"`,
      detalhe: formatRelativeDate(new Date(fav.ts)),
      icon: "★",
      tipo: "favorito",
    });
  }

  const concluidas = getPendenciasConcluidas()
    .filter((p) => !!p.completedAt)
    .slice(-10);
  for (const p of concluidas) {
    const date = new Date(p.completedAt!);
    if (isNaN(date.getTime())) continue;
    allEvents.push({
      id: `pend-${p.id}`,
      date,
      label: `Concluído: "${p.titulo.length > 45 ? p.titulo.slice(0, 45) + "…" : p.titulo}"`,
      detalhe: formatRelativeDate(date),
      icon: "✓",
      tipo: "pendencia",
    });
  }

  const ocorrencias = getOcorrencias().slice(-10);
  for (const ocorrencia of ocorrencias) {
    const date = new Date(ocorrencia.createdAt);
    if (isNaN(date.getTime())) continue;
    allEvents.push({
      id: `oc-${ocorrencia.id}`,
      date,
      label: `Ocorrência: ${OCORRENCIA_LABELS[ocorrencia.tipo]}`,
      detalhe: formatRelativeDate(date),
      icon: "!",
      tipo: "ocorrencia",
    });
  }

  const weeklyReview = getWeeklyReviewState();
  if (weeklyReview.lastCompletedAt) {
    const date = new Date(weeklyReview.lastCompletedAt);
    if (!isNaN(date.getTime())) {
      allEvents.push({
        id: `rev-semanal-${weeklyReview.lastCompletedWeekKey ?? "atual"}`,
        date,
        label: "Revisão semanal concluída",
        detalhe: formatRelativeDate(date),
        icon: "✓",
        tipo: "revisao",
      });
    }
  }

  const agendaEvents = getAgendaEvents().filter((e) => !!e.completedAt).slice(-10);
  for (const e of agendaEvents) {
    const date = new Date(e.completedAt!);
    if (isNaN(date.getTime())) continue;
    allEvents.push({
      id: `agenda-${e.id}`,
      date,
      label: "Item da agenda concluído",
      detalhe: formatRelativeDate(date),
      icon: "📅",
      tipo: "agenda",
    });
  }

  const upcoming = allEvents
    .filter((e) => e.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const past = allEvents
    .filter((e) => e.date <= now)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20);

  return { upcoming, past };
}

function EventRow({ event, isUpcoming }: { event: TimelineEvent; isUpcoming?: boolean }) {
  const iconBg =
    isUpcoming
      ? "bg-teal-50 text-teal-600"
      : event.tipo === "favorito"
      ? "bg-amber-50 text-amber-600"
      : event.tipo === "ocorrencia"
      ? "bg-cream-100 text-navy-600"
      : "bg-navy-50 text-navy-500";

  return (
    <div className="relative flex items-start gap-3 pb-3">
      <div
        className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${iconBg}`}
      >
        {event.icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-[12px] font-medium leading-snug ${isUpcoming ? "text-teal-800" : "text-navy-800"}`}>
          {event.label}
        </p>
        {event.detalhe && (
          <p className={`text-[10.5px] ${isUpcoming ? "text-teal-600 font-medium" : "text-navy-400"}`}>
            {event.detalhe}
          </p>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<OcorrenciaStatus, string> = {
  aberta:       "Aberta",
  acompanhando: "Acompanhando",
  resolvida:    "Resolvida",
};

const STATUS_STYLE: Record<OcorrenciaStatus, string> = {
  aberta:       "bg-navy-100 text-navy-600",
  acompanhando: "bg-amber-100 text-amber-700",
  resolvida:    "bg-teal-100 text-teal-700",
};

function OcorrenciaEventRow({
  event,
  ocorrencia,
  onStatusChange,
  onToPendencia,
}: {
  event: TimelineEvent;
  ocorrencia: Ocorrencia | undefined;
  onStatusChange: (id: string, s: OcorrenciaStatus) => void;
  onToPendencia: (oc: Ocorrencia) => void;
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const status: OcorrenciaStatus = ocorrencia?.statusOcorrencia ?? "aberta";

  return (
    <div className="relative flex items-start gap-3 pb-3">
      <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cream-100 text-navy-600 text-[11px]">
        !
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[12px] font-medium leading-snug text-navy-800">{event.label}</p>
        {event.detalhe && (
          <p className="text-[10.5px] text-navy-400">{event.detalhe}</p>
        )}
        {ocorrencia && (
          <>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowStatusPicker((v) => !v)}
                className={`inline-flex min-h-[44px] items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[status]}`}
              >
                {STATUS_LABELS[status]} ▾
              </button>
              {!ocorrencia.linkedPendenciaId ? (
                <button
                  type="button"
                  onClick={() => onToPendencia(ocorrencia)}
                  className="inline-flex min-h-[44px] items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-[10px] text-navy-500 transition-colors hover:bg-navy-100"
                >
                  → Criar pendência
                </button>
              ) : (
                <span className="flex min-h-[44px] items-center text-[10px] text-teal-600">Pendência criada ✓</span>
              )}
            </div>
            {showStatusPicker && (
              <div className="mt-1 flex gap-1.5 flex-wrap">
                {(["aberta", "acompanhando", "resolvida"] as OcorrenciaStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onStatusChange(ocorrencia.id, s);
                      setShowStatusPicker(false);
                    }}
                    className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-[10px] font-medium ring-1 transition-all active:scale-95 ${
                      status === s
                        ? STATUS_STYLE[s] + " ring-current"
                        : "bg-white text-navy-500 ring-navy-200 hover:ring-navy-400"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type TimelineOperacionalProps = {
  refreshKey?: number;
};

export default function TimelineOperacional({ refreshKey }: TimelineOperacionalProps) {
  const [hydrated, setHydrated] = useState(false);
  const [upcoming, setUpcoming] = useState<TimelineEvent[]>([]);
  const [past, setPast] = useState<TimelineEvent[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  function refresh() {
    const result = buildTimeline();
    setUpcoming(result.upcoming);
    setPast(result.past);
    setOcorrencias(getOcorrencias());
  }

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStatusChange(id: string, status: OcorrenciaStatus) {
    updateOcorrencia(id, { statusOcorrencia: status });
    setOcorrencias(getOcorrencias());
  }

  function handleToPendencia(oc: Ocorrencia) {
    if (oc.linkedPendenciaId) return;
    const titulo = oc.titulo
      ? `Acompanhar: ${oc.titulo}`
      : `Acompanhar: ${OCORRENCIA_LABELS[oc.tipo]}${oc.descricao ? " — " + oc.descricao.slice(0, 60) : ""}`;
    const nova = addPendencia({ titulo, origem: "ocorrencia", categoria: "operacional" });
    updateOcorrencia(oc.id, { linkedPendenciaId: nova.id });
    setOcorrencias(getOcorrencias());
    void trackEvent("ocorrencia_to_pendencia", { tipo: oc.tipo });
  }

  function getOcorrenciaForEvent(event: TimelineEvent): Ocorrencia | undefined {
    if (event.tipo !== "ocorrencia") return undefined;
    const oc_id = event.id.replace(/^oc-/, "");
    return ocorrencias.find((o) => o.id === oc_id);
  }

  if (!hydrated || (upcoming.length === 0 && past.length === 0)) return null;

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      logInteraction("timeline-aberta", "");
      void trackEvent("timeline_viewed", { upcoming_count: upcoming.length, past_count: past.length });
    }
  };

  const nextUpcoming = upcoming[0];

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
          <p className="text-[12.5px] font-medium text-navy-800">Histórico operacional</p>
          <p className="text-[11px] text-navy-400">
            {nextUpcoming
              ? `Próximo: ${nextUpcoming.label.split(" vence ")[0]} · ${nextUpcoming.detalhe}`
              : `${past.length} registro${past.length !== 1 ? "s" : ""} recentes`}
          </p>
        </div>
        <span className="flex-shrink-0 text-[11px] text-navy-400">
          {expanded ? "Recolher ↑" : "Ver →"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 rounded-2xl border border-navy-100 bg-white/90 p-4">

          {/* Próximas datas */}
          {upcoming.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-teal-600">
                Próximas datas
              </p>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-teal-100" aria-hidden="true" />
                <div className="space-y-0">
                  {upcoming.map((event) =>
                    event.tipo === "ocorrencia"
                      ? <OcorrenciaEventRow key={event.id} event={event} ocorrencia={getOcorrenciaForEvent(event)} onStatusChange={handleStatusChange} onToPendencia={handleToPendencia} />
                      : <EventRow key={event.id} event={event} isUpcoming />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Histórico */}
          {past.length > 0 && (
            <>
              {upcoming.length > 0 && (
                <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-navy-300">
                  Histórico
                </p>
              )}
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-navy-100" aria-hidden="true" />
                <div className="space-y-0">
                  {past.map((event) =>
                    event.tipo === "ocorrencia"
                      ? <OcorrenciaEventRow key={event.id} event={event} ocorrencia={getOcorrenciaForEvent(event)} onStatusChange={handleStatusChange} onToPendencia={handleToPendencia} />
                      : <EventRow key={event.id} event={event} />
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </section>
  );
}
