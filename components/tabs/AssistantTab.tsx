"use client";

import dynamic from "next/dynamic";
import AskInput from "@/components/AskInput";
import type { AnswerResult, Topic } from "@/lib/data";
import type { ToolAnchor } from "@/lib/app-navigation";

const QuickAccessCards = dynamic(() => import("@/components/QuickAccessCards"), { ssr: false });
const Response         = dynamic(() => import("@/components/Response"), { ssr: false });
const HistoryPanel     = dynamic(() => import("@/components/HistoryPanel"), { ssr: false });
const FavoritesPanel   = dynamic(() => import("@/components/FavoritesPanel"), { ssr: false });

type Props = {
  question: string;
  submittedQuestion: string;
  answerResult: AnswerResult | null;
  isLoading: boolean;
  refreshKey: number;
  onQuestionChange: (q: string) => void;
  onAsk: () => void;
  onBack: () => void;
  onRetry: () => void;
  onNewQuestion: () => void;
  onTopicSelect: (topic: Topic) => void;
  onSuggestionSelect: (q: string) => void;
  onSavePendencia: (titulo: string, categoria: string, matchedId: string) => void;
  onNavigateToChecklist: (id: string) => void;
  onNavigateToFerramentas: (anchor?: ToolAnchor) => void;
  onFavorite: () => void;
};

export default function AssistantTab({
  question,
  submittedQuestion,
  answerResult,
  isLoading,
  refreshKey,
  onQuestionChange,
  onAsk,
  onBack,
  onRetry,
  onNewQuestion,
  onTopicSelect,
  onSuggestionSelect,
  onSavePendencia,
  onNavigateToChecklist,
  onNavigateToFerramentas,
  onFavorite,
}: Props) {
  return (
    <div key="assistente" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

      {!submittedQuestion && !isLoading && (
        <div className="px-5 pb-2 pt-1 sm:px-6">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
            Assistente
          </p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
            Orientações práticas
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-navy-500">
            Descreva a situação. O app organiza o próximo passo com clareza.
          </p>
        </div>
      )}

      {submittedQuestion && !isLoading && (
        <div className="px-4 pb-0 pt-2 sm:px-5">
          <button
            type="button"
            onClick={onBack}
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
        onChange={onQuestionChange}
        onSubmit={onAsk}
        isLoading={isLoading}
      />

      {!submittedQuestion && !isLoading && (
        <>
          <p className="px-5 pb-3 text-[11px] leading-relaxed text-navy-400 sm:px-6">
            As orientações têm caráter informativo. Para decisões específicas, consulte administradora, assessoria jurídica ou profissional responsável.
          </p>
          <QuickAccessCards onSelect={onTopicSelect} collapsed={false} />
          <HistoryPanel onSelect={onSuggestionSelect} refreshKey={refreshKey} />
          <FavoritesPanel onSelect={onSuggestionSelect} refreshKey={refreshKey} />
        </>
      )}

      <Response
        question={submittedQuestion}
        answerResult={answerResult}
        isLoading={isLoading}
        onRetry={onRetry}
        onSuggestionSelect={onSuggestionSelect}
        onFavorite={onFavorite}
        onNewQuestion={onNewQuestion}
        onNavigateToChecklist={onNavigateToChecklist}
        onNavigateToFerramentas={onNavigateToFerramentas}
        onSavePendencia={onSavePendencia}
      />

    </div>
  );
}
