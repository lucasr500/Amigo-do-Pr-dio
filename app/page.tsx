"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import BottomNav, { AppTab } from "@/components/BottomNav";
import RoleGateway from "@/components/RoleGateway";
import HomeTab from "@/components/tabs/HomeTab";
import AgendaTab from "@/components/tabs/AgendaTab";
import AssistantTab, { type AssistantTabHandle } from "@/components/tabs/AssistantTab";
import ToolsTab from "@/components/tabs/ToolsTab";
import ResidentHomeTab from "@/components/ResidentHomeTab";
import TabErrorBoundary from "@/components/TabErrorBoundary";
import type { ToolAnchor, ToolGroup } from "@/lib/app-navigation";
import { ANCHOR_TO_GROUP } from "@/lib/app-navigation";
import type { CentralSectionId } from "@/lib/visibility-guards";
import { clearActiveProfile, readActiveProfile, saveActiveProfile, type ActiveProfile } from "@/lib/profile-mode";
import {
  exportTelemetry,
  recordSessionOpen,
  hasMemoriaOperacional,
  hasProfile,
  addPendencia,
  getPendenciasAbertas,
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
import { pullRemoteDecisions } from "@/lib/tenant/decisionsSync";
import { pullRemotePosts } from "@/lib/tenant/communityPostsSync";

const MemoriaTab         = dynamic(() => import("@/components/tabs/MemoriaTab"), { ssr: false });
const CommunidadeTab     = dynamic(() => import("@/components/tabs/CommunidadeTab"), { ssr: false });
const AjustesTab         = dynamic(() => import("@/components/tabs/AjustesTab"), { ssr: false });
const NotificationCenter = dynamic(() => import("@/components/NotificationCenter"), { ssr: false });
const DemoModeBanner     = dynamic(() => import("@/components/DemoModeBanner"), { ssr: false });
const OnboardingFlow     = dynamic(() => import("@/components/onboarding/OnboardingFlow"), { ssr: false });
const GlobalSearch       = dynamic(() => import("@/components/GlobalSearch"), { ssr: false });

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
  // ── AssistantTab ref (estado movido para o componente) ──────────
  const assistantRef = useRef<AssistantTabHandle>(null);

  // ── App-wide state ──────────────────────────────────────────────
  const [refreshKey, setRefreshKey]         = useState(0);
  const [hasCondominioData, setHasCondominioData] = useState(false);
  const [activeTab, setActiveTab]           = useState<AppTab>("inicio");
  const [subView, setSubView]               = useState<"saude" | "pendencias" | null>(null);
  const [condoName, setCondoName]           = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isDemo, setIsDemo]                 = useState(false);
  const [showBackupNudge, setShowBackupNudge] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);

  // ── Condomínio state ────────────────────────────────────────────
  const [shouldExpandMemoria, setShouldExpandMemoria] = useState(false);
  const [showNotifSettings, setShowNotifSettings]     = useState(false);
  const [shouldOpenBackup, setShouldOpenBackup]       = useState(false);
  const [pendingAjustesSection, setPendingAjustesSection] = useState<string | null>(null);
  const [pendingCentralSection, setPendingCentralSection] = useState<string | null>(null);

  // ── Search state ─────────────────────────────────────────────────
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // ── Memória deep-link (ex.: card do Início → Assembleias) ───────
  const [pendingMemoriaSection, setPendingMemoriaSection] = useState<string | null>(null);

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
    const storedProfile = readActiveProfile();
    setActiveProfile(storedProfile);
    setProfileReady(true);
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
    const stopScheduler = startScheduler();
    setUnreadNotifications(getUnreadCount());
    const stopSession = startSessionTimer();
    void flushPendingSync();
    // Cutover de LEITURA de Decisões (D2): mesmo gatilho do sync de snapshot — boot
    // autenticado e reconexão. NO-OP total com decisions_remote_enabled off / anônimo /
    // sem condomínio: store local intocado, UI segue em getDecisions(). Best-effort.
    void pullRemoteDecisions();
    void pullRemotePosts(); // cutover de leitura do Mural (009): no-op com mural_remote_enabled off
    const pullRelationalOnOnline = () => { void pullRemoteDecisions(); void pullRemotePosts(); };
    window.addEventListener("online", pullRelationalOnOnline);
    const stopOnline = startOnlineListener();
    return () => {
      stopScheduler();
      stopSession();
      stopOnline();
      window.removeEventListener("online", pullRelationalOnOnline);
    };
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

  // Scroll para seção específica dentro de Ajustes (dados/operacao/implantacao)
  useEffect(() => {
    if (activeTab !== "ajustes" || !pendingAjustesSection) return;
    const section = pendingAjustesSection;
    const scrollToSection = () => {
      const el = document.getElementById(section);
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    };
    const first = window.setTimeout(scrollToSection, 140);
    const second = window.setTimeout(() => { scrollToSection(); setPendingAjustesSection(null); }, 340);
    return () => { window.clearTimeout(first); window.clearTimeout(second); };
  }, [activeTab, pendingAjustesSection]);

  // ── Handlers de navegação ───────────────────────────────────────
  const navigateTab = (tab: AppTab) => {
    if (typeof window !== "undefined") scrollByTab.current[activeTab] = window.scrollY;
    setSubView(null);
    setActiveTab(tab);
  };

  const handleSelectProfile = (profile: ActiveProfile) => {
    saveActiveProfile(profile);
    setActiveProfile(profile);
    setActiveTab("inicio");
    setSubView(null);
  };

  const handleSwitchProfile = () => {
    clearActiveProfile();
    setActiveProfile(null);
    setActiveTab("inicio");
    setSubView(null);
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
  // ── Handlers do assistente — state vive em AssistantTab ────────
  const handleSuggestionSelect = (q: string) => {
    navigateTab("assistente");
    // Executa query via ref após navegação (pequeno delay para montar o componente)
    setTimeout(() => assistantRef.current?.executeQuery(q), 50);
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

  // Revisão detalhada vive na Transparência (Comunidade), como camada de gestão.
  const handleOpenRevisaoMensal = () => { setPendingCentralSection("transparencia"); navigateTab("comunidade"); };
  const handleOpenMonthlyReview = () => { setPendingCentralSection("transparencia"); navigateTab("comunidade"); };

  // Rerota central dos deep-links antigos do "Mais" (W7) para as novas abas.
  const handleNavigateToSection = (sectionId: string, centralSection?: CentralSectionId) => {
    switch (sectionId) {
      case "central-digital":
        setPendingCentralSection(centralSection ?? "mural");
        navigateTab("comunidade");
        return;
      case "revisao-mensal":
      case "financeiro":
        setPendingCentralSection("transparencia");
        navigateTab("comunidade");
        return;
      case "memoria-institucional":
        setPendingMemoriaSection(null);
        navigateTab("memoria");
        return;
      case "documentos":
        setPendingMemoriaSection("documentos");
        navigateTab("memoria");
        return;
      case "dados":
      case "operacao":
      case "implantacao":
        setPendingAjustesSection(sectionId === "dados" ? "dados" : sectionId);
        navigateTab("ajustes");
        return;
      default:
        navigateTab("memoria");
    }
  };

  const handleSetToolGroup = (group: string) => {
    setActiveToolGroup(group as ToolGroup);
    navigateTab("ferramentas");
  };

  const handleOpenMemoria = (section?: string) => {
    setPendingMemoriaSection(section ?? null);
    navigateTab("memoria");
  };

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
  if (!profileReady) return null;

  if (!activeProfile) {
    return <RoleGateway onSelectProfile={handleSelectProfile} />;
  }

  // Cockpit do síndico ganha respiro em telas largas (desktop); demais visões
  // mantêm a coluna de leitura de 760px. Mobile não é afetado (mx-auto + w-full).
  const wideCockpit = activeProfile === "manager" && activeTab === "inicio" && !subView;

  return (
    <div className="grain-bg flex min-h-dvh max-w-[100vw] flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#F7F1E8_0,#FBF8F2_42%,#F4ECDF_100%)]">
      <div className={`relative z-10 mx-auto flex w-full flex-1 flex-col overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] ${wideCockpit ? "max-w-[1080px]" : "max-w-[760px]"}`}>

        {isDemo && <DemoModeBanner onExit={handleExitDemo} />}

        {!(activeTab === "inicio" && subView) && !(activeProfile === "resident" && activeTab === "inicio") && (
          <Header
            refreshKey={refreshKey}
            activeTab={activeTab}
            unreadNotifications={unreadNotifications}
            profile={activeProfile}
            onNotificationsClick={() => setShowNotificationCenter(true)}
            onSearchOpen={() => setShowGlobalSearch(true)}
            onProfileSwitch={handleSwitchProfile}
          />
        )}

        {activeTab === "inicio" && activeProfile === "resident" && (
          <ResidentHomeTab
            refreshKey={refreshKey}
            condoName={condoName}
            onNavigateTab={navigateTab}
            onNavigateToSection={handleNavigateToSection}
            onSwitchProfile={handleSwitchProfile}
          />
        )}

        {activeTab === "inicio" && activeProfile === "manager" && (
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
            onOpenBackup={() => { setPendingAjustesSection("dados"); navigateTab("ajustes"); setShouldOpenBackup(true); }}
            onNavigateToSection={handleNavigateToSection}
            onSetToolGroup={handleSetToolGroup}
            onOpenAssembleias={() => handleOpenMemoria("assembleias")}
          />
        )}

        {activeTab === "memoria" && activeProfile === "manager" && (
          <TabErrorBoundary tabName="Memória">
            <MemoriaTab
              refreshKey={refreshKey}
              onRefresh={() => setRefreshKey((k) => k + 1)}
              focusedSection={pendingMemoriaSection}
              onFocusConsumed={() => setPendingMemoriaSection(null)}
            />
          </TabErrorBoundary>
        )}

        {activeTab === "agenda" && (
          <TabErrorBoundary tabName="Agenda">
            <AgendaTab
              refreshKey={refreshKey}
              onSaved={() => setRefreshKey((k) => k + 1)}
            />
          </TabErrorBoundary>
        )}

        {activeTab === "assistente" && (
          <TabErrorBoundary tabName="Assistente">
            <AssistantTab
              ref={assistantRef}
              refreshKey={refreshKey}
              onSavePendencia={handleSavePendencia}
              onQueryExecuted={() => setRefreshKey((k) => k + 1)}
              onNavigateToChecklist={handleNavigateToChecklist}
              onNavigateToFerramentas={handleNavigateToFerramentas}
            />
          </TabErrorBoundary>
        )}

        {activeTab === "ferramentas" && (
          <TabErrorBoundary tabName="Ferramentas">
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
          </TabErrorBoundary>
        )}

        {activeTab === "comunidade" && (
          <TabErrorBoundary tabName="Comunidade">
            <CommunidadeTab
              refreshKey={refreshKey}
              condoName={condoName}
              profile={activeProfile}
              focusedCentralSection={pendingCentralSection}
              onRefresh={() => setRefreshKey((k) => k + 1)}
              onOpenMonthlyReview={handleOpenMonthlyReview}
            />
          </TabErrorBoundary>
        )}

        {activeTab === "ajustes" && (
          <TabErrorBoundary tabName="Ajustes">
            <AjustesTab
              refreshKey={refreshKey}
              manager={activeProfile === "manager"}
              hasCondominioData={hasCondominioData}
              showNotifSettings={showNotifSettings}
              shouldOpenBackup={shouldOpenBackup}
              shouldExpandMemoria={shouldExpandMemoria}
              onRefresh={() => setRefreshKey((k) => k + 1)}
              onMemoriaSaved={() => { setRefreshKey((k) => k + 1); setShouldExpandMemoria(false); }}
              onSetupMemoria={handleSetupMemoria}
              onToggleNotifSettings={() => setShowNotifSettings((v) => !v)}
              onBackupOpened={() => setShouldOpenBackup(false)}
              onNavigateTab={navigateTab}
            />
          </TabErrorBoundary>
        )}

      </div>

      <BottomNav
        active={subView === "pendencias" ? "pendencias" : activeTab}
        onChange={(target) => {
          if (activeProfile === "resident" && target === "ferramentas") {
            handleNavigateToSection("central-digital", "canal");
            return;
          }
          // "Pendências" não é uma aba: abre a subView dentro de Início.
          if (target === "pendencias") {
            if (typeof window !== "undefined") scrollByTab.current[activeTab] = window.scrollY;
            setActiveTab("inicio");
            navigateToSubView("pendencias");
            return;
          }
          navigateTab(target);
        }}
        urgentCount={urgentCount}
        profile={activeProfile}
      />

      {showOnboarding && activeProfile === "manager" && (
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
            if (actionKey === "open_memoria") {
              navigateTab("memoria");
            } else if (actionKey === "open_funcionarios") {
              handleNavigateToSection("operacao");
            } else if (actionKey === "open_documentos") {
              handleNavigateToSection("documentos");
            } else if (actionKey === "open_dados") {
              handleNavigateToSection("dados");
              setShouldOpenBackup(true);
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

      {showGlobalSearch && (
        <GlobalSearch
          onNavigateTab={navigateTab}
          onNavigateToSection={handleNavigateToSection}
          onOpenMonthlyReview={handleOpenMonthlyReview}
          onOpenBackup={() => { setPendingAjustesSection("dados"); navigateTab("ajustes"); setShouldOpenBackup(true); }}
          onExpandMemoria={() => setShouldExpandMemoria(true)}
          onSetToolGroup={handleSetToolGroup}
          profileRole={activeProfile}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}
    </div>
  );
}
