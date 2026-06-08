import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { buildLocalOperationalAlerts, buildMonthlyPlan } from "@/lib/monthly-plan";

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

describe("monthly-plan — rotina de retorno local-first", () => {
  test("gera plano com Hoje, Esta semana e Este mês", () => {
    const plan = buildMonthlyPlan();
    expect(plan.items.map((item) => item.slot)).toEqual(["hoje", "semana", "mes"]);
    expect(plan.title).toBe("Plano do mês");
  });

  test("prioriza pendência vencida como alerta crítico", () => {
    localStorage.setItem("amigo_pendencias", JSON.stringify([{
      id: "p1",
      titulo: "Regularizar conta",
      categoria: "financeiro",
      origem: "manual",
      status: "aberta",
      dueDate: "2020-01-01",
      createdAt: "2020-01-01T00:00:00.000Z",
    }]));
    const alerts = buildLocalOperationalAlerts();
    expect(alerts[0]?.id).toBe("pendencias_vencidas");
    expect(alerts[0]?.severity).toBe("critical");
  });

  test("sem financeiro registrado recomenda registrar financeiro do mês", () => {
    const plan = buildMonthlyPlan();
    const monthItem = plan.items.find((item) => item.slot === "mes");
    expect(monthItem?.target).toBe("financeiro");
    expect(monthItem?.title).toContain("financeiro");
  });

  test("com financeiro registrado e revisão pendente recomenda revisão mensal", () => {
    const month = new Date().toISOString().slice(0, 7);
    localStorage.setItem("amigo_financial_snapshots", JSON.stringify([{
      id: "fin",
      month,
      estimatedBalance: 10000,
      delinquencyRate: 3,
      liquidityReserve: 9000,
      entries: [],
      createdAt: new Date().toISOString(),
    }]));
    const plan = buildMonthlyPlan();
    const monthItem = plan.items.find((item) => item.slot === "mes");
    expect(monthItem?.target).toBe("monthly-review");
  });
});
