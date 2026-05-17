"use client";

import { useEffect, useState } from "react";
import { getMemoriaOperacional, getProfile } from "@/lib/session";
import { ate, urgencyVencimento, UrgencyLevel } from "@/lib/urgency";

type Props = {
  onAsk?: (q: string) => void;
  onNavigateToCondominio?: () => void;
  refreshKey?: number;
};

type DateRow = {
  icon: string;
  label: string;
  urgency: UrgencyLevel;
  daysRem: number;
  askQ: string;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatLabel(daysRem: number): string {
  const abs = Math.abs(daysRem);
  const fmt = (n: number) => {
    if (n === 0) return "hoje";
    if (n === 1) return "1 dia";
    if (n < 14) return `${n} dias`;
    if (n < 60) return `${Math.round(n / 7)} sem`;
    return `${Math.floor(n / 30)} meses`;
  };
  if (daysRem < 0) return `Vencido há ${fmt(abs)}`;
  if (daysRem === 0) return "Vence hoje";
  return `em ${fmt(daysRem)}`;
}

function urgencyTextColor(u: UrgencyLevel): string {
  switch (u) {
    case "vencido":            return "text-red-500";
    case "hoje":
    case "urgente":            return "text-amber-600";
    case "breve":              return "text-amber-500";
    case "planejamento":
    case "acompanhar":         return "text-navy-500";
    default:                   return "text-sage-600";
  }
}

const INITIAL_VISIBLE = 5;

export default function ProximasDatas({ onAsk, onNavigateToCondominio, refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [rows, setRows] = useState<DateRow[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const m = getMemoriaOperacional();
    const profile = getProfile();
    const computed: DateRow[] = [];

    const push = (icon: string, label: string, targetISO: string, askQ: string) => {
      const urgency = urgencyVencimento(targetISO);
      if (urgency === "ausente") return;
      computed.push({ icon, label, urgency, daysRem: ate(targetISO), askQ });
    };

    // Vencimentos diretos
    if (m.vencimentoAVCB)
      push("📋", "AVCB", m.vencimentoAVCB, "Como renovar o AVCB do condomínio?");
    if (m.vencimentoSeguro)
      push("🛡️", "Seguro condominial", m.vencimentoSeguro, "Como renovar o seguro condominial?");
    if (m.fimMandatoSindico)
      push("🗳️", "Mandato do síndico", m.fimMandatoSindico, "O que acontece quando o mandato do síndico vence?");

    // Rotinas — próxima data calculada a partir da última ocorrência
    if (m.ultimaAGO)
      push("👥", "Próxima AGO", addDays(m.ultimaAGO, 365), "Como convocar uma assembleia geral ordinária?");
    if (m.ultimaDedetizacao)
      push("🐛", "Dedetização", addDays(m.ultimaDedetizacao, 180), "Com que frequência o condomínio deve fazer dedetização?");
    if (m.ultimaLimpezaCaixaDAgua)
      push("💧", "Limpeza da caixa d'água", addDays(m.ultimaLimpezaCaixaDAgua, 180), "Com que frequência deve ser feita a limpeza da caixa d'água?");
    if (m.ultimaManutencaoElevador && profile?.hasElevador)
      push("🛗", "Manutenção do elevador", addDays(m.ultimaManutencaoElevador, 30), "Com que frequência o elevador precisa de manutenção?");
    if (m.ultimaInspecaoExtintores)
      push("🧯", "Inspeção de extintores", addDays(m.ultimaInspecaoExtintores, 365), "Quando deve ser feita a inspeção dos extintores?");
    if (m.ultimaVistoriaSPDA)
      push("⚡", "Vistoria SPDA", addDays(m.ultimaVistoriaSPDA, 365), "Com que frequência deve ser feita a vistoria do para-raios?");
    if (m.ultimaVistoriaEletrica)
      push("🔌", "Vistoria elétrica", addDays(m.ultimaVistoriaEletrica, 365), "Com que frequência deve ser feita a vistoria elétrica?");

    // Mais urgente primeiro (negativo = vencido → aparece no topo)
    computed.sort((a, b) => a.daysRem - b.daysRem);

    setRows(computed);
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || rows.length === 0) return null;

  const visibleRows = showAll ? rows : rows.slice(0, INITIAL_VISIBLE);
  const hasMore = rows.length > INITIAL_VISIBLE;

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-2xl border border-navy-100 bg-white/80 px-4 py-4">

        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
            Próximas datas
          </p>
          <div className="flex items-center gap-3">
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-[11px] text-navy-400 hover:text-navy-600"
              >
                {showAll ? "Menos ↑" : `Ver todos (${rows.length}) ↓`}
              </button>
            )}
            {onNavigateToCondominio && (
              <button
                type="button"
                onClick={onNavigateToCondominio}
                className="text-[11px] text-navy-400 hover:text-navy-600"
              >
                Editar →
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col divide-y divide-navy-50">
          {visibleRows.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => onAsk?.(row.askQ)}
              className="flex w-full items-center gap-2.5 py-2.5 text-left transition-opacity first:pt-0 last:pb-0 hover:opacity-75 active:opacity-50"
            >
              <span
                className="w-5 flex-shrink-0 text-center text-[14px] leading-none"
                aria-hidden="true"
              >
                {row.icon}
              </span>
              <p className="min-w-0 flex-1 text-[12px] font-medium text-navy-800">
                {row.label}
              </p>
              <p className={`flex-shrink-0 text-[11px] font-medium ${urgencyTextColor(row.urgency)}`}>
                {formatLabel(row.daysRem)}
              </p>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
