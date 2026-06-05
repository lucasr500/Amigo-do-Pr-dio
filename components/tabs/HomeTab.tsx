"use client";

import dynamic from "next/dynamic";
import GuidancePanel from "@/components/GuidancePanel";
import GuidancePreview from "@/components/GuidancePreview";
import type { AppTab } from "@/components/BottomNav";
import { trackEvent } from "@/lib/telemetry";

const SaudeScreen        = dynamic(() => import("@/components/SaudeScreen"), { ssr: false });
const PendenciasScreen   = dynamic(() => import("@/components/PendenciasScreen"), { ssr: false });
const ProgressiveSetupCard = dynamic(() => import("@/components/ProgressiveSetupCard"), { ssr: false });
const DynamicGreeting    = dynamic(() => import("@/components/DynamicGreeting"), { ssr: false });
const HomeSaudeCard      = dynamic(() => import("@/components/HomeSaudeCard"), { ssr: false });
const HomeAgendaCard     = dynamic(() => import("@/components/HomeAgendaCard"), { ssr: false });
const HomePriorityStrip  = dynamic(() => import("@/components/HomePriorityStrip"), { ssr: false });
const RiskPreviewStrip   = dynamic(() => import("@/components/RiskPreviewStrip"), { ssr: false });
const PushPromptStrip    = dynamic(() => import("@/components/PushPromptStrip"), { ssr: false });
const MonthlyReviewCard  = dynamic(() => import("@/components/MonthlyReviewCard"), { ssr: false });
const Hero               = dynamic(() => import("@/components/Hero"), { ssr: false });

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
}: Props) {
  return (
    <div key="inicio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

      {/* Sub-view: Saúde Operacional */}
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

      {/* Sub-view: Pendências */}
      {subView === "pendencias" && (
        <PendenciasScreen
          refreshKey={refreshKey}
          onBack={onBackFromSubView}
        />
      )}

      {/* Conteúdo normal da Home — com dados */}
      {!subView && hasCondominioData && (
        <>
          <DynamicGreeting condoName={condoName} />
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
          <MonthlyReviewCard
            refreshKey={refreshKey}
            onOpen={onOpenMonthlyReview}
          />
          <HomeAgendaCard
            refreshKey={refreshKey}
            onNavigate={() => onNavigateTab("agenda")}
          />
          <HomeSaudeCard
            refreshKey={refreshKey}
            onClick={() => onNavigateToSubView("saude")}
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
          {urgentCount > 0 && (
            <div className="px-5 pb-3 sm:px-6">
              <button
                type="button"
                onClick={() => onNavigateToSubView("pendencias")}
                className="flex w-full items-center gap-3 rounded-[14px] border border-terracotta-200 bg-terracotta-50 px-4 py-3 shadow-sm transition-all hover:bg-terracotta-100 active:scale-[0.98]"
              >
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-[14px]"
                  aria-hidden="true"
                >
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
          {showBackupNudge && !isDemo && (
            <div className="px-5 pb-3 sm:px-6">
              <div className="flex items-center gap-3 rounded-[14px] border border-amber-200/80 bg-amber-50/70 px-4 py-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100" aria-hidden="true">
                  <svg className="h-3.5 w-3.5 text-amber-700" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v7M8 9L5.5 6.5M8 9l2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 11.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <p className="min-w-0 flex-1 text-[12px] leading-snug text-amber-800">
                  Faça um backup para proteger os dados do prédio.
                </p>
                <button
                  type="button"
                  onClick={() => { onHideBackupNudge(); onNavigateTab("condominio"); }}
                  className="flex-shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-200 active:scale-95"
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
        </>
      )}

      {/* Conteúdo da Home — sem dados (onboarding/guest) */}
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
              className="flex w-full items-center gap-3 rounded-[16px] border border-amber-200/70 bg-amber-50/60 px-4 py-3.5 text-left transition-all hover:border-amber-300 hover:bg-amber-50 active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[10px] font-bold tracking-[0.08em] text-amber-800" aria-hidden="true">DEMO</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy-800">Ver alertas de um prédio real em risco</p>
                <p className="mt-0.5 text-[11.5px] text-navy-500">Exemplo com AVCB vencido, seguro próximo e pendências ativas</p>
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
