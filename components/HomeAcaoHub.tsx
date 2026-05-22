"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  addPendencia,
  completePendencia,
  completeWeeklyReview,
  getCurrentWeekKey,
  getMemoriaOperacional,
  getOcorrencias,
  getPendenciasAbertas,
  getProfile,
  getWeeklyReviewState,
  hasMemoriaOperacional,
  type Pendencia,
} from "@/lib/session";
import { buildGuidanceItems } from "@/lib/guidance";
import { trackEvent } from "@/lib/telemetry";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStale(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > 14 * 86_400_000;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onDoneReview?: () => void;
  onNavigateToFerramentas?: () => void;
  onNavigateToAssistente?: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeAcaoHub({
  refreshKey,
  onDoneReview,
  onNavigateToFerramentas,
  onNavigateToAssistente,
}: Props) {
  const [hydrated, setHydrated]             = useState(false);
  const [weekKey, setWeekKey]               = useState("");
  const [reviewedThisWeek, setReviewedThisWeek] = useState(false);
  const [justCompleted, setJustCompleted]   = useState(false);
  const [hasUsefulSignal, setHasUsefulSignal] = useState(false);
  const [occurrenceCount, setOccurrenceCount] = useState(0);
  const [guidanceCount, setGuidanceCount]   = useState(0);
  const [pendencias, setPendencias]         = useState<Pendencia[]>([]);
  const [staleCount, setStaleCount]         = useState(0);
  const [adding, setAdding]                 = useState(false);
  const [novoTitulo, setNovoTitulo]         = useState("");
  const inputRef  = useRef<HTMLInputElement>(null);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasMemoriaOperacional()) {
      setHydrated(true);
      return;
    }

    const wk      = getCurrentWeekKey();
    const weekly  = getWeeklyReviewState();
    const done    = weekly.lastCompletedWeekKey === wk;
    const open    = getPendenciasAbertas();
    const stale   = open.filter((p) => isStale(p.createdAt));
    const m       = getMemoriaOperacional();
    const profile = getProfile();
    const guidance = buildGuidanceItems(m, profile);
    const occs    = getOcorrencias().filter(
      (o) => getCurrentWeekKey(new Date(o.createdAt)) === wk
    );
    const useful  = open.length > 0 || stale.length > 0 || guidance.length > 0 || occs.length > 0;

    setWeekKey(wk);
    setReviewedThisWeek(done);
    setHasUsefulSignal(useful);
    setOccurrenceCount(occs.length);
    setGuidanceCount(guidance.length);
    setPendencias(open);
    setStaleCount(stale.length);
    setHydrated(true);
    setJustCompleted(false);

    if (!done && useful && trackedRef.current !== wk) {
      trackedRef.current = wk;
      void trackEvent("weekly_review_viewed", {
        week_key: wk,
        occurrence_count: occs.length,
        open_steps_count: open.length,
        stale_steps_count: stale.length,
        has_guidance: guidance.length > 0,
        has_monthly_review: false,
      });
    }
  }, [refreshKey]);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  if (!hydrated) return null;

  const handleReview = () => {
    completeWeeklyReview(weekKey);
    void trackEvent("weekly_review_completed", {
      week_key: weekKey,
      occurrence_count: occurrenceCount,
      open_steps_count: pendencias.length,
      stale_steps_count: staleCount,
      has_guidance: guidanceCount > 0,
      has_monthly_review: false,
    });
    setReviewedThisWeek(true);
    setJustCompleted(true);
    onDoneReview?.();
  };

  const handleComplete = (p: Pendencia) => {
    completePendencia(p.id);
    setPendencias((prev) => prev.filter((x) => x.id !== p.id));
    void trackEvent("pendencia_completed", {
      categoria: p.categoria ?? null,
      origem: p.origem ?? null,
      matched_id: p.matchedId ?? null,
    });
  };

  const handleAdd = () => {
    const titulo = novoTitulo.trim();
    if (!titulo) { setAdding(false); return; }
    addPendencia({ titulo, origem: "manual" });
    setPendencias(getPendenciasAbertas());
    setNovoTitulo("");
    setAdding(false);
    void trackEvent("pendencia_created_manual", {});
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { setAdding(false); setNovoTitulo(""); }
  };

  const visibleSteps = pendencias.slice(0, 3);

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="overflow-hidden rounded-[18px] border border-navy-100/80 bg-white/80 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">

        {/* Cabeçalho do hub */}
        <div className="px-4 pb-2.5 pt-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Próximos passos do prédio
          </p>
        </div>

        {/* ── Revisão semanal ───────────────────────────────────────── */}
        <div className="border-t border-navy-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-navy-800">
                {justCompleted || reviewedThisWeek ? "Semana revisada" : "Revisão rápida pendente"}
              </p>
              {(justCompleted || reviewedThisWeek) && (
                <p className="mt-0.5 text-[11px] leading-snug text-navy-400">
                  A revisão entrou no histórico operacional.
                </p>
              )}
            </div>
            {!reviewedThisWeek && !justCompleted && hasUsefulSignal ? (
              <button
                type="button"
                onClick={handleReview}
                className="inline-flex shrink-0 items-center rounded-full bg-navy-700 px-3 py-1.5 text-[11.5px] font-semibold text-cream-50 transition-all hover:bg-navy-800 active:scale-[0.98]"
              >
                Revisar agora
              </button>
            ) : (
              <span className="shrink-0 text-[12px] font-medium text-navy-400" aria-hidden="true">✓</span>
            )}
          </div>
        </div>

        {/* ── Próximos passos ───────────────────────────────────────── */}
        <div className="border-t border-navy-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-navy-800">
              Próximos passos
              {pendencias.length > 0 && (
                <span className="ml-1.5 text-[11px] font-normal text-navy-400">
                  {pendencias.length} aberto{pendencias.length !== 1 ? "s" : ""}
                  {staleCount > 0 && ` · ${staleCount} parado${staleCount !== 1 ? "s" : ""} há +14 dias`}
                </span>
              )}
            </p>
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 text-[11px] font-medium text-navy-400 transition-colors hover:text-navy-600"
                aria-label="Adicionar próximo passo"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Adicionar
              </button>
            )}
          </div>

          {visibleSteps.length > 0 ? (
            <ul className="space-y-2">
              {visibleSteps.map((p) => (
                <li key={p.id} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => handleComplete(p)}
                    className="group mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border border-navy-200 text-transparent transition-all hover:border-navy-500 hover:bg-navy-100 hover:text-navy-500"
                    aria-label="Marcar como concluído"
                  >
                    <svg className="h-2 w-2" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className="line-clamp-2 text-[12.5px] leading-snug text-navy-700">{p.titulo}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-navy-400">Sem próximos passos abertos.</p>
          )}

          {pendencias.length > 3 && (
            <p className="mt-1.5 text-[11px] text-navy-400">
              +{pendencias.length - 3} oculto{pendencias.length - 3 !== 1 ? "s" : ""}
            </p>
          )}

          {adding && (
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descreva o próximo passo…"
                maxLength={120}
                className="flex-1 rounded-xl border border-navy-200 bg-navy-50/40 px-3 py-1.5 text-[12.5px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!novoTitulo.trim()}
                className="rounded-xl bg-navy-700 px-3 py-1.5 text-[12px] font-semibold text-cream-50 transition-colors hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNovoTitulo(""); }}
                className="px-1 text-[12px] text-navy-400 hover:text-navy-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── CTAs de navegação ─────────────────────────────────────── */}
        <div className="border-t border-navy-50 px-4 py-3 flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={onNavigateToFerramentas}
            className="text-[12px] font-medium text-navy-400 transition-colors hover:text-navy-600"
          >
            + Registrar ocorrência →
          </button>
          <button
            type="button"
            onClick={onNavigateToAssistente}
            className="text-[12px] font-medium text-navy-400 transition-colors hover:text-navy-600"
          >
            Perguntar ao Assistente →
          </button>
        </div>

      </div>
    </section>
  );
}
