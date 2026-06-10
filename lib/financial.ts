export type FinancialEntryType = "receita" | "despesa" | "conta_a_pagar" | "investimento";
export type FinancialPriority = "baixa" | "media" | "alta" | "critica";
export type FinancialEntryStatus = "previsto" | "pago" | "vencido";
export type FinancialTrendDirection = "up" | "down" | "stable" | "unknown";
export type CashRiskLevel = "baixo" | "atenção" | "crítico";

export const FINANCIAL_CATEGORIES = [
  "Condomínio",
  "Funcionários",
  "Encargos trabalhistas",
  "Elevadores",
  "Água",
  "Energia",
  "Gás",
  "Limpeza",
  "Manutenção",
  "Segurança",
  "Jardinagem",
  "Seguro",
  "Administradora",
  "Obras",
  "Fundo de reserva",
  "Inadimplência",
  "Receita ordinária",
  "Receita extraordinária",
  "Reserva com liquidez",
  "Outros",
] as const;

export type FinancialCategory = (typeof FINANCIAL_CATEGORIES)[number];

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

export type MonthOverMonthComparison = {
  currentMonth: string;
  previousMonth?: string;
  revenueDelta: number;
  revenueDeltaPct?: number;
  expenseDelta: number;
  expenseDeltaPct?: number;
  balanceDelta: number;
  balanceDeltaPct?: number;
  delinquencyDeltaPct?: number;
  direction: {
    revenue: FinancialTrendDirection;
    expenses: FinancialTrendDirection;
    balance: FinancialTrendDirection;
    delinquency: FinancialTrendDirection;
  };
  hasPreviousMonth: boolean;
};

export type CashRiskAnalysis = {
  level: CashRiskLevel;
  reasons: string[];
  nextAction: string;
  severityScore: number;
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
  cashRiskAnalysis: CashRiskAnalysis;
  alerts: FinancialAlert[];
};

export type FinancialHealthSignal = {
  hasData: boolean;
  points: number;
  maxPoints: number;
  status: "ok" | "partial" | "missing";
  label: string;
  note: string;
  bottleneck?: string;
  suggestions: string[];
};

export type ParsedFinancialLine = {
  raw: string;
  entry?: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">;
  snapshotPatch?: Partial<Pick<MonthlyFinancialSnapshot, "estimatedBalance" | "delinquencyRate" | "liquidityReserve">>;
  warning?: string;
};

const STORAGE_KEY = "amigo_financial_snapshots";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function moneyBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function moneyFromText(raw: string): number | null {
  // \d{1,3}(?:\.\d{3})+ matches BR thousands-separated numbers (1.200, 1.200.000).
  // The + (not *) forces at least one .ddd group, so plain "1200" falls through to \d+
  // and is matched entirely, fixing "1200,50" → 1200.50 (was: 120 with the * variant).
  const match = raw.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/i);
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

export function inferCategory(raw: string): string {
  const text = raw.toLowerCase();
  if (/elevador/.test(text)) return "Elevadores";
  if (/limpeza|faxina/.test(text)) return "Limpeza";
  if (/[áa]gua|sabesp|cedae|sanepar/.test(text)) return "Água";
  if (/luz|energia|light|enel|celpe|cemig/.test(text)) return "Energia";
  if (/g[aá]s/.test(text)) return "Gás";
  if (/portaria|vigilância|seguran/.test(text)) return "Segurança";
  if (/porteiro|zelador|faxineiro|funcionário|empregado/.test(text)) return "Funcionários";
  if (/encargo|fgts|inss|férias|rescis/.test(text)) return "Encargos trabalhistas";
  if (/jardinagem|jardim|paisagem/.test(text)) return "Jardinagem";
  if (/seguro/.test(text)) return "Seguro";
  if (/administradora|taxa.*adm|adm.*taxa/.test(text)) return "Administradora";
  if (/obra|reforma|construção/.test(text)) return "Obras";
  if (/fundo.*reserva|reserva.*fundo/.test(text)) return "Fundo de reserva";
  if (/inadimpl/.test(text)) return "Inadimplência";
  if (/invest|aplicad/.test(text)) return "Reserva com liquidez";
  if (/reserva/.test(text)) return "Reserva com liquidez";
  if (/manut|reparo|conserto/.test(text)) return "Manutenção";
  if (/cota|arrecad|receita/.test(text)) return "Receita ordinária";
  return "Outros";
}

