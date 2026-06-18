// PROVAS do helper de Storage (013) — caminho canônico + reversibilidade (flag off = no-op).
// O isolamento/visibilidade do OBJETO é provado no gate de CI (storage.objects RLS contra
// Postgres real); aqui provamos o caminho e que com a flag off nada toca a rede.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({ condId: { value: "cond-A" as string | null }, clientCalls: { count: 0 } }));

vi.mock("@/lib/tenant/tenantClient", () => ({ getActiveCondominioId: () => h.condId.value }));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => {
    h.clientCalls.count++;
    return {
      storage: { from: () => ({
        upload: async () => ({ error: null }),
        createSignedUrl: async (p: string) => ({ data: { signedUrl: `https://signed/${p}` }, error: null }),
      }) },
      from: () => ({ update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
    };
  },
}));

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

import { buildDocumentStoragePath, uploadDocumentFile, getDocumentSignedUrl } from "@/lib/tenant/documentStorage";
import { setFlag, resetFlag } from "@/lib/feature-flags";

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => { resetFlag("documents_remote_enabled"); localStorageMock.clear(); });

describe("documentStorage — caminho canônico", () => {
  test("escopo por condomínio no 1º segmento; sanitiza o nome", () => {
    expect(buildDocumentStoragePath("cond-A", "doc-1", "Balancete 1º Tri.pdf"))
      .toBe("cond-A/documents/doc-1/Balancete_1_Tri.pdf");
  });
});

describe("documentStorage — reversibilidade (flag OFF = no-op total)", () => {
  test("upload com flag off → null e zero rede", async () => {
    const r = await uploadDocumentFile("doc-1", "a.txt", "x");
    expect(r).toBeNull();
    expect(h.clientCalls.count).toBe(0);
  });

  test("signed URL com flag off → null e zero rede", async () => {
    const r = await getDocumentSignedUrl("cond-A/documents/doc-1/a.txt");
    expect(r).toBeNull();
    expect(h.clientCalls.count).toBe(0);
  });

  test("com flag ON o helper opera (upload retorna o caminho; signed URL retorna link)", async () => {
    setFlag("documents_remote_enabled", true);
    const path = await uploadDocumentFile("doc-1", "a.txt", "x", "text/plain");
    expect(path).toBe("cond-A/documents/doc-1/a.txt");
    const url = await getDocumentSignedUrl(path!);
    expect(url).toBe("https://signed/cond-A/documents/doc-1/a.txt");
    expect(h.clientCalls.count).toBeGreaterThan(0);
  });

  test("sem condomínio ativo → no-op mesmo com flag ON", async () => {
    setFlag("documents_remote_enabled", true);
    h.condId.value = null;
    expect(await uploadDocumentFile("doc-1", "a.txt", "x")).toBeNull();
    expect(h.clientCalls.count).toBe(0);
  });
});
