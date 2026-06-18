import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildAssemblyHomeSummary } from "@/lib/assembly-home";
import { addAssembly, addAgendaItem, updateAgendaItem } from "@/lib/session-assembleias";

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

describe("buildAssemblyHomeSummary", () => {
  test("sem assembleias → CTA preparar e headline de criação", () => {
    const s = buildAssemblyHomeSummary();
    expect(s.hasAny).toBe(false);
    expect(s.focus).toBeNull();
    expect(s.cta).toBe("preparar");
    expect(s.headline).toMatch(/prepare/i);
  });

  test("rascunho sem itens → preparar; com itens → convocar", () => {
    const a = addAssembly({ titulo: "AGO 2026", tipo: "ago", status: "rascunho" });
    expect(buildAssemblyHomeSummary().cta).toBe("preparar");
    addAgendaItem({ assemblyId: a.id, titulo: "Prestação de contas", tipo: "deliberacao" });
    const s = buildAssemblyHomeSummary();
    expect(s.cta).toBe("convocar");
    expect(s.focus?.id).toBe(a.id);
    expect(s.itemCount).toBe(1);
  });

  test("convocada com deliberação pendente → deliberar com contagem", () => {
    const a = addAssembly({ titulo: "AGE Fachada", tipo: "age", status: "convocada" });
    addAgendaItem({ assemblyId: a.id, titulo: "Pintura da fachada", tipo: "deliberacao" });
    addAgendaItem({ assemblyId: a.id, titulo: "Informe de obras", tipo: "informe" });
    const s = buildAssemblyHomeSummary();
    expect(s.cta).toBe("deliberar");
    expect(s.pendingDeliberations).toBe(1);
    expect(s.headline).toMatch(/aguardando deliberação/i);
  });

  test("convocada com tudo decidido → ver", () => {
    const a = addAssembly({ titulo: "AGO Decidida", tipo: "ago", status: "convocada" });
    const item = addAgendaItem({ assemblyId: a.id, titulo: "Orçamento", tipo: "deliberacao" });
    updateAgendaItem(item.id, { resultado: "Aprovado", decididoEm: new Date().toISOString() });
    const s = buildAssemblyHomeSummary();
    expect(s.pendingDeliberations).toBe(0);
    expect(s.cta).toBe("ver");
  });

  test("foco prioriza a que demanda ação (convocada > realizada)", () => {
    addAssembly({ titulo: "Antiga realizada", tipo: "ago", status: "realizada" });
    const ativa = addAssembly({ titulo: "Ativa convocada", tipo: "age", status: "convocada" });
    expect(buildAssemblyHomeSummary().focus?.id).toBe(ativa.id);
  });
});
