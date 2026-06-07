type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-navy-200/80 bg-white/[0.72] px-4 py-5 text-center">
      <p className="text-[12.5px] font-semibold text-navy-800">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[290px] text-[11.5px] leading-relaxed text-navy-500">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-full bg-navy-800 px-3.5 py-1.5 text-[11.5px] font-semibold text-white shadow-card transition-all hover:bg-navy-900 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
