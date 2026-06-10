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
  key: (_index: number) => null,
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });

import {
  getActiveCondominioId,
  setActiveCondominioId,
  clearActiveCondominioId,
} from "@/lib/tenant/tenantClient";

describe("getActiveCondominioId / setActiveCondominioId / clearActiveCondominioId", () => {
  beforeEach(() => {
    store.clear();
  });

  afterEach(() => {
    store.clear();
  });

  test("retorna null quando não há valor", () => {
    expect(getActiveCondominioId()).toBeNull();
  });

  test("persiste e retorna o id definido", () => {
    setActiveCondominioId("cond-123");
    expect(getActiveCondominioId()).toBe("cond-123");
  });

  test("clearActiveCondominioId remove o valor", () => {
    setActiveCondominioId("cond-abc");
    clearActiveCondominioId();
    expect(getActiveCondominioId()).toBeNull();
  });

  test("setActiveCondominioId sobrescreve valor anterior", () => {
    setActiveCondominioId("cond-1");
    setActiveCondominioId("cond-2");
    expect(getActiveCondominioId()).toBe("cond-2");
  });

  test("store.clear reseta estado entre testes", () => {
    setActiveCondominioId("cond-xyz");
    store.clear();
    expect(getActiveCondominioId()).toBeNull();
  });
});
