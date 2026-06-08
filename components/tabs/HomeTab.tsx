"use client";

import dynamic from "next/dynamic";
import GuidancePanel from "@/components/GuidancePanel";
import GuidancePreview from "@/components/GuidancePreview";
import type { AppTab } from "@/components/BottomNav";
import { trackEvent } from "@/lib/telemetry";

const SaudeScreen = dynamic(() => import("@/components/SaudeScreen"), { ssr: false });
const PendenciasScreen = dynamic(() => import("@/components/PendenciasScreen"), { ssr: false });
const ProgressiveSetupCard = dynamic(() => import("@/components/ProgressiveSetupCard"), { ssr: false });
const DynamicGreeting = dynamic(() => import("@/components/DynamicGreeting"), { ssr: false });
const HomeSaudeCard = dynamic(() => import("@/components/HomeSaudeCard"), { ssr: false });
const HomeAgendaCard = dynamic(() => import("@/components/HomeAgendaCard"), { ssr: false });
const HomePriorityStrip = dynamic(() => import("@/components/HomePriorityStrip"), { ssr: false });
const RiskPreviewStrip = dynamic(() => import("@/components/RiskPreviewStrip"), { ssr: false });
const PushPromptStrip = dynamic(() => import("@/components/PushPromptStrip"), { ssr: false });
const MonthlyReviewCard = dynamic(() => import("@/components/MonthlyReviewCard"), { ssr: false });
const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });
const MilestoneCelebration = dynamic(() => import("@/components/MilestoneCelebration"), { ssr: false });
const WeeklyReviewPrompt = dynamic(() => import("@/components/WeeklyReviewPrompt"), { ssr: false });
const DailyBriefingCard = dynamic(() => import("@/components/DailyBriefingCard"), { ssr: false });
const RecentActivityCard = dynamic(() => import("@/components/RecentActivityCard"), { ssr: false });
const HomeFeatureShortcuts = dynamic(() => import("@/components/HomeFeatureShortcuts"), { ssr: false });
const HealthScoreProgressCard = dynamic(() => import("@/components/HealthScoreProgressCard"), { ssr: false });
const InstitutionalMemoryCard = dynamic(() => import("@/components/InstitutionalMemoryCard"), { ssr: false });
const ManagerCockpitHero = dynamic(() => import("@/components/ManagerCockpitHero"), { ssr: false });

function completionBucket(pct: number): string {
  if (pct <= 25) return "0-25";
  if (pct <= 50) return "26-50";
  if (pct <= 75) return "51-75";
  return "76-99";
}

type Props = {
  refreshKey: number;
  hasCondominioData: boolean;
  condoName: string;
  profileCompletion: number;
  urgentCount: number;
  subView: "saude" | "pendencias" | null;
  showBackupNudge: boolean;
  isDemo: boolean;
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSubView: (view: "saude" | "pendencias") => void;
  onBackFromSubView: () => void;
  onOpenMonthlyReview: () => void;
  onOpenNotifications: () => void;
  onHideBackupNudge: () => void;
  onSuggestionSelect: (q: string) => void;
  onActivateDemo: () => void;
  onRefresh: () => void;
  onOpenBackup?: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  onSetToolGroup?: (group: string) => void;
};

