"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMemoriaOperacional,
  getProfile,
  hasMemoriaOperacional,
  logInteraction,
  resolveMemoriaField,
} from "@/lib/session";
import { buildGuidanceItems, GuidanceItem } from "@/lib/guidance";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  onAsk?: (q: string) => void;
  onResolved?: () => void;
  refreshKey?: number;
};

export default function GuidancePanel({ onAsk, onResolved, refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<GuidanceItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Resolução inline
  type ResolveStep = "confirmDone" | "inputExpiry";
  const [resolveState, setResolveState] = useState<{ itemId: string; step: ResolveStep } | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasMemoriaOperacional()) {
      setHydrated(true);
      return;
    }
    const m = getMemoriaOperacional();
    const profile = getProfile();
    const built = buildGuidanceItems(m, profile);
    setItems(built);
    setExpandedId(null);
    setResolveState(null);
    setShowAll(false);
    setHydrated(true);
    if (built.length > 0) {
      void trackEvent("guidance_panel_shown", {
        count: built.length,
        top_priority: built[0].priority,
      });
    }
  }, [refreshKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  if (!hydrated || items.length === 0) return null;

  const INITIAL_LIMIT = 3;
  const hasCritico = items.some((i) => i.priority === "critico");
  const hasMixedPriorities = hasCritico && items.some((i) => i.priority === "atencao");
  const title = hasMixedPriorities
    ? "Prioridades do condomínio"
    : hasCritico
    ? "O que requer ação agora"
    : "O que merece atenção";

  const visibleItems = showAll ? items : items.slice(0, INITIAL_LIMIT);
  const hiddenCount = items.length - INITIAL_LIMIT;

  const handleToggle = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    setResolveState(null);
    setExpiryDate("");
    if (next) {
      const item = items.find((i) => i.id === id);
      logInteraction("guidance-expand", id);
      void trackEvent("guidance_item_expanded", {
        id,
        priority: item?.priority ?? "unknown",
      });
    }
  };

  const handleAsk = (item: GuidanceItem) => {
    logInteraction("guidance-ask", item.id);
    void trackEvent("guidance_ask_triggered", { id: item.id, priority: item.priority });
    onAsk?.(item.askQ);
  };

  const handleStartResolve = (item: GuidanceItem) => {
    const step: ResolveStep = item.resolveAction.type === "done" ? "confirmDone" : "inputExpiry";
    setResolveState({ itemId: item.id, step });
    if (item.resolveAction.type === "expiry") {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setExpiryDate(d.toISOString().slice(0, 10));
    }
  };

  const handleCancelResolve = () => {
    setResolveState(null);
    setExpiryDate("");
  };

  const commitResolution = (item: GuidanceItem, value: string) => {
    resolveMemoriaField(item.resolveAction.field, value, item.resolveAction.successMessage);
    void trackEvent("guidance_resolved", {
      id: item.id,
      field: item.resolveAction.field as string,
      type: item.resolveAction.type,
    });
    logInteraction("guidance-resolved", item.id);
    setResolveState(null);
    setExpiryDate("");
    setSuccessId(item.id);

    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => {
      setSuccessId(null);
      onResolved?.();
    }, 2500);
  };

  const handleConfirmDone = (item: GuidanceItem) => {
    const today = new Date().toISOString().slice(0, 10);
    commitResolution(item, today);
  };

  const handleConfirmExpiry = (item: GuidanceItem) => {
    if (!expiryDate) return;
    commitResolution(item, expiryDate);
  };

  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.08)]">

        {/* Cabeçalho */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
            Prioridades
          </p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-navy-800">
            {title}
          </p>
        </div>

        <div className="mx-5 border-t border-navy-50" />

        {/* Lista de itens */}
        <div className="px-2 py-1">
          {visibleItems.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const isCritico = item.priority === "critico";
            const isResolving = resolveState?.itemId === item.id;
            const isSuccess = successId === item.id;
            const isFirstAtencao = hasMixedPriorities && !isCritico && idx > 0 && visibleItems[idx - 1].priority === "critico";
            const isMuted = hasMixedPriorities && !isCritico;

            return (
              <div key={item.id}>
                {idx > 0 && !isFirstAtencao && <div className="mx-2 border-t border-navy-50" />}
                {isFirstAtencao && <div className="mx-3 my-1 border-t border-navy-100/50" />}

                {/* Linha do item — toggle de expansão */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className={`flex w-full items-start gap-3 rounded-xl px-2 ${isMuted ? "py-3" : "py-3.5"} text-left transition-colors hover:bg-navy-50/60 active:bg-navy-50`}
                  aria-expanded={isExpanded}
                >
                  <span
                    className="mt-0.5 flex-shrink-0 text-[15px] leading-none"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12.5px] leading-tight ${isMuted ? "font-medium text-navy-600" : "font-semibold text-navy-800"}`}>
                      {item.label}
                    </p>
                    <p
                      className={`mt-0.5 text-[11.5px] leading-snug ${
                        isCritico ? "text-amber-700" : isMuted ? "text-navy-400" : "text-navy-500"
                      }`}
                    >
                      {item.urgencyLabel}
                    </p>
                  </div>
                  <span
                    className="mt-1 flex-shrink-0 text-[12px] text-navy-300 transition-transform duration-200"
                    aria-hidden="true"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    ›
                  </span>
                </button>

                {/* Expansão: contexto + ações */}
                {isExpanded && (
                  <div className="mx-2 mb-2.5 overflow-hidden rounded-xl bg-navy-50/50 px-4 py-3.5">

                    {/* Feedback de sucesso */}
                    {isSuccess ? (
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sage-100">
                          <svg className="h-3 w-3 text-sage-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[12px] font-semibold text-sage-700">
                            {item.resolveAction.successMessage}
                          </p>
                          <p className="text-[11px] text-navy-500">
                            Condomínio atualizado
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Contexto */}
                        <p className="text-[12px] leading-relaxed text-navy-700">
                          {item.context}
                        </p>
                        {item.howLong && (
                          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-navy-500">
                            <span className="flex-shrink-0 leading-tight" aria-hidden="true">⏱</span>
                            <span>{item.howLong}</span>
                          </p>
                        )}

                        {/* Ações principais */}
                        {!isResolving && (
                          <div className="mt-3.5 flex flex-wrap items-center gap-2">
                            {/* Botão resolução — PRIORIDADE MÁXIMA */}
                            <button
                              type="button"
                              onClick={() => handleStartResolve(item)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-all hover:bg-sage-700 active:scale-[0.97]"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {item.resolveAction.buttonLabel}
                            </button>

                            {/* Botão orientação */}
                            {onAsk && (
                              <button
                                type="button"
                                onClick={() => handleAsk(item)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-white px-3.5 py-1.5 text-[11.5px] font-medium text-navy-700 transition-all hover:bg-navy-50 active:scale-[0.97]"
                              >
                                Ver orientação
                                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}

                        {/* UI de resolução: "done" — confirmar data de hoje */}
                        {isResolving && resolveState?.step === "confirmDone" && (
                          <div className="mt-3.5">
                            <p className="mb-2 text-[11.5px] font-medium text-navy-700">
                              Confirmar como realizado em{" "}
                              <span className="font-semibold text-navy-900">{todayLabel}</span>?
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleConfirmDone(item)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-all hover:bg-sage-700 active:scale-[0.97]"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelResolve}
                                className="rounded-full px-3 py-1.5 text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* UI de resolução: "expiry" — nova data de vencimento */}
                        {isResolving && resolveState?.step === "inputExpiry" && (
                          <div className="mt-3.5">
                            <p className="mb-1.5 text-[11.5px] font-medium text-navy-700">
                              Nova data de vencimento
                            </p>
                            <input
                              type="date"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              className="mb-2.5 w-full rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-[12px] text-navy-800 outline-none focus:border-navy-400"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleConfirmExpiry(item)}
                                disabled={!expiryDate}
                                className="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-all hover:bg-sage-700 active:scale-[0.97] disabled:opacity-40"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelResolve}
                                className="rounded-full px-3 py-1.5 text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão "Ver todos" — quando há mais itens do que o limite inicial */}
        {!showAll && hiddenCount > 0 && expandedId === null && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={() => {
                setShowAll(true);
                void trackEvent("guidance_panel_see_all", { total: items.length });
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-navy-100 bg-navy-50/40 py-2.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50 active:bg-navy-100"
            >
              Ver {hiddenCount} item{hiddenCount !== 1 ? "s" : ""} restante{hiddenCount !== 1 ? "s" : ""}
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Rodapé — só quando há mais de 1 item e sem expansão ativa */}
        {visibleItems.length > 1 && expandedId === null && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <p className="text-[10.5px] text-navy-400">
              {hasMixedPriorities
                ? "Foque no urgente — os demais podem aguardar"
                : "O app prioriza o que exige atenção primeiro"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
