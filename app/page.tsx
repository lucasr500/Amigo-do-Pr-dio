"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AskInput from "@/components/AskInput";
import type { Topic, AnswerResult } from "@/lib/data";
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
  getMemoriaAssistida,
  getProfile,
  type MemoriaOperacional,
  type CondominioProfile,
} from "@/lib/session";
import { trackEvent, startSessionTimer } from "@/lib/telemetry";
import { startScheduler } from "@/lib/scheduler";
import { getUnreadCount } from "@/lib/notifications";
import { flushPendingSync, startOnlineListener } from "@/lib/sync/autoSync";
const NotificationCenter = dynamic(() => import("@/components/NotificationCenter"), { ssr: false });
const FavoritesPanel = dynamic(() => import("@/components/FavoritesPanel"), { ssr: false });
const HistoryPanel = dynamic(() => import("@/components/HistoryPanel"), { ssr: false });
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

// Assistente — carregados sob demanda (lib/data.ts + knowledge.json excluídos do first-load)
const QuickAccessCards = dynamic(() => import("@/components/QuickAccessCards"), { ssr: false });
const Response = dynamic(() => import("@/components/Response"), { ssr: false });

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
const AgendaMensal = dynamic(() => import("@/components/AgendaMensal"), { ssr: false });
const HomeAgendaCard = dynamic(() => import("@/components/HomeAgendaCard"), { ssr: false });
const HomeSaudeCard = dynamic(() => import("@/components/HomeSaudeCard"), { ssr: false });
const SaudeScreen = dynamic(() => import("@/components/SaudeScreen"), { ssr: false });
const PendenciasScreen = dynamic(() => import("@/components/PendenciasScreen"), { ssr: false });
// Aba Condomínio — leem localStorage via useEffect; retornam null antes de hidratar
const OnboardingProfile = dynamic(() => import("@/components/OnboardingProfile"), { ssr: false });
const OnboardingFlow = dynamic(() => import("@/components/onboarding/OnboardingFlow"), { ssr: false });
const MemoriaPanel = dynamic(() => import("@/components/MemoriaPanel"), { ssr: false });
const FuncionariosPanel = dynamic(() => import("@/components/FuncionariosPanel"), { ssr: false });
const DocumentosEssenciaisPanel = dynamic(() => import("@/components/DocumentosEssenciaisPanel"), { ssr: false });
const CalendarioOperacionalPanel = dynamic(() => import("@/components/CalendarioOperacionalPanel"), { ssr: false });
const ImplantacaoChecklist = dynamic(() => import("@/components/ImplantacaoChecklist"), { ssr: false });
// Aba Ferramentas — painéis de planejamento e decisão
const CommandCenterPanel = dynamic(() => import("@/components/CommandCenterPanel"), { ssr: false });
const DecisoesSindicoPanel = dynamic(() => import("@/components/DecisoesSindicoPanel"), { ssr: false });
const HomePriorityStrip = dynamic(() => import("@/components/HomePriorityStrip"), { ssr: false });
const AccountPanel = dynamic(() => import("@/components/AccountPanel"), { ssr: false });
const HealthTrendChart = dynamic(() => import("@/components/HealthTrendChart"), { ssr: false });
const NotificationSettingsPanel = dynamic(() => import("@/components/NotificationSettingsPanel"), { ssr: false });
const ProgressiveSetupCard = dynamic(() => import("@/components/ProgressiveSetupCard"), { ssr: false });

// ── Saudação dinâmica ──────────────────────────────────────────────────────────

function buildGreeting(condoName?: string): string {
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=dom, 5=sex, 6=sáb
  const condo = condoName ? ` — ${condoName}` : "";

  // Sexta-feira: mensagem contextual discreta
  if (day === 5 && h >= 14 && h < 22) return `Boa sexta-feira, síndico${condo}`;

  // Horário
  if (h >= 5 && h < 12)  return `Bom dia, síndico${condo}`;
  if (h >= 12 && h < 18) return `Boa tarde, síndico${condo}`;
  return `Boa noite, síndico${condo}`;
}

