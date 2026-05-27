"use client";

import { useState } from "react";
import type { AssistedDateField, DatePrecision } from "@/lib/session";
import { buildAssistedDate } from "@/lib/session";

type InputMode = "exact" | "month" | "unknown" | "to_discover" | "not_applicable";

type Props = {
  label: string;
  sublabel?: string;
  value?: AssistedDateField;
  onChange: (field: AssistedDateField) => void;
  allowNotApplicable?: boolean;
};

const MODE_LABELS: Record<InputMode, string> = {
  exact:          "Data completa",
  month:          "Só mês/ano",
  unknown:        "Não sei ainda",
  to_discover:    "Preciso descobrir",
  not_applicable: "Não se aplica",
};

const PRECISION_BADGE: Record<DatePrecision, { label: string; style: string }> = {
  exact:          { label: "Data exata", style: "bg-navy-50 text-navy-600 ring-navy-100" },
  month:          { label: "Mês/ano", style: "bg-amber-50 text-amber-700 ring-amber-100" },
  year:           { label: "Ano aprox.", style: "bg-amber-50 text-amber-700 ring-amber-100" },
  unknown:        { label: "Desconhecida", style: "bg-terracotta-50 text-terracotta-700 ring-terracotta-100" },
  not_applicable: { label: "Não se aplica", style: "bg-navy-50 text-navy-400 ring-navy-100" },
};

function currentMode(field?: AssistedDateField): InputMode {
  if (!field) return "exact";
  if (field.status === "not_applicable") return "not_applicable";
  if (field.status === "to_discover") return "to_discover";
  if (field.status === "unknown") return "unknown";
  if (field.precision === "month") return "month";
  return "exact";
}

export default function AssistedDateInput({
  label,
  sublabel,
  value,
  onChange,
  allowNotApplicable = true,
}: Props) {
  const [mode, setMode] = useState<InputMode>(currentMode(value));
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [monthInput, setMonthInput] = useState(
    value?.precision === "month" && value.value
      ? value.value.slice(0, 7) // YYYY-MM
      : ""
  );
  const [exactInput, setExactInput] = useState(
    value?.precision === "exact" && value.value ? value.value : ""
  );

  const handleModeChange = (m: InputMode) => {
    setMode(m);
    setShowModeMenu(false);
    if (m === "unknown" || m === "to_discover" || m === "not_applicable") {
      onChange(buildAssistedDate("", m));
    } else if (m === "exact" && exactInput) {
      onChange(buildAssistedDate(exactInput, "exact"));
    } else if (m === "month" && monthInput) {
      const [y, mo] = monthInput.split("-");
      onChange(buildAssistedDate(`${mo}/${y}`, "month"));
    }
  };

  const handleExactChange = (v: string) => {
    setExactInput(v);
    if (v) onChange(buildAssistedDate(v, "exact"));
  };

  const handleMonthChange = (v: string) => {
    setMonthInput(v);
    if (v) {
      const [y, mo] = v.split("-");
      onChange(buildAssistedDate(`${mo}/${y}`, "month"));
    }
  };

  const badge = value ? PRECISION_BADGE[value.precision] : null;
  const modes: InputMode[] = ["exact", "month", "unknown", "to_discover", ...(allowNotApplicable ? ["not_applicable" as InputMode] : [])];

  const isNonDate = mode === "unknown" || mode === "to_discover" || mode === "not_applicable";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-navy-700">{label}</p>
          {sublabel && <p className="text-[10px] text-navy-400 leading-tight">{sublabel}</p>}
        </div>
        {badge && value && (
          <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-px text-[9.5px] font-medium ring-1 ${badge.style}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Modo selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowModeMenu((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-left text-[12px] text-navy-600 transition-colors hover:border-navy-200 focus:outline-none"
        >
          <span>{MODE_LABELS[mode]}</span>
          <svg className="h-3 w-3 text-navy-400" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showModeMenu && (
          <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-navy-100 bg-white shadow-md">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`flex w-full items-center px-3 py-2 text-left text-[12px] transition-colors hover:bg-navy-50 ${mode === m ? "font-medium text-navy-800" : "text-navy-600"}`}
              >
                {mode === m && (
                  <svg className="mr-2 h-3 w-3 text-navy-500" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {!( mode === m) && <span className="mr-2 w-3" />}
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input de data ou mensagem informativa */}
      {mode === "exact" && (
        <input
          type="date"
          value={exactInput}
          onChange={(e) => handleExactChange(e.target.value)}
          className="min-h-9 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-1.5 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
        />
      )}

      {mode === "month" && (
        <input
          type="month"
          value={monthInput}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="min-h-9 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-1.5 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
        />
      )}

      {isNonDate && (
        <p className="rounded-xl border border-navy-100/60 bg-navy-50/50 px-3 py-2 text-[11.5px] text-navy-500">
          {mode === "unknown" && "Sem data definida — o app não gerará alertas para este campo."}
          {mode === "to_discover" && "Uma pendência será criada para lembrar de buscar esta informação."}
          {mode === "not_applicable" && "Campo dispensado — não prejudica a saúde operacional."}
        </p>
      )}
    </div>
  );
}
