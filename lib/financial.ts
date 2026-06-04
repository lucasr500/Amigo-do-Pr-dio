"use client";

export type FinancialEntryType = "receita" | "despesa" | "conta_a_pagar" | "investimento";
export type FinancialPriority = "baixa" | "media" | "alta" | "critica";
export type FinancialEntryStatus = "previsto" | "pago" | "vencido";

export type FinancialEntry = {
  id: string;
  type: FinancialEntryType;
  title: string;
  amount: number;
  dueDate?: string;
  paidAt?: string;
  category?: string;
  status?: FinancialEntryStatus;
  priority?: FinancialPriority;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type MonthlyFinancialSnapshot = {
  id: string;
  month: string;
  estimatedBalance: number;
  delinquencyRate?: number;
  liquidityReserve?: number;
  entries: FinancialEntry[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type FinancialAlert = {
  id: string;
  title: string;
  reason: string;
  impact: string;
  severity: "info" | "warning" | "critical";
};

export type FinancialSummary = {
  month: string;
  estimatedBalance: number;
  totalReceitas: number;
  totalDespesas: number;
  totalInvestido: number;
  contasVencidas: FinancialEntry[];
  contasProximas: FinancialEntry[];
  delinquencyRate?: number;
  liquidityReserve?: number;
  cashRisk: "baixo" | "atencao" | "critico";
  alerts: FinancialAlert[];
};

export type ParsedFinancialLine = {
  raw: string;
  entry?: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">;
  snapshotPatch?: Partial<Pick<MonthlyFinancialSnapshot, "estimatedBalance" | "delinquencyRate" | "liquidityReserve">>;
  warning?: string;
};

const STORAGE_KEY = "amigo_financial_snapshots";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function moneyFromText(raw: string): number | null {
  const match = raw.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?/i);
  if (!match) return null;
  const whole = match[1].replace(/\./g, "");
  const cents = match[2] ?? "00";
  const value = Number(`${whole}.${cents.padEnd(2, "0")}`);
  return Number.isFinite(value) ? value : null;
}

function parseDateToken(raw: string): string | undefined {
  const match = raw.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (!match) return undefined;
  const now = new Date();
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3]
    ? match[3].length === 2 ? `20${match[3]}` : match[3]
    : String(now.getFullYear());
  return `${year}-${month}-${day}`;
}

function inferType(raw: string): FinancialEntryType {
  const text = raw.toLowerCase();
  if (/(receita|arrecada|entrada|cota\b|condom[ií]nio recebido)/.test(text)) return "receita";
  if (/(pagar|vence|boleto|conta)/.test(text)) return "conta_a_pagar";
  if (/(invest|aplicad|liquidez|reserva)/.test(text)) return "investimento";
  return "despesa";
}

function inferCategory(raw: string): string {
  const text = raw.toLowerCase();
  if (/elevador/.test(text)) return "Elevador";
  if (/limpeza|faxina/.test(text)) return "Limpeza";
  if (/[áa]gua|sabesp/.test(text)) return "Água";
  if (/luz|energia/.test(text)) return "Energia";
  if (/portaria|seguran/.test(text)) return "Portaria";
  if (/seguro/.test(text)) return "Seguro";
  if (/obra|manuten/.test(text)) return "Manutenção";
  if (/inadimpl/.test(text)) return "Inadimplência";
  if (/invest|aplicad|reserva/.test(text)) return "Reserva";
  return "Operacional";
}

function read(): MonthlyFinancialSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as MonthlyFinancialSnapshot[]) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeFinancialSnapshot) : [];
  } catch {
    return [];
  }
}

function write(snapshots: MonthlyFinancialSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots.slice(-36)));
  } catch {
    // localStorage indisponível ou sem quota
  }
}

export function normalizeFinancialSnapshot(raw: Partial<MonthlyFinancialSnapshot>): MonthlyFinancialSnapshot {
  const now = new Date().toISOString();
  const estimatedBalance = Number(raw.estimatedBalance ?? 0);
  return {
    id: raw.id ?? `fin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    month: raw.month ?? currentMonthKey(),
    estimatedBalance: Number.isFinite(estimatedBalance) ? estimatedBalance : 0,
    delinquencyRate: raw.delinquencyRate,
    liquidityReserve: raw.liquidityReserve,
    notes: raw.notes,
    entries: Array.isArray(raw.entries)
      ? raw.entries.map((entry) => {
          const amount = Number(entry.amount ?? 0);
          return {
            ...entry,
            id: entry.id ?? `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: entry.title?.trim() || "Lançamento financeiro",
            amount: Number.isFinite(amount) ? amount : 0,
            type: entry.type ?? "despesa",
            createdAt: entry.createdAt ?? now,
          };
        })
      : [],
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt,
  };
}

