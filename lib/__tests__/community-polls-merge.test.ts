import { describe, test, expect } from "vitest";
import { mergePolls, mergeVotes } from "@/lib/tenant/communityPollsMerge";
import type { Poll, PollVote } from "@/lib/community-types";

function poll(id: string, updatedAt: string, title = "t"): Poll {
  return {
    id, title, description: "", options: [{ id: "o1", label: "A" }],
    visibility: "moradores", status: "ativa",
    createdAt: "2026-06-01T00:00:00.000Z", updatedAt,
  };
}
function vote(id: string, createdAt: string, optionId = "o1"): PollVote {
  return { id, pollId: "p1", optionId, voterLabel: "101", createdAt };
}

describe("mergePolls", () => {
  test("une por id; conflito vence updatedAt mais recente", () => {
    expect(mergePolls([poll("a", "2026-06-01T10:00:00.000Z")], [poll("b", "2026-06-01T10:00:00.000Z")]).map((p) => p.id).sort()).toEqual(["a", "b"]);
    expect(mergePolls([poll("a", "2026-06-01T10:00:00.000Z", "local")], [poll("a", "2026-06-02T10:00:00.000Z", "remoto")])[0].title).toBe("remoto");
  });
  test("empate preserva o local", () => {
    const t = "2026-06-03T10:00:00.000Z";
    expect(mergePolls([poll("a", t, "local")], [poll("a", t, "remoto")])[0].title).toBe("local");
  });
});

describe("mergeVotes", () => {
  test("une por id; votos distintos somam (sem tombstones)", () => {
    const out = mergeVotes([vote("v1", "2026-06-01T10:00:00.000Z")], [vote("v2", "2026-06-01T10:00:00.000Z", "o2")]);
    expect(out.map((v) => v.id).sort()).toEqual(["v1", "v2"]);
  });
  test("votos imutáveis: critério cai em createdAt; empate preserva local", () => {
    const t = "2026-06-01T10:00:00.000Z";
    const out = mergeVotes([vote("v1", t, "o1")], [vote("v1", t, "o2")]);
    expect(out).toHaveLength(1);
    expect(out[0].optionId).toBe("o1"); // local preservado no empate
  });
});
