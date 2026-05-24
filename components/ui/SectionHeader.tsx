"use client";

type Props = {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export default function SectionHeader({ label, title, subtitle, className = "" }: Props) {
  return (
    <div className={`px-5 pb-2 pt-4 sm:px-6 ${className}`}>
      {label && (
        <p className="mb-0.5 text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
          {label}
        </p>
      )}
      <p className="font-display text-[18px] font-semibold leading-snug text-navy-800">{title}</p>
      {subtitle && (
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-navy-500">{subtitle}</p>
      )}
    </div>
  );
}
