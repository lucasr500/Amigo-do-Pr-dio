"use client";

import { useEffect, useState } from "react";
import { getRecentQueries, clearQueryHistory, type QueryLog } from "@/lib/session";

type HistoryPanelProps = {
  onSelect: (q: string) => void;
  refreshKey?: number;
};

export default function HistoryPanel({ onSelect, refreshKey }: HistoryPanelProps) {
  const [history, setHistory] = useState<QueryLog[]>([]);

  useEffect(() => {
    setHistory(getRecentQueries(7));
  }, [refreshKey]);

  const handleClear = () => {
    clearQueryHistory();
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <section className="px-5 pb-5 sm:px-6 animate-fade-in-up">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
          Suas últimas perguntas
        </h3>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-navy-300 transition-colors hover:text-navy-500"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-1.5">
        {history.map((item, idx) => (
          <HistoryItem key={idx} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function HistoryItem({
  item,
  onSelect,
}: {
  item: QueryLog;
  onSelect: (q: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.q)}
      className="group flex w-full items-center gap-3 rounded-xl border border-navy-100 bg-white px-3.5 py-2.5 text-left transition-all duration-150 hover:border-navy-200 hover:bg-navy-50 active:scale-[0.99]"
    >
      {/* Ícone de relógio */}
      <svg
        className="h-3.5 w-3.5 flex-shrink-0 text-navy-300 transition-colors group-hover:text-navy-400"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8 5v3.5l2 1.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="flex-1 truncate text-[13px] text-navy-700">{item.q}</span>

      <span className="flex-shrink-0 text-[10.5px] text-navy-300">
        {relativeTime(item.ts)}
      </span>
    </button>
  );
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
