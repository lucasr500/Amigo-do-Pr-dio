import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemoteAgenda } from "@/lib/tenant/agendaSync";
import { addAgendaEvent, getAgendaEvents } from "@/lib/session-agenda";
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
afterEach(() => { resetFlag("agenda_remote_enabled"); localStorageMock.clear(); });

const data = { title: "t", date: "2026-06-01", type: "outro" as const };

describe("pullRemoteAgenda — cutover de leitura gated (006)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addAgendaEvent({ ...data, title: "Local 1" });
    const antes = getAgendaEvents();
    const r = await pullRemoteAgenda();
    expect(r.merged).toBe(false);
    expect(getAgendaEvents()).toHaveLength(antes.length);
    expect(getAgendaEvents()[0].title).toBe("Local 1");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP", async () => {
    setFlag("agenda_remote_enabled", true);
    addAgendaEvent({ ...data, title: "Local 2" });
    const r = await pullRemoteAgenda();
    expect(r.merged).toBe(false);
    expect(getAgendaEvents()[0].title).toBe("Local 2");
  });
});
