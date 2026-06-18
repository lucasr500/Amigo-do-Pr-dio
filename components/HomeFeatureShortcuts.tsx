"use client";

// Cards de acesso rápido para diferenciais ocultos do produto.
// Surfacing: HandoffPanel, CalendarioOperacional, Revisão Mensal, Memória Institucional,
// CommandCenter, Documentos Críticos — a no máximo 1 toque.

import type { AppTab } from "@/components/BottomNav";

type Shortcut = {
  id: string;
  title: string;
  sub: string;
  tab: AppTab;
  sectionTarget?: string;
  action?: "openMonthlyReview" | "openBackup" | "expandMemoria";
  toolGroup?: string;
};

const SHORTCUTS: Shortcut[] = [
  {
    id: "handoff",
    title: "Passagem de Mandato",
    sub: "Organize a transição do síndico sem perder histórico.",
    tab: "memoria",
    sectionTarget: "memoria-institucional",
  },
  {
    id: "calendario",
    title: "Calendário Operacional",
    sub: "12 meses de vencimentos, manutenções e eventos.",
    tab: "memoria",
    sectionTarget: "documentos",
  },
  {
    id: "revisao",
    title: "Revisão Mensal",
    sub: "Checklist guiado com score e relatório copiável.",
    tab: "memoria",
    sectionTarget: "revisao-mensal",
    action: "openMonthlyReview",
  },
  {
    id: "memoria",
    title: "Memória Institucional",
    sub: "Fornecedores, decisões e histórico por unidade.",
    tab: "memoria",
    sectionTarget: "memoria-institucional",
  },
  {
    id: "command",
    title: "Central de Comando",
    sub: "Síntese do dia: prioridades e correlações operacionais.",
    tab: "ferramentas",
    toolGroup: "rotina",
  },
];

const SHORTCUT_ICONS: Record<string, React.ReactNode> = {
  handoff: (
    <svg className="h-4.5 w-4.5 text-navy-600" style={{ height: 18, width: 18 }} viewBox="0 0 18 18" fill="none">
      <path d="M3 14c0-2 1.5-3.5 3.5-3.5h5C13.5 10.5 15 12 15 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11.5 6h2.5M12.5 5l1.5 1-1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendario: (
    <svg className="h-4.5 w-4.5 text-navy-600" style={{ height: 18, width: 18 }} viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="3.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 7.5h13M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 10.5h1.5M8.5 10.5h1.5M11.5 10.5h1.5M5.5 12.5h1.5M8.5 12.5h1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  revisao: (
    <svg className="h-4.5 w-4.5 text-navy-600" style={{ height: 18, width: 18 }} viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 7l2 2 4-4M6 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  memoria: (
    <svg className="h-4.5 w-4.5 text-navy-600" style={{ height: 18, width: 18 }} viewBox="0 0 18 18" fill="none">
      <path d="M3 9a6 6 0 1 0 12 0A6 6 0 0 0 3 9z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 6v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  command: (
    <svg className="h-4.5 w-4.5 text-navy-600" style={{ height: 18, width: 18 }} viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 6h7M5.5 9h5M5.5 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

type Props = {
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSection?: (sectionId: string) => void;
  onOpenMonthlyReview?: () => void;
  onSetToolGroup?: (group: string) => void;
};

export default function HomeFeatureShortcuts({
  onNavigateTab,
  onNavigateToSection,
  onOpenMonthlyReview,
  onSetToolGroup,
}: Props) {
  const handleShortcut = (sc: Shortcut) => {
    if (sc.action === "openMonthlyReview" && onOpenMonthlyReview) {
      onOpenMonthlyReview();
      return;
    }
    // Com sectionTarget, a própria rerota de seção navega para a aba certa (W7) —
    // evita navegação dupla/flash. Sem seção, navega direto pela aba.
    if (sc.sectionTarget && onNavigateToSection) {
      onNavigateToSection(sc.sectionTarget);
      return;
    }
    onNavigateTab(sc.tab);
    if (sc.toolGroup && onSetToolGroup) {
      setTimeout(() => onSetToolGroup?.(sc.toolGroup!), 80);
    }
  };

  return (
    <div className="px-5 pb-4 sm:px-6">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400">
        Acesso rápido
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SHORTCUTS.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => handleShortcut(sc)}
            className="flex flex-col gap-1.5 rounded-xl border border-navy-100/80 bg-white/[0.82] p-3.5 text-left shadow-card transition-all hover:border-navy-200 hover:bg-white active:scale-[0.98]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
              {SHORTCUT_ICONS[sc.id]}
            </span>
            <p className="text-[12px] font-semibold leading-snug text-navy-800">
              {sc.title}
            </p>
            <p className="text-[10.5px] leading-snug text-navy-400">
              {sc.sub}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
