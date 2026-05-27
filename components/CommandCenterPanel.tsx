"use client";

// Painel de comando central — agrega ações urgentes, pendências, documentos,
// férias e notificações em um único painel coeso. Substitui PlanoAcaoPanel.

import { useEffect, useMemo, useState } from "react";
import { buildCommandCenter, type CommandCenterResult, type CommandAction } from "@/lib/command-center";

type Props = {
  refreshKey?: number;
  onNavigate?: (target: "condominio" | "ferramentas" | "agenda" | "pendencias") => void;
};

const PRIORITY_GROUP_LABEL: Record<string, string> = {
  urgente:          "Urgente",
  este_mes:         "Este mês",
  proximos_90_dias: "Próximos meses",
  quando_possivel:  "Quando possível",
};

const PRIORITY_GROUP_COLOR: Record<string, string> = {
  urgente:          "text-terracotta-700",
  este_mes:         "text-amber-700",
  proximos_90_dias: "text-navy-600",
  quando_possivel:  "text-navy-400",
};

const SOURCE_ICON: Record<string, string> = {
  avcb:         "🛡️",
  seguro:       "📋",
  mandato:      "🏛️",
  funcionarios: "👥",
  documentos:   "📁",
  rotina:       "🔧",
  alerta:       "⚠️",
  pendencias:   "📌",
  geral:        "•",
};

const RISK_CONFIG = {
  critico:    { bg: "bg-terracotta-50 border-terracotta-200", dot: "bg-terracotta-500", label: "Ação necessária" },
  atencao:    { bg: "bg-amber-50 border-amber-200",           dot: "bg-amber-400",      label: "Atenção" },
  estavel:    { bg: "bg-navy-50/60 border-navy-100",          dot: "bg-teal-500",       label: "Estável" },
  "sem-dados":{ bg: "bg-navy-50/40 border-navy-100",          dot: "bg-navy-300",       label: "Sem dados" },
} as const;

function ActionRow({ item, onNavigate }: { item: CommandAction; onNavigate?: Props["onNavigate"] }) {
  return (
    <button
      type="button"
      onClick={() => item.resolveTarget && onNavigate?.(item.resolveTarget)}
      className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-navy-50/60 active:scale-[0.99]"
    >
      <span className="mt-0.5 text-[14px] leading-none flex-shrink-0" aria-hidden="true">
        {SOURCE_ICON[item.sourceModule ?? "geral"] ?? "•"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium leading-snug text-navy-800 group-hover:text-navy-900">
          {item.titulo}
        </p>
        {item.descricao && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-navy-400 line-clamp-2">
            {item.descricao}
          </p>
        )}
      </div>
      {item.resolveTarget && (
        <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-navy-300 group-hover:text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl bg-navy-50/60 px-4 py-5 text-center">
      <p className="text-[13px] font-medium text-navy-700">Condomínio bem organizado</p>
      <p className="mt-0.5 text-[11.5px] text-navy-400">Nenhuma ação prioritária identificada.</p>
    </div>
  );
}

export default function CommandCenterPanel({ refreshKey, onNavigate }: Props) {
  const [data, setData] = useState<CommandCenterResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(buildCommandCenter());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !data) return null;

  const riskCfg = RISK_CONFIG[data.riskLevel];
  const urgentCount = data.urgentActions.length;

  // Collapsed view
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition-all hover:shadow-sm active:scale-[0.99] ${riskCfg.bg}`}
        >
          <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-[15px]" aria-hidden="true">
            🗺️
            {urgentCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-500 text-[9px] font-bold text-white">
                {urgentCount > 9 ? "9+" : urgentCount}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-navy-800">Centro de comando</p>
            <p className="text-[11.5px] text-navy-500 truncate">
              {data.allActions.length === 0
                ? "Condomínio bem organizado"
                : urgentCount > 0
                  ? `${urgentCount} ação${urgentCount > 1 ? "ões" : ""} urgente${urgentCount > 1 ? "s" : ""} · ${data.allActions.length} total`
                  : `${data.allActions.length} ação${data.allActions.length > 1 ? "ões" : ""} · ${riskCfg.label}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${riskCfg.dot}`} aria-hidden="true" />
            <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      </section>
    );
  }

  // Expanded view
  const priorities = ["urgente", "este_mes", "proximos_90_dias", "quando_possivel"] as const;

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="rounded-[22px] border border-navy-100/80 bg-white/92 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.28)]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${riskCfg.dot}`} aria-hidden="true" />
            <div>
              <p className="text-[13px] font-semibold text-navy-800">Centro de comando</p>
              <p className="text-[10.5px] text-navy-400">
                {data.allActions.length === 0
                  ? "Nenhuma ação identificada"
                  : `${data.allActions.length} ação${data.allActions.length !== 1 ? "ões" : ""} · ${riskCfg.label}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full px-2.5 py-1 text-[11.5px] text-navy-400 hover:bg-navy-50 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Resumo */}
        {data.summaryText && (
          <div className="mx-4 mb-3 rounded-xl bg-navy-50/60 px-3.5 py-2.5">
            <p className="text-[12px] leading-relaxed text-navy-600">{data.summaryText}</p>
            {data.upgradeText && (
              <p className="mt-1 text-[11px] leading-relaxed text-navy-500">{data.upgradeText}</p>
            )}
          </div>
        )}

        {/* Stats rápidos */}
        {(data.stalePendenciasCount > 0 || data.missingDocsCount > 0 || data.overdueVacationsCount > 0) && (
          <div className="mx-4 mb-3 flex flex-wrap gap-1.5">
            {data.stalePendenciasCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("pendencias")}
                className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                {data.stalePendenciasCount} passo{data.stalePendenciasCount > 1 ? "s" : ""} parado{data.stalePendenciasCount > 1 ? "s" : ""}
              </button>
            )}
            {data.missingDocsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("condominio")}
                className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600 hover:bg-navy-100 transition-colors"
              >
                {data.missingDocsCount} doc{data.missingDocsCount > 1 ? "s" : ""} a localizar
              </button>
            )}
            {data.overdueVacationsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("condominio")}
                className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[11px] font-medium text-terracotta-700 hover:bg-terracotta-100 transition-colors"
              >
                férias vencidas
              </button>
            )}
          </div>
        )}

        {/* Ações por prioridade */}
        <div className="px-2 pb-4">
          {data.allActions.length === 0 ? (
            <div className="px-2">
              <EmptyState />
            </div>
          ) : (
            priorities.map((priority) => {
              const group = data.allActions.filter((a) => a.prioridade === priority);
              if (group.length === 0) return null;
              return (
                <div key={priority} className="mb-3">
                  <p className={`mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-wide ${PRIORITY_GROUP_COLOR[priority]}`}>
                    {PRIORITY_GROUP_LABEL[priority]}
                  </p>
                  <div>
                    {group.map((item) => (
                      <ActionRow key={item.id} item={item} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notificações críticas se houver */}
        {data.criticalNotifications.length > 0 && (
          <div className="border-t border-navy-50 px-4 pb-4 pt-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-terracotta-600">
              Alertas críticos
            </p>
            <div className="space-y-2">
              {data.criticalNotifications.slice(0, 2).map((n) => (
                <div key={n.id} className="rounded-xl border border-terracotta-100 bg-terracotta-50/60 px-3 py-2.5">
                  <p className="text-[12px] font-semibold text-terracotta-800">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-terracotta-600">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="px-4 pb-3 text-[10px] leading-relaxed text-navy-300">
          Gerado automaticamente com base nos dados cadastrados. Sem IA.
        </p>
      </div>
    </section>
  );
}
