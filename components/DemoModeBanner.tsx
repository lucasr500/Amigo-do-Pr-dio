"use client";

type Props = {
  onExit: () => void;
};

export default function DemoModeBanner({ onExit }: Props) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 text-[13px]" aria-hidden="true">👁️</span>
        <p className="text-[12px] font-semibold leading-snug text-white">
          Exemplo fictício — dados do Edifício Primavera
        </p>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="flex-shrink-0 rounded-full bg-white/20 px-3 py-1 text-[11.5px] font-semibold text-white transition-colors hover:bg-white/30 active:scale-[0.97]"
      >
        Sair
      </button>
    </div>
  );
}
