"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/session";
import BrandMark from "@/components/BrandMark";
import type { AppTab } from "@/components/BottomNav";

type Props = {
  refreshKey?: number;
  activeTab?: AppTab;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Header({ refreshKey, activeTab }: Props) {
  const [nomeCondominio, setNomeCondominio] = useState<string | null>(null);

  useEffect(() => {
    setNomeCondominio(getProfile()?.nomeCondominio ?? null);
  }, [refreshKey]);

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
            <p className="mt-1.5 max-w-[280px] truncate text-[13px] leading-relaxed text-navy-500">
              {nomeCondominio ?? "Aqui está o que acontece no seu condomínio."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Notificações"
            className="ml-3 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-navy-300 transition-colors hover:bg-navy-50 hover:text-navy-500 active:scale-[0.96]"
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
          <p className="max-w-[200px] truncate text-[11px] text-navy-400 transition-all duration-300">
            {nomeCondominio ?? "Central operacional"}
          </p>
        </div>
      </div>
    </header>
  );
}
