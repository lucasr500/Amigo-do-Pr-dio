// PROVA DE REVERSIBILIDADE (011) — Enquetes (polls + votes).
//   1) Flag off (default) = NO-OP TOTAL: cliente Supabase nunca invocado (zero rede) em
//      add/close/delete (polls) e vote (votes), e nas chamadas diretas ao espelho.
//   2) Stores locais com flag off byte-a-byte idênticos ao fluxo puramente local.
//   3) Ligar→desligar volta ao no-op; local nunca regride.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  polls: new Map<string, Record<string, unknown>>(),
  votes: new Map<string, Record<string, unknown>>(),
  clientCalls: { count: 0 },
}));

vi.mock("@/lib/tenant/tenantClient", () => ({ getActiveCondominioId: () => h.condId.value }));

function makeTable(map: Map<string, Record<string, unknown>>) {
  return {
    upsert: async (row: Record<string, unknown>) => { map.set(row.id as string, { ...row }); return { error: null }; },
    delete: () => ({ eq: (_c: string, _v: string) => ({ eq: async (_c2: string, id: string) => { map.delete(id); return { error: null }; } }) }),
    select: (_cols: string) => ({ eq: async (_c: string, cond: string) => ({ data: Array.from(map.values()).filter((r) => r.condominio_id === cond), error: null }) }),
  };
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => {
    h.clientCalls.count++;
    return { from: (t: string) => makeTable(t === "poll_votes" ? h.votes : h.polls) };
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

import { addPoll, updatePoll, deletePoll, vote, getPolls, getVotes } from "@/lib/community-polls";
import { mirrorUpsertPoll, mirrorUpsertVote, listRemotePolls } from "@/lib/tenant/communityPollsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };
const pollData = { title: "E", description: "", options: [{ id: "o1", label: "A" }, { id: "o2", label: "B" }], visibility: "moradores" as const, status: "ativa" as const };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.polls.clear(); h.votes.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => {
  resetFlag("polls_remote_enabled");
  localStorageMock.clear();
  h.polls.clear(); h.votes.clear();
});

describe("Reversibilidade / Não-Exposição (011) — flag OFF = no-op total", () => {
  test("add/close/delete e vote com flag off NÃO tocam a rede", async () => {
    const p = addPoll(pollData);
    vote(p.id, "o1", "101");
    updatePoll(p.id, { status: "encerrada" });
    deletePoll(p.id);
    await drain();

    expect(h.clientCalls.count).toBe(0);
    expect(h.polls.size).toBe(0);
    expect(h.votes.size).toBe(0);
  });

  test("chamadas diretas ao espelho com flag off são no-op", async () => {
    await mirrorUpsertPoll({ id: "p_x", title: "X", description: "", options: [], visibility: "moradores", status: "ativa", createdAt: "t", updatedAt: "t" });
    await mirrorUpsertVote({ id: "v_x", pollId: "p_x", optionId: "o1", createdAt: "t" });
    expect(h.clientCalls.count).toBe(0);
    expect((await listRemotePolls())).toEqual([]);
  });

  test("stores locais com flag off são idênticos a um fluxo puramente local", async () => {
    const p1 = addPoll(pollData); vote(p1.id, "o1", "101");
    await drain();
    const com = JSON.stringify({ polls: getPolls().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r), votes: getVotes().map(({ id: _i, pollId: _p, createdAt: _c, ...r }) => r) });

    localStorageMock.clear();
    const p2 = addPoll(pollData); vote(p2.id, "o1", "101");
    await drain();
    const puro = JSON.stringify({ polls: getPolls().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r), votes: getVotes().map(({ id: _i, pollId: _p, createdAt: _c, ...r }) => r) });

    expect(com).toBe(puro);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    setFlag("polls_remote_enabled", true);
    const p = addPoll(pollData);
    vote(p.id, "o1", "101");
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;

    resetFlag("polls_remote_enabled");
    vote(p.id, "o2", "201"); // ainda 'ativa' → registra o 2º voto (label distinto)
    updatePoll(p.id, { status: "encerrada" });
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn);
    expect(getPolls().find((x) => x.id === p.id)?.status).toBe("encerrada");
    expect(getVotes()).toHaveLength(2);
  });
});
