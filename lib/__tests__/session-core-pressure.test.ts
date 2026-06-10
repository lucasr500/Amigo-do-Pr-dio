import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Testa o comportamento de safeWrite sob pressão de storage:
// — emissão do evento amigo:storage-pressure
// — payload correto: key, evicted, sizeKB
// — fluxo principal não lança exceção

// ─── Helpers de mock ─────────────────────────────────────────────────────────

type StoreMock = {
  data: Map<string, string>;
  failOnSet: boolean;
  failAfterEviction: boolean;
};

function makeStorage(opts: StoreMock) {
  return {
    getItem: (key: string) => opts.data.get(key) ?? null,
    setItem: (_key: string, _value: string) => {
      if (opts.failOnSet) {
        if (opts.failAfterEviction) {
          // continua falhando mesmo após eviction
          throw new DOMException("QuotaExceededError", "QuotaExceededError");
        }
        // falha apenas na primeira chamada; subsequentes passam
        opts.failOnSet = false;
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      }
      opts.data.set(_key, _value);
    },
    removeItem: (key: string) => { opts.data.delete(key); },
    clear: () => { opts.data.clear(); },
    get length() { return opts.data.size; },
    key: (index: number) => [...opts.data.keys()][index] ?? null,
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("safeWrite — storage-pressure event", () => {
  const dispatched: CustomEvent[] = [];

  beforeEach(() => {
    dispatched.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("emite amigo:storage-pressure quando quota é excedida sem eviction", async () => {
    const storeOpts: StoreMock = {
      data: new Map(),
      failOnSet: true,
      failAfterEviction: true,
    };
    const mockStorage = makeStorage(storeOpts);
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("window", {
      localStorage: mockStorage,
      dispatchEvent: (e: Event) => { dispatched.push(e as CustomEvent); return true; },
    });

    const { safeWrite } = await import("@/lib/session-core");
    expect(() => safeWrite("test-key", { data: "value" })).not.toThrow();

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toBe("amigo:storage-pressure");
    expect(dispatched[0].detail).toMatchObject({
      key: "test-key",
      evicted: false,
      sizeKB: expect.any(Number),
    });
  });

  test("emite amigo:storage-pressure com evicted=true quando eviction libera espaço", async () => {
    const storeOpts: StoreMock = {
      data: new Map([["amigo_queries", "[]"]]),
      failOnSet: true,
      failAfterEviction: false,
    };
    const mockStorage = makeStorage(storeOpts);
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("window", {
      localStorage: mockStorage,
      dispatchEvent: (e: Event) => { dispatched.push(e as CustomEvent); return true; },
    });

    const { safeWrite } = await import("@/lib/session-core");
    expect(() => safeWrite("test-key-2", { x: 1 })).not.toThrow();

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail).toMatchObject({
      key: "test-key-2",
      evicted: true,
    });
  });

  test("safeWrite não lança mesmo quando dispatchEvent falha", async () => {
    const storeOpts: StoreMock = {
      data: new Map(),
      failOnSet: true,
      failAfterEviction: true,
    };
    const mockStorage = makeStorage(storeOpts);
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("window", {
      localStorage: mockStorage,
      dispatchEvent: () => { throw new Error("DOM unavailable"); },
    });

    const { safeWrite } = await import("@/lib/session-core");
    expect(() => safeWrite("key-x", "value")).not.toThrow();
  });

  test("safeWrite normal (sem quota) não emite storage-pressure", async () => {
    const data = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
      clear: () => data.clear(),
      get length() { return data.size; },
      key: (i: number) => [...data.keys()][i] ?? null,
    };
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("window", {
      localStorage: mockStorage,
      dispatchEvent: (e: Event) => { dispatched.push(e as CustomEvent); return true; },
    });

    const { safeWrite } = await import("@/lib/session-core");
    safeWrite("normal-key", { ok: true });

    expect(dispatched).toHaveLength(0);
    expect(data.get("normal-key")).toBe('{"ok":true}');
  });
});
