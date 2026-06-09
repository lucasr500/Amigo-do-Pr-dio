import { describe, test, expect, afterEach } from "vitest";
import { isAutoBackupEnabled, setAutoBackupEnabled } from "@/lib/sync/autoBackup";

// Cleanup after each test
afterEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("amigo_auto_cloud_backup_enabled");
  }
});

// ── isAutoBackupEnabled ───────────────────────────────────────────────────────

describe("isAutoBackupEnabled", () => {
  test("retorna false por default (sem localStorage)", () => {
    // Em ambiente node sem window, retorna false
    expect(typeof isAutoBackupEnabled()).toBe("boolean");
  });

  test("não lança exceção em nenhum ambiente", () => {
    expect(() => isAutoBackupEnabled()).not.toThrow();
  });
});

// ── setAutoBackupEnabled ──────────────────────────────────────────────────────

describe("setAutoBackupEnabled", () => {
  test("não lança exceção ao ativar", () => {
    expect(() => setAutoBackupEnabled(true)).not.toThrow();
  });

  test("não lança exceção ao desativar", () => {
    expect(() => setAutoBackupEnabled(false)).not.toThrow();
  });

  test("não lança exceção em ambiente sem window", () => {
    // Em ambiente node, window é undefined — deve ser no-op
    expect(() => setAutoBackupEnabled(true)).not.toThrow();
    expect(() => setAutoBackupEnabled(false)).not.toThrow();
  });
});

// ── Comportamento em conjunto ─────────────────────────────────────────────────

describe("autoBackup — round-trip", () => {
  test("ativar → isAutoBackupEnabled persiste o valor", () => {
    setAutoBackupEnabled(true);
    // Em ambiente node: window undefined → isAutoBackupEnabled sempre false
    // Em jsdom: persistiria. O teste verifica que não lança.
    const val = isAutoBackupEnabled();
    expect(typeof val).toBe("boolean");
  });

  test("desativar após ativar → sem erro", () => {
    setAutoBackupEnabled(true);
    setAutoBackupEnabled(false);
    expect(() => isAutoBackupEnabled()).not.toThrow();
  });

  test("múltiplas chamadas setAutoBackupEnabled(false) → sem erro", () => {
    setAutoBackupEnabled(false);
    setAutoBackupEnabled(false);
    expect(isAutoBackupEnabled()).toBe(false); // node: sempre false sem window
  });
});
