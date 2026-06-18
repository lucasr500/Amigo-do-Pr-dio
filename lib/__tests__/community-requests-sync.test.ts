import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemoteRequests } from "@/lib/tenant/communityRequestsSync";
import { addRequest, getRequests } from "@/lib/community-requests";
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
afterEach(() => { resetFlag("requests_remote_enabled"); localStorageMock.clear(); });

const data = { authorName: "Morador", type: "outro" as const, title: "t", description: "d", priority: "normal" as const };

describe("pullRemoteRequests — cutover de leitura gated (010)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addRequest({ ...data, title: "Local 1" });
    const antes = getRequests();
    const r = await pullRemoteRequests();
    expect(r.merged).toBe(false);
    expect(getRequests()).toHaveLength(antes.length);
    expect(getRequests()[0].title).toBe("Local 1");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP (gating em camadas)", async () => {
    setFlag("requests_remote_enabled", true);
    addRequest({ ...data, title: "Local 2" });
    const r = await pullRemoteRequests();
    expect(r.merged).toBe(false);
    expect(getRequests()[0].title).toBe("Local 2");
  });
});
