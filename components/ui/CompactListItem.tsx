import type { ReactNode } from "react";

type CompactListItemProps = {
  title: string;
  description?: string;
  meta?: string;
  indicatorClassName?: string;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function CompactListItem({
  title,
  description,
  meta,
  indicatorClassName = "bg-navy-300",
  action,
  onClick,
  className = "",
}: CompactListItemProps) {
  const content = (
    <>
      <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${indicatorClassName}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium leading-snug text-navy-800">{title}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-navy-500">{description}</span>
        )}
        {meta && (
          <span className="mt-0.5 block text-[10.5px] leading-snug text-navy-400">{meta}</span>
        )}
      </span>
      {action && <span className="flex-shrink-0">{action}</span>}
    </>
  );

  const baseClass = `flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} transition-colors hover:bg-navy-50/70 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-navy-300/40`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
