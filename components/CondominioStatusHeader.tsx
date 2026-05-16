"use client";

import { useEffect, useState } from "react";
import {
  getMemoriaOperacional,
  getProfile,
  hasMemoriaOperacional,
  computeCondominioHealth,
  CondominioHealth,
  CondominioHealthStatus,
  MemoriaOperacional,
  CondominioProfile,
  logInteraction,
} from "@/lib/session";
import { ate, desde, past } from "@/lib/urgency";
import { trackEvent } from "@/lib/telemetry";

// ─── Status rows ──────────────────────────────────────────────────────────────

type StatusRow = {
  icon: string;
  label: string;
  status: "ok" | "atencao" | "revisar";
  detalhe: string;
  onAskQ?: string;
};

function formatDias(d: number): string {
  if (d === 0) return "hoje";
  if (d === 1) return "1 dia";
  if (d < 30)  return `${d} dias`;
  const mo = Math.round(d / 30);
  return `${mo} mês${mo > 1 ? "es" : ""}`;
}

function buildRows(m: MemoriaOperacional, profile: CondominioProfile | null): StatusRow[] {
  const rows: StatusRow[] = [];

  if (m.vencimentoAVCB) {
    const d = ate(m.vencimentoAVCB);
    if (d < 0) {
      rows.push({ icon: "📋", label: "AVCB", status: "revisar", detalhe: `Vencido há ${formatDias(Math.abs(d))}`, onAskQ: "Como renovar o AVCB do condomínio?" });
    } else if (d <= 7) {
      rows.push({ icon: "📋", label: "AVCB", status: "revisar", detalhe: d === 0 ? "Vence hoje" : `Vence em ${formatDias(d)}`, onAskQ: "Como renovar o AVCB do condomínio?" });
    } else if (d <= 30) {
      rows.push({ icon: "📋", label: "AVCB", status: "revisar", detalhe: `Vence em ${formatDias(d)}`, onAskQ: "Como renovar o AVCB do condomínio?" });
    } else if (d <= 90) {
      rows.push({ icon: "📋", label: "AVCB", status: "atencao", detalhe: `Vence em ${formatDias(d)}`, onAskQ: "Como renovar o AVCB do condomínio?" });
    } else {
      rows.push({ icon: "📋", label: "AVCB", status: "ok", detalhe: `Válido por ${formatDias(d)}` });
    }
  }

  if (m.vencimentoSeguro) {
    const d = ate(m.vencimentoSeguro);
    if (d < 0) {
      rows.push({ icon: "🛡️", label: "Seguro", status: "revisar", detalhe: `Vencido há ${formatDias(Math.abs(d))}`, onAskQ: "O seguro condominial é obrigatório?" });
    } else if (d <= 30) {
      rows.push({ icon: "🛡️", label: "Seguro", status: "revisar", detalhe: d === 0 ? "Renova hoje" : `Renova em ${formatDias(d)}`, onAskQ: "O seguro condominial é obrigatório?" });
    } else if (d <= 90) {
      rows.push({ icon: "🛡️", label: "Seguro", status: "atencao", detalhe: `Renova em ${formatDias(d)}`, onAskQ: "O seguro condominial é obrigatório?" });
    } else {
      rows.push({ icon: "🛡️", label: "Seguro", status: "ok", detalhe: `Válido por ${formatDias(d)}` });
    }
  }

  if (m.ultimaAGO && past(m.ultimaAGO)) {
    const meses = Math.floor(desde(m.ultimaAGO) / 30);
    if (meses >= 14) {
      rows.push({ icon: "👥", label: "AGO", status: "revisar", detalhe: `${meses} meses atrás`, onAskQ: "Quando deve ser realizada a assembleia ordinária?" });
    } else if (meses >= 10) {
      rows.push({ icon: "👥", label: "AGO", status: "atencao", detalhe: `${meses} meses atrás`, onAskQ: "Quando deve ser realizada a assembleia ordinária?" });
    } else {
      const label = meses === 0 ? "este mês" : `${meses} mês${meses > 1 ? "es" : ""} atrás`;
      rows.push({ icon: "👥", label: "AGO", status: "ok", detalhe: label });
    }
  }

  if (m.ultimaDedetizacao && past(m.ultimaDedetizacao)) {
    const ds = desde(m.ultimaDedetizacao);
    if (ds > 180) {
      rows.push({ icon: "🐛", label: "Dedetização", status: "revisar", detalhe: `${formatDias(ds)} atrás`, onAskQ: "Com que frequência deve ser feita a dedetização do condomínio?" });
    } else if (ds > 150) {
      rows.push({ icon: "🐛", label: "Dedetização", status: "atencao", detalhe: `${formatDias(ds)} atrás`, onAskQ: "Com que frequência deve ser feita a dedetização do condomínio?" });
    } else {
      rows.push({ icon: "🐛", label: "Dedetização", status: "ok", detalhe: `${formatDias(ds)} atrás` });
    }
  }

  if (m.ultimaLimpezaCaixaDAgua && past(m.ultimaLimpezaCaixaDAgua)) {
    const ds = desde(m.ultimaLimpezaCaixaDAgua);
    if (ds > 180) {
      rows.push({ icon: "💧", label: "Caixa d'água", status: "revisar", detalhe: `${formatDias(ds)} atrás`, onAskQ: "Com que frequência deve ser limpa a caixa d'água do condomínio?" });
    } else if (ds > 150) {
      rows.push({ icon: "💧", label: "Caixa d'água", status: "atencao", detalhe: `${formatDias(ds)} atrás`, onAskQ: "Com que frequência deve ser limpa a caixa d'água do condomínio?" });
    } else {
      rows.push({ icon: "💧", label: "Caixa d'água", status: "ok", detalhe: `${formatDias(ds)} atrás` });
    }
  }

  if (m.ultimaManutencaoElevador && profile?.hasElevador && past(m.ultimaManutencaoElevador)) {
    const ds = desde(m.ultimaManutencaoElevador);
    if (ds > 45) {
      rows.push({ icon: "🛗", label: "Elevador", status: "revisar", detalhe: `${formatDias(ds)} sem manutenção`, onAskQ: "Com que frequência o elevador precisa de manutenção?" });
    } else if (ds > 30) {
      rows.push({ icon: "🛗", label: "Elevador", status: "atencao", detalhe: "Confirmar manutenção mensal", onAskQ: "Com que frequência o elevador precisa de manutenção?" });
    } else {
      rows.push({ icon: "🛗", label: "Elevador", status: "ok", detalhe: `${formatDias(ds)} atrás` });
    }
  }

  if (m.ultimaInspecaoExtintores && past(m.ultimaInspecaoExtintores)) {
    const ds = desde(m.ultimaInspecaoExtintores);
    const mo = Math.floor(ds / 30);
    if (ds > 210) {
      rows.push({ icon: "🧯", label: "Extintores", status: "revisar", detalhe: `${mo} meses sem inspeção`, onAskQ: "Qual o prazo para manutenção dos extintores do condomínio?" });
    } else if (ds > 150) {
      rows.push({ icon: "🧯", label: "Extintores", status: "atencao", detalhe: "Prazo de inspeção se aproximando", onAskQ: "Qual o prazo para manutenção dos extintores do condomínio?" });
    } else {
      rows.push({ icon: "🧯", label: "Extintores", status: "ok", detalhe: `${mo} meses atrás` });
    }
  }

  return rows;
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE: Record<CondominioHealthStatus, { ring: string; bg: string; text: string; dot: string }> = {
  "em-dia":  { ring: "ring-sage-100",  bg: "bg-sage-50/80",   text: "text-sage-700",   dot: "bg-sage-400"  },
  "atencao": { ring: "ring-amber-100", bg: "bg-amber-50/80",  text: "text-amber-700",  dot: "bg-amber-400" },
  "pendente":{ ring: "ring-amber-200", bg: "bg-amber-50",     text: "text-amber-800",  dot: "bg-amber-500" },
  "critico": { ring: "ring-amber-300", bg: "bg-amber-100/80", text: "text-amber-900",  dot: "bg-amber-600" },
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  onAsk?: (q: string) => void;
  refreshKey?: number;
};

export default function CondominioStatusHeader({ onAsk, refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [health, setHealth] = useState<CondominioHealth | null>(null);
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [nomeCondominio, setNomeCondominio] = useState<string | null>(null);
  const [hasProfileData, setHasProfileData] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    setHasProfileData(!!profile);
    if (profile?.nomeCondominio) setNomeCondominio(profile.nomeCondominio);

    if (!hasMemoriaOperacional()) {
      setHydrated(true);
      return;
    }

    const m = getMemoriaOperacional();
    const h = computeCondominioHealth();
    setHealth(h);
    setRows(buildRows(m, profile));
    setHydrated(true);

    if (h.totalMonitored > 0) {
      void trackEvent("condominio_status_shown", { status: h.status, total: h.totalMonitored });
    }
  }, [refreshKey]);

  if (!hydrated) return null;

  // Estado: perfil cadastrado mas sem memória operacional → nudge de ativação
  if (!health || health.totalMonitored === 0) {
    if (!hasProfileData) return null;

    return (
      <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
        <div className="overflow-hidden rounded-2xl border border-navy-100/60 bg-white/80 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                  Seu condomínio
                </p>
                <p className="mt-0.5 text-[14px] font-semibold text-navy-800 leading-tight">
                  {nomeCondominio ?? "Condomínio configurado"}
                </p>
              </div>
              <span className="mt-0.5 inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ring-navy-100 bg-navy-50/60 text-navy-500">
                <span className="h-1.5 w-1.5 rounded-full bg-navy-300 flex-shrink-0" aria-hidden="true" />
                Monitoramento inativo
              </span>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-navy-500">
              Registre as principais datas do prédio — como vencimento do AVCB e seguro — para ativar o monitoramento automático de vencimentos e manutenções.
            </p>
            {onAsk && (
              <button
                type="button"
                onClick={() => {
                  logInteraction("status-header-no-data-cta", "memoria");
                  onAsk("Como funciona o monitoramento de datas do condomínio?");
                }}
                className="mt-3 text-[12px] font-medium text-navy-600 underline underline-offset-2 transition-colors hover:text-navy-800"
              >
                Como funciona o monitoramento →
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const badge = BADGE[health.status];

  const alertRows   = rows.filter((r) => r.status === "revisar");
  const atencaoRows = rows.filter((r) => r.status === "atencao");
  const okRows      = rows.filter((r) => r.status === "ok");
  const hasUrgency  = alertRows.length > 0 || atencaoRows.length > 0;

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_4px_rgba(31,49,71,0.04),0_8px_24px_-8px_rgba(31,49,71,0.09)]">

        {/* Header: nome + badge de saúde */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Seu condomínio
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-navy-800 leading-tight">
                {nomeCondominio ?? mesAtual}
              </p>
            </div>
            <span
              className={`mt-0.5 inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ${badge.ring} ${badge.bg} ${badge.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${badge.dot}`} aria-hidden="true" />
              {health.label}
            </span>
          </div>
          {health.executiveSummary && (
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-navy-500">
              {health.executiveSummary}
            </p>
          )}
        </div>

        {/* Divisor */}
        <div className="mx-5 border-t border-navy-50" />

        {/* Linhas de status */}
        <div className="px-2 py-2.5">

          {/* Crítico / revisar — clicável, dispara pergunta */}
          {alertRows.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => {
                if (row.onAskQ && onAsk) {
                  logInteraction("status-header-alert", row.label);
                  onAsk(row.onAskQ);
                }
              }}
              disabled={!row.onAskQ || !onAsk}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-amber-50/60 active:bg-amber-50 disabled:cursor-default"
            >
              <span className="flex-shrink-0 text-[14px] leading-none" aria-hidden="true">{row.icon}</span>
              <span className="flex-1 text-[12.5px] font-medium text-navy-800">{row.label}</span>
              <span className="text-[11px] text-amber-600">{row.detalhe}</span>
              {row.onAskQ && onAsk && (
                <svg className="h-3 w-3 flex-shrink-0 text-amber-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}

          {/* Atenção moderada */}
          {atencaoRows.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => {
                if (row.onAskQ && onAsk) {
                  logInteraction("status-header-atencao", row.label);
                  onAsk(row.onAskQ);
                }
              }}
              disabled={!row.onAskQ || !onAsk}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-navy-50/60 active:bg-navy-50 disabled:cursor-default"
            >
              <span className="flex-shrink-0 text-[14px] leading-none" aria-hidden="true">{row.icon}</span>
              <span className="flex-1 text-[12.5px] font-medium text-navy-700">{row.label}</span>
              <span className="text-[11px] text-amber-500">{row.detalhe}</span>
              {row.onAskQ && onAsk && (
                <svg className="h-3 w-3 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}

          {/* Em dia — resumo compacto */}
          {okRows.length > 0 && (
            <div
              className={`flex items-center gap-2.5 px-2 ${
                hasUrgency ? "mt-1 border-t border-navy-50 pt-2.5 pb-1" : "py-2.5"
              }`}
            >
              <svg
                className="h-3.5 w-3.5 flex-shrink-0 text-sage-500"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8l3.5 3.5L13 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[11.5px] text-sage-700">
                {okRows.length === 1
                  ? `${okRows[0].label} em dia`
                  : `${okRows.length} itens em dia`}
              </span>
            </div>
          )}
        </div>

        {/* Rodapé — resumo apenas quando há urgência */}
        {hasUrgency && health.summary && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <p className="text-[11px] text-navy-400">{health.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
