// PROVA DE REVERSIBILIDADE (Agenda, 006) — flag OFF = no-op total; on→off sem perda.

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

import { addAgendaEvent, updateAgendaEvent, deleteAgendaEvent, getAgendaEvents } from "@/lib/session-agenda";
import { mirrorUpsert, mirrorDelete, listRemoteAgenda } from "@/lib/tenant/agendaRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };
const base = { type: "outro" as const };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => {
  resetFlag("agenda_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Reversibilidade / Não-Exposição (Agenda) — flag OFF = no-op total", () => {
  test("add/update/delete com flag off NÃO tocam a rede", async () => {
    const e = addAgendaEvent({ ...base, title: "Local A", date: "2026-06-01" });
    updateAgendaEvent(e.id, { title: "Editado" });
    deleteAgendaEvent(e.id);
    await drain();

    expect(h.clientCalls.count).toBe(0);
    expect(h.rows.size).toBe(0);
  });

  test("chamadas diretas ao espelho com flag off são no-op", async () => {
    await mirrorUpsert({ id: "ev_x", title: "X", date: "2026-06-01", type: "outro", createdAt: "t" });
    await mirrorDelete("ev_x");
    expect(h.clientCalls.count).toBe(0);
    expect(await listRemoteAgenda()).toEqual([]);
  });

  test("store local com flag off é idêntico a um fluxo puramente local", async () => {
    addAgendaEvent({ ...base, title: "Assembleia", date: "2026-06-10" });
    addAgendaEvent({ ...base, title: "Vistoria", date: "2026-06-12" });
    await drain();
    const com = JSON.stringify(getAgendaEvents().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    localStorageMock.clear();
    addAgendaEvent({ ...base, title: "Assembleia", date: "2026-06-10" });
    addAgendaEvent({ ...base, title: "Vistoria", date: "2026-06-12" });
    await drain();
    const puro = JSON.stringify(getAgendaEvents().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    expect(com).toBe(puro);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    setFlag("agenda_remote_enabled", true);
    const e = addAgendaEvent({ ...base, title: "Com remoto", date: "2026-06-01" });
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;

    resetFlag("agenda_remote_enabled");
    updateAgendaEvent(e.id, { title: "editado offline" });
    addAgendaEvent({ ...base, title: "Pós-off", date: "2026-06-02" });
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn);
    expect(getAgendaEvents().find((x) => x.id === e.id)?.title).toBe("editado offline");
    expect(getAgendaEvents()).toHaveLength(2);
  });
});
