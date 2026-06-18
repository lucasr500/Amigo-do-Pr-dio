import { describe, test, expect } from "vitest";
import { mergeDocuments } from "@/lib/tenant/communityDocumentsMerge";
import type { PublicDocument } from "@/lib/community-types";

function doc(id: string, updatedAt: string, title = "t"): PublicDocument {
  return {
    id, title, category: "ata", visibility: "moradores",
    publishedAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z", updatedAt,
  };
}

describe("mergeDocuments", () => {
  test("une por id; conflito vence updatedAt mais recente", () => {
    expect(mergeDocuments([doc("a", "2026-06-01T10:00:00.000Z")], [doc("b", "2026-06-01T10:00:00.000Z")]).map((d) => d.id).sort()).toEqual(["a", "b"]);
    expect(mergeDocuments([doc("a", "2026-06-01T10:00:00.000Z", "local")], [doc("a", "2026-06-02T10:00:00.000Z", "remoto")])[0].title).toBe("remoto");
  });
  test("empate preserva o local; remoto-only entra; sem tombstones", () => {
    const t = "2026-06-03T10:00:00.000Z";
    expect(mergeDocuments([doc("a", t, "local")], [doc("a", t, "remoto")])[0].title).toBe("local");
    expect(mergeDocuments([doc("a", t)], [doc("a", t), doc("c", t)]).map((d) => d.id).sort()).toEqual(["a", "c"]);
  });
});
