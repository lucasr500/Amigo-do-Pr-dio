import { describe, test, expect } from "vitest";
import { runLocalDataValidationChecks } from "@/lib/local-validation";

// ─── runLocalDataValidationChecks ────────────────────────────────────────────
// Testa a bateria de validações locais que roda dentro de buildLocalIntegrityReport.
// Em ambiente Node (sem localStorage real), as funções de normalização são
// chamadas diretamente com dados sintéticos — não dependem de estado do browser.

describe("runLocalDataValidationChecks — contagem e estrutura", () => {
  test("retorna exatamente 12 verificações", () => {
    const checks = runLocalDataValidationChecks();
    expect(checks).toHaveLength(12);
  });

  test("cada verificação tem id e label preenchidos", () => {
    const checks = runLocalDataValidationChecks();
    for (const c of checks) {
      expect(c.id.length).toBeGreaterThan(0);
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  test("ids são únicos", () => {
    const checks = runLocalDataValidationChecks();
    const ids = checks.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("runLocalDataValidationChecks — todas passam no estado padrão", () => {
  test("todas as verificações retornam ok=true", () => {
    const checks = runLocalDataValidationChecks();
    const failed = checks.filter(c => !c.ok);
    // Se alguma falhou, mostrar qual para facilitar diagnóstico
    if (failed.length > 0) {
      throw new Error(`Verificações falhando: ${failed.map(c => c.id).join(", ")}`);
    }
    expect(failed).toHaveLength(0);
  });
});

describe("runLocalDataValidationChecks — verificações específicas", () => {
  test("normalize_pendencia: pendência inválida normaliza corretamente", () => {
    const checks = runLocalDataValidationChecks();
    const check = checks.find(c => c.id === "normalize_pendencia");
    expect(check).toBeDefined();
    expect(check?.ok).toBe(true);
  });

  test("normalize_agenda: evento com data inválida normaliza sem exceção", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "normalize_agenda");
    expect(check?.ok).toBe(true);
  });

  test("normalize_financial: NaN em amount normaliza para 0", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "normalize_financial");
    expect(check?.ok).toBe(true);
  });

  test("current_backup_parse: export atual (v8) é aceito pelo parser", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "current_backup_parse");
    expect(check?.ok).toBe(true);
  });

  test("invalid_backup_rejected: JSON inválido é rejeitado pelo parser", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "invalid_backup_rejected");
    expect(check?.ok).toBe(true);
  });

  test("v8_synthetic_accepted: backup v8 sintético é aceito", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "v8_synthetic_accepted");
    expect(check?.ok).toBe(true);
  });

  test("v7_synthetic_accepted: backup v7 ainda é aceito (retrocompat)", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "v7_synthetic_accepted");
    expect(check?.ok).toBe(true);
  });

  test("v1_synthetic_accepted: backup v1 mínimo ainda é aceito (retrocompat)", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "v1_synthetic_accepted");
    expect(check?.ok).toBe(true);
  });
});

describe("runLocalDataValidationChecks — edge cases de recorrência (regressão)", () => {
  test("recurrence_jan31_mensal: 31/jan + mensal = 28/fev (não 03/mar)", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "recurrence_jan31_mensal");
    expect(check?.ok).toBe(true);
  });

  test("recurrence_jan31_trimestral: 31/jan + trimestral = 30/abr", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "recurrence_jan31_trimestral");
    expect(check?.ok).toBe(true);
  });

  test("recurrence_aug31_mensal: 31/ago + mensal = 30/set", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "recurrence_aug31_mensal");
    expect(check?.ok).toBe(true);
  });

  test("recurrence_feb29_anual: 29/fev/2024 + anual = 28/fev/2025", () => {
    const check = runLocalDataValidationChecks().find(c => c.id === "recurrence_feb29_anual");
    expect(check?.ok).toBe(true);
  });
});
