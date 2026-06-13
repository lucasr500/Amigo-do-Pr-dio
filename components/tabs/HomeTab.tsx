"use client";

import dynamic from "next/dynamic";
import GuidancePanel from "@/components/GuidancePanel";
import GuidancePreview from "@/components/GuidancePreview";
import type { AppTab } from "@/components/BottomNav";
import type { CentralSectionId } from "@/lib/visibility-guards";
import { trackEvent } from "@/lib/telemetry";

const SaudeScreen = dynamic(() => import("@/components/SaudeScreen"), { ssr: false });
const PendenciasScreen = dynamic(() => import("@/components/PendenciasScreen"), { ssr: false });
const ProgressiveSetupCard = dynamic(() => import("@/components/ProgressiveSetupCard"), { ssr: false });
const DailyBriefingCard = dynamic(() => import("@/components/DailyBriefingCard"), { ssr: false });
const RecentActivityCard = dynamic(() => import("@/components/RecentActivityCard"), { ssr: false });
const MonthlyReviewCard = dynamic(() => import("@/components/MonthlyReviewCard"), { ssr: false });
const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });
const MilestoneCelebration = dynamic(() => import("@/components/MilestoneCelebration"), { ssr: false });
const WeeklyReviewPrompt = dynamic(() => import("@/components/WeeklyReviewPrompt"), { ssr: false });
const InstitutionalMemoryCard = dynamic(() => import("@/components/InstitutionalMemoryCard"), { ssr: false });
const ManagerCockpitHero = dynamic(() => import("@/components/ManagerCockpitHero"), { ssr: false });
const MonthlyPlanCard = dynamic(() => import("@/components/MonthlyPlanCard"), { ssr: false });
const RiskPreviewStrip = dynamic(() => import("@/components/RiskPreviewStrip"), { ssr: false });

function HomeSectionLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="px-5 pb-2 pt-1 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">{eyebrow}</p>
      <h2 className="mt-0.5 font-display text-[20px] font-semibold text-navy-900">{title}</h2>
    </div>
  );
}

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
  onNavigateToSection?: (sectionId: string, centralSection?: CentralSectionId) => void;
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
  onHideBackupNudge,
  onSuggestionSelect,
  onActivateDemo,
  onRefresh,
  onOpenBackup,
  onNavigateToSection,
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

          {/* Feed do cockpit. Em telas largas (lg+) flui em 2 colunas balanceadas,
              preservando a ordem de origem (mobile permanece coluna única idêntica).
              Cada seção fica em break-inside-avoid para nunca partir entre colunas. */}
          <div className="lg:columns-2 lg:gap-x-4">
            <div className="break-inside-avoid">
              <HomeSectionLabel eyebrow="Primeiros minutos" title="Hoje" />
              <DailyBriefingCard refreshKey={refreshKey} />
              <RecentActivityCard refreshKey={refreshKey} />
            </div>

            <div className="break-inside-avoid">
              <HomeSectionLabel eyebrow="Guidance" title="Ações recomendadas" />
              <GuidancePanel
                onAsk={onSuggestionSelect}
                onResolved={onRefresh}
                onPendenciaSaved={onRefresh}
                refreshKey={refreshKey}
              />
            </div>

            <div className="break-inside-avoid">
              <MonthlyPlanCard
                refreshKey={refreshKey}
                onNavigateTab={onNavigateTab}
                onNavigateToSubView={onNavigateToSubView}
                onNavigateToSection={onNavigateToSection}
                onOpenMonthlyReview={onOpenMonthlyReview}
              />
            </div>

            <div className="break-inside-avoid">
              <MilestoneCelebration refreshKey={refreshKey} onDismiss={onRefresh} />
            </div>

            <div className="break-inside-avoid">
              <MonthlyReviewCard
                refreshKey={refreshKey}
                onOpen={onOpenMonthlyReview}
              />
            </div>

            {showBackupNudge && !isDemo && (
              <div className="break-inside-avoid px-5 pb-3 sm:px-6">
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

            <div className="break-inside-avoid">
              <HomeSectionLabel eyebrow="Diferencial" title="Memória institucional" />
              <InstitutionalMemoryCard
                refreshKey={refreshKey}
                onNavigateTab={onNavigateTab}
                onNavigateToSection={onNavigateToSection}
              />
            </div>

            <div className="break-inside-avoid">
              <WeeklyReviewPrompt refreshKey={refreshKey} onComplete={onRefresh} />
            </div>

            <div className="break-inside-avoid">
              <ProgressiveSetupCard
                refreshKey={refreshKey}
                onNavigate={(target) => {
                  void trackEvent("profile_completion_cta_tap", {
                    completion_bucket: completionBucket(profileCompletion),
                  });
                  onNavigateTab(target);
                }}
              />
            </div>
          </div>
        </>
      )}

      {!subView && !hasCondominioData && (
        <>
          <Hero
            onSetup={() => onNavigateTab("condominio")}
            onDemo={onActivateDemo}
            onAssistente={() => onSuggestionSelect("O que o síndico precisa monitorar no condomínio?")}
            onSuggestionSelect={onSuggestionSelect}
          />
          <RiskPreviewStrip onAssistente={onSuggestionSelect} />
          <GuidancePreview onSetup={() => onNavigateTab("condominio")} onAssistente={() => onNavigateTab("assistente")} />
        </>
      )}
    </div>
  );
}