export default function HomeTab({
  refreshKey,
  hasCondominioData,
  condoName,
  profileCompletion,
  urgentCount,
  subView,
  showBackupNudge,
  isDemo,
  onNavigateTab,
  onNavigateToSubView,
  onBackFromSubView,
  onOpenMonthlyReview,
  onOpenNotifications,
  onHideBackupNudge,
  onSuggestionSelect,
  onActivateDemo,
  onRefresh,
  onOpenBackup,
  onNavigateToSection,
  onSetToolGroup,
}: Props) {
  return (
    <div key="inicio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      {subView === "saude" && (
        <SaudeScreen
          refreshKey={refreshKey}
          onBack={onBackFromSubView}
          onNavigateToTimeline={() => { onBackFromSubView(); onNavigateTab("condominio"); }}
          onGoToCondominio={() => { onBackFromSubView(); onNavigateTab("condominio"); }}
          onGoToPendencias={() => onNavigateToSubView("pendencias")}
          onGoToAgenda={() => onNavigateTab("agenda")}
          onGoToRevisao={onOpenMonthlyReview}
          onAskQuestion={(q) => { onBackFromSubView(); onSuggestionSelect(q); }}
        />
      )}

      {subView === "pendencias" && (
        <PendenciasScreen
          refreshKey={refreshKey}
          onBack={onBackFromSubView}
        />
      )}

      {!subView && hasCondominioData && (
        <>
          <ManagerCockpitHero
            refreshKey={refreshKey}
            condoName={condoName}
            urgentCount={urgentCount}
            onNavigateTab={onNavigateTab}
            onNavigateToSubView={onNavigateToSubView}
            onNavigateToSection={onNavigateToSection}
          />
          <DynamicGreeting condoName={condoName} />
          <DailyBriefingCard refreshKey={refreshKey} />
          <RecentActivityCard refreshKey={refreshKey} />
          <HomePriorityStrip
            refreshKey={refreshKey}
            onNavigate={(target) => {
              if (target === "pendencias") onNavigateToSubView("pendencias");
              else if (target === "condominio") onNavigateTab("condominio");
              else if (target === "ferramentas") onNavigateTab("ferramentas");
              else if (target === "agenda") onNavigateTab("agenda");
            }}
            onOpenNotifications={onOpenNotifications}
          />

          <MilestoneCelebration refreshKey={refreshKey} onDismiss={onRefresh} />

          {urgentCount > 0 && (
            <div className="px-5 pb-3 sm:px-6">
              <button
                type="button"
                onClick={() => onNavigateToSubView("pendencias")}
                className="flex w-full items-center gap-3 rounded-lg border border-terracotta-200/80 bg-terracotta-50/70 px-4 py-3 shadow-card transition-all hover:bg-terracotta-50 active:scale-[0.99]"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.72]" aria-hidden="true">
                  <svg className="h-4 w-4 text-terracotta-700" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v5M8 10v1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M7.15 1.5L1.5 11.5a1 1 0 00.85 1.5h11.3a1 1 0 00.85-1.5L8.85 1.5a1 1 0 00-1.7 0z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[13px] font-semibold text-terracotta-800">
                    Precisa de atenção
                  </p>
                  <p className="text-[11.5px] text-terracotta-700">
                    {urgentCount === 1 ? "1 pendência já passou do prazo." : `${urgentCount} pendências já passaram do prazo.`}
                  </p>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-terracotta-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          <MonthlyReviewCard
            refreshKey={refreshKey}
            onOpen={onOpenMonthlyReview}
          />
          <WeeklyReviewPrompt refreshKey={refreshKey} onComplete={onRefresh} />
          <HomeAgendaCard
            refreshKey={refreshKey}
            onNavigate={() => onNavigateTab("agenda")}
          />
          <HomeSaudeCard
            refreshKey={refreshKey}
            onClick={() => onNavigateToSubView("saude")}
          />
          <HealthScoreProgressCard refreshKey={refreshKey} />

          {showBackupNudge && !isDemo && (
            <div className="px-5 pb-3 sm:px-6">
              <div className="flex items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 shadow-card">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.70]" aria-hidden="true">
                  <svg className="h-3.5 w-3.5 text-amber-700" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v7M8 9L5.5 6.5M8 9l2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 11.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <p className="min-w-0 flex-1 text-[12px] leading-snug text-amber-900">
                  Backup recomendado para manter os dados do prédio protegidos.
                </p>
                <button
                  type="button"
                  onClick={() => { onHideBackupNudge(); if (onOpenBackup) { onOpenBackup(); } else { onNavigateTab("condominio"); } }}
                  className="flex-shrink-0 rounded-full bg-white/[0.80] px-3 py-1 text-[11px] font-semibold text-amber-900 hover:bg-white active:scale-95"
                >
                  Exportar
                </button>
              </div>
            </div>
          )}

          <GuidancePanel
            onAsk={onSuggestionSelect}
            onResolved={onRefresh}
            onPendenciaSaved={onRefresh}
            refreshKey={refreshKey}
          />

          <InstitutionalMemoryCard
            refreshKey={refreshKey}
            onNavigateTab={onNavigateTab}
            onNavigateToSection={onNavigateToSection}
          />

          <HomeFeatureShortcuts
            onNavigateTab={onNavigateTab}
            onNavigateToSection={onNavigateToSection}
            onOpenMonthlyReview={onOpenMonthlyReview}
            onSetToolGroup={onSetToolGroup}
          />

          <ProgressiveSetupCard
            refreshKey={refreshKey}
            onNavigate={(target) => {
              void trackEvent("profile_completion_cta_tap", {
                completion_bucket: completionBucket(profileCompletion),
              });
              onNavigateTab(target);
            }}
          />
          <PushPromptStrip />
        </>
      )}

      {!subView && !hasCondominioData && (
        <>
          <Hero
            onSetup={() => onNavigateTab("condominio")}
            onAssistente={() => onSuggestionSelect("O que o síndico precisa monitorar no condomínio?")}
            onSuggestionSelect={onSuggestionSelect}
          />
          <RiskPreviewStrip onAssistente={onSuggestionSelect} />
          <div className="px-5 pb-3 sm:px-6">
            <button
              type="button"
              onClick={onActivateDemo}
              className="flex w-full items-center gap-3 rounded-lg border border-navy-100/80 bg-white/[0.78] px-4 py-3.5 text-left shadow-card transition-all hover:bg-white active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50 text-[10px] font-bold tracking-[0.08em] text-navy-700" aria-hidden="true">DEMO</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy-800">Ver uma rotina preenchida</p>
                <p className="mt-0.5 text-[11.5px] text-navy-500">Exemplo com vencimentos, documentos e pendências já organizados.</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <GuidancePreview onSetup={() => onNavigateTab("condominio")} onAssistente={() => onNavigateTab("assistente")} />
        </>
      )}
    </div>
  );
}
