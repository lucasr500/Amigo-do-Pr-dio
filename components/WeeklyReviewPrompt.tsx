"use client";

// Prompt de revisão semanal — aparece quando a revisão da semana não foi feita.
// Checklist mínimo de 4 perguntas. Completar dá +10 pts ao health score.

import { useEffect, useState } from "react";
import {
  getWeeklyReviewState,
  getCurrentWeekKey,
  completeWeeklyReview,
  getPendenciasAbertas,
  getAgendaEvents,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { addAuditEntry } from "@/lib/session";

const CHECKLIST = [
  { id: "pendencias",  text: "Revisou as pendências abertas desta semana?" },
  { id: "agenda",      text: "Conferiu a agenda e eventos planejados?" },
  { id: "alertas",     text: "Verificou os alertas operacionais ativos?" },
  { id: "proximo",     text: "Definiu a principal ação da próxima semana?" },
];

type Props = {
  refreshKey?: number;
  onComplete?: () => void;
};

export default function WeeklyReviewPrompt({ refreshKey, onComplete }: Props) {
  const [show, setShow]       = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [context, setContext] = useState({ pendencias: 0, eventos: 0 });

  useEffect(() => {
    const weekKey = getCurrentWeekKey();
    const state = getWeeklyReviewState();
    const done = state.lastCompletedWeekKey === weekKey;
    if (!done) {
      const today = new Date().toISOString().slice(0, 10);
      const urgentPend = getPendenciasAbertas().filter((p) => p.dueDate && p.dueDate <= today).length;
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const eventos = getAgendaEvents().filter((e) => !e.completedAt && e.date >= today && e.date <= nextWeek).length;
      setContext({ pendencias: urgentPend, eventos });
      setShow(true);
    }
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !show) return null;

  const allChecked = checked.size === CHECKLIST.length;

  const handleComplete = () => {
    completeWeeklyReview();
    addAuditEntry({
      category: "health",
      action: "Revisão semanal concluída",
      impact: "positive",
      detail: `Semana ${getCurrentWeekKey()}`,
    });
    void trackEvent("weekly_review_completed", { week: getCurrentWeekKey() });
    setShow(false);
    onComplete?.();
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!expanded) {
    return (
      <div className="px-5 pb-3 sm:px-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-[14px] border border-blue-200/70 bg-blue-50/60 px-4 py-3 text-left shadow-sm transition-all hover:bg-blue-50 active:scale-[0.98]"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-4 w-4 text-blue-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 8l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-navy-800">Revisão semanal pendente</p>
            <p className="mt-0.5 text-[11.5px] text-navy-500">
              {context.pendencias > 0
                ? `${context.pendencias} pendência${context.pendencias > 1 ? "s" : ""} vencida${context.pendencias > 1 ? "s" : ""} · `
                : ""}
              {context.eventos > 0
                ? `${context.eventos} evento${context.eventos > 1 ? "s" : ""} esta semana · `
                : ""}
              Vale +10 pts no score
            </p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="rounded-[18px] border border-blue-200/80 bg-blue-50/50 px-4 py-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-blue-600">
              Revisão semanal
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-navy-800">
              Verificação rápida da semana
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-0.5 text-[11px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        <p className="mb-3 text-[12px] leading-relaxed text-navy-500">
          Confirme que verificou estes 4 pontos desta semana:
        </p>

        <div className="space-y-2.5">
          {CHECKLIST.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-all ${
                  isChecked
                    ? "bg-teal-50 ring-1 ring-teal-200"
                    : "bg-white ring-1 ring-navy-100 hover:ring-navy-200"
                }`}
              >
                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ring-1 ${
                  isChecked ? "bg-teal-500 ring-teal-500" : "ring-navy-200"
                }`}>
                  {isChecked && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <p className={`text-[12px] leading-snug ${isChecked ? "text-teal-800 line-through" : "text-navy-700"}`}>
                  {item.text}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleComplete}
            disabled={!allChecked}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all ${
              allChecked
                ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.97]"
                : "cursor-not-allowed bg-navy-100 text-navy-400"
            }`}
          >
            {allChecked ? "Concluir revisão (+10 pts)" : `${checked.size}/${CHECKLIST.length} confirmados`}
          </button>
          {checked.size === 0 && (
            <button
              type="button"
              onClick={() => { setChecked(new Set(CHECKLIST.map((c) => c.id))); }}
              className="text-[11.5px] text-navy-400 hover:text-navy-600 transition-colors"
            >
              Marcar todos
            </button>
          )}
        </div>

        <p className="mt-2.5 text-[10.5px] leading-relaxed text-navy-400">
          Completar a revisão semanal adiciona 10 pontos ao índice de saúde operacional.
        </p>
      </div>
    </div>
  );
}
