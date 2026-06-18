"use client";

import { useState, useEffect } from "react";
import { buildCentralDigitalSummary } from "@/lib/community-summary";

type Card = {
  label: string;
  value: number;
  sub?: string;
  color: string;
  icon: string;
  alert?: boolean;
};

export default function CentralDigitalHub() {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    try {
      const summary = buildCentralDigitalSummary();

      setCards([
        {
          label: "Comunicados oficiais",
          value: summary.officialPosts,
          sub: summary.residentPosts > 0 ? `+${summary.residentPosts} participação${summary.residentPosts !== 1 ? "ões" : ""}` : undefined,
          color: "text-navy-700",
          icon: "📢",
        },
        {
          label: "Solicitações abertas",
          value: summary.openRequests,
          sub: summary.urgentRequests > 0 ? `${summary.urgentRequests} urgente${summary.urgentRequests !== 1 ? "s" : ""}` : (summary.totalRequests > 0 ? `${summary.totalRequests} total` : undefined),
          color: summary.urgentRequests > 0 ? "text-red-600" : summary.openRequests > 0 ? "text-amber-600" : "text-navy-700",
          icon: "📬",
          alert: summary.urgentRequests > 0,
        },
        {
          label: "Avisos de obra",
          value: summary.workNotices,
          sub: summary.workNotices > 0 ? "Aguardam triagem" : undefined,
          color: summary.workNotices > 0 ? "text-orange-600" : "text-navy-700",
          icon: "🔨",
          alert: summary.workNotices > 0,
        },
        {
          label: "Sugestões",
          value: summary.suggestions,
          sub: summary.suggestions > 0 ? "Recebidas" : undefined,
          color: summary.suggestions > 0 ? "text-sage-700" : "text-navy-700",
          icon: "💬",
        },
        {
          label: "Reservas pendentes",
          value: summary.pendingReservations,
          sub: summary.upcomingReservations > 0 ? `${summary.upcomingReservations} próxima${summary.upcomingReservations !== 1 ? "s" : ""}` : (summary.totalReservations > 0 ? `${summary.totalReservations} total` : undefined),
          color: summary.pendingReservations > 0 ? "text-amber-600" : "text-navy-700",
          icon: "🗓️",
          alert: summary.pendingReservations > 0,
        },
        {
          label: "Enquetes ativas",
          value: summary.activePolls,
          sub: undefined,
          color: summary.activePolls > 0 ? "text-blue-600" : "text-navy-700",
          icon: "📊",
        },
        {
          label: "Documentos públicos",
          value: summary.publicDocuments,
          sub: summary.publicDocuments > 0 ? "Disponíveis" : undefined,
          color: summary.publicDocuments > 0 ? "text-navy-700" : "text-navy-500",
          icon: "📄",
        },
      ]);
    } catch { /* silencioso */ }
  }, []);

  if (cards.length === 0) return null;

  const hasAlerts = cards.some((c) => c.alert);
  const totalActions = cards.filter((c) => c.alert).reduce((sum, c) => sum + c.value, 0);

  return (
    <section className="px-5 pb-2 sm:px-6 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Visão Geral</p>
          <h2 className="mt-0.5 text-[14px] font-semibold text-navy-800">Comunicação</h2>
          {hasAlerts && (
            <p className="mt-1 text-[11px] text-amber-700">
              {totalActions} item{totalActions !== 1 ? "ns" : ""} aguardando ação da gestão.
            </p>
          )}
        </div>

        <div className="border-t border-navy-50 grid grid-cols-2 divide-x divide-y divide-navy-50 sm:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className={`px-3.5 py-3 ${card.alert ? "bg-amber-50/40" : ""}`}>
              <div className="flex items-start gap-1.5">
                <span className="text-[14px] leading-none mt-0.5 flex-shrink-0">{card.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[17px] font-bold leading-none ${card.color}`}>{card.value}</p>
                  <p className="mt-0.5 text-[9.5px] font-medium text-navy-500 leading-snug">{card.label}</p>
                  {card.sub && (
                    <p className="mt-0.5 text-[9px] text-navy-400 truncate">{card.sub}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-navy-50 px-5 py-2">
          <p className="text-[10px] text-navy-400 leading-relaxed">
            Canal oficial do condomínio. Use as abas abaixo para publicar, responder e acompanhar.
          </p>
        </div>
      </div>
    </section>
  );
}
