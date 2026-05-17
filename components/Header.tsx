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
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[13px] bg-navy-700 shadow-[0_1px_4px_rgba(35,75,99,0.14),0_4px_14px_-4px_rgba(35,75,99,0.26)]">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-cream-100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Prédio esquerdo — volume menor */}
            <rect x="4" y="9" width="6" height="11" rx="0.4" fill="currentColor" opacity="0.90" />
            {/* Prédio direito — volume maior */}
            <rect x="12" y="5" width="8" height="15" rx="0.4" fill="currentColor" />
            {/* Janelas prédio esquerdo */}
            <rect x="5.2" y="10.8" width="1.4" height="1.4" fill="#234B63" />
            <rect x="7.4" y="10.8" width="1.4" height="1.4" fill="#234B63" />
            <rect x="5.2" y="13.2" width="1.4" height="1.4" fill="#234B63" />
            <rect x="7.4" y="13.2" width="1.4" height="1.4" fill="#234B63" />
            {/* Janelas prédio direito */}
            <rect x="13.2" y="6.8" width="1.4" height="1.4" fill="#234B63" />
            <rect x="15.8" y="6.8" width="1.4" height="1.4" fill="#234B63" />
            <rect x="13.2" y="9.2" width="1.4" height="1.4" fill="#234B63" />
            <rect x="15.8" y="9.2" width="1.4" height="1.4" fill="#234B63" />
            <rect x="13.2" y="11.6" width="1.4" height="1.4" fill="#234B63" />
            <rect x="15.8" y="11.6" width="1.4" height="1.4" fill="#234B63" />
            {/* Ponto terracotta — acento de identidade */}
            <circle cx="19.5" cy="5" r="1.6" fill="#C97852" />
          </svg>
        </div>

        <div className="flex flex-col leading-tight">
          <h1 className="font-display text-[18px] font-semibold tracking-tight text-navy-700 sm:text-[19px]">
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
