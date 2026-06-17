"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/session";
import BrandMark from "@/components/BrandMark";
import SyncStatusBadge from "@/components/SyncStatusBadge";
import type { AppTab, NavProfile } from "@/components/BottomNav";

type Props = {
  refreshKey?: number;
  activeTab?: AppTab;
  unreadNotifications?: number;
  profile?: NavProfile;
  onNotificationsClick?: () => void;
  onSearchOpen?: () => void;
  onProfileSwitch?: () => void;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Header({
  refreshKey,
  activeTab,
  unreadNotifications = 0,
  profile = "manager",
  onNotificationsClick,
  onSearchOpen,
  onProfileSwitch,
}: Props) {
  const [nomeCondominio, setNomeCondominio] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const profileLabel = profile === "resident" ? "Morador" : "Síndico/Gestor";

  useEffect(() => {
    setNomeCondominio(getProfile()?.nomeCondominio ?? null);
  }, [refreshKey]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (activeTab === "inicio") {
    return (
      <header
        className="px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)] sm:px-6"
        aria-label="Cabeçalho"
      >
        <div className="flex items-start justify-between animate-fade-in">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-400">
              Perfil: {profileLabel}
            </p>
            <h1 className="mt-1 font-display text-[27px] font-semibold leading-tight text-navy-800">
              {profile === "resident" ? `${getGreeting()}, morador` : `${getGreeting()}, síndico`}
            </h1>
            <p className="mt-1.5 max-w-[310px] truncate text-[13px] leading-relaxed text-navy-500">
              {nomeCondominio ?? "Acompanhe o que merece atenção agora."}
            </p>
            {!isOnline ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10.5px] font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                Sob seu controle
              </span>
            ) : (
              <div className="mt-2">
                <SyncStatusBadge refreshKey={refreshKey} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-3 mt-0.5">
            {onProfileSwitch && (
              <button
                type="button"
                aria-label={`Trocar perfil: ${profileLabel}`}
                onClick={onProfileSwitch}
                className="flex h-9 items-center rounded-full border border-navy-100/70 bg-white/[0.68] px-3 text-[11px] font-semibold text-navy-500 shadow-card transition-colors hover:bg-white hover:text-navy-800 active:scale-[0.97]"
              >
                Trocar
              </button>
            )}
            {onSearchOpen && (
              <button
                type="button"
                aria-label="Busca global"
                onClick={onSearchOpen}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-navy-100/70 bg-white/[0.68] text-navy-400 shadow-card transition-colors hover:bg-white hover:text-navy-700 active:scale-[0.97]"
              >
                <svg viewBox="0 0 20 20" className="h-[17px] w-[17px]" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button
              type="button"
              aria-label={unreadNotifications > 0 ? `${unreadNotifications} notificações não lidas` : "Notificações"}
              onClick={onNotificationsClick}
              className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-navy-100/70 bg-white/[0.68] text-navy-400 shadow-card transition-colors hover:bg-white hover:text-navy-700 active:scale-[0.97]"
            >
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
                <path
                  d="M10 2.5A5.5 5.5 0 004.5 8v2.5L3 12.5h14L15.5 10.5V8A5.5 5.5 0 0010 2.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 15.5a2 2 0 004 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-500 text-[9px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    );
  }

  const TAB_CONTEXT: Partial<Record<NonNullable<typeof activeTab>, { title: string; sub: string }>> = {
    memoria: { title: "Memória", sub: "Decisões, documentos, fornecedores e histórico do prédio" },
    agenda: profile === "resident"
      ? { title: "Agenda", sub: "Próximos eventos e avisos do condomínio" }
      : { title: "Agenda", sub: "Prazos e rotina do prédio" },
    assistente: profile === "resident"
      ? { title: "Info", sub: "Ajuda e informações do condomínio" }
      : { title: "Assistente", sub: "Orientação prática para decidir melhor" },
    ferramentas: profile === "resident"
      ? { title: "Solicitações", sub: "Canal estruturado com a gestão" }
      : { title: "Ações", sub: "Comunicados, registros, checklists e simulações" },
    condominio: profile === "resident"
      ? { title: "Mural", sub: "Comunicados e avisos do condomínio" }
      : { title: "Meu prédio", sub: nomeCondominio ?? "Financeiro, documentos, memória e backup" },
  };

  const tabCtx = activeTab ? TAB_CONTEXT[activeTab] : undefined;

  return (
    <header
      className="px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+0.875rem)] sm:px-6"
      aria-label="Cabeçalho"
    >
      <div className="flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BrandMark className="h-9 w-9 flex-shrink-0 shadow-card" />
          <div className="min-w-0 flex flex-col leading-tight">
            <h1 className="font-display text-[18px] font-semibold text-navy-800">
              {tabCtx?.title ?? "Amigo do Prédio"}
            </h1>
            {!isOnline ? (
              <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                Sob seu controle
              </span>
            ) : (
              <p className="max-w-[250px] truncate text-[11.5px] text-navy-400">
                {tabCtx?.sub ?? nomeCondominio ?? "Central operacional"}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="hidden rounded-full border border-navy-100 bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold text-navy-500 shadow-card sm:inline-flex">
            Perfil: {profileLabel}
          </span>
          {onProfileSwitch && (
            <button
              type="button"
              aria-label={`Trocar perfil: ${profileLabel}`}
              onClick={onProfileSwitch}
              className="rounded-full border border-navy-100 bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold text-navy-500 shadow-card transition-colors hover:bg-white hover:text-navy-800 active:scale-[0.97]"
            >
              Trocar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
