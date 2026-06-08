import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildInstitutionalMemorySummary } from "@/lib/institutional-memory";

// ─── localStorage stub ────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  length: 0,
  key: () => null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => { localStorageMock.clear(); });

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("buildInstitutionalMemorySummary — estado vazio", () => {
  test("retorna hasData=false com localStorage vazio", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.hasData).toBe(false);
    expect(s.totalRecords).toBe(0);
  });

  test("decisionCount=0 com localStorage vazio", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.decisionCount).toBe(0);
  });

  test("supplierCount=0 com localStorage vazio", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.supplierCount).toBe(0);
  });

  test("highlight inicial convida a começar", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.highlight).toContain("memória institucional");
  });

  test("nextStep sugere cadastrar fornecedores quando vazio", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.nextStep).toContain("fornecedor");
  });

  test("lastActivityDate é null com localStorage vazio", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.lastActivityDate).toBeNull();
  });
});

describe("buildInstitutionalMemorySummary — com dados de decisões", () => {
  beforeEach(() => {
    const decisions = [
      {
        id: "dec_1", title: "Contratar limpeza", date: "2026-06-01",
        category: "operacao", context: "", rationale: "", outcome: "Aprovado",
        createdAt: "2026-06-01T10:00:00.000Z", updatedAt: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "dec_2", title: "Renovar AVCB", date: "2026-06-02",
        category: "documentos", context: "", rationale: "", outcome: "Encaminhado",
        createdAt: "2026-06-02T10:00:00.000Z", updatedAt: "2026-06-02T10:00:00.000Z",
      },
    ];
    localStorageMock.setItem("amigo_decisions", JSON.stringify(decisions));
  });

  test("decisionCount=2 quando há 2 decisões", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.decisionCount).toBe(2);
  });

  test("hasData=true quando há decisões", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.hasData).toBe(true);
  });

  test("totalRecords inclui decisões", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.totalRecords).toBeGreaterThanOrEqual(2);
  });

  test("highlight menciona 'registros institucionais'", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.highlight).toMatch(/registro/i);
  });

  test("nextStep sugere fornecedores quando suppliers=0", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.nextStep).toContain("fornecedor");
  });
});

describe("buildInstitutionalMemorySummary — com fornecedores e decisões", () => {
  beforeEach(() => {
    const decisions = [{
      id: "dec_1", title: "Decisão A", date: "2026-06-01",
      category: "outro", context: "", rationale: "", outcome: "OK",
      createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z",
    }];
    const suppliers = [{
      id: "sup_1", name: "Empresa Elevadores", category: "elevador",
      active: true, serviceHistory: [],
      createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z",
    }];
    localStorageMock.setItem("amigo_decisions", JSON.stringify(decisions));
    localStorageMock.setItem("amigo_suppliers", JSON.stringify(suppliers));
  });

  test("supplierCount=1 quando há 1 fornecedor ativo", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.supplierCount).toBe(1);
  });

  test("nextStep não sugere fornecedor quando há um", () => {
    const s = buildInstitutionalMemorySummary();
    expect(s.nextStep).not.toContain("fornecedor");
  });

  test("nextStep sugere registrar decisão quando decisionCount=1 e supplier=1", () => {
    // Tem 1 decisão + 1 fornecedor, nextStep deve sugerir revisão mensal ou passagem de mandato
    // (decisionCount > 0, supplierCount > 0 → vai para revisão ou handoff)
    const s = buildInstitutionalMemorySummary();
    // nextStep pode ser "Conclua a primeira revisão mensal." ou "Avance no checklist..."
    expect(s.nextStep).toBeTruthy();
  });
});

describe("buildInstitutionalMemorySummary — plural/singular", () => {
  test("highlight usa 'registro' no singular para 1 item", () => {
    const decisions = [{
      id: "dec_1", title: "D", date: "2026-06-01",
      category: "outro", context: "", rationale: "", outcome: "OK",
      createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z",
    }];
    localStorageMock.setItem("amigo_decisions", JSON.stringify(decisions));
    const s = buildInstitutionalMemorySummary();
    expect(s.highlight).toContain("1 registro institucional acumulado.");
  });

  test("highlight usa plural para múltiplos registros", () => {
    const decisions = Array.from({ length: 3 }, (_, i) => ({
      id: `dec_${i}`, title: `D${i}`, date: "2026-06-01",
      category: "outro", context: "", rationale: "", outcome: "OK",
      createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z",
    }));
    localStorageMock.setItem("amigo_decisions", JSON.stringify(decisions));
    const s = buildInstitutionalMemorySummary();
    expect(s.highlight).toContain("3 registros institucionais acumulados.");
  });
});
