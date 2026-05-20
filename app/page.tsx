"use client";

import { useEffect, useRef, useState } from "react";
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
  addPendencia,
  getPendenciasAbertas,
  getPendenciasConcluidas,
} from "@/lib/session";
import { trackEvent, startSessionTimer } from "@/lib/telemetry";
import FavoritesPanel from "@/components/FavoritesPanel";
import HistoryPanel from "@/components/HistoryPanel";
import DicaDoDia from "@/components/DicaDoDia";
import HomeContextual from "@/components/HomeContextual";
import CondominioStatusHeader from "@/components/CondominioStatusHeader";
import GuidancePanel from "@/components/GuidancePanel";
import ProximasDatas from "@/components/ProximasDatas";
import PendenciasCard from "@/components/PendenciasCard";
import GuidancePreview from "@/components/GuidancePreview";
import RevisaoMensalCard from "@/components/RevisaoMensalCard";
import HomeResumoPredio from "@/components/HomeResumoPredio";
import BottomNav, { AppTab } from "@/components/BottomNav";

type ToolAnchor =
  | "comunicado"
  | "comunicado-infracao"
  | "comunicado-obra"
  | "comunicado-convocacao"
  | "comunicado-cobranca"
  | "simulador-multa"
  | "simulador-reajuste"
  | "checklists"
  | "registro-rapido";

