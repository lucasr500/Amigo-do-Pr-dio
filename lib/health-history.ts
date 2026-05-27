// Histórico do Health Score.
// Salva snapshots diários e expõe análise de tendência.
// Sem IA — tudo determinístico a partir dos dados locais.

import {
  getHealthHistory,
  recordHealthSnapshot,
  getHealthTrend,
  type HealthSnapshot,
} from "./session";
import { computeHealthScore } from "./health-score";

// Captura e persiste o snapshot do Health Score de hoje.
// Idempotente — chamar múltiplas vezes no mesmo dia substitui o registro anterior.
export function captureHealthSnapshot(): HealthSnapshot {
  const result = computeHealthScore();
  const today = new Date().toISOString().slice(0, 10);

  const missingCount = result.factors.filter((f) => f.status === "missing").length;
  const partialCount = result.factors.filter((f) => f.status === "partial").length;

  const snapshot: HealthSnapshot = {
    date: today,
    percentage: result.percentage,
    statusKey: result.statusKey,
    factorCount: result.factors.length,
    missingCount,
    partialCount,
  };

  recordHealthSnapshot(snapshot);
  return snapshot;
}

export type HealthHistoryStats = {
  current: number;           // score hoje (0–100)
  previousWeek: number | null;  // score 7 dias atrás
  peak: number;              // maior score registrado
  trend: "up" | "down" | "stable" | "unknown";
  totalDaysTracked: number;
  averageLast30Days: number | null;
};

export function getHealthHistoryStats(): HealthHistoryStats {
  const history = getHealthHistory();
  const trend = getHealthTrend();

  if (history.length === 0) {
    const current = computeHealthScore().percentage;
    return {
      current,
      previousWeek: null,
      peak: current,
      trend: "unknown",
      totalDaysTracked: 0,
      averageLast30Days: null,
    };
  }

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().slice(0, 10);
  const todaySnap = sorted.find((s) => s.date === today);
  const current = todaySnap?.percentage ?? computeHealthScore().percentage;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekSnap = sorted.find((s) => s.date === sevenDaysAgo);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const last30 = sorted.filter((s) => s.date >= thirtyDaysAgo);

  const peak = Math.max(...sorted.map((s) => s.percentage));
  const avg30 = last30.length > 0
    ? Math.round(last30.reduce((s, e) => s + e.percentage, 0) / last30.length)
    : null;

  return {
    current,
    previousWeek: weekSnap?.percentage ?? null,
    peak,
    trend,
    totalDaysTracked: history.length,
    averageLast30Days: avg30,
  };
}

// Últimos N snapshots para exibição de evolução.
export function getRecentSnapshots(days = 30): HealthSnapshot[] {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return getHealthHistory()
    .filter((s) => s.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}
