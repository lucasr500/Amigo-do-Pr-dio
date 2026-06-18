import { describe, test, expect } from "vitest";
import { mergePosts } from "@/lib/tenant/communityPostsMerge";
import type { InstitutionalPost } from "@/lib/community-types";

function post(id: string, updatedAt: string, title = "t"): InstitutionalPost {
  return {
    id, title, body: "", category: "aviso", visibility: "moradores",
    allowComments: false, pinned: false, archived: false,
    createdAt: "2026-06-01T00:00:00.000Z", updatedAt,
  };
}

describe("mergePosts", () => {
  test("une por id (registros distintos somam)", () => {
    const out = mergePosts([post("a", "2026-06-01T10:00:00.000Z")], [post("b", "2026-06-01T10:00:00.000Z")]);
    expect(out.map((p) => p.id).sort()).toEqual(["a", "b"]);
  });

  test("conflito: vence o updatedAt mais recente (remoto > local)", () => {
    const out = mergePosts([post("a", "2026-06-01T10:00:00.000Z", "local")], [post("a", "2026-06-02T10:00:00.000Z", "remoto")]);
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("remoto");
  });

  test("conflito: local mais recente prevalece sobre remoto antigo", () => {
    const out = mergePosts([post("a", "2026-06-05T10:00:00.000Z", "local-novo")], [post("a", "2026-06-01T10:00:00.000Z", "remoto-velho")]);
    expect(out[0].title).toBe("local-novo");
  });

  test("empate de timestamp preserva o local (sem flapping)", () => {
    const t = "2026-06-03T10:00:00.000Z";
    const out = mergePosts([post("a", t, "local")], [post("a", t, "remoto")]);
    expect(out[0].title).toBe("local");
  });

  test("remoto-only é adicionado; local-only é mantido (sem tombstones)", () => {
    const local = [post("a", "2026-06-01T10:00:00.000Z")];
    const remote = [post("a", "2026-06-01T10:00:00.000Z"), post("c", "2026-06-01T10:00:00.000Z")];
    expect(mergePosts(local, remote).map((p) => p.id).sort()).toEqual(["a", "c"]);
  });
});
