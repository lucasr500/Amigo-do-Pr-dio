import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildTransparencySummary, buildTransparencyReport } from "@/lib/transparency";
import { upsertFinancialSnapshot, currentMonthKey } from "@/lib/financial";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});
afterEach(() => { localStorageMock.clear(); });

describe("transparência (W3) — só agregados, sem exposição sensível", () => {
  test("agrega receitas/despesas/resultado; visibility moradores", () => {
    const month = currentMonthKey();
    upsertFinancialSnapshot({
      id: month, month, estimatedBalance: 5000, delinquencyRate: 0.12,
      entries: [
        { id: "e1", type: "receita", amount: 10000 },
        { id: "e2", type: "despesa", amount: 3000 },
        { id: "e3", type: "conta_a_pagar", amount: 2000 },
      ],
      createdAt: new Date().toISOString(),
    } as never);

    const s = buildTransparencySummary(month);
    expect(s.receitas).toBe(10000);
    expect(s.despesas).toBe(5000);     // despesa + conta_a_pagar
    expect(s.resultado).toBe(5000);
    expect(s.saldoEstimado).toBe(5000);
    expect(s.visibility).toBe("moradores");
    // a tipagem não expõe inadimplência por design
    expect(Object.keys(s)).not.toContain("delinquencyRate");
  });

  test("relatório publicável NÃO menciona inadimplência nem unidade", () => {
    const month = currentMonthKey();
    upsertFinancialSnapshot({
      id: month, month, estimatedBalance: 100, delinquencyRate: 0.3,
      entries: [{ id: "e1", type: "receita", amount: 100 }], createdAt: new Date().toISOString(),
    } as never);
    const txt = buildTransparencyReport(month).toLowerCase();
    expect(txt).not.toContain("inadimpl");
    expect(txt).not.toContain("unidade");
    expect(txt).toContain("prestação de contas");
  });

  test("sem dados → resumo informativo, hasData false", () => {
    const s = buildTransparencySummary("2099-01");
    expect(s.hasData).toBe(false);
    expect(buildTransparencyReport("2099-01")).toContain("Ainda não há lançamentos");
  });
});