function DynamicGreeting({ condoName }: { condoName: string }) {
  const greeting = buildGreeting(condoName || undefined);
  return (
    <div className="px-5 pb-2 pt-1 sm:px-6">
      <p className="text-[15px] font-semibold leading-snug text-navy-800">{greeting}</p>
    </div>
  );
}

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
  const a = getMemoriaAssistida();
  const filled = [
    prof?.nomeCondominio,
    prof?.hasElevador !== undefined ? "set" : "",
    m.vencimentoAVCB || a.avcb?.value || (a.avcb?.status === "to_discover" ? "known" : ""),
    m.vencimentoSeguro || a.seguro?.value || (a.seguro?.status === "to_discover" ? "known" : ""),
    m.fimMandatoSindico || a.mandato?.value || (a.mandato?.status === "to_discover" ? "known" : ""),
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
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [condoName, setCondoName] = useState("");
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const scrollByTab = useRef<Partial<Record<AppTab, number>>>({});

  const urgentCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return getPendenciasAbertas().filter((p) => !!p.dueDate && p.dueDate <= today).length;
  }, [refreshKey]);

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
      setProfileCompletion(computeProfileCompletion(prof, m));
      setCondoName(prof?.nomeCondominio ?? "");
    }
    if (isFirstRun()) setShowOnboarding(true);
    // Inicia scheduler local (notificações + health snapshot)
    const stopScheduler = startScheduler();
    setUnreadNotifications(getUnreadCount());
    const stopSession = startSessionTimer();
    // Reprocessa sync pendente e ouve reconexão
    void flushPendingSync();
    const stopOnline = startOnlineListener();
    return () => { stopScheduler(); stopSession(); stopOnline(); };
  }, []);

  useEffect(() => {
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) {
      setHealthStatus(computeCondominioHealth().status);
      const m = getMemoriaOperacional();
      const prof = getProfile();
      setProfileCompletion(computeProfileCompletion(prof, m));
      setCondoName(prof?.nomeCondominio ?? "");
    } else {
      setProfileCompletion(0);
      setCondoName("");
    }
    setUnreadNotifications(getUnreadCount());
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

    const [{ findAnswer, logQuery }] = await Promise.all([
      import("@/lib/data"),
      new Promise<void>((resolve) => setTimeout(resolve, 150)),
    ]);

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
          <Header
            refreshKey={refreshKey}
            activeTab={activeTab}
            unreadNotifications={unreadNotifications}
            onNotificationsClick={() => setShowNotificationCenter(true)}
          />
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
                onGoToPendencias={() => navigateToSubView("pendencias")}
                onGoToAgenda={() => navigateTab("agenda")}
                onGoToRevisao={handleOpenRevisaoMensal}
                onAskQuestion={(q) => { backFromSubView(); handleSuggestionSelect(q); }}
              />
            )}

            {/* Sub-view: Pendências */}
            {subView === "pendencias" && (
              <PendenciasScreen
                refreshKey={refreshKey}
                onBack={backFromSubView}
              />
            )}

            {/* ProgressiveSetupCard — aponta especificamente o que falta e o que ativa */}
            {!subView && hasCondominioData && (
              <ProgressiveSetupCard
                refreshKey={refreshKey}
                onNavigate={(target) => {
                  void trackEvent("profile_completion_cta_tap", {
                    completion_bucket: completionBucket(profileCompletion),
                  });
                  navigateTab(target);
                }}
              />
            )}

            {/* Conteúdo normal da Home */}
            {!subView && hasCondominioData && (
              <>
                {/* Saudação dinâmica */}
                <DynamicGreeting condoName={condoName} />
                <HomeSaudeCard
                  refreshKey={refreshKey}
                  onClick={() => navigateToSubView("saude")}
                />
                <HomeAgendaCard
                  refreshKey={refreshKey}
                  onNavigate={() => navigateTab("agenda")}
                />
                {/* Cockpit strip — ação prioritária + notificações + sync */}
                <HomePriorityStrip
                  refreshKey={refreshKey}
                  onNavigate={(target) => {
                    if (target === "pendencias") navigateToSubView("pendencias");
                    else if (target === "condominio") navigateTab("condominio");
                    else if (target === "ferramentas") navigateTab("ferramentas");
                    else if (target === "agenda") navigateTab("agenda");
                  }}
                  onOpenNotifications={() => setShowNotificationCenter(true)}
                />
                {urgentCount > 0 && (
                  <div className="px-5 pb-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => navigateToSubView("pendencias")}
                      className="flex w-full items-center gap-3 rounded-[14px] border border-terracotta-200 bg-terracotta-50 px-4 py-3 shadow-sm transition-all hover:bg-terracotta-100 active:scale-[0.98]"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-[14px]" aria-hidden="true">
                        !
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[13px] font-semibold text-terracotta-800">
                          {urgentCount} {urgentCount !== 1 ? "pendências vencidas" : "pendência vencida"}
                        </p>
                        <p className="text-[11.5px] text-terracotta-600">
                          Prazo passou — requer atenção
                        </p>
                      </div>
                      <svg className="h-4 w-4 flex-shrink-0 text-terracotta-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
                <GuidancePanel
                  onAsk={handleSuggestionSelect}
                  onResolved={() => setRefreshKey((k) => k + 1)}
                  onPendenciaSaved={() => setRefreshKey((k) => k + 1)}
                  refreshKey={refreshKey}
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
                <p className="px-5 pb-3 text-[11px] leading-relaxed text-navy-400 sm:px-6">
                  As orientações têm caráter informativo. Para decisões específicas, consulte administradora, assessoria jurídica ou profissional responsável.
                </p>
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
                <div className="border-t border-navy-100 pt-6">
                  <CommandCenterPanel
                    refreshKey={refreshKey}
                    onNavigate={(target) => {
                      if (target === "pendencias") { navigateToSubView("pendencias"); navigateTab("inicio"); }
                      else if (target === "condominio") navigateTab("condominio");
                      else if (target === "agenda") navigateTab("agenda");
                    }}
                  />
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
              <>
                <PainelOperacional onAsk={handleSuggestionSelect} refreshKey={refreshKey} />
                <DecisoesSindicoPanel />
              </>
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
                <p className="mt-0.5 text-[11px] text-navy-400">Perfil do condomínio, estrutura e convenção.</p>
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
                <p className="mt-0.5 text-[11px] text-navy-400">AVCB, seguro, mandato e manutenções periódicas.</p>
              </div>
            )}
            <MemoriaPanel
              onSaved={() => {
                setRefreshKey((k) => k + 1);
                setShouldExpandMemoria(false);
              }}
              autoExpand={shouldExpandMemoria}
            />

            {/* ── Pessoal e contratos ───────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Pessoal e contratos</p>
                <p className="mt-0.5 text-[11px] text-navy-400">Funcionários, férias e situação trabalhista.</p>
              </div>
            )}
            <FuncionariosPanel onSaved={() => setRefreshKey((k) => k + 1)} />

            {/* ── Documentação essencial ────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Documentação essencial</p>
                <p className="mt-0.5 text-[11px] text-navy-400">Convenção, AVCB, seguro, laudos e contratos.</p>
              </div>
            )}
            <DocumentosEssenciaisPanel onSaved={() => setRefreshKey((k) => k + 1)} />
            <CalendarioOperacionalPanel refreshKey={refreshKey} />

            {/* ── Checklist de implantação ──────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Implantação</p>
                <p className="mt-0.5 text-[11px] text-navy-400">Progresso de organização e itens pendentes.</p>
              </div>
            )}
            <ImplantacaoChecklist
              onNavigate={(target) => {
                if (target === "condominio") {
                  const el = document.getElementById("revisao-mensal");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else if (target === "ferramentas") {
                  navigateTab("ferramentas");
                }
              }}
            />

            {/* ── Histórico operacional ─────────────────────────────── */}
            <TimelineOperacional refreshKey={refreshKey} />
            <div id="revisao-mensal" className="scroll-mt-3">
              <RevisaoMensal
                refreshKey={refreshKey}
                onDone={() => setRefreshKey((k) => k + 1)}
              />
            </div>

            {/* ── Conta e dados ─────────────────────────────────────── */}
            {hasCondominioData && (
              <div className="px-5 pb-0.5 pt-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Conta e dados</p>
                <p className="mt-0.5 text-[11px] text-navy-400">Backup, sincronização e configurações do app.</p>
              </div>
            )}

            {/* Conta e sincronização */}
            <section className="px-5 pb-2 pt-2 sm:px-6">
              <AccountPanel onRefresh={() => setRefreshKey((k) => k + 1)} />
            </section>

            {/* Backup e restauração */}
            <BackupPanel onImported={() => setRefreshKey((k) => k + 1)} />

            {/* Notificações */}
            <section className="px-5 pb-2 pt-1 sm:px-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Notificações</p>
                <button
                  type="button"
                  onClick={() => setShowNotifSettings((v) => !v)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium text-navy-500 hover:bg-navy-100 transition-colors"
                >
                  {showNotifSettings ? "Fechar" : "Configurar"}
                </button>
              </div>
              {showNotifSettings && <NotificationSettingsPanel />}
            </section>

            {/* Evolução da saúde operacional */}
            {hasCondominioData && (
              <section className="px-5 pb-3 pt-1 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300 mb-3">Evolução da saúde operacional</p>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
                  <HealthTrendChart />
                </div>
              </section>
            )}

            {/* ── Suporte e termos ──────────────────────────────────── */}
            <section className="px-5 pb-3 pt-3 sm:px-6">
              <div className="rounded-[18px] border border-navy-100/60 bg-white/70 px-4 py-4 shadow-[0_1px_2px_rgba(31,49,71,0.03)]">
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Sobre o app</p>
                </div>
                <div className="space-y-2">
                  <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Ferramenta de apoio operacional</p>
                    <p className="text-[11px] leading-relaxed text-navy-500">
                      O Amigo do Prédio auxilia síndicos no dia a dia, mas não substitui advogado, administradora ou profissional especializado. As orientações têm caráter informativo.
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Seus dados ficam no dispositivo</p>
                    <p className="text-[11px] leading-relaxed text-navy-500">
                      Os dados do condomínio são salvos localmente neste aparelho. Nada é enviado a terceiros. Use "Exportar dados" para fazer backup.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 pt-1">
                    <a
                      href="/termos"
                      className="text-[10.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600"
                    >
                      Termos de uso
                    </a>
                    <a
                      href="/privacidade"
                      className="text-[10.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600"
                    >
                      Política de privacidade
                    </a>
                    <p className="w-full text-[10px] leading-relaxed text-navy-300">
                      Versão preliminar — pendente revisão jurídica.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

      </div>

      <BottomNav active={activeTab} onChange={navigateTab} urgentCount={urgentCount} />

      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {showNotificationCenter && (
        <NotificationCenter
          onClose={() => {
            setShowNotificationCenter(false);
            setUnreadNotifications(0); // considera lidas ao fechar
          }}
          onAction={(actionKey) => {
            setShowNotificationCenter(false);
            // Navega para aba correta baseado no actionKey
            if (actionKey === "open_memoria" || actionKey === "open_funcionarios" || actionKey === "open_documentos") {
              navigateTab("condominio");
            } else if (actionKey === "open_pendencias") {
              navigateToSubView("pendencias");
              navigateTab("inicio");
            } else if (actionKey === "open_revisao_semanal") {
              handleOpenRevisaoMensal();
            }
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
