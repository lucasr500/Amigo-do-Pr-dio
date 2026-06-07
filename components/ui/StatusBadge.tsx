"use client";

import { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "pending";

type Props = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

const STYLES: Record<Variant, string> = {
  success: "border-sage-200 bg-sage-50 text-sage-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger:  "border-terracotta-200 bg-terracotta-50 text-terracotta-800",
  info:    "border-navy-100 bg-navy-50 text-navy-700",
  neutral: "border-navy-100 bg-white text-navy-500",
  pending: "border-cream-200 bg-cream-50 text-navy-500",
};

export default function StatusBadge({ variant, children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-semibold leading-none ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
