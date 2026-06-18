// PROVA DE REVERSIBILIDADE (014) — Comentários. Flag OFF = no-op total; on→off sem perda.

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

import { addComment, moderateComment, getComments } from "@/lib/community-posts";
import { mirrorUpsertComment, listRemoteComments } from "@/lib/tenant/communityCommentsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => {
  resetFlag("comments_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Reversibilidade / Não-Exposição (014) — flag OFF = no-op total", () => {
  test("addComment/moderateComment com flag off NÃO tocam a rede", async () => {
    const c = addComment("post-1", "Morador", "x");
    moderateComment(c.id, "oculto");
    await drain();
    expect(h.clientCalls.count).toBe(0);
    expect(h.rows.size).toBe(0);
  });

  test("chamada direta ao espelho com flag off é no-op", async () => {
    await mirrorUpsertComment({ id: "cmt_x", postId: "p1", authorName: "X", authorRole: "resident", body: "x", status: "pendente", createdAt: "t" });
    expect(h.clientCalls.count).toBe(0);
    expect(await listRemoteComments()).toEqual([]);
  });

  test("store local com flag off é idêntico a um fluxo puramente local", async () => {
    addComment("post-1", "Morador", "um", true);
    addComment("post-1", "Vizinho", "dois");
    await drain();
    const com = JSON.stringify(getComments().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    localStorageMock.clear();
    addComment("post-1", "Morador", "um", true);
    addComment("post-1", "Vizinho", "dois");
    await drain();
    const puro = JSON.stringify(getComments().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    expect(com).toBe(puro);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    setFlag("comments_remote_enabled", true);
    const c = addComment("post-1", "Morador", "com remoto", true);
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;

    resetFlag("comments_remote_enabled");
    moderateComment(c.id, "removido");
    addComment("post-1", "Vizinho", "pos-off");
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn);
    expect(getComments().find((x) => x.id === c.id)?.status).toBe("removido");
    expect(getComments()).toHaveLength(2);
  });
});
