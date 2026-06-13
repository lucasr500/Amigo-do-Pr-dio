"use client";

type Props = {
  onExit: () => void;
};

export default function DemoModeBanner({ onExit }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-500/40 bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white/25" aria-hidden="true">
          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[12px] font-semibold text-white">
            Modo demonstração — dados fictícios
          </p>
          <p className="truncate text-[10.5px] text-white/80">
            Você está explorando o Edifício Primavera, um condomínio de exemplo.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onExit}
        aria-label="Sair do modo demonstração"
        className="flex-shrink-0 rounded-full bg-white/20 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/30 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        Sair do exemplo
      </button>
    </div>
  );
}
