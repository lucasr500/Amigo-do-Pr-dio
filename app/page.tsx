"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AskInput from "@/components/AskInput";
import QuickAccessCards from "@/components/QuickAccessCards";
import Response from "@/components/Response";
import { findAnswer, logQuery, Topic, AnswerResult } from "@/lib/data";
import {
  incrementUsage,
  exportTelemetry,
  recordSessionOpen,
  hasMemoriaOperacional,
  hasProfile,
  computeCondominioHealth,
  CondominioHealthStatus,
} from "@/lib/session";
import { trackEvent, startSessionTimer } from "@/lib/telemetry";
import FavoritesPanel from "@/components/FavoritesPanel";
import HistoryPanel from "@/components/HistoryPanel";
import DicaDoDia from "@/components/DicaDoDia";
import OnboardingProfile from "@/components/OnboardingProfile";
import MemoriaPanel from "@/components/MemoriaPanel";
import HomeContextual from "@/components/HomeContextual";
import CondominioStatusHeader from "@/components/CondominioStatusHeader";
import GuidancePanel from "@/components/GuidancePanel";
import ContextualInsight from "@/components/ContextualInsight";
import BottomNav, { AppTab } from "@/components/BottomNav";

// Carregamento sob demanda — só necessários quando a aba é ativada
const ComunicadoPanel = dynamic(() => import("@/components/ComunicadoPanel"), { ssr: false });
const SimuladorMulta = dynamic(() => import("@/components/SimuladorMulta"), { ssr: false });
const ChecklistPanel = dynamic(() => import("@/components/ChecklistPanel"), { ssr: false });
const PainelOperacional = dynamic(() => import("@/components/PainelOperacional"), { ssr: false });
const TimelineOperacional = dynamic(() => import("@/components/TimelineOperacional"), { ssr: false });
const RevisaoMensal = dynamic(() => import("@/components/RevisaoMensal"), { ssr: false });
const BackupPanel = dynamic(() => import("@/components/BackupPanel"), { ssr: false });

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasCondominioData, setHasCondominioData] = useState(false);
  const [healthStatus, setHealthStatus] = useState<CondominioHealthStatus | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("inicio");
  const [shouldExpandMemoria, setShouldExpandMemoria] = useState(false);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__amigoDoPredioExport = exportTelemetry;
    const daysSince = recordSessionOpen();
    void trackEvent("session_open", { days_since_last: daysSince });
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) setHealthStatus(computeCondominioHealth().status);
    return startSessionTimer();
  }, []);

  useEffect(() => {
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) setHealthStatus(computeCondominioHealth().status);
  }, [refreshKey]);

  const executeAsk = async (q: string) => {
    if (!q || isLoading) return;

    setQuestion("");
    setIsLoading(true);
    setSubmittedQuestion(q);
    setAnswerResult(null);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = findAnswer(q);
    logQuery(q, result);
    incrementUsage();
    if (result.isDefault) {
      void trackEvent("query_fallback", {
        q: q.slice(0, 80),
        detected_category: result.detectedCategory,
      });
    } else {
      void trackEvent("query_submitted", {
        q: q.slice(0, 80),
        categoria: result.matched?.categoria ?? null,
      });
    }
    setAnswerResult(result);
    setRefreshKey((k) => k + 1);
    setIsLoading(false);
  };

  const handleAsk = () => executeAsk(question.trim());
  const handleRetry = () => executeAsk(submittedQuestion);

  const handleSuggestionSelect = (q: string) => {
    setActiveTab("assistente");
    setQuestion(q);
    executeAsk(q);
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setSubmittedQuestion("");
    setAnswerResult(null);
  };

  const handleTopicSelect = (topic: Topic) => {
    setQuestion(topic.examplePrompt);
    setTimeout(() => {
      const el = document.getElementById("ask-question") as HTMLTextAreaElement;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }, 50);
  };

  const handleScrollToMemoria = () => {
    setActiveTab("condominio");
  };

  const handleNavigateToChecklist = (_checklistId: string) => {
    setActiveTab("ferramentas");
  };

  // Chamado pela bridge do OnboardingProfile: expande MemoriaPanel automaticamente
  const handleSetupMemoria = () => {
    setShouldExpandMemoria(true);
  };

  return (
    <div className="grain-bg flex min-h-dvh flex-col bg-gradient-to-b from-cream-50 via-cream-50 to-cream-100/60">
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col pb-24">

        <Header refreshKey={refreshKey} />

        {/* ── 1. INÍCIO — painel operacional silencioso ──────────────── */}
        {activeTab === "inicio" && (
          <div key="inicio" className="tab-enter flex flex-1 flex-col">

            {hasCondominioData ? (
              <CondominioStatusHeader
                onAsk={handleSuggestionSelect}
                refreshKey={refreshKey}
              />
            ) : (
              <Hero
                onSetup={handleScrollToMemoria}
                onAssistente={() => setActiveTab("assistente")}
              />
            )}

            {hasCondominioData && (
              <GuidancePanel
                onAsk={handleSuggestionSelect}
                onResolved={() => setRefreshKey((k) => k + 1)}
                refreshKey={refreshKey}
              />
            )}

            {hasCondominioData &&
              healthStatus !== "critico" &&
              healthStatus !== "pendente" && (
                <ContextualInsight refreshKey={refreshKey} />
              )}

            <HomeContextual refreshKey={refreshKey} />
            <DicaDoDia onAsk={handleSuggestionSelect} />

          </div>
        )}

        {/* ── 2. ASSISTENTE — ferramenta premium de consulta ─────────── */}
        {activeTab === "assistente" && (
          <div key="assistente" className="tab-enter flex flex-1 flex-col">

            {!submittedQuestion && !isLoading && (
              <div className="px-5 pb-2 pt-1 sm:px-6">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                  Assistente
                </p>
                <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                  Como posso ajudar?
                </p>
              </div>
            )}

            <AskInput
              value={question}
              onChange={setQuestion}
              onSubmit={handleAsk}
              isLoading={isLoading}
            />

            {!submittedQuestion && !isLoading && (
              <>
                <QuickAccessCards onSelect={handleTopicSelect} collapsed={false} />
                <HistoryPanel onSelect={handleSuggestionSelect} refreshKey={refreshKey} />
                <FavoritesPanel onSelect={handleSuggestionSelect} refreshKey={refreshKey} />
              </>
            )}

            <Response
              question={submittedQuestion}
              answerResult={answerResult}
              isLoading={isLoading}
              onRetry={handleRetry}
              onSuggestionSelect={handleSuggestionSelect}
              onFavorite={() => setRefreshKey((k) => k + 1)}
              onNewQuestion={handleNewQuestion}
              onNavigateToChecklist={handleNavigateToChecklist}
            />

          </div>
        )}

        {/* ── 3. FERRAMENTAS — utilities operacionais ────────────────── */}
        {activeTab === "ferramentas" && (
          <div key="ferramentas" className="tab-enter flex flex-1 flex-col">

            <div className="px-5 pb-3 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Ferramentas
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                Caixa de ferramentas
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                Comunicados prontos, cálculos e checklists para o dia a dia do síndico.
              </p>
            </div>

            <ComunicadoPanel />
            <SimuladorMulta />
            <PainelOperacional onAsk={handleSuggestionSelect} refreshKey={refreshKey} />
            <ChecklistPanel />

          </div>
        )}

        {/* ── 4. CONDOMÍNIO — memória e dados do prédio ─────────────── */}
        {activeTab === "condominio" && (
          <div key="condominio" className="tab-enter flex flex-1 flex-col">

            <div className="px-5 pb-2 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Condomínio
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                {hasCondominioData ? "Dados e memória" : "Seu condomínio"}
              </p>
              {!hasCondominioData && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                  Quanto mais o Amigo do Prédio conhece seu prédio, melhor consegue
                  te orientar. Cadastre o básico agora — você completa o restante
                  depois.
                </p>
              )}
            </div>

            <OnboardingProfile
              onProfileSaved={() => setRefreshKey((k) => k + 1)}
              onSetupMemoria={handleSetupMemoria}
              forceShow
            />

            <MemoriaPanel
              onSaved={() => {
                setRefreshKey((k) => k + 1);
                setShouldExpandMemoria(false);
              }}
              autoExpand={shouldExpandMemoria}
            />

            <TimelineOperacional refreshKey={refreshKey} />

            <RevisaoMensal
              refreshKey={refreshKey}
              onDone={() => setRefreshKey((k) => k + 1)}
            />

            <BackupPanel onImported={() => setRefreshKey((k) => k + 1)} />

          </div>
        )}

      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
