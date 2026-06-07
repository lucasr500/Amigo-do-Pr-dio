"use client";

import { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";

type CardProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const PADDING = {
  none: "",
  sm:   "px-3 py-3",
  md:   "px-4 py-4",
  lg:   "px-5 py-5",
};

export default function Card<T extends ElementType = "div">({
  as,
  children,
  className = "",
  padding = "md",
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={`rounded-lg border border-navy-100/70 bg-white/[0.92] shadow-card ${PADDING[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
