import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-navy-800 text-white shadow-card hover:bg-navy-900",
  secondary: "border border-navy-100 bg-white/[0.88] text-navy-600 hover:bg-white hover:text-navy-800",
  danger: "border border-terracotta-200 bg-terracotta-50 text-terracotta-800 hover:bg-terracotta-100",
} as const;

export default function ActionButton({ children, variant = "primary", className = "", ...props }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