export function getFinancialSnapshots(): MonthlyFinancialSnapshot[] {
  return read();
}

export function saveFinancialSnapshots(snapshots: MonthlyFinancialSnapshot[]): void {
  write(snapshots.map(normalizeFinancialSnapshot));
}

export function getCurrentFinancialSnapshot(month = currentMonthKey()): MonthlyFinancialSnapshot {
  const existing = read().find((snapshot) => snapshot.month === month);
  if (existing) return existing;
  return normalizeFinancialSnapshot({ month, estimatedBalance: 0, entries: [] });
}

export function upsertFinancialSnapshot(snapshot: MonthlyFinancialSnapshot): void {
  const normalized = normalizeFinancialSnapshot({ ...snapshot, updatedAt: new Date().toISOString() });
  const next = read().filter((item) => item.month !== normalized.month);
  next.push(normalized);
  write(next.sort((a, b) => a.month.localeCompare(b.month)));
}

export function updateFinancialSnapshot(
  month: string,
  patch: Partial<Omit<MonthlyFinancialSnapshot, "id" | "month" | "createdAt">>
): MonthlyFinancialSnapshot {
  const current = getCurrentFinancialSnapshot(month);
  const updated = normalizeFinancialSnapshot({ ...current, ...patch, month, updatedAt: new Date().toISOString() });
  upsertFinancialSnapshot(updated);
  return updated;
}

