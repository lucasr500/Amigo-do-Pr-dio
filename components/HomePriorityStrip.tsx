"use client";

import { useEffect, useState } from "react";
import { buildCommandCenterCached, type CommandCenterResult } from "@/lib/command-center";
import { getSyncStatus, formatLastSync } from "@/lib/sync/syncStatus";
import { isEnabled } from "@/lib/feature-flags";
import { buildSinceLastVisitContext, type SinceLastVisitContext } from "@/lib/since-last-visit";
import { buildDataMaturity } from "@/lib/data-maturity";
import { getMemoriaOperacional, getMemoriaAssistida } from "@/lib/session";

type Props = {
  refreshKey?: number;
  onNavigate?: (target: "condominio" | "ferramentas" | "agenda" | "pendencias") => void;
  onOpenNotifications?: () => void;
};

const RISK_STRIP_STYLE = {
  critico: "border-terracotta-200/80 bg-terracotta-50/70",
  atencao: "border-amber-200/80 bg-amber-50/70",
  estavel: "border-sage-200/70 bg-sage-50/60",
  "sem-dados": "border-navy-100/80 bg-white/[0.74]",
} as const;

const RISK_DOT = {
  critico: "bg-terracotta-500",
  atencao: "bg-amber-400",
  estavel: "bg-sage-500",
  "sem-dados": "bg-navy-300",
} as const;

