import { beforeEach, describe, expect, test, vi } from "vitest";
import { buildMonthlyOperationalSummary } from "@/lib/operational-summary";

// Mock das dependências que lêm localStorage
vi.mock("@/lib/command-center", () => ({
  buildCommandCenterCached: () => ({
    healthPercentage: 72,
    summaryText: "Atenção recomendada",
    todayFocus: [{ title: "Renovar AVCB", reason: "Vence em 5 dias" }],
  }),
}));

vi.mock("@/lib/financial", () => ({
  buildMonthlyFinancialExecutiveSummary: () => "💰 Financeiro: sem dados registrados",
  currentMonthKey: () => "2026-06",
}));

vi.mock("@/lib/local-integrity", () => ({
  buildLocalIntegrityReport: () => ({ score: 88 }),
}));

vi.mock("@/lib/session", () => ({
  getProfile: () => ({ nomeCondominio: "Edifício Teste" }),
  getPendencias: () => [
    { id: "p1", status: "aberta", dueDate: "2020-01-01" }, // vencida
    { id: "p2", status: "aberta", dueDate: "2099-01-01" },
    { id: "p3", status: "concluida" },
  ],
  getAgendaEvents: () => [
    { id: "a1", completedAt: null },
    { id: "a2", completedAt: "2026-05-01T10:00:00Z" },
  ],
}));

vi.mock("@/lib/session-documentos", () => ({
  getDocumentosSummary: () => ({
    criticosPendentes: 0,
    vencidos: 1,
    proximos: 0,
    tenho: 3,
  }),
}));

vi.mock("@/lib/monthly-review", () => ({
  buildMonthlyReview: () => ({
    score: 65,
    items: [
      { severity: "critical", title: "AVCB vencido" },
      { severity: "warning", title: "AGO pendente" },
    ],
  }),
}));

vi.mock("@/lib/session-monthly-review", () => ({
  getMonthlyReviewState: () => ({ status: "em_andamento" }),
}));

describe("buildMonthlyOperationalSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("inclui nome do condomínio no cabeçalho", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("Edifício Teste");
  });

  test("inclui seção de saúde operacional com score", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("72/100");
  });

  test("inclui score da revisão mensal", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("65/100");
  });

  test("inclui integridade dos dados", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("88/100");
  });

  test("inclui contagem de pendências abertas", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("Pendências abertas: 2");
  });

  test("destaca pendências vencidas", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("vencida");
  });

  test("inclui emojis de seção (formato WhatsApp)", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("🏢");
    expect(report).toContain("📅");
    expect(report).toContain("📌");
    expect(report).toContain("⚠️");
    expect(report).toContain("📊");
  });

  test("inclui disclaimer de não substituição profissional", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("Não substitui");
  });

  test("inclui itens críticos da revisão mensal", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("AVCB vencido");
  });

  test("inclui seção financeira", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("Financeiro");
  });

  test("usa status 'Em andamento' para revisão em andamento", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("Em andamento");
  });

  test("inclui separador visual para facilitar leitura", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(report).toContain("─");
  });

  test("retorna string (copiável)", () => {
    const report = buildMonthlyOperationalSummary("2026-06");
    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(200);
  });
});
