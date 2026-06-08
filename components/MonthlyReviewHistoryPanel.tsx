"use client";

import { useEffect, useState } from "react";
import {
  getMonthlyReviewHistory,
  getMonthlyReviewTrend,
  getLastCompletedMonthlyReview,
  buildMonthlyReviewSnapshotSummary,
  type MonthlyReviewSnapshot,
  type MonthlyReviewTrend,
} from "@/lib/session-monthly-review";
import { emitMonthlyReviewCompleted } from "@/lib/community-timeline";
import Panel from "@/components/ui/Panel";

// ─── Helpers visuais ──────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-700";
  if (score >= 50) return "text-amber-700";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 50) return "bg-amber-100";
  return "bg-red-100";
}

function trendConfig(trend: MonthlyReviewTrend): { label: string; style: string; icon: string } {
  switch (trend) {
    case "melhorando": return { label: "Melhorando", style: "text-green-700 bg-green-100", icon: "↑" };
    case "piorando":   return { label: "Piorando",   style: "text-red-600 bg-red-100",     icon: "↓" };
    case "estavel":    return { label: "Estável",     style: "text-navy-600 bg-navy-100",   icon: "→" };
    case "sem_dados":  return { label: "Poucos dados", style: "text-navy-400 bg-navy-50",  icon: "·" };
  }
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ─── Sub-componente: linha de snapshot ───────────────────────────────────────

function SnapshotRow({ snap }: { snap: MonthlyReviewSnapshot }) {
  const [copied, setCopied] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleCopy = async () => {
    try {
      const text = buildMonthlyReviewSnapshotSummary(snap.month);
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  const handleRegisterTimeline = () => {
    emitMonthlyReviewCompleted(snap.month, snap.score);
    setRegistered(true);
  };

  return (
    <div className="rounded-xl border border-navy-100 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        {/* Score badge */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-bold ${scoreBg(snap.score)} ${scoreColor(snap.score)}`}>
          {snap.score}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold capitalize text-navy-800">{monthLabel(snap.month)}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-navy-500">{snap.headline}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {snap.criticalCount > 0 && (
              <span className="text-[10.5px] font-medium text-red-600">
                {snap.criticalCount} crítico{snap.criticalCount > 1 ? "s" : ""}
              </span>
            )}
            {snap.warningCount > 0 && (
              <span className="text-[10.5px] font-medium text-amber-600">
                {snap.warningCount} atenção{snap.warningCount > 1 ? "ões" : ""}
              </span>
            )}
            <span className="text-[10.5px] text-navy-400">
              {snap.checkedCount}/{snap.totalItems} verificados · {shortDate(snap.completedAt)}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-navy-100 bg-navy-50/80 px-2.5 py-1.5 text-[10.5px] font-medium text-navy-600 transition-colors hover:bg-navy-100 active:scale-[0.97]"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button
            type="button"
            onClick={handleRegisterTimeline}
            disabled={registered}
            className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition-colors active:scale-[0.97]
              ${registered
                ? "border-sage-200 bg-sage-50 text-sage-700"
                : "border-navy-100 bg-navy-50/80 text-navy-500 hover:bg-navy-100"
              }`}
          >
            {registered ? "✓ Timeline" : "Timeline"}
          </button>
        </div>
      </div>

      {/* Top items */}
      {snap.topItems.length > 0 && (
        <div className="mt-2 space-y-1">
          {snap.topItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-start gap-1.5">
              <span className={`mt-[2px] flex-shrink-0 text-[9px] font-bold uppercase ${
                item.severity === "critical" ? "text-red-500" : "text-amber-500"
              }`}>
                {item.severity === "critical" ? "●" : "○"}
              </span>
              <p className="text-[11px] leading-snug text-navy-500 line-clamp-1">{item.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onStartReview?: () => void;
};

export default function MonthlyReviewHistoryPanel({ refreshKey, onStartReview }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory]   = useState<MonthlyReviewSnapshot[]>([]);
  const [trend, setTrend]       = useState<MonthlyReviewTrend>("sem_dados");
  const [last, setLast]         = useState<MonthlyReviewSnapshot | null>(null);

  useEffect(() => {
    const h = getMonthlyReviewHistory().slice(0, 6);
    setHistory(h);
    setTrend(getMonthlyReviewTrend());
    setLast(getLastCompletedMonthlyReview());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return null;

  const trendCfg = trendConfig(trend);

  // ── Estado vazio ─────────────────────────────────────────────────────────

  if (history.length === 0) {
    return (
      <section className="px-5 pb-3 pt-1 sm:px-6">
        <Panel
          eyebrow="Histórico de revisões"
          title="Evolução operacional mês a mês"
          subtitle="Nenhuma revisão mensal concluída ainda. Quando você concluir a revisão deste mês, ela aparecerá aqui como parte do histórico operacional."
        >
          {onStartReview && (
            <button
              type="button"
              onClick={onStartReview}
              className="mt-3 rounded-xl bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-800 active:scale-[0.98] transition-colors"
            >
              Concluir revisão deste mês
            </button>
          )}
          <p className="mt-3 text-[10.5px] leading-relaxed text-navy-400">
            Histórico de controle auxiliar — não substitui prestação de contas oficial.
          </p>
        </Panel>
      </section>
    );
  }

  // ── Com histórico ─────────────────────────────────────────────────────────

  return (
    <section className="px-5 pb-3 pt-1 sm:px-6">
      <Panel
        eyebrow="Histórico de revisões"
        title="Evolução operacional"
        bodyClassName=""
        action={
          <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${trendCfg.style}`}>
            {trendCfg.icon} {trendCfg.label}
          </span>
        }
      >

        {/* Última revisão */}
        {last && (
          <div className="mx-4 mb-3 rounded-xl bg-navy-50/60 px-3 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Última revisão concluída
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-navy-700">
              {monthLabel(last.month)} — score {last.score}/100
            </p>
            <p className="mt-0.5 text-[11px] text-navy-500">
              Concluída em {shortDate(last.completedAt)}
            </p>
          </div>
        )}

        {/* Aviso de tendência ruim */}
        {trend === "piorando" && (
          <div className="mx-4 mb-3 rounded-xl border border-amber-200/60 bg-amber-50/60 px-3 py-2.5">
            <p className="text-[11.5px] leading-snug text-amber-800">
              Score caiu em relação à última revisão. Vale revisar os pontos de atenção recorrentes.
            </p>
          </div>
        )}

        {/* Lista de revisões */}
        <div className="space-y-2 px-4 pb-4">
          {history.map((snap) => (
            <SnapshotRow key={snap.month} snap={snap} />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="border-t border-navy-50/80 px-4 pb-3 pt-2">
          <p className="text-[10.5px] leading-relaxed text-navy-400">
            Histórico de controle auxiliar com dados locais. Não substitui prestação de contas oficial, demonstrativos contábeis ou documentos jurídicos.
          </p>
        </div>
      </Panel>
    </section>
  );
}
