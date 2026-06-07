import type { FinancialEntryType } from "@/lib/financial";

export const ENTRY_LABEL: Record<FinancialEntryType, string> = {
  receita: "Receita",
  despesa: "Despesa",
  conta_a_pagar: "Conta a pagar",
  investimento: "Reserva",
};

export const FINANCIAL_FILTERS = ["todos", "receitas", "despesas", "contas", "vencidas", "pagas", "investimentos"] as const;
export type FinancialFilter = (typeof FINANCIAL_FILTERS)[number];

export const FINANCIAL_FILTER_LABEL: Record<FinancialFilter, string> = {
  todos: "Todos",
  receitas: "Receitas",
  despesas: "Despesas",
  contas: "Prazos",
  vencidas: "Vencidas",
  pagas: "Pagas",
  investimentos: "Reserva",
};

export function buildFinancialFilterOptions() {
  return FINANCIAL_FILTERS.map((value) => ({ value, label: FINANCIAL_FILTER_LABEL[value] }));
}

export function formatMoneyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
