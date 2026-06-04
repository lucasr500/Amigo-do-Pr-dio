"use client";

import { useState } from "react";
import { buildMonthlyOperationalSummary } from "@/lib/operational-summary";
import { currentMonthKey } from "@/lib/financial";

export default function MonthlyOperationalSummaryPanel() {
  const [month, setMonth] = useState(currentMonthKey());
  const [copied, setCopied] = useState(false);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildMonthlyOperationalSummary(month));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="px-5 pb-3 pt-2 sm:px-6">
      <div className="rounded-[18px] border border-navy-100 bg-white px-4 py-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-300">
              Resumo operacional
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-navy-800">
              Síntese mensal copiável
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-navy-400">
              Consolida prioridades, pendências, agenda, documentos, financeiro e integridade local.
            </p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || currentMonthKey())}
            className="max-w-[132px] rounded-xl border border-navy-100 bg-cream-50/50 px-2.5 py-2 text-[12px] text-navy-700"
          />
        </div>
        <button
          type="button"
          onClick={copySummary}
          className="mt-3 rounded-full bg-navy-700 px-4 py-2 text-[12px] font-semibold text-white hover:bg-navy-800"
        >
          {copied ? "Resumo copiado" : "Copiar resumo mensal"}
        </button>
      </div>
    </section>
  );
}
