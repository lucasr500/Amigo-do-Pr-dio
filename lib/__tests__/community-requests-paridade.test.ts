// PROVA DE PARIDADE (010) — Canal de Solicitações relacional.
// Após add / update (status) / delete pela API de domínio, o remoto reflete o local nos
// campos de negócio. Mirrors SERIALIZADOS (seed com flag off + await mirror*) p/ evitar a
// corrida do mock de import concorrente (gotcha do molde). Fiação real provada via vi.waitFor.

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

import { addRequest, updateRequest, deleteRequest, getRequests } from "@/lib/community-requests";
import { mirrorUpsertRequest, mirrorDeleteRequest, listRemoteRequests } from "@/lib/tenant/communityRequestsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";
import type { ResidentRequest } from "@/lib/community-types";

function business(r: ResidentRequest) {
  const { createdAt: _c, updatedAt: _u, ...rest } = r;
  return rest;
}
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

async function assertParidade() {
  const local = getRequests().map(business).sort(byId);
  const remote = (await listRemoteRequests()).map(business).sort(byId);
  expect(remote).toEqual(local);
}
async function remoteCount() { return (await listRemoteRequests()).length; }

const base = { authorName: "Morador", type: "outro" as const, description: "d", priority: "normal" as const };

function seedAdd(data: Parameters<typeof addRequest>[0]): ResidentRequest {
  resetFlag("requests_remote_enabled");
  const r = addRequest(data);
  setFlag("requests_remote_enabled", true);
  return r;
}
function seedUpdate(id: string, patch: Partial<ResidentRequest>): ResidentRequest {
  resetFlag("requests_remote_enabled");
  updateRequest(id, patch);
  setFlag("requests_remote_enabled", true);
  return getRequests().find((x) => x.id === id)!;
}
function seedDelete(id: string): void {
  resetFlag("requests_remote_enabled");
  deleteRequest(id);
  setFlag("requests_remote_enabled", true);
}
async function mirrorAllLocal(): Promise<void> {
  for (const r of getRequests()) await mirrorUpsertRequest(r);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("requests_remote_enabled", true);
});
afterEach(() => {
  resetFlag("requests_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Paridade local↔remoto (010) — dual-write determinístico", () => {
  test("ADD: cada solicitação espelhada aparece idêntica no remoto", async () => {
    seedAdd({ ...base, title: "Barulho 22h", type: "barulho" });
    seedAdd({ ...base, title: "Lâmpada queimada", type: "manutencao" });
    await mirrorAllLocal();

    await assertParidade();
    expect(getRequests()).toHaveLength(2);
    expect(await remoteCount()).toBe(2);
  });

  test("UPDATE de status (resolver/responder) reflete no remoto", async () => {
    const r = seedAdd({ ...base, title: "Vazamento", type: "manutencao" });
    await mirrorAllLocal();
    await assertParidade();

    const u = seedUpdate(r.id, { status: "resolvido", resolutionNote: "consertado", closedAt: "2026-06-10T00:00:00.000Z" });
    await mirrorUpsertRequest(u);
    await assertParidade();
    expect(getRequests().find((x) => x.id === r.id)?.status).toBe("resolvido");
    expect((await listRemoteRequests()).find((x) => x.id === r.id)?.resolutionNote).toBe("consertado");
  });

  test("DELETE: remoção local some do remoto (sem órfão)", async () => {
    const a = seedAdd({ ...base, title: "A" });
    seedAdd({ ...base, title: "B" });
    await mirrorAllLocal();
    await assertParidade();
    expect(await remoteCount()).toBe(2);

    seedDelete(a.id);
    await mirrorDeleteRequest(a.id);
    await assertParidade();
    expect((await listRemoteRequests()).some((x) => x.id === a.id)).toBe(false);
    expect(await remoteCount()).toBe(1);
  });

  test("WIRING: addRequest (flag ON) dispara o push e chega ao remoto", async () => {
    const r = addRequest({ ...base, title: "Fiada" });
    await vi.waitFor(async () => {
      expect((await listRemoteRequests()).some((x) => x.id === r.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});
