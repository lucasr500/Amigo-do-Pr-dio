"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchGlobal, buildDynamicSearchResults, type SearchResult, type SearchResultType } from "@/lib/global-search";
import type { AppTab } from "@/components/BottomNav";
import type { CentralSectionId } from "@/lib/visibility-guards";

const TYPE_LABEL: Record<SearchResultType, string> = {
  modulo:      "Módulo",
  documento:   "Documento",
  comunicado:  "Comunicado",
  checklist:   "Checklist",
  kb_categoria: "Tema",
  acao:        "Ação",
  pendencia:   "Pendência",
  decisao:     "Decisão",
  fornecedor:  "Fornecedor",
  evento:      "Evento",
  unidade:     "Unidade",
  post:        "Post",
  enquete:     "Enquete",
  solicitacao: "Solicitação",
  sugestao:    "Sugestão",
  obra:        "Obra",
  reserva:     "Reserva",
};

const TYPE_DOT: Record<SearchResultType, string> = {
  modulo:      "bg-navy-400",
  documento:   "bg-amber-400",
  comunicado:  "bg-sage-500",
  checklist:   "bg-blue-400",
  kb_categoria: "bg-purple-400",
  acao:        "bg-terracotta-400",
  pendencia:   "bg-terracotta-500",
  decisao:     "bg-navy-600",
  fornecedor:  "bg-sage-600",
  evento:      "bg-blue-500",
  unidade:     "bg-amber-500",
  post:        "bg-navy-500",
  enquete:     "bg-purple-500",
  solicitacao: "bg-amber-600",
  sugestao:    "bg-sage-600",
  obra:        "bg-orange-500",
  reserva:     "bg-green-500",
};

type Props = {
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSection?: (sectionId: string, centralSection?: CentralSectionId) => void;
  onOpenMonthlyReview?: () => void;
  onOpenBackup?: () => void;
  onExpandMemoria?: () => void;
  onSetToolGroup?: (group: string) => void;
  onClose: () => void;
};

export default function GlobalSearch({
  onNavigateTab,
  onNavigateToSection,
  onOpenMonthlyReview,
  onOpenBackup,
  onExpandMemoria,
  onSetToolGroup,
  onClose,
}: Props) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const staticR  = searchGlobal(q, 5);
    const dynamicR = buildDynamicSearchResults(q, 4);
    const seen = new Set(staticR.map(r => r.id));
    const merged = [...staticR, ...dynamicR.filter(r => !seen.has(r.id))].slice(0, 8);
    setResults(merged);
  };

  const handleSelect = useCallback((result: SearchResult) => {
    // Ações especiais primeiro
    if (result.action === "openMonthlyReview" && onOpenMonthlyReview) {
      onOpenMonthlyReview();
      onClose();
      return;
    }
    if (result.action === "openBackup" && onOpenBackup) {
      onOpenBackup();
      onClose();
      return;
    }
    if (result.action === "expandMemoria" && onExpandMemoria) {
      onExpandMemoria();
      onNavigateTab("condominio");
      onClose();
      return;
    }

    // Navegar para aba
    onNavigateTab(result.tab);

    // Seção no Condomínio
    if (result.sectionTarget && onNavigateToSection) {
      setTimeout(() => onNavigateToSection!(result.sectionTarget!, result.centralSectionTarget), 100);
    }

    // Tool group em Ferramentas
    if (result.toolGroup && onSetToolGroup) {
      setTimeout(() => onSetToolGroup!(result.toolGroup!), 100);
    }

    onClose();
  }, [onNavigateTab, onNavigateToSection, onOpenMonthlyReview, onOpenBackup, onExpandMemoria, onSetToolGroup, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && results.length > 0) handleSelect(results[0]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Painel */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-navy-100/80 bg-white shadow-xl">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-navy-50">
          <svg className="h-4 w-4 flex-shrink-0 text-navy-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar pendência, decisão, fornecedor, documento..."
            className="flex-1 bg-transparent text-[14px] text-navy-800 placeholder-navy-300 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleChange("")}
              className="text-navy-300 hover:text-navy-500"
              aria-label="Limpar busca"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Resultados */}
        {results.length > 0 ? (
          <ul className="max-h-72 overflow-y-auto py-1.5">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-navy-50 transition-colors"
                >
                  <span
                    className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${TYPE_DOT[r.type]}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-navy-800 leading-snug">{r.title}</p>
                    <p className="text-[11px] text-navy-400 leading-snug mt-0.5">{r.description}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-navy-50 px-2 py-0.5 text-[9.5px] font-medium text-navy-400">
                    {TYPE_LABEL[r.type]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[13px] text-navy-400">Nenhum resultado para "{query}".</p>
            <p className="mt-1 text-[11px] text-navy-300">Tente "mural", "reserva", "memória", "backup" ou "AVCB".</p>
          </div>
        ) : (
          <div className="px-4 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.10em] text-navy-300">Sugestões</p>
            <div className="flex flex-wrap gap-1.5">
              {["Central Digital", "Mural", "Reservas", "AVCB", "Financeiro", "Memória", "Backup"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange(s)}
                  className="rounded-full border border-navy-100 bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600 hover:bg-navy-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Atalhos de teclado */}
        <div className="border-t border-navy-50 px-4 py-2 flex items-center gap-4">
          <p className="text-[10px] text-navy-300">↵ selecionar</p>
          <p className="text-[10px] text-navy-300">Esc fechar</p>
        </div>
      </div>
    </div>
  );
}
