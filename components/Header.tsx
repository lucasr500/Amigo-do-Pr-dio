"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/session";
import { getAllCondominios } from "@/lib/condominios";
import BrandMark from "@/components/BrandMark";
import type { AppTab } from "@/components/BottomNav";

type Props = {
  refreshKey?: number;
  activeTab?: AppTab;
  unreadNotifications?: number;
  onNotificationsClick?: () => void;
  onCondominioSelectorOpen?: () => void;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Header({ refreshKey, activeTab, unreadNotifications = 0, onNotificationsClick, onCondominioSelectorOpen }: Props) {
  const [nomeCondominio,  setNomeCondominio]  = useState<string | null>(null);
  const [condoCount,      setCondoCount]      = useState(1);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setNomeCondominio(getProfile()?.nomeCondominio ?? null);
    setCondoCount(getAllCondominios().length);
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

  // ── Saudação premium — tela Início ──────────────────────────────────────────
  if (activeTab === "inicio") {
    return (
      <header
        className="px-5 pb-5 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)] sm:px-6"
        aria-label="Cabeçalho"
      >
        <div className="flex items-start justify-between animate-fade-in">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-bold leading-tight text-navy-800">
              {getGreeting()}, Síndico!
            </h1>
            {onCondominioSelectorOpen && nomeCondominio ? (
              <button
                type="button"
                onClick={onCondominioSelectorOpen}
                className="mt-1.5 flex items-center gap-1 rounded-full pr-1 text-left transition-colors hover:opacity-70 active:scale-[0.97]"
                aria-label="Selecionar condomínio"
              >
                <span className="max-w-[200px] truncate text-[13px] leading-relaxed text-navy-500">
                  {nomeCondominio}
                </span>
                {condoCount > 1 && (
                  <span className="ml-0.5 flex-shrink-0 rounded-full bg-navy-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-navy-500">
                    {condoCount}
                  </span>
                )}
                <svg className="h-3 w-3 flex-shrink-0 text-navy-300" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <p className="mt-1.5 max-w-[280px] truncate text-[13px] leading-relaxed text-navy-500">
                {nomeCondominio ?? "Aqui está o que acontece no seu condomínio."}
              </p>
            )}
            {!isOnline && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                Sem conexão — dados locais
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={unreadNotifications > 0 ? `${unreadNotifications} notificações não lidas` : "Notificações"}
            onClick={onNotificationsClick}
            className="relative ml-3 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-navy-300 transition-colors hover:bg-navy-50 hover:text-navy-500 active:scale-[0.96]"
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
      </header>
    );
  }

  // ── Marca compacta — demais telas ────────────────────────────────────────────
  return (
    <header
      className="px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+0.875rem)] sm:px-6"
      aria-label="Cabeçalho"
    >
      <div className="flex items-center gap-3 animate-fade-in">
        <BrandMark className="h-9 w-9 flex-shrink-0 shadow-[0_1px_2px_rgba(12,29,39,0.08),0_4px_12px_-6px_rgba(12,29,39,0.30)]" />
        <div className="flex flex-col leading-tight">
          <h1 className="font-display text-[17px] font-semibold text-navy-800">
            Amigo do Prédio
          </h1>
          {!isOnline ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              Offline
            </span>
          ) : onCondominioSelectorOpen && nomeCondominio ? (
            <button
              type="button"
              onClick={onCondominioSelectorOpen}
              className="flex items-center gap-1 rounded-full pr-0.5 transition-colors hover:opacity-70 active:scale-[0.97]"
              aria-label="Selecionar condomínio"
            >
              <span className="max-w-[160px] truncate text-[11px] text-navy-400">
                {nomeCondominio}
              </span>
              {condoCount > 1 && (
                <span className="flex-shrink-0 rounded-full bg-navy-100 px-1.5 py-0.5 text-[9px] font-semibold text-navy-400">
                  {condoCount}
                </span>
              )}
              <svg className="h-2.5 w-2.5 flex-shrink-0 text-navy-300" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <p className="max-w-[200px] truncate text-[11px] text-navy-400 transition-all duration-300">
              {nomeCondominio ?? "Central operacional"}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
