"use client";

import { useEffect, useState } from "react";
import { buildCommandCenterCached } from "@/lib/command-center";
import { getProfile, hasMemoriaOperacional } from "@/lib/session";

function buildReportText(): string {
  const cc = buildCommandCenterCached();
  const profile = getProfile();
  const name = profile?.nomeCondominio ?? "Condomínio";
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const lines: string[] = [];

  lines.push(`RELATÓRIO DE SAÚDE OPERACIONAL`);
  lines.push(`${name} — ${today}`);
  lines.push(``);

  lines.push(`SITUAÇÃO GERAL`);
  lines.push(`Saúde: ${cc.healthPercentage}%`);
  lines.push(cc.summaryText);
  lines.push(``);

  if (cc.guidanceTopTres.length > 0) {
    lines.push(`PRIORIDADES IMEDIATAS`);
    cc.guidanceTopTres.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.titulo}`);
      lines.push(`   → ${item.proximoPasso}`);
    });
    lines.push(``);
  }

  if (cc.guidanceTopRisco) {
    lines.push(`MAIOR RISCO`);
    lines.push(cc.guidanceTopRisco.titulo);
    lines.push(cc.guidanceTopRisco.consequencia);
    lines.push(``);
  }

  if (cc.guidanceMaiorLacuna) {
    lines.push(`LACUNA IDENTIFICADA`);
    lines.push(cc.guidanceMaiorLacuna.titulo);
    lines.push(`→ ${cc.guidanceMaiorLacuna.proximoPasso}`);
    lines.push(``);
  }

  if (cc.guidanceMaiorMelhoria) {
    lines.push(`OPORTUNIDADE DE MELHORIA`);
    lines.push(cc.guidanceMaiorMelhoria.titulo);
    lines.push(`→ ${cc.guidanceMaiorMelhoria.proximoPasso}`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`Gerado pelo Amigo do Prédio`);

  return lines.join("\n");
}

export default function RelatorioSaudePanel() {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || !hasMemoriaOperacional()) return null;

  const handleOpen = () => {
    setReport(buildReportText());
    setOpen(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: seleciona o textarea
      const el = document.getElementById("relatorio-text") as HTMLTextAreaElement | null;
      el?.select();
    }
  };

  if (!open) {
    return (
      <div className="px-5 pb-3 pt-1 sm:px-6">
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full items-center gap-3 rounded-[16px] border border-navy-100/70 bg-white/80 px-4 py-3.5 text-left shadow-sm transition-all hover:bg-white hover:shadow active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-navy-100 text-[15px]" aria-hidden="true">
            📋
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-navy-800">Relatório de saúde</p>
            <p className="mt-0.5 text-[11.5px] text-navy-400">Resumo executivo pronto para copiar e compartilhar.</p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4 pt-1 sm:px-6 animate-fade-in">
      <div className="rounded-[18px] border border-navy-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy-800">Relatório de saúde operacional</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        <textarea
          id="relatorio-text"
          readOnly
          value={report}
          rows={14}
          className="w-full resize-none rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-navy-700 focus:outline-none"
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-all active:scale-95 ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-navy-700 text-white hover:bg-navy-800"
            }`}
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 10V4a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Copiar relatório
              </>
            )}
          </button>
          <p className="text-[11px] text-navy-400">Cole em WhatsApp, e-mail ou reunião.</p>
        </div>
      </div>
    </div>
  );
}
