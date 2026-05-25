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
  isFirstRun,
  getMemoriaOperacional,
  getProfile,
  type MemoriaOperacional,
  type CondominioProfile,
} from "@/lib/session";
import { trackEvent, startSessionTimer } from "@/lib/telemetry";
import FavoritesPanel from "@/components/FavoritesPanel";
import HistoryPanel from "@/components/HistoryPanel";
import DicaDoDia from "@/components/DicaDoDia";
import HomeContextual from "@/components/HomeContextual";
import GuidancePanel from "@/components/GuidancePanel";
import GuidancePreview from "@/components/GuidancePreview";
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
  | "registro-rapido"
  | "agenda-predio";

type ToolGroup = "rotina" | "comunicados" | "simuladores" | "checklists" | "temas";

const ANCHOR_TO_GROUP: Partial<Record<ToolAnchor, ToolGroup>> = {
  "registro-rapido": "rotina",
  "agenda-predio": "rotina",
  comunicado: "comunicados",
  "comunicado-infracao": "comunicados",
  "comunicado-obra": "comunicados",
  "comunicado-convocacao": "comunicados",
  "comunicado-cobranca": "comunicados",
  "simulador-multa": "simuladores",
  "simulador-reajuste": "simuladores",
  checklists: "checklists",
};

const TOOL_CATEGORIES: Array<{ id: ToolGroup; icon: string; title: string; description: string }> = [
  { id: "rotina",      icon: "📋", title: "Rotina do síndico", description: "Registre ocorrências e acompanhe próximos passos do dia a dia." },
  { id: "comunicados", icon: "📢", title: "Comunicados",        description: "Gere avisos formais para moradores em segundos." },
  { id: "simuladores", icon: "🧮", title: "Simuladores",        description: "Estime multas, juros e reajuste de cota condominial." },
  { id: "checklists",  icon: "✅", title: "Checklists",         description: "Conferência guiada para assembleias, obras e manutenção." },
  { id: "temas",       icon: "🔍", title: "Explorar por tema",  description: "Orientações práticas organizadas por tema de gestão." },
];

// Carregamento sob demanda — só necessários quando a aba é ativada
const ComunicadoPanel = dynamic(() => import("@/components/ComunicadoPanel"), { ssr: false });
const SimuladorMulta = dynamic(() => import("@/components/SimuladorMulta"), { ssr: false });
const ChecklistPanel = dynamic(() => import("@/components/ChecklistPanel"), { ssr: false });
const PainelOperacional = dynamic(() => import("@/components/PainelOperacional"), { ssr: false });
const TimelineOperacional = dynamic(() => import("@/components/TimelineOperacional"), { ssr: false });
const RevisaoMensal = dynamic(() => import("@/components/RevisaoMensal"), { ssr: false });
const BackupPanel = dynamic(() => import("@/components/BackupPanel"), { ssr: false });
const RegistroRapido = dynamic(() => import("@/components/RegistroRapido"), { ssr: false });
const AgendaPredio = dynamic(() => import("@/components/AgendaPredio"), { ssr: false });
const SimuladorReajusteCota = dynamic(() => import("@/components/SimuladorReajusteCota"), { ssr: false });
// Aba Home — cards principais
const HomeAcaoHub = dynamic(() => import("@/components/HomeAcaoHub"), { ssr: false });
const AgendaMensal = dynamic(() => import("@/components/AgendaMensal"), { ssr: false });
const HomeAgendaCard = dynamic(() => import("@/components/HomeAgendaCard"), { ssr: false });
const HomeQuickStats = dynamic(() => import("@/components/HomeQuickStats"), { ssr: false });
const HomeSaudeCard = dynamic(() => import("@/components/HomeSaudeCard"), { ssr: false });
const SaudeScreen = dynamic(() => import("@/components/SaudeScreen"), { ssr: false });
const PendenciasScreen = dynamic(() => import("@/components/PendenciasScreen"), { ssr: false });
// Aba Condomínio — leem localStorage via useEffect; retornam null antes de hidratar
const OnboardingProfile = dynamic(() => import("@/components/OnboardingProfile"), { ssr: false });
const OnboardingFlow = dynamic(() => import("@/components/onboarding/OnboardingFlow"), { ssr: false });
const MemoriaPanel = dynamic(() => import("@/components/MemoriaPanel"), { ssr: false });
// Insight contextual — só visível sem alertas ativos; insights.ts (~7 kB) fica fora do chunk inicial
const ContextualInsight = dynamic(() => import("@/components/ContextualInsight"), { ssr: false });

