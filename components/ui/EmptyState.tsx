import type { ReactNode } from "react";

type EmptyStateTone = "neutral" | "positive" | "attention";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Glifo opcional. Quando omitido, um ícone neutro de "caixa vazia" é usado. */
  icon?: ReactNode;
  /** Linha discreta de orientação — responde "o que faço agora?". */
  hint?: string;
  /** Acento sutil do ícone. Mantém a estética serena (premium = clareza, não enfeite). */
  tone?: EmptyStateTone;
};

const TONE_RING: Record<EmptyStateTone, string> = {
  neutral:   "bg-navy-50 text-navy-400 ring-navy-100",
  positive:  "bg-emerald-50 text-emerald-500 ring-emerald-100",
  attention: "bg-amber-50 text-amber-500 ring-amber-100",
};

function DefaultIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m4 8.5 8 4.5 8-4.5M12 13v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  hint,
  tone = "neutral",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-200/80 bg-white/[0.72] px-4 py-6 text-center">
      <span
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ${TONE_RING[tone]}`}
        aria-hidden="true"
      >
        {icon ?? <DefaultIcon />}
      </span>
      <p className="text-[13px] font-semibold text-navy-800">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[300px] text-[11.5px] leading-relaxed text-navy-500">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3.5 rounded-full bg-navy-800 px-4 py-1.5 text-[11.5px] font-semibold text-white shadow-card transition-all hover:bg-navy-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/50"
        >
          {actionLabel}
        </button>
      )}
      {hint && (
        <p className="mx-auto mt-3 max-w-[300px] text-[10.5px] leading-relaxed text-navy-400">{hint}</p>
      )}
    </div>
  );
}
