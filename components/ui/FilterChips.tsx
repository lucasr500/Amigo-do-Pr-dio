export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type FilterChipsProps<T extends string> = {
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
};

export default function FilterChips<T extends string>({
  value,
  options,
  onChange,
  ariaLabel = "Filtros",
  className = "",
}: FilterChipsProps<T>) {
  return (
    <div
      className={`no-scrollbar flex gap-1.5 overflow-x-auto pb-1 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-navy-300/40 ${
              active
                ? "bg-navy-700 text-white"
                : "border border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={active ? "ml-1 text-white/75" : "ml-1 text-navy-300"}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
