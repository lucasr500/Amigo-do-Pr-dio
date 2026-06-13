import { describe, expect, test } from "vitest";
import {
  audienceFromRole,
  communityEmptyState,
  type CommunityEmptyContext,
  type EmptyAudience,
} from "@/components/ui/empty-state-helpers";

const CONTEXTS: CommunityEmptyContext[] = [
  "mural",
  "requests",
  "polls",
  "documents",
  "reservas",
];
const AUDIENCES: EmptyAudience[] = ["manager", "member"];

describe("audienceFromRole", () => {
  test("mapeia gestão para manager e demais para member", () => {
    expect(audienceFromRole(true)).toBe("manager");
    expect(audienceFromRole(false)).toBe("member");
  });
});

describe("communityEmptyState", () => {
  test("retorna conteúdo completo e não vazio para todo contexto/público", () => {
    for (const context of CONTEXTS) {
      for (const audience of AUDIENCES) {
        const content = communityEmptyState(context, audience);
        expect(content.title.length).toBeGreaterThan(0);
        expect(content.description.length).toBeGreaterThan(0);
        expect(content.hint.length).toBeGreaterThan(0);
      }
    }
  });

  test("diferencia a copy entre gestão e membro em cada contexto", () => {
    for (const context of CONTEXTS) {
      const manager = communityEmptyState(context, "manager");
      const member = communityEmptyState(context, "member");
      expect(manager.title).not.toBe(member.title);
      expect(manager.description).not.toBe(member.description);
    }
  });

  test("é determinística (mesma entrada, mesma saída)", () => {
    expect(communityEmptyState("mural", "manager")).toEqual(
      communityEmptyState("mural", "manager")
    );
  });

  test("descrição da gestão de documentos reforça transparência/memória", () => {
    const docs = communityEmptyState("documents", "manager");
    expect(docs.description.toLowerCase()).toMatch(/transparência|memória/);
  });
});
