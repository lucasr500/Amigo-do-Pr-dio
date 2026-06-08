// Dados normalizados para gráfico de barras mensal do financeiro.
// Sem side effects — apenas transforma snapshots existentes.

import { getFinancialSnapshots } from "./financial";

export type FinancialChartBar = {
  month: string;          // YYYY-MM
  monthLabel: string;     // "Jun 26"
  receitas: number;
  despesas: number;
  saldo: number;          // receitas - despesas
  saldoEstimado: number;  // snapshot.estimatedBalance (pode ser manual)
  hasData: boolean;
};

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const abbrevs = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const shortYear = String(year).slice(2);
  return `${abbrevs[month - 1]} ${shortYear}`;
}

export type FinancialChartData = {
  bars: FinancialChartBar[];
  maxAbsValue: number;       // para escala do gráfico
  hasAnyData: boolean;
  currentMonth: string;
};

export function buildFinancialChartData(maxMonths = 6): FinancialChartData {
  const snapshots = getFinancialSnapshots();

  if (snapshots.length === 0) {
    return { bars: [], maxAbsValue: 0, hasAnyData: false, currentMonth: "" };
  }

  // Pegar os últimos maxMonths meses com dados
  const sorted = [...snapshots]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-maxMonths);

  const bars: FinancialChartBar[] = sorted.map((snap) => {
    let receitas = 0;
    let despesas = 0;
    for (const entry of snap.entries ?? []) {
      const amt = entry.amount ?? 0;
      if (entry.type === "receita") receitas += amt;
      else if (entry.type === "despesa" || entry.type === "conta_a_pagar") despesas += amt;
    }
    const hasData = receitas > 0 || despesas > 0 || (snap.estimatedBalance ?? 0) !== 0;
    return {
      month: snap.month,
      monthLabel: formatMonthLabel(snap.month),
      receitas,
      despesas,
      saldo: receitas - despesas,
      saldoEstimado: snap.estimatedBalance ?? 0,
      hasData,
    };
  });

  const maxAbsValue = bars.reduce((max, b) => {
    return Math.max(max, Math.abs(b.receitas), Math.abs(b.despesas), Math.abs(b.saldoEstimado));
  }, 1); // mínimo 1 para evitar divisão por zero

  const currentMonth = new Date().toISOString().slice(0, 7);

  return {
    bars,
    maxAbsValue,
    hasAnyData: bars.some((b) => b.hasData),
    currentMonth,
  };
}
