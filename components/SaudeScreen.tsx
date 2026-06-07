"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  computeHealthScore,
  buildScoreProjection,
  type HealthScoreResult,
  type HealthStatusKey,
  type ScoreProjection,
} from "@/lib/health-score";
import {
  HEALTH_RING_COLOR,
  HEALTH_BADGE_STYLE,
  HEALTH_STATUS_LABEL,
  HEALTH_STATUS_TITLE,
  HEALTH_SHORT_PHRASE,
  hasMinimumHealthData as checkMinHealth,
  buildUpgradeText,
} from "@/lib/health-config";
import {
  getMemoriaOperacional,
  getAgendaEvents,
  getPendenciasConcluidas,
  getAuditLog,
  type MemoriaOperacional,
} from "@/lib/session";
import { getHealthHistoryStats, type HealthHistoryStats } from "@/lib/health-history";
import { trackEvent } from "@/lib/telemetry";

// ─── Status mappings — importados de health-config para evitar duplicação ─────

const RING_COLOR     = HEALTH_RING_COLOR;
const STATUS_TITLE   = HEALTH_STATUS_TITLE;
const STATUS_PHRASE  = HEALTH_SHORT_PHRASE;
const BADGE_LABEL    = HEALTH_STATUS_LABEL;
const BADGE_STYLE    = HEALTH_BADGE_STYLE;

// ─── Large ring indicator ─────────────────────────────────────────────────────

function RingLarge({ pct, color }: { pct: number; color: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative flex h-[108px] w-[108px] flex-shrink-0 items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 108 108" fill="none" aria-hidden="true">
        <circle cx="54" cy="54" r={r} stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="54" cy="54" r={r}
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 54 54)"
        />
      </svg>
      <span className="relative z-10 text-[20px] font-bold leading-none text-navy-800">
        {pct}%
      </span>
    </div>
  );
}

// ─── Monitored areas computation ──────────────────────────────────────────────

type AreaStatus = "ok" | "partial" | "missing";

