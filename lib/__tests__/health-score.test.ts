import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { computeHealthScore } from "@/lib/health-score";

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

afterEach(() => { localStorageMock.clear(); });

function saveFinancial(delinquencyRate: number, liquidityReserve: number, estimatedBalance = 20000) {
  const month = new Date().toISOString().slice(0, 7);
  localStorage.setItem("amigo_financial_snapshots", JSON.stringify([{
    id: "fin",
    month,
    estimatedBalance,
    delinquencyRate,
    liquidityReserve,
    entries: [
      { id: "d1", type: "despesa", title: "Despesas do mês", amount: 10000, status: "previsto", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  }]));
}

describe("computeHealthScore — fator financeiro", () => {
  test("inclui fator financeiro mesmo sem dados financeiros", () => {
    const score = computeHealthScore();
    expect(score.factors.some((factor) => factor.label.includes("Financeiro"))).toBe(true);
  });

  test("financeiro saudável pontua melhor que inadimplência alta e reserva baixa", () => {
    saveFinancial(3, 15000);
    const healthy = computeHealthScore().percentage;

    localStorageMock.clear();
    saveFinancial(25, 1000, 5000);
    const risky = computeHealthScore().percentage;

    expect(healthy).toBeGreaterThan(risky);
  });

  test("marca financeiro como parcial quando não há dados", () => {
    const score = computeHealthScore();
    const factor = score.factors.find((item) => item.label.includes("Financeiro"));
    expect(factor?.status).toBe("partial");
    expect(factor?.note).toContain("Registrar saldo");
  });
});
