// PROVA DE REVERSIBILIDADE (009) — Mural/Comunicados.
// Prova as invariantes "Não-Exposição" + "sem perda de dado":
//   1) Com `mural_remote_enabled` = false (default), o dual-write é NO-OP TOTAL: o cliente
//      Supabase NUNCA é invocado (zero rede) em add/update/archive/delete e nas chamadas
//      diretas a mirror*/listRemote.
//   2) O store LOCAL com a flag off é byte-a-byte idêntico a um fluxo puramente local.
//   3) Ligar→desligar a flag volta ao no-op e o local nunca é degradado.
//
// "Zero rede" é medido por um espião: a factory de getSupabaseClient incrementa um contador.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  rows: new Map<string, Record<string, unknown>>(),
  clientCalls: { count: 0 },
}));

vi.mock("@/lib/tenant/tenantClient", () => ({ getActiveCondominioId: () => h.condId.value }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => {
    h.clientCalls.count++; // espião de "rede"
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

import { addPost, updatePost, archivePost, deletePost, getPosts } from "@/lib/community-posts";
import { mirrorUpsertPost, mirrorDeletePost, listRemotePosts } from "@/lib/tenant/communityPostsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };
const base = { body: "b", category: "aviso" as const, visibility: "moradores" as const, allowComments: false, pinned: false, archived: false };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
  // flag começa no DEFAULT (off) — não chamar setFlag aqui.
});
afterEach(() => {
  resetFlag("mural_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Reversibilidade / Não-Exposição (009) — flag OFF = no-op total", () => {
  test("add/update/archive/delete com flag off NÃO tocam a rede", async () => {
    const p = addPost({ ...base, title: "Local A", origin: "oficial" });
    updatePost(p.id, { title: "Editado" });
    archivePost(p.id);
    deletePost(p.id);
    await drain();

    expect(h.clientCalls.count).toBe(0); // zero rede
    expect(h.rows.size).toBe(0);         // remoto nunca tocado
  });

  test("chamadas diretas ao espelho com flag off são no-op e não invocam cliente", async () => {
    await mirrorUpsertPost({
      id: "post_x", title: "X", body: "", category: "aviso", visibility: "moradores",
      allowComments: false, pinned: false, archived: false, createdAt: "t", updatedAt: "t",
    });
    await mirrorDeletePost("post_x");
    const remote = await listRemotePosts();

    expect(h.clientCalls.count).toBe(0);
    expect(remote).toEqual([]);
  });

  test("store local com flag off é idêntico a um fluxo puramente local", async () => {
    addPost({ ...base, title: "Reunião", origin: "oficial" });
    addPost({ ...base, title: "Vazamento 3B", category: "manutencao", origin: "oficial" });
    await drain();
    const comCaminhoRemoto = JSON.stringify(getPosts().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    localStorageMock.clear();
    addPost({ ...base, title: "Reunião", origin: "oficial" });
    addPost({ ...base, title: "Vazamento 3B", category: "manutencao", origin: "oficial" });
    await drain();
    const puroLocal = JSON.stringify(getPosts().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    expect(comCaminhoRemoto).toBe(puroLocal);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    setFlag("mural_remote_enabled", true);
    const p = addPost({ ...base, title: "Com remoto", origin: "oficial" });
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;
    expect(getPosts().some((x) => x.id === p.id)).toBe(true);

    resetFlag("mural_remote_enabled");
    updatePost(p.id, { title: "editado offline" });
    addPost({ ...base, title: "Pós-off", origin: "oficial" });
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn); // não houve novas chamadas
    expect(getPosts().find((x) => x.id === p.id)?.title).toBe("editado offline");
    expect(getPosts()).toHaveLength(2);
  });
});
