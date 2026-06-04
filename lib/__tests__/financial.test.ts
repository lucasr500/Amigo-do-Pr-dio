import { describe, test, expect } from "vitest";
import {
  normalizeFinancialSnapshot,
  parseFinancialQuickText,
  isFinancialEntryOverdue,
  buildMonthlyFinancialExecutiveSummary,
  currentMonthKey,
  type FinancialEntry,
} from "@/lib/financial";

// ─── normalizeFinancialSnapshot ───────────────────────────────────────────────

describe("normalizeFinancialSnapshot", () => {
  test("NaN estimatedBalance → 0", () => {
    const snap = normalizeFinancialSnapshot({ month: "2026-06", estimatedBalance: NaN });
    expect(snap.estimatedBalance).toBe(0);
    expect(Number.isFinite(snap.estimatedBalance)).toBe(true);
  });

  test("valor válido de estimatedBalance é preservado", () => {
    const snap = normalizeFinancialSnapshot({ month: "2026-06", estimatedBalance: 5000 });
    expect(snap.estimatedBalance).toBe(5000);
  });

  test("estimatedBalance negativo é preservado (saldo devedor é válido)", () => {
    const snap = normalizeFinancialSnapshot({ month: "2026-06", estimatedBalance: -1500 });
    expect(snap.estimatedBalance).toBe(-1500);
  });

  test("undefined entries → array vazio", () => {
    const snap = normalizeFinancialSnapshot({ month: "2026-06" });
    expect(snap.entries).toEqual([]);
  });

  test("NaN em entry.amount → 0", () => {
    const snap = normalizeFinancialSnapshot({
      month: "2026-06",
      entries: [{ type: "despesa", title: "Limpeza", amount: NaN } as never],
    });
    expect(snap.entries[0].amount).toBe(0);
    expect(Number.isFinite(snap.entries[0].amount)).toBe(true);
  });

  test("null em entry.amount → 0", () => {
    const snap = normalizeFinancialSnapshot({
      month: "2026-06",
      entries: [{ type: "despesa", title: "Água", amount: null } as never],
    });
    expect(Number.isFinite(snap.entries[0].amount)).toBe(true);
  });

  test("entry válida é preservada", () => {
    const snap = normalizeFinancialSnapshot({
      month: "2026-06",
      entries: [{ type: "receita", title: "Cota condominial", amount: 1200 } as never],
    });
    expect(snap.entries[0].amount).toBe(1200);
    expect(snap.entries[0].type).toBe("receita");
  });

  test("entry sem título recebe fallback não-vazio", () => {
    const snap = normalizeFinancialSnapshot({
      month: "2026-06",
      entries: [{ type: "despesa", title: "", amount: 100 } as never],
    });
    expect(snap.entries[0].title.length).toBeGreaterThan(0);
  });

  test("snapshot recebe id gerado se ausente", () => {
    const snap = normalizeFinancialSnapshot({ month: "2026-06" });
    expect(snap.id).toBeTruthy();
  });
});

// ─── parseFinancialQuickText ──────────────────────────────────────────────────