export default function HomePriorityStrip({ refreshKey, onNavigate, onOpenNotifications }: Props) {
  type UpcomingVenc = { label: string; days: number };

  const [data, setData] = useState<CommandCenterResult | null>(null);
  const [syncLabel, setSyncLabel] = useState<string | null>(null);
  const [sinceLastVisit, setSinceLastVisit] = useState<SinceLastVisitContext | null>(null);
  const [upcomingVenc, setUpcomingVenc] = useState<UpcomingVenc[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cc = buildCommandCenterCached();
    setData(cc);
    setSinceLastVisit(buildSinceLastVisitContext());

    if (cc.riskLevel === "estavel") {
      const m = getMemoriaOperacional();
      const a = getMemoriaAssistida();
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      function daysTo(iso: string | undefined): number | null {
        if (!iso) return null;
        const d = new Date(`${iso}T00:00:00`);
        if (isNaN(d.getTime())) return null;
        return Math.floor((d.getTime() - now.getTime()) / 86400000);
      }
      const candidates: UpcomingVenc[] = [
        { label: "AVCB", days: daysTo(m.vencimentoAVCB || a.avcb?.value) ?? 999 },
        { label: "Seguro", days: daysTo(m.vencimentoSeguro || a.seguro?.value) ?? 999 },
        { label: "Mandato", days: daysTo(m.fimMandatoSindico || a.mandato?.value) ?? 999 },
      ].filter((x) => x.days >= 31 && x.days <= 90).sort((a, b) => a.days - b.days).slice(0, 2);
      setUpcomingVenc(candidates);
    } else {
      setUpcomingVenc([]);
    }

    if (isEnabled("sync_enabled")) {
      const status = getSyncStatus();
      if (status.state === "synced" && status.lastSyncAt) {
        setSyncLabel(formatLastSync(status.lastSyncAt));
      } else if (status.state === "error") {
        setSyncLabel("Falha no sync");
      }
    }
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return <div className="mx-5 h-[72px] animate-pulse rounded-lg bg-navy-50/80 sm:mx-6" />;

  if (!data || data.riskLevel === "sem-dados") {
    const maturity = buildDataMaturity();

    if (maturity.knownCount === 0) {
      return (
        <section className="px-5 pb-3 sm:px-6">
          <div className="rounded-lg border border-navy-100/80 bg-white/[0.78] px-4 py-3 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-navy-300" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-navy-700">
                Base de gestão ainda em aberto
              </p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-navy-500">
              Cadastre AVCB, seguro e mandato para o app acompanhar prazos sensíveis automaticamente.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.("condominio")}
              className="mt-3 flex min-h-[44px] w-full items-center gap-2 rounded-lg bg-navy-50/70 px-3 py-2.5 text-left transition-colors hover:bg-white active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-snug text-navy-800">Montar base essencial</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-navy-500">Segurança jurídica primeiro</p>
              </div>
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </section>
      );
    }

    const activeCount = maturity.unlockedCapabilities.length;
    const nextField = maturity.nextBestFields[0];
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="rounded-lg border border-navy-100/80 bg-white/[0.78] px-4 py-3 shadow-card">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-navy-300" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-snug text-navy-700">
              {maturity.knownCount} dado{maturity.knownCount > 1 ? "s" : ""} registrado{maturity.knownCount > 1 ? "s" : ""}
              {activeCount > 0 && ` · ${activeCount} recurso${activeCount > 1 ? "s" : ""} ativo${activeCount > 1 ? "s" : ""}`}
            </p>
          </div>
          {nextField && (
            <button
              type="button"
              onClick={() => onNavigate?.("condominio")}
              className="mt-3 flex min-h-[44px] w-full items-center gap-2 rounded-lg bg-navy-50/70 px-3 py-2.5 text-left transition-colors hover:bg-white active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-snug text-navy-800">{nextField.label}</p>
                {nextField.unlocks && (
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-navy-500">{nextField.unlocks}</p>
                )}
              </div>
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </section>
    );
  }

  const topAction = data.topPriority;
  const hasUrgent = data.urgentActions.length > 0;
  const hasCriticalNotif = data.criticalNotifications.length > 0;
  const stripStyle = RISK_STRIP_STYLE[data.riskLevel];
  const dotColor = RISK_DOT[data.riskLevel];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className={`rounded-lg border px-4 py-3 shadow-card ${stripStyle}`}>
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Status geral
            </p>
            <p className="truncate text-[12.5px] font-semibold leading-snug text-navy-800">
              {data.summaryText}
            </p>
          </div>
          {(hasCriticalNotif || data.unreadCount > 0) && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`${data.unreadCount} notificações`}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-white/[0.82] px-2.5 py-1 text-[11px] font-semibold text-terracotta-700 shadow-card transition-colors hover:bg-white active:scale-[0.97] focus:outline-none focus-visible:ring-1 focus-visible:ring-navy-300/40"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta-500" aria-hidden="true" />
              {data.unreadCount}
            </button>
          )}
        </div>

        {topAction && (
          <button
            type="button"
            onClick={() => topAction.resolveTarget && onNavigate?.(topAction.resolveTarget)}
            className="mt-3 flex min-h-[48px] w-full items-center gap-2 rounded-lg bg-white/[0.76] px-3 py-2.5 text-left transition-colors hover:bg-white active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className={`text-[12.5px] font-semibold leading-snug ${hasUrgent ? "text-terracotta-800" : "text-navy-800"}`}>
                {topAction.titulo}
              </p>
              {(topAction.motivo || topAction.impacto) && (
                <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-navy-500">
                  {topAction.motivo}{topAction.impacto ? ` Impacto: ${topAction.impacto}` : ""}
                </p>
              )}
            </div>
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {!hasUrgent && data.todayAnswer && (
          <div className="mt-3 rounded-lg bg-white/[0.52] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-navy-400">
              O que fazer hoje
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-700">
              {data.todayAnswer}
            </p>
          </div>
        )}

        {data.todayFocus.length > 0 && (
          <div className="mt-3 rounded-lg bg-white/[0.56] px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-400">
              Foco de hoje
            </p>
            <div className="space-y-1">
              {data.todayFocus.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate?.(item.target)}
                  className="flex min-h-[36px] w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/70 active:scale-[0.99]"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-navy-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-navy-500" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold leading-snug text-navy-800">{item.title}</span>
                    {item.reason && (
                      <span className="line-clamp-1 text-[10.5px] leading-snug text-navy-500">{item.reason}</span>
                    )}
                  </span>
                  <svg className="h-3 w-3 flex-shrink-0 text-navy-300" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {sinceLastVisit?.hasContext && sinceLastVisit.contextPhrase && (
          <p className={`mt-2 text-[10.5px] leading-snug font-medium ${
            sinceLastVisit.contextPhrase.includes("vencido") || sinceLastVisit.contextPhrase.includes("vence em")
              ? "text-terracotta-700"
              : "text-navy-500"
          }`}>
            {sinceLastVisit.contextPhrase}
          </p>
        )}

        {upcomingVenc.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
            {upcomingVenc.map((v) => (
              <span key={v.label} className="text-[10.5px] text-amber-700 font-medium">
                {v.label} em {v.days} dias
              </span>
            ))}
          </div>
        )}

        {sinceLastVisit && (sinceLastVisit.pendenciasConcluidasMes > 0 || sinceLastVisit.novasOcorrenciasMes > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-navy-500">
            <span className="font-medium text-navy-500">Últimos 30 dias:</span>
            {sinceLastVisit.pendenciasConcluidasMes > 0 && (
              <span className="text-sage-700">
                {sinceLastVisit.pendenciasConcluidasMes} resolvida{sinceLastVisit.pendenciasConcluidasMes > 1 ? "s" : ""}
              </span>
            )}
            {sinceLastVisit.novasOcorrenciasMes > 0 && (
              <span>
                {sinceLastVisit.novasOcorrenciasMes} ocorrência{sinceLastVisit.novasOcorrenciasMes > 1 ? "s" : ""}
              </span>
            )}
            {data && (
              <span>Score {data.healthPercentage}%</span>
            )}
          </div>
        )}

        {syncLabel && (
          <p className="mt-2 text-[10.5px] text-navy-400">
            {syncLabel.includes("Falha") ? "Revisar sincronização: " : "Sincronizado: "}{syncLabel}
          </p>
        )}
      </div>
    </section>
  );
}
