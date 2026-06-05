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

  return (
    <section id={id} className="scroll-mt-3" aria-labelledby={`${id}-heading`}>
      <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-5 sm:px-6">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-navy-300">
              {eyebrow}
            </p>
          )}
          <h2
            id={`${id}-heading`}
            className="text-[13px] font-semibold leading-snug text-navy-700"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-navy-400">{subtitle}</p>
          )}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={`${id}-content`}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-600 active:scale-[0.95]"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sr-only">{open ? "Recolher" : "Expandir"} {title}</span>
          </button>
        )}
      </div>

      <div className="mx-5 mb-2 h-px bg-navy-100/50 sm:mx-6" aria-hidden="true" />

      {open && (
        <div id={`${id}-content`}>
          {children}
        </div>
      )}
    </section>
  );
}
