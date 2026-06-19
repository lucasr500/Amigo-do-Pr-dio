import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemoteServiceOrders } from "@/lib/tenant/serviceOrdersSync";
import { addServiceOrder, getServiceOrders } from "@/lib/service-orders";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});
afterEach(() => { resetFlag("service_orders_remote_enabled"); localStorageMock.clear(); });

describe("pullRemoteServiceOrders — cutover de leitura gated (017)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addServiceOrder({ title: "Local 1", category: "manutencao" });
    const antes = getServiceOrders();
    const r = await pullRemoteServiceOrders();
    expect(r.merged).toBe(false);
    expect(getServiceOrders()).toHaveLength(antes.length);
    expect(getServiceOrders()[0].title).toBe("Local 1");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP", async () => {
    setFlag("service_orders_remote_enabled", true);
    addServiceOrder({ title: "Local 2", category: "obra" });
    const r = await pullRemoteServiceOrders();
    expect(r.merged).toBe(false);
    expect(getServiceOrders()[0].title).toBe("Local 2");
  });
});
