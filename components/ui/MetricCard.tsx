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
  neutral: "bg-navy-50/60 text-navy-800 ring-navy-100",
  good: "bg-teal-50/70 text-teal-700 ring-teal-100",
  warning: "bg-amber-50/70 text-amber-700 ring-amber-100",
  danger: "bg-terracotta-50/70 text-terracotta-700 ring-terracotta-100",
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
      <span className="block text-[14px] font-bold leading-none">
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

  const baseClass = `min-h-[70px] rounded-[14px] px-3 py-2.5 text-left ring-1 transition-all ${STATUS_CLASS[status]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel ?? `${label}: ${value}${detail ? `, ${detail}` : ""}`}
        className={`${baseClass} active:scale-[0.98] hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-navy-300/40`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
