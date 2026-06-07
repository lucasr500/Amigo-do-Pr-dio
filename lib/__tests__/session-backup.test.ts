import { describe, test, expect } from "vitest";
import { parseAndValidateUserData } from "@/lib/session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeV8Backup(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: "8",
    app: "amigo-do-predio",
    exportedAt: "2026-06-04T00:00:00Z",
    profile: null,
    memoria: {},
    favorites: [],
    checklists: {},
    pendencias: [],
    ocorrencias: [],
    agenda: [],
    memoriaAssistida: {},
    documentos: [],
    funcionarios: [],
    manutencoes: [],
    financialSnapshots: [],
    ...overrides,
  });
}

function makeV1Backup(): string {
  return JSON.stringify({
    version: "1",
    app: "amigo-do-predio",
    exportedAt: "2020-01-01T00:00:00Z",
    profile: null,
    memoria: {},
    favorites: [],
    checklists: {},
  });
}

// ─── parseAndValidateUserData ─────────────────────────────────────────────────

describe("parseAndValidateUserData — versões aceitas", () => {
  test("v8 backup → success", () => {
    const result = parseAndValidateUserData(makeV8Backup());
    expect(result.success).toBe(true);
  });

  test("v7 backup → success (retrocompat)", () => {
    const result = parseAndValidateUserData(makeV8Backup({ version: "7" }));
    expect(result.success).toBe(true);
  });

  test("v6 backup (sem financeiro) → success", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ version: "6", financialSnapshots: undefined })
    );
    expect(result.success).toBe(true);
  });

  test("v1 backup mínimo (sem pendências, agenda, docs) → success", () => {
    const result = parseAndValidateUserData(makeV1Backup());
    expect(result.success).toBe(true);
  });

  test("v9 backup (com monthlyReviewHistory) → success", () => {
    const result = parseAndValidateUserData(makeV8Backup({ version: "9", monthlyReviewHistory: [] }));
    expect(result.success).toBe(true);
  });

  test("v9 backup sem monthlyReviewHistory → success (campo opcional)", () => {
    const result = parseAndValidateUserData(makeV8Backup({ version: "9" }));
    expect(result.success).toBe(true);
  });

  test("versão '0' → failure", () => {
    const result = parseAndValidateUserData(makeV8Backup({ version: "0" }));
    expect(result.success).toBe(false);
  });
});

describe("parseAndValidateUserData — JSON inválido e formato errado", () => {
  test("JSON inválido → failure", () => {
    expect(parseAndValidateUserData("{invalid-json").success).toBe(false);
  });

  test("string vazia → failure", () => {
    expect(parseAndValidateUserData("").success).toBe(false);
  });

  test("JSON array (não objeto) → failure", () => {
    expect(parseAndValidateUserData("[]").success).toBe(false);
  });

  test("JSON null → failure", () => {
    expect(parseAndValidateUserData("null").success).toBe(false);
  });

  test("app errado → failure", () => {
    const result = parseAndValidateUserData(makeV8Backup({ app: "outro-app" }));
    expect(result.success).toBe(false);
  });
});

describe("parseAndValidateUserData — campos corrompidos", () => {
  test("memoria ausente → failure", () => {
    const bad = JSON.stringify({
      version: "8", app: "amigo-do-predio", exportedAt: "2026-01-01T00:00:00Z",
      profile: null, favorites: [], checklists: {},
      pendencias: [], ocorrencias: [], agenda: [],
    });
    expect(parseAndValidateUserData(bad).success).toBe(false);
  });

  test("favorites ausente → failure", () => {
    const bad = JSON.stringify({
      version: "8", app: "amigo-do-predio", exportedAt: "2026-01-01T00:00:00Z",
      profile: null, memoria: {}, checklists: {},
      pendencias: [], ocorrencias: [], agenda: [],
    });
    expect(parseAndValidateUserData(bad).success).toBe(false);
  });

  test("v8 sem ocorrencias → failure (obrigatório em v8)", () => {
    const bad = JSON.stringify({
      version: "8", app: "amigo-do-predio", exportedAt: "2026-01-01T00:00:00Z",
      profile: null, memoria: {}, favorites: [], checklists: {},
      pendencias: [], agenda: [],
      // ocorrencias: ausente
    });
    expect(parseAndValidateUserData(bad).success).toBe(false);
  });

  test("v8 sem agenda → failure (obrigatório em v8)", () => {
    const bad = JSON.stringify({
      version: "8", app: "amigo-do-predio", exportedAt: "2026-01-01T00:00:00Z",
      profile: null, memoria: {}, favorites: [], checklists: {},
      pendencias: [], ocorrencias: [],
      // agenda: ausente
    });
    expect(parseAndValidateUserData(bad).success).toBe(false);
  });

  test("financialSnapshots como string (não array) em v8 → failure", () => {
    const result = parseAndValidateUserData(makeV8Backup({ financialSnapshots: "corrompido" }));
    expect(result.success).toBe(false);
  });

  test("financialSnapshots como objeto (não array) em v7 → failure", () => {
    const result = parseAndValidateUserData(makeV8Backup({ version: "7", financialSnapshots: {} }));
    expect(result.success).toBe(false);
  });
});

