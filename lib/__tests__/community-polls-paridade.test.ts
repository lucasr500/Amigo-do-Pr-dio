// PROVA DE PARIDADE (011) — Enquetes: polls E votes.
// Após add/close (polls) e vote (votes) pela API de domínio, o remoto reflete o local
// nos campos de negócio, e o AGREGADO (getPollResults) é correto. Mirrors SERIALIZADOS
// (seed com flag off + await mirror*) p/ evitar a corrida do mock de import concorrente.
//
// Privacidade do voto INDIVIDUAL é propriedade da RLS (provada no gate de CI contra Postgres
// real): aqui provamos a paridade de dados e a correção do agregado.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  polls: new Map<string, Record<string, unknown>>(),
  votes: new Map<string, Record<string, unknown>>(),
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
  getSupabaseClient: async () => ({ from: (t: string) => makeTable(t === "poll_votes" ? h.votes : h.polls) }),
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

import { addPoll, updatePoll, deletePoll, vote, getPolls, getVotes, getPollResults } from "@/lib/community-polls";
import { mirrorUpsertPoll, mirrorUpsertVote, listRemotePolls, listRemoteVotes } from "@/lib/tenant/communityPollsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";
import type { Poll, PollVote } from "@/lib/community-types";

function bizPoll(p: Poll) { const { createdAt: _c, updatedAt: _u, ...rest } = p; return rest; }
function bizVote(v: PollVote) { const { createdAt: _c, ...rest } = v; return rest; }
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

async function assertParidade() {
  expect((await listRemotePolls()).map(bizPoll).sort(byId)).toEqual(getPolls().map(bizPoll).sort(byId));
  expect((await listRemoteVotes()).map(bizVote).sort(byId)).toEqual(getVotes().map(bizVote).sort(byId));
}

const pollData = { title: "Horário", description: "d", options: [{ id: "o1", label: "Sáb" }, { id: "o2", label: "Dom" }], visibility: "moradores" as const, status: "ativa" as const };

function seedAddPoll(): Poll {
  resetFlag("polls_remote_enabled");
  const p = addPoll(pollData);
  setFlag("polls_remote_enabled", true);
  return p;
}
function seedVote(pollId: string, optionId: string, label: string): void {
  resetFlag("polls_remote_enabled");
  vote(pollId, optionId, label);
  setFlag("polls_remote_enabled", true);
}
async function mirrorAllLocal(): Promise<void> {
  for (const p of getPolls()) await mirrorUpsertPoll(p);
  for (const v of getVotes()) await mirrorUpsertVote(v);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.polls.clear(); h.votes.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("polls_remote_enabled", true);
});
afterEach(() => {
  resetFlag("polls_remote_enabled");
  localStorageMock.clear();
  h.polls.clear(); h.votes.clear();
});

describe("Paridade local↔remoto (011) — polls + votes", () => {
  test("poll + votos espelhados aparecem idênticos no remoto", async () => {
    const p = seedAddPoll();
    seedVote(p.id, "o1", "101");
    seedVote(p.id, "o1", "201");
    seedVote(p.id, "o2", "301");
    await mirrorAllLocal();

    await assertParidade();
    expect(await listRemotePolls().then((x) => x.length)).toBe(1);
    expect(await listRemoteVotes().then((x) => x.length)).toBe(3);
  });

  test("AGREGADO correto (getPollResults) e preservado no espelho", async () => {
    const p = seedAddPoll();
    seedVote(p.id, "o1", "101");
    seedVote(p.id, "o1", "201");
    seedVote(p.id, "o2", "301");
    await mirrorAllLocal();

    const results = getPollResults(p.id);
    const o1 = results.find((r) => r.optionId === "o1")!;
    const o2 = results.find((r) => r.optionId === "o2")!;
    expect(o1.count).toBe(2); expect(o1.pct).toBe(67);
    expect(o2.count).toBe(1); expect(o2.pct).toBe(33);
    // o conjunto de votos remoto é idêntico → mesmo agregado, sem expor voto individual entre pares (RLS).
    expect((await listRemoteVotes()).filter((v) => v.optionId === "o1")).toHaveLength(2);
  });

  test("CLOSE (updatePoll) reflete no remoto; DELETE remove a enquete", async () => {
    const p = seedAddPoll();
    await mirrorUpsertPoll(p);
    await assertParidade();

    resetFlag("polls_remote_enabled"); updatePoll(p.id, { status: "encerrada" }); setFlag("polls_remote_enabled", true);
    await mirrorUpsertPoll(getPolls().find((x) => x.id === p.id)!);
    await assertParidade();
    expect((await listRemotePolls()).find((x) => x.id === p.id)?.status).toBe("encerrada");

    deletePoll(p.id); // flag ON → mirrorDeletePoll dispara
    await vi.waitFor(async () => {
      expect((await listRemotePolls()).some((x) => x.id === p.id)).toBe(false);
    }, { timeout: 2000, interval: 20 });
  });

  test("WIRING: addPoll + vote (flag ON) disparam o push e chegam ao remoto", async () => {
    // Serializado: addPoll e vote são dois pushes flutuantes; encadear evita a corrida
    // do mock de import concorrente (gotcha do molde) — em produção são ações distintas.
    const p = addPoll(pollData);
    await vi.waitFor(async () => {
      expect((await listRemotePolls()).some((x) => x.id === p.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
    vote(p.id, "o1", "101");
    await vi.waitFor(async () => {
      expect((await listRemoteVotes()).length).toBe(1);
    }, { timeout: 2000, interval: 20 });
  });
});
