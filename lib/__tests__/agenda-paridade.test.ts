// PROVA DE PARIDADE (Agenda, 006) — read-cutover relacional.
// Após add/update/delete pela API de domínio, o remoto reflete o local nos campos de
// negócio. Mirrors SERIALIZADOS (seed com flag off + await mirror*) p/ evitar a corrida
// do mock de import concorrente. Fiação real provada via vi.waitFor.

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

import { addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, getAgendaEvents } from "@/lib/session-agenda";
import { mirrorUpsert, mirrorDelete, listRemoteAgenda } from "@/lib/tenant/agendaRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";
import type { AgendaEvent } from "@/lib/session-agenda";

function business(e: AgendaEvent) { const { createdAt: _c, updatedAt: _u, ...rest } = e; return rest; }
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

async function assertParidade() {
  const local = getAgendaEvents().map(business).sort(byId);
  const remote = (await listRemoteAgenda()).map(business).sort(byId);
  expect(remote).toEqual(local);
}
async function remoteCount() { return (await listRemoteAgenda()).length; }

const base = { type: "outro" as const };

function seedAdd(title: string, date: string): AgendaEvent {
  resetFlag("agenda_remote_enabled");
  const e = addAgendaEvent({ ...base, title, date });
  setFlag("agenda_remote_enabled", true);
  return e;
}
function seedUpdate(id: string, patch: Partial<AgendaEvent>): AgendaEvent {
  resetFlag("agenda_remote_enabled");
  updateAgendaEvent(id, patch);
  setFlag("agenda_remote_enabled", true);
  return getAgendaEvents().find((x) => x.id === id)!;
}
function seedDelete(id: string): void {
  resetFlag("agenda_remote_enabled");
  deleteAgendaEvent(id);
  setFlag("agenda_remote_enabled", true);
}
async function mirrorAllLocal(): Promise<void> {
  for (const e of getAgendaEvents()) await mirrorUpsert(e);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("agenda_remote_enabled", true);
});
afterEach(() => {
  resetFlag("agenda_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Paridade local↔remoto (Agenda) — dual-write determinístico", () => {
  test("ADD: cada evento espelhado aparece idêntico no remoto", async () => {
    seedAdd("Assembleia", "2026-06-10");
    seedAdd("Dedetização", "2026-06-15");
    await mirrorAllLocal();

    await assertParidade();
    expect(getAgendaEvents()).toHaveLength(2);
    expect(await remoteCount()).toBe(2);
  });

  test("UPDATE reflete no remoto", async () => {
    const e = seedAdd("Vistoria", "2026-06-20");
    await mirrorAllLocal();
    await assertParidade();

    const u = seedUpdate(e.id, { title: "Vistoria adiada", responsavel: "Síndico" });
    await mirrorUpsert(u);
    await assertParidade();
    expect((await listRemoteAgenda()).find((x) => x.id === e.id)?.title).toBe("Vistoria adiada");
  });

  test("DELETE: remoção local some do remoto (sem órfão)", async () => {
    const a = seedAdd("A", "2026-06-01");
    seedAdd("B", "2026-06-02");
    await mirrorAllLocal();
    await assertParidade();
    expect(await remoteCount()).toBe(2);

    seedDelete(a.id);
    await mirrorDelete(a.id);
    await assertParidade();
    expect((await listRemoteAgenda()).some((x) => x.id === a.id)).toBe(false);
    expect(await remoteCount()).toBe(1);
  });

  test("WIRING: addAgendaEvent (flag ON) dispara o push e chega ao remoto", async () => {
    const e = addAgendaEvent({ ...base, title: "Fiado", date: "2026-06-30" });
    await vi.waitFor(async () => {
      expect((await listRemoteAgenda()).some((x) => x.id === e.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});
