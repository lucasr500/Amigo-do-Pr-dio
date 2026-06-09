import { describe, test, expect } from "vitest";
import {
  isSectionVisible,
  isCentralSectionVisible,
  defaultCentralSection,
  getVisibleCondominioSections,
  MANAGER_ONLY_SECTIONS,
  RESIDENT_VISIBLE_CENTRAL_SECTIONS,
  MANAGER_ONLY_CENTRAL_SECTIONS,
} from "@/lib/visibility-guards";

// ── isSectionVisible ──────────────────────────────────────────────────────────

describe("isSectionVisible", () => {
  test("manager vê todas as seções", () => {
    for (const sec of MANAGER_ONLY_SECTIONS) {
      expect(isSectionVisible(sec, "manager")).toBe(true);
    }
  });

  test("council vê todas as seções", () => {
    for (const sec of MANAGER_ONLY_SECTIONS) {
      expect(isSectionVisible(sec, "council")).toBe(true);
    }
  });

  test("resident não vê financeiro", () => {
    expect(isSectionVisible("financeiro", "resident")).toBe(false);
  });

  test("resident não vê implantacao", () => {
    expect(isSectionVisible("implantacao", "resident")).toBe(false);
  });

  test("resident não vê revisao-mensal", () => {
    expect(isSectionVisible("revisao-mensal", "resident")).toBe(false);
  });

  test("resident não vê operacao", () => {
    expect(isSectionVisible("operacao", "resident")).toBe(false);
  });

  test("resident não vê memoria-institucional", () => {
    expect(isSectionVisible("memoria-institucional", "resident")).toBe(false);
  });

  test("resident não vê dados (backup)", () => {
    expect(isSectionVisible("dados", "resident")).toBe(false);
  });

  test("resident vê visao-geral", () => {
    expect(isSectionVisible("visao-geral", "resident")).toBe(true);
  });

  test("resident vê central-digital", () => {
    expect(isSectionVisible("central-digital", "resident")).toBe(true);
  });

  test("resident não vê seções de gestão desconhecidas mas típicas", () => {
    expect(isSectionVisible("financeiro", "viewer")).toBe(false);
  });
});

// ── isCentralSectionVisible ───────────────────────────────────────────────────

describe("isCentralSectionVisible", () => {
  test("manager vê hub", () => {
    expect(isCentralSectionVisible("hub", "manager")).toBe(true);
  });

  test("manager vê timeline", () => {
    expect(isCentralSectionVisible("timeline", "manager")).toBe(true);
  });

  test("manager vê relatorio", () => {
    expect(isCentralSectionVisible("relatorio", "manager")).toBe(true);
  });

  test("resident não vê hub", () => {
    expect(isCentralSectionVisible("hub", "resident")).toBe(false);
  });

  test("resident não vê timeline", () => {
    expect(isCentralSectionVisible("timeline", "resident")).toBe(false);
  });

  test("resident não vê relatorio", () => {
    expect(isCentralSectionVisible("relatorio", "resident")).toBe(false);
  });

  test("resident vê mural", () => {
    expect(isCentralSectionVisible("mural", "resident")).toBe(true);
  });

  test("resident vê canal", () => {
    expect(isCentralSectionVisible("canal", "resident")).toBe(true);
  });

  test("resident vê reservas", () => {
    expect(isCentralSectionVisible("reservas", "resident")).toBe(true);
  });

  test("resident vê enquetes", () => {
    expect(isCentralSectionVisible("enquetes", "resident")).toBe(true);
  });

  test("resident vê documentos", () => {
    expect(isCentralSectionVisible("documentos", "resident")).toBe(true);
  });

  test("todas seções visíveis para residente estão na lista", () => {
    for (const sec of RESIDENT_VISIBLE_CENTRAL_SECTIONS) {
      expect(isCentralSectionVisible(sec, "resident")).toBe(true);
    }
  });

  test("nenhuma seção manager-only é visível para residente", () => {
    for (const sec of MANAGER_ONLY_CENTRAL_SECTIONS) {
      expect(isCentralSectionVisible(sec, "resident")).toBe(false);
    }
  });
});

// ── defaultCentralSection ─────────────────────────────────────────────────────

describe("defaultCentralSection", () => {
  test("manager começa em hub", () => {
    expect(defaultCentralSection("manager")).toBe("hub");
  });

  test("council começa em hub", () => {
    expect(defaultCentralSection("council")).toBe("hub");
  });

  test("resident começa em mural", () => {
    expect(defaultCentralSection("resident")).toBe("mural");
  });

  test("viewer começa em mural", () => {
    expect(defaultCentralSection("viewer")).toBe("mural");
  });
});

// ── getVisibleCondominioSections ──────────────────────────────────────────────

describe("getVisibleCondominioSections", () => {
  test("manager vê todas as 9 seções", () => {
    const sections = getVisibleCondominioSections("manager");
    expect(sections.length).toBe(9);
  });

  test("resident vê apenas visao-geral e central-digital", () => {
    const sections = getVisibleCondominioSections("resident");
    expect(sections).toContain("visao-geral");
    expect(sections).toContain("central-digital");
    expect(sections).not.toContain("financeiro");
    expect(sections).not.toContain("documentos");
    expect(sections).not.toContain("dados");
    expect(sections).not.toContain("operacao");
    expect(sections).not.toContain("memoria-institucional");
    expect(sections.length).toBe(2); // visao-geral + central-digital
  });

  test("council vê todas as seções como manager", () => {
    const managerSections = getVisibleCondominioSections("manager");
    const councilSections = getVisibleCondominioSections("council");
    expect(councilSections).toEqual(managerSections);
  });
});
