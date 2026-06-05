"use client";

// Strip de prioridade na Home — responde as 4 perguntas essenciais do síndico:
// 1. Qual a ação mais urgente?  2. Há notificações críticas?
// 3. Como está o prédio?        4. Está salvo?

import { useEffect, useState } from "react";
import { buildCommandCenterCached, type CommandCenterResult } from "@/lib/command-center";
import { getSyncStatus, formatLastSync } from "@/lib/sync/syncStatus";
import { isEnabled } from "@/lib/feature-flags";
import { buildSinceLastVisitContext, type SinceLastVisitContext } from "@/lib/since-last-visit";
import { buildDataMaturity } from "@/lib/data-maturity";

type Props = {
  refreshKey?: number;
  onNavigate?: (target: "condominio" | "ferramentas" | "agenda" | "pendencias") => void;
  onOpenNotifications?: () => void;
};

const RISK_STRIP_STYLE = {
  critico:    "border-terracotta-200 bg-terracotta-50/80",
  atencao:    "border-amber-200 bg-amber-50/70",
  estavel:    "border-teal-200/60 bg-teal-50/40",
  "sem-dados": "border-navy-100 bg-navy-50/40",
} as const;

const RISK_DOT = {
  critico:     "bg-terracotta-500",
  atencao:     "bg-amber-400",
  estavel:     "bg-teal-500",
  "sem-dados": "bg-navy-300",
} as const;

