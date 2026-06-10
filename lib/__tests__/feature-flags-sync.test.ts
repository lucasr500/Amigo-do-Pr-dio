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

import { isEnabled, setFlag, resetFlag, enableSyncOnAuth } from "@/lib/feature-flags";

describe("enableSyncOnAuth", () => {
  beforeEach(() => {
    store.clear();
  });

  afterEach(() => {
    store.clear();
  });

  test("ativa sync_enabled quando não há override", () => {
    expect(isEnabled("sync_enabled")).toBe(false); // default é false
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("idempotente — segunda chamada não muda nada", () => {
    enableSyncOnAuth();
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("não sobrescreve override explícito false do usuário", () => {
    setFlag("sync_enabled", false); // usuário desativou explicitamente
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(false);
  });

  test("não sobrescreve override explícito true do usuário", () => {
    setFlag("sync_enabled", true);
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(true);
  });

  test("não afeta outros flags", () => {
    const before = isEnabled("auth_enabled");
    enableSyncOnAuth();
    expect(isEnabled("auth_enabled")).toBe(before);
  });

  test("resetFlag desfaz o efeito", () => {
    enableSyncOnAuth();
    expect(isEnabled("sync_enabled")).toBe(true);
    resetFlag("sync_enabled");
    expect(isEnabled("sync_enabled")).toBe(false); // volta ao default
  });
});
