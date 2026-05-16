"use client";

import { useEffect, useState } from "react";
import { getSessionMeta, hasMemoriaOperacional } from "@/lib/session";

function formatLastVisit(daysSince: number): string {
  if (daysSince === 1) return "Última visita ontem";
  if (daysSince <= 6)  return `Última visita há ${daysSince} dias`;
  if (daysSince <= 13) return "Última visita há 1 semana";
  if (daysSince <= 29) return `Última visita há ${Math.floor(daysSince / 7)} semanas`;
  return `Última visita há ${Math.floor(daysSince / 30)} mês${Math.floor(daysSince / 30) > 1 ? "es" : ""}`;
}

type Props = {
  refreshKey?: number;
};

export default function HomeContextual({ refreshKey }: Props) {
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const meta = getSessionMeta();
    setHasData(hasMemoriaOperacional());
    if (meta.previousOpenedAt) {
      const ds = Math.floor(
        (Date.now() - new Date(meta.previousOpenedAt).getTime()) / 86400000
      );
      if (ds >= 1) setDaysSince(ds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (daysSince === null) return null;

  if (hasData) {
    return (
      <section className="px-5 pb-2 sm:px-6">
        <p className="text-[10.5px] text-navy-400">
          {formatLastVisit(daysSince)}
        </p>
      </section>
    );
  }

  // Retorno sem dados configurados — labela o estado passivamente
  return (
    <section className="px-5 pb-2 sm:px-6">
      <p className="text-[10.5px] text-navy-400">
        {formatLastVisit(daysSince)} · Monitoramento inativo
      </p>
    </section>
  );
}
