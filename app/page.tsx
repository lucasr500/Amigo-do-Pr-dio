"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import BottomNav, { AppTab } from "@/components/BottomNav";
import HomeTab from "@/components/tabs/HomeTab";
import AgendaTab from "@/components/tabs/AgendaTab";
import AssistantTab from "@/components/tabs/AssistantTab";
import ToolsTab from "@/components/tabs/ToolsTab";
import CondominioTab from "@/components/tabs/CondominioTab";
import type { ToolAnchor, ToolGroup } from "@/lib/app-navigation";
import { ANCHOR_TO_GROUP } from "@/lib/app-navigation";
import {
  incrementUsage,
  exportTelemetry,
  recordSessionOpen,
  hasMemoriaOperacional,
  hasProfile,
  addPendencia,
  getPendenciasAbertas,
  isFirstRun,
  getMemoriaOperacional,
  getMemoriaAssistida,
  getProfile,
  getLastBackupAt,
  type MemoriaOperacional,
  type CondominioProfile,
} from "@/lib/session";
import { trackEvent, startSessionTimer } from "@/lib/telemetry";
import { startScheduler } from "@/lib/scheduler";
import { getUnreadCount } from "@/lib/notifications";
import { flushPendingSync, startOnlineListener } from "@/lib/sync/autoSync";
import type { AnswerResult, Topic } from "@/lib/data";

const NotificationCenter = dynamic(() => import("@/components/NotificationCenter"), { ssr: false });
const DemoModeBanner     = dynamic(() => import("@/components/DemoModeBanner"), { ssr: false });
const OnboardingFlow     = dynamic(() => import("@/components/onboarding/OnboardingFlow"), { ssr: false });

