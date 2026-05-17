"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/session";
import BrandMark from "@/components/BrandMark";

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
    <header className="px-5 pb-5 pt-[calc(env(safe-area-inset-top,0px)+0.875rem)] sm:px-6 sm:pb-6">
      <div className="flex items-center gap-3.5 animate-fade-in">
        <BrandMark className="h-11 w-11 flex-shrink-0 shadow-[0_1px_2px_rgba(12,29,39,0.08),0_10px_24px_-16px_rgba(12,29,39,0.55)]" />

        <div className="flex flex-col leading-tight">
          <h1 className="font-display text-[19px] font-semibold text-navy-800 sm:text-[20px]">
            Amigo do Prédio
          </h1>
          <p className="mt-0.5 max-w-[310px] truncate text-[12px] text-navy-500 transition-all duration-300">
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
