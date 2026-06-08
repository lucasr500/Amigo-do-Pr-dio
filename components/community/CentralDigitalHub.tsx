"use client";

import { useState, useEffect } from "react";
import { getPublishedPosts } from "@/lib/community-posts";
import { getRequestSummary } from "@/lib/community-requests";
import { getReservationSummary } from "@/lib/community-reservas";
import { getPolls } from "@/lib/community-polls";

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
      const posts = getPublishedPosts();
      const officialPosts = posts.filter((p) => p.origin !== "morador").length;
      const residentPosts = posts.filter((p) => p.origin === "morador").length;

      const req = getRequestSummary();
      const res = getReservationSummary();
      const activePolls = getPolls().filter((p) => p.status === "ativa").length;

      setCards([
        {
          label: "Posts Oficiais",
          value: officialPosts,
          sub: residentPosts > 0 ? `+${residentPosts} participação${residentPosts !== 1 ? "ões" : ""}` : undefined,
          color: "text-navy-700",
          icon: "📢",
        },
        {
          label: "Solicitações Abertas",
          value: req.open,
          sub: req.urgent > 0 ? `${req.urgent} urgente${req.urgent !== 1 ? "s" : ""}` : (req.total > 0 ? `${req.total} total` : undefined),
          color: req.urgent > 0 ? "text-red-600" : req.open > 0 ? "text-amber-600" : "text-navy-700",
          icon: "📬",
          alert: req.urgent > 0,
        },
        {
          label: "Reservas Pendentes",
          value: res.pending,
          sub: res.upcoming > 0 ? `${res.upcoming} próxima${res.upcoming !== 1 ? "s" : ""}` : (res.total > 0 ? `${res.total} total` : undefined),
          color: res.pending > 0 ? "text-amber-600" : "text-navy-700",
          icon: "🗓️",
          alert: res.pending > 0,
        },
        {
          label: "Enquetes Ativas",
          value: activePolls,
          sub: undefined,
          color: activePolls > 0 ? "text-blue-600" : "text-navy-700",
          icon: "📊",
        },
      ]);
    } catch { /* silencioso */ }
  }, []);

  if (cards.length === 0) return null;

  const hasAlerts = cards.some((c) => c.alert);

  return (
    <section className="px-5 pb-2 sm:px-6 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Visão Geral</p>
          <h2 className="mt-0.5 text-[14px] font-semibold text-navy-800">Central Digital</h2>
          {hasAlerts && (
            <p className="mt-1 text-[11px] text-amber-700">
              Há itens que precisam de ação da gestão.
            </p>
          )}
        </div>

        <div className="border-t border-navy-50 grid grid-cols-2 divide-x divide-y divide-navy-50">
          {cards.map((card) => (
            <div key={card.label} className={`px-4 py-3 ${card.alert ? "bg-amber-50/40" : ""}`}>
              <div className="flex items-start gap-2">
                <span className="text-[16px] leading-none mt-0.5">{card.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[18px] font-bold leading-none ${card.color}`}>{card.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-navy-500 leading-snug">{card.label}</p>
                  {card.sub && (
                    <p className="mt-0.5 text-[9.5px] text-navy-400 truncate">{card.sub}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-navy-50 px-5 py-2">
          <p className="text-[10px] text-navy-400 leading-relaxed">
            Dados locais. Acesse as abas abaixo para gerenciar cada módulo.
          </p>
        </div>
      </div>
    </section>
  );
}
