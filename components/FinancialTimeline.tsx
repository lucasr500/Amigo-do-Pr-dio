"use client";

import { useEffect, useState } from "react";
import {
  getMovimentacoes,
  deleteMovimentacao,
  type MovimentacaoFinanceira,
} from "@/lib/session";
import { getCategoriaLabel, getCategoriaIcon } from "@/lib/financial-categories";
import { formatBRL } from "@/lib/financial-health";

type MonthGroup = {
  key: string;      // YYYY-MM
  label: string;    // "Junho 2026"
  receitas: number;
  despesas: number;
  saldo: number;
  items: MovimentacaoFinanceira[];
};

function buildMonthGroups(items: MovimentacaoFinanceira[]): MonthGroup[] {
  const map = new Map<string, MovimentacaoFinanceira[]>();
  for (const m of items) {
    const key = m.data.slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }

  const groups: MonthGroup[] = [];
  for (const [key, list] of map) {
    const [year, month] = key.split("-");
    const label = new Date(`${key}-01T12:00:00`).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const receitas = list.filter((m) => m.tipo === "receita").reduce((s, m) => s + m.valor, 0);
    const despesas = list.filter((m) => m.tipo === "despesa").reduce((s, m) => s + m.valor, 0);
    const sorted   = [...list].sort((a, b) => b.data.localeCompare(a.data));
    groups.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), receitas, despesas, saldo: receitas - despesas, items: sorted });
    void year; void month;
  }

  return groups.sort((a, b) => b.key.localeCompare(a.key));
}

type Props = {
  refreshKey?: number;
  onDataChanged?: () => void;
};

export default function FinancialTimeline({ refreshKey, onDataChanged }: Props) {
  const [groups,       setGroups]       = useState<MonthGroup[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [hydrated,     setHydrated]     = useState(false);

  useEffect(() => {
    const all = getMovimentacoes();
    const g   = buildMonthGroups(all);
    setGroups(g);
    if (g.length > 0 && expandedMonth === null) setExpandedMonth(g[0].key);
    setHydrated(true);
  }, [refreshKey]);

  function handleDelete(id: string) {
    deleteMovimentacao(id);
    const all = getMovimentacoes();
    setGroups(buildMonthGroups(all));
    setConfirmDelete(null);
    onDataChanged?.();
  }

  if (!hydrated) return null;

  if (groups.length === 0) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="rounded-[18px] border border-navy-100/70 bg-white/80 px-4 py-6 text-center shadow-sm">
          <p className="text-[13px] font-semibold text-navy-700">Nenhuma movimentação registrada</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-navy-400">
            Use os botões acima para adicionar receitas e despesas do condomínio.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pb-4 sm:px-6">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-300">
        Histórico por mês
      </p>
      <div className="space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedMonth === group.key;
          return (
            <div key={group.key} className="rounded-[18px] border border-navy-100/70 bg-white/90 shadow-sm overflow-hidden">

              {/* Cabeçalho do mês */}
              <button
                type="button"
                onClick={() => setExpandedMonth(isExpanded ? null : group.key)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-navy-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-navy-800">{group.label}</p>
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-teal-600 font-medium">+{formatBRL(group.receitas)}</span>
                    <span className="text-[11px] text-navy-300">·</span>
                    <span className="text-[11px] text-terracotta-600 font-medium">-{formatBRL(group.despesas)}</span>
                    <span className="text-[11px] text-navy-300">·</span>
                    <span className={`text-[11px] font-semibold ${group.saldo >= 0 ? "text-teal-700" : "text-terracotta-700"}`}>
                      {group.saldo >= 0 ? "+" : ""}{formatBRL(group.saldo)}
                    </span>
                  </div>
                </div>
                <svg
                  className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  viewBox="0 0 16 16" fill="none" aria-hidden="true"
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Lista de movimentações */}
              {isExpanded && (
                <div className="border-t border-navy-50">
                  {group.items.map((item) => (
                    <div key={item.id} className="border-b border-navy-50/70 last:border-b-0 px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex-shrink-0 text-[16px]" aria-hidden="true">
                          {getCategoriaIcon(item.categoria)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[12.5px] font-medium text-navy-800">
                              {getCategoriaLabel(item.categoria)}
                            </p>
                            <p className={`flex-shrink-0 text-[12.5px] font-bold ${item.tipo === "receita" ? "text-teal-700" : "text-terracotta-700"}`}>
                              {item.tipo === "receita" ? "+" : "-"}{formatBRL(item.valor)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10.5px] text-navy-400">
                              {new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")}
                            </p>
                            {item.observacao && (
                              <p className="text-[10.5px] text-navy-400 truncate">· {item.observacao}</p>
                            )}
                          </div>
                        </div>

                        {/* Deletar */}
                        {confirmDelete === item.id ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-[10.5px] font-semibold text-terracotta-600 hover:text-terracotta-700"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-[10.5px] text-navy-400 hover:text-navy-600"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(item.id)}
                            className="flex-shrink-0 p-1 text-navy-200 hover:text-terracotta-400 transition-colors"
                            aria-label="Remover"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
