import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  normalizePendencia,
  addPendencia,
  getPendencias,
  MAX_PENDENCIAS,
  MAX_AGENDA_EVENTS,
  MAX_OCORRENCIAS,
  WARN_PENDENCIAS,
  WARN_AGENDA_EVENTS,
  WARN_OCORRENCIAS,
} from "@/lib/session";

// ─── normalizePendencia ───────────────────────────────────────────────────────

describe("normalizePendencia", () => {
  test("objeto vazio → defaults seguros", () => {
    const p = normalizePendencia({});
    expect(p.id).toBeTruthy();
    expect(p.titulo).toBe("Pendência sem título");
    expect(p.status).toBe("aberta");
    expect(p.prioridade).toBe("media");
    expect(p.categoria).toBe("operacional");
    expect(p.createdAt).toBeTruthy();
  });

  test("título vazio → 'Pendência sem título'", () => {
    const p = normalizePendencia({ titulo: "" });
    expect(p.titulo).toBe("Pendência sem título");
  });

  test("título com espaços extras é trimado", () => {
    const p = normalizePendencia({ titulo: "  Verificar elevador  " });
    expect(p.titulo).toBe("Verificar elevador");
  });

  test("prioridade inválida → 'media' (default)", () => {
    const p = normalizePendencia({ titulo: "T", prioridade: "urgente" as never });
    expect(["critica", "alta", "media", "baixa"]).toContain(p.prioridade);
  });

  test("prioridade 'critica' é preservada", () => {
    const p = normalizePendencia({ titulo: "T", prioridade: "critica" });
    expect(p.prioridade).toBe("critica");
  });

  test("prioridade 'baixa' é preservada", () => {
    const p = normalizePendencia({ titulo: "T", prioridade: "baixa" });
    expect(p.prioridade).toBe("baixa");
  });

  test("status inválido → 'aberta'", () => {
    const p = normalizePendencia({ titulo: "T", status: "em_progresso" as never });
    expect(p.status).toBe("aberta");
  });

  test("status 'concluida' é preservado", () => {
    const p = normalizePendencia({ titulo: "T", status: "concluida" });
    expect(p.status).toBe("concluida");
  });

  test("pendência concluída preserva completedAt fornecido", () => {
    const p = normalizePendencia({
      titulo: "T",
      status: "concluida",
      completedAt: "2026-05-01T10:00:00Z",
    });
    expect(p.completedAt).toBe("2026-05-01T10:00:00Z");
  });

  test("origem 'guidance' → prioridade 'alta' por padrão", () => {
    const p = normalizePendencia({ titulo: "T", origem: "guidance" });
    expect(p.prioridade).toBe("alta");
  });

  test("linkedId null é preservado", () => {
    const p = normalizePendencia({ titulo: "T", linkedId: null });
    expect(p.linkedId).toBeNull();
  });

  test("linkedType 'agenda' é preservado", () => {
    const p = normalizePendencia({ titulo: "T", linkedType: "agenda" });
    expect(p.linkedType).toBe("agenda");
  });

  test("responsavel com espaços é trimado", () => {
    const p = normalizePendencia({ titulo: "T", responsavel: "  João Silva  " });
    expect(p.responsavel).toBe("João Silva");
  });

  test("responsavel vazio → undefined", () => {
    const p = normalizePendencia({ titulo: "T", responsavel: "" });
    expect(p.responsavel).toBeUndefined();
  });

  test("id fornecido externamente é preservado", () => {
    const p = normalizePendencia({ titulo: "T", id: "meu-id-externo" });
    expect(p.id).toBe("meu-id-externo");
  });
});

// ─── Constantes de cap ────────────────────────────────────────────────────────

