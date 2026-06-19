// PROVAS de Ordem de Serviço (017) — paridade, reversibilidade, e o LOOP (solicitação →
// ordem → execução comprovada → linha do tempo). A RLS staff×papel é provada no gate de CI.

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
        select: (_c: string) => ({ eq: async (_col: string, cond: string) => ({ data: Array.from(h.rows.values()).filter((r) => r.condominio_id === cond), error: null }) }),
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

import {
  addServiceOrder, updateServiceOrder, completeServiceOrder, createServiceOrderFromRequest,
  getServiceOrders, getServiceOrdersForAssignee, type ServiceOrder,
} from "@/lib/service-orders";
import { mirrorUpsertServiceOrder, listRemoteServiceOrders } from "@/lib/tenant/serviceOrdersRemote";
import { getTimeline } from "@/lib/community-timeline";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };
function business(o: ServiceOrder) { const { createdAt: _c, updatedAt: _u, ...rest } = o; return rest; }
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = `cond-${++condSeq}`;
});
afterEach(() => { resetFlag("service_orders_remote_enabled"); localStorageMock.clear(); h.rows.clear(); });

describe("Ordem de Serviço — loop operacional (local-first)", () => {
  test("createServiceOrderFromRequest fecha o loop de entrada (origin solicitacao + vínculo)", () => {
    const os = createServiceOrderFromRequest({ id: "req-1", title: "Lâmpada queimada", description: "corredor 1º" }, "manutencao");
    expect(os.origin).toBe("solicitacao");
    expect(os.linkedRequestId).toBe("req-1");
    expect(os.status).toBe("aberta");
  });

  test("completeServiceOrder comprova + gera registro na linha do tempo", () => {
    const os = addServiceOrder({ title: "Trocar lâmpada", category: "manutencao", assigneeMembershipId: "mem-staff" });
    completeServiceOrder(os.id, { kind: "nota", text: "trocada às 14h", createdAt: "2026-06-19" });

    const done = getServiceOrders().find((o) => o.id === os.id)!;
    expect(done.status).toBe("concluida");
    expect(done.evidence).toHaveLength(1);
    const ev = getTimeline().find((e) => e.sourceId === os.id);
    expect(ev?.type).toBe("manutencao_realizada");
    expect(getServiceOrdersForAssignee("mem-staff").map((o) => o.id)).toContain(os.id);
  });
});

describe("Ordem de Serviço — paridade (flag ON, mirrors serializados)", () => {
  beforeEach(() => setFlag("service_orders_remote_enabled", true));

  test("add/update espelhados refletem no remoto (campos de negócio)", async () => {
    // seed com flag off p/ evitar corrida de mirror concorrente; espelha sequencial.
    resetFlag("service_orders_remote_enabled");
    const a = addServiceOrder({ title: "A", category: "obra" });
    const b = addServiceOrder({ title: "B", category: "limpeza" });
    setFlag("service_orders_remote_enabled", true);
    for (const o of getServiceOrders()) await mirrorUpsertServiceOrder(o);

    const remote = (await listRemoteServiceOrders()).map(business).sort(byId);
    expect(remote).toEqual(getServiceOrders().map(business).sort(byId));
    expect(remote).toHaveLength(2);

    resetFlag("service_orders_remote_enabled");
    updateServiceOrder(a.id, { status: "em_andamento" });
    setFlag("service_orders_remote_enabled", true);
    await mirrorUpsertServiceOrder(getServiceOrders().find((o) => o.id === a.id)!);
    expect((await listRemoteServiceOrders()).find((o) => o.id === a.id)?.status).toBe("em_andamento");
    expect(b.id).toBeTruthy();
  });

  test("WIRING: addServiceOrder (flag ON) dispara o push e chega ao remoto", async () => {
    const o = addServiceOrder({ title: "Fiado", category: "outro" });
    await vi.waitFor(async () => {
      expect((await listRemoteServiceOrders()).some((x) => x.id === o.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});

describe("Ordem de Serviço — reversibilidade (flag OFF = no-op total)", () => {
  test("add/update/complete com flag off NÃO tocam a rede", async () => {
    const o = addServiceOrder({ title: "Local", category: "manutencao" });
    updateServiceOrder(o.id, { priority: "alta" });
    completeServiceOrder(o.id, { kind: "nota", text: "ok", createdAt: "2026-06-19" });
    await drain();
    expect(h.clientCalls.count).toBe(0);
    expect(h.rows.size).toBe(0);
  });

  test("ligar→desligar volta ao no-op; local nunca regride", async () => {
    setFlag("service_orders_remote_enabled", true);
    const o = addServiceOrder({ title: "Com remoto", category: "obra" });
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const apos = h.clientCalls.count;

    resetFlag("service_orders_remote_enabled");
    updateServiceOrder(o.id, { status: "cancelada" });
    addServiceOrder({ title: "Pos-off", category: "outro" });
    await drain();
    expect(h.clientCalls.count).toBe(apos);
    expect(getServiceOrders().find((x) => x.id === o.id)?.status).toBe("cancelada");
    expect(getServiceOrders()).toHaveLength(2);
  });
});
