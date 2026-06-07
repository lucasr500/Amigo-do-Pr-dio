import type { ReactNode } from "react";

type AlertTone = "info" | "warning" | "danger" | "success";

export type AlertBoxProps = {
  tone: AlertTone;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

const TONE_CLASS: Record<AlertTone, { box: string; dot: string; title: string; text: string }> = {
  info: {
    box: "border-navy-100 bg-navy-50/45",
    dot: "bg-navy-400",
    title: "text-navy-800",
    text: "text-navy-500",
  },
  warning: {
    box: "border-amber-200/80 bg-amber-50/70",
    dot: "bg-amber-500",
    title: "text-amber-900",
    text: "text-amber-800",
  },
  danger: {
    box: "border-terracotta-200/80 bg-terracotta-50/70",
    dot: "bg-terracotta-500",
    title: "text-terracotta-900",
    text: "text-terracotta-800",
  },
  success: {
    box: "border-sage-200/80 bg-sage-50/70",
    dot: "bg-sage-500",
    title: "text-sage-900",
    text: "text-sage-800",
  },
};

export default function AlertBox({
  tone,
  title,
  description,
  action,
  className = "",
}: AlertBoxProps) {
  const toneClass = TONE_CLASS[tone];
  return (
    <div className={`rounded-lg border px-3.5 py-3 ${toneClass.box} ${className}`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${toneClass.dot}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] font-semibold leading-snug ${toneClass.title}`}>
            {title}
          </p>
          {description && (
            <p className={`mt-0.5 text-[11.5px] leading-relaxed ${toneClass.text}`}>
              {description}
            </p>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