// ── Profile helpers ───────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // ── Assistente state ────────────────────────────────────────────
  const [question, setQuestion]             = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answerResult, setAnswerResult]     = useState<AnswerResult | null>(null);
  const [isLoading, setIsLoading]           = useState(false);

  // ── App-wide state ──────────────────────────────────────────────
  const [refreshKey, setRefreshKey]         = useState(0);
  const [hasCondominioData, setHasCondominioData] = useState(false);
  const [activeTab, setActiveTab]           = useState<AppTab>("inicio");
  const [subView, setSubView]               = useState<"saude" | "pendencias" | null>(null);
  const [condoName, setCondoName]           = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isDemo, setIsDemo]                 = useState(false);
  const [showBackupNudge, setShowBackupNudge] = useState(false);

  // ── Condomínio state ────────────────────────────────────────────
  const [shouldExpandMemoria, setShouldExpandMemoria] = useState(false);
  const [showNotifSettings, setShowNotifSettings]     = useState(false);
  const [focusRevisaoMensal, setFocusRevisaoMensal]   = useState(false);

  // ── Ferramentas state ───────────────────────────────────────────
  const [activeToolGroup, setActiveToolGroup]     = useState<ToolGroup | null>(null);
  const [pendingToolAnchor, setPendingToolAnchor] = useState<ToolAnchor | null>(null);
  const [highlightToolAnchor, setHighlightToolAnchor] = useState<ToolAnchor | null>(null);
  const [pendingChecklistId, setPendingChecklistId]   = useState<string | null>(null);

  // ── Notificações state ──────────────────────────────────────────
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadNotifications, setUnreadNotifications]       = useState(0);

  // ── Onboarding state ────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false);

  const scrollByTab = useRef<Partial<Record<AppTab, number>>>({});

  const today = new Date().toISOString().slice(0, 10);
  const urgentCount = getPendenciasAbertas().filter((p) => !!p.dueDate && p.dueDate <= today).length;

  // ── Efeitos de inicialização ────────────────────────────────────
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__amigoDoPredioExport = exportTelemetry;
    const daysSince = recordSessionOpen();
    void trackEvent("session_open", { days_since_last: daysSince });
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) {
      const m = getMemoriaOperacional();
      const prof = getProfile();
      setProfileCompletion(computeProfileCompletion(prof, m));
      setCondoName(prof?.nomeCondominio ?? "");
    }
    try { if (sessionStorage.getItem("amigo_demo_active") === "1") setIsDemo(true); } catch { /* noop */ }
    const lastBackup = getLastBackupAt();
    const backupStale = !lastBackup || (Date.now() - new Date(lastBackup).getTime()) > 30 * 86400000;
    if (hasData && backupStale) setShowBackupNudge(true);
    if (isFirstRun()) setShowOnboarding(true);
    const stopScheduler = startScheduler();
    setUnreadNotifications(getUnreadCount());
    const stopSession = startSessionTimer();
    void flushPendingSync();
    const stopOnline = startOnlineListener();
    return () => { stopScheduler(); stopSession(); stopOnline(); };
  }, []);

  useEffect(() => {
    const hasData = hasMemoriaOperacional() || hasProfile();
    setHasCondominioData(hasData);
    if (hasData) {
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

  // Restaura posição de scroll ao trocar de tab
  useEffect(() => {
    if (typeof window === "undefined") return;
    const y = scrollByTab.current[activeTab] ?? 0;
    window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
  }, [activeTab]);

  // Scroll para ferramenta específica após navegação
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
    const second = window.setTimeout(() => { scrollToAnchor(); setPendingToolAnchor(null); }, 260);
    return () => { window.clearTimeout(first); window.clearTimeout(second); };
  }, [activeTab, pendingToolAnchor]);

  useEffect(() => {
    if (activeTab !== "ferramentas") setActiveToolGroup(null);
  }, [activeTab]);

  // Scroll para revisão mensal após navegação para aba condomínio
  useEffect(() => {
    if (activeTab !== "condominio" || !focusRevisaoMensal) return;
    const scrollToRevisao = () => {
      const el = document.getElementById("revisao-mensal");
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    };
    const first = window.setTimeout(scrollToRevisao, 120);
    const second = window.setTimeout(() => { scrollToRevisao(); setFocusRevisaoMensal(false); }, 320);
    return () => { window.clearTimeout(first); window.clearTimeout(second); };
  }, [activeTab, focusRevisaoMensal]);

  // ── Handlers de navegação ───────────────────────────────────────
  const navigateTab = (tab: AppTab) => {
    if (typeof window !== "undefined") scrollByTab.current[activeTab] = window.scrollY;
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

  // ── Handlers do assistente ──────────────────────────────────────
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

  const handleAsk         = () => executeAsk(question.trim());
  const handleRetry       = () => executeAsk(submittedQuestion);
  const handleBack        = () => { setQuestion(submittedQuestion); setSubmittedQuestion(""); setAnswerResult(null); };
  const handleNewQuestion = () => { setQuestion(""); setSubmittedQuestion(""); setAnswerResult(null); };

  const handleSuggestionSelect = (q: string) => {
    navigateTab("assistente");
    setQuestion(q);
    executeAsk(q);
  };

  const handleTopicSelect = (topic: Topic) => {
    setQuestion(topic.examplePrompt);
    setTimeout(() => {
      const el = document.getElementById("ask-question") as HTMLTextAreaElement;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }, 50);
  };

  const handleSavePendencia = (titulo: string, categoria: string, matchedId: string) => {
    addPendencia({ titulo, categoria, origem: "response", matchedId });
    void trackEvent("pendencia_created_from_response", { categoria, matched_id: matchedId });
    setRefreshKey((k) => k + 1);
  };

  // ── Handlers de ferramentas ─────────────────────────────────────
  const handleNavigateToChecklist = (checklistId: string) => {
    setPendingChecklistId(checklistId);
    setPendingToolAnchor("checklists");
    navigateTab("ferramentas");
  };

  const handleNavigateToFerramentas = (anchor: ToolAnchor = "comunicado") => {
    setPendingToolAnchor(anchor);
    navigateTab("ferramentas");
  };

  // ── Handlers do condomínio ──────────────────────────────────────
  const handleSetupMemoria = () => setShouldExpandMemoria(true);

  const handleOpenRevisaoMensal = () => { setFocusRevisaoMensal(true); navigateTab("condominio"); };
  const handleOpenMonthlyReview = () => { setFocusRevisaoMensal(true); navigateTab("condominio"); };

  // ── Handlers de demo ────────────────────────────────────────────
  const handleActivateDemo = async () => {
    const { activateDemo } = await import("@/lib/demo");
    activateDemo();
    window.location.reload();
  };

  const handleExitDemo = async () => {
    const { deactivateDemo } = await import("@/lib/demo");
    deactivateDemo();
    window.location.reload();
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="grain-bg flex min-h-dvh max-w-[100vw] flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#F7F1E8_0,#FBF8F2_42%,#F4ECDF_100%)]">
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]">

        {isDemo && <DemoModeBanner onExit={handleExitDemo} />}

        {!(activeTab === "inicio" && subView) && (
          <Header
            refreshKey={refreshKey}
            activeTab={activeTab}
            unreadNotifications={unreadNotifications}
            onNotificationsClick={() => setShowNotificationCenter(true)}
          />
        )}

        {activeTab === "inicio" && (
          <HomeTab
            refreshKey={refreshKey}
            hasCondominioData={hasCondominioData}
            condoName={condoName}
            profileCompletion={profileCompletion}
            urgentCount={urgentCount}
            subView={subView}
            showBackupNudge={showBackupNudge}
            isDemo={isDemo}
            onNavigateTab={navigateTab}
            onNavigateToSubView={navigateToSubView}
            onBackFromSubView={backFromSubView}
            onOpenMonthlyReview={handleOpenMonthlyReview}
            onOpenNotifications={() => setShowNotificationCenter(true)}
            onHideBackupNudge={() => setShowBackupNudge(false)}
            onSuggestionSelect={handleSuggestionSelect}
            onActivateDemo={handleActivateDemo}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {activeTab === "agenda" && (
          <AgendaTab
            refreshKey={refreshKey}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {activeTab === "assistente" && (
          <AssistantTab
            question={question}
            submittedQuestion={submittedQuestion}
            answerResult={answerResult}
            isLoading={isLoading}
            refreshKey={refreshKey}
            onQuestionChange={setQuestion}
            onAsk={handleAsk}
            onBack={handleBack}
            onRetry={handleRetry}
            onNewQuestion={handleNewQuestion}
            onTopicSelect={handleTopicSelect}
            onSuggestionSelect={handleSuggestionSelect}
            onSavePendencia={handleSavePendencia}
            onNavigateToChecklist={handleNavigateToChecklist}
            onNavigateToFerramentas={handleNavigateToFerramentas}
            onFavorite={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {activeTab === "ferramentas" && (
          <ToolsTab
            refreshKey={refreshKey}
            activeToolGroup={activeToolGroup}
            pendingToolAnchor={pendingToolAnchor}
            highlightToolAnchor={highlightToolAnchor}
            pendingChecklistId={pendingChecklistId}
            onSetActiveToolGroup={setActiveToolGroup}
            onSuggestionSelect={handleSuggestionSelect}
            onNavigateTab={navigateTab}
            onNavigateToSubView={navigateToSubView}
            onChecklistConsumed={() => setPendingChecklistId(null)}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {activeTab === "condominio" && (
          <CondominioTab
            refreshKey={refreshKey}
            hasCondominioData={hasCondominioData}
            condoName={condoName}
            shouldExpandMemoria={shouldExpandMemoria}
            showNotifSettings={showNotifSettings}
            onRefresh={() => setRefreshKey((k) => k + 1)}
            onMemoriaSaved={() => { setRefreshKey((k) => k + 1); setShouldExpandMemoria(false); }}
            onSetupMemoria={handleSetupMemoria}
            onOpenMonthlyReview={handleOpenMonthlyReview}
            onNavigateTab={navigateTab}
            onToggleNotifSettings={() => setShowNotifSettings((v) => !v)}
          />
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
            setUnreadNotifications(0);
          }}
          onAction={(actionKey) => {
            setShowNotificationCenter(false);
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
