// Estado local da revisão mensal — progresso do checklist + histórico de conclusões.
//
// Dois stores separados:
//   MONTHLY_REVIEW_STATE   — estado efêmero de UI por mês (progresso do checklist)
//   MONTHLY_REVIEW_HISTORY — snapshots estáveis das revisões concluídas
//
// Decisão v9: histórico de revisões concluídas entra no backup v9
// porque representa memória operacional real, não apenas estado de UI.
// O estado em andamento (MONTHLY_REVIEW_STATE) continua fora do backup.

import { safeRead, safeWrite, KEYS } from "@/lib/session-core";
import { getPendenciasAbertas } from "@/lib/session-pendencias";

// ─── Tipos de estado de progresso ────────────────────────────────────────────

export type MonthlyReviewStateStatus = "pendente" | "em_andamento" | "concluida";

export type MonthlyReviewState = {
  month: string;
  status: MonthlyReviewStateStatus;
  checkedItems: string[];
  completedAt?: string;
  updatedAt: string;
};

// ─── Tipos de snapshot histórico ─────────────────────────────────────────────

export type MonthlyReviewSectionKey =
  | "financeiro" | "documentos" | "agenda" | "pendencias" | "integridade" | "comunidade" | "resumo";

export type MonthlyReviewSeverity = "info" | "warning" | "critical";

export type MonthlyReviewSnapshot = {
  month: string;
  score: number;
  status: "concluida";
  completedAt: string;
  headline: string;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  checkedCount: number;
  totalItems: number;
  topItems: Array<{
    id: string;
    title: string;
    section: MonthlyReviewSectionKey;
    severity: MonthlyReviewSeverity;
  }>;
};

export type MonthlyReviewTrend = "melhorando" | "piorando" | "estavel" | "sem_dados";

// ─── Limites de armazenamento ─────────────────────────────────────────────────

const MAX_STATES_STORED   = 24;
const MAX_HISTORY_STORED  = 24;
const MAX_TOP_ITEMS       = 5;

// ─── Estado de progresso (CRUD) ───────────────────────────────────────────────

function readAllStates(): MonthlyReviewState[] {
  return safeRead<MonthlyReviewState[]>(KEYS.MONTHLY_REVIEW_STATE, []);
}

function writeAllStates(states: MonthlyReviewState[]): void {
  const sorted = [...states].sort((a, b) => b.month.localeCompare(a.month)).slice(0, MAX_STATES_STORED);
  safeWrite(KEYS.MONTHLY_REVIEW_STATE, sorted);
}

