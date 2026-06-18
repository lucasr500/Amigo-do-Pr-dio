// PROVA DE PARIDADE (009) — Mural/Comunicados relacional.
// Prova que o dual-write mantém o remoto idêntico ao local nos CAMPOS DE NEGÓCIO,
// após add / update / archive / delete — e que NATUREZA (derivada de origin) e
// VISIBILIDADE são preservadas no round-trip (a separação de natureza vira fato de banco).
//
// Determinismo: o push de domínio é fire-and-forget (`void mirror...`). Disparar dois
// concorrentes faz dois `await import("@/lib/supabase/client")` correrem juntos; sob o
// mock do Vitest a corrida pode devolver o módulo pela metade e o catch best-effort engole
// o erro (gotcha documentado no molde). Aqui o lado REMOTO é dirigido por mirror* com AWAIT
// explícito; o seed local roda com a flag OFF para não disparar push paralelo. A fiação real
// (addPost dispara o push) é provada à parte num teste tolerante (WIRING).
//
// Lane: arquivo de teste NOVO. Supabase e tenantClient mockados em memória — zero rede.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  rows: new Map<string, Record<string, unknown>>(),
}));

vi.mock("@/lib/tenant/tenantClient", () => ({
  getActiveCondominioId: () => h.condId.value,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => ({
    from: (_t: string) => ({
      upsert: async (row: Record<string, unknown>) => { h.rows.set(row.id as string, { ...row }); return { error: null }; },
      delete: () => ({
        eq: (_c: string, _v: string) => ({
          eq: async (_c2: string, id: string) => { h.rows.delete(id); return { error: null }; },
        }),
      }),
      select: (_cols: string) => ({
        eq: async (_c: string, cond: string) => ({
          data: Array.from(h.rows.values()).filter((r) => r.condominio_id === cond),
          error: null,
        }),
      }),
    }),
  }),
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
import type { InstitutionalPost } from "@/lib/community-types";

function business(p: InstitutionalPost) {
  const { createdAt: _c, updatedAt: _u, ...rest } = p;
  return rest;
}
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

async function assertParidade() {
  const local = getPosts().map(business).sort(byId);
  const remote = (await listRemotePosts()).map(business).sort(byId);
  expect(remote).toEqual(local);
}
async function remoteCount() { return (await listRemotePosts()).length; }

const base = { body: "b", category: "aviso" as const, visibility: "moradores" as const, allowComments: false, pinned: false, archived: false };

// Seeds de DOMÍNIO com push automático DESLIGADO (determinístico).
function seedAdd(data: Parameters<typeof addPost>[0]): InstitutionalPost {
  resetFlag("mural_remote_enabled");
  const p = addPost(data);
  setFlag("mural_remote_enabled", true);
  return p;
}
function seedUpdate(id: string, patch: Partial<InstitutionalPost>): InstitutionalPost {
  resetFlag("mural_remote_enabled");
  updatePost(id, patch);
  setFlag("mural_remote_enabled", true);
  return getPosts().find((x) => x.id === id)!;
}
function seedArchive(id: string): void {
  resetFlag("mural_remote_enabled");
  archivePost(id);
  setFlag("mural_remote_enabled", true);
}
function seedDelete(id: string): void {
  resetFlag("mural_remote_enabled");
  deletePost(id);
  setFlag("mural_remote_enabled", true);
}
async function mirrorAllLocal(): Promise<void> {
  for (const p of getPosts()) await mirrorUpsertPost(p);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("mural_remote_enabled", true);
});
afterEach(() => {
  resetFlag("mural_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Paridade local↔remoto (009) — dual-write determinístico", () => {
  test("ADD: cada post espelhado aparece idêntico no remoto", async () => {
    seedAdd({ ...base, title: "Bomba d'água", origin: "oficial" });
    seedAdd({ ...base, title: "Regras garagem", visibility: "publico", origin: "oficial" });
    await mirrorAllLocal();

    await assertParidade();
    expect(getPosts()).toHaveLength(2);
    expect(await remoteCount()).toBe(2);
  });

  test("UPDATE + ARCHIVE refletem no remoto", async () => {
    const p = seedAdd({ ...base, title: "Aviso", origin: "oficial" });
    await mirrorAllLocal();
    await assertParidade();

    const u = seedUpdate(p.id, { title: "Aviso atualizado", pinned: true });
    await mirrorUpsertPost(u);
    await assertParidade();
    expect(getPosts().find((x) => x.id === p.id)?.pinned).toBe(true);

    seedArchive(p.id);
    const arch = getPosts().find((x) => x.id === p.id)!;
    await mirrorUpsertPost(arch);
    await assertParidade();
    expect((await listRemotePosts()).find((x) => x.id === p.id)?.archived).toBe(true);
  });

  test("DELETE: remoção local some do remoto (sem órfão)", async () => {
    const a = seedAdd({ ...base, title: "A", origin: "oficial" });
    seedAdd({ ...base, title: "B", origin: "oficial" });
    await mirrorAllLocal();
    await assertParidade();
    expect(await remoteCount()).toBe(2);

    seedDelete(a.id);
    await mirrorDeletePost(a.id);
    await assertParidade();
    expect((await listRemotePosts()).some((x) => x.id === a.id)).toBe(false);
    expect(await remoteCount()).toBe(1);
  });

  test("NATUREZA derivada e VISIBILIDADE preservadas no round-trip", async () => {
    const oficial = seedAdd({ ...base, title: "Comunicado oficial", visibility: "gestao", origin: "oficial" });
    const morador = seedAdd({ ...base, title: "Participação de morador", visibility: "moradores", origin: "morador" });
    await mirrorAllLocal();

    // nature é DERIVADA (write-only no espelho): inspeciona a linha remota.
    expect(h.rows.get(oficial.id)?.nature).toBe("comunicado"); // origin oficial → comunicado
    expect(h.rows.get(morador.id)?.nature).toBe("opiniao");    // origin morador → opinião
    // visibilidade preservada nos campos de negócio.
    expect(h.rows.get(oficial.id)?.visibility).toBe("gestao");
    expect(h.rows.get(morador.id)?.visibility).toBe("moradores");
    await assertParidade();
  });

  // Prova de FIAÇÃO: addPost com a flag ON dispara o push best-effort que chega ao remoto.
  test("WIRING: addPost (flag ON) dispara o push e chega ao remoto", async () => {
    const p = addPost({ ...base, title: "Fiado", origin: "oficial" });
    await vi.waitFor(async () => {
      expect((await listRemotePosts()).some((x) => x.id === p.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});
