import type { ReactNode } from "react";

type PanelTone = "default" | "muted" | "warning" | "danger" | "success";

export type PanelProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  tone?: PanelTone;
  className?: string;
  bodyClassName?: string;
};

const TONE_CLASS: Record<PanelTone, string> = {
  default: "border-navy-100/70 bg-white/[0.92] shadow-card",
  muted: "border-navy-100/70 bg-navy-50/40",
  warning: "border-amber-200/80 bg-amber-50/60",
  danger: "border-terracotta-200/80 bg-terracotta-50/65",
  success: "border-sage-200/80 bg-sage-50/65",
};

export default function Panel({
  title,
  subtitle,
  eyebrow,
  children,
  action,
  tone = "default",
  className = "",
  bodyClassName = "",
}: PanelProps) {
  return (
    <div className={`rounded-lg border ${TONE_CLASS[tone]} ${className}`}>
      {(title || subtitle || eyebrow || action) && (
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-0.5 text-[14px] font-semibold leading-snug text-navy-800">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-[11.5px] leading-relaxed text-navy-500">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName || (title || subtitle || eyebrow || action ? "px-4 pb-4" : "p-4")}>
        {children}
      </div>
    </div>
  );
}
