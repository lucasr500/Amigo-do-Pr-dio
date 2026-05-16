"use client";

import { useState } from "react";
import { TOPICS, Topic } from "@/lib/data";

type QuickAccessCardsProps = {
  onSelect: (topic: Topic) => void;
  // Quando true (após uma pergunta já feita), exibe modo compacto com toggle
  collapsed?: boolean;
};

export default function QuickAccessCards({ onSelect, collapsed = false }: QuickAccessCardsProps) {
  const [expanded, setExpanded] = useState(false);

  // Estado inicial: grid completo (sem pergunta feita)
  if (!collapsed) {
    return (
      <section className="px-5 pb-7 sm:px-6 sm:pb-8 animate-fade-in-up stagger-3">
        <div className="mb-3">
          <h3 className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
            Perguntar por tema
          </h3>
        </div>
        <TopicGrid onSelect={onSelect} />
      </section>
    );
  }

  // Estado colapsado: botão toggle acessível após resposta
  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-navy-100/70 bg-white/80 px-4 py-2.5 text-left transition-all duration-200 hover:bg-white active:scale-[0.99]"
        aria-expanded={expanded}
      >
        <span className="text-[11.5px] font-medium text-navy-600">
          Perguntar sobre outro tema
        </span>
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 text-navy-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2.5 animate-fade-in">
          <TopicGrid onSelect={(topic) => { setExpanded(false); onSelect(topic); }} />
        </div>
      )}
    </section>
  );
}

function TopicGrid({ onSelect }: { onSelect: (topic: Topic) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {TOPICS.map((topic, idx) => (
        <button
          key={topic.id}
          onClick={() => onSelect(topic)}
          style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
          className="group relative flex flex-col items-start gap-2 rounded-xl border border-navy-100 bg-white p-3.5 text-left opacity-0 shadow-[0_1px_2px_rgba(31,49,71,0.03)] animate-fade-in-up transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_4px_16px_-6px_rgba(31,49,71,0.15)] active:scale-[0.98] sm:p-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-base transition-colors duration-200 group-hover:bg-sage-50">
            <span aria-hidden="true">{topic.icon}</span>
          </div>
          <span className="text-[13.5px] font-medium leading-tight text-navy-800 sm:text-[14px]">
            {topic.title}
          </span>
          <svg
            className="absolute right-3 top-3.5 h-3.5 w-3.5 text-navy-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
