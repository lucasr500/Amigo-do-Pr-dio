"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCurrentMonthKey,
  getPendenciasAbertas,
  getPendenciasConcluidas,
  getRevisaoMensalHomeMeta,
  getSessionMeta,
  hasMemoriaOperacional,
  recordRevisaoMensalHomeOpen,
} from "@/lib/session";
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

function isInMonthlyWindow(): boolean {
  const day = new Date().getDate();
  return day >= 1 && day <= 7;
}

function isThisMonth(iso?: string): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function RevisaoMensalCard({ refreshKey, onOpen }: Props) {
  const [show, setShow] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [guidanceCount, setGuidanceCount] = useState(0);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!hasMemoriaOperacional()) { setShow(false); return; }
    const meta = getSessionMeta();
    const monthKey = getCurrentMonthKey();
    const homeMeta = getRevisaoMensalHomeMeta();
    const completedThisMonth = getPendenciasConcluidas()
      .filter((p) => isThisMonth(p.completedAt));
    const openItems = getPendenciasAbertas();
    const guidanceThisMonth = completedThisMonth
      .filter((p) => p.origem === "guidance").length;
    const shouldShow =
      !isDoneThisMonth(meta.lastRevisaoMensalAt) &&
      (isInMonthlyWindow() || homeMeta.seenMonthKey !== monthKey);

    setCompletedCount(completedThisMonth.length);
    setPendingCount(openItems.length);
    setGuidanceCount(guidanceThisMonth);

    if (shouldShow) {
      setShow(true);
      if (!trackedRef.current) {
        trackedRef.current = true;
        void trackEvent("revisao_mensal_surface_seen", {
          month_key: monthKey,
          open_count: homeMeta.openCount,
          completed_count: completedThisMonth.length,
          pending_count: openItems.length,
        });
        void trackEvent("revisao_mensal_progress_viewed", {
          month_key: monthKey,
          completed_count: completedThisMonth.length,
          pending_count: openItems.length,
        });
      }
    } else {
      setShow(false);
    }
  }, [refreshKey]);

  if (!show) return null;

  const handleOpen = () => {
    const monthKey = getCurrentMonthKey();
    const meta = recordRevisaoMensalHomeOpen(monthKey);
    void trackEvent("revisao_mensal_opened_from_home", {
      month_key: monthKey,
      open_count: meta.openCount,
      completed_count: completedCount,
      pending_count: pendingCount,
    });
    onOpen?.();
  };

  const hasProgress = completedCount > 0 || pendingCount > 0 || guidanceCount > 0;

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/80 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
          Revisão mensal
        </p>
        <p className="mt-1 text-[13.5px] font-semibold leading-snug text-navy-800">
          Sua revisão mensal está disponível
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-navy-500">
          Reserve 3 minutos para verificar pendências, vencimentos e cuidados importantes do prédio.
        </p>

        <div className="mt-3 rounded-xl bg-navy-50/55 px-3 py-2.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-navy-400">
            Este mês no prédio
          </p>
          {hasProgress ? (
            <div className="mt-1.5 space-y-1 text-[12px] leading-snug text-navy-600">
              <p>{completedCount} próximo{completedCount !== 1 ? "s" : ""} passo{completedCount !== 1 ? "s" : ""} concluído{completedCount !== 1 ? "s" : ""}</p>
              <p>{pendingCount} pendência{pendingCount !== 1 ? "s" : ""} aberta{pendingCount !== 1 ? "s" : ""}</p>
              {guidanceCount > 0 && (
                <p>{guidanceCount} alerta{guidanceCount !== 1 ? "s" : ""} acompanhado{guidanceCount !== 1 ? "s" : ""}</p>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-[12px] leading-relaxed text-navy-500">
              Conclua próximos passos para montar o resumo do mês.
            </p>
          )}
        </div>

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