describe("parseFinancialQuickText", () => {
  test("'Água R$ 580' → despesa com amount 580", () => {
    const [line] = parseFinancialQuickText("Água R$ 580");
    expect(line.entry?.amount).toBe(580);
    expect(line.warning).toBeUndefined();
  });

  test("'1.200,50 limpeza' → 1200.50 (formato BR com separador de milhar)", () => {
    const [line] = parseFinancialQuickText("1.200,50 limpeza");
    expect(line.entry?.amount).toBe(1200.5);
  });

  test("'1200,50' → 1200.50 (sem separador de milhar — bug fix)", () => {
    // Regressão do bug: regex antiga parseava como 120 por \d{1,3}(?:\.\d{3})* capturar "120"
    const [line] = parseFinancialQuickText("1200,50");
    expect(line.entry?.amount).toBe(1200.5);
  });

  test("'R$ 980' → 980", () => {
    const [line] = parseFinancialQuickText("R$ 980");
    expect(line.entry?.amount).toBe(980);
  });

  test("'12.000 portaria' → 12000 (sem centavos)", () => {
    const [line] = parseFinancialQuickText("12.000 portaria");
    expect(line.entry?.amount).toBe(12000);
  });

  test("'inadimplência 8%' → snapshotPatch.delinquencyRate = 8", () => {
    const [line] = parseFinancialQuickText("inadimplência 8%");
    expect(line.snapshotPatch?.delinquencyRate).toBe(8);
    expect(line.entry).toBeUndefined();
    expect(line.warning).toBeUndefined();
  });

  test("'inadimplência 12,5%' → delinquencyRate = 12.5", () => {
    const [line] = parseFinancialQuickText("inadimplência 12,5%");
    expect(line.snapshotPatch?.delinquencyRate).toBe(12.5);
  });

  test("'saldo 12.000' → snapshotPatch.estimatedBalance = 12000", () => {
    const [line] = parseFinancialQuickText("saldo 12.000");
    expect(line.snapshotPatch?.estimatedBalance).toBe(12000);
  });

  test("linha sem valor monetário → warning presente", () => {
    const [line] = parseFinancialQuickText("reunião de condomínio");
    expect(line.warning).toBeTruthy();
    expect(line.entry).toBeUndefined();
  });

  test("'reserva 5.000' → tipo investimento", () => {
    const [line] = parseFinancialQuickText("reserva 5.000");
    expect(line.entry?.type).toBe("investimento");
  });

  test("'conta pagar 450 vence 30/06' → conta_a_pagar com dueDate", () => {
    const [line] = parseFinancialQuickText("conta pagar 450 vence 30/06");
    expect(line.entry?.type).toBe("conta_a_pagar");
    expect(line.entry?.dueDate).toBeTruthy();
  });

  test("duas linhas separadas por newline → dois resultados", () => {
    const lines = parseFinancialQuickText("Água R$ 580\nEnergia R$ 320");
    expect(lines).toHaveLength(2);
    expect(lines[0].entry?.amount).toBe(580);
    expect(lines[1].entry?.amount).toBe(320);
  });

  test("duas linhas separadas por ponto e vírgula → dois resultados", () => {
    const lines = parseFinancialQuickText("Água R$ 580;Energia R$ 320");
    expect(lines).toHaveLength(2);
  });

  test("string vazia → array vazio", () => {
    expect(parseFinancialQuickText("")).toHaveLength(0);
  });

  test("'elevador 1.200' → categoria Elevadores", () => {
    const [line] = parseFinancialQuickText("elevador 1.200");
    expect(line.entry?.category).toBe("Elevadores");
  });

  test("'arrecadação 15.000' → tipo receita", () => {
    const [line] = parseFinancialQuickText("arrecadação 15.000");
    expect(line.entry?.type).toBe("receita");
  });
});

// ─── isFinancialEntryOverdue ──────────────────────────────────────────────────

describe("isFinancialEntryOverdue", () => {
  const baseEntry: FinancialEntry = {
    id: "test-1",
    type: "conta_a_pagar",
    title: "Conta de água",
    amount: 500,
    dueDate: "2026-01-01",
    status: "previsto",
    createdAt: "2026-01-01T00:00:00Z",
  };

  test("dueDate no passado + status previsto → vencida", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, dueDate: "2020-01-01" }, "2026-06-01")).toBe(true);
  });

  test("dueDate no passado + status pago → NÃO vencida", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, dueDate: "2020-01-01", status: "pago" }, "2026-06-01")).toBe(false);
  });

  test("dueDate no futuro → NÃO vencida", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, dueDate: "2030-01-01" }, "2026-06-01")).toBe(false);
  });

  test("sem dueDate → NÃO vencida", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, dueDate: undefined }, "2026-06-01")).toBe(false);
  });

  test("tipo 'despesa' no passado → NÃO vencida (apenas conta_a_pagar vence)", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, type: "despesa", dueDate: "2020-01-01" }, "2026-06-01")).toBe(false);
  });

  test("tipo 'receita' no passado → NÃO vencida", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, type: "receita", dueDate: "2020-01-01" }, "2026-06-01")).toBe(false);
  });

  test("dueDate igual a hoje → NÃO vencida (< hoje, não <=)", () => {
    expect(isFinancialEntryOverdue({ ...baseEntry, dueDate: "2026-06-01" }, "2026-06-01")).toBe(false);
  });
});

// ─── buildMonthlyFinancialExecutiveSummary ────────────────────────────────────

describe("buildMonthlyFinancialExecutiveSummary", () => {
  test("disclaimer 'Controle auxiliar' presente no output", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("Controle auxiliar");
  });

  test("disclaimer 'Não substitui demonstrativo contábil oficial' presente", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("Não substitui demonstrativo contábil oficial");
  });

  test("output é string não-vazia", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(50);
  });

  test("mês informado aparece no output", () => {
    const text = buildMonthlyFinancialExecutiveSummary("2026-06");
    expect(text).toContain("2026-06");
  });
});

// ─── currentMonthKey ─────────────────────────────────────────────────────────

describe("currentMonthKey", () => {
  test("retorna formato YYYY-MM", () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });

  test("mês está no intervalo 01-12", () => {
    const [, mm] = currentMonthKey().split("-");
    const month = parseInt(mm, 10);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});
