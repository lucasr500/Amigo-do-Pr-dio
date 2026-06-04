type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-[14px] border border-dashed border-navy-200 bg-navy-50/30 px-3 py-4 text-center">
      <p className="text-[12px] font-semibold text-navy-700">{title}</p>
      <p className="mx-auto mt-1 max-w-[280px] text-[11px] leading-relaxed text-navy-400">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-full bg-navy-700 px-3.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-navy-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
