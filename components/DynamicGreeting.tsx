"use client";

import { useEffect, useState } from "react";
import { getPendenciasAbertas, getAgendaEvents } from "@/lib/session";

function buildContextLine(): string {
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const vencidas = getPendenciasAbertas().filter((p) => !!p.dueDate && p.dueDate < today);
  const estaSemana = getAgendaEvents().filter(
    (e) => !e.completedAt && e.date >= today && e.date <= nextWeek
  );

  if (vencidas.length > 0) {
    return `${vencidas.length} pendência${vencidas.length > 1 ? "s" : ""} já passou do prazo.`;
  }
  if (estaSemana.length > 0) {
    return `${estaSemana.length} compromisso${estaSemana.length > 1 ? "s" : ""} nos próximos 7 dias.`;
  }
  return "Nenhuma urgência identificada hoje.";
}

export default function DynamicGreeting({ condoName }: { condoName: string }) {
  const [contextLine, setContextLine] = useState<string | null>(null);

  useEffect(() => {
    setContextLine(buildContextLine());
  }, [condoName]);

  if (!contextLine) return null;

  return (
    <div className="px-5 pb-1 pt-0 sm:px-6">
      <p className="text-[12px] font-medium leading-snug text-navy-500">
        {contextLine}
      </p>
    </div>
  );
}
