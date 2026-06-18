import { describe, test, expect } from "vitest";
import {
  CONTENT_NATURES,
  CONTENT_NATURE_LABELS,
  CONTENT_NATURE_DESCRIPTION,
  CONTENT_NATURE_RANK,
  isContentNature,
  natureOfPost,
  natureOfComment,
  natureOfDecision,
  natureOfAgendaItem,
} from "@/lib/content-nature";

describe("taxonomia de natureza do conteúdo", () => {
  test("há exatamente três naturezas, com label/descrição/rank para cada", () => {
    expect(CONTENT_NATURES).toEqual(["opiniao", "comunicado", "deliberacao"]);
    for (const n of CONTENT_NATURES) {
      expect(CONTENT_NATURE_LABELS[n]).toBeTruthy();
      expect(CONTENT_NATURE_DESCRIPTION[n]).toBeTruthy();
      expect(typeof CONTENT_NATURE_RANK[n]).toBe("number");
    }
  });

  test("rank reflete autoridade jurídica crescente", () => {
    expect(CONTENT_NATURE_RANK.opiniao).toBeLessThan(CONTENT_NATURE_RANK.comunicado);
    expect(CONTENT_NATURE_RANK.comunicado).toBeLessThan(CONTENT_NATURE_RANK.deliberacao);
  });

  test("isContentNature aceita só os três valores", () => {
    expect(isContentNature("opiniao")).toBe(true);
    expect(isContentNature("comunicado")).toBe(true);
    expect(isContentNature("deliberacao")).toBe(true);
    expect(isContentNature("oficial")).toBe(false);
    expect(isContentNature(undefined)).toBe(false);
    expect(isContentNature(2)).toBe(false);
  });
});

describe("natureOfPost", () => {
  test("morador → opinião", () => {
    expect(natureOfPost({ origin: "morador" })).toBe("opiniao");
  });
  test("oficial e sistema → comunicado", () => {
    expect(natureOfPost({ origin: "oficial" })).toBe("comunicado");
    expect(natureOfPost({ origin: "sistema" })).toBe("comunicado");
  });
  test("origem ausente → comunicado (default institucional)", () => {
    expect(natureOfPost({})).toBe("comunicado");
  });
});

describe("natureOfComment", () => {
  test("qualquer comentário é opinião, independente do papel", () => {
    expect(natureOfComment({ authorRole: "resident" })).toBe("opiniao");
    expect(natureOfComment({ authorRole: "manager" })).toBe("opiniao");
    expect(natureOfComment({ authorRole: "council" })).toBe("opiniao");
    expect(natureOfComment()).toBe("opiniao");
  });
});

describe("natureOfDecision", () => {
  test("categoria assembleia → deliberação", () => {
    expect(natureOfDecision({ category: "assembleia" })).toBe("deliberacao");
  });
  test("demais categorias → comunicado (ato de gestão)", () => {
    expect(natureOfDecision({ category: "financeiro" })).toBe("comunicado");
    expect(natureOfDecision({ category: "obras" })).toBe("comunicado");
    expect(natureOfDecision({ category: "outro" })).toBe("comunicado");
  });
});

describe("natureOfAgendaItem", () => {
  test("deliberação/eleição já decidida → deliberação", () => {
    expect(natureOfAgendaItem({ tipo: "deliberacao", decididoEm: "2026-06-17T10:00:00Z" })).toBe("deliberacao");
    expect(natureOfAgendaItem({ tipo: "eleicao", decididoEm: "2026-06-17T10:00:00Z" })).toBe("deliberacao");
  });
  test("deliberável ainda não decidido → comunicado", () => {
    expect(natureOfAgendaItem({ tipo: "deliberacao" })).toBe("comunicado");
    expect(natureOfAgendaItem({ tipo: "eleicao", decididoEm: undefined })).toBe("comunicado");
  });
  test("informe → comunicado, mesmo com carimbo", () => {
    expect(natureOfAgendaItem({ tipo: "informe" })).toBe("comunicado");
    expect(natureOfAgendaItem({ tipo: "informe", decididoEm: "2026-06-17T10:00:00Z" })).toBe("comunicado");
  });
});