function trendDirection(delta: number, threshold = 0): FinancialTrendDirection {
  if (Math.abs(delta) <= threshold) return "stable";
  return delta > 0 ? "up" : "down";
}

function safePct(delta: number, base: number): number | undefined {
  if (base === 0) return undefined;
  return Math.round((delta / Math.abs(base)) * 1000) / 10;
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

export function getCashRiskAnalysis(snapshot: MonthlyFinancialSnapshot): CashRiskAnalysis {
  const today = todayISO();
  const entries = snapshot.entries;

  const overdueEntries = entries.filter((e) => isFinancialEntryOverdue(e, today));
  const overdueTotal = overdueEntries.reduce((sum, e) => sum + e.amount, 0);

  const totalDespesas = entries
    .filter((e) => (e.type === "despesa" || e.type === "conta_a_pagar") && e.status !== "pago")
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = snapshot.estimatedBalance;
  const reserve = snapshot.liquidityReserve ?? 0;
  const delinquency = snapshot.delinquencyRate ?? 0;

  const reasons: string[] = [];
  let score = 0;

  if (balance < 0) {
    reasons.push("Saldo estimado negativo.");
    score += 40;
  }

  if (overdueTotal > 0) {
    if (balance > 0 && overdueTotal > balance * 0.3) {
      reasons.push(`Valor vencido (${moneyBRL(overdueTotal)}) representa mais de 30% do saldo estimado.`);
      score += 30;
    } else if (overdueTotal >= 10000) {
      reasons.push(`Valor total vencido: ${moneyBRL(overdueTotal)}.`);
      score += 20;
    } else {
      reasons.push(`${overdueEntries.length} conta${overdueEntries.length > 1 ? "s" : ""} vencida${overdueEntries.length > 1 ? "s" : ""} (${moneyBRL(overdueTotal)}).`);
      score += 10;
    }
  }

  if (delinquency >= 20) {
    reasons.push(`Inadimplência informada de ${delinquency}% é alta.`);
    score += 20;
  } else if (delinquency >= 10) {
    reasons.push(`Inadimplência de ${delinquency}% merece atenção.`);
    score += 10;
  }

  if (totalDespesas > 0 && reserve > 0 && reserve < totalDespesas * 0.5) {
    reasons.push("Reserva com liquidez abaixo de 50% das despesas do mês.");
    score += 10;
  }

  const level: CashRiskLevel = score >= 40 ? "crítico" : score >= 15 ? "atenção" : "baixo";

  const nextAction =
    level === "crítico"
      ? reasons.length > 0
        ? `Priorize regularização: ${reasons[0]}`
        : "Revise o financeiro imediatamente."
      : level === "atenção"
      ? "Revise os pontos de atenção antes de aprovar novas despesas."
      : "Continue mantendo as contas em dia.";

  return { level, reasons, nextAction, severityScore: score };
}

export function getMonthOverMonthComparison(month: string): MonthOverMonthComparison {
  const prevMonth = previousMonthKey(month);
  const current = getCurrentFinancialSnapshot(month);
  const prevSnap = read().find((s) => s.month === prevMonth);

  if (!prevSnap) {
    return {
      currentMonth: month,
      hasPreviousMonth: false,
      revenueDelta: 0,
      expenseDelta: 0,
      balanceDelta: 0,
      direction: {
        revenue: "unknown",
        expenses: "unknown",
        balance: "unknown",
        delinquency: "unknown",
      },
    };
  }

  const sumByType = (snap: MonthlyFinancialSnapshot, type: FinancialEntryType[]) =>
    snap.entries.filter((e) => type.includes(e.type)).reduce((s, e) => s + e.amount, 0);

  const curRevenue  = sumByType(current, ["receita"]);
  const curExpenses = sumByType(current, ["despesa", "conta_a_pagar"]);
  const curBalance  = current.estimatedBalance;
  const prevRevenue  = sumByType(prevSnap, ["receita"]);
  const prevExpenses = sumByType(prevSnap, ["despesa", "conta_a_pagar"]);
  const prevBalance  = prevSnap.estimatedBalance;

  const revenueDelta  = curRevenue  - prevRevenue;
  const expenseDelta  = curExpenses - prevExpenses;
  const balanceDelta  = curBalance  - prevBalance;

  const delinquencyDelta =
    current.delinquencyRate !== undefined && prevSnap.delinquencyRate !== undefined
      ? current.delinquencyRate - prevSnap.delinquencyRate
      : undefined;

  return {
    currentMonth: month,
    previousMonth: prevMonth,
    hasPreviousMonth: true,
    revenueDelta,
    revenueDeltaPct: safePct(revenueDelta, prevRevenue),
    expenseDelta,
    expenseDeltaPct: safePct(expenseDelta, prevExpenses),
    balanceDelta,
    balanceDeltaPct: safePct(balanceDelta, prevBalance),
    delinquencyDeltaPct: delinquencyDelta,
    direction: {
      revenue: trendDirection(revenueDelta, 1),
      expenses: trendDirection(expenseDelta, 1),
      balance: trendDirection(balanceDelta, 1),
      delinquency: delinquencyDelta !== undefined ? trendDirection(delinquencyDelta, 0.5) : "unknown",
    },
  };
}

export function getUpcomingBillsByWindow(
  snapshot: MonthlyFinancialSnapshot,
  today = todayISO()
): {
  next3Days: FinancialEntry[];
  next7Days: FinancialEntry[];
  next15Days: FinancialEntry[];
} {
  const add = (days: number) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const d3  = add(3);
  const d7  = add(7);
  const d15 = add(15);

  const upcoming = snapshot.entries.filter(
    (e) => e.type === "conta_a_pagar" && e.status !== "pago" && e.dueDate && e.dueDate >= today
  );

  return {
    next3Days:  upcoming.filter((e) => e.dueDate! <= d3),
    next7Days:  upcoming.filter((e) => e.dueDate! > d3  && e.dueDate! <= d7),
    next15Days: upcoming.filter((e) => e.dueDate! > d7  && e.dueDate! <= d15),
  };
}

export function buildFinancialExecutiveInsight(month: string): {
  title: string;
  subtitle: string;
  highlights: string[];
  warnings: string[];
  nextAction: string;
} {
  const snapshot = getCurrentFinancialSnapshot(month);
  const summary  = getFinancialSummary(month);
  const mom      = getMonthOverMonthComparison(month);
  const windows  = getUpcomingBillsByWindow(snapshot);
  const risk     = summary.cashRiskAnalysis;

  const highlights: string[] = [];
  const warnings: string[]   = [];

  const hasData = snapshot.entries.length > 0 || snapshot.estimatedBalance !== 0;

  if (!hasData) {
    return {
      title: "Visão operacional financeira",
      subtitle: "Sem dados suficientes ainda.",
      highlights: [],
      warnings: [],
      nextAction: "Comece informando o saldo estimado e as principais contas do mês.",
    };
  }

  if (summary.estimatedBalance > 0) {
    highlights.push(`Saldo estimado: ${moneyBRL(summary.estimatedBalance)}.`);
  }

  const resultado = summary.totalReceitas - summary.totalDespesas;
  if (summary.totalReceitas > 0 || summary.totalDespesas > 0) {
    const sign = resultado >= 0 ? "positivo" : "negativo";
    highlights.push(`Resultado do mês ${sign}: ${moneyBRL(Math.abs(resultado))}.`);
  }

  const totalUpcoming = windows.next3Days.length + windows.next7Days.length + windows.next15Days.length;
  if (windows.next3Days.length > 0) {
    const total = windows.next3Days.reduce((s, e) => s + e.amount, 0);
    warnings.push(`${windows.next3Days.length} conta${windows.next3Days.length > 1 ? "s" : ""} vencem nos próximos 3 dias (${moneyBRL(total)}).`);
  } else if (totalUpcoming > 0) {
    highlights.push(`${totalUpcoming} conta${totalUpcoming > 1 ? "s" : ""} a pagar nos próximos 15 dias.`);
  }

  if (summary.contasVencidas.length > 0) {
    const total = summary.contasVencidas.reduce((s, e) => s + e.amount, 0);
    warnings.push(`${summary.contasVencidas.length} conta${summary.contasVencidas.length > 1 ? "s" : ""} vencida${summary.contasVencidas.length > 1 ? "s" : ""} (${moneyBRL(total)}).`);
  }

  if (mom.hasPreviousMonth) {
    if (mom.direction.balance === "down" && Math.abs(mom.balanceDelta) > 100) {
      warnings.push(`Saldo estimado caiu ${moneyBRL(Math.abs(mom.balanceDelta))} em relação ao mês anterior.`);
    } else if (mom.direction.balance === "up" && Math.abs(mom.balanceDelta) > 100) {
      highlights.push(`Saldo estimado subiu ${moneyBRL(mom.balanceDelta)} em relação ao mês anterior.`);
    }
    if (mom.direction.revenue === "up" && mom.revenueDelta > 0) {
      highlights.push(`Receitas subiram ${mom.revenueDeltaPct !== undefined ? `${mom.revenueDeltaPct}%` : moneyBRL(mom.revenueDelta)} em relação ao mês anterior.`);
    }
    if (mom.direction.expenses === "up" && mom.expenseDelta > 500) {
      warnings.push(`Despesas aumentaram ${moneyBRL(mom.expenseDelta)} em relação ao mês anterior.`);
    }
  }

  if ((summary.delinquencyRate ?? 0) >= 10) {
    warnings.push(`Inadimplência em ${summary.delinquencyRate}%.`);
  }

  const subtitle =
    risk.level === "crítico"
      ? "Atenção: há pontos críticos que precisam de ação."
      : risk.level === "atenção"
      ? "Mês com pontos de atenção. Revise antes de novas despesas."
      : warnings.length > 0
      ? "Mês razoável, mas há pontos a verificar."
      : "Mês estável. Mantenha as contas em dia.";

  const nextAction =
    summary.contasVencidas.length > 0
      ? `Regularize a conta vencida de maior valor: ${summary.contasVencidas.sort((a, b) => b.amount - a.amount)[0]?.title ?? "—"}.`
      : windows.next3Days.length > 0
      ? "Prepare pagamento das contas que vencem nos próximos 3 dias."
      : risk.nextAction;

  return {
    title: "Visão operacional financeira",
    subtitle,
    highlights,
    warnings,
    nextAction,
  };
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

  const cashRiskAnalysis = getCashRiskAnalysis(snapshot);

  const alerts: FinancialAlert[] = [];
  if (contasVencidas.length > 0) {
    const total = contasVencidas.reduce((s, e) => s + e.amount, 0);
    alerts.push({
      id: "financial_overdue_bills",
      title: `${contasVencidas.length} conta${contasVencidas.length > 1 ? "s" : ""} vencida${contasVencidas.length > 1 ? "s" : ""} (${moneyBRL(total)})`,
      reason: "Conta vencida vira risco operacional e pressiona o caixa.",
      impact: "Regularizar ou negociar evita multa, juros e interrupção de serviço.",
      severity: cashRiskAnalysis.level === "crítico" ? "critical" : "warning",
    });
  }
  if ((snapshot.delinquencyRate ?? 0) >= 10) {
    alerts.push({
      id: "financial_delinquency_high",
      title: `Inadimplência em ${snapshot.delinquencyRate}%`,
      reason: "Inadimplência alta reduz previsibilidade de caixa.",
      impact: "Priorize acordos e cobrança formal antes de aprovar novas despesas.",
      severity: (snapshot.delinquencyRate ?? 0) >= 20 ? "critical" : "warning",
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

  const cashRisk =
    cashRiskAnalysis.level === "crítico" ? "critico"
    : cashRiskAnalysis.level === "atenção" ? "atencao"
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
    cashRiskAnalysis,
    alerts,
  };
}

export function buildFinancialHealthSignal(month = currentMonthKey()): FinancialHealthSignal {
  const snapshot = getCurrentFinancialSnapshot(month);
  const summary = getFinancialSummary(month);
  const mom = getMonthOverMonthComparison(month);
  const hasData =
    snapshot.entries.length > 0 ||
    snapshot.estimatedBalance !== 0 ||
    snapshot.delinquencyRate !== undefined ||
    snapshot.liquidityReserve !== undefined;

  const maxPoints = 12;
  const suggestions: string[] = [];

  if (!hasData) {
    return {
      hasData: false,
      points: 4,
      maxPoints,
      status: "partial",
      label: "Financeiro: mês sem resumo registrado",
      note: "Registrar saldo, inadimplência e principais contas aumenta a precisão operacional.",
      bottleneck: "Resumo financeiro do mês ausente",
      suggestions: ["Registrar resumo financeiro mensal"],
    };
  }

  let points = 0;
  const delinquency = summary.delinquencyRate;
  if (delinquency === undefined || delinquency <= 5) {
    points += 4;
  } else if (delinquency <= 10) {
    points += 3;
    suggestions.push("Acompanhar evolução da inadimplência");
  } else if (delinquency <= 20) {
    points += 1;
    suggestions.push("Registrar plano de acompanhamento da inadimplência");
  } else {
    suggestions.push("Revisar inadimplência registrada com a administradora");
  }

  const reserve = summary.liquidityReserve ?? 0;
  if (summary.estimatedBalance < 0) {
    suggestions.push("Revisar despesas previstas e caixa estimado");
  } else if (reserve > 0 && summary.totalDespesas > 0) {
    if (reserve >= summary.totalDespesas) points += 4;
    else if (reserve >= summary.totalDespesas * 0.5) {
      points += 3;
      suggestions.push("Acompanhar reserva com liquidez");
    } else {
      points += 1;
      suggestions.push("Avaliar recomposição gradual da reserva");
    }
  } else if (summary.estimatedBalance > 0) {
    points += 2;
    suggestions.push("Informar reserva com liquidez, se existir");
  } else {
    points += 1;
    suggestions.push("Registrar saldo ou reserva para melhorar a leitura financeira");
  }

  if (summary.contasVencidas.length > 0) {
    suggestions.push("Regularizar ou acompanhar contas vencidas");
  } else if (mom.hasPreviousMonth) {
    const expensesUpStrong = mom.expenseDeltaPct !== undefined && mom.expenseDeltaPct >= 20 && mom.expenseDelta > 500;
    const revenueDownStrong = mom.revenueDeltaPct !== undefined && mom.revenueDeltaPct <= -10 && mom.revenueDelta < -500;
    if (expensesUpStrong || revenueDownStrong || mom.direction.balance === "down") {
      points += 1;
      suggestions.push("Revisar variação financeira em relação ao mês anterior");
    } else {
      points += 4;
    }
  } else {
    points += 2;
    suggestions.push("Manter histórico mensal para comparar evolução");
  }

  const capped = Math.max(0, Math.min(maxPoints, points));
  const status: FinancialHealthSignal["status"] =
    capped >= 10 ? "ok" : capped >= 6 ? "partial" : "missing";
  const mainAlert = summary.alerts[0]?.title;
  const label =
    status === "ok"
      ? "Financeiro: sinais operacionais saudáveis"
      : status === "partial"
        ? "Financeiro: pontos de atenção"
        : "Financeiro: risco operacional registrado";

  return {
    hasData,
    points: capped,
    maxPoints,
    status,
    label,
    note: mainAlert ?? summary.cashRiskAnalysis.nextAction,
    bottleneck: mainAlert ?? (status === "ok" ? undefined : "Sinal financeiro de atenção"),
    suggestions: Array.from(new Set(suggestions)).slice(0, 3),
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
          entry: { type: "investimento", title: "Reserva com liquidez", amount, category: "Reserva com liquidez", notes: line, status: "previsto" },
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
          status: "previsto",
          notes: line,
        },
      };
    });
}

