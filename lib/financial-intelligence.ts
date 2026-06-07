// ─── Inteligência financeira — análise de balancetes ─────────────────────────
// Camada de análise sobre os dados financeiros mensais já armazenados.
// Projeções, anomalias, reajuste de cota — sem dependência de API externa.

import { getFinancialSnapshots, type MonthlyFinancialSnapshot, type FinancialEntry } from "./financial";

export type MonthlyBudgetLine = {
  category: string;
  average: number;
  months: number;
  min: number;
  max: number;
  trend: "up" | "down" | "stable" | "unknown";
  anomalyMonths: string[];
};

export type AnnualBudgetProjection = {
  basedOnMonths: number;
  lines: MonthlyBudgetLine[];
  totalMonthlyExpenses: number;
  totalMonthlyRevenue: number;
  projectedAnnualExpenses: number;
  projectedAnnualRevenue: number;
  projectedAnnualResult: number;
  generatedAt: string;
};

export type FinancialAnomaly = {
  category: string;
  month: string;
  expected: number;
  actual: number;
  variancePct: number;
  severity: "info" | "warning" | "critical";
  description: string;
};

export type CotaAdjustmentEstimate = {
  currentMonthlyRevenue: number;
  projectedMonthlyExpenses: number;
  gap: number;
  adjustmentPct: number;
  adjustmentPerUnit?: number;
  numUnidades?: number;
  recommendation: string;
  basedOnMonths: number;
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function categorySumByMonth(snapshots: MonthlyFinancialSnapshot[]): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  for (const snap of snapshots) {
    for (const entry of snap.entries) {
      if (entry.type !== "despesa" && entry.type !== "conta_a_pagar") continue;
      const cat = entry.category ?? "Outros";
      if (!result.has(cat)) result.set(cat, new Map());
      const existing = result.get(cat)!.get(snap.month) ?? 0;
      result.get(cat)!.set(snap.month, existing + entry.amount);
    }
  }
  return result;
}

function trendFromValues(values: number[]): "up" | "down" | "stable" | "unknown" {
  if (values.length < 3) return "unknown";
  const first = values.slice(0, Math.floor(values.length / 2));
  const last = values.slice(Math.ceil(values.length / 2));
  const avgFirst = first.reduce((s, v) => s + v, 0) / first.length;
  const avgLast = last.reduce((s, v) => s + v, 0) / last.length;
  const delta = avgLast - avgFirst;
  const pct = avgFirst > 0 ? (delta / avgFirst) * 100 : 0;
  if (pct > 10) return "up";
  if (pct < -10) return "down";
  return "stable";
}

