"use client";

// Painel de comando central — agrega ações urgentes, pendências, documentos,
// férias e notificações em um único painel coeso. Substitui PlanoAcaoPanel.

import { useEffect, useState } from "react";
import { buildCommandCenterCached, type CommandCenterResult, type CommandAction, type GuidanceEngineItem } from "@/lib/command-center";
import { buildDataMaturity } from "@/lib/data-maturity";

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
  avcb:         "AV",
  seguro:       "SG",
  mandato:      "MD",
  funcionarios: "FN",
  documentos:   "DC",
  rotina:       "RT",
  alerta:       "AT",
  pendencias:   "PD",
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
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-navy-50 text-[9px] font-bold leading-none tracking-[0.08em] text-navy-500" aria-hidden="true">
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

const GUIDANCE_PRIORITY_COLOR: Record<string, string> = {
  critico:      "text-terracotta-300",
  importante:   "text-amber-300",
  planejamento: "text-navy-400",
  melhoria:     "text-navy-500",
};

function GuidanceTopItem({ item, rank }: { item: GuidanceEngineItem; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left focus:outline-none"
      aria-expanded={expanded}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 flex-shrink-0 text-[11px] font-bold ${GUIDANCE_PRIORITY_COLOR[item.prioridade] ?? "text-navy-400"}`}>
          {rank}.
        </span>
        <span className="mt-0 flex-shrink-0 text-[13px] leading-none">{item.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold leading-snug text-white">{item.titulo}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-navy-300">{item.proximoPasso}</p>
          {expanded && (
            <div className="mt-2 space-y-2">
              {item.checklist.length > 0 && (
                <div className="space-y-1">
                  {item.checklist.map((step, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0 text-[10px] font-semibold text-navy-500">{i + 1}.</span>
                      <p className="text-[11px] leading-relaxed text-navy-200">{step}</p>
                    </div>
                  ))}
                </div>
              )}
              {item.consequencia && (
                <p className="text-[10.5px] leading-relaxed text-terracotta-300">
                  <span className="font-semibold">Risco:</span> {item.consequencia}
                </p>
              )}
            </div>
          )}
        </div>
        <span className="mt-0.5 flex-shrink-0 text-[10px] text-navy-600">{expanded ? "↑" : "↓"}</span>
      </div>
    </button>
  );
}

function EmptyState({ implantacaoPct }: { implantacaoPct: number }) {
  const m = buildDataMaturity();
  const unlocked = m.unlockedCapabilities;
  const nextField = m.nextBestFields[0];

  if (m.essentialDatesFilled === 0 && m.knownCount > 0) {
    // Phase 11: usuário parcial — mostrar o que já funciona + o que falta
    return (
      <div className="rounded-xl bg-navy-50/60 px-4 py-4">
        <p className="text-[12px] font-semibold text-navy-700">
          O app já começou a trabalhar pelo seu prédio.
        </p>
        {unlocked.length > 0 && (
          <div className="mt-2 space-y-1">
            {unlocked.slice(0, 3).map((cap) => (
              <div key={cap} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                <p className="text-[11px] text-navy-600">{cap}</p>
              </div>
            ))}
          </div>
        )}
        {nextField && (
          <div className="mt-3 rounded-xl border border-navy-100 bg-white/70 px-3 py-2">
            <p className="text-[10.5px] font-semibold text-navy-500">Para ativar mais</p>
            <p className="mt-0.5 text-[12px] font-medium text-navy-800">{nextField.label}</p>
            {nextField.unlocks && (
              <p className="mt-0.5 text-[10.5px] text-teal-700">{nextField.unlocks}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-navy-50/60 px-4 py-5 text-center">
      <p className="text-[13px] font-medium text-navy-700">
        {implantacaoPct >= 80 ? "Prédio organizado" : "Nenhuma ação urgente"}
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-navy-400">
        {implantacaoPct >= 80
          ? "O monitoramento está ativo. Continue mantendo os dados atualizados."
          : "Complete os dados essenciais em Meu prédio para ativar o monitoramento completo."}
      </p>
    </div>
  );
}

export default function CommandCenterPanel({ refreshKey, onNavigate }: Props) {
  const [data, setData] = useState<CommandCenterResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(buildCommandCenterCached());
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
          aria-expanded={false}
          aria-controls="command-center-expanded"
          className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition-all hover:shadow-sm active:scale-[0.99] ${riskCfg.bg}`}
        >
          <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-[10px] font-bold tracking-[0.08em] text-navy-500" aria-hidden="true">
            CC
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
                ? data.implantacaoPct >= 80 ? "Prédio organizado · monitorando" : "Complete os dados para monitoramento completo"
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
      <div id="command-center-expanded" className="rounded-[22px] border border-navy-100/80 bg-white/[0.92] shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.28)]">

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
                {data.implantacaoPct < 80 && (
                  <span className="ml-1.5 text-[10px] text-navy-300">· configuração {data.implantacaoPct}%</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Fechar centro de comando"
            aria-expanded={true}
            aria-controls="command-center-expanded"
            className="rounded-full px-2.5 py-1 text-[11.5px] text-navy-400 hover:bg-navy-50 hover:text-navy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
          >
            Fechar
          </button>
        </div>

        {/* "Se eu fosse síndico hoje" — Top 3 do guidance engine */}
        {data.guidanceTopTres.length > 0 ? (
          <div className="mx-4 mb-3 overflow-hidden rounded-xl bg-navy-800">
            <p className="px-4 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Se eu fosse síndico hoje
            </p>
            <div className="divide-y divide-navy-700/50 px-4 pb-3">
              {data.guidanceTopTres.map((item, idx) => (
                <div key={item.id} className={idx === 0 ? "pb-2.5" : "py-2.5"}>
                  <GuidanceTopItem item={item} rank={idx + 1} />
                </div>
              ))}
            </div>
          </div>
        ) : data.todayAnswer ? (
          <div className="mx-4 mb-3 rounded-xl bg-navy-800 px-4 py-3">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">Se eu fosse síndico hoje</p>
            <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-white">{data.todayAnswer}</p>
          </div>
        ) : null}

        {/* Risco + Melhoria */}
        {(data.topRisco || data.maiorMelhoria) && (
          <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
            {data.topRisco && (
              <div className="rounded-xl bg-terracotta-50 border border-terracotta-100 px-3 py-2.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-terracotta-500">Maior risco</p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-terracotta-800">{data.topRisco}</p>
                {data.guidanceTopRisco?.consequencia && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-terracotta-600">
                    {data.guidanceTopRisco.consequencia}
                  </p>
                )}
              </div>
            )}
            {data.maiorMelhoria && (
              <div className="rounded-xl bg-navy-50 border border-navy-100 px-3 py-2.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-navy-500">Maior ganho</p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-navy-700">{data.maiorMelhoria}</p>
                {data.guidanceMaiorMelhoria?.proximoPasso && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-navy-500">
                    {data.guidanceMaiorMelhoria.proximoPasso}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Maior lacuna operacional */}
        {data.guidanceMaiorLacuna && data.guidanceMaiorLacuna.id !== data.guidanceTopRisco?.id && (
          <div className="mx-4 mb-3 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-amber-600">Maior lacuna</p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-amber-800">{data.guidanceMaiorLacuna.titulo}</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700">{data.guidanceMaiorLacuna.proximoPasso}</p>
          </div>
        )}

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
        {(data.stalePendenciasCount > 0 || data.missingDocsCount > 0 || data.overdueVacationsCount > 0 || data.manutencoesAtrasadas > 0) && (
          <div className="mx-4 mb-3 flex flex-wrap gap-1.5">
            {data.stalePendenciasCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("pendencias")}
                className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                {data.stalePendenciasCount} passo{data.stalePendenciasCount > 1 ? "s" : ""} parado{data.stalePendenciasCount > 1 ? "s" : ""} +14 dias
              </button>
            )}
            {data.manutencoesAtrasadas > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("condominio")}
                className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[11px] font-medium text-terracotta-700 hover:bg-terracotta-100 transition-colors"
              >
                {data.manutencoesAtrasadas} manutenç{data.manutencoesAtrasadas > 1 ? "ões" : "ão"} atrasada{data.manutencoesAtrasadas > 1 ? "s" : ""}
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

        {/* Correlações / lacunas operacionais */}
        {data.correlacoes.length > 0 && (
          <div className="mx-4 mb-3 space-y-1.5">
            {data.correlacoes.slice(0, 3).map((gap) => (
              <div
                key={gap.id}
                className={`flex items-start gap-2 rounded-xl px-3 py-2 ${
                  gap.prioridade === "critica"
                    ? "bg-terracotta-50/70 border border-terracotta-100"
                    : gap.prioridade === "atencao"
                    ? "bg-amber-50/70 border border-amber-100"
                    : "bg-navy-50/50 border border-navy-100"
                }`}
              >
                <span className="mt-0.5 text-[12px] flex-shrink-0" aria-hidden="true">
                  {gap.prioridade === "critica" ? "🔴" : gap.prioridade === "atencao" ? "🟡" : "ℹ️"}
                </span>
                <p className={`text-[11.5px] leading-snug ${
                  gap.prioridade === "critica" ? "text-terracotta-800" : gap.prioridade === "atencao" ? "text-amber-800" : "text-navy-600"
                }`}>
                  {gap.texto}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Ações por prioridade */}
        <div className="px-2 pb-4">
          {data.allActions.length === 0 ? (
            <div className="px-2">
              <EmptyState implantacaoPct={data.implantacaoPct} />
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
