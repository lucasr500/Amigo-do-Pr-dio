import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  getCashRiskAnalysis,
  getMonthOverMonthComparison,
  getUpcomingBillsByWindow,
  buildFinancialExecutiveInsight,
  buildMonthlyFinancialExecutiveSummary,
  inferCategory,
  buildPendenciaPayloadFromEntry,
  buildAgendaPayloadFromEntry,
  isFinancialEntryOverdue,
  normalizeFinancialSnapshot,
  saveFinancialSnapshots,
  getFinancialSummary,
  type MonthlyFinancialSnapshot,
  type FinancialEntry,
} from "@/lib/financial";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<MonthlyFinancialSnapshot> = {}): MonthlyFinancialSnapshot {
  return normalizeFinancialSnapshot({
    month: "2026-06",
    estimatedBalance: 10000,
    entries: [],
    ...overrides,
  });
}

function makeEntry(overrides: Partial<FinancialEntry> = {}): FinancialEntry {
  return {
    id: "entry_test_1",
    type: "conta_a_pagar",
    title: "Conta de água",
    amount: 500,
    dueDate: "2026-06-30",
    status: "previsto",
    createdAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

// stub localStorage for node env
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});

// ─── getCashRiskAnalysis ──────────────────────────────────────────────────────

describe("getCashRiskAnalysis", () => {
  test("sem contas vencidas e saldo positivo → risco baixo", () => {
    const snap = makeSnapshot({ estimatedBalance: 20000, entries: [] });
    const { level } = getCashRiskAnalysis(snap);
    expect(level).toBe("baixo");
  });

  test("saldo negativo → risco crítico independentemente de contas", () => {
    const snap = makeSnapshot({ estimatedBalance: -500, entries: [] });
    const { level } = getCashRiskAnalysis(snap);
    expect(level).toBe("crítico");
  });

  test("valor vencido alto (>= R$ 10.000) → risco atenção ou crítico", () => {
    const entries: FinancialEntry[] = [makeEntry({ amount: 15000, dueDate: "2020-01-01", status: "previsto" })];
    const snap = makeSnapshot({ estimatedBalance: 20000, entries });
    const { level } = getCashRiskAnalysis(snap);
    expect(["atenção", "crítico"]).toContain(level);
  });

  test("duas contas vencidas de R$ 50 → NÃO é crítico (risco proporcional ao valor)", () => {
    const entries: FinancialEntry[] = [
      makeEntry({ id: "e1", amount: 50, dueDate: "2020-01-01" }),
      makeEntry({ id: "e2", amount: 50, dueDate: "2020-01-02" }),
    ];
    const snap = makeSnapshot({ estimatedBalance: 50000, entries });
    const { level } = getCashRiskAnalysis(snap);
    // Com apenas R$ 100 vencido e saldo R$ 50.000, deve ser baixo ou atenção leve
    expect(level).not.toBe("crítico");
  });

  test("conta paga não contribui para risco de caixa", () => {
    const entries: FinancialEntry[] = [makeEntry({ amount: 30000, dueDate: "2020-01-01", status: "pago" })];
    const snap = makeSnapshot({ estimatedBalance: 5000, entries });
    const { level } = getCashRiskAnalysis(snap);
    expect(level).toBe("baixo");
  });

  test("inadimplência >= 20% → contribui para risco", () => {
    const snap = makeSnapshot({ estimatedBalance: 10000, delinquencyRate: 20, entries: [] });
    const { severityScore } = getCashRiskAnalysis(snap);
    expect(severityScore).toBeGreaterThanOrEqual(20);
  });

  test("inadimplência 10% → score menor que 20%", () => {
    const s10 = getCashRiskAnalysis(makeSnapshot({ delinquencyRate: 10, entries: [] }));
    const s20 = getCashRiskAnalysis(makeSnapshot({ delinquencyRate: 20, entries: [] }));
    expect(s20.severityScore).toBeGreaterThan(s10.severityScore);
  });

  test("resultado tem nextAction não vazio", () => {
    const snap = makeSnapshot({ estimatedBalance: 5000, entries: [] });
    const { nextAction } = getCashRiskAnalysis(snap);
    expect(typeof nextAction).toBe("string");
    expect(nextAction.length).toBeGreaterThan(5);
  });

  test("resultado tem reasons como array", () => {
    const snap = makeSnapshot({ entries: [] });
    const { reasons } = getCashRiskAnalysis(snap);
    expect(Array.isArray(reasons)).toBe(true);
  });
});

