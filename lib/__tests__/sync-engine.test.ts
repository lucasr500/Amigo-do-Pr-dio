import { describe, test, expect } from "vitest";
import { buildSnapshot } from "@/lib/sync/syncEngine";
import { SESSION_SCHEMA_VERSION } from "@/lib/session";
import type { UserBackup } from "@/lib/session";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBackup(overrides: Partial<UserBackup> = {}): UserBackup {
  return {
    version: "12",
    app: "amigo-do-predio",
    exportedAt: new Date().toISOString(),
    profile: null,
    memoria: {},
    favorites: [],
    checklists: {},
    ...overrides,
  } as UserBackup;
}

// ── buildSnapshot ─────────────────────────────────────────────────────────────

describe("buildSnapshot", () => {
  test("payload inclui userId, version e payload corretos", () => {
    const backup = makeBackup({ profile: { nomeCondominio: "Ed. Teste" } as never });
    const snap = buildSnapshot("user-uuid-123", backup);
    expect(snap.user_id).toBe("user-uuid-123");
    expect(snap.version).toBe(SESSION_SCHEMA_VERSION);
    expect(snap.payload).toBe(backup);
  });

  test("device_hint é null em ambiente sem navigator", () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
    const snap = buildSnapshot("uid", makeBackup());
    expect(snap.device_hint).toBeNull();
    Object.defineProperty(globalThis, "navigator", { value: original, configurable: true });
  });

  test("buildSnapshot com backup v12 completo mantém todos os campos", () => {
    const backup = makeBackup({
      pendencias: [],
      ocorrencias: [],
      agenda: [],
      communityPosts: [],
      communityRequests: [],
      communityReservations: [],
    });
    const snap = buildSnapshot("u1", backup);
    expect(snap.payload.version).toBe("12");
    expect(Array.isArray(snap.payload.pendencias)).toBe(true);
    expect(Array.isArray(snap.payload.communityReservations)).toBe(true);
  });
});

// ── uploadSnapshot — guard userId ────────────────────────────────────────────

describe("uploadSnapshot — guards", () => {
  test("userId 'guest' → retorna erro sem chamar Supabase", async () => {
    const { uploadSnapshot } = await import("@/lib/sync/syncEngine");
    const result = await uploadSnapshot("guest", makeBackup());
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test("userId vazio → retorna erro", async () => {
    const { uploadSnapshot } = await import("@/lib/sync/syncEngine");
    const result = await uploadSnapshot("", makeBackup());
    expect(result.ok).toBe(false);
  });
});

// ── downloadSnapshot — guard userId ──────────────────────────────────────────

describe("downloadSnapshot — guards", () => {
  test("userId 'guest' → retorna null", async () => {
    const { downloadSnapshot } = await import("@/lib/sync/syncEngine");
    const result = await downloadSnapshot("guest");
    expect(result).toBeNull();
  });

  test("userId vazio → retorna null", async () => {
    const { downloadSnapshot } = await import("@/lib/sync/syncEngine");
    const result = await downloadSnapshot("");
    expect(result).toBeNull();
  });
});

// ── checkRemoteSnapshot — guard userId ───────────────────────────────────────

describe("checkRemoteSnapshot — guards", () => {
  test("userId 'guest' → { exists: false, ... }", async () => {
    const { checkRemoteSnapshot } = await import("@/lib/sync/syncEngine");
    const result = await checkRemoteSnapshot("guest");
    expect(result.exists).toBe(false);
    expect(result.version).toBeNull();
    expect(result.updatedAt).toBeNull();
  });

  test("userId vazio → { exists: false, ... }", async () => {
    const { checkRemoteSnapshot } = await import("@/lib/sync/syncEngine");
    const result = await checkRemoteSnapshot("");
    expect(result.exists).toBe(false);
  });
});

// ── autoSync — importação e guards ───────────────────────────────────────────
// Nota: autoSync usa localStorage via window-guards (no-op em ambiente node).
// Os testes verificam comportamento via isEnabled() que retorna defaults sem localStorage.

describe("scheduleSync — guards (sem localStorage / sync_enabled=false por default)", () => {
  test("scheduleSync não lança com userId real (sync_enabled=false por default)", async () => {
    const { scheduleSync } = await import("@/lib/sync/autoSync");
    // Com sync_enabled false (default sem localStorage), deve retornar silenciosamente
    expect(() => scheduleSync("real-user-id-abc")).not.toThrow();
  });

  test("scheduleSync não lança com userId 'guest'", async () => {
    const { scheduleSync } = await import("@/lib/sync/autoSync");
    expect(() => scheduleSync("guest")).not.toThrow();
  });

  test("scheduleSync não lança com userId vazio", async () => {
    const { scheduleSync } = await import("@/lib/sync/autoSync");
    expect(() => scheduleSync("")).not.toThrow();
  });
});

describe("flushPendingSync — guard sync_enabled", () => {
  test("flushPendingSync retorna sem lançar quando sync_enabled=false", async () => {
    const { flushPendingSync } = await import("@/lib/sync/autoSync");
    await expect(flushPendingSync()).resolves.toBeUndefined();
  });

  test("startOnlineListener retorna função de cleanup", async () => {
    const { startOnlineListener } = await import("@/lib/sync/autoSync");
    // Em ambiente sem window, deve retornar função no-op
    const cleanup = startOnlineListener();
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
  });
});
