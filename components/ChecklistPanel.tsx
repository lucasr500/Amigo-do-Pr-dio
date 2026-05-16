"use client";

import { useEffect, useState } from "react";
import { CHECKLISTS } from "@/lib/checklists";
import {
  getChecklistStorage,
  saveChecklistProgress,
  resetChecklistStorage,
  logChecklistOpen,
  logInteraction,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

function formatLastUsed(isoTs: string): string {
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "agora mesmo";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return "há mais de um mês";
}

export default function ChecklistPanel() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [lastUsed, setLastUsed] = useState<Record<string, string>>({});
  // hydrated evita exibir timestamps no SSR (que causariam mismatch de hidratação)
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storage = getChecklistStorage();
    const mergedChecked: Record<string, boolean> = {};
    const timestamps: Record<string, string> = {};

    for (const [id, data] of Object.entries(storage)) {
      Object.assign(mergedChecked, data.checked);
      timestamps[id] = data.lastUsed;
    }

    setChecked(mergedChecked);
    setLastUsed(timestamps);
    setHydrated(true);
  }, []);

  const toggleChecklist = (id: string) => {
    const willOpen = openId !== id;
    setOpenId(willOpen ? id : null);
    if (willOpen) {
      logChecklistOpen(id);
      void trackEvent("checklist_open", { checklist_id: id });
    }
  };

  const toggleItem = (checklistId: string, itemId: string) => {
    const cl = CHECKLISTS.find((c) => c.id === checklistId)!;
    const item = cl.items.find((it) => it.id === itemId);
    const isBeingChecked = !checked[itemId];

    if (isBeingChecked && item?.critical) {
      logInteraction("critical-item-checked", itemId);
    }

    if (isBeingChecked) {
      const nextChecked = { ...checked, [itemId]: true };
      if (cl.items.every((it) => nextChecked[it.id])) {
        void trackEvent("checklist_complete", { checklist_id: checklistId });
      }
    }

    setChecked((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      const clChecked: Record<string, boolean> = {};
      cl.items.forEach((it) => { if (next[it.id]) clChecked[it.id] = true; });
      if (Object.keys(clChecked).length > 0) {
        saveChecklistProgress(checklistId, clChecked);
      } else {
        resetChecklistStorage(checklistId);
      }
      return next;
    });
    setLastUsed((prev) => ({ ...prev, [checklistId]: new Date().toISOString() }));
  };

  const resetChecklist = (checklistId: string) => {
    const cl = CHECKLISTS.find((c) => c.id === checklistId)!;
    setChecked((prev) => {
      const next = { ...prev };
      cl.items.forEach((it) => delete next[it.id]);
      return next;
    });
    resetChecklistStorage(checklistId);
    setLastUsed((prev) => {
      const next = { ...prev };
      delete next[checklistId];
      return next;
    });
  };

  return (
    <section id="checklist-panel" className="px-5 pb-7 sm:px-6 sm:pb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
          Checklists operacionais
        </h3>
        <span className="text-[11px] text-navy-400">{CHECKLISTS.length} fluxos</span>
      </div>

      <div className="space-y-2">
        {CHECKLISTS.map((checklist) => {
          const isOpen = openId === checklist.id;
          const done = checklist.items.filter((it) => checked[it.id]).length;
          const total = checklist.items.length;
          const hasProgress = hydrated && done > 0 && done < total;
          const isComplete = hydrated && done === total;
          const ts = hydrated ? lastUsed[checklist.id] : undefined;
          const criticalPending = hydrated
            ? checklist.items.filter((it) => it.critical && !checked[it.id]).length
            : 0;

          return (
            <div
              key={checklist.id}
              className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleChecklist(checklist.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-navy-50/50 active:bg-navy-50"
                aria-expanded={isOpen}
              >
                <span className="text-[18px]" aria-hidden="true">
                  {checklist.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-navy-800">
                    {checklist.title}
                  </p>
                  <p className="text-[11px] text-navy-400">
                    {ts ? `Última vez: ${formatLastUsed(ts)}` : checklist.description}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {hasProgress && criticalPending > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-200">
                      {criticalPending} crítico{criticalPending > 1 ? "s" : ""}
                    </span>
                  )}
                  {hasProgress && criticalPending === 0 && (
                    <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-medium text-sage-700 ring-1 ring-sage-200">
                      Continuar
                    </span>
                  )}
                  {isComplete && (
                    <span className="text-[11px] font-medium text-sage-600">
                      ✓ {done}/{total}
                    </span>
                  )}
                  {!hasProgress && !isComplete && hydrated && done > 0 && (
                    <span className="text-[11px] font-medium text-navy-400">
                      {done}/{total}
                    </span>
                  )}
                  <svg
                    className={`h-4 w-4 text-navy-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              {hydrated && done > 0 && (
                <div className="h-0.5 bg-navy-50">
                  <div
                    className="h-full bg-sage-400 transition-all duration-300"
                    style={{ width: `${Math.round((done / total) * 100)}%` }}
                  />
                </div>
              )}

              {isOpen && (
                <div className="animate-fade-in border-t border-navy-50 px-4 pb-4 pt-2">
                  <ul className="mt-1 space-y-1">
                    {checklist.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggleItem(checklist.id, item.id)}
                          className="flex w-full items-start gap-3 rounded-lg px-1 py-1.5 text-left transition-colors duration-100 hover:bg-navy-50/50 active:bg-navy-50"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-all duration-150 ${
                              checked[item.id]
                                ? "border-sage-400 bg-sage-400"
                                : item.critical
                                  ? "border-amber-300 bg-white"
                                  : "border-navy-200 bg-white"
                            }`}
                          >
                            {checked[item.id] && (
                              <svg
                                className="h-2.5 w-2.5 text-white"
                                viewBox="0 0 10 10"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M1.5 5l2.5 2.5L8.5 2.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span
                            className={`text-[13px] leading-[1.5] transition-colors duration-150 ${
                              checked[item.id]
                                ? "text-navy-400 line-through decoration-navy-300"
                                : item.critical
                                  ? "font-medium text-navy-800"
                                  : "text-navy-700"
                            }`}
                          >
                            {item.text}
                            {item.critical && !checked[item.id] && (
                              <span
                                className="ml-1.5 inline-flex h-[14px] w-[14px] items-center justify-center rounded-full bg-amber-50 text-[8px] font-bold leading-none text-amber-500 ring-1 ring-amber-200"
                                aria-hidden="true"
                              >
                                !
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {hydrated && done > 0 && (
                    <button
                      type="button"
                      onClick={() => resetChecklist(checklist.id)}
                      className="mt-3 text-[11px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