// ─── getMonthOverMonthComparison ──────────────────────────────────────────────

describe("getMonthOverMonthComparison", () => {
  test("sem mês anterior → hasPreviousMonth = false", () => {
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.hasPreviousMonth).toBe(false);
  });

  test("sem mês anterior → deltas todos zero", () => {
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.revenueDelta).toBe(0);
    expect(comp.expenseDelta).toBe(0);
    expect(comp.balanceDelta).toBe(0);
  });

  test("sem mês anterior → direction = unknown para todos", () => {
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.direction.revenue).toBe("unknown");
    expect(comp.direction.expenses).toBe("unknown");
    expect(comp.direction.balance).toBe("unknown");
  });

  test("base anterior zero → revenueDeltaPct é undefined (sem percentual enganoso)", () => {
    const prevSnap = makeSnapshot({ month: "2026-05", estimatedBalance: 5000, entries: [] });
    saveFinancialSnapshots([prevSnap]);
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.revenueDeltaPct).toBeUndefined();
  });

  test("com mês anterior com receitas → delta calculado corretamente", () => {
    const prevEntries: FinancialEntry[] = [
      makeEntry({ id: "r1", type: "receita", amount: 10000, dueDate: undefined, status: "previsto" }),
    ];
    const prevSnap = makeSnapshot({ month: "2026-05", estimatedBalance: 8000, entries: prevEntries });
    const curEntries: FinancialEntry[] = [
      makeEntry({ id: "r2", type: "receita", amount: 11200, dueDate: undefined, status: "previsto" }),
    ];
    const curSnap = makeSnapshot({ month: "2026-06", estimatedBalance: 9000, entries: curEntries });
    saveFinancialSnapshots([prevSnap, curSnap]);

    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.hasPreviousMonth).toBe(true);
    expect(comp.revenueDelta).toBe(1200);
    expect(comp.direction.revenue).toBe("up");
  });

  test("despesas maiores → direction.expenses = up", () => {
    const prevEntries: FinancialEntry[] = [
      makeEntry({ id: "d1", type: "despesa", amount: 5000, dueDate: undefined, status: "previsto" }),
    ];
    const curEntries: FinancialEntry[] = [
      makeEntry({ id: "d2", type: "despesa", amount: 7000, dueDate: undefined, status: "previsto" }),
    ];
    saveFinancialSnapshots([
      makeSnapshot({ month: "2026-05", entries: prevEntries }),
      makeSnapshot({ month: "2026-06", entries: curEntries }),
    ]);
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.direction.expenses).toBe("up");
    expect(comp.expenseDelta).toBe(2000);
  });

  test("saldo menor → direction.balance = down", () => {
    saveFinancialSnapshots([
      makeSnapshot({ month: "2026-05", estimatedBalance: 15000, entries: [] }),
      makeSnapshot({ month: "2026-06", estimatedBalance: 10000, entries: [] }),
    ]);
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.direction.balance).toBe("down");
    expect(comp.balanceDelta).toBe(-5000);
  });

  test("saldo igual → direction.balance = stable", () => {
    saveFinancialSnapshots([
      makeSnapshot({ month: "2026-05", estimatedBalance: 10000, entries: [] }),
      makeSnapshot({ month: "2026-06", estimatedBalance: 10000, entries: [] }),
    ]);
    const comp = getMonthOverMonthComparison("2026-06");
    expect(comp.direction.balance).toBe("stable");
  });
});

// ─── getUpcomingBillsByWindow ─────────────────────────────────────────────────

