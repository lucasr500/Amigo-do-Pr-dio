import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-navy-700 text-white hover:bg-navy-800",
  secondary: "border border-navy-100 bg-white text-navy-600 hover:bg-navy-50",
  danger: "border border-terracotta-200 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100",
} as const;

export default function ActionButton({ children, variant = "primary", className = "", ...props }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
