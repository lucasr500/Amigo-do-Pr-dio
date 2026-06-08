"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getViewMode, setViewMode } from "@/lib/community-permissions";
import type { CommunityRole } from "@/lib/community-types";
import type { AppTab } from "@/components/BottomNav";
import CondominioSection from "@/components/condominio/CondominioSection";
import CondominioQuickNav from "@/components/condominio/CondominioQuickNav";

const CondominioOverview = dynamic(
  () => import("@/components/condominio/CondominioOverview"),
  { ssr: false },
);

const OnboardingProfile              = dynamic(() => import("@/components/OnboardingProfile"), { ssr: false });
const MemoriaPanel                   = dynamic(() => import("@/components/MemoriaPanel"), { ssr: false });
const ImplantacaoChecklist           = dynamic(() => import("@/components/ImplantacaoChecklist"), { ssr: false });
const MonthlyOperationalSummaryPanel = dynamic(() => import("@/components/MonthlyOperationalSummaryPanel"), { ssr: false });
const MonthlyReviewPanel             = dynamic(() => import("@/components/MonthlyReviewPanel"), { ssr: false });
const MonthlyReviewHistoryPanel      = dynamic(() => import("@/components/MonthlyReviewHistoryPanel"), { ssr: false });
const FinancialPanel                 = dynamic(() => import("@/components/FinancialPanel"), { ssr: false });
const DocumentosEssenciaisPanel      = dynamic(() => import("@/components/DocumentosEssenciaisPanel"), { ssr: false });
const CalendarioOperacionalPanel     = dynamic(() => import("@/components/CalendarioOperacionalPanel"), { ssr: false });
const FuncionariosPanel              = dynamic(() => import("@/components/FuncionariosPanel"), { ssr: false });
const TimelineOperacional            = dynamic(() => import("@/components/TimelineOperacional"), { ssr: false });
const AccountPanel                   = dynamic(() => import("@/components/AccountPanel"), { ssr: false });
const LocalDataIntegrityPanel        = dynamic(() => import("@/components/LocalDataIntegrityPanel"), { ssr: false });
const BackupPanel                    = dynamic(() => import("@/components/BackupPanel"), { ssr: false });
const NotificationSettingsPanel      = dynamic(() => import("@/components/NotificationSettingsPanel"), { ssr: false });
const HealthTrendChart               = dynamic(() => import("@/components/HealthTrendChart"), { ssr: false });
const LocalFirstTrustNote            = dynamic(() => import("@/components/LocalFirstTrustNote"), { ssr: false });
const FinancialIntelligencePanel     = dynamic(() => import("@/components/FinancialIntelligencePanel"), { ssr: false });
const AgoReportPanel                 = dynamic(() => import("@/components/AgoReportPanel"), { ssr: false });
const HandoffPanel                   = dynamic(() => import("@/components/HandoffPanel"), { ssr: false });
const SuppliersPanel                 = dynamic(() => import("@/components/SuppliersPanel"), { ssr: false });
const DecisionsPanel                 = dynamic(() => import("@/components/DecisionsPanel"), { ssr: false });
const UnitHistoryPanel               = dynamic(() => import("@/components/UnitHistoryPanel"), { ssr: false });
const ViewModeSelector               = dynamic(() => import("@/components/community/ViewModeSelector"), { ssr: false });
const FinancialMonthlyChart          = dynamic(() => import("@/components/financial/FinancialMonthlyChart"), { ssr: false });
const MuralPanel                     = dynamic(() => import("@/components/community/MuralPanel"), { ssr: false });
const RequestsPanel                  = dynamic(() => import("@/components/community/RequestsPanel"), { ssr: false });
const PollsPanel                     = dynamic(() => import("@/components/community/PollsPanel"), { ssr: false });
const PublicDocumentsPanel           = dynamic(() => import("@/components/community/PublicDocumentsPanel"), { ssr: false });
const TimelinePanel                  = dynamic(() => import("@/components/community/TimelinePanel"), { ssr: false });
const CommunityReportPanel           = dynamic(() => import("@/components/community/CommunityReportPanel"), { ssr: false });

