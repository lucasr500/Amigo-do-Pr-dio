"use client";

import { useEffect, useState } from "react";
import { getPendenciasAbertas } from "@/lib/session";
import HomeActionCard from "@/components/HomeActionCard";

function IconClipboard() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-navy-600" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="12" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 5V4a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  refreshKey?: number;
  onNavigateToPendencias?: () => void;
};

export default function HomeQuickStats({ refreshKey, onNavigateToPendencias }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [pendCount, setPendCount] = useState(0);

  useEffect(() => {
    const all = getPendenciasAbertas();
    const systemOrigins = new Set(["guidance", "response", "memoria", "ocorrencia"]);
    setPendCount(all.filter((p) => p.origem && systemOrigins.has(p.origem)).length);
    setHydrated(true);
  }, [refreshKey]);

  const pendSubtitle = !hydrated
    ? "Carregando..."
    : pendCount === 0
    ? "Alertas e tarefas que exigem acompanhamento."
    : `${pendCount} ${pendCount === 1 ? "item aguardando" : "itens aguardando"} ação`;

  return (
    <HomeActionCard
      icon={<IconClipboard />}
      title="Pendências"
      subtitle={pendSubtitle}
      badge={pendCount > 0 ? pendCount : undefined}
      onClick={onNavigateToPendencias}
    />
  );
}
