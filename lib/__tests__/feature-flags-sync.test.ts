import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// Simula localStorage em ambiente Node
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  length: 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key: (_: number) => null,
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });

import {
  isEnabled,
  resetFlag,
  enableSyncOnAuth,
  syncFollowsAuth,
  setSyncPreference,
} from "@/lib/feature-flags";

describe("syncFollowsAuth — sync segue a autenticação", () => {
  beforeEach(() => { store.clear(); });
  afterEach(() => { store.clear(); });

  test("default é off (anônimo)", () => {
    expect(isEnabled("sync_enabled")).toBe(false);
  });

  test("autenticado → liga sync", () => {
    syncFollowsAuth(true);
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("anônimo → desliga sync", () => {
    syncFollowsAuth(true);
    expect(isEnabled("sync_enabled")).toBe(true);
    syncFollowsAuth(false);
    expect(isEnabled("sync_enabled")).toBe(false);
  });

  test("segue transições de auth sem escolha explícita", () => {
    syncFollowsAuth(true);
    syncFollowsAuth(false);
    syncFollowsAuth(true);
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("idempotente", () => {
    syncFollowsAuth(true);
    syncFollowsAuth(true);
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("não afeta outros flags", () => {
    const before = isEnabled("auth_enabled");
    syncFollowsAuth(true);
    expect(isEnabled("auth_enabled")).toBe(before);
  });
});

describe("setSyncPreference — escolha explícita do usuário precede a regra", () => {
  beforeEach(() => { store.clear(); });
  afterEach(() => { store.clear(); });

  test("escolha false do usuário não é sobrescrita ao autenticar", () => {
    setSyncPreference(false);
    syncFollowsAuth(true);
    expect(isEnabled("sync_enabled")).toBe(false);
  });

  test("escolha true do usuário não é sobrescrita ao virar anônimo", () => {
    setSyncPreference(true);
    syncFollowsAuth(false);
    expect(isEnabled("sync_enabled")).toBe(true);
  });
});

describe("enableSyncOnAuth — compat (equivale a autenticar)", () => {
  beforeEach(() => { store.clear(); });
  afterEach(() => { store.clear(); });

  test("liga sync quando não há escolha explícita", () => {
    expect(isEnabled("sync_enabled")).toBe(false);
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("resetFlag volta ao default", () => {
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(true);
    resetFlag("sync_enabled");
    expect(isEnabled("sync_enabled")).toBe(false);
  });
});
