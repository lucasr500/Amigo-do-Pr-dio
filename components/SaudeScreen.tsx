"use client";

import { useEffect, useState } from "react";
import {
  computeHealthScore,
  type HealthScoreResult,
  type HealthStatusKey,
} from "@/lib/health-score";
import {
  getMemoriaOperacional,
  getProfile,
  getAgendaEvents,
  getPendenciasConcluidas,
  type MemoriaOperacional,
  type CondominioProfile,
} from "@/lib/session";

// ─── Status mappings ──────────────────────────────────────────────────────────

const RING_COLOR: Record<HealthStatusKey, string> = {
  critico:           "#ef4444",
  atencao:           "#f59e0b",
  "em-evolucao":     "#60a5fa",
  "bem-acompanhado": "#22c55e",
  "tudo-em-ordem":   "#22c55e",
};

const STATUS_TITLE: Record<HealthStatusKey, string> = {
  critico:           "Requer atenção",
  atencao:           "Atenção necessária",
  "em-evolucao":     "Em evolução",
  "bem-acompanhado": "Condomínio saudável",
  "tudo-em-ordem":   "Condomínio saudável",
};

const STATUS_PHRASE: Record<HealthStatusKey, string> = {
  critico:           "Resolva os alertas prioritários.",
  atencao:           "Resolva os alertas ativos.",
  "em-evolucao":     "Complete as informações essenciais.",
  "bem-acompanhado": "Seu condomínio está no caminho certo.",
  "tudo-em-ordem":   "Tudo operacionalmente em ordem.",
};

const BADGE_LABEL: Record<HealthStatusKey, string> = {
  critico:           "Crítico",
  atencao:           "Atenção",
  "em-evolucao":     "Em evolução",
  "bem-acompanhado": "Bom",
  "tudo-em-ordem":   "Bom",
};

const BADGE_STYLE: Record<HealthStatusKey, string> = {
  critico:           "bg-red-100 text-red-700",
  atencao:           "bg-amber-100 text-amber-700",
  "em-evolucao":     "bg-blue-100 text-blue-700",
  "bem-acompanhado": "bg-green-100 text-green-700",
  "tudo-em-ordem":   "bg-green-100 text-green-700",
};

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

type MonitoredArea = {
  bgColor: string;
  icon: string;
  label: string;
  subLabel: string;
  status: AreaStatus;
};

function computeAreas(
  result: HealthScoreResult,
  m: MemoriaOperacional,
  profile: CondominioProfile | null
): MonitoredArea[] {
  // factors[0]: essentials (AVCB, seguro, mandato)
  const ef = result.factors[0];
  // factors[1]: alerts (critico/atencao/ok)
  const alertF = result.factors[1];
  // factors[4]: routines
  const routF = result.factors[4];

  const docArea: MonitoredArea = {
    bgColor: "bg-blue-50",
    icon: "🛡️",
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
    icon: "📅",
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
    icon: "🔧",
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
    icon: "👥",
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

type Props = {
  refreshKey?: number;
  onBack?: () => void;
  onNavigateToTimeline?: () => void;
};

export default function SaudeScreen({ refreshKey, onBack, onNavigateToTimeline }: Props) {
  const [result, setResult]   = useState<HealthScoreResult | null>(null);
  const [areas, setAreas]     = useState<MonitoredArea[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const r       = computeHealthScore();
    const m       = getMemoriaOperacional();
    const profile = getProfile();
    setResult(r);
    setAreas(computeAreas(r, m, profile));
    setRecords(buildLastRecords());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !result) return null;

  const ringColor    = RING_COLOR[result.statusKey];
  const statusTitle  = STATUS_TITLE[result.statusKey];
  const statusPhrase = STATUS_PHRASE[result.statusKey];
  const badgeLabel   = BADGE_LABEL[result.statusKey];
  const badgeStyle   = BADGE_STYLE[result.statusKey];

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
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-bold leading-tight text-navy-800">
              Saúde operacional
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-navy-500">
              A visão geral do seu condomínio.
            </p>
          </div>
          <button
            type="button"
            aria-label="Notificações"
            className="ml-3 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-navy-300 transition-colors hover:bg-navy-50 hover:text-navy-500"
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
              <path d="M10 2.5A5.5 5.5 0 004.5 8v2.5L3 12.5h14L15.5 10.5V8A5.5 5.5 0 0010 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
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
          </div>
        </div>
      </section>

      {/* ── Áreas monitoradas ───────────────────────────────────────── */}
      <section className="px-5 pb-4 sm:px-6">
        <p className="mb-3 text-[14px] font-semibold text-navy-800">Áreas monitoradas</p>
        <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
          {areas.map((area, idx) => (
            <div key={area.label}>
              {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[17px] ${area.bgColor}`}
                  aria-hidden="true"
                >
                  {area.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-navy-800">{area.label}</p>
                  <p className="mt-0.5 text-[11.5px] text-navy-400">{area.subLabel}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <AreaIcon status={area.status} />
                  <svg className="h-4 w-4 text-navy-200" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-5 shadow-card">
            <p className="text-[12.5px] text-navy-400">Nenhum registro recente.</p>
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

      <p className="px-5 pb-8 text-[10.5px] leading-relaxed text-navy-300 sm:px-6">
        Este índice é apenas operacional e depende dos dados cadastrados no app. Não representa avaliação jurídica ou de compliance.
      </p>

    </div>
  );
}