export function addFinancialEntry(
  month: string,
  entry: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">
): FinancialEntry {
  const current = getCurrentFinancialSnapshot(month);
  const now = new Date().toISOString();
  const saved: FinancialEntry = {
    ...entry,
    id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  upsertFinancialSnapshot({ ...current, entries: [...current.entries, saved], updatedAt: now });
  return saved;
}

export function updateFinancialEntry(month: string, id: string, patch: Partial<FinancialEntry>): void {
  const current = getCurrentFinancialSnapshot(month);
  upsertFinancialSnapshot({
    ...current,
    entries: current.entries.map((entry) =>
      entry.id === id ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry
    ),
  });
}

export function markFinancialEntryPaid(month: string, id: string): void {
  updateFinancialEntry(month, id, { status: "pago", paidAt: todayISO() });
}

export function reopenFinancialEntry(month: string, id: string): void {
  updateFinancialEntry(month, id, { status: "previsto", paidAt: undefined });
}

export function deleteFinancialEntry(month: string, id: string): void {
  const current = getCurrentFinancialSnapshot(month);
  upsertFinancialSnapshot({
    ...current,
    entries: current.entries.filter((entry) => entry.id !== id),
    updatedAt: new Date().toISOString(),
  });
}

export function isFinancialEntryOverdue(entry: FinancialEntry, today = todayISO()): boolean {
  return entry.type === "conta_a_pagar" && entry.status !== "pago" && !!entry.dueDate && entry.dueDate < today;
}

export function getFinancialSummary(month = currentMonthKey()): FinancialSummary {
  const snapshot = getCurrentFinancialSnapshot(month);
  const today = todayISO();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const activeEntries = snapshot.entries.filter((entry) => entry.status !== "pago");
  const contasVencidas = activeEntries.filter((entry) => entry.type === "conta_a_pagar" && entry.dueDate && entry.dueDate < today);
  const contasProximas = activeEntries.filter((entry) => entry.type === "conta_a_pagar" && entry.dueDate && entry.dueDate >= today && entry.dueDate <= nextWeek);
  const totalReceitas = snapshot.entries
    .filter((entry) => entry.type === "receita")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalDespesas = snapshot.entries
    .filter((entry) => entry.type === "despesa" || entry.type === "conta_a_pagar")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalInvestido = snapshot.entries
    .filter((entry) => entry.type === "investimento")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const alerts: FinancialAlert[] = [];
  if (contasVencidas.length > 0) {
    alerts.push({
      id: "financial_overdue_bills",
      title: `${contasVencidas.length} conta${contasVencidas.length > 1 ? "s" : ""} vencida${contasVencidas.length > 1 ? "s" : ""}`,
      reason: "Conta vencida vira risco operacional e pressiona o caixa.",
      impact: "Regularizar ou negociar evita multa, juros e interrupção de serviço.",
      severity: "critical",
    });
  }
  if ((snapshot.delinquencyRate ?? 0) >= 10) {
    alerts.push({
      id: "financial_delinquency_high",
      title: `Inadimplência em ${snapshot.delinquencyRate}%`,
      reason: "Inadimplência alta reduz previsibilidade de caixa.",
      impact: "Priorize acordos e cobrança formal antes de aprovar novas despesas.",
      severity: "warning",
    });
  }
  if (snapshot.estimatedBalance < 0) {
    alerts.push({
      id: "financial_negative_balance",
      title: "Saldo estimado negativo",
      reason: "O resumo financeiro indica caixa abaixo de zero.",
      impact: "Revise despesas próximas e necessidade de aporte antes de contratar serviços.",
      severity: "critical",
    });
  }

  const cashRisk = snapshot.estimatedBalance < 0 || contasVencidas.length >= 2
    ? "critico"
    : contasVencidas.length > 0 || (snapshot.delinquencyRate ?? 0) >= 10
    ? "atencao"
    : "baixo";

  return {
    month: snapshot.month,
    estimatedBalance: snapshot.estimatedBalance,
    totalReceitas,
    totalDespesas,
    totalInvestido,
    contasVencidas,
    contasProximas,
    delinquencyRate: snapshot.delinquencyRate,
    liquidityReserve: snapshot.liquidityReserve,
    cashRisk,
    alerts,
  };
}

export function parseFinancialQuickText(text: string): ParsedFinancialLine[] {
  return text
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): ParsedFinancialLine => {
      const lower = line.toLowerCase();
      const amount = moneyFromText(line);
      if (/inadimpl/.test(lower)) {
        const pct = lower.match(/(\d{1,2}(?:[,.]\d{1,2})?)\s*%/);
        if (!pct) return { raw: line, warning: "Informe a inadimplência em percentual, ex.: inadimplência 8%." };
        return { raw: line, snapshotPatch: { delinquencyRate: Number(pct[1].replace(",", ".")) } };
      }
      if (/saldo/.test(lower)) {
        if (amount === null) return { raw: line, warning: "Não encontrei valor de saldo nesta linha." };
        return { raw: line, snapshotPatch: { estimatedBalance: amount } };
      }
      if (/invest|aplicad|liquidez|reserva/.test(lower)) {
        if (amount === null) return { raw: line, warning: "Não encontrei valor investido nesta linha." };
        return {
          raw: line,
          snapshotPatch: { liquidityReserve: amount },
          entry: { type: "investimento", title: "Reserva com liquidez", amount, category: "Reserva", notes: line, status: "previsto" },
        };
      }
      if (amount === null) return { raw: line, warning: "Não encontrei valor monetário nesta linha." };
      const type = inferType(line);
      return {
        raw: line,
        entry: {
          type,
          title: line.replace(/(?:r\$\s*)?\d[\d.,]*/i, "").replace(/\bvence\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/i, "").trim() || inferCategory(line),
          amount,
          dueDate: parseDateToken(line),
          category: inferCategory(line),
          status: type === "conta_a_pagar" ? "previsto" : "previsto",
          notes: line,
        },
      };
    });
}

export function buildMonthlyFinancialExecutiveSummary(month = currentMonthKey()): string {
  const snapshot = getCurrentFinancialSnapshot(month);
  const summary = getFinancialSummary(month);
  const lines = [
    `Resumo financeiro operacional — ${month}`,
    "",
    `Saldo estimado: ${summary.estimatedBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Receitas registradas: ${summary.totalReceitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Despesas/contas registradas: ${summary.totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Reserva com liquidez: ${(summary.liquidityReserve ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Inadimplência informada: ${summary.delinquencyRate !== undefined ? `${summary.delinquencyRate}%` : "não informada"}`,
    `Contas vencidas: ${summary.contasVencidas.length}`,
    `Contas próximas: ${summary.contasProximas.length}`,
    `Risco de caixa: ${summary.cashRisk}`,
  ];

  if (summary.alerts.length > 0) {
    lines.push("", "Alertas:");
    summary.alerts.forEach((alert) => {
      lines.push(`- ${alert.title}: ${alert.reason} ${alert.impact}`);
    });
  }

  if (snapshot.entries.length > 0) {
    lines.push("", "Lançamentos:");
    snapshot.entries.slice(-12).forEach((entry) => {
      lines.push(`- ${entry.title}: ${entry.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${entry.category ?? "sem categoria"})`);
    });
  }

  lines.push("", "Controle auxiliar com dados informados manualmente. Não substitui demonstrativo contábil oficial.");
  return lines.join("\n");
}
