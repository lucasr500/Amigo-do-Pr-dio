import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildTodayItems } from "@/lib/today";
import { addAssembly, addAgendaItem } from "@/lib/session-assembleias";

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

describe("motor Hoje único (W2)", () => {
  test("retorna estrutura única (headline + risk + items ranqueados)", () => {
    const r = buildTodayItems();
    expect(typeof r.headline).toBe("string");
    expect(Array.isArray(r.items)).toBe(true);
    // o wedge da Assembleia está sempre presente (porta de entrada)
    expect(r.items.some((i) => i.source === "assembleia")).toBe(true);
  });

  test("itens vêm ordenados por prioridade (urgente → semana → info)", () => {
    const rank: Record<string, number> = { urgente: 0, semana: 1, info: 2 };
    const items = buildTodayItems().items;
    for (let i = 1; i < items.length; i++) {
      expect(rank[items[i].priority]).toBeGreaterThanOrEqual(rank[items[i - 1].priority]);
    }
  });

  test("assembleia com deliberação pendente eleva o wedge a urgente", () => {
    const a = addAssembly({ titulo: "AGE", tipo: "age", status: "convocada" });
    addAgendaItem({ assemblyId: a.id, titulo: "Fachada", tipo: "deliberacao" });
    const wedge = buildTodayItems().items.find((i) => i.source === "assembleia");
    expect(wedge?.priority).toBe("urgente");
  });
});
