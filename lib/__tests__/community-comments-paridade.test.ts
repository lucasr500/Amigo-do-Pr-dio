// PROVA DE PARIDADE (014) — Comentários relacional.
// Após addComment + moderateComment (mudança de status) pela API de domínio, o remoto reflete
// o local nos campos de negócio. NÃO há delete (remoção é status 'removido' — soft). Mirrors
// SERIALIZADOS p/ evitar a corrida do mock de import concorrente.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  rows: new Map<string, Record<string, unknown>>(),
}));

vi.mock("@/lib/tenant/tenantClient", () => ({ getActiveCondominioId: () => h.condId.value }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => ({
    from: (_t: string) => ({
      upsert: async (row: Record<string, unknown>) => { h.rows.set(row.id as string, { ...row }); return { error: null }; },
      select: (_cols: string) => ({ eq: async (_c: string, cond: string) => ({ data: Array.from(h.rows.values()).filter((r) => r.condominio_id === cond), error: null }) }),
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

import { addComment, moderateComment, getComments } from "@/lib/community-posts";
import { mirrorUpsertComment, listRemoteComments } from "@/lib/tenant/communityCommentsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";
import type { Comment, CommentStatus } from "@/lib/community-types";

function business(c: Comment) { const { createdAt: _c, updatedAt: _u, ...rest } = c; return rest; }
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

async function assertParidade() {
  expect((await listRemoteComments()).map(business).sort(byId)).toEqual(getComments().map(business).sort(byId));
}

function seedAdd(postId: string, body: string, autoApprove = false): Comment {
  resetFlag("comments_remote_enabled");
  const c = addComment(postId, "Morador", body, autoApprove);
  setFlag("comments_remote_enabled", true);
  return c;
}
function seedModerate(id: string, status: CommentStatus): void {
  resetFlag("comments_remote_enabled");
  moderateComment(id, status);
  setFlag("comments_remote_enabled", true);
}
async function mirrorAllLocal(): Promise<void> {
  for (const c of getComments()) await mirrorUpsertComment(c);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("comments_remote_enabled", true);
});
afterEach(() => {
  resetFlag("comments_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Paridade local↔remoto (014) — dual-write determinístico", () => {
  test("ADD: comentários espelhados aparecem idênticos no remoto", async () => {
    seedAdd("post-1", "primeiro", true);   // publicado
    seedAdd("post-1", "segundo");           // pendente
    await mirrorAllLocal();

    await assertParidade();
    expect(getComments()).toHaveLength(2);
    expect((await listRemoteComments()).length).toBe(2);
  });

  test("MODERAÇÃO (aprovar/ocultar/remover) reflete no remoto; remoção é status, não delete", async () => {
    const c = seedAdd("post-1", "a moderar"); // pendente
    await mirrorAllLocal();
    await assertParidade();

    seedModerate(c.id, "publicado");
    await mirrorUpsertComment(getComments().find((x) => x.id === c.id)!);
    await assertParidade();
    expect((await listRemoteComments()).find((x) => x.id === c.id)?.status).toBe("publicado");

    seedModerate(c.id, "removido");
    await mirrorUpsertComment(getComments().find((x) => x.id === c.id)!);
    await assertParidade();
    // removido continua presente no remoto (preservado para auditoria) — soft, nunca hard-delete.
    expect((await listRemoteComments()).find((x) => x.id === c.id)?.status).toBe("removido");
    expect((await listRemoteComments()).length).toBe(1);
  });

  test("WIRING: addComment (flag ON) dispara o push e chega ao remoto", async () => {
    const c = addComment("post-1", "Morador", "fiado", true);
    await vi.waitFor(async () => {
      expect((await listRemoteComments()).some((x) => x.id === c.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});