export default function HomePriorityStrip({ refreshKey, onNavigate, onOpenNotifications }: Props) {
  const [data, setData] = useState<CommandCenterResult | null>(null);
  const [syncLabel, setSyncLabel] = useState<string | null>(null);
  const [sinceLastVisit, setSinceLastVisit] = useState<SinceLastVisitContext | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cc = buildCommandCenterCached();
    setData(cc);
    setSinceLastVisit(buildSinceLastVisitContext());

    // Sync status discreto
    const syncEnabled = isEnabled("sync_enabled");
    if (syncEnabled) {
      const status = getSyncStatus();
      if (status.state === "synced" && status.lastSyncAt) {
        setSyncLabel(formatLastSync(status.lastSyncAt));
      } else if (status.state === "error") {
        setSyncLabel("Falha no sync");
      }
    }
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return <div className="mx-5 h-[58px] animate-pulse rounded-[16px] bg-navy-50/80 sm:mx-6" />;

  // Estado parcial: usuário tem algum dado mas sem datas essenciais
  if (!data || data.riskLevel === "sem-dados") {
    const maturity = buildDataMaturity();

    // Zero dados — teaser de risco em vez de null
    if (maturity.knownCount === 0) {
      return (
        <section className="px-5 pb-3 sm:px-6">
          <div className="rounded-[16px] border border-navy-100 bg-navy-50/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-navy-300" aria-hidden="true" />
              <p className="flex-1 min-w-0 text-[12px] font-medium leading-snug text-navy-600">
                Monitoramento inativo — nenhuma data cadastrada
              </p>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-navy-400">
              Com as datas cadastradas, o app detecta AVCB vencido, seguro próximo ao vencimento e mandato expirado automaticamente.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.("condominio")}
              className="mt-2 flex min-h-[44px] w-full items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-left transition-colors hover:bg-white active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-snug text-navy-800">Ativar monitoramento de risco</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-navy-500">Cadastre AVCB, seguro ou mandato para começar</p>
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
    const nextField   = maturity.nextBestFields[0];
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="rounded-[16px] border border-navy-100 bg-navy-50/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-navy-300" aria-hidden="true" />
            <p className="flex-1 min-w-0 text-[12px] font-medium leading-snug text-navy-600 truncate">
              {maturity.knownCount} dado{maturity.knownCount > 1 ? "s" : ""} registrado{maturity.knownCount > 1 ? "s" : ""}
              {activeCount > 0 && ` · ${activeCount} recurso${activeCount > 1 ? "s" : ""} ativo${activeCount > 1 ? "s" : ""}`}
            </p>
          </div>
          {nextField && (
            <button
              type="button"
              onClick={() => onNavigate?.("condominio")}
              className="mt-2 flex min-h-[44px] w-full items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-left transition-colors hover:bg-white active:scale-[0.99]"
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
  const dotColor   = RISK_DOT[data.riskLevel];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className={`rounded-[16px] border px-4 py-3 ${stripStyle}`}>

        {/* Linha 1: status dot + summary + notif badge */}
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
          <p className="flex-1 min-w-0 text-[12px] font-medium leading-snug text-navy-700 truncate">
            {data.summaryText}
          </p>
          {(hasCriticalNotif || data.unreadCount > 0) && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`${data.unreadCount} notificações`}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-terracotta-700 hover:bg-white transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta-500" aria-hidden="true" />
              {data.unreadCount}
            </button>
          )}
        </div>

        {/* Linha 2: ação prioritária #1 */}
        {topAction && (
          <button
            type="button"
            onClick={() => topAction.resolveTarget && onNavigate?.(topAction.resolveTarget)}
            className="mt-2 flex min-h-[44px] w-full items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-left transition-colors hover:bg-white active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className={`text-[12px] font-semibold leading-snug ${hasUrgent ? "text-terracotta-800" : "text-navy-800"}`}>
                {topAction.titulo}
              </p>
              {(topAction.motivo || topAction.impacto) && (
                <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-navy-500">
                  {topAction.motivo}{topAction.impacto ? ` Impacto: ${topAction.impacto}` : ""}
                </p>
              )}
              {!hasUrgent && sinceLastVisit && data && data.guidanceTopTres[0] && (
                <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-navy-500">
                  {data.guidanceTopTres[0].proximoPasso}
                </p>
              )}
            </div>
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {data.todayFocus.length > 0 && (
          <div className="mt-2 rounded-xl bg-white/45 px-3 py-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-navy-400">
              3 coisas para olhar hoje
            </p>
            <div className="mt-1.5 space-y-1.5">
              {data.todayFocus.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate?.(item.target)}
                  className="flex w-full items-start gap-2 rounded-lg px-1 py-1 text-left hover:bg-white/60"
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-300" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-medium leading-snug text-navy-700">{item.title}</span>
                    <span className="line-clamp-1 text-[10.5px] leading-snug text-navy-400">{item.reason}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Linha 3: contexto desde última visita */}
        {sinceLastVisit?.hasContext && sinceLastVisit.contextPhrase && (
          <p className="mt-1.5 text-[10.5px] text-navy-400 leading-snug">
            {sinceLastVisit.newNotificationsCount > 0 ? "⚑ " : "· "}{sinceLastVisit.contextPhrase}
          </p>
        )}

        {/* Linha 3b: resumo últimos 30 dias */}
        {sinceLastVisit && (sinceLastVisit.pendenciasConcluidasMes > 0 || sinceLastVisit.novasOcorrenciasMes > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-navy-400">
            <span className="font-medium text-navy-400">Últimos 30d:</span>
            {sinceLastVisit.pendenciasConcluidasMes > 0 && (
              <span className="text-teal-600">
                {sinceLastVisit.pendenciasConcluidasMes} resolvida{sinceLastVisit.pendenciasConcluidasMes > 1 ? "s" : ""}
              </span>
            )}
            {sinceLastVisit.novasOcorrenciasMes > 0 && (
              <span>
                {sinceLastVisit.novasOcorrenciasMes} ocorrência{sinceLastVisit.novasOcorrenciasMes > 1 ? "s" : ""}
              </span>
            )}
            {data && (
              <span className="text-navy-400">Score {data.healthPercentage}%</span>
            )}
          </div>
        )}

        {/* Linha 4: sync status discreto */}
        {syncLabel && (
          <p className="mt-1 text-[10.5px] text-navy-400">
            {syncLabel.includes("Falha") ? "Falha: " : "OK: "}{syncLabel}
          </p>
        )}
      </div>
    </section>
  );
}
