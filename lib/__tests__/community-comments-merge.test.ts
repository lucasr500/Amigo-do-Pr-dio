import { describe, test, expect } from "vitest";
import { mergeComments } from "@/lib/tenant/communityCommentsMerge";
import type { Comment } from "@/lib/community-types";

function cmt(id: string, updatedAt: string, status: Comment["status"] = "publicado"): Comment {
  return {
    id, postId: "p1", authorName: "Morador", authorRole: "resident", body: "b", status,
    createdAt: "2026-06-01T00:00:00.000Z", updatedAt,
  };
}

describe("mergeComments", () => {
  test("une por id; conflito vence updatedAt mais recente (ex.: moderação)", () => {
    expect(mergeComments([cmt("a", "2026-06-01T10:00:00.000Z")], [cmt("b", "2026-06-01T10:00:00.000Z")]).map((c) => c.id).sort()).toEqual(["a", "b"]);
    const out = mergeComments([cmt("a", "2026-06-01T10:00:00.000Z", "pendente")], [cmt("a", "2026-06-02T10:00:00.000Z", "publicado")]);
    expect(out[0].status).toBe("publicado"); // moderação remota mais recente vence
  });
  test("empate preserva o local; sem tombstones (remoção é status, não ausência)", () => {
    const t = "2026-06-03T10:00:00.000Z";
    expect(mergeComments([cmt("a", t, "pendente")], [cmt("a", t, "publicado")])[0].status).toBe("pendente");
    expect(mergeComments([cmt("a", t)], [cmt("a", t), cmt("c", t)]).map((c) => c.id).sort()).toEqual(["a", "c"]);
  });
});