export function buildMonthlyFinancialExecutiveSummary(month = currentMonthKey()): string {
  const snapshot = getCurrentFinancialSnapshot(month);
  const summary  = getFinancialSummary(month);
  const mom      = getMonthOverMonthComparison(month);
  const windows  = getUpcomingBillsByWindow(snapshot);
  const risk     = summary.cashRiskAnalysis;

  const resultado = summary.totalReceitas - summary.totalDespesas;

  const lines = [
    `Resumo financeiro operacional — ${month}`,
    "",
    `Saldo estimado: ${moneyBRL(summary.estimatedBalance)}`,
    `Receitas registradas: ${moneyBRL(summary.totalReceitas)}`,
    `Despesas/contas registradas: ${moneyBRL(summary.totalDespesas)}`,
    `Resultado estimado do mês: ${resultado >= 0 ? "+" : ""}${moneyBRL(resultado)}`,
    `Reserva com liquidez: ${moneyBRL(summary.liquidityReserve ?? 0)}`,
    `Inadimplência informada: ${summary.delinquencyRate !== undefined ? `${summary.delinquencyRate}%` : "não informada"}`,
    "",
    `Contas pagas: ${snapshot.entries.filter((e) => e.status === "pago").length}`,
    `Contas a pagar: ${snapshot.entries.filter((e) => e.type === "conta_a_pagar" && e.status !== "pago").length}`,
    `Contas vencidas: ${summary.contasVencidas.length}`,
    `Risco de caixa: ${risk.level}`,
  ];

  if (mom.hasPreviousMonth) {
    lines.push("");
    lines.push(`Comparação com ${mom.previousMonth}:`);
    if (mom.revenueDeltaPct !== undefined) {
      lines.push(`  Receitas: ${mom.revenueDelta >= 0 ? "+" : ""}${moneyBRL(mom.revenueDelta)} (${mom.revenueDeltaPct >= 0 ? "+" : ""}${mom.revenueDeltaPct}%)`);
    } else {
      lines.push(`  Receitas: ${mom.revenueDelta >= 0 ? "+" : ""}${moneyBRL(mom.revenueDelta)}`);
    }
    if (mom.expenseDeltaPct !== undefined) {
      lines.push(`  Despesas: ${mom.expenseDelta >= 0 ? "+" : ""}${moneyBRL(mom.expenseDelta)} (${mom.expenseDeltaPct >= 0 ? "+" : ""}${mom.expenseDeltaPct}%)`);
    } else {
      lines.push(`  Despesas: ${mom.expenseDelta >= 0 ? "+" : ""}${moneyBRL(mom.expenseDelta)}`);
    }
    lines.push(`  Saldo: ${mom.balanceDelta >= 0 ? "+" : ""}${moneyBRL(mom.balanceDelta)}`);
    if (mom.delinquencyDeltaPct !== undefined) {
      lines.push(`  Inadimplência: ${mom.delinquencyDeltaPct >= 0 ? "+" : ""}${mom.delinquencyDeltaPct}pp`);
    }
  } else {
    lines.push("", "Comparação com mês anterior: sem dados do mês anterior para comparar.");
  }

  const totalUpcoming = windows.next3Days.length + windows.next7Days.length + windows.next15Days.length;
  if (totalUpcoming > 0) {
    lines.push("", "Próximas contas:");
    if (windows.next3Days.length > 0) {
      lines.push(`  Próximos 3 dias: ${windows.next3Days.map((e) => `${e.title} (${moneyBRL(e.amount)})`).join(", ")}`);
    }
    if (windows.next7Days.length > 0) {
      lines.push(`  4 a 7 dias: ${windows.next7Days.map((e) => `${e.title} (${moneyBRL(e.amount)})`).join(", ")}`);
    }
    if (windows.next15Days.length > 0) {
      lines.push(`  8 a 15 dias: ${windows.next15Days.map((e) => `${e.title} (${moneyBRL(e.amount)})`).join(", ")}`);
    }
  }

  if (risk.reasons.length > 0) {
    lines.push("", "Pontos de atenção:");
    risk.reasons.forEach((r) => lines.push(`  - ${r}`));
  }

  lines.push("", `Próxima ação recomendada: ${
    summary.contasVencidas.length > 0
      ? `Regularize a conta vencida de maior valor — ${summary.contasVencidas.sort((a, b) => b.amount - a.amount)[0]?.title ?? "—"}.`
      : risk.nextAction
  }`);

  if (snapshot.entries.length > 0) {
    lines.push("", "Principais lançamentos:");
    const byCategory = snapshot.entries.reduce<Record<string, number>>((acc, e) => {
      const cat = e.category ?? "Outros";
      acc[cat] = (acc[cat] ?? 0) + e.amount;
      return acc;
    }, {});
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([cat, total]) => lines.push(`  ${cat}: ${moneyBRL(total)}`));
  }

  lines.push("", "Controle auxiliar com dados informados manualmente. Não substitui demonstrativo contábil oficial, prestação de contas ou documentos da administradora.");
  return lines.join("\n");
}

