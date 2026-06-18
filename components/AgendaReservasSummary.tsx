"use client";

import { useEffect, useState } from "react";
import { getApprovedReservations, getPendingReservations } from "@/lib/community-reservas";
import type { SpaceReservation } from "@/lib/community-types";

type Props = { refreshKey?: number };

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", weekday: "short" });
}

export default function AgendaReservasSummary({ refreshKey }: Props) {
  const [approved, setApproved] = useState<SpaceReservation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = getApprovedReservations()
      .filter((r) => r.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
    setApproved(upcoming);
    setPendingCount(getPendingReservations().length);
  }, [refreshKey]);

  return (
    <div className="px-5 pb-4 sm:px-6">
      {/* Header */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-navy-400">Espaços comuns</p>
        <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Reservas aprovadas</h2>
      </div>

      {approved.length > 0 ? (
        <div className="space-y-2">
          {approved.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white/90 px-3.5 py-3 shadow-card"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sage-50">
                <svg className="h-4 w-4 text-sage-700" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-navy-800">{r.space}</p>
                <p className="text-[11px] text-navy-500">
                  {formatDate(r.date)}{r.unit ? ` · Unidade ${r.unit}` : ""}
                </p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-sage-50 px-2.5 py-0.5 text-[10px] font-semibold text-sage-700">
                Aprovada
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white/80 px-4 py-5 text-center">
          <p className="text-[13px] text-navy-500">Nenhuma reserva aprovada nos próximos dias.</p>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
          <p className="text-[12px] text-amber-800">
            {pendingCount} reserva{pendingCount !== 1 ? "s" : ""} aguardando aprovação. Gerencie na Comunicação.
          </p>
        </div>
      )}

      <div className="mt-3 rounded-2xl border border-navy-100 bg-navy-50/60 px-4 py-3">
        <p className="text-[11.5px] text-navy-500">
          Aprovações e histórico completo disponíveis em <span className="font-semibold text-navy-700">Prédio → Comunicação → Reservas</span>.
        </p>
      </div>
    </div>
  );
}
