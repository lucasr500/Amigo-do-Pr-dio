"use client";

import dynamic from "next/dynamic";
import type { AppTab } from "@/components/BottomNav";
import type { ToolAnchor, ToolGroup } from "@/lib/app-navigation";

const ComunicadoPanel       = dynamic(() => import("@/components/ComunicadoPanel"), { ssr: false });
const SimuladorMulta        = dynamic(() => import("@/components/SimuladorMulta"), { ssr: false });
const ChecklistPanel        = dynamic(() => import("@/components/ChecklistPanel"), { ssr: false });
const PainelOperacional     = dynamic(() => import("@/components/PainelOperacional"), { ssr: false });
const RegistroRapido        = dynamic(() => import("@/components/RegistroRapido"), { ssr: false });
const AgendaPredio          = dynamic(() => import("@/components/AgendaPredio"), { ssr: false });
const SimuladorReajusteCota = dynamic(() => import("@/components/SimuladorReajusteCota"), { ssr: false });
const CommandCenterPanel    = dynamic(() => import("@/components/CommandCenterPanel"), { ssr: false });
const DecisoesSindicoPanel  = dynamic(() => import("@/components/DecisoesSindicoPanel"), { ssr: false });

const TOOL_CATEGORIES: Array<{ id: ToolGroup; code: string; title: string; description: string }> = [
  { id: "rotina",      code: "RT", title: "Rotina do síndico", description: "Registre ocorrências e acompanhe próximos passos do dia a dia." },
  { id: "comunicados", code: "CM", title: "Comunicados",        description: "Gere avisos formais para moradores em segundos." },
  { id: "simuladores", code: "SM", title: "Simuladores",        description: "Estime multas, juros e reajuste de cota condominial." },
  { id: "checklists",  code: "CK", title: "Checklists",         description: "Conferência guiada para assembleias, obras e manutenção." },
  { id: "temas",       code: "TM", title: "Explorar por tema",  description: "Orientações práticas organizadas por tema de gestão." },
];

type Props = {
  refreshKey: number;
  activeToolGroup: ToolGroup | null;
  pendingToolAnchor: ToolAnchor | null;
  highlightToolAnchor: ToolAnchor | null;
  pendingChecklistId: string | null;
  onSetActiveToolGroup: (group: ToolGroup | null) => void;
  onSuggestionSelect: (q: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSubView: (view: "saude" | "pendencias") => void;
  onChecklistConsumed: () => void;
  onSaved: () => void;
};

export default function ToolsTab({
  refreshKey,
  activeToolGroup,
  pendingToolAnchor,
  highlightToolAnchor,
  pendingChecklistId,
  onSetActiveToolGroup,
  onSuggestionSelect,
  onNavigateTab,
  onNavigateToSubView,
  onChecklistConsumed,
  onSaved,
}: Props) {
  return (
    <div key="ferramentas" className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">

      {/* Cabeçalho */}
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

      {/* Botão voltar — views internas */}
      {activeToolGroup !== null && (
        <div className="px-4 pb-3 pt-0 sm:px-5">
          <button
            type="button"
            onClick={() => onSetActiveToolGroup(null)}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11.5px] font-medium">Voltar para ferramentas</span>
          </button>
        </div>
      )}

      {/* Menu de categorias */}
      {activeToolGroup === null && (
        <div className="px-5 pb-6 sm:px-6">
          <div className="flex flex-col gap-3">
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSetActiveToolGroup(cat.id)}
                className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-navy-200 hover:shadow active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-navy-50 text-[10.5px] font-bold tracking-[0.08em] text-navy-500" aria-hidden="true">
                  {cat.code}
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

      {/* Rotina do síndico */}
      {activeToolGroup === "rotina" && (
        <div className="space-y-6">
          <div id="registro-rapido">
            <RegistroRapido onSaved={onSaved} />
          </div>
          <div id="agenda-predio" className="border-t border-navy-100 pt-6">
            <AgendaPredio onSaved={onSaved} />
          </div>
          <div className="border-t border-navy-100 pt-6">
            <CommandCenterPanel
              refreshKey={refreshKey}
              onNavigate={(target) => {
                if (target === "pendencias") { onNavigateToSubView("pendencias"); onNavigateTab("inicio"); }
                else if (target === "condominio") onNavigateTab("condominio");
                else if (target === "agenda") onNavigateTab("agenda");
              }}
            />
          </div>
        </div>
      )}

      {/* Comunicados */}
      {activeToolGroup === "comunicados" && (
        <ComunicadoPanel
          targetAnchor={pendingToolAnchor}
          highlightAnchor={highlightToolAnchor}
        />
      )}

      {/* Simuladores */}
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

      {/* Checklists */}
      {activeToolGroup === "checklists" && (
        <ChecklistPanel
          anchorId="checklists"
          highlighted={highlightToolAnchor === "checklists"}
          initialOpenId={pendingChecklistId}
          onInitialOpenConsumed={onChecklistConsumed}
        />
      )}

      {/* Explorar por tema */}
      {activeToolGroup === "temas" && (
        <>
          <PainelOperacional onAsk={onSuggestionSelect} refreshKey={refreshKey} />
          <DecisoesSindicoPanel />
        </>
      )}

    </div>
  );
}
