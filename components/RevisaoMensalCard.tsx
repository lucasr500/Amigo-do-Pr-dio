"use client";

import { useEffect, useRef, useState } from "react";
import { getSessionMeta, hasMemoriaOperacional } from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  refreshKey?: number;
  onOpen?: () => void;
};

function isDoneThisMonth(lastAt: string | null): boolean {
  if (!lastAt) return false;
  const last = new Date(lastAt);
  const now = new Date();
  return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
}

export default function RevisaoMensalCard({ refreshKey, onOpen }: Props) {
  const [show, setShow] = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!hasMemoriaOperacional()) { setShow(false); return; }
    const meta = getSessionMeta();
    if (!isDoneThisMonth(meta.lastRevisaoMensalAt)) {
      setShow(true);
      if (!trackedRef.current) {
        trackedRef.current = true;
        void trackEvent("revisao_mensal_surface_seen", {});
      }
    } else {
      setShow(false);
    }
  }, [refreshKey]);

  if (!show) return null;

  const mes = new Date().toLocaleDateString("pt-BR", { month: "long" });

  const handleOpen = () => {
    void trackEvent("revisao_mensal_opened_from_home", {});
    onOpen?.();
  };

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/80 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
          Revisão mensal
        </p>
        <p className="mt-1 text-[13.5px] font-semibold leading-snug text-navy-800">
          Sua revisão de {mes} está disponível
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-navy-500">
          Reserve 3 minutos para verificar pendências, vencimentos e cuidados importantes do prédio.
        </p>
        <button
          type="button"
          onClick={handleOpen}
          className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-cream-50 transition-all duration-200 hover:bg-navy-800 active:scale-[0.98]"
        >
          Fazer revisão
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