describe("getUpcomingBillsByWindow", () => {
  const today = "2026-06-04";

  test("conta com vencimento hoje → está em next3Days", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ dueDate: "2026-06-04", status: "previsto" })],
    });
    const { next3Days } = getUpcomingBillsByWindow(snap, today);
    expect(next3Days).toHaveLength(1);
  });

  test("conta com vencimento em 3 dias → está em next3Days", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ dueDate: "2026-06-07", status: "previsto" })],
    });
    const { next3Days } = getUpcomingBillsByWindow(snap, today);
    expect(next3Days).toHaveLength(1);
  });

  test("conta com vencimento em 5 dias → está em next7Days e NÃO em next3Days", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ dueDate: "2026-06-09", status: "previsto" })],
    });
    const windows = getUpcomingBillsByWindow(snap, today);
    expect(windows.next3Days).toHaveLength(0);
    expect(windows.next7Days).toHaveLength(1);
  });

  test("conta com vencimento em 10 dias → está em next15Days e NÃO em next3/7", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ dueDate: "2026-06-14", status: "previsto" })],
    });
    const windows = getUpcomingBillsByWindow(snap, today);
    expect(windows.next3Days).toHaveLength(0);
    expect(windows.next7Days).toHaveLength(0);
    expect(windows.next15Days).toHaveLength(1);
  });

  test("conta paga não aparece em nenhuma janela", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ dueDate: "2026-06-05", status: "pago" })],
    });
    const windows = getUpcomingBillsByWindow(snap, today);
    expect(windows.next3Days).toHaveLength(0);
    expect(windows.next7Days).toHaveLength(0);
    expect(windows.next15Days).toHaveLength(0);
  });

  test("conta do tipo 'despesa' não aparece nas janelas (apenas conta_a_pagar)", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ type: "despesa", dueDate: "2026-06-05", status: "previsto" })],
    });
    const windows = getUpcomingBillsByWindow(snap, today);
    expect(windows.next3Days).toHaveLength(0);
  });

  test("conta vencida (passado) não aparece", () => {
    const snap = makeSnapshot({
      entries: [makeEntry({ dueDate: "2026-01-01", status: "previsto" })],
    });
    const windows = getUpcomingBillsByWindow(snap, today);
    expect(windows.next3Days).toHaveLength(0);
    expect(windows.next7Days).toHaveLength(0);
    expect(windows.next15Days).toHaveLength(0);
  });
});

// ─── inferCategory ────────────────────────────────────────────────────────────

describe("inferCategory", () => {
  const cases: [string, string][] = [
    ["manutenção elevador",    "Elevadores"],
    ["Fatura Light energia",   "Energia"],
    ["CEDAE água",             "Água"],
    ["Cemig energia elétrica", "Energia"],
    ["faxina limpeza",         "Limpeza"],
    ["porteiro salário",       "Funcionários"],
    ["FGTS encargo",           "Encargos trabalhistas"],
    ["seguro predial",         "Seguro"],
    ["taxa administradora",    "Administradora"],
    ["fundo de reserva",       "Fundo de reserva"],
    ["inadimplência mês",      "Inadimplência"],
    ["jardinagem jardim",      "Jardinagem"],
    ["gás botijão",            "Gás"],
    ["obra reforma",           "Obras"],
    ["portaria segurança",     "Segurança"],
  ];

  test.each(cases)('"%s" → %s', (input, expected) => {
    expect(inferCategory(input)).toBe(expected);
  });
});

// ─── buildMonthlyFinancialExecutiveSummary (novos requisitos) ─────────────────

describe("buildMonthlyFinancialExecutiveSummary — sprint v2", () => {
  test("contém disclaimer de controle auxiliar", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("Controle auxiliar");
  });

  test("não menciona 'demonstrativo oficial' como conteúdo próprio (apenas no disclaimer)", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    const lines = text.split("\n");
    const mentionLines = lines.filter((l) => l.includes("demonstrativo") && !l.includes("Não substitui"));
    expect(mentionLines).toHaveLength(0);
  });

  test("não chama de balanço contábil", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text.toLowerCase()).not.toContain("balanço contábil");
    expect(text.toLowerCase()).not.toContain("dre");
    expect(text.toLowerCase()).not.toContain("prestação de contas oficial");
  });

  test("inclui 'sem dados do mês anterior' quando não há histórico", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("sem dados do mês anterior");
  });

  test("inclui comparação MoM quando há mês anterior", () => {
    saveFinancialSnapshots([
      makeSnapshot({ month: "2026-05", estimatedBalance: 8000, entries: [] }),
      makeSnapshot({ month: "2026-06", estimatedBalance: 10000, entries: [] }),
    ]);
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("2026-05");
  });

  test("inclui contas próximas quando houver", () => {
    const entries: FinancialEntry[] = [
      makeEntry({ dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), status: "previsto" }),
    ];
    saveFinancialSnapshots([makeSnapshot({ month: "2026-06", entries })]);
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("Próximas contas");
  });

  test("inclui resultado estimado do mês", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("Resultado estimado");
  });
});

// ─── buildPendenciaPayloadFromEntry ───────────────────────────────────────────

