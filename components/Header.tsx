"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/session";

type Props = {
  refreshKey?: number;
};

export default function Header({ refreshKey }: Props) {
  const [subtitle, setSubtitle] = useState("Orientações condominiais");

  useEffect(() => {
    const profile = getProfile();
    setSubtitle(profile?.nomeCondominio ?? "Orientações condominiais");
  }, [refreshKey]);

  return (
    <header className="px-5 pt-8 pb-5 sm:px-6 sm:pt-10 sm:pb-6">
      <div className="flex items-center gap-3 animate-fade-in">
        {/* Logo monograma */}
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[13px] bg-navy-800 shadow-[0_1px_4px_rgba(31,49,71,0.12),0_4px_14px_-4px_rgba(31,49,71,0.22)]">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-cream-50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="5" y="7" width="6" height="13" rx="0.5" fill="currentColor" opacity="0.95" />
            <rect x="13" y="4" width="6" height="16" rx="0.5" fill="currentColor" />
            <rect x="6.5" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="8.3" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="6.5" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="8.3" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="14.5" y="6.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="16.3" y="6.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="14.5" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="16.3" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="14.5" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="16.3" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <circle cx="19.5" cy="5" r="1.6" fill="#6fa97c" />
          </svg>
        </div>

        <div className="flex flex-col leading-tight">
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-navy-800 sm:text-[19px]">
            Amigo do Prédio
          </h1>
          <p className="text-[11.5px] tracking-[0.01em] text-navy-400 transition-all duration-300">
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
