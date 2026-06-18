import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemoteDecisions } from "@/lib/tenant/decisionsSync";
import { addDecision, getDecisions } from "@/lib/decisions";
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
afterEach(() => { resetFlag("decisions_remote_enabled"); localStorageMock.clear(); });

describe("pullRemoteDecisions — cutover de leitura gated (D4)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addDecision({ title: "Local 1", date: "2026-06-01", category: "outro", context: "", rationale: "", outcome: "x" });
    const antes = getDecisions();
    const r = await pullRemoteDecisions();
    expect(r.merged).toBe(false);
    expect(getDecisions()).toHaveLength(antes.length); // nada mudou
    expect(getDecisions()[0].title).toBe("Local 1");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP (gating em camadas)", async () => {
    setFlag("decisions_remote_enabled", true);
    addDecision({ title: "Local 2", date: "2026-06-01", category: "outro", context: "", rationale: "", outcome: "x" });
    const r = await pullRemoteDecisions(); // sem getActiveCondominioId → listRemote retorna []
    expect(r.merged).toBe(false);
    expect(getDecisions()[0].title).toBe("Local 2");
  });
});
