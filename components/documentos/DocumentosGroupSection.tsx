import type { ReactNode } from "react";
import type { DocumentoCategoria, DocumentoEssencialId } from "@/lib/session";
import {
  CATEGORIA_COR,
  CATEGORIA_LABEL,
  EMPTY_STATE_EXPERT,
  GRUPO_DESCRICAO,
} from "./documentos-config";

type Props = {
  aberto: boolean;
  barColor: string;
  cadastradosGrupo: number;
  cat: DocumentoCategoria;
  hiddenCount: number;
  idsGrupoLength: number;
  idsToShow: string[];
  naoTenhoGrupo: number;
  onShowAll: () => void;
  onToggle: () => void;
  precisaGrupo: number;
  renderDocCard: (id: DocumentoEssencialId) => ReactNode;
  tenhoGrupo: number;
};

export default function DocumentosGroupSection({
  aberto,
  barColor,
  cadastradosGrupo,
  cat,
  hiddenCount,
  idsGrupoLength,
  idsToShow,
  naoTenhoGrupo,
  onShowAll,
  onToggle,
  precisaGrupo,
  renderDocCard,
  tenhoGrupo,
}: Props) {
  const contentId = `documentos-grupo-${cat}`;

  return (
    <div className="overflow-hidden rounded-xl border border-navy-50">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        aria-controls={contentId}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-navy-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
      >
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORIA_COR[cat]}`}>
          {CATEGORIA_LABEL[cat]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11.5px] text-navy-500">{GRUPO_DESCRICAO[cat]}</span>
          {cadastradosGrupo > 0 && (
            <span className="mt-1 block h-0.5 w-full overflow-hidden rounded-full bg-navy-100">
              <span
                className={`block h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.round((tenhoGrupo / idsGrupoLength) * 100)}%` }}
              />
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {cadastradosGrupo > 0 && (
            <span className="text-[10px] text-navy-400">
              {tenhoGrupo}/{idsGrupoLength}
            </span>
          )}
          {precisaGrupo > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          )}
          {naoTenhoGrupo > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta-400" aria-hidden="true" />
          )}
          <svg className={`h-3.5 w-3.5 text-navy-300 transition-transform ${aberto ? "rotate-90" : ""}`} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {aberto && (
        <div id={contentId} className="space-y-1.5 border-t border-navy-50 bg-navy-50/20 px-3 py-2">
          {cadastradosGrupo === 0 && (
            <p className="px-0.5 py-1 text-[11px] leading-relaxed text-navy-500">
              {EMPTY_STATE_EXPERT[cat]}
            </p>
          )}
          {idsToShow.map((id) => renderDocCard(id as DocumentoEssencialId))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={onShowAll}
              className="w-full py-2 text-center text-[11px] text-navy-400 transition-colors hover:text-navy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
            >
              Ver {hiddenCount} mais →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
