import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildGuidanceEngine } from "@/lib/guidance-engine";

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

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("buildGuidanceEngine — regras sprint 4.2", () => {
  test("gera handoff crítico quando mandato vence em menos de 90 dias e handoff abaixo de 30%", () => {
    localStorage.setItem("amigo_memoria", JSON.stringify({ fimMandatoSindico: futureDate(45) }));
    const result = buildGuidanceEngine();
    const item = result.items.find((i) => i.id === "eng_handoff_critico");
    expect(item).toBeDefined();
    expect(item?.prioridade).toBe("critico");
    expect(item?.checklist).toContain("Exportar backup atualizado");
  });

  test("não gera handoff crítico sem data de mandato", () => {
    const result = buildGuidanceEngine();
    expect(result.items.find((i) => i.id === "eng_handoff_critico")).toBeUndefined();
  });

  test("gera decisão sem acompanhamento para decisão antiga sem pendência vinculada", () => {
    localStorage.setItem("amigo_decisions", JSON.stringify([{
      id: "dec_old",
      title: "Executar obra",
      date: "2020-01-01",
      category: "obras",
      context: "",
      rationale: "",
      outcome: "Aprovado",
      status: "em_execucao",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    }]));
    const result = buildGuidanceEngine();
    expect(result.items.find((i) => i.id === "eng_decisao_sem_acompanhamento")).toBeDefined();
  });

  test("não gera decisão sem acompanhamento quando há pendência vinculada", () => {
    localStorage.setItem("amigo_decisions", JSON.stringify([{
      id: "dec_linked",
      title: "Executar obra",
      date: "2020-01-01",
      category: "obras",
      context: "",
      rationale: "",
      outcome: "Aprovado",
      status: "em_execucao",
      linkedPendenciaId: "pend_1",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    }]));
    const result = buildGuidanceEngine();
    expect(result.items.find((i) => i.id === "eng_decisao_sem_acompanhamento")).toBeUndefined();
  });

  test("gera fornecedor de elevador ausente quando prédio tem elevador e não há fornecedor ativo", () => {
    localStorage.setItem("amigo_profile", JSON.stringify({ hasElevador: true }));
    localStorage.setItem("amigo_suppliers", JSON.stringify([]));
    const result = buildGuidanceEngine();
    const item = result.items.find((i) => i.id === "eng_elevador_fornecedor_ausente");
    expect(item).toBeDefined();
    expect(item?.prioridade).toBe("importante");
  });

  test("não gera fornecedor de elevador ausente quando há fornecedor ativo de elevador", () => {
    localStorage.setItem("amigo_profile", JSON.stringify({ hasElevador: true }));
    localStorage.setItem("amigo_suppliers", JSON.stringify([{
      id: "sup_1",
      name: "Elevadores Alfa",
      category: "elevador",
      active: true,
      serviceHistory: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }]));
    const result = buildGuidanceEngine();
    expect(result.items.find((i) => i.id === "eng_elevador_fornecedor_ausente")).toBeUndefined();
  });

  test("gera guidance quando o financeiro do mês ainda não foi registrado", () => {
    const result = buildGuidanceEngine();
    const item = result.items.find((i) => i.id === "eng_fin_snapshot_ausente");
    expect(item).toBeDefined();
    expect(item?.prioridade).toBe("planejamento");
  });

  test("gera guidance para inadimplência registrada acima de 10%", () => {
    localStorage.setItem("amigo_financial_snapshots", JSON.stringify([{
      id: "fin_test",
      month: new Date().toISOString().slice(0, 7),
      estimatedBalance: 12000,
      delinquencyRate: 15,
      liquidityReserve: 8000,
      entries: [],
      createdAt: new Date().toISOString(),
    }]));
    const result = buildGuidanceEngine();
    const item = result.items.find((i) => i.id === "eng_fin_inadimplencia_alta");
    expect(item).toBeDefined();
    expect(item?.checklist).toContain("Evitar tratar o resumo como cobrança oficial");
  });

  test("gera guidance para reserva financeira baixa", () => {
    localStorage.setItem("amigo_financial_snapshots", JSON.stringify([{
      id: "fin_test",
      month: new Date().toISOString().slice(0, 7),
      estimatedBalance: 5000,
      delinquencyRate: 4,
      liquidityReserve: 1000,
      entries: [
        { id: "d1", type: "despesa", title: "Manutenção", amount: 10000, status: "previsto", createdAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
    }]));
    const result = buildGuidanceEngine();
    const item = result.items.find((i) => i.id === "eng_fin_reserva_baixa");
    expect(item).toBeDefined();
    expect(item?.proximoPasso).toContain("Revisar despesas previstas");
  });
});