export function buildFinancialCouncilMessage(month = currentMonthKey()): string {
  const summary = getFinancialSummary(month);
  const risk = summary.cashRiskAnalysis;
  const resultado = summary.totalReceitas - summary.totalDespesas;
  const attention =
    summary.alerts[0]?.title ??
    (risk.level === "baixo" ? "Sem ponto crítico registrado no resumo financeiro." : risk.reasons[0] ?? risk.nextAction);
  const nextStep =
    summary.contasVencidas.length > 0
      ? `Acompanhar ${summary.contasVencidas.length} conta${summary.contasVencidas.length !== 1 ? "s" : ""} vencida${summary.contasVencidas.length !== 1 ? "s" : ""}.`
      : risk.nextAction;

  return [
    `💰 Resumo financeiro auxiliar — ${month}`,
    "",
    `Receitas registradas: ${moneyBRL(summary.totalReceitas)}`,
    `Despesas registradas: ${moneyBRL(summary.totalDespesas)}`,
    `Saldo estimado: ${moneyBRL(summary.estimatedBalance)}`,
    `Resultado do mês: ${resultado >= 0 ? "+" : ""}${moneyBRL(resultado)}`,
    `Reserva com liquidez: ${summary.liquidityReserve !== undefined ? moneyBRL(summary.liquidityReserve) : "não informada"}`,
    `Inadimplência registrada: ${summary.delinquencyRate !== undefined ? `${summary.delinquencyRate}%` : "não informada"}`,
    "",
    `Ponto de atenção: ${attention}`,
    `Próximo passo sugerido: ${nextStep}`,
    "",
    "Resumo auxiliar de gestão. Não substitui prestação de contas oficial, balancete da administradora ou análise contábil.",
  ].join("\n");
}

