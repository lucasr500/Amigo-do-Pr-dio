"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import dynamic from "next/dynamic";
import AskInput from "@/components/AskInput";
import type { AnswerResult, Topic } from "@/lib/data";
import type { ToolAnchor } from "@/lib/app-navigation";
import { incrementUsage, getProfile, getMemoriaOperacional, getPendencias } from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import {
  buildAssistantContext, buildContextualCards, getSuggestedQueriesForContext,
  type ContextualCard,
} from "@/lib/contextual-assistant";
import { getDocumentos } from "@/lib/session-documentos";

const QuickAccessCards = dynamic(() => import("@/components/QuickAccessCards"), { ssr: false });
const Response         = dynamic(() => import("@/components/Response"), { ssr: false });
const HistoryPanel     = dynamic(() => import("@/components/HistoryPanel"), { ssr: false });
const FavoritesPanel   = dynamic(() => import("@/components/FavoritesPanel"), { ssr: false });

// ── Imperative handle exposed to parent ─────────────────────────────────────
export type AssistantTabHandle = {
  executeQuery: (q: string) => void;
};

type Props = {
  refreshKey: number;
  onSavePendencia: (titulo: string, categoria: string, matchedId: string) => void;
  onQueryExecuted: () => void;       // notifica page.tsx para refreshKey++
  onNavigateToChecklist: (id: string) => void;
  onNavigateToFerramentas: (anchor?: ToolAnchor) => void;
};

const AssistantTab = forwardRef<AssistantTabHandle, Props>(function AssistantTab(
  {
    refreshKey,
    onSavePendencia,
    onQueryExecuted,
    onNavigateToChecklist,
    onNavigateToFerramentas,
  },
  ref
) {
  const [question, setQuestion]           = useState("");
  const [submitted, setSubmitted]         = useState("");
  const [answerResult, setAnswerResult]   = useState<AnswerResult | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [ctxCards, setCtxCards]           = useState<ContextualCard[]>([]);
  const [ctxSuggestions, setCtxSuggestions] = useState<string[]>([]);
  const abortRef = useRef(false);

  useEffect(() => {
    const profile = getProfile();
    const memoria = getMemoriaOperacional();
    const pendencias = getPendencias();
    const documentos = getDocumentos();
    const ctx = buildAssistantContext(profile, memoria, pendencias, documentos);
    setCtxCards(buildContextualCards(ctx).slice(0, 3));
    setCtxSuggestions(getSuggestedQueriesForContext(ctx));
  }, [refreshKey]);

  const executeQuery = useCallback(async (q: string) => {
    if (!q.trim() || isLoading) return;
    abortRef.current = false;
    setQuestion("");
    setIsLoading(true);
    setSubmitted(q.trim());
    setAnswerResult(null);

    const [{ findAnswer, logQuery }] = await Promise.all([
      import("@/lib/data"),
      new Promise<void>((r) => setTimeout(r, 150)),
    ]);

    if (abortRef.current) return;

    const result = findAnswer(q.trim());
    logQuery(q.trim(), result);
    incrementUsage();

    if (result.isDefault) {
      void trackEvent("query_fallback", {
        detected_category: result.detectedCategory,
        score: result.score,
        blocked_by_domain: result.blockedByDomainAnchor,
        query_length: q.length,
      });
    } else {
      void trackEvent("query_submitted", {
        matched_id: result.matched?.id ?? null,
        categoria: result.matched?.categoria ?? null,
        score: result.score,
        query_length: q.length,
      });
    }

    setAnswerResult(result);
    setIsLoading(false);
    onQueryExecuted();
  }, [isLoading, onQueryExecuted]);

  // Expõe executeQuery para o parent via ref
  useImperativeHandle(ref, () => ({ executeQuery }), [executeQuery]);

  const handleAsk  = () => executeQuery(question.trim());
  const handleBack = () => { setQuestion(submitted); setSubmitted(""); setAnswerResult(null); };
  const handleRetry = () => executeQuery(submitted);
  const handleNewQuestion = () => { setQuestion(""); setSubmitted(""); setAnswerResult(null); };

  const handleTopicSelect = (topic: Topic) => {
    setQuestion(topic.examplePrompt);
    setTimeout(() => {
      const el = document.getElementById("ask-question") as HTMLTextAreaElement;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }, 50);
  };

  return (
    <div key="assistente" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

      {!submitted && !isLoading && (
        <div className="px-5 pb-2 pt-1 sm:px-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
            Inteligência
          </p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
            Orientação do síndico
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-navy-500">
            Faça uma pergunta e receba um próximo passo claro, com contexto do prédio.
          </p>
        </div>
      )}

      {submitted && !isLoading && (
        <div className="px-4 pb-0 pt-2 sm:px-5">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar para nova pergunta"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11.5px] font-medium">Voltar</span>
          </button>
        </div>
      )}

      <AskInput
        value={question}
        onChange={setQuestion}
        onSubmit={handleAsk}
        isLoading={isLoading}
      />

      {!submitted && !isLoading && (
        <>
          {/* Contextual alerts/suggestions based on condo state */}
          {ctxCards.length > 0 && (
            <div className="px-5 pb-2 pt-1 sm:px-6 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">
                No seu condomínio
              </p>
              {ctxCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => card.actionLabel && executeQuery(card.title)}
                  className={`w-full rounded-lg border px-4 py-3 text-left shadow-card transition-colors ${
                    card.type === "alert"
                      ? "border-amber-200/80 bg-amber-50/70 hover:bg-amber-50"
                      : "border-navy-100 bg-white/[0.78] hover:bg-white"
                  }`}
                >
                  <p className={`text-[12px] font-semibold ${card.type === "alert" ? "text-amber-800" : "text-navy-700"}`}>
                    {card.title}
                  </p>
                  <p className={`mt-0.5 text-[11px] leading-relaxed ${card.type === "alert" ? "text-amber-700" : "text-navy-500"}`}>
                    {card.body}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Context-aware suggested queries */}
          {ctxSuggestions.length > 0 && (
            <div className="px-5 pb-1 pt-0 sm:px-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">
                Perguntas sugeridas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ctxSuggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => executeQuery(q)}
                    className="rounded-full border border-navy-100 bg-white/[0.82] px-2.5 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-white active:scale-[0.97] transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <QuickAccessCards onSelect={handleTopicSelect} collapsed={false} />
          <HistoryPanel onSelect={(q) => executeQuery(q)} refreshKey={refreshKey} />
          <FavoritesPanel onSelect={(q) => executeQuery(q)} refreshKey={refreshKey} />
          <p className="px-5 pb-4 pt-1 text-[10.5px] leading-relaxed text-navy-300 sm:px-6">
            As orientações têm caráter informativo. Para decisões específicas, consulte administradora, assessoria jurídica ou profissional responsável.
          </p>
        </>
      )}

      <Response
        question={submitted}
        answerResult={answerResult}
        isLoading={isLoading}
        onRetry={handleRetry}
        onSuggestionSelect={(q) => executeQuery(q)}
        onFavorite={onQueryExecuted}
        onNewQuestion={handleNewQuestion}
        onNavigateToChecklist={onNavigateToChecklist}
        onNavigateToFerramentas={onNavigateToFerramentas}
        onSavePendencia={onSavePendencia}
      />

    </div>
  );
});

export default AssistantTab;
