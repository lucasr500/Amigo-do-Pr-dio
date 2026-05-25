"use client";

import { useEffect, useState } from "react";
import {
  getMemoriaOperacional,
  getProfile,
  getPendenciasAbertas,
  getUpcomingAgendaEvents,
} from "@/lib/session";
import HomeActionCard from "@/components/HomeActionCard";

function addDaysToISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function countUpcomingPrazos(): number {
  const m = getMemoriaOperacional();
  const profile = getProfile();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const in90ISO = new Date(today.getTime() + 90 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const sysDates: string[] = [];
  if (m.vencimentoAVCB)             sysDates.push(m.vencimentoAVCB);
  if (m.vencimentoSeguro)           sysDates.push(m.vencimentoSeguro);
  if (m.fimMandatoSindico)          sysDates.push(m.fimMandatoSindico);
  if (m.ultimaAGO)                  sysDates.push(addDaysToISO(m.ultimaAGO, 365));
  if (m.ultimaDedetizacao)          sysDates.push(addDaysToISO(m.ultimaDedetizacao, 180));
  if (m.ultimaLimpezaCaixaDAgua)    sysDates.push(addDaysToISO(m.ultimaLimpezaCaixaDAgua, 180));
  if (m.ultimaManutencaoElevador && profile?.hasElevador)
                                    sysDates.push(addDaysToISO(m.ultimaManutencaoElevador, 30));
  if (m.ultimaInspecaoExtintores)   sysDates.push(addDaysToISO(m.ultimaInspecaoExtintores, 365));
  if (m.ultimaVistoriaSPDA)         sysDates.push(addDaysToISO(m.ultimaVistoriaSPDA, 365));
  if (m.ultimaVistoriaEletrica)     sysDates.push(addDaysToISO(m.ultimaVistoriaEletrica, 365));

  const sysCount = sysDates.filter((d) => d >= todayISO && d <= in90ISO).length;
  const manualCount = getUpcomingAgendaEvents(30).length;
  return sysCount + manualCount;
}

function IconClock() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-navy-600" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5V10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-navy-600" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="12" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 5V4a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckbox() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-navy-600" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  refreshKey?: number;
  onNavigateToAgenda?: () => void;
  onNavigateToPendencias?: () => void;
  onNavigateToPassos?: () => void;
};

export default function HomeQuickStats({ refreshKey, onNavigateToAgenda, onNavigateToPendencias, onNavigateToPassos }: Props) {
  const [hydrated, setHydrated]         = useState(false);
  const [prazosCount, setPrazosCount]   = useState(0);
  const [pendCount, setPendCount]       = useState(0);
  const [passosCount, setPassosCount]   = useState(0);

  useEffect(() => {
    const all = getPendenciasAbertas();
    const systemOrigins = new Set(["guidance", "response", "memoria", "ocorrencia"]);
    setPrazosCount(countUpcomingPrazos());
    setPendCount(all.filter((p) => p.origem && systemOrigins.has(p.origem)).length);
    setPassosCount(all.filter((p) => !p.origem || p.origem === "manual" || p.origem === "agenda" || p.origem === "revisao").length);
    setHydrated(true);
  }, [refreshKey]);

  const prazosSubtitle = !hydrated
    ? "Carregando..."
    : prazosCount === 0
    ? "Adicione AVCB, seguro ou manutenções para monitorar."
    : `${prazosCount} próximo${prazosCount > 1 ? "s" : ""} vencimento${prazosCount > 1 ? "s" : ""}`;

  const pendSubtitle = !hydrated
    ? "Carregando..."
    : pendCount === 0
    ? "Sem pendências críticas no momento."
    : `${pendCount} ${pendCount === 1 ? "item aguardando" : "itens aguardando"} ação`;

  const passosSubtitle = !hydrated
    ? "Carregando..."
    : passosCount === 0
    ? "Nenhum próximo passo. Crie um quando surgir uma demanda."
    : `${passosCount} passo${passosCount > 1 ? "s" : ""} aberto${passosCount > 1 ? "s" : ""}`;

  return (
    <>
      <HomeActionCard
        icon={<IconClock />}
        title="Agenda e prazos"
        subtitle={prazosSubtitle}
        badge={prazosCount > 0 ? prazosCount : undefined}
        onClick={onNavigateToAgenda}
      />
      <HomeActionCard
        icon={<IconClipboard />}
        title="Pendências"
        subtitle={pendSubtitle}
        badge={pendCount > 0 ? pendCount : undefined}
        onClick={onNavigateToPendencias}
      />
      <HomeActionCard
        icon={<IconCheckbox />}
        title="Próximos passos"
        subtitle={passosSubtitle}
        badge={passosCount > 0 ? passosCount : undefined}
        onClick={onNavigateToPassos}
      />
    </>
  );
}
