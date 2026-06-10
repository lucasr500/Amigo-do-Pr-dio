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
  listUserCondominios,
  ensureDefaultCondominioForUser,
} from "@/lib/tenant/tenantClient";

describe("getActiveCondominioId / setActiveCondominioId / clearActiveCondominioId", () => {
  beforeEach(() => { store.clear(); });
  afterEach(() => { store.clear(); });

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

  test("setActiveCondominioId sobrescreve valor anterior (troca de condomínio)", () => {
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

describe("activeCondominioId — localStorage indisponível ou com erro", () => {
  test("getActiveCondominioId retorna null quando getItem lança erro", () => {
    const brokenStorage = {
      ...localStorageMock,
      getItem: () => { throw new Error("storage unavailable"); },
    };
    vi.stubGlobal("localStorage", brokenStorage);
    vi.stubGlobal("window", { localStorage: brokenStorage });

    expect(getActiveCondominioId()).toBeNull();

    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", { localStorage: localStorageMock });
  });

  test("setActiveCondominioId não lança quando setItem falha", () => {
    const brokenStorage = {
      ...localStorageMock,
      setItem: () => { throw new Error("quota exceeded"); },
    };
    vi.stubGlobal("localStorage", brokenStorage);
    vi.stubGlobal("window", { localStorage: brokenStorage });

    expect(() => setActiveCondominioId("cond-fail")).not.toThrow();

    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", { localStorage: localStorageMock });
  });

  test("clearActiveCondominioId não lança quando removeItem falha", () => {
    const brokenStorage = {
      ...localStorageMock,
      removeItem: () => { throw new Error("storage locked"); },
    };
    vi.stubGlobal("localStorage", brokenStorage);
    vi.stubGlobal("window", { localStorage: brokenStorage });

    expect(() => clearActiveCondominioId()).not.toThrow();

    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", { localStorage: localStorageMock });
  });
});

describe("listUserCondominios — guards sem Supabase", () => {
  test("retorna [] para userId 'guest'", async () => {
    const result = await listUserCondominios("guest");
    expect(result).toEqual([]);
  });

  test("retorna [] para userId vazio", async () => {
    const result = await listUserCondominios("");
    expect(result).toEqual([]);
  });
});

describe("ensureDefaultCondominioForUser — guards sem Supabase", () => {
  test("retorna erro para userId 'guest'", async () => {
    const result = await ensureDefaultCondominioForUser({ userId: "guest" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("autenticado");
    }
  });

  test("retorna erro para userId vazio", async () => {
    const result = await ensureDefaultCondominioForUser({ userId: "" });
    expect(result.ok).toBe(false);
  });
});
