import type { ReactNode } from "react";

type MetricStatus = "neutral" | "good" | "warning" | "danger";

export type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  status?: MetricStatus;
  onClick?: () => void;
  className?: string;
  actionLabel?: string;
  children?: ReactNode;
};

const STATUS_CLASS: Record<MetricStatus, string> = {
  neutral: "bg-white/90 text-navy-800 ring-navy-100/80",
  good: "bg-sage-50/80 text-sage-800 ring-sage-100",
  warning: "bg-amber-50/70 text-amber-800 ring-amber-100",
  danger: "bg-terracotta-50/70 text-terracotta-800 ring-terracotta-100",
};

export default function MetricCard({
  label,
  value,
  detail,
  status = "neutral",
  onClick,
  className = "",
  actionLabel,
  children,
}: MetricCardProps) {
  const content = (
    <>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.10em] text-navy-400">
        {label}
      </span>
      <span className="block text-[15px] font-semibold leading-none">
        {value}
      </span>
      {detail && (
        <span className="mt-1 block text-[10.5px] leading-snug text-navy-500">
          {detail}
        </span>
      )}
      {children}
    </>
  );

  const baseClass = `min-h-[74px] rounded-lg px-3.5 py-3 text-left ring-1 shadow-card transition-all ${STATUS_CLASS[status]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel ?? `${label}: ${value}${detail ? `, ${detail}` : ""}`}
        className={`${baseClass} active:scale-[0.99] hover:-translate-y-px hover:bg-white focus:outline-none focus:ring-2 focus:ring-navy-300/40`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
