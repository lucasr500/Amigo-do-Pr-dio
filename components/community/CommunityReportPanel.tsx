"use client";

import { useState } from "react";
import { buildCommunityReport } from "@/lib/community-report";
import { type CommunityRole } from "@/lib/community-types";
import { ROLE_LABELS } from "@/lib/community-types";

type Props = { role: CommunityRole; condoName?: string };

export default function CommunityReportPanel({ role, condoName = "Condomínio" }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setReport(buildCommunityReport(role, condoName));
    setCopied(false);
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const scopeNote = role === "manager" || role === "council"
    ? "Inclui dados do mural, solicitações, enquetes, documentos e timeline."
    : "Inclui avisos públicos, documentos e enquetes disponíveis para moradores.";

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-4">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Relatório da Comunidade</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-navy-500">{scopeNote}</p>

          <div className="mt-3 rounded-xl bg-navy-50 px-4 py-3">
            <p className="text-[11.5px] text-navy-600 font-medium mb-0.5">Perfil atual: {ROLE_LABELS[role]}</p>
            <p className="text-[11px] text-navy-400 leading-relaxed">
              O relatório é gerado com os dados visíveis para este perfil. Altere o modo de visualização para ver o relatório de outro perfil.
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={generate}
              className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
              Gerar relatório
            </button>
            {report && (
              <button type="button" onClick={handleCopy}
                className="rounded-full border border-navy-100 px-4 py-1.5 text-[12px] font-medium text-navy-600 hover:bg-navy-50">
                {copied ? "Copiado!" : "Copiar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {report && (
        <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
          <pre className="overflow-x-auto px-5 py-4 text-[11px] leading-relaxed text-navy-700 whitespace-pre-wrap break-words font-mono">
            {report}
          </pre>
        </div>
      )}
    </section>
  );
}
