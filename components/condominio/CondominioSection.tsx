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
    <section id={id} className="scroll-mt-4" aria-labelledby={`${id}-heading`}>
      <div className={`px-5 sm:px-6 ${isHigh ? "pt-6" : "pt-5"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-400">
                {eyebrow}
              </p>
            )}
            <h2
              id={`${id}-heading`}
              className={`font-display font-semibold leading-snug text-navy-800 ${isHigh ? "text-[17px]" : "text-[15px]"}`}
            >
              {title}
            </h2>
            {subtitle && (
              <p className={`mt-1 max-w-[34rem] text-[12px] leading-relaxed text-navy-500 ${!open && collapsible ? "line-clamp-1" : ""}`}>
                {subtitle}
              </p>
            )}
          </div>
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={`${id}-content`}
              aria-label={`${open ? "Recolher" : "Expandir"} ${title}`}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-navy-100 bg-white/[0.72] text-navy-400 shadow-card transition-colors hover:bg-white hover:text-navy-700 active:scale-[0.97]"
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
      </div>

      <div className="mx-5 mb-3 mt-3 h-px bg-navy-100/60 sm:mx-6" aria-hidden="true" />

      {open && (
        <div id={`${id}-content`}>
          {children}
        </div>
      )}
    </section>
  );
}
