"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerResult, KnowledgeEntry, ConfidenceLevel } from "@/lib/data";
import { TOPICS, getConfidenceLabel, getRelatedEntries } from "@/lib/data";
import { saveFavorite, isFavorited } from "@/lib/session";

// Ícone por categoria — aparece nos cards de sugestão do fallback
const CATEGORIA_ICONS: Record<string, string> = {
  multas: "⚖️",
  obras: "🔨",
  assembleias: "👥",
  inadimplencia: "💰",
  funcionarios: "🧹",
  convencao: "📜",
  financeiro: "💼",
  gestao: "🏛️",
  trabalhista: "📋",
  "areas-comuns": "🚗",
};

// Mensagens rotativas exibidas durante o carregamento
const LOADING_MESSAGES = [
  "Verificando a legislação...",
  "Consultando o condomínio...",
  "Preparando sua resposta...",
];

type ResponseProps = {
  question: string;
  answerResult: AnswerResult | null;
  isLoading: boolean;
  onRetry: () => void;
  onSuggestionSelect?: (q: string) => void;
};

export default function Response({
  question,
  answerResult,
  isLoading,
  onRetry,
  onSuggestionSelect,
}: ResponseProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const answer = answerResult?.text ?? "";
  const entry: KnowledgeEntry | null = answerResult?.matched ?? null;
  const isDefault = answerResult?.isDefault ?? false;
  const score = answerResult?.score ?? 0;
  const suggestions = answerResult?.suggestions ?? [];

  // Typewriter — cleanup garantido via retorno de clearInterval
  useEffect(() => {
    if (isLoading || !answer) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText("");
    setCopied(false);
    setLiked(false);
    setShowToast(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < answer.length) {
        setDisplayedText(answer.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [answer, isLoading]);

  // Scroll suave até a resposta quando ela aparece
  useEffect(() => {
    if ((isLoading || answer) && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [isLoading, answer]);

  const handleCopy = async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard indisponível (contexto não-seguro ou permissão negada)
    }
  };

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  if (!isLoading && !answerResult) return null;

  const confidence = getConfidenceLabel(score, isDefault);

  return (
    <>
      <section
        ref={containerRef}
        className="px-5 pb-6 sm:px-6 sm:pb-8 animate-fade-in-up"
        aria-live="polite"
      >
        {/* Pergunta do usuário */}
        {question && (
          <div className="mb-3 flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-navy-800 px-4 py-2.5 text-[14px] text-cream-50 shadow-sm sm:text-[14.5px]">
              {question}
            </div>
          </div>
        )}

        {/* Resposta do assistente */}
        <div className="flex gap-2.5">
          {/* Avatar */}
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-cream-50"
              fill="none"
              aria-hidden="true"
            >
              <rect x="5" y="7" width="6" height="13" rx="0.5" fill="currentColor" opacity="0.95" />
              <rect x="13" y="4" width="6" height="16" rx="0.5" fill="currentColor" />
              <circle cx="19.5" cy="5" r="1.6" fill="#6fa97c" />
            </svg>
          </div>

          <div className="flex-1">
            {/* Cabeçalho: nome + badge de confiança */}
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[12px] font-semibold text-navy-700">
                Amigo do Prédio
              </span>
              {!isLoading && (
                <>
                  <span className="text-[10.5px] text-navy-400">respondeu</span>
                  <ConfidenceBadge level={confidence.level} label={confidence.label} />
                </>
              )}
            </div>

            {/* Card principal */}
            <div className="rounded-2xl rounded-tl-sm border border-navy-100 bg-white px-4 py-3.5 shadow-[0_2px_8px_-4px_rgba(31,49,71,0.10)]">
              {isLoading ? (
                <TypingIndicator />
              ) : (
                <>
                  {/* Texto da resposta principal */}
                  <p
                    className={`text-[15px] leading-[1.7] sm:text-[15.5px] ${
                      isDefault ? "text-navy-500" : "font-[450] text-navy-900"
                    }`}
                  >
                    {displayedText}
                    {isTyping && (
                      <span
                        className="ml-0.5 inline-block h-4 w-0.5 -translate-y-0.5 animate-blink bg-navy-800 align-middle"
                        aria-hidden="true"
                      />
                    )}
                  </p>

                  {/* Fundamento legal + dica — aparecem após a digitação completa */}
                  {!isTyping && !isDefault && entry && (
                    <div className="mt-4 animate-fade-in space-y-2.5">
                      {/* Base legal */}
                      <div className="rounded-r-lg border-l-[2.5px] border-navy-200 bg-navy-50/60 py-2.5 pl-3 pr-3">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <BookIcon />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                            Base legal
                          </p>
                        </div>
                        <p className="text-[12px] leading-relaxed text-navy-600">
                          {entry.contexto}
                        </p>
                      </div>

                      {/* Dica prática */}
                      {entry.dica && (
                        <div className="rounded-r-lg border-l-[2.5px] border-sage-300 bg-sage-50/70 py-2.5 pl-3 pr-3">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <LightbulbIcon />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sage-600">
                              Dica prática
                            </p>
                          </div>
                          <p className="text-[12px] leading-relaxed text-navy-700">
                            {entry.dica}
                          </p>
                        </div>
                      )}

                      {/* Aviso jurídico */}
                      <div className="flex items-start gap-2 border-t border-navy-100/80 pt-3">
                        <InfoIcon className="text-navy-400" />
                        <p className="text-[11px] leading-relaxed text-navy-400">
                          Esta é uma orientação de referência. Para decisões formais,
                          consulte um advogado condominial.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fallback — categorias navegáveis + sugestões contextuais */}
                  {!isTyping && isDefault && (
                    <div className="mt-4 animate-fade-in space-y-5">
                      {/* Chips de categoria */}
                      <div>
                        <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                          Pergunte sobre
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {TOPICS.map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => onSuggestionSelect?.(topic.examplePrompt)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] font-medium text-navy-700 shadow-sm transition-all duration-150 hover:border-navy-300 hover:bg-navy-50 hover:shadow-md active:scale-95"
                            >
                              <span aria-hidden="true" className="text-[13px]">
                                {topic.icon}
                              </span>
                              {topic.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cards de sugestão contextual */}
                      {suggestions.length > 0 && (
                        <div>
                          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                            Talvez você esteja procurando:
                          </p>
                          <div className="space-y-2">
                            {suggestions.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => onSuggestionSelect?.(s.pergunta)}
                                className="group flex w-full items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_4px_16px_-6px_rgba(31,49,71,0.15)] active:scale-[0.99]"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50 text-[15px] transition-colors duration-200 group-hover:bg-sage-50">
                                  {CATEGORIA_ICONS[s.categoria] ?? "📋"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-medium leading-snug text-navy-800">
                                    {s.pergunta}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-navy-400">
                                    Toque para perguntar
                                  </p>
                                </div>
                                <svg
                                  className="h-4 w-4 flex-shrink-0 text-navy-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-navy-400"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M6 4l4 4-4 4"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2 border-t border-navy-100/80 pt-3">
                        <InfoIcon className="text-navy-300" />
                        <p className="text-[11px] leading-relaxed text-navy-400">
                          Mais temas sendo adicionados regularmente.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ações rápidas — copiar e útil só para respostas encontradas */}
            {!isTyping && !isLoading && (
              <div className="mt-2.5 flex gap-1.5 animate-fade-in">
                {!isDefault && (
                  <>
                    <ActionPill
                      icon={liked ? "✓" : "👍"}
                      label={liked ? "Obrigado!" : "Útil"}
                      onClick={handleLike}
                      active={liked}
                    />
                    <ActionPill
                      icon={copied ? "✓" : "📋"}
                      label={copied ? "Copiado!" : "Copiar"}
                      onClick={handleCopy}
                      active={copied}
                    />
                  </>
                )}
                <ActionPill icon="↻" label="Refazer" onClick={onRetry} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Toast de feedback — aparece na base da tela após clicar "Útil" */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
        >
          <div className="flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-[13px] font-medium text-cream-50 shadow-xl ring-1 ring-white/10">
            <svg
              className="h-3.5 w-3.5 text-sage-400"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8l3.5 3.5L13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Obrigado pelo feedback!
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-blink rounded-full bg-navy-300"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-[12.5px] text-navy-400">
        {LOADING_MESSAGES[msgIdx]}
      </span>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${className ?? "text-navy-400"}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.5M8 11v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      className="h-3 w-3 flex-shrink-0 text-navy-400"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1.5" y="1" width="7.5" height="10" rx="0.8" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3.5 4h4M3.5 6h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      className="h-3 w-3 flex-shrink-0 text-sage-500"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 1a3.5 3.5 0 0 1 2.2 6.2c-.3.25-.7.8-.7 1.3H4.5c0-.5-.4-1.05-.7-1.3A3.5 3.5 0 0 1 6 1z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M4.5 9.5h3M5 11h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label: string;
};

function ConfidenceBadge({ level, label }: ConfidenceBadgeProps) {
  if (level === "none") return null;

  const styles =
    level === "high"
      ? "border-sage-200 bg-sage-50 text-sage-600"
      : "border-navy-100 bg-navy-50 text-navy-500";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles}`}>
      {label}
    </span>
  );
}

type ActionPillProps = {
  icon: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
};

function ActionPill({ icon, label, onClick, active }: ActionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-150 active:scale-95 ${
        active
          ? "border-sage-200 bg-sage-50 text-sage-700"
          : "border-navy-100 bg-white text-navy-500 hover:border-navy-200 hover:bg-navy-50"
      }`}
    >
      <span aria-hidden="true" className="text-[10px]">
        {icon}
      </span>
      {label}
    </button>
  );
}
