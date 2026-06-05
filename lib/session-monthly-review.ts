// Estado local da revisão mensal — persiste progresso do checklist guiado.
// Separado do motor (monthly-review.ts) que é puro e sem side effects.
// Decisão de design: estado mensal NÃO entra no backup principal por ser
// estado efêmero de UI. O relatório pode ser reconstruído a qualquer momento.

import { safeRead, safeWrite, KEYS } from "@/lib/session-core";

export type MonthlyReviewStateStatus = "pendente" | "em_andamento" | "concluida";

export type MonthlyReviewState = {
  month: string;
  status: MonthlyReviewStateStatus;
  checkedItems: string[];
  completedAt?: string;
  updatedAt: string;
};

const MAX_MONTHS_STORED = 24;

function readAll(): MonthlyReviewState[] {
  return safeRead<MonthlyReviewState[]>(KEYS.MONTHLY_REVIEW_STATE, []);
}

function writeAll(states: MonthlyReviewState[]): void {
  // Mantém apenas os últimos MAX_MONTHS_STORED meses, ordenados do mais recente
  const sorted = [...states].sort((a, b) => b.month.localeCompare(a.month)).slice(0, MAX_MONTHS_STORED);
  safeWrite(KEYS.MONTHLY_REVIEW_STATE, sorted);
}

export function getMonthlyReviewState(month: string): MonthlyReviewState {
  const all = readAll();
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
  const all = readAll();
  const existing = all.find((s) => s.month === month);
  if (existing && existing.status !== "pendente") return;
  const updated: MonthlyReviewState = {
    month,
    status: "em_andamento",
    checkedItems: existing?.checkedItems ?? [],
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  };
  writeAll([...all.filter((s) => s.month !== month), updated]);
}

export function toggleMonthlyReviewItem(month: string, itemId: string): void {
  const all = readAll();
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
  writeAll([...all.filter((s) => s.month !== month), updated]);
}

export function completeMonthlyReview(month: string): void {
  const all = readAll();
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
  writeAll([...all.filter((s) => s.month !== month), updated]);
}

export function resetMonthlyReview(month: string): void {
  const all = readAll();
  writeAll(all.filter((s) => s.month !== month));
}
