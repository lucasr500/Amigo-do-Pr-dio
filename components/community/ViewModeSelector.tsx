"use client";

import { useState, useEffect } from "react";
import { getViewMode, setViewMode } from "@/lib/community-permissions";
import { ROLE_LABELS, ROLE_DESCRIPTION, type ViewMode } from "@/lib/community-types";

type Props = {
  onChange?: (mode: ViewMode) => void;
};

const MODES: ViewMode[] = ["manager", "council", "resident", "viewer"];

const MODE_COLORS: Record<ViewMode, string> = {
  manager:  "bg-navy-800 text-white",
  council:  "bg-navy-600 text-white",
  resident: "bg-terracotta-600 text-white",
  viewer:   "bg-navy-100 text-navy-600",
};

const MODE_BADGE: Record<ViewMode, string> = {
  manager:  "border-navy-200 bg-navy-50 text-navy-700",
  council:  "border-navy-200 bg-navy-50 text-navy-600",
  resident: "border-terracotta-100 bg-terracotta-50 text-terracotta-700",
  viewer:   "border-navy-100 bg-navy-50 text-navy-500",
};

export default function ViewModeSelector({ onChange }: Props) {
  const [mode, setMode] = useState<ViewMode>("manager");
  const [open, setOpen] = useState(false);

  useEffect(() => { setMode(getViewMode()); }, []);

  const handleSelect = (m: ViewMode) => {
    setViewMode(m);
    setMode(m);
    setOpen(false);
    onChange?.(m);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${MODE_COLORS[mode]}`}
        aria-label="Alternar modo de visualização"
      >
        <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 10c0-2 1.79-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{ROLE_LABELS[mode]}</span>
        <svg className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_4px_24px_-4px_rgba(31,49,71,0.18)]">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Modo de visualização
            </p>
            <p className="mt-0.5 text-[11px] text-navy-400">
              Pré-visualize como cada perfil enxerga a Central. Os dados são os mesmos — apenas a visibilidade muda.
            </p>
          </div>
          <div className="p-2 space-y-1">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSelect(m)}
                className={`w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-navy-50 ${mode === m ? "bg-navy-50" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${MODE_BADGE[m]}`}>
                    {ROLE_LABELS[m]}
                  </span>
                  {mode === m && (
                    <svg className="h-3 w-3 text-navy-500 ml-auto" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="mt-0.5 text-[10.5px] text-navy-500">{ROLE_DESCRIPTION[m]}</p>
              </button>
            ))}
          </div>
          <div className="border-t border-navy-50 px-3 py-2.5">
            <p className="text-[10px] leading-relaxed text-navy-300">
              <span className="font-medium text-navy-400">Simulação visual</span> — tudo roda localmente neste dispositivo. Perfis separados com login real são uma evolução futura planejada.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