describe("parseAndValidateUserData — campos opcionais e extras", () => {
  test("financialSnapshots ausente em v8 → success (campo opcional)", () => {
    // Validação só falha se presente E não for array
    const backup = JSON.stringify({
      version: "8", app: "amigo-do-predio", exportedAt: "2026-01-01T00:00:00Z",
      profile: null, memoria: {}, favorites: [], checklists: {},
      pendencias: [], ocorrencias: [], agenda: [],
      // financialSnapshots: ausente
    });
    expect(parseAndValidateUserData(backup).success).toBe(true);
  });

  test("campos extras desconhecidos → success (forward compat)", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ campoFuturo: "dados", versaoExtra: 42 })
    );
    expect(result.success).toBe(true);
  });

  test("summary retorna nomeCondominio quando profile presente", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ profile: { nomeCondominio: "Edifício Teste" } })
    );
    if (!result.success) throw new Error("Expected success");
    expect(result.summary.nomeCondominio).toBe("Edifício Teste");
  });

  test("summary.memoriaCount reflete dados da memória", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ memoria: { vencimentoAVCB: "2026-12-01", administradora: "ABC" } })
    );
    if (!result.success) throw new Error("Expected success");
    expect(result.summary.memoriaCount).toBe(2);
  });

  test("summary.financialSnapshotsCount reflete array de snapshots em v8", () => {
    const snap = { id: "s1", month: "2026-06", estimatedBalance: 0, entries: [], createdAt: "2026-01-01T00:00:00Z" };
    const result = parseAndValidateUserData(makeV8Backup({ financialSnapshots: [snap] }));
    if (!result.success) throw new Error("Expected success");
    expect(result.summary.financialSnapshotsCount).toBe(1);
  });
});

describe("parseAndValidateUserData — v9 específico", () => {
  const reviewSnap = {
    month: "2026-05",
    score: 80,
    status: "concluida" as const,
    completedAt: "2026-05-31T10:00:00Z",
    headline: "Condomínio em ordem",
    criticalCount: 0,
    warningCount: 1,
    infoCount: 2,
    checkedCount: 7,
    totalItems: 9,
    topItems: [],
  };

  test("monthlyReviewHistory como string em v9 → failure", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ version: "9", monthlyReviewHistory: "corrompido" })
    );
    expect(result.success).toBe(false);
  });

  test("monthlyReviewHistory como objeto em v9 → failure", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ version: "9", monthlyReviewHistory: {} })
    );
    expect(result.success).toBe(false);
  });

  test("summary.monthlyReviewHistoryCount reflete array em v9", () => {
    const result = parseAndValidateUserData(
      makeV8Backup({ version: "9", monthlyReviewHistory: [reviewSnap] })
    );
    if (!result.success) throw new Error("Expected success");
    expect(result.summary.monthlyReviewHistoryCount).toBe(1);
  });

  test("monthlyReviewHistoryCount é undefined em v8", () => {
    const result = parseAndValidateUserData(makeV8Backup());
    if (!result.success) throw new Error("Expected success");
    expect(result.summary.monthlyReviewHistoryCount).toBeUndefined();
  });

  test("versão '12' (futura) → failure", () => {
    const result = parseAndValidateUserData(makeV8Backup({ version: "12" }));
    expect(result.success).toBe(false);
  });
});