// ── Urgency + profile completion helpers ───────────────────────────────────────

type UrgentItem = {
  type: "avcb" | "seguro" | "mandato";
  label: string;
  urgency: "expired" | "critical" | "warning";
  daysLeft: number;
};

function _daysUntilDate(dateStr: string): number {
  const t = new Date(`${dateStr}T00:00:00`);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - now.getTime()) / 86_400_000);
}

function computeUrgentItem(m: MemoriaOperacional): UrgentItem | null {
  const candidates: UrgentItem[] = [];
  const check = (dateStr: string | undefined, type: UrgentItem["type"], label: string) => {
    if (!dateStr) return;
    const d = _daysUntilDate(dateStr);
    if (d > 30) return;
    const urgency: UrgentItem["urgency"] = d < 0 ? "expired" : d <= 7 ? "critical" : "warning";
    candidates.push({ type, label, urgency, daysLeft: d });
  };
  check(m.vencimentoAVCB, "avcb", "AVCB");
  check(m.vencimentoSeguro, "seguro", "Seguro condominial");
  check(m.fimMandatoSindico, "mandato", "Mandato do síndico");
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.daysLeft - b.daysLeft)[0];
}

function computeProfileCompletion(prof: CondominioProfile | null, m: MemoriaOperacional): number {
  const filled = [
    prof?.nomeCondominio,
    prof?.hasElevador !== undefined ? "set" : "",
    m.vencimentoAVCB,
    m.vencimentoSeguro,
    m.fimMandatoSindico,
  ].filter(Boolean).length;
  return Math.round((filled / 5) * 100);
}

