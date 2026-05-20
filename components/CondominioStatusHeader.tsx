"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  hasMemoriaOperacional,
  computeCondominioHealth,
  CondominioHealth,
  CondominioHealthStatus,
  logInteraction,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE: Record<CondominioHealthStatus, { ring: string; bg: string; text: string; dot: string }> = {
  "em-dia":  { ring: "ring-navy-100",       bg: "bg-navy-50/80",       text: "text-navy-600",       dot: "bg-navy-400"      },
  "atencao": { ring: "ring-amber-100",      bg: "bg-amber-50/70",      text: "text-amber-700",      dot: "bg-amber-300"     },
  "pendente":{ ring: "ring-amber-300",      bg: "bg-amber-100",        text: "text-amber-800",      dot: "bg-amber-500"     },
  "critico": { ring: "ring-terracotta-300", bg: "bg-terracotta-50",    text: "text-terracotta-800", dot: "bg-terracotta-500"},
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  onAsk?: (q: string) => void;
  refreshKey?: number;
};

export default function CondominioStatusHeader({ onAsk, refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [health, setHealth] = useState<CondominioHealth | null>(null);
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

    const h = computeCondominioHealth();
    setHealth(h);
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
        <div className="overflow-hidden rounded-[22px] border border-cream-200/90 bg-white/86 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
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
              Registre as principais datas do prédio para ativar o monitoramento de vencimentos e manutenções.
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

  const badge = BADGE[health.status];
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="overflow-hidden rounded-[22px] border border-cream-200/90 bg-white/90 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_16px_34px_-26px_rgba(31,49,71,0.32)]">
        <div className="px-5 py-4">
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

          {health.okCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <svg
                className="h-3.5 w-3.5 flex-shrink-0 text-navy-400"
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
              <span className="text-[12px] text-navy-500">
                {health.okCount === 1
                  ? "1 item em dia"
                  : `${health.okCount} itens em dia`}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