// Carregamento sob demanda — só necessários quando a aba é ativada
const ComunicadoPanel = dynamic(() => import("@/components/ComunicadoPanel"), { ssr: false });
const SimuladorMulta = dynamic(() => import("@/components/SimuladorMulta"), { ssr: false });
const ChecklistPanel = dynamic(() => import("@/components/ChecklistPanel"), { ssr: false });
const PainelOperacional = dynamic(() => import("@/components/PainelOperacional"), { ssr: false });
const TimelineOperacional = dynamic(() => import("@/components/TimelineOperacional"), { ssr: false });
const RevisaoMensal = dynamic(() => import("@/components/RevisaoMensal"), { ssr: false });
const BackupPanel = dynamic(() => import("@/components/BackupPanel"), { ssr: false });
const RegistroRapido = dynamic(() => import("@/components/RegistroRapido"), { ssr: false });
const RevisaoSemanalCard = dynamic(() => import("@/components/RevisaoSemanalCard"), { ssr: false });
const SimuladorReajusteCota = dynamic(() => import("@/components/SimuladorReajusteCota"), { ssr: false });
// Aba Condomínio — leem localStorage via useEffect; retornam null antes de hidratar
const OnboardingProfile = dynamic(() => import("@/components/OnboardingProfile"), { ssr: false });
const MemoriaPanel = dynamic(() => import("@/components/MemoriaPanel"), { ssr: false });
// Insight contextual — só visível sem alertas ativos; insights.ts (~7 kB) fica fora do chunk inicial
const ContextualInsight = dynamic(() => import("@/components/ContextualInsight"), { ssr: false });

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
  const [pendingToolAnchor, setPendingToolAnchor] = useState<ToolAnchor | null>(null);
  const [highlightToolAnchor, setHighlightToolAnchor] = useState<ToolAnchor | null>(null);
  const [pendingChecklistId, setPendingChecklistId] = useState<string | null>(null);
  const [focusRevisaoMensal, setFocusRevisaoMensal] = useState(false);
  const [homeRefreshFeedback, setHomeRefreshFeedback] = useState("Atualizado agora");
  const scrollByTab = useRef<Partial<Record<AppTab, number>>>({});

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const y = scrollByTab.current[activeTab] ?? 0;
    window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "ferramentas" || !pendingToolAnchor) return;

    const anchor = pendingToolAnchor;
    const scrollToAnchor = () => {
      const el = document.getElementById(anchor);
      if (!el) return false;
      setHighlightToolAnchor(anchor);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => setHighlightToolAnchor(null), 1250);
      return true;
    };

    const first = window.setTimeout(scrollToAnchor, 80);
    const second = window.setTimeout(() => {
      scrollToAnchor();
      setPendingToolAnchor(null);
    }, 260);

    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [activeTab, pendingToolAnchor]);

  useEffect(() => {
    if (activeTab !== "condominio" || !focusRevisaoMensal) return;
    const scrollToRevisao = () => {
      const el = document.getElementById("revisao-mensal");
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    };
    const first = window.setTimeout(scrollToRevisao, 120);
    const second = window.setTimeout(() => {
      scrollToRevisao();
      setFocusRevisaoMensal(false);
    }, 320);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [activeTab, focusRevisaoMensal]);

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
    setRefreshKey((k) => k + 1);
    setIsLoading(false);
  };

  const handleAsk = () => executeAsk(question.trim());
  const handleRetry = () => executeAsk(submittedQuestion);

  const handleSavePendencia = (titulo: string, categoria: string, matchedId: string) => {
    addPendencia({ titulo, categoria, origem: "response", matchedId });
    void trackEvent("pendencia_created_from_response", { categoria, matched_id: matchedId });
    setRefreshKey((k) => k + 1);
  };

  const handleBack = () => {
    setQuestion(submittedQuestion); // restaura pergunta no input para reedição
    setSubmittedQuestion("");
    setAnswerResult(null);
  };

  const navigateTab = (tab: AppTab) => {
    if (typeof window !== "undefined") {
      scrollByTab.current[activeTab] = window.scrollY;
    }
    setActiveTab(tab);
  };

  const handleSuggestionSelect = (q: string) => {
    navigateTab("assistente");
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
    navigateTab("condominio");
  };

  const handleNavigateToChecklist = (checklistId: string) => {
    setPendingChecklistId(checklistId);
    setPendingToolAnchor("checklists");
    navigateTab("ferramentas");
  };

  const handleNavigateToFerramentas = (anchor: ToolAnchor = "comunicado") => {
    setPendingToolAnchor(anchor);
    navigateTab("ferramentas");
  };

  // Chamado pela bridge do OnboardingProfile: expande MemoriaPanel automaticamente
  const handleSetupMemoria = () => {
    setShouldExpandMemoria(true);
  };

  const handleOpenRevisaoMensal = () => {
    setFocusRevisaoMensal(true);
    navigateTab("condominio");
  };

  const handleHomeRefresh = () => {
    const completedMonthCount = getPendenciasConcluidas().filter((p) => {
      if (!p.completedAt) return false;
      const completedAt = new Date(p.completedAt);
      const now = new Date();
      return completedAt.getFullYear() === now.getFullYear() && completedAt.getMonth() === now.getMonth();
    }).length;
    const hasData = hasMemoriaOperacional() || hasProfile();
    void trackEvent("home_refreshed_manual", {
      pending_count: getPendenciasAbertas().length,
      completed_month_count: completedMonthCount,
      has_guidance: healthStatus === "critico" || healthStatus === "pendente" || healthStatus === "atencao",
      has_memoria: hasData,
    });
    setRefreshKey((k) => k + 1);
    setHomeRefreshFeedback("Dados atualizados");
    window.setTimeout(() => setHomeRefreshFeedback("Atualizado agora"), 1800);
  };

  return (
    <div className="grain-bg flex min-h-dvh max-w-[100vw] flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#F7F1E8_0,#FBF8F2_42%,#F4ECDF_100%)]">
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]">

        <Header refreshKey={refreshKey} />

        {/* ── 1. INÍCIO — painel operacional silencioso ──────────────── */}
        {activeTab === "inicio" && (
          <div key="inicio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

            {hasCondominioData && (
              <div className="flex items-center justify-between px-5 pb-2 pt-1 sm:px-6">
                <p className="text-[11px] font-medium text-navy-400">
                  {homeRefreshFeedback}
                </p>
                <button
                  type="button"
                  onClick={handleHomeRefresh}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-[11.5px] font-medium text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-600 active:scale-[0.97]"
                >
                  Atualizar
                </button>
              </div>
            )}

            {hasCondominioData ? (
              <CondominioStatusHeader
                onAsk={handleSuggestionSelect}
                refreshKey={refreshKey}
              />
            ) : (
              <Hero
                onSetup={handleScrollToMemoria}
                onAssistente={() => setActiveTab("assistente")}
                onSuggestionSelect={handleSuggestionSelect}
              />
            )}

            {/* Preview de valor — visível apenas no estado sem dados */}
            {!hasCondominioData && (
              <GuidancePreview onSetup={handleScrollToMemoria} />
            )}

            {/* Hub de saúde operacional — antes das prioridades */}
            {hasCondominioData && (
              <HomeResumoPredio refreshKey={refreshKey} />
            )}

            {hasCondominioData && (
              <GuidancePanel
                onAsk={handleSuggestionSelect}
                onResolved={() => setRefreshKey((k) => k + 1)}
                onPendenciaSaved={() => setRefreshKey((k) => k + 1)}
                refreshKey={refreshKey}
              />
            )}

            {hasCondominioData && (
              <RevisaoSemanalCard
                refreshKey={refreshKey}
                onDone={() => setRefreshKey((k) => k + 1)}
              />
            )}

            <PendenciasCard refreshKey={refreshKey} />

            {/* Atalho discreto para registro de ocorrência (formulário em Ferramentas) */}
            {hasCondominioData && (
              <div className="px-5 pb-1 sm:px-6">
                <button
                  type="button"
                  onClick={() => handleNavigateToFerramentas("registro-rapido")}
                  className="text-[12px] font-medium text-navy-400 transition-colors hover:text-navy-600"
                >
                  + Registrar ocorrência
                </button>
              </div>
            )}

            {hasCondominioData && (
              <RevisaoMensalCard
                refreshKey={refreshKey}
                onOpen={handleOpenRevisaoMensal}
              />
            )}

            {hasCondominioData && (
              <ProximasDatas
                onAsk={handleSuggestionSelect}
                onNavigateToCondominio={() => setActiveTab("condominio")}
                refreshKey={refreshKey}
              />
            )}

            {hasCondominioData &&
              healthStatus !== "critico" &&
              healthStatus !== "pendente" && (
                <ContextualInsight refreshKey={refreshKey} />
              )}

            {healthStatus !== "critico" && healthStatus !== "pendente" && (
              <HomeContextual refreshKey={refreshKey} />
            )}

            {hasCondominioData && healthStatus !== "critico" && (
              <DicaDoDia
                onAsk={handleSuggestionSelect}
                compact={healthStatus === "pendente"}
              />
            )}

          </div>
        )}

        {/* ── 2. ASSISTENTE — ferramenta premium de consulta ─────────── */}
        {activeTab === "assistente" && (
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

            {/* Botão voltar — só visível quando há resposta ativa */}
            {submittedQuestion && !isLoading && (
              <div className="px-4 pt-2 pb-0 sm:px-5">
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
              onNavigateToFerramentas={handleNavigateToFerramentas}
              onSavePendencia={handleSavePendencia}
            />

          </div>
        )}

        {/* ── 3. FERRAMENTAS — utilities operacionais ────────────────── */}
        {activeTab === "ferramentas" && (
          <div key="ferramentas" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

            <div className="px-5 pb-3 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Ferramentas
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                Ações práticas
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                Comunicados, simuladores e checklists para a rotina do síndico.
              </p>
            </div>

            {/* ── Rotina do síndico ─────────────────────── */}
            <div className="px-5 pb-1.5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">
                Rotina do síndico
              </p>
            </div>
            <div id="registro-rapido">
              <RegistroRapido onSaved={() => setRefreshKey((k) => k + 1)} />
            </div>

            {/* ── Comunicados ──────────────────────────── */}
            <div className="px-5 pb-1.5 pt-3 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">
                Comunicados
              </p>
            </div>
            <ComunicadoPanel
              targetAnchor={pendingToolAnchor}
              highlightAnchor={highlightToolAnchor}
            />

            {/* ── Simuladores ──────────────────────────── */}
            <div className="px-5 pb-1.5 pt-3 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">
                Simuladores
              </p>
            </div>
            <SimuladorMulta
              anchorId="simulador-multa"
              highlighted={highlightToolAnchor === "simulador-multa"}
            />
            <SimuladorReajusteCota
              anchorId="simulador-reajuste"
              highlighted={highlightToolAnchor === "simulador-reajuste"}
            />

            {/* ── Checklists ───────────────────────────── */}
            <div className="px-5 pb-1.5 pt-3 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">
                Checklists
              </p>
            </div>
            <ChecklistPanel
              anchorId="checklists"
              highlighted={highlightToolAnchor === "checklists"}
              initialOpenId={pendingChecklistId}
              onInitialOpenConsumed={() => setPendingChecklistId(null)}
            />

            <PainelOperacional onAsk={handleSuggestionSelect} refreshKey={refreshKey} />

          </div>
        )}

        {/* ── 4. CONDOMÍNIO — memória e dados do prédio ─────────────── */}
        {activeTab === "condominio" && (
          <div key="condominio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

            <div className="px-5 pb-2 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Condomínio
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                {hasCondominioData ? "Dados do prédio" : "Ativar monitoramento"}
              </p>
              {hasCondominioData ? (
                <p className="mt-1 text-[12.5px] leading-relaxed text-navy-500">
                  Dados que alimentam o monitoramento de prazos e alertas do app.
                </p>
              ) : (
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                  Registre os dados do seu prédio para ativar vencimentos, rotinas e alertas de acompanhamento.
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

            <div id="revisao-mensal" className="scroll-mt-3">
              <RevisaoMensal
                refreshKey={refreshKey}
                onDone={() => setRefreshKey((k) => k + 1)}
              />
            </div>

            <BackupPanel onImported={() => setRefreshKey((k) => k + 1)} />

          </div>
        )}

      </div>

      <BottomNav active={activeTab} onChange={navigateTab} />
    </div>
  );
}
