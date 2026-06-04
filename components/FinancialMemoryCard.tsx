"use client";

import { useEffect, useState } from "react";
import { getMovimentacoes } from "@/lib/session";
import { formatBRL } from "@/lib/financial-health";

type FinancialStats = {
  totalReceitas: number;
  totalDespesas: number;
  totalMovimentacoes: number;
  mesesRegistrados: number;
  primeiraMovimentacao: string | null;
  ultimaMovimentacao: string | null;
};

export default function FinancialMemoryCard() {
  const [stats,   setStats]   = useState<FinancialStats | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const all = getMovimentacoes();
    if (all.length === 0) { setHydrated(true); return; }

    const totalReceitas  = all.filter((m) => m.tipo === "receita").reduce((s, m) => s + m.valor, 0);
    const totalDespesas  = all.filter((m) => m.tipo === "despesa").reduce((s, m) => s + m.valor, 0);
    const meses          = new Set(all.map((m) => m.data.slice(0, 7))).size;
    const sorted         = [...all].sort((a, b) => a.data.localeCompare(b.data));

    setStats({
      totalReceitas,
      totalDespesas,
      totalMovimentacoes: all.length,
      mesesRegistrados: meses,
      primeiraMovimentacao: sorted[0].data,
      ultimaMovimentacao: sorted[sorted.length - 1].data,
    });
    setHydrated(true);
  }, []);

  if (!hydrated || !stats) return null;

  const totalMovimentado = stats.totalReceitas + stats.totalDespesas;

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="rounded-[18px] border border-navy-100/70 bg-white/90 px-4 py-4 shadow-sm">
        <p className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
          Patrimônio informacional financeiro
        </p>
        <p className="mb-3 text-[13px] font-semibold leading-snug text-navy-800">
          Histórico financeiro do condomínio
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-navy-50/60 px-3 py-2.5">
            <p className="text-[15px] font-bold leading-none text-navy-800">{formatBRL(totalMovimentado)}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-navy-500">total movimentado</p>
          </div>
          <div className="rounded-xl bg-teal-50/60 px-3 py-2.5">
            <p className="text-[15px] font-bold leading-none text-teal-700">{formatBRL(stats.totalReceitas)}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-teal-600">total receitas</p>
          </div>
          <div className="rounded-xl bg-terracotta-50/60 px-3 py-2.5">
            <p className="text-[15px] font-bold leading-none text-terracotta-700">{formatBRL(stats.totalDespesas)}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-terracotta-600">total despesas</p>
          </div>
          <div className="rounded-xl bg-navy-50/60 px-3 py-2.5">
            <p className="text-[15px] font-bold leading-none text-navy-800">{stats.mesesRegistrados}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-navy-500">
              {stats.mesesRegistrados === 1 ? "mês registrado" : "meses registrados"}
            </p>
          </div>
        </div>
        {stats.primeiraMovimentacao && (
          <p className="mt-3 text-[10.5px] leading-relaxed text-navy-400">
            Primeiro registro: {new Date(`${stats.primeiraMovimentacao}T12:00:00`).toLocaleDateString("pt-BR")}
            {stats.primeiraMovimentacao !== stats.ultimaMovimentacao && stats.ultimaMovimentacao && (
              <> · Último: {new Date(`${stats.ultimaMovimentacao}T12:00:00`).toLocaleDateString("pt-BR")}</>
            )}
          </p>
        )}
        <p className="mt-1 text-[10px] leading-relaxed text-navy-300">
          {stats.totalMovimentacoes} {stats.totalMovimentacoes === 1 ? "lançamento" : "lançamentos"} registrados.
          Os dados são seus e ficam neste dispositivo.
        </p>
      </div>
    </div>
  );
}
