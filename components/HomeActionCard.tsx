"use client";

import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: number;
  onClick?: () => void;
};

export default function HomeActionCard({ icon, title, subtitle, badge, onClick }: Props) {
  return (
    <section className="px-5 pb-3 sm:px-6">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3.5 rounded-[18px] border border-navy-100/70 bg-white px-4 py-4 text-left shadow-card ${
          onClick
            ? "transition-all hover:shadow-card-md active:scale-[0.99]"
            : "pointer-events-none"
        }`}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-50">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-navy-800">{title}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-navy-500">{subtitle}</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {badge !== undefined && badge > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-green-500 px-1.5 text-[11px] font-bold leading-none text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
          {onClick && (
            <svg
              className="h-4 w-4 text-navy-300"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
    </section>
  );
}