export function buildAnnualBudgetProjection(snapshots?: MonthlyFinancialSnapshot[]): AnnualBudgetProjection {
  const snaps = snapshots ?? getFinancialSnapshots();
  const sortedSnaps = [...snaps].sort((a, b) => a.month.localeCompare(b.month));
  const recentSnaps = sortedSnaps.slice(-12);

  if (recentSnaps.length === 0) {
    return {
      basedOnMonths: 0,
      lines: [],
      totalMonthlyExpenses: 0,
      totalMonthlyRevenue: 0,
      projectedAnnualExpenses: 0,
      projectedAnnualRevenue: 0,
      projectedAnnualResult: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  const catByMonth = categorySumByMonth(recentSnaps);
  const lines: MonthlyBudgetLine[] = [];

  for (const [cat, monthMap] of catByMonth) {
    const sortedMonths = [...monthMap.keys()].sort();
    const values = sortedMonths.map((m) => monthMap.get(m) ?? 0);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const trend = trendFromValues(values);

    // Anomaly detection: months where value > avg * 1.4 or < avg * 0.6
    const anomalyMonths = sortedMonths.filter((m) => {
      const v = monthMap.get(m) ?? 0;
      return avg > 0 && (v > avg * 1.4 || (v < avg * 0.6 && avg > 100));
    });

    lines.push({ category: cat, average: avg, months: values.length, min, max, trend, anomalyMonths });
  }

  const totalMonthlyExpenses = lines.reduce((s, l) => s + l.average, 0);

  const totalMonthlyRevenue =
    recentSnaps.reduce((s, snap) => {
      const rev = snap.entries
        .filter((e: FinancialEntry) => e.type === "receita")
        .reduce((r, e) => r + e.amount, 0);
      return s + rev;
    }, 0) / recentSnaps.length;

  return {
    basedOnMonths: recentSnaps.length,
    lines: lines.sort((a, b) => b.average - a.average),
    totalMonthlyExpenses,
    totalMonthlyRevenue,
    projectedAnnualExpenses: totalMonthlyExpenses * 12,
    projectedAnnualRevenue: totalMonthlyRevenue * 12,
    projectedAnnualResult: (totalMonthlyRevenue - totalMonthlyExpenses) * 12,
    generatedAt: new Date().toISOString(),
  };
}

export function detectFinancialAnomalies(snapshots?: MonthlyFinancialSnapshot[]): FinancialAnomaly[] {
  const snaps = snapshots ?? getFinancialSnapshots();
  const sorted = [...snaps].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length < 3) return [];

  const catByMonth = categorySumByMonth(sorted);
  const anomalies: FinancialAnomaly[] = [];

  for (const [cat, monthMap] of catByMonth) {
    const sortedMonths = [...monthMap.keys()].sort();
    if (sortedMonths.length < 2) continue;

    const values = sortedMonths.map((m) => monthMap.get(m) ?? 0);
    const avg = values.slice(0, -1).reduce((s, v) => s + v, 0) / (values.length - 1);
    if (avg < 50) continue; // ignora categorias com valor muito baixo

    const lastMonth = sortedMonths[sortedMonths.length - 1];
    const lastValue = monthMap.get(lastMonth) ?? 0;
    const variancePct = avg > 0 ? ((lastValue - avg) / avg) * 100 : 0;

    if (Math.abs(variancePct) >= 30) {
      const severity: FinancialAnomaly["severity"] =
        Math.abs(variancePct) >= 60 ? "critical" : Math.abs(variancePct) >= 40 ? "warning" : "info";

      const direction = variancePct > 0 ? "subiu" : "caiu";
      anomalies.push({
        category: cat,
        month: lastMonth,
        expected: avg,
        actual: lastValue,
        variancePct: Math.round(variancePct),
        severity,
        description: `${cat} ${direction} ${Math.abs(Math.round(variancePct))}% em relação à média (${formatBRL(avg)} → ${formatBRL(lastValue)}).`,
      });
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.variancePct) - Math.abs(a.variancePct));
}

export function estimateCotaAdjustment(
  projection: AnnualBudgetProjection,
  numUnidades?: number,
  currentMonthlyRevenue?: number
): CotaAdjustmentEstimate {
  const revenue = currentMonthlyRevenue ?? projection.totalMonthlyRevenue;
  const expenses = projection.totalMonthlyExpenses;
  const gap = expenses - revenue;
  const adjustmentPct = revenue > 0 ? (gap / revenue) * 100 : 0;

  let recommendation: string;
  if (gap <= 0) {
    recommendation = `Receita cobre as despesas projetadas. Margem de ${formatBRL(Math.abs(gap))}/mês.`;
  } else if (adjustmentPct <= 5) {
    recommendation = `Pequeno déficit. Reajuste de até ${adjustmentPct.toFixed(1)}% da cota cobriria o gap.`;
  } else if (adjustmentPct <= 15) {
    recommendation = `Reajuste necessário de aproximadamente ${adjustmentPct.toFixed(1)}% para equilibrar o orçamento.`;
  } else {
    recommendation = `Déficit significativo. Reajuste de ${adjustmentPct.toFixed(1)}% ou revisão de despesas recomendada.`;
  }

  const adjustmentPerUnit =
    numUnidades && numUnidades > 0 && gap > 0 ? gap / numUnidades : undefined;

  return {
    currentMonthlyRevenue: revenue,
    projectedMonthlyExpenses: expenses,
    gap,
    adjustmentPct: Math.round(adjustmentPct * 10) / 10,
    adjustmentPerUnit,
    numUnidades,
    recommendation,
    basedOnMonths: projection.basedOnMonths,
  };
}

export function buildFinancialIntelligenceReport(
  projection: AnnualBudgetProjection,
  anomalies: FinancialAnomaly[],
  cotaEstimate: CotaAdjustmentEstimate
): string {
  const lines: string[] = [
    "ANÁLISE FINANCEIRA INTELIGENTE — AMIGO DO PRÉDIO",
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    `Base: ${projection.basedOnMonths} meses de dados`,
    "",
    "═══════════════════════════════════════════════════════",
    "PROJEÇÃO ORÇAMENTÁRIA ANUAL",
    "═══════════════════════════════════════════════════════",
    "",
    `Despesas médias mensais: ${formatBRL(projection.totalMonthlyExpenses)}`,
    `Receitas médias mensais: ${formatBRL(projection.totalMonthlyRevenue)}`,
    `Resultado mensal estimado: ${formatBRL(projection.totalMonthlyRevenue - projection.totalMonthlyExpenses)}`,
    "",
    `Projeção anual de despesas: ${formatBRL(projection.projectedAnnualExpenses)}`,
    `Projeção anual de receitas: ${formatBRL(projection.projectedAnnualRevenue)}`,
    `Resultado anual projetado: ${formatBRL(projection.projectedAnnualResult)}`,
    "",
    "Principais categorias de despesa (média mensal):",
  ];

  for (const line of projection.lines.slice(0, 10)) {
    const trendIcon = line.trend === "up" ? "↑" : line.trend === "down" ? "↓" : "→";
    lines.push(`  ${trendIcon} ${line.category}: ${formatBRL(line.average)}/mês (${line.months} meses)`);
  }

  lines.push(
    "",
    "═══════════════════════════════════════════════════════",
    "ESTIMATIVA DE REAJUSTE DE COTA",
    "═══════════════════════════════════════════════════════",
    "",
    cotaEstimate.recommendation
  );

  if (cotaEstimate.adjustmentPct > 0) {
    lines.push(`Percentual estimado de reajuste: ${cotaEstimate.adjustmentPct.toFixed(1)}%`);
    if (cotaEstimate.adjustmentPerUnit) {
      lines.push(`Impacto por unidade: ${formatBRL(cotaEstimate.adjustmentPerUnit)}/mês`);
    }
  }

  if (anomalies.length > 0) {
    lines.push(
      "",
      "═══════════════════════════════════════════════════════",
      "ANOMALIAS DETECTADAS",
      "═══════════════════════════════════════════════════════",
      ""
    );

    for (const a of anomalies) {
      const icon = a.severity === "critical" ? "⚠" : "△";
      lines.push(`${icon} ${a.description}`);
    }
  }

  lines.push(
    "",
    "Controle auxiliar com dados informados manualmente.",
    "Não substitui demonstrativo contábil oficial ou prestação de contas da administradora."
  );

  return lines.join("\n");
}
