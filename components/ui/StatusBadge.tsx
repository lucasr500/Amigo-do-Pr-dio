"use client";

import { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "pending";

type Props = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

const STYLES: Record<Variant, string> = {
  success: "bg-green-100  text-green-700",
  warning: "bg-amber-100  text-amber-700",
  danger:  "bg-red-100    text-red-600",
  info:    "bg-navy-100   text-navy-700",
  neutral: "bg-gray-100   text-gray-600",
  pending: "bg-cream-100  text-navy-500",
};

export default function StatusBadge({ variant, children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
