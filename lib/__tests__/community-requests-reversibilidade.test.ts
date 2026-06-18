// PROVA DE REVERSIBILIDADE (010) — Canal de Solicitações.
//   1) Flag off (default) = NO-OP TOTAL: cliente Supabase nunca invocado (zero rede).
//   2) Store local com flag off byte-a-byte idêntico ao puramente local.
//   3) Ligar→desligar volta ao no-op; local nunca regride.

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

import { addRequest, updateRequest, deleteRequest, getRequests } from "@/lib/community-requests";
import { mirrorUpsertRequest, mirrorDeleteRequest, listRemoteRequests } from "@/lib/tenant/communityRequestsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };
const base = { authorName: "Morador", type: "outro" as const, description: "d", priority: "normal" as const };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => {
  resetFlag("requests_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Reversibilidade / Não-Exposição (010) — flag OFF = no-op total", () => {
  test("add/update/delete com flag off NÃO tocam a rede", async () => {
    const r = addRequest({ ...base, title: "Local A" });
    updateRequest(r.id, { status: "em_analise" });
    deleteRequest(r.id);
    await drain();

    expect(h.clientCalls.count).toBe(0);
    expect(h.rows.size).toBe(0);
  });

  test("chamadas diretas ao espelho com flag off são no-op e não invocam cliente", async () => {
    await mirrorUpsertRequest({
      id: "req_x", authorName: "X", type: "outro", title: "X", description: "",
      status: "recebido", priority: "normal", createdAt: "t", updatedAt: "t",
    });
    await mirrorDeleteRequest("req_x");
    const remote = await listRemoteRequests();

    expect(h.clientCalls.count).toBe(0);
    expect(remote).toEqual([]);
  });

  test("store local com flag off é idêntico a um fluxo puramente local", async () => {
    addRequest({ ...base, title: "Barulho", type: "barulho" });
    addRequest({ ...base, title: "Lâmpada", type: "manutencao" });
    await drain();
    const comCaminhoRemoto = JSON.stringify(getRequests().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    localStorageMock.clear();
    addRequest({ ...base, title: "Barulho", type: "barulho" });
    addRequest({ ...base, title: "Lâmpada", type: "manutencao" });
    await drain();
    const puroLocal = JSON.stringify(getRequests().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    expect(comCaminhoRemoto).toBe(puroLocal);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    setFlag("requests_remote_enabled", true);
    const r = addRequest({ ...base, title: "Com remoto" });
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;
    expect(getRequests().some((x) => x.id === r.id)).toBe(true);

    resetFlag("requests_remote_enabled");
    updateRequest(r.id, { status: "respondida" });
    addRequest({ ...base, title: "Pós-off" });
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn);
    expect(getRequests().find((x) => x.id === r.id)?.status).toBe("respondida");
    expect(getRequests()).toHaveLength(2);
  });
});
