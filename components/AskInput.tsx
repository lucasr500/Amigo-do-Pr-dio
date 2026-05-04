"use client";

import { FormEvent, KeyboardEvent } from "react";

type AskInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export default function AskInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: AskInputProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) onSubmit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSubmit();
    }
  };

  return (
    <section className="px-5 pb-5 sm:px-6 sm:pb-6 animate-fade-in-up stagger-2">
      <form
        onSubmit={handleSubmit}
        className="group relative rounded-2xl bg-white shadow-[0_1px_2px_rgba(31,49,71,0.04),0_8px_24px_-12px_rgba(31,49,71,0.12)] ring-1 ring-navy-100 transition-all duration-300 focus-within:ring-2 focus-within:ring-navy-800/20 focus-within:shadow-[0_1px_2px_rgba(31,49,71,0.04),0_12px_32px_-12px_rgba(31,49,71,0.18)]"
      >
        <label htmlFor="ask-question" className="sr-only">
          Faça sua pergunta
        </label>

        <textarea
          id="ask-question"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Posso aplicar multa sem assembleia?"
          rows={2}
          disabled={isLoading}
          className="w-full resize-none rounded-2xl bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed text-navy-800 placeholder:text-navy-300 focus:outline-none disabled:opacity-60 sm:text-base"
        />

        <div className="flex items-center justify-between gap-2 px-2 pb-2 sm:px-3 sm:pb-3">
          <p className="hidden pl-2 text-[11.5px] text-navy-400 sm:block">
            Pressione Enter para enviar
          </p>
          <span className="sm:hidden" />

          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="group/btn inline-flex items-center gap-2 rounded-xl bg-navy-800 px-5 py-2.5 text-[14px] font-medium text-cream-50 shadow-sm transition-all duration-200 hover:bg-navy-900 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-navy-200 disabled:hover:shadow-sm sm:text-[14.5px]"
          >
            {isLoading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    opacity="0.25"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                Pensando…
              </>
            ) : (
              <>
                Perguntar
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