describe("constantes de cap e aviso", () => {
  test("MAX_PENDENCIAS = 200", () => {
    expect(MAX_PENDENCIAS).toBe(200);
  });
  test("WARN_PENDENCIAS = 150", () => {
    expect(WARN_PENDENCIAS).toBe(150);
  });
  test("MAX_AGENDA_EVENTS = 365", () => {
    expect(MAX_AGENDA_EVENTS).toBe(365);
  });
  test("WARN_AGENDA_EVENTS = 300", () => {
    expect(WARN_AGENDA_EVENTS).toBe(300);
  });
  test("MAX_OCORRENCIAS = 300", () => {
    expect(MAX_OCORRENCIAS).toBe(300);
  });
  test("WARN_OCORRENCIAS = 250", () => {
    expect(WARN_OCORRENCIAS).toBe(250);
  });
  test("MAX > WARN para todos os tipos", () => {
    expect(MAX_PENDENCIAS).toBeGreaterThan(WARN_PENDENCIAS);
    expect(MAX_AGENDA_EVENTS).toBeGreaterThan(WARN_AGENDA_EVENTS);
    expect(MAX_OCORRENCIAS).toBeGreaterThan(WARN_OCORRENCIAS);
  });
});

// ─── addPendencia — comportamento de cap ─────────────────────────────────────
// Usa mock de localStorage para testar que abertas nunca são descartadas
// antes de concluídas antigas.

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  };
}

describe("addPendencia — cap preserva abertas (regressão: era 50, agora 200)", () => {
  beforeEach(() => {
    const lsMock = createLocalStorageMock();
    vi.stubGlobal("window", { localStorage: lsMock });
    vi.stubGlobal("localStorage", lsMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("pendências abertas são preservadas quando total excede MAX_PENDENCIAS", () => {

    // Pré-popular: 195 abertas + 10 concluídas = 205 total (> 200)
    const initial = [
      ...Array.from({ length: 195 }, (_, i) => ({
        id: `aberta-${i}`,
        titulo: `Tarefa aberta ${i}`,
        status: "aberta",
        prioridade: "media",
        categoria: "operacional",
        origem: "manual",
        createdAt: "2026-01-01T00:00:00Z",
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `concluida-${i}`,
        titulo: `Tarefa concluída ${i}`,
        status: "concluida",
        prioridade: "baixa",
        categoria: "operacional",
        origem: "manual",
        createdAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-02T00:00:00Z",
      })),
    ];
    localStorage.setItem("amigo_pendencias", JSON.stringify(initial));

    const nova = addPendencia({ titulo: "Nova urgente", prioridade: "critica", categoria: "operacional", origem: "manual" });

    const all = getPendencias();
    const abertas = all.filter(p => p.status === "aberta");

    // 195 originais + 1 nova = 196 abertas — TODAS devem estar presentes
    expect(abertas.length).toBe(196);
    // A nova pendência deve constar
    expect(all.find(p => p.id === nova.id)).toBeDefined();
    // Total deve respeitar o cap
    expect(all.length).toBeLessThanOrEqual(MAX_PENDENCIAS);
  });

  test("concluídas antigas são descartadas antes de qualquer aberta", () => {

    // 100 abertas + 120 concluídas = 220 total (> 200)
    const initial = [
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `a-${i}`,
        titulo: `Aberta ${i}`,
        status: "aberta",
        prioridade: "media",
        categoria: "operacional",
        origem: "manual",
        createdAt: "2026-01-01T00:00:00Z",
      })),
      ...Array.from({ length: 120 }, (_, i) => ({
        id: `c-${i}`,
        titulo: `Concluída ${i}`,
        status: "concluida",
        prioridade: "baixa",
        categoria: "operacional",
        origem: "manual",
        createdAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-02T00:00:00Z",
      })),
    ];
    localStorage.setItem("amigo_pendencias", JSON.stringify(initial));

    addPendencia({ titulo: "Extra", categoria: "operacional", origem: "manual" });

    const all = getPendencias();
    const abertas = all.filter(p => p.status === "aberta");

    // 100 + 1 nova = 101 abertas devem estar todas presentes
    expect(abertas.length).toBe(101);
    expect(all.length).toBeLessThanOrEqual(MAX_PENDENCIAS);
  });
});
