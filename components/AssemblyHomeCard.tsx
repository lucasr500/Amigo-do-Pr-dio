"use client";

import { useMemo } from "react";
import { buildAssemblyHomeSummary } from "@/lib/assembly-home";

// Card do wedge no Início do síndico: a Assembleia em destaque, respondendo
// "o que faço agora?". Reaproveita lib/assembly-home (derivado, local-first).
// onOpen leva à Memória → Assembleias (deep-link), onde o módulo completo vive.

const CTA_LABEL: Record<string, string> = {
  preparar: "Preparar",
  convocar: "Convocar",
  deliberar: "Deliberar",
  ver: "Abrir",
};

export default function AssemblyHomeCard({
  refreshKey,
  onOpen,
}: {
  refreshKey?: number;
  onOpen: () => void;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => buildAssemblyHomeSummary(), [refreshKey]);

  return (
    <div className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl border border-navy-100/80 bg-white/[0.82] px-4 py-3.5 text-left shadow-card transition-all hover:border-navy-200 hover:bg-white active:scale-[0.98]"
      >
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50" aria-hidden="true">
          {/* Assembleia — colunas/instituição */}
          <svg className="h-[18px] w-[18px] text-sage-600" viewBox="0 0 18 18" fill="none">
            <path d="M9 2.5l6 3v1H3v-1l6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M4.5 7.5v5M9 7.5v5M13.5 7.5v5M3 14.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-navy-400">Assembleia</p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-navy-800">{s.headline}</p>
          <p className="mt-0.5 truncate text-[11px] text-navy-500">{s.sub}</p>
          {s.hasAny && s.itemCount > 0 && (
            <p className="mt-1 text-[10.5px] text-navy-400">
              {s.decidedCount}/{s.itemCount} {s.itemCount === 1 ? "item" : "itens"} de pauta resolvido{s.decidedCount === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <span className="mt-0.5 flex-shrink-0 rounded-full bg-navy-800 px-3 py-1 text-[11px] font-semibold text-white">
          {CTA_LABEL[s.cta] ?? "Abrir"}
        </span>
      </button>
    </div>
  );
}
