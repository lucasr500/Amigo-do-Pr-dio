// PROVA DE REVERSIBILIDADE (012) — Documentos. Flag OFF = no-op total; on→off sem perda.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  rows: new Map<string, Record<string, unknown>>(),
  clientCalls: { count: 0 },
}));

vi.mock("@/lib/tenant/tenantClient", () => ({ getActiveCondominioId: () => h.condId.value }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => {
    h.clientCalls.count++;
    return {
      from: (_t: string) => ({
        upsert: async (row: Record<string, unknown>) => { h.rows.set(row.id as string, { ...row }); return { error: null }; },
        delete: () => ({ eq: (_c: string, _v: string) => ({ eq: async (_c2: string, id: string) => { h.rows.delete(id); return { error: null }; } }) }),
        select: (_cols: string) => ({ eq: async (_c: string, cond: string) => ({ data: Array.from(h.rows.values()).filter((r) => r.condominio_id === cond), error: null }) }),
      }),
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

import { addPublicDocument, updatePublicDocument, removePublicDocument, getPublicDocuments } from "@/lib/community-documents";
import { mirrorUpsertDocument, mirrorDeleteDocument, listRemoteDocuments } from "@/lib/tenant/communityDocumentsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };
const base = { category: "ata" as const, visibility: "moradores" as const, publishedAt: "2026-06-01T00:00:00.000Z" };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => {
  resetFlag("documents_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Reversibilidade / Não-Exposição (012) — flag OFF = no-op total", () => {
  test("add/update/remove com flag off NÃO tocam a rede", async () => {
    const d = addPublicDocument({ ...base, title: "Local A" });
    updatePublicDocument(d.id, { title: "Editado" });
    removePublicDocument(d.id);
    await drain();

    expect(h.clientCalls.count).toBe(0);
    expect(h.rows.size).toBe(0);
  });

  test("chamadas diretas ao espelho com flag off são no-op", async () => {
    await mirrorUpsertDocument({ id: "doc_x", title: "X", category: "outro", visibility: "moradores", publishedAt: "t", createdAt: "t", updatedAt: "t" });
    await mirrorDeleteDocument("doc_x");
    expect(h.clientCalls.count).toBe(0);
    expect(await listRemoteDocuments()).toEqual([]);
  });

  test("store local com flag off é idêntico a um fluxo puramente local", async () => {
    addPublicDocument({ ...base, title: "Convenção", category: "convencao" });
    addPublicDocument({ ...base, title: "Balancete", category: "prestacao_de_contas" });
    await drain();
    const com = JSON.stringify(getPublicDocuments().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    localStorageMock.clear();
    addPublicDocument({ ...base, title: "Convenção", category: "convencao" });
    addPublicDocument({ ...base, title: "Balancete", category: "prestacao_de_contas" });
    await drain();
    const puro = JSON.stringify(getPublicDocuments().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    expect(com).toBe(puro);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    setFlag("documents_remote_enabled", true);
    const d = addPublicDocument({ ...base, title: "Com remoto" });
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;

    resetFlag("documents_remote_enabled");
    updatePublicDocument(d.id, { title: "editado offline" });
    addPublicDocument({ ...base, title: "Pós-off" });
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn);
    expect(getPublicDocuments().find((x) => x.id === d.id)?.title).toBe("editado offline");
    expect(getPublicDocuments()).toHaveLength(2);
  });
});