export function getMonthlyReviewState(month: string): MonthlyReviewState {
  const all = readAllStates();
  return (
    all.find((s) => s.month === month) ?? {
      month,
      status: "pendente",
      checkedItems: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

export function startMonthlyReview(month: string): void {
  const all = readAllStates();
  const existing = all.find((s) => s.month === month);
  if (existing && existing.status !== "pendente") return;
  const updated: MonthlyReviewState = {
    month,
    status: "em_andamento",
    checkedItems: existing?.checkedItems ?? [],
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  };
  writeAllStates([...all.filter((s) => s.month !== month), updated]);
}

export function toggleMonthlyReviewItem(month: string, itemId: string): void {
  const all = readAllStates();
  const state = all.find((s) => s.month === month) ?? {
    month,
    status: "em_andamento" as MonthlyReviewStateStatus,
    checkedItems: [],
    updatedAt: new Date().toISOString(),
  };
  const checked = state.checkedItems.includes(itemId)
    ? state.checkedItems.filter((id) => id !== itemId)
    : [...state.checkedItems, itemId];
  const updated: MonthlyReviewState = {
    ...state,
    status: state.status === "concluida" ? "em_andamento" : state.status === "pendente" ? "em_andamento" : state.status,
    checkedItems: checked,
    updatedAt: new Date().toISOString(),
  };
  writeAllStates([...all.filter((s) => s.month !== month), updated]);
}

export function completeMonthlyReview(month: string): void {
  const all = readAllStates();
  const state = all.find((s) => s.month === month) ?? {
    month,
    status: "concluida" as MonthlyReviewStateStatus,
    checkedItems: [],
    updatedAt: new Date().toISOString(),
  };
  const updated: MonthlyReviewState = {
    ...state,
    status: "concluida",
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeAllStates([...all.filter((s) => s.month !== month), updated]);
}

export function resetMonthlyReview(month: string): void {
  const all = readAllStates();
  writeAllStates(all.filter((s) => s.month !== month));
  // Nota: não apaga o snapshot histórico ao resetar — histórico é imutável
}

// ─── Histórico de revisões concluídas (snapshots) ─────────────────────────────

function readHistory(): MonthlyReviewSnapshot[] {
  return safeRead<MonthlyReviewSnapshot[]>(KEYS.MONTHLY_REVIEW_HISTORY, []);
}

function writeHistory(snapshots: MonthlyReviewSnapshot[]): void {
  const sorted = [...snapshots].sort((a, b) => b.month.localeCompare(a.month)).slice(0, MAX_HISTORY_STORED);
  safeWrite(KEYS.MONTHLY_REVIEW_HISTORY, sorted);
}

export function getMonthlyReviewHistory(): MonthlyReviewSnapshot[] {
  return readHistory();
}

export function getMonthlyReviewSnapshot(month: string): MonthlyReviewSnapshot | null {
  return readHistory().find((s) => s.month === month) ?? null;
}

export function saveMonthlyReviewSnapshot(snapshot: MonthlyReviewSnapshot): void {
  const all = readHistory();
  // Substitui snapshot do mesmo mês se já existir (refazer revisão atualiza)
  writeHistory([...all.filter((s) => s.month !== snapshot.month), snapshot]);
}

export function getLastCompletedMonthlyReview(): MonthlyReviewSnapshot | null {
  const history = readHistory();
  if (history.length === 0) return null;
  return history.sort((a, b) => b.month.localeCompare(a.month))[0];
}

export function getMonthlyReviewTrend(limit = 3): MonthlyReviewTrend {
  const history = readHistory()
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, limit);
  if (history.length < 2) return "sem_dados";
  const latest   = history[0].score;
  const previous = history[1].score;
  const delta    = latest - previous;
  if (delta >= 5)  return "melhorando";
  if (delta <= -5) return "piorando";
  return "estavel";
}

// Permite restaurar histórico completo durante import de backup v9
export function restoreMonthlyReviewHistory(snapshots: MonthlyReviewSnapshot[]): void {
  writeHistory(snapshots);
}

// ─── Resumo copiável de revisão histórica ────────────────────────────────────

export function buildMonthlyReviewSnapshotSummary(
  month: string,
  opts: { variant?: "historico" | "conselho" } = {}
): string {
  const snapshot = getMonthlyReviewSnapshot(month);
  if (!snapshot) return "";

  const mesFormatado = new Date(`${snapshot.month}-01T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const completedFormatted = new Date(snapshot.completedAt).toLocaleDateString("pt-BR");

  const topLines =
    snapshot.topItems.length > 0
      ? snapshot.topItems.map((item, i) => `${i + 1}. ${item.title}`).join("\n")
      : "Nenhum ponto crítico ou de atenção registrado.";

  const trendLine = (() => {
    const trend = getMonthlyReviewTrend();
    if (trend === "melhorando") return "Tendência: melhorando em relação ao mês anterior.";
    if (trend === "piorando")   return "Tendência: score caiu em relação ao mês anterior.";
    if (trend === "estavel")    return "Tendência: estável.";
    return "";
  })();

  if (opts.variant === "conselho") {
    const attentionCount = snapshot.criticalCount + snapshot.warningCount;
    const nextFocus = snapshot.topItems[0]?.title ?? snapshot.headline;
    const pendenciasAbertas = getPendenciasAbertas().length;
    const financeiroLine = snapshot.topItems.some((item) => item.section === "financeiro")
      ? "Ponto financeiro incluído nos acompanhamentos do mês."
      : "Sem ponto financeiro crítico destacado na revisão.";

    return [
      `🏢 Revisão mensal do condomínio — ${mesFormatado}`,
      "",
      `✅ Organização geral: ${snapshot.score}/100`,
      `📌 Pendências abertas: ${pendenciasAbertas}`,
      `⚠️ Pontos de atenção: ${attentionCount}`,
      `📄 Documentos acompanhados: ${snapshot.checkedCount}/${snapshot.totalItems} itens verificados`,
      `💰 Situação financeira operacional: ${financeiroLine}`,
      "",
      `Próximo foco recomendado: ${nextFocus}`,
      "",
      "Resumo auxiliar de gestão. Não substitui prestação de contas, ata oficial ou análise profissional.",
    ].join("\n");
  }

  return [
    `Histórico da revisão mensal — ${mesFormatado}`,
    "",
    `Score registrado: ${snapshot.score}/100`,
    `Concluída em: ${completedFormatted}`,
    trendLine ? trendLine : null,
    "",
    `${snapshot.criticalCount} crítico${snapshot.criticalCount !== 1 ? "s" : ""}, ${snapshot.warningCount} atenção${snapshot.warningCount !== 1 ? "ões" : ""}, ${snapshot.infoCount} informativo${snapshot.infoCount !== 1 ? "s" : ""}`,
    `Pontos verificados: ${snapshot.checkedCount} de ${snapshot.totalItems}`,
    "",
    "Principais pontos registrados:",
    topLines,
    "",
    "Controle auxiliar com dados informados manualmente. Não substitui prestação de contas oficial, documentos contábeis, laudos técnicos ou orientação de administradora e assessoria jurídica.",
  ].filter((line) => line !== null).join("\n");
}

// ─── Helper para construção de snapshot no painel ─────────────────────────────

export function buildSnapshotFromReport(
  month: string,
  score: number,
  headline: string,
  criticalCount: number,
  warningCount: number,
  infoCount: number,
  checkedCount: number,
  totalItems: number,
  topItems: MonthlyReviewSnapshot["topItems"]
): MonthlyReviewSnapshot {
  return {
    month,
    score,
    status: "concluida",
    completedAt: new Date().toISOString(),
    headline,
    criticalCount,
    warningCount,
    infoCount,
    checkedCount,
    totalItems,
    topItems: topItems.slice(0, MAX_TOP_ITEMS),
  };
}