// ─── Helpers para integração com pendências e agenda ─────────────────────────

export type PendenciaFromEntryPayload = {
  titulo: string;
  descricao: string;
  categoria: string;
  origem: "financeiro" & string;
  prioridade: "critica" | "alta" | "media" | "baixa";
  dueDate?: string;
  linkedType: "financeiro";
  linkedId: string;
};

export type AgendaFromEntryPayload = {
  title: string;
  date: string;
  type: "cobranca";
  note: string;
  prioridade: "alta" | "media" | "baixa";
};

export function buildPendenciaPayloadFromEntry(entry: FinancialEntry): PendenciaFromEntryPayload {
  const overdueTotal = entry.amount;
  const prioridade: "critica" | "alta" | "media" | "baixa" =
    overdueTotal >= 10000 ? "critica" : overdueTotal >= 2000 ? "alta" : "media";

  return {
    titulo: `Regularizar conta vencida: ${entry.title} — ${moneyBRL(entry.amount)}`,
    descricao: `Conta do tipo "${entry.category ?? "operacional"}" está vencida. Valor: ${moneyBRL(entry.amount)}.${entry.dueDate ? ` Vencimento original: ${entry.dueDate}.` : ""}`,
    categoria: entry.category ?? "financeiro",
    origem: "financeiro",
    prioridade,
    dueDate: entry.dueDate,
    linkedType: "financeiro",
    linkedId: entry.id,
  };
}

export function buildAgendaPayloadFromEntry(entry: FinancialEntry): AgendaFromEntryPayload {
  const prioridade: "alta" | "media" | "baixa" =
    entry.amount >= 5000 ? "alta" : entry.amount >= 1000 ? "media" : "baixa";

  return {
    title: `Pagar conta: ${entry.title} — ${moneyBRL(entry.amount)}`,
    date: entry.dueDate ?? todayISO(),
    type: "cobranca",
    note: `Conta a pagar de ${moneyBRL(entry.amount)}. Categoria: ${entry.category ?? "—"}. Registrado pelo módulo financeiro.`,
    prioridade,
  };
}
