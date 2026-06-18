import { describe, test, expect } from "vitest";
import { mergeDecisions } from "@/lib/tenant/decisionsMerge";
import type { Decision } from "@/lib/decisions";

function dec(id: string, updatedAt: string, title = "t"): Decision {
  return {
    id, title, date: "2026-06-01", category: "outro", context: "", rationale: "",
    outcome: "", status: "registrada", visibility: "gestao",
    createdAt: "2026-06-01T00:00:00.000Z", updatedAt,
  };
}

describe("mergeDecisions", () => {
  test("une por id (registros distintos somam)", () => {
    const local = [dec("a", "2026-06-01T10:00:00.000Z")];
    const remote = [dec("b", "2026-06-01T10:00:00.000Z")];
    const out = mergeDecisions(local, remote);
    expect(out.map((d) => d.id).sort()).toEqual(["a", "b"]);
  });

  test("conflito: vence o updatedAt mais recente (remoto > local)", () => {
    const local = [dec("a", "2026-06-01T10:00:00.000Z", "local")];
    const remote = [dec("a", "2026-06-02T10:00:00.000Z", "remoto")];
    const out = mergeDecisions(local, remote);
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("remoto");
  });

  test("conflito: local mais recente prevalece sobre remoto antigo", () => {
    const local = [dec("a", "2026-06-05T10:00:00.000Z", "local-novo")];
    const remote = [dec("a", "2026-06-01T10:00:00.000Z", "remoto-velho")];
    expect(mergeDecisions(local, remote)[0].title).toBe("local-novo");
  });

  test("empate de timestamp preserva o local (sem flapping)", () => {
    const t = "2026-06-03T10:00:00.000Z";
    const out = mergeDecisions([dec("a", t, "local")], [dec("a", t, "remoto")]);
    expect(out[0].title).toBe("local");
  });

  test("remoto-only é adicionado; local-only é mantido (sem tombstones)", () => {
    const local = [dec("a", "2026-06-01T10:00:00.000Z")];
    const remote = [dec("a", "2026-06-01T10:00:00.000Z"), dec("c", "2026-06-01T10:00:00.000Z")];
    const out = mergeDecisions(local, remote);
    expect(out.map((d) => d.id).sort()).toEqual(["a", "c"]);
  });
});
