import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemotePolls } from "@/lib/tenant/communityPollsSync";
import { addPoll, vote, getPolls, getVotes } from "@/lib/community-polls";
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
afterEach(() => { resetFlag("polls_remote_enabled"); localStorageMock.clear(); });

const pollData = { title: "Enquete", description: "", options: [{ id: "o1", label: "A" }, { id: "o2", label: "B" }], visibility: "moradores" as const, status: "ativa" as const };

describe("pullRemotePolls — cutover de leitura gated (011)", () => {
  test("flag OFF (default) → NO-OP total: stores locais (polls e votes) intocados", async () => {
    const p = addPoll(pollData);
    vote(p.id, "o1", "101");
    const pollsAntes = getPolls().length;
    const votesAntes = getVotes().length;
    const r = await pullRemotePolls();
    expect(r.merged).toBe(false);
    expect(getPolls()).toHaveLength(pollsAntes);
    expect(getVotes()).toHaveLength(votesAntes);
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP", async () => {
    setFlag("polls_remote_enabled", true);
    const p = addPoll(pollData);
    vote(p.id, "o2", "201");
    const r = await pullRemotePolls();
    expect(r.merged).toBe(false);
    expect(getPolls()[0].id).toBe(p.id);
  });
});
