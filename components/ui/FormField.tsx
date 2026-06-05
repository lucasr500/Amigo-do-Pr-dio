import type { ReactNode } from "react";

export type FormFieldProps = {
  label: string;
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
};

export default function FormField({
  label,
  children,
  htmlFor,
  hint,
  error,
  className = "",
}: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`block space-y-1 ${className}`}>
      <span className="text-[11px] font-medium text-navy-500">{label}</span>
      {children}
      {error ? (
        <span className="block text-[10.5px] leading-snug text-terracotta-700">{error}</span>
      ) : hint ? (
        <span className="block text-[10.5px] leading-snug text-navy-400">{hint}</span>
      ) : null}
    </label>
  );
}