// SVG icons as React components para substituir emojis
const IconShield = () => (
  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 2L4 5v5c0 3.5 2.5 6.5 6 7.5C13.5 16.5 16 13.5 16 10V5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7.5 10l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCalendar = () => (
  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 8.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 3v2.5M13 3v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="7.5" cy="12" r="1" fill="currentColor" />
    <circle cx="10" cy="12" r="1" fill="currentColor" />
    <circle cx="12.5" cy="12" r="1" fill="currentColor" />
  </svg>
);

const IconWrench = () => (
  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M13.5 3.5a3.5 3.5 0 00-3.47 4L4.5 13a1.5 1.5 0 002.1 2.1l5.5-5.53A3.5 3.5 0 0013.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="13.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const IconPeople = () => (
  <svg className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 16c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M17.5 16c0-2.21-1.57-4-3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AREA_ICONS = {
  shield: IconShield,
  calendar: IconCalendar,
  wrench: IconWrench,
  people: IconPeople,
} as const;

type AreaIconKey = keyof typeof AREA_ICONS;

type MonitoredArea = {
  bgColor: string;
  iconKey: AreaIconKey;
  label: string;
  subLabel: string;
  status: AreaStatus;
};

function computeAreas(
  result: HealthScoreResult,
  m: MemoriaOperacional
): MonitoredArea[] {
  // factors[0]: essentials (AVCB, seguro, mandato)
  const ef = result.factors[0];
  // factors[1]: alerts (critico/atencao/ok)
  const alertF = result.factors[1];
  // factors[4]: routines
  const routF = result.factors[4];

  const docArea: MonitoredArea = {
    bgColor: "bg-blue-50",
    iconKey: "shield",
    label: "Documentação",
    subLabel:
      ef.status === "ok"
        ? "Regularizada"
        : ef.status === "partial"
        ? "Parcialmente atualizada"
        : "Sem dados cadastrados",
    status: ef.status,
  };

  const prazosArea: MonitoredArea = {
    bgColor: "bg-blue-50",
    iconKey: "calendar",
    label: "Prazos e vencimentos",
    subLabel:
      alertF.status === "ok"
        ? "Em dia"
        : alertF.status === "partial"
        ? "Requer atenção"
        : "Pendências críticas",
    status: alertF.status,
  };

  const manuArea: MonitoredArea = {
    bgColor: "bg-amber-50",
    iconKey: "wrench",
    label: "Manutenções",
    subLabel:
      routF?.status === "ok"
        ? "Em dia"
        : routF?.status === "partial"
        ? routF.label.startsWith("Rotinas não")
          ? "Sem registros"
          : "Dados parciais"
        : "Sem registros",
    status: (routF?.status ?? "partial") === "ok" ? "ok" : "partial",
  };

  const hasSupplier = !!(m.administradora || m.prestadoraElevador);
  const fornecedoresArea: MonitoredArea = {
    bgColor: "bg-purple-50",
    iconKey: "people",
    label: "Fornecedores",
    subLabel: hasSupplier ? "Contratos ativos" : "Sem fornecedores cadastrados",
    status: hasSupplier ? "ok" : "partial",
  };

  return [docArea, prazosArea, manuArea, fornecedoresArea];
}

// ─── Last records ─────────────────────────────────────────────────────────────

type RecordItem = {
  id: string;
  label: string;
  detail: string;
  badgeLabel: string;
  badgeStyle: string;
};

const AGENDA_TYPE_LABELS: Record<string, string> = {
  assembleia: "Assembleia", manutencao: "Manutenção", dedetizacao: "Dedetização",
  caixa_agua: "Caixa d'água", extintores: "Extintores", vistoria: "Vistoria",
  obra: "Obra", cobranca: "Cobrança", reuniao: "Reunião", fornecedor: "Fornecedor",
  comunicado: "Comunicado", retorno: "Retorno", outro: "Agenda",
};

function buildLastRecords(): RecordItem[] {
  type Entry = { date: string; item: RecordItem };
  const all: Entry[] = [];

  // Eventos positivos do audit log (micro conquistas operacionais)
  const recentAudit = getAuditLog()
    .filter((e) => e.impact === "positive")
    .slice(-6);
  for (const e of recentAudit) {
    all.push({
      date: e.timestamp,
      item: {
        id: `audit-${e.id}`,
        label: e.action,
        detail: new Date(e.timestamp).toLocaleDateString("pt-BR") + (e.detail ? ` · ${e.detail}` : ""),
        badgeLabel: "Registrado",
        badgeStyle: "bg-blue-100 text-blue-700",
      },
    });
  }

  for (const e of getAgendaEvents().filter((ev) => !!ev.completedAt)) {
    const d = new Date(e.completedAt!);
    all.push({
      date: e.completedAt!,
      item: {
        id: `a-${e.id}`,
        label: e.title,
        detail: `${d.toLocaleDateString("pt-BR")} · ${AGENDA_TYPE_LABELS[e.type] ?? "Agenda"}`,
        badgeLabel: "Concluída",
        badgeStyle: "bg-green-100 text-green-700",
      },
    });
  }

  for (const p of getPendenciasConcluidas()) {
    const d = new Date(p.completedAt ?? p.createdAt);
    all.push({
      date: p.completedAt ?? p.createdAt,
      item: {
        id: `p-${p.id}`,
        label: p.titulo,
        detail: `${d.toLocaleDateString("pt-BR")}${p.categoria ? " · " + p.categoria : ""}`,
        badgeLabel: "Concluído",
        badgeStyle: "bg-green-100 text-green-700",
      },
    });
  }

  return all
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map((e) => e.item);
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function AreaIcon({ status }: { status: AreaStatus }) {
  if (status === "ok") {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400">
      <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" aria-hidden="true">
        <path d="M6 3v3.5M6 8.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

// KB questions surfaced based on health status
const KB_QUESTIONS_BY_STATUS: Partial<Record<HealthStatusKey, string[]>> = {
  critico:      ["O AVCB está vencido — qual o risco imediato?", "Quais riscos críticos o síndico não pode ignorar?", "O síndico pode ser responsabilizado penalmente?"],
  atencao:      ["Como fazer uma revisão mensal do condomínio?", "O seguro predial é obrigatório?", "Como organizar a documentação do condomínio?"],
  "em-evolucao": ["Quais documentos o síndico deve ter em dia?", "Como fazer uma prestação de contas transparente?"],
};

type Props = {
  refreshKey?: number;
  onBack?: () => void;
  onNavigateToTimeline?: () => void;
  onGoToCondominio?: () => void;
  onGoToPendencias?: () => void;
  onGoToAgenda?: () => void;
  onGoToRevisao?: () => void;
  onAskQuestion?: (q: string) => void;
};

function hasMinimumHealthData(): boolean {
  return checkMinHealth(getMemoriaOperacional());
}

export default function SaudeScreen({ refreshKey, onBack, onNavigateToTimeline, onGoToCondominio, onGoToPendencias, onGoToAgenda, onGoToRevisao, onAskQuestion }: Props) {
  const [result, setResult]         = useState<HealthScoreResult | null>(null);
  const [areas, setAreas]           = useState<MonitoredArea[]>([]);
  const [records, setRecords]       = useState<RecordItem[]>([]);
  const [histStats, setHistStats]   = useState<HealthHistoryStats | null>(null);
  const [projection, setProjection] = useState<ScoreProjection | null>(null);
  const [hasData, setHasData]       = useState(false);
  const [hydrated, setHydrated]     = useState(false);
  const [showCalc, setShowCalc]     = useState(false);
  const toggleCalc = useCallback(() => setShowCalc((v) => !v), []);

  useEffect(() => {
    const r       = computeHealthScore();
    const m       = getMemoriaOperacional();
    setHasData(hasMinimumHealthData());
    setResult(r);
    setAreas(computeAreas(r, m));
    setRecords(buildLastRecords());
    setHistStats(getHealthHistoryStats());
    setProjection(buildScoreProjection(r.percentage));
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !result) return null;

  if (!hasData) {
    return (
      <div className="flex w-full max-w-full flex-col overflow-x-hidden">
        <div className="px-5 pb-2 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)] sm:px-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11.5px] font-medium">Voltar</span>
            </button>
          )}
          <h1 className="font-display text-[28px] font-bold leading-tight text-navy-800">Saúde operacional</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-navy-500">A visão geral do seu condomínio.</p>
        </div>

        <section className="px-5 pb-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 rounded-[18px] border border-navy-100/70 bg-white px-5 py-8 shadow-card text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-50">
              <svg viewBox="0 0 32 32" className="h-8 w-8 text-navy-300" fill="none" aria-hidden="true">
                <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" />
                <path d="M16 10v6M16 19v2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[17px] font-bold text-navy-800">Configure seu prédio</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                Adicione prazos — AVCB, seguro, mandato do síndico, manutenções — para ativar o índice de saúde operacional.
              </p>
            </div>
            <span className="rounded-full border border-navy-100 bg-navy-50 px-4 py-1.5 text-[12px] font-semibold text-navy-500">
              Aguardando dados
            </span>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 text-[12.5px] font-medium text-navy-500 underline underline-offset-2 transition-colors hover:text-navy-700"
              >
                Ir para Meu prédio e configurar
              </button>
            )}
          </div>
        </section>

        <p className="px-5 pb-8 text-[10.5px] leading-relaxed text-navy-300 sm:px-6">
          Este índice é apenas operacional e depende dos dados cadastrados no app. Não representa avaliação jurídica ou de compliance.
        </p>
      </div>
    );
  }

  const ringColor    = RING_COLOR[result.statusKey];
  const statusTitle  = STATUS_TITLE[result.statusKey];
  const statusPhrase = STATUS_PHRASE[result.statusKey];
  const badgeLabel   = BADGE_LABEL[result.statusKey];
  const badgeStyle   = BADGE_STYLE[result.statusKey];

  // Frase de tendência histórica — só aparece quando há histórico suficiente
  let trendPhrase: { text: string; color: string } | null = null;
  if (histStats && histStats.totalDaysTracked >= 2 && histStats.previousWeek !== null) {
    const delta = histStats.current - histStats.previousWeek;
    if (delta >= 5) {
      trendPhrase = { text: `↑ O condomínio ficou mais protegido esta semana (+${delta}%)`, color: "text-emerald-600" };
    } else if (delta <= -5) {
      trendPhrase = { text: `↓ Monitoramento recuou ${Math.abs(delta)}% esta semana — verifique alertas`, color: "text-amber-600" };
    } else if (histStats.trend === "stable" && histStats.totalDaysTracked >= 5) {
      trendPhrase = { text: `→ Estável nos últimos 7 dias`, color: "text-navy-400" };
    }
  } else if (histStats && histStats.totalDaysTracked >= 1) {
    trendPhrase = { text: `Monitorado há ${histStats.totalDaysTracked} dia${histStats.totalDaysTracked > 1 ? "s" : ""}`, color: "text-navy-400" };
  }

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">

      {/* ── Cabeçalho ───────────────────────────────────────────────── */}
      <div className="px-5 pb-2 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)] sm:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11.5px] font-medium">Voltar</span>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-tight text-navy-800">
            Saúde operacional
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-navy-500">
            A visão geral do seu condomínio.
          </p>
        </div>
      </div>

      {/* ── Card principal de status ────────────────────────────────── */}
      <section className="px-5 pb-4 sm:px-6">
        <div className="flex items-center gap-4 rounded-[18px] border border-navy-100/70 bg-white px-5 py-5 shadow-card">
          <RingLarge pct={result.percentage} color={ringColor} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold leading-snug text-navy-800">{statusTitle}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-navy-500">{statusPhrase}</p>
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-[11.5px] font-semibold ${badgeStyle}`}>
              {badgeLabel}
            </span>
            <p className="mt-2 text-[11.5px] leading-relaxed text-navy-400">
              {result.diagnosticPhrase}
            </p>
            {trendPhrase && (
              <p className={`mt-2 text-[11px] font-medium ${trendPhrase.color}`}>
                {trendPhrase.text}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Disclaimer discreto ──────────────────────────────────────── */}
      <p className="mx-5 mb-3 text-[10.5px] leading-relaxed text-navy-300 sm:mx-6">
        Índice operacional baseado nos dados cadastrados. Não representa certificação técnica, jurídica ou de compliance.
      </p>

      {/* ── Áreas monitoradas ───────────────────────────────────────── */}
      <section className="px-5 pb-4 sm:px-6">
        <p className="mb-3 text-[14px] font-semibold text-navy-800">Áreas monitoradas</p>
        <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
          {areas.map((area, idx) => {
            const AreaSvgIcon = AREA_ICONS[area.iconKey];
            return (
              <div key={area.label}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${area.bgColor}`}>
                    <AreaSvgIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-navy-800">{area.label}</p>
                    <p className="mt-0.5 text-[11.5px] text-navy-400">{area.subLabel}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <AreaIcon status={area.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Projeção dos próximos 30 dias ───────────────────────────── */}
      {projection && projection.events.length > 0 && (
        <section className="px-5 pb-4 sm:px-6">
          <p className="mb-3 text-[14px] font-semibold text-navy-800">Próximos 30 dias</p>
          <div className="overflow-hidden rounded-[18px] border border-amber-200/70 bg-amber-50/50 shadow-sm">
            <div className="px-4 py-3 border-b border-amber-100/60">
              <p className="text-[12px] leading-relaxed text-amber-800">{projection.narrativa}</p>
            </div>
            {projection.events.map((evt, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="mx-4 border-t border-amber-100/40" />}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${evt.type === "critical" ? "bg-red-100" : "bg-amber-100"}`}>
                    <svg className={`h-4 w-4 ${evt.type === "critical" ? "text-red-600" : "text-amber-600"}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 4v5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M7.15 1.5L1.5 12a1 1 0 00.85 1.5h11.3A1 1 0 0014.5 12L8.85 1.5a1 1 0 00-1.7 0z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-navy-800">{evt.label}</p>
                    <p className="mt-0.5 text-[11px] text-navy-500">
                      Em {evt.dayOffset} dia{evt.dayOffset !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-[11.5px] font-semibold ${evt.type === "critical" ? "text-red-600" : "text-amber-600"}`}>
                    {evt.deltaEstimado}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Como é calculada ────────────────────────────────────────── */}
      <section className="px-5 pb-4 sm:px-6">
        <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
          <button
            type="button"
            onClick={toggleCalc}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-navy-50/40 active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50" aria-hidden="true">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="7" r="0.8" fill="currentColor" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-navy-800">Como a pontuação é calculada</p>
              <p className="mt-0.5 text-[11.5px] text-navy-400">Entenda o que influencia o índice</p>
            </div>
            <svg
              className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${showCalc ? "rotate-90" : ""}`}
              viewBox="0 0 16 16" fill="none" aria-hidden="true"
            >
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showCalc && (
            <div className="border-t border-navy-50 px-4 pb-4 pt-3">
              <p className="mb-3 text-[12.5px] leading-relaxed text-navy-500">
                O índice reflete o nível de controle operacional com base nos dados que você cadastrou. Cinco fatores são avaliados:
              </p>
              <ul className="space-y-2.5">
                {([
                  {
                    svg: <svg className="h-4 w-4 text-blue-500" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L3 4v4c0 2.8 2 5.2 5 6 3-0.8 5-3.2 5-6V4L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6 8l1.5 1.5 2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                    label: "Documentação essencial", desc: "AVCB, seguro obrigatório e mandato do síndico cadastrados"
                  },
                  {
                    svg: <svg className="h-4 w-4 text-blue-500" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
                    label: "Prazos e alertas", desc: "Vencimentos próximos ou itens críticos detectados"
                  },
                  {
                    svg: <svg className="h-4 w-4 text-navy-500" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3.5l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                    label: "Próximos passos", desc: "Pendências abertas ou antigas sem resolução"
                  },
                  {
                    svg: <svg className="h-4 w-4 text-navy-500" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 6V4.5a3 3 0 016 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
                    label: "Perfil do prédio", desc: "Dados de contratos, fornecedores e estrutura informados"
                  },
                  {
                    svg: <svg className="h-4 w-4 text-amber-600" viewBox="0 0 16 16" fill="none"><path d="M11 3a3 3 0 00-2.8 4L3.5 11.5a1.2 1.2 0 001.7 1.7L9.5 8a3 3 0 002.5-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
                    label: "Rotinas de manutenção", desc: "Serviços recorrentes registrados (elevador, extintores etc.)"
                  },
                ] as const).map(({ svg, label, desc }) => (
                  <li key={label} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex-shrink-0" aria-hidden="true">{svg}</span>
                    <div>
                      <p className="text-[12.5px] font-medium text-navy-700">{label}</p>
                      <p className="text-[11px] text-navy-400">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10.5px] leading-relaxed text-navy-400">
                A pontuação sobe conforme você cadastra dados, resolve alertas e conclui pendências. Não representa certificação técnica, jurídica ou contábil.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Caminho prático de melhoria ─────────────────────────────── */}
      {result.percentage < 85 && result.suggestions.length > 0 && (
        <section className="px-5 pb-4 sm:px-6">
          <div className="rounded-[18px] border border-teal-200/60 bg-teal-50/50 px-4 py-3.5">
            <p className="text-[12px] font-semibold text-teal-800">
              {buildUpgradeText(result.percentage, result.suggestions)}
            </p>
          </div>
        </section>
      )}

      {/* ── Como subir o score ─────────────────────────────────────── */}
      {result.percentage < 95 && result.howToGain10Pts.length > 0 && (
        <section className="px-5 pb-4 sm:px-6">
          <p className="mb-2 text-[14px] font-semibold text-navy-800">
            Como subir {Math.min(result.percentage + 15, 100) - result.percentage > 0 ? `para ${Math.min(result.percentage + 15, 100)}%` : "mais"}
          </p>
          {result.biggestBottleneck && (
            <div className="mb-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600">Maior gargalo</p>
              <p className="mt-0.5 text-[12px] font-medium text-amber-900">{result.biggestBottleneck}</p>
            </div>
          )}
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {result.howToGain10Pts.map((item, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-semibold text-teal-700">
                    {idx + 1}
                  </span>
                  <p className="text-[12.5px] leading-snug text-navy-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Para melhorar ──────────────────────────────────────────── */}
      {result.suggestions.length > 0 && (
        <section className="px-5 pb-4 sm:px-6">
          <p className="mb-3 text-[14px] font-semibold text-navy-800">O que faz diferença</p>
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {result.suggestions.map((item, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[10px] font-semibold text-navy-600">
                    {idx + 1}
                  </span>
                  <p className="text-[13px] leading-snug text-navy-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ações práticas ──────────────────────────────────────────── */}
      {(onGoToPendencias || onGoToAgenda || onGoToRevisao || onGoToCondominio) && (
        <section className="px-5 pb-4 sm:px-6">
          <p className="mb-3 text-[14px] font-semibold text-navy-800">Ações práticas</p>
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {([
              onGoToPendencias && {
                fn: onGoToPendencias,
                svgIcon: <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 7v4M10 12.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                bg: "bg-amber-50",
                label: "Ver pendências", sub: "Revisar tarefas em aberto e vencidas", eventKey: "pendencias"
              },
              onGoToAgenda && {
                fn: onGoToAgenda,
                svgIcon: <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 8.5h14M7 3v2.5M13 3v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                bg: "bg-blue-50",
                label: "Abrir agenda", sub: "Ver próximas datas e manutenções", eventKey: "agenda"
              },
              onGoToRevisao && {
                fn: onGoToRevisao,
                svgIcon: <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                bg: "bg-green-50",
                label: "Revisão mensal", sub: "Avaliar a rotina operacional do prédio", eventKey: "revisao"
              },
              onGoToCondominio && {
                fn: onGoToCondominio,
                svgIcon: <svg className="h-5 w-5 text-navy-500" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 18v-5h4v5M7 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                bg: "bg-navy-50",
                label: "Atualizar dados", sub: "Completar dados do perfil do prédio", eventKey: "condominio"
              },
            ] as const).filter(Boolean).map((action, idx) => {
              const a = action as { fn: () => void; svgIcon: React.ReactNode; bg: string; label: string; sub: string; eventKey: string };
              return (
                <div key={a.label}>
                  {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                  <button
                    type="button"
                    onClick={() => {
                      void trackEvent("saude_action_cta_tap", { status: result.statusKey, action: a.eventKey });
                      a.fn();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-navy-50/40 active:scale-[0.99]"
                  >
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${a.bg}`}>
                      {a.svgIcon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-navy-800">{a.label}</p>
                      <p className="mt-0.5 text-[11.5px] text-navy-400">{a.sub}</p>
                    </div>
                    <svg className="h-4 w-4 flex-shrink-0 text-navy-200" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Últimos registros ───────────────────────────────────────── */}
      <section className="px-5 pb-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-navy-800">Últimos registros</p>
          {onNavigateToTimeline && (
            <button
              type="button"
              onClick={onNavigateToTimeline}
              className="text-[12.5px] font-medium text-navy-500 transition-colors hover:text-navy-700"
            >
              Ver tudo
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-5 shadow-card text-center">
            <p className="text-[13px] font-medium text-navy-700">Nenhum registro ainda</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-navy-400">
              Conquistas aparecem aqui — pendências concluídas, agendas realizadas, dados atualizados.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {records.map((rec, idx) => (
              <div key={rec.id}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-navy-800">{rec.label}</p>
                    <p className="mt-0.5 text-[11px] text-navy-400">{rec.detail}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${rec.badgeStyle}`}>
                      {rec.badgeLabel}
                    </span>
                    <svg className="h-4 w-4 text-navy-200" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Pergunte ao assistente ──────────────────────────────────── */}
      {onAskQuestion && KB_QUESTIONS_BY_STATUS[result.statusKey] && (
        <section className="px-5 pb-4 sm:px-6">
          <p className="mb-3 text-[14px] font-semibold text-navy-800">Pergunte ao assistente</p>
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {KB_QUESTIONS_BY_STATUS[result.statusKey]!.map((q, idx) => (
              <div key={q}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                <button
                  type="button"
                  onClick={() => {
                    void trackEvent("saude_kb_question_tap", { question: q, status: result.statusKey });
                    onAskQuestion(q);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-navy-50/40 active:scale-[0.99]"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-50" aria-hidden="true">
                    <svg className="h-4 w-4 text-navy-400" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M8 5.5C7 5.5 6.5 6 6.5 7c0 .5.5 1 1 1h1v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <circle cx="8" cy="10.5" r="0.6" fill="currentColor" />
                    </svg>
                  </span>
                  <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-navy-700">{q}</p>
                  <svg className="h-4 w-4 flex-shrink-0 text-navy-200" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="pb-8" />

    </div>
  );
}