describe("buildPendenciaPayloadFromEntry", () => {
  test("gera payload de pendência com linkedType financeiro", () => {
    const entry = makeEntry({ id: "fin_001", amount: 980 });
    const payload = buildPendenciaPayloadFromEntry(entry);
    expect(payload.linkedType).toBe("financeiro");
    expect(payload.linkedId).toBe("fin_001");
    expect(payload.origem).toBe("financeiro");
  });

  test("conta de alto valor (>= R$ 10.000) → prioridade critica", () => {
    const entry = makeEntry({ amount: 15000 });
    const { prioridade } = buildPendenciaPayloadFromEntry(entry);
    expect(prioridade).toBe("critica");
  });

  test("conta de valor médio (R$ 2.000–9.999) → prioridade alta", () => {
    const entry = makeEntry({ amount: 3000 });
    const { prioridade } = buildPendenciaPayloadFromEntry(entry);
    expect(prioridade).toBe("alta");
  });

  test("conta de valor baixo → prioridade media", () => {
    const entry = makeEntry({ amount: 200 });
    const { prioridade } = buildPendenciaPayloadFromEntry(entry);
    expect(prioridade).toBe("media");
  });

  test("titulo inclui nome da conta e valor", () => {
    const entry = makeEntry({ title: "Conta de elevador", amount: 980 });
    const { titulo } = buildPendenciaPayloadFromEntry(entry);
    expect(titulo).toContain("elevador");
    expect(titulo).toContain("980");
  });
});

// ─── buildAgendaPayloadFromEntry ─────────────────────────────────────────────

describe("buildAgendaPayloadFromEntry", () => {
  test("gera payload de agenda com tipo cobranca", () => {
    const entry = makeEntry({ dueDate: "2026-06-15" });
    const payload = buildAgendaPayloadFromEntry(entry);
    expect(payload.type).toBe("cobranca");
    expect(payload.date).toBe("2026-06-15");
  });

  test("conta de alto valor (>= R$ 5.000) → prioridade alta", () => {
    const entry = makeEntry({ amount: 6000 });
    const { prioridade } = buildAgendaPayloadFromEntry(entry);
    expect(prioridade).toBe("alta");
  });

  test("title inclui nome da conta", () => {
    const entry = makeEntry({ title: "Conta de água", amount: 740 });
    const { title } = buildAgendaPayloadFromEntry(entry);
    expect(title).toContain("Conta de água");
  });
});

// ─── buildFinancialExecutiveInsight ──────────────────────────────────────────

describe("buildFinancialExecutiveInsight", () => {
  test("sem dados → nextAction orienta preenchimento", () => {
    const insight = buildFinancialExecutiveInsight("2026-06");
    expect(insight.nextAction.length).toBeGreaterThan(10);
    expect(insight.title).toBeTruthy();
  });

  test("com dados e conta vencida → warning presente", () => {
    const entries: FinancialEntry[] = [
      makeEntry({ dueDate: "2020-01-01", status: "previsto", amount: 980 }),
    ];
    saveFinancialSnapshots([makeSnapshot({ month: "2026-06", estimatedBalance: 10000, entries })]);
    const insight = buildFinancialExecutiveInsight("2026-06");
    expect(insight.warnings.length).toBeGreaterThan(0);
  });

  test("retorna highlights e warnings como arrays", () => {
    const insight = buildFinancialExecutiveInsight("2026-06");
    expect(Array.isArray(insight.highlights)).toBe(true);
    expect(Array.isArray(insight.warnings)).toBe(true);
  });
});

// ─── getFinancialSummary — cashRiskAnalysis integrado ────────────────────────

describe("getFinancialSummary — cashRiskAnalysis", () => {
  test("summary inclui cashRiskAnalysis com level e reasons", () => {
    const summary = getFinancialSummary("2026-06");
    expect(summary.cashRiskAnalysis).toBeDefined();
    expect(["baixo", "atenção", "crítico"]).toContain(summary.cashRiskAnalysis.level);
    expect(Array.isArray(summary.cashRiskAnalysis.reasons)).toBe(true);
  });

  test("cashRisk compatível com cashRiskAnalysis.level", () => {
    const summary = getFinancialSummary("2026-06");
    const map: Record<string, string> = { "crítico": "critico", "atenção": "atencao", "baixo": "baixo" };
    expect(summary.cashRisk).toBe(map[summary.cashRiskAnalysis.level]);
  });
});

// ─── isFinancialEntryOverdue — confirmação de conta paga ────────────────────

describe("isFinancialEntryOverdue — conta paga nunca é vencida", () => {
  test("conta_a_pagar paga com dueDate no passado → NÃO vencida", () => {
    const entry = makeEntry({ dueDate: "2020-01-01", status: "pago" });
    expect(isFinancialEntryOverdue(entry, "2026-06-04")).toBe(false);
  });
});
