"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { AppTab } from "@/components/BottomNav";

// Ajustes — painel POR PAPEL (W7). Morador: conta, perfil, notificações, backup,
// integridade. Síndico: além disso, Funcionários e Implantação (administrativo) e
// acesso a Ferramentas. Absorve a antiga Seção 9 ("Dados") do "Mais" sem orfanar
// Funcionários (Seção 7) nem Implantação (Seção 8).

const OnboardingProfile         = dynamic(() => import("@/components/OnboardingProfile"), { ssr: false });
const MemoriaPanel              = dynamic(() => import("@/components/MemoriaPanel"), { ssr: false });
const AccountPanel              = dynamic(() => import("@/components/AccountPanel"), { ssr: false });
const LocalFirstTrustNote       = dynamic(() => import("@/components/LocalFirstTrustNote"), { ssr: false });
const LocalDataIntegrityPanel   = dynamic(() => import("@/components/LocalDataIntegrityPanel"), { ssr: false });
const BackupPanel               = dynamic(() => import("@/components/BackupPanel"), { ssr: false });
const NotificationSettingsPanel = dynamic(() => import("@/components/NotificationSettingsPanel"), { ssr: false });
const HealthTrendChart          = dynamic(() => import("@/components/HealthTrendChart"), { ssr: false });
const FuncionariosPanel         = dynamic(() => import("@/components/FuncionariosPanel"), { ssr: false });
const ImplantacaoChecklist      = dynamic(() => import("@/components/ImplantacaoChecklist"), { ssr: false });

type Props = {
  refreshKey: number;
  manager: boolean;            // true = síndico/gestor; gateia o que é administrativo
  hasCondominioData: boolean;
  showNotifSettings: boolean;
  shouldOpenBackup?: boolean;
  shouldExpandMemoria?: boolean;
  onRefresh: () => void;
  onMemoriaSaved: () => void;
  onSetupMemoria: () => void;
  onToggleNotifSettings: () => void;
  onBackupOpened?: () => void;
  onNavigateTab: (tab: AppTab) => void;
};

function Block({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 px-5 pt-5 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">{eyebrow}</p>
      <h2 className="mt-0.5 mb-2 font-display text-[18px] font-semibold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

export default function AjustesTab({
  refreshKey, manager, hasCondominioData, showNotifSettings, shouldOpenBackup, shouldExpandMemoria,
  onRefresh, onMemoriaSaved, onSetupMemoria, onToggleNotifSettings, onBackupOpened, onNavigateTab,
}: Props) {
  useEffect(() => {
    if (!shouldOpenBackup) return;
    const t = window.setTimeout(() => {
      document.getElementById("dados")?.scrollIntoView({ behavior: "smooth", block: "start" });
      onBackupOpened?.();
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldOpenBackup]);

  return (
    <div key="ajustes" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden pb-4">
      <div className="px-5 pb-1 pt-2 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">Configurações</p>
        <h2 className="mt-0.5 font-display text-[22px] font-semibold leading-tight text-navy-900">Ajustes</h2>
      </div>

      {/* Perfil do prédio — administrativo (só gestão) */}
      {manager && (
        <Block eyebrow="Prédio" title="Meu prédio">
          <OnboardingProfile onProfileSaved={onRefresh} onSetupMemoria={onSetupMemoria} forceShow />
          {hasCondominioData && <MemoriaPanel onSaved={onMemoriaSaved} autoExpand={!!shouldExpandMemoria} />}
        </Block>
      )}

      {/* Conta — todos */}
      <Block eyebrow="Conta" title="Sua conta">
        <AccountPanel onRefresh={onRefresh} />
      </Block>

      {/* Administrativo — só gestão: Funcionários + Implantação */}
      {manager && hasCondominioData && (
        <>
          <Block id="operacao" eyebrow="Gestão" title="Funcionários">
            <FuncionariosPanel onSaved={onRefresh} />
          </Block>
          <Block id="implantacao" eyebrow="Setup" title="Implantação">
            <ImplantacaoChecklist
              onNavigate={(target) => { if (target === "ferramentas") onNavigateTab("ferramentas"); }}
            />
          </Block>
          <Block eyebrow="Atalho" title="Ferramentas do síndico">
            <button
              type="button"
              onClick={() => onNavigateTab("ferramentas")}
              className="flex w-full items-center gap-3 rounded-xl border border-navy-100/80 bg-white/[0.82] px-4 py-3.5 text-left shadow-card transition-all hover:border-navy-200 hover:bg-white active:scale-[0.98]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold leading-snug text-navy-800">Comunicados, registros, checklists e simuladores</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Block>
        </>
      )}

      {/* Backup e confiança — todos */}
      <Block id="dados" eyebrow="Dados" title="Backup e confiança">
        <div className="space-y-2">
          <LocalFirstTrustNote />
          <LocalDataIntegrityPanel refreshKey={refreshKey} />
          <BackupPanel onImported={onRefresh} />
        </div>
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Notificações</p>
            <button type="button" onClick={onToggleNotifSettings} className="rounded-full px-2.5 py-1 text-[11px] font-medium text-navy-500 transition-colors hover:bg-navy-100">
              {showNotifSettings ? "Fechar" : "Configurar"}
            </button>
          </div>
          {showNotifSettings && <NotificationSettingsPanel />}
        </div>
        {manager && (
          <div className="mt-3">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Evolução da saúde operacional</p>
            <div className="rounded-lg bg-white/[0.86] p-4 shadow-card ring-1 ring-navy-100">
              <HealthTrendChart />
            </div>
          </div>
        )}
      </Block>

      {/* Sobre o app — todos */}
      <section className="px-5 pb-3 pt-5 sm:px-6">
        <div className="rounded-lg border border-navy-100/60 bg-white/[0.78] px-4 py-4 shadow-card">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-300">Sobre o app</p>
          <div className="space-y-2">
            <div className="rounded-lg bg-navy-50/60 px-3.5 py-3">
              <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Ferramenta de apoio operacional</p>
              <p className="text-[11px] leading-relaxed text-navy-500">
                O Amigo do Prédio auxilia no dia a dia, mas não substitui advogado, administradora ou profissional especializado. As orientações têm caráter informativo.
              </p>
            </div>
            <div className="rounded-lg bg-navy-50/60 px-3.5 py-3">
              <p className="mb-1 text-[11.5px] font-semibold text-navy-700">Seus dados ficam no dispositivo</p>
              <p className="text-[11px] leading-relaxed text-navy-500">
                Os dados do condomínio são salvos localmente neste aparelho. Use "Exportar dados" para fazer backup.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 pt-1">
              <a href="/termos" className="text-[10.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600">Termos de uso</a>
              <a href="/privacidade" className="text-[10.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600">Política de privacidade</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
