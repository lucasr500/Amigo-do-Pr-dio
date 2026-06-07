import type { ButtonHTMLAttributes, ReactNode } from "react";

type InlineActionVariant = "primary" | "secondary" | "quiet" | "danger";

type InlineActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: InlineActionVariant;
};

const VARIANT_CLASS: Record<InlineActionVariant, string> = {
  primary: "bg-navy-800 text-white shadow-card hover:bg-navy-900",
  secondary: "border border-navy-100 bg-white/[0.86] text-navy-600 hover:bg-white hover:text-navy-800",
  quiet: "text-navy-500 hover:bg-navy-50 hover:text-navy-700",
  danger: "border border-terracotta-200 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100",
};

export default function InlineAction({
  children,
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: InlineActionProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-8 items-center justify-center rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-navy-300/40 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
