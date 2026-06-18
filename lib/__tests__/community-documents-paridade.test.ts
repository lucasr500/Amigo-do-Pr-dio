// PROVA DE PARIDADE (012) — Documentos relacional.
// Após add/update/remove pela API de domínio, o remoto reflete o local nos campos de
// negócio (incl. category 'prestacao_de_contas' e visibility). Mirrors SERIALIZADOS.

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
      delete: () => ({ eq: (_c: string, _v: string) => ({ eq: async (_c2: string, id: string) => { h.rows.delete(id); return { error: null }; } }) }),
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

import { addPublicDocument, updatePublicDocument, removePublicDocument, getPublicDocuments } from "@/lib/community-documents";
import { mirrorUpsertDocument, mirrorDeleteDocument, listRemoteDocuments } from "@/lib/tenant/communityDocumentsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";
import type { PublicDocument } from "@/lib/community-types";

function business(d: PublicDocument) { const { createdAt: _c, updatedAt: _u, ...rest } = d; return rest; }
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

async function assertParidade() {
  expect((await listRemoteDocuments()).map(business).sort(byId)).toEqual(getPublicDocuments().map(business).sort(byId));
}
async function remoteCount() { return (await listRemoteDocuments()).length; }

const base = { publishedAt: "2026-06-01T00:00:00.000Z" };

function seedAdd(data: Parameters<typeof addPublicDocument>[0]): PublicDocument {
  resetFlag("documents_remote_enabled");
  const d = addPublicDocument(data);
  setFlag("documents_remote_enabled", true);
  return d;
}
function seedUpdate(id: string, patch: Partial<PublicDocument>): PublicDocument {
  resetFlag("documents_remote_enabled");
  updatePublicDocument(id, patch);
  setFlag("documents_remote_enabled", true);
  return getPublicDocuments().find((x) => x.id === id)!;
}
function seedRemove(id: string): void {
  resetFlag("documents_remote_enabled");
  removePublicDocument(id);
  setFlag("documents_remote_enabled", true);
}
async function mirrorAllLocal(): Promise<void> {
  for (const d of getPublicDocuments()) await mirrorUpsertDocument(d);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("documents_remote_enabled", true);
});
afterEach(() => {
  resetFlag("documents_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Paridade local↔remoto (012) — dual-write determinístico", () => {
  test("ADD: documentos (incl. prestação de contas) idênticos no remoto", async () => {
    seedAdd({ ...base, title: "Convenção", category: "convencao", visibility: "moradores" });
    seedAdd({ ...base, title: "Prestação de Contas 1T", category: "prestacao_de_contas", visibility: "moradores" });
    await mirrorAllLocal();

    await assertParidade();
    expect(getPublicDocuments()).toHaveLength(2);
    expect(await remoteCount()).toBe(2);
    // transparência: a categoria e a visibilidade são preservadas no espelho.
    const transp = (await listRemoteDocuments()).find((d) => d.category === "prestacao_de_contas")!;
    expect(transp.visibility).toBe("moradores");
  });

  test("UPDATE (revisão de visibilidade) reflete no remoto", async () => {
    const d = seedAdd({ ...base, title: "Ata", category: "ata", visibility: "conselho" });
    await mirrorAllLocal();
    await assertParidade();

    const u = seedUpdate(d.id, { visibility: "moradores", version: "v2" });
    await mirrorUpsertDocument(u);
    await assertParidade();
    expect((await listRemoteDocuments()).find((x) => x.id === d.id)?.visibility).toBe("moradores");
  });

  test("REMOVE: exclusão local some do remoto", async () => {
    const a = seedAdd({ ...base, title: "A", category: "outro", visibility: "moradores" });
    seedAdd({ ...base, title: "B", category: "outro", visibility: "moradores" });
    await mirrorAllLocal();
    await assertParidade();
    expect(await remoteCount()).toBe(2);

    seedRemove(a.id);
    await mirrorDeleteDocument(a.id);
    await assertParidade();
    expect((await listRemoteDocuments()).some((x) => x.id === a.id)).toBe(false);
    expect(await remoteCount()).toBe(1);
  });

  test("WIRING: addPublicDocument (flag ON) dispara o push e chega ao remoto", async () => {
    const d = addPublicDocument({ ...base, title: "Fiado", category: "outro", visibility: "moradores" });
    await vi.waitFor(async () => {
      expect((await listRemoteDocuments()).some((x) => x.id === d.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});
