"use client";

import { useEffect, useState } from "react";
import { buildLocalIntegrityReport, type LocalIntegrityReport } from "@/lib/local-integrity";

type Props = {
  refreshKey?: number;
};

const STATUS_STYLE = {
  ok: "border-teal-100 bg-teal-50/40 text-teal-800",
  info: "border-navy-100 bg-navy-50/50 text-navy-700",
  warning: "border-amber-200 bg-amber-50/60 text-amber-800",
  critical: "border-terracotta-200 bg-terracotta-50/70 text-terracotta-800",
} as const;

export default function LocalDataIntegrityPanel({ refreshKey }: Props) {
  const [report, setReport] = useState<LocalIntegrityReport | null>(null);

  useEffect(() => {
    setReport(buildLocalIntegrityReport());
  }, [refreshKey]);

  if (!report) return null;

  return (
    <section className="px-5 pb-3 pt-2 sm:px-6">
      <div className={`rounded-[18px] border px-4 py-4 ${STATUS_STYLE[report.status]}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] opacity-70">
              Integridade local
            </p>
            <p className="mt-0.5 text-[14px] font-semibold">
              Dados locais: {report.score}/100
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed opacity-80">
              Verificação determinística de backup, agenda, pendências, documentos e financeiro neste dispositivo.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold">
            {report.storageSizeKB} KB
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ["Pend.", report.counts.pendencias],
            ["Agenda", report.counts.agenda],
            ["Docs", report.counts.documentos],
            ["Fin.", report.counts.financialEntries],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/60 px-2 py-2 text-center">
              <p className="text-[10px] font-medium opacity-70">{label}</p>
              <p className="text-[13px] font-bold">{value}</p>
            </div>
          ))}
        </div>

        {report.issues.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {report.issues.slice(0, 4).map((issue) => (
              <div key={issue.id} className="rounded-xl bg-white/70 px-3 py-2">
                <p className="text-[11.5px] font-semibold">{issue.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed opacity-75">{issue.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[11.5px] font-medium">
            Nenhuma inconsistência relevante encontrada.
          </p>
        )}
      </div>
    </section>
  );
}
