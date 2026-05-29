"use client";

// Card de configuração progressiva — aparece quando o usuário tem dados parciais.
// Mostra especificamente o que falta e o que será ativado ao preencher.
// Não bloqueia o usuário; tem dismiss e responde ao refreshKey.
// Fases 6, 7, 9: discovery hints + próximo passo + inferências de perfil.

import { useEffect, useState } from "react";
import { buildDataMaturity, type DataMaturityNextStep } from "@/lib/data-maturity";
import { getUnlockReasonForField } from "@/lib/capability-unlocks";

type Props = {
  refreshKey?: number;
  onNavigate: (target: "condominio" | "ferramentas") => void;
};

const SESSION_DISMISS_KEY = "progressive_setup_dismissed_until";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const val = sessionStorage.getItem(SESSION_DISMISS_KEY);
  if (!val) return false;
  return Date.now() < parseInt(val, 10);
}

function dismiss(): void {
  sessionStorage.setItem(SESSION_DISMISS_KEY, String(Date.now() + 4 * 60 * 60 * 1000));
}

export default function ProgressiveSetupCard({ refreshKey, onNavigate }: Props) {
  const [nextStep, setNextStep] = useState<DataMaturityNextStep | null>(null);
  const [discoveryHint, setDiscoveryHint] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isDismissed()) { setDismissed(true); setHydrated(true); return; }
    const m = buildDataMaturity();
    const step = m.essentialDatesFilled < 3 ? m.nextStep : null;
    setNextStep(step);
    setDiscoveryHint(step?.discoveryHint ?? null);
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || dismissed || !nextStep) return null;

  const unlockReason = nextStep.campo
    ? getUnlockReasonForField(nextStep.campo)
    : nextStep.subtitulo;

  const handleDismiss = () => { dismiss(); setDismissed(true); };

  return (
    <div className="mx-5 mb-3 sm:mx-6">
      <div className="overflow-hidden rounded-[16px] border border-teal-200/70 bg-teal-50/60 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-3 w-3 text-teal-700" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-navy-800">{nextStep.titulo}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-teal-700">{unlockReason}</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dispensar"
            className="flex-shrink-0 p-1 text-navy-300 hover:text-navy-500 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Phase 6: discovery hint — onde encontrar esta informação */}
        {discoveryHint && (
          <p className="mt-1.5 text-[10.5px] leading-snug text-navy-400">
            <span className="font-medium">Onde encontrar:</span> {discoveryHint}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate(nextStep.target)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.97]"
          >
            Preencher agora
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[11px] text-navy-400 hover:text-navy-600 transition-colors"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
