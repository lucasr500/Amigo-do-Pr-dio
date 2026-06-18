import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  addDecision,
  getDecisions,
  normalizeDecision,
  saveDecisions,
  updateDecision,
  type Decision,
} from "@/lib/decisions";
import { getTimeline } from "@/lib/community-timeline";

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

function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return normalizeDecision({
    id: "dec_1",
    title: "Contratar manutenção",
    date: "2026-01-01",
    category: "manutencao",
    context: "Contexto",
    rationale: "Fundamento",
    outcome: "Aprovado",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });
}

describe("decisions — status operacional", () => {
  test("criação de decisão usa status default registrada", () => {
    const d = addDecision({
      title: "Trocar portaria",
      date: "2026-06-01",
      category: "fornecedor",
      context: "",
      rationale: "",
      outcome: "Aprovado",
    });
    expect(d.status).toBe("registrada");
    expect(getDecisions()[0].status).toBe("registrada");
  });

  test("normaliza decisão antiga sem status como registrada", () => {
    localStorage.setItem("amigo_decisions", JSON.stringify([{ ...makeDecision(), status: undefined }]));
    expect(getDecisions()[0].status).toBe("registrada");
  });

  test("alteração de status é persistida", () => {
    saveDecisions([makeDecision()]);
    updateDecision("dec_1", { status: "em_execucao" });
    expect(getDecisions()[0].status).toBe("em_execucao");
  });

  test("status inválido é normalizado para registrada", () => {
    const d = normalizeDecision({ ...makeDecision(), status: "finalizada" as never });
    expect(d.status).toBe("registrada");
  });

  test("preserva linkedPendenciaId ao salvar e ler", () => {
    saveDecisions([makeDecision({ linkedPendenciaId: "pend_123" })]);
    expect(getDecisions()[0].linkedPendenciaId).toBe("pend_123");
  });

  test("mudar status para concluída emite timeline uma vez", () => {
    saveDecisions([makeDecision()]);
    updateDecision("dec_1", { status: "concluida" });
    updateDecision("dec_1", { status: "concluida" });
    const events = getTimeline().filter((e) => e.sourceModule === "decisions" && e.sourceId === "dec_1");
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("Concluída");
  });
});


describe("decisions — visibilidade (paridade local↔remoto)", () => {
  test("default de visibilidade é gestao quando ausente", () => {
    const d = normalizeDecision({ ...makeDecision(), visibility: undefined });
    expect(d.visibility).toBe("gestao");
  });

  test("visibilidade inválida cai para gestao", () => {
    const d = normalizeDecision({ ...makeDecision(), visibility: "qualquer" as never });
    expect(d.visibility).toBe("gestao");
  });

  test("preserva visibilidade válida", () => {
    const d = normalizeDecision({ ...makeDecision(), visibility: "moradores" });
    expect(d.visibility).toBe("moradores");
  });

  test("addDecision sem visibility usa gestao; com visibility preserva", () => {
    const semVis = addDecision({ title: "X", date: "2026-06-01", category: "juridico", context: "", rationale: "", outcome: "ok" });
    expect(semVis.visibility).toBe("gestao");
    const comVis = addDecision({ title: "Y", date: "2026-06-01", category: "juridico", context: "", rationale: "", outcome: "ok", visibility: "conselho" });
    expect(comVis.visibility).toBe("conselho");
  });
});
