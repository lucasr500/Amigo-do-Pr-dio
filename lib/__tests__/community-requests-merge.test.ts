import { describe, test, expect } from "vitest";
import { mergeRequests } from "@/lib/tenant/communityRequestsMerge";
import type { ResidentRequest } from "@/lib/community-types";

function req(id: string, updatedAt: string, title = "t"): ResidentRequest {
  return {
    id, authorName: "Morador", type: "outro", title, description: "d",
    status: "recebido", priority: "normal",
    createdAt: "2026-06-01T00:00:00.000Z", updatedAt,
  };
}

describe("mergeRequests", () => {
  test("une por id (registros distintos somam)", () => {
    const out = mergeRequests([req("a", "2026-06-01T10:00:00.000Z")], [req("b", "2026-06-01T10:00:00.000Z")]);
    expect(out.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  test("conflito: vence o updatedAt mais recente (remoto > local)", () => {
    const out = mergeRequests([req("a", "2026-06-01T10:00:00.000Z", "local")], [req("a", "2026-06-02T10:00:00.000Z", "remoto")]);
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("remoto");
  });

  test("conflito: local mais recente prevalece sobre remoto antigo", () => {
    const out = mergeRequests([req("a", "2026-06-05T10:00:00.000Z", "local-novo")], [req("a", "2026-06-01T10:00:00.000Z", "remoto-velho")]);
    expect(out[0].title).toBe("local-novo");
  });

  test("empate de timestamp preserva o local (sem flapping)", () => {
    const t = "2026-06-03T10:00:00.000Z";
    expect(mergeRequests([req("a", t, "local")], [req("a", t, "remoto")])[0].title).toBe("local");
  });

  test("remoto-only é adicionado; local-only é mantido (sem tombstones)", () => {
    const local = [req("a", "2026-06-01T10:00:00.000Z")];
    const remote = [req("a", "2026-06-01T10:00:00.000Z"), req("c", "2026-06-01T10:00:00.000Z")];
    expect(mergeRequests(local, remote).map((r) => r.id).sort()).toEqual(["a", "c"]);
  });
});
