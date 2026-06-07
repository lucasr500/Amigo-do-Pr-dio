"use client";

import { useState } from "react";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  defaultOpen?: boolean;
  priority?: "high" | "normal" | "low";
  children: React.ReactNode;
};

export default function CondominioSection({
  id,
  title,
  subtitle,
  eyebrow,
  defaultOpen,
  priority = "normal",
  children,
}: Props) {
  const collapsible = priority !== "high";
  const initialOpen = priority === "high" ? true : (defaultOpen ?? priority === "normal");
  const [open, setOpen] = useState(initialOpen);

  const isHigh = priority === "high";

  return (
    <section id={id} className="scroll-mt-3" aria-labelledby={`${id}-heading`}>
      <div className={`flex items-center justify-between gap-3 px-5 pb-1.5 sm:px-6 ${isHigh ? "pt-6" : "pt-5"}`}>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-navy-300">
              {eyebrow}
            </p>
          )}
          <h2
            id={`${id}-heading`}
            className={`font-semibold leading-snug text-navy-800 ${isHigh ? "text-[15px]" : "text-[13.5px]"}`}
          >
            {title}
          </h2>
          {subtitle && open && !collapsible && (
            <p className="mt-0.5 text-[11px] leading-snug text-navy-400">{subtitle}</p>
          )}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={`${id}-content`}
            aria-label={`${open ? "Recolher" : "Expandir"} ${title}`}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-600 active:scale-[0.95]"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mx-5 mb-2 h-px bg-navy-100/60 sm:mx-6" aria-hidden="true" />

      {open && (
        <div id={`${id}-content`}>
          {children}
        </div>
      )}
    </section>
  );
}