function completionBucket(pct: number): string {
  if (pct <= 25) return "0-25";
  if (pct <= 50) return "26-50";
  if (pct <= 75) return "51-75";
  return "76-99";
}

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
  const [activeToolGroup, setActiveToolGroup] = useState<ToolGroup | null>(null);
  const [subView, setSubView] = useState<"saude" | "pendencias" | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [urgentItem, setUrgentItem] = useState<UrgentItem | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [condoName, setCondoName] = useState("");
  const scrollByTab = useRef<Partial<Record<AppTab, number>>>({});

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__amigoDoPredioExport = exportTelemetry;
    const daysSince = recordSessionOpen();
    void trackEvent("session_open", { days_since_last: daysSince });
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) {
      setHealthStatus(computeCondominioHealth().status);
      const m = getMemoriaOperacional();
      const prof = getProfile();
      setUrgentItem(computeUrgentItem(m));
      setProfileCompletion(computeProfileCompletion(prof, m));
      setCondoName(prof?.nomeCondominio ?? "");
    }
    if (isFirstRun()) setShowOnboarding(true);
    return startSessionTimer();
  }, []);

  useEffect(() => {
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) {
      setHealthStatus(computeCondominioHealth().status);
      const m = getMemoriaOperacional();
      const prof = getProfile();
      setUrgentItem(computeUrgentItem(m));
      setProfileCompletion(computeProfileCompletion(prof, m));
      setCondoName(prof?.nomeCondominio ?? "");
    } else {
      setUrgentItem(null);
      setProfileCompletion(0);
      setCondoName("");
    }
  }, [refreshKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const y = scrollByTab.current[activeTab] ?? 0;
    window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "ferramentas" || !pendingToolAnchor) return;

    const anchor = pendingToolAnchor;
    const group = ANCHOR_TO_GROUP[anchor];
    if (group) setActiveToolGroup(group);

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
    if (activeTab !== "ferramentas") setActiveToolGroup(null);
  }, [activeTab]);

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
    setSubView(null);
    setActiveTab(tab);
  };

  const navigateToSubView = (view: "saude" | "pendencias") => {
    setSubView(view);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  };

  const backFromSubView = () => {
    setSubView(null);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
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

  const handleNavigateToAgenda = () => {
    navigateTab("agenda");
  };

  // Chamado pela bridge do OnboardingProfile: expande MemoriaPanel automaticamente
  const handleSetupMemoria = () => {
    setShouldExpandMemoria(true);
  };

  const handleOpenRevisaoMensal = () => {
    setFocusRevisaoMensal(true);
    navigateTab("condominio");
  };

  return (
    <div className="grain-bg flex min-h-dvh max-w-[100vw] flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#F7F1E8_0,#FBF8F2_42%,#F4ECDF_100%)]">
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]">

        {!(activeTab === "inicio" && subView) && (
          <Header refreshKey={refreshKey} activeTab={activeTab} />
        )}

        {/* ── 1. INÍCIO — painel operacional silencioso ──────────────── */}
        {activeTab === "inicio" && (
          <div key="inicio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

            {/* Sub-view: Saúde Operacional */}
            {subView === "saude" && (
              <SaudeScreen
                refreshKey={refreshKey}
                onBack={backFromSubView}
                onNavigateToTimeline={() => { backFromSubView(); navigateTab("condominio"); }}
                onGoToCondominio={() => { backFromSubView(); navigateTab("condominio"); }}
              />
            )}

            {/* Sub-view: Pendências */}
            {subView === "pendencias" && (
              <PendenciasScreen
                refreshKey={refreshKey}
                onBack={backFromSubView}
              />
            )}

            {/* UrgencyBanner — exibe apenas quando há documento crítico (≤30 dias ou vencido) */}
            {!subView && hasCondominioData && urgentItem && (
              <div className="mx-5 mb-3 sm:mx-6">
                <button
                  type="button"
                  onClick={() => {
                    void trackEvent("urgency_banner_tap", {
                      type: urgentItem.type,
                      urgency: urgentItem.urgency,
                    });
                    navigateToSubView("saude");
                  }}
                  className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                    urgentItem.urgency === "expired" || urgentItem.urgency === "critical"
                      ? "border-terracotta-200 bg-terracotta-50 hover:bg-terracotta-100/70"
                      : "border-amber-200 bg-amber-50 hover:bg-amber-100/70"
                  }`}
                >
                  <span className="text-[18px] leading-none" aria-hidden="true">
                    {urgentItem.type === "avcb" ? "📋" : urgentItem.type === "seguro" ? "🛡️" : "🗳️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      urgentItem.urgency === "expired" || urgentItem.urgency === "critical"
                        ? "text-terracotta-700"
                        : "text-amber-700"
                    }`}>
                      {urgentItem.urgency === "expired" ? "Vencido" : "Prazo próximo"}
                    </p>
                    <p className={`text-[13.5px] font-medium ${
                      urgentItem.urgency === "expired" || urgentItem.urgency === "critical"
                        ? "text-terracotta-900"
                        : "text-amber-900"
                    }`}>
                      {urgentItem.label}
                      {" — "}
                      {urgentItem.daysLeft < 0
                        ? "vencido"
                        : urgentItem.daysLeft === 0
                        ? "vence hoje"
                        : `vence em ${urgentItem.daysLeft} dia${urgentItem.daysLeft !== 1 ? "s" : ""}`}
                    </p>
                    <p className={`mt-0.5 text-[11px] font-medium ${
                      urgentItem.urgency === "expired" || urgentItem.urgency === "critical"
                        ? "text-terracotta-600"
                        : "text-amber-600"
                    }`}>
                      Ver saúde operacional →
                    </p>
                  </div>
                  <svg
                    className={`h-4 w-4 flex-shrink-0 ${
                      urgentItem.urgency === "expired" || urgentItem.urgency === "critical"
                        ? "text-terracotta-400"
                        : "text-amber-400"
                    }`}
                    viewBox="0 0 16 16" fill="none" aria-hidden="true"
                  >
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* ProfileCompletionCard — esconde quando 100% completo */}
            {!subView && hasCondominioData && profileCompletion < 100 && (
              <div className="mx-5 mb-3 sm:mx-6">
                <div className="overflow-hidden rounded-[14px] border border-navy-100/80 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-navy-500">
                        Perfil do condomínio
                      </p>
                      <p className="mt-0.5 text-[13px] text-navy-700">
                        {profileCompletion > 0
                          ? `${profileCompletion}% completo`
                          : "Dados essenciais não cadastrados"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void trackEvent("profile_completion_cta_tap", {
                          completion_bucket: completionBucket(profileCompletion),
                        });
                        navigateTab("condominio");
                      }}
                      className="flex-shrink-0 rounded-full border border-navy-200 bg-navy-50 px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-100 active:scale-95"
                    >
                      Completar
                    </button>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-navy-500 transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo normal da Home */}
            {!subView && hasCondominioData && (
              <>
                <HomeAgendaCard
                  refreshKey={refreshKey}
                  onNavigate={() => navigateTab("agenda")}
                />
                <HomeSaudeCard
                  refreshKey={refreshKey}
                  onClick={() => navigateToSubView("saude")}
                />
                <HomeQuickStats
                  refreshKey={refreshKey}
                  onNavigateToAgenda={() => navigateTab("agenda")}
                  onNavigateToPendencias={() => navigateToSubView("pendencias")}
                  onNavigateToPassos={() => navigateToSubView("pendencias")}
                />
              </>
            )}

            {!subView && !hasCondominioData && (
              <>
                <Hero
                  onSetup={handleScrollToMemoria}
                  onAssistente={() => setActiveTab("assistente")}
                  onSuggestionSelect={handleSuggestionSelect}
                />
                <GuidancePreview onSetup={handleScrollToMemoria} />
              </>
            )}

            {!subView && hasCondominioData && (
              <GuidancePanel
                onAsk={handleSuggestionSelect}
                onResolved={() => setRefreshKey((k) => k + 1)}
                onPendenciaSaved={() => setRefreshKey((k) => k + 1)}
                refreshKey={refreshKey}
              />
            )}

            {!subView && hasCondominioData && (
              <HomeAcaoHub
                refreshKey={refreshKey}
                onDoneReview={() => setRefreshKey((k) => k + 1)}
                onNavigateToFerramentas={() => handleNavigateToFerramentas("registro-rapido")}
                onNavigateToAssistente={() => navigateTab("assistente")}
              />
            )}

            {!subView && hasCondominioData &&
              healthStatus !== "critico" &&
              healthStatus !== "pendente" && (
                <ContextualInsight refreshKey={refreshKey} />
              )}

            {!subView && healthStatus !== "critico" && healthStatus !== "pendente" && (
              <HomeContextual refreshKey={refreshKey} />
            )}

            {!subView && hasCondominioData && healthStatus !== "critico" && (
              <DicaDoDia
                onAsk={handleSuggestionSelect}
                compact={healthStatus === "pendente"}
              />
            )}

          </div>
        )}

        {/* ── 2. AGENDA — calendário e eventos do prédio ────────────── */}
        {activeTab === "agenda" && (
          <div key="agenda" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
            <div className="px-5 pb-2 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Agenda
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                Agenda do prédio
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-navy-500">
                Vencimentos, manutenções e compromissos do condomínio.
              </p>
            </div>
            <AgendaMensal refreshKey={refreshKey} onNavigateToAgenda={() => {}} />
            <AgendaPredio onSaved={() => setRefreshKey((k) => k + 1)} />
          </div>
        )}

        {/* ── 3. ASSISTENTE — ferramenta premium de consulta ─────────── */}
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

        {/* ── 4. FERRAMENTAS — central de ações por categorias ──────── */}
        {activeTab === "ferramentas" && (
          <div key="ferramentas" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

            {/* Header — sempre visível */}
            <div className="px-5 pb-3 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Ferramentas
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                Ferramentas do síndico
              </p>
              {activeToolGroup === null && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                  Registre ocorrências, gere comunicados, faça simulações e consulte checklists.
                </p>
              )}
            </div>

            {/* Botão Voltar — visível apenas nas views internas */}
            {activeToolGroup !== null && (
              <div className="px-4 pb-3 pt-0 sm:px-5">
                <button
                  type="button"
                  onClick={() => setActiveToolGroup(null)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
                >
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[11.5px] font-medium">Voltar para ferramentas</span>
                </button>
              </div>
            )}

            {/* ── Menu de categorias ─────────────────────────────────── */}
            {activeToolGroup === null && (
              <div className="px-5 pb-6 sm:px-6">
                <div className="flex flex-col gap-3">
                  {TOOL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveToolGroup(cat.id)}
                      className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-navy-200 hover:shadow active:scale-[0.98]"
                    >
                      <span className="flex-shrink-0 text-[22px] leading-none" aria-hidden="true">
                        {cat.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-navy-800">{cat.title}</p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-navy-500">{cat.description}</p>
                      </div>
                      <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Rotina do síndico ─────────────────────────────────── */}
            {activeToolGroup === "rotina" && (
              <div className="space-y-6">
                <div id="registro-rapido">
                  <RegistroRapido onSaved={() => setRefreshKey((k) => k + 1)} />
                </div>
                <div id="agenda-predio" className="border-t border-navy-100 pt-6">
                  <AgendaPredio onSaved={() => setRefreshKey((k) => k + 1)} />
                </div>
              </div>
            )}

            {/* ── Comunicados ──────────────────────────────────────── */}
            {activeToolGroup === "comunicados" && (
              <ComunicadoPanel
                targetAnchor={pendingToolAnchor}
                highlightAnchor={highlightToolAnchor}
              />
            )}

            {/* ── Simuladores ──────────────────────────────────────── */}
            {activeToolGroup === "simuladores" && (
              <>
                <SimuladorMulta
                  anchorId="simulador-multa"
                  highlighted={highlightToolAnchor === "simulador-multa"}
                />
                <SimuladorReajusteCota
                  anchorId="simulador-reajuste"
                  highlighted={highlightToolAnchor === "simulador-reajuste"}
                />
              </>
            )}

            {/* ── Checklists ───────────────────────────────────────── */}
            {activeToolGroup === "checklists" && (
              <ChecklistPanel
                anchorId="checklists"
                highlighted={highlightToolAnchor === "checklists"}
                initialOpenId={pendingChecklistId}
                onInitialOpenConsumed={() => setPendingChecklistId(null)}
              />
            )}

            {/* ── Explorar por tema ────────────────────────────────── */}
            {activeToolGroup === "temas" && (
              <PainelOperacional onAsk={handleSuggestionSelect} refreshKey={refreshKey} />
            )}

          </div>
        )}

        {/* ── 5. CONDOMÍNIO — memória e dados do prédio ─────────────── */}
        {activeTab === "condominio" && (
          <div key="condominio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

            {/* ── Cabeçalho ─────────────────────────────────────────── */}
            <div className="px-5 pb-2 pt-1 sm:px-6">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
                Condomínio
              </p>
              <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
                {condoName || (hasCondominioData ? "Meu prédio" : "Ativar monitoramento")}
              </p>
              {hasCondominioData ? (
                <p className="mt-1 text-[12.5px] leading-relaxed text-navy-500">
                  Dados essenciais, rotina operacional e segurança dos registros.
                </p>
              ) : (
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">
                  Cadastre os dados essenciais para acompanhar prazos, pendências e saúde operacional.
                </p>
              )}
            </div>

            {/* ── Dados do prédio ───────────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-4 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Dados do prédio</p>
              </div>
            )}
            <OnboardingProfile
              onProfileSaved={() => setRefreshKey((k) => k + 1)}
              onSetupMemoria={handleSetupMemoria}
              forceShow
            />

            {/* ── Vencimentos e rotinas ─────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Vencimentos e rotinas</p>
              </div>
            )}
            <MemoriaPanel
              onSaved={() => {
                setRefreshKey((k) => k + 1);
                setShouldExpandMemoria(false);
              }}
              autoExpand={shouldExpandMemoria}
            />

            {/* ── Histórico operacional ─────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Histórico operacional</p>
              </div>
            )}
            <TimelineOperacional refreshKey={refreshKey} />
            <div id="revisao-mensal" className="scroll-mt-3">
              <RevisaoMensal
                refreshKey={refreshKey}
                onDone={() => setRefreshKey((k) => k + 1)}
              />
            </div>

            {/* ── Backup e segurança ────────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Backup e segurança</p>
              </div>
            )}
            <BackupPanel onImported={() => setRefreshKey((k) => k + 1)} />

            {/* ── Suporte e termos ──────────────────────────────────── */}
            <section className="px-5 pb-3 pt-4 sm:px-6">
              <div className="rounded-[18px] border border-navy-100/60 bg-white/70 px-4 py-4 shadow-[0_1px_2px_rgba(31,49,71,0.03)]">
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Suporte e termos</p>
                  <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[9.5px] font-semibold text-navy-500">Pré-beta</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Ferramenta de apoio operacional</p>
                    <p className="text-[11px] leading-relaxed text-navy-500">
                      O Amigo do Prédio auxilia síndicos no dia a dia, mas não substitui advogado, administradora ou outros profissionais especializados. As orientações têm caráter informativo.
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Seus dados ficam no dispositivo</p>
                    <p className="text-[11px] leading-relaxed text-navy-500">
                      As informações do condomínio são salvas localmente neste aparelho e não são enviadas a terceiros. Use "Exportar dados" para fazer backup.
                    </p>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-navy-400">
                      Evite inserir dados sensíveis desnecessários — como CPF, números de documento ou informações pessoais de moradores.
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Telemetria de uso</p>
                    <p className="text-[11px] leading-relaxed text-navy-500">
                      Eventos técnicos anônimos (sem texto livre nem dados do condomínio) podem ser coletados para melhorar o produto. Não compartilhamos dados com terceiros para fins de marketing.
                    </p>
                  </div>
                  <p className="px-0.5 pt-1 text-[10.5px] leading-relaxed text-navy-400">
                    Versão preliminar para pré-beta. Termos de uso e política de privacidade completos serão publicados antes do lançamento público, após revisão jurídica.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Conta e sincronização ─────────────────────────────── */}
            <section className="px-5 pb-8 sm:px-6">
              <div className="rounded-[18px] border border-navy-100/60 bg-white/70 px-4 py-4 shadow-[0_1px_2px_rgba(31,49,71,0.03)]">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Armazenamento</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[15px]">
                    💾
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-navy-700">Dados salvos neste dispositivo</p>
                    <p className="text-[11px] text-navy-400">Armazenamento local — sem conta necessária</p>
                  </div>
                </div>
                <div className="rounded-[12px] border border-navy-100 bg-cream-100/40 px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[14px]">☁️</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-navy-600">Sincronização em nuvem</p>
                      <p className="text-[11px] text-navy-400">Ainda não disponível. Nesta versão, use o backup manual para proteger seus dados.</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
                      Em breve
                    </span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

      </div>

      <BottomNav active={activeTab} onChange={navigateTab} />

      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
