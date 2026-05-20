"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMemoriaOperacional,
  getOcorrencias,
  getPendenciasAbertas,
  getPendenciasConcluidas,
  getProfile,
} from "@/lib/session";
import { buildGuidanceItems } from "@/lib/guidance";
import { trackEvent } from "@/lib/telemetry";

type QualitativeStatus =
  | "critico"
  | "atencao"
  | "em-evolucao"
  | "bem-acompanhado"
  | "tudo-em-ordem";

type SummaryState = {
  qualStatus: QualitativeStatus;
  diagnosticPhrase: string;
  indicators: string[];
};

type Props = {
  refreshKey?: number;
};

function isThisMonth(iso?: string): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${pluralForm}`;
}

function buildDiagnosticPhrase(
  qualStatus: QualitativeStatus,
  criticalCount: number,
  atencaoCount: number,
  pendingCount: number,
  staleCount: number,
  occurrenceCount: number,
): string {
  switch (qualStatus) {
    case "critico": {
      const parts: string[] = [];
      if (criticalCount > 0) parts.push(plural(criticalCount, "prazo crítico", "prazos críticos"));
      if (pendingCount > 0) parts.push(plural(pendingCount, "próximo passo aberto", "próximos passos abertos"));
      if (occurrenceCount > 0) parts.push(plural(occurrenceCount, "ocorrência esta semana", "ocorrências esta semana"));
      return (parts.slice(0, 3).join(" · ") || "Verifique os alertas abaixo.") + ".";
    }
    case "atencao": {
      const parts: string[] = [];
      if (atencaoCount > 0) parts.push(plural(atencaoCount, "alerta ativo", "alertas ativos"));
      if (staleCount > 0) parts.push(plural(staleCount, "passo parado há mais de 14 dias", "passos parados há mais de 14 dias"));
      else if (pendingCount > 0) parts.push(plural(pendingCount, "próximo passo aberto", "próximos passos abertos"));
      if (occurrenceCount > 0) parts.push(plural(occurrenceCount, "ocorrência esta semana", "ocorrências esta semana"));
      return (parts.slice(0, 3).join(" · ") || "Revise os alertas e pendências.") + ".";
    }
    case "em-evolucao":
      return "Cadastre as datas essenciais para o app acompanhar prazos com mais precisão.";
    case "bem-acompanhado":
      if (pendingCount > 0 && occurrenceCount > 0) {
        return `${plural(pendingCount, "próximo passo aberto", "próximos passos abertos")} · ${plural(occurrenceCount, "ocorrência esta semana", "ocorrências esta semana")}.`;
      }
      if (pendingCount > 0) return `${plural(pendingCount, "próximo passo aberto", "próximos passos abertos")}. Dados essenciais cadastrados.`;
      if (occurrenceCount > 0) return `${plural(occurrenceCount, "ocorrência esta semana", "ocorrências esta semana")}. Sem alertas ativos.`;
      return "Dados essenciais cadastrados e sem alertas ativos.";
    case "tudo-em-ordem":
      return "Sem alertas ativos. Mantenha a revisão semanal e os dados atualizados.";
  }
}

const STATUS_CONFIG: Record<QualitativeStatus, { label: string; ring: string; bg: string; text: string; dot: string }> = {
  "critico":         { label: "Crítico",          ring: "ring-terracotta-200/70", bg: "bg-terracotta-50",  text: "text-terracotta-800", dot: "bg-terracotta-500" },
  "atencao":         { label: "Atenção",           ring: "ring-amber-200/70",     bg: "bg-amber-50/80",    text: "text-amber-800",      dot: "bg-amber-400"     },
  "em-evolucao":     { label: "Em evolução",       ring: "ring-navy-100",         bg: "bg-navy-50/80",     text: "text-navy-500",       dot: "bg-navy-300"      },
  "bem-acompanhado": { label: "Bem acompanhado",   ring: "ring-navy-100",         bg: "bg-navy-50/80",     text: "text-navy-600",       dot: "bg-navy-500"      },
  "tudo-em-ordem":   { label: "Tudo em ordem",     ring: "ring-navy-100",         bg: "bg-navy-50/80",     text: "text-navy-700",       dot: "bg-navy-500"      },
};

export default function HomeResumoPredio({ refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const m = getMemoriaOperacional();
    const profile = getProfile();
    const pending = getPendenciasAbertas();
    const staleSteps = pending.filter(
      (p) => Date.now() - new Date(p.createdAt).getTime() > 14 * 86_400_000
    );
    const weekAgo = Date.now() - 7 * 86_400_000;
    const occurrenceWeek = getOcorrencias().filter(
      (o) => new Date(o.createdAt).getTime() >= weekAgo
    );
    const guidance = buildGuidanceItems(m, profile);
    const criticalItems = guidance.filter((i) => i.priority === "critico");
    const atencaoItems  = guidance.filter((i) => i.priority === "atencao");
    const hasEssentials = !!(m.vencimentoAVCB && m.vencimentoSeguro && m.fimMandatoSindico);

    const qualStatus: QualitativeStatus = (() => {
      if (criticalItems.length > 0)                        return "critico";
      if (atencaoItems.length > 0 || staleSteps.length > 0) return "atencao";
      if (!hasEssentials)                                   return "em-evolucao";
      if (pending.length === 0 && occurrenceWeek.length === 0) return "tudo-em-ordem";
      return "bem-acompanhado";
    })();

    const diagnosticPhrase = buildDiagnosticPhrase(
      qualStatus,
      criticalItems.length,
      atencaoItems.length,
      pending.length,
      staleSteps.length,
      occurrenceWeek.length,
    );

    const indicators: string[] = [];
    if (criticalItems.length > 0)  indicators.push(plural(criticalItems.length, "prazo crítico", "prazos críticos"));
    if (atencaoItems.length > 0)   indicators.push(plural(atencaoItems.length, "alerta de atenção", "alertas de atenção"));
    if (staleSteps.length > 0)     indicators.push(plural(staleSteps.length, "passo parado há +14 dias", "passos parados há +14 dias"));
    else if (pending.length > 0)   indicators.push(plural(pending.length, "próximo passo aberto", "próximos passos abertos"));
    if (occurrenceWeek.length > 0) indicators.push(plural(occurrenceWeek.length, "ocorrência esta semana", "ocorrências esta semana"));

    setSummary({ qualStatus, diagnosticPhrase, indicators: indicators.slice(0, 5) });
    setHydrated(true);

    if (!trackedRef.current) {
      trackedRef.current = true;
      void trackEvent("home_summary_viewed", {
        pending_count: pending.length,
        completed_month_count: getPendenciasConcluidas().filter((p) => isThisMonth(p.completedAt)).length,
        occurrence_week_count: occurrenceWeek.length,
        stale_steps_count: staleSteps.length,
        has_guidance: guidance.length > 0,
        has_memoria: true,
      });
    }
  }, [refreshKey]);

  if (!hydrated || !summary) return null;

  const cfg = STATUS_CONFIG[summary.qualStatus];

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/82 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Saúde operacional
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-snug text-navy-800">
              {summary.diagnosticPhrase}
            </p>
          </div>
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium ring-1 ${cfg.ring} ${cfg.bg} ${cfg.text}`}
          >
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
            {cfg.label}
          </span>
        </div>

        {summary.indicators.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {summary.indicators.map((ind) => (
              <span
                key={ind}
                className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-500"
              >
                {ind}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