type Props = {
  refreshKey: number;
  hasCondominioData: boolean;
  condoName: string;
  shouldExpandMemoria: boolean;
  showNotifSettings: boolean;
  shouldOpenBackup?: boolean;
  onRefresh: () => void;
  onMemoriaSaved: () => void;
  onSetupMemoria: () => void;
  onOpenMonthlyReview: () => void;
  onNavigateTab: (tab: AppTab) => void;
  onToggleNotifSettings: () => void;
  onBackupOpened?: () => void;
};

export default function CondominioTab({
  refreshKey,
  hasCondominioData,
  condoName,
  shouldExpandMemoria,
  showNotifSettings,
  shouldOpenBackup,
  onRefresh,
  onMemoriaSaved,
  onSetupMemoria,
  onOpenMonthlyReview,
  onNavigateTab,
  onToggleNotifSettings,
  onBackupOpened,
}: Props) {
  const [communityRole, setCommunityRole] = useState<CommunityRole>("manager");
  useEffect(() => { setCommunityRole(getViewMode()); }, []);

  const handleRoleChange = (role: CommunityRole) => {
    setViewMode(role);
    setCommunityRole(role);
  };

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Quando shouldOpenBackup ativa, rola até a seção de dados
  useEffect(() => {
    if (!shouldOpenBackup) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById("dados");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      onBackupOpened?.();
    }, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldOpenBackup]);

  return (
    <div key="condominio" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

      {/* ── Visão executiva do prédio ──────────────────────────────── */}
      <CondominioOverview
        refreshKey={refreshKey}
        condoName={condoName || undefined}
        onNavigateTab={onNavigateTab}
        onNavigateToSection={scrollToSection}
        onOpenMonthlyReview={onOpenMonthlyReview}
      />

      {/* ── Quick Nav — só com dados ────────────────────────────────── */}
      {hasCondominioData && <CondominioQuickNav />}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1 — Meu prédio (sempre visível)                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <CondominioSection
        id="visao-geral"
        title="Meu prédio"
        subtitle="Perfil, estrutura e vencimentos essenciais."
        eyebrow="Prédio"
        priority="high"
      >
        <OnboardingProfile
          onProfileSaved={onRefresh}
          onSetupMemoria={onSetupMemoria}
          forceShow
        />
        {hasCondominioData && (
          <MemoriaPanel
            onSaved={onMemoriaSaved}
            autoExpand={shouldExpandMemoria}
          />
        )}
      </CondominioSection>

      {/* SEÇÃO 2 — Implantação (recolhível, começa fechada) */}
      {hasCondominioData && (
        <CondominioSection
          id="implantacao"
          title="Implantação"
          subtitle="Progresso de organização e itens pendentes."
          eyebrow="Setup"
          priority="low"
          defaultOpen={false}
        >
          <ImplantacaoChecklist
            onNavigate={(target) => {
              if (target === "condominio") {
                const el = document.getElementById("revisao-mensal");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              } else if (target === "ferramentas") {
                onNavigateTab("ferramentas");
              }
            }}
          />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 3 — Revisão mensal (alta prioridade)                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="revisao-mensal"
          title="Hoje e revisão"
          subtitle="Revisão mensal guiada, resumo operacional copiável e histórico."
          eyebrow="Hoje"
          priority="high"
        >
          <MonthlyReviewPanel
            refreshKey={refreshKey}
            onRefresh={onRefresh}
          />
          <MonthlyOperationalSummaryPanel />
          <MonthlyReviewHistoryPanel
            refreshKey={refreshKey}
            onStartReview={onOpenMonthlyReview}
          />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 4 — Financeiro auxiliar                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="financeiro"
          title="Financeiro"
          subtitle="Caixa, contas, inadimplência e riscos para acompanhamento local."
          eyebrow="Financeiro"
          priority="high"
        >
          <FinancialMonthlyChart refreshKey={refreshKey} />
          <FinancialPanel onSaved={onRefresh} />
          <FinancialIntelligencePanel />
          <AgoReportPanel />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 5 — Documentos essenciais                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="documentos"
          title="Documentos"
          subtitle="Convenção, AVCB, seguro, laudos e contratos em uma base segura."
          eyebrow="Documentos"
          priority="high"
        >
          <DocumentosEssenciaisPanel onSaved={onRefresh} />
          <CalendarioOperacionalPanel refreshKey={refreshKey} />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 6 — Operação e pessoas (recolhível)                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="operacao"
          title="Gestão"
          subtitle="Funcionários, férias, contratos e histórico operacional."
          eyebrow="Gestão"
          priority="normal"
          defaultOpen={false}
        >
          <FuncionariosPanel onSaved={onRefresh} />
          <TimelineOperacional refreshKey={refreshKey} />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 7 — Memória institucional (recolhível)               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="memoria-institucional"
          title="Memória institucional"
          subtitle="Histórico por unidade, fornecedores, decisões e handoff de mandato."
          eyebrow="Inteligência"
          priority="normal"
          defaultOpen={false}
        >
          <UnitHistoryPanel />
          <SuppliersPanel />
          <DecisionsPanel />
          <HandoffPanel />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 8 — Central Digital do Condomínio                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="central-digital"
          title="Preparando a Central Digital"
          subtitle="Estrutura local para organizar mural, solicitações, enquetes e documentos públicos quando houver acesso de moradores."
          eyebrow="Comunidade"
          priority="normal"
          defaultOpen={false}
        >
          <section className="px-5 pb-3 sm:px-6">
            <div className="rounded-2xl border border-navy-100 bg-white/85 px-4 py-3 shadow-[0_1px_3px_rgba(31,49,71,0.03)]">
              <p className="text-[12px] leading-relaxed text-navy-500">
                Nesta versão, estes módulos funcionam como ambiente local de configuração e demonstração da camada institucional. O acesso real de moradores e conselheiros ainda não está ativo.
              </p>
            </div>
          </section>
          <section className="px-5 pb-3 sm:px-6">
            <ViewModeSelector onChange={handleRoleChange} />
          </section>
          <MuralPanel role={communityRole} />
          <RequestsPanel role={communityRole} />
          <PollsPanel role={communityRole} />
          <PublicDocumentsPanel role={communityRole} />
          <TimelinePanel role={communityRole} />
          <CommunityReportPanel role={communityRole} condoName={condoName || "Condomínio"} />
        </CondominioSection>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 9 — Segurança dos dados (recolhível)                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {hasCondominioData && (
        <CondominioSection
          id="dados"
          title="Backup e confiança"
          subtitle="Backup, integridade, conta e configurações."
          eyebrow="Dados"
          priority="normal"
          defaultOpen={false}
        >
          <section className="px-5 pb-2 pt-2 sm:px-6">
            <LocalFirstTrustNote />
          </section>
          <section className="px-5 pb-2 pt-2 sm:px-6">
            <AccountPanel onRefresh={onRefresh} />
          </section>
          <LocalDataIntegrityPanel refreshKey={refreshKey} />
          <BackupPanel onImported={onRefresh} />

          <section className="px-5 pb-2 pt-1 sm:px-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">
                Notificações
              </p>
              <button
                type="button"
                onClick={onToggleNotifSettings}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium text-navy-500 transition-colors hover:bg-navy-100"
              >
                {showNotifSettings ? "Fechar" : "Configurar"}
              </button>
            </div>
            {showNotifSettings && <NotificationSettingsPanel />}
          </section>

          <section className="px-5 pb-3 pt-1 sm:px-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">
              Evolução da saúde operacional
            </p>
            <div className="rounded-lg bg-white/[0.86] p-4 shadow-card ring-1 ring-navy-100">
              <HealthTrendChart />
            </div>
          </section>
        </CondominioSection>
      )}

      {/* ── Sobre o app ─────────────────────────────────────────────── */}
      <section className="px-5 pb-3 pt-5 sm:px-6">
        <div className="rounded-lg border border-navy-100/60 bg-white/[0.78] px-4 py-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Sobre o app</p>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-navy-50/60 px-3.5 py-3">
              <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Ferramenta de apoio operacional</p>
              <p className="text-[11px] leading-relaxed text-navy-500">
                O Amigo do Prédio auxilia síndicos no dia a dia, mas não substitui advogado, administradora ou profissional especializado. As orientações têm caráter informativo.
              </p>
            </div>
            <div className="rounded-lg bg-navy-50/60 px-3.5 py-3">
              <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Seus dados ficam no dispositivo</p>
              <p className="text-[11px] leading-relaxed text-navy-500">
                Os dados do condomínio são salvos localmente neste aparelho. Nada é enviado a terceiros. Use "Exportar dados" para fazer backup.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 pt-1">
              <a href="/termos" className="text-[10.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600">
                Termos de uso
              </a>
              <a href="/privacidade" className="text-[10.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600">
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
  );
}
