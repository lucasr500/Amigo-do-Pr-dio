"use client";

import { useEffect, useState } from "react";
import { buildActionPlan, type ActionItem, type ActionPriority } from "@/lib/action-plan";

const PRIORITY_LABEL: Record<ActionPriority, string> = {
  urgente:          "Urgente",
  este_mes:         "Este mês",
  proximos_90_dias: "Próximos 90 dias",
  quando_possivel:  "Quando possível",
};

const PRIORITY_STYLE: Record<ActionPriority, string> = {
  urgente:          "bg-terracotta-50 text-terracotta-700 ring-terracotta-100",
  este_mes:         "bg-amber-50 text-amber-700 ring-amber-100",
  proximos_90_dias: "bg-navy-50 text-navy-600 ring-navy-100",
  quando_possivel:  "bg-navy-50 text-navy-400 ring-navy-100",
};

const CATEGORIA_LABEL: Record<ActionItem["categoria"], string> = {
  legal:        "Legal",
  financeiro:   "Financeiro",
  trabalhista:  "Trabalhista",
  operacional:  "Operacional",
  gestao:       "Gestão",
};

export default function PlanoAcaoPanel() {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    const plan = buildActionPlan();
    setItems(plan.items);
    setGeneratedAt(plan.generatedAt);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const urgentes = items.filter((i) => i.prioridade === "urgente");
  const total    = items.length;

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]" aria-hidden="true">
            🗺️
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">Plano de ação</p>
            <p className="text-[11.5px] text-navy-400">
              {total === 0
                ? "Nenhuma ação identificada — condomínio bem organizado"
                : urgentes.length > 0
                ? `${urgentes.length} ação${urgentes.length > 1 ? "ões" : ""} urgente${urgentes.length > 1 ? "s" : ""} · ${total} total`
                : `${total} ação${total > 1 ? "ões" : ""} identificada${total > 1 ? "s" : ""}`}
            </p>
          </div>
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">Ver →</span>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  const groups: ActionPriority[] = ["urgente", "este_mes", "proximos_90_dias", "quando_possivel"];

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">Plano de ação</p>
            <p className="text-[10.5px] text-navy-400">
              Gerado automaticamente · {total} ação{total !== 1 ? "ões" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {total === 0 && (
          <div className="rounded-xl bg-navy-50/60 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-navy-600">
              Nenhuma ação prioritária identificada com base nos dados atuais. Continue mantendo o condomínio atualizado.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {groups.map((priority) => {
            const group = items.filter((i) => i.prioridade === priority);
            if (group.length === 0) return null;
            return (
              <div key={priority}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                  {PRIORITY_LABEL[priority]}
                </p>
                <div className="space-y-2">
                  {group.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-navy-50 bg-navy-50/20 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-medium leading-snug text-navy-800">
                          {item.titulo}
                        </p>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-px text-[9.5px] font-medium ring-1 ${PRIORITY_STYLE[item.prioridade]}`}>
                          {CATEGORIA_LABEL[item.categoria]}
                        </span>
                      </div>
                      {item.descricao && (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-navy-500">
                          {item.descricao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-navy-400">
          Plano gerado com base nos dados do app — sem IA. Atualiza ao reabrir conforme novos dados são cadastrados.
        </p>
      </div>
    </section>
  );
}
