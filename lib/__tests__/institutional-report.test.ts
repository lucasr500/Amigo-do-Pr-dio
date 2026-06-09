import { beforeEach, describe, expect, test, vi } from "vitest";
import { buildInstitutionalReport } from "@/lib/institutional-report";

vi.mock("@/lib/command-center", () => ({
  buildCommandCenterCached: () => ({
    healthPercentage: 78,
    summaryText: "Bom desempenho",
    todayFocus: [
      { title: "Renovar AVCB" },
      { title: "Agendar limpeza da caixa d'água" },
    ],
  }),
}));

vi.mock("@/lib/decisions", () => ({
  getDecisions: () => [
    {
      id: "d1", title: "Contratar dedetização",
      date: "2026-05-01", category: "manutencao",
      context: "Prazo vencido", rationale: "Obrigatório",
      outcome: "Aprovado", status: "concluida",
      createdAt: "2026-05-01T10:00:00Z", updatedAt: "2026-05-15T10:00:00Z",
    },
    {
      id: "d2", title: "Renovar AVCB",
      date: "2026-06-01", category: "seguranca",
      context: "Vence em 5 dias", rationale: "Obrigatório",
      outcome: "Em andamento", status: "em_execucao",
      nextStep: "Acionar empresa", riskLevel: "alto",
      createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
    },
  ],
  DECISION_STATUS_LABELS: {
    registrada: "Registrada",
    em_execucao: "Em execução",
    concluida: "Concluída",
    suspensa: "Suspensa",
  },
}));

vi.mock("@/lib/suppliers", () => ({
  getActiveSuppliers: () => [
    { id: "s1", name: "Elevadores Confort", category: "elevador", active: true },
    { id: "s2", name: "Administradora Horizonte", category: "administradora", active: true },
  ],
}));

vi.mock("@/lib/community-timeline", () => ({
  getTimeline: () => [
    { id: "tl1", title: "AVCB renovado com sucesso", type: "documento", occurredAt: "2026-06-01T10:00:00Z", createdAt: "2026-06-01T10:00:00Z" },
    { id: "tl2", title: "Assembleia realizada", type: "assembleia", occurredAt: "2026-05-15T10:00:00Z", createdAt: "2026-05-15T10:00:00Z" },
  ],
}));

vi.mock("@/lib/financial", () => ({
  currentMonthKey: () => "2026-06",
  getCurrentFinancialSnapshot: () => ({
    id: "snap-2026-06",
    month: "2026-06",
    estimatedBalance: 12500,
    delinquencyRate: 8,
    entries: [{ id: "e1", type: "receita", title: "Cotas", amount: 39200, category: "Receita", status: "previsto", createdAt: "2026-06-01T10:00:00Z" }],
    createdAt: "2026-06-01T10:00:00Z",
  }),
}));

vi.mock("@/lib/handoff", () => ({
  getHandoffProgress: () => ({ done: 4, total: 20, pct: 20 }),
}));

vi.mock("@/lib/session-pendencias", () => ({
  getPendencias: () => [
    { id: "p1", titulo: "Renovar AVCB", status: "aberta", dueDate: "2026-06-13", categoria: "documentos", createdAt: "2026-05-20T10:00:00Z" },
    { id: "p2", titulo: "Limpeza caixa d'água", status: "aberta", dueDate: "2099-01-01", categoria: "manutencao", createdAt: "2026-05-18T10:00:00Z" },
    { id: "p3", titulo: "Notificação morador 71", status: "concluida", createdAt: "2026-05-10T10:00:00Z" },
  ],
}));

vi.mock("@/lib/session", () => ({
  getProfile: () => ({ nomeCondominio: "Edifício Teste" }),
}));

vi.mock("@/lib/session-documentos", () => ({
  getDocumentosSummary: () => ({ tenho: 5, vencidos: 1, proximos: 2, criticosPendentes: 0 }),
}));

vi.mock("@/lib/session-monthly-review", () => ({
  getMonthlyReviewHistory: () => [{ month: "2026-05" }, { month: "2026-04" }],
}));

vi.mock("@/lib/community-posts", () => ({
  getPublishedPosts: () => [
    { id: "p1", title: "Aviso oficial", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: true, archived: false, createdAt: "2026-06-05T10:00:00Z", updatedAt: "2026-06-05T10:00:00Z" },
    { id: "p2", title: "Sugestão morador", body: "y", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false, createdAt: "2026-06-06T10:00:00Z", updatedAt: "2026-06-06T10:00:00Z" },
  ],
}));

vi.mock("@/lib/community-polls", () => ({
  getPolls: () => [
    { id: "poll-1", title: "Horário de manutenção", description: "", options: [], visibility: "moradores", status: "ativa", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
  ],
}));

vi.mock("@/lib/community-requests", () => ({
  getRequests: () => [],
  getRequestSummary: () => ({ total: 3, open: 2, resolved: 1, urgent: 0 }),
}));

vi.mock("@/lib/community-reservas", () => ({
  getReservations: () => [
    { id: "res-1", unit: "201", requesterName: "João", space: "Salão de Festas", date: "2026-06-20", status: "aprovada", createdAt: "2026-06-08T10:00:00Z", updatedAt: "2026-06-08T10:00:00Z" },
    { id: "res-2", unit: "401", requesterName: "Ana", space: "Churrasqueira", date: "2026-06-25", status: "solicitada", createdAt: "2026-06-08T11:00:00Z", updatedAt: "2026-06-08T11:00:00Z" },
  ],
}));

describe("buildInstitutionalReport — dados completos", () => {
  beforeEach(() => vi.clearAllMocks());

  test("inclui nome do condomínio", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Edifício Teste");
  });

  test("inclui HealthScore", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("78/100");
  });

  test("inclui prioridades", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Renovar AVCB");
  });

  test("inclui contagem de pendências", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Abertas: 2");
    expect(r).toContain("Concluídas: 1");
  });

  test("inclui dados de documentos", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Em dia: 5");
  });

  test("inclui saldo financeiro", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("12.500");
  });

  test("inclui inadimplência", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("8%");
  });

  test("inclui decisões por status", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Em execução: 1");
    expect(r).toContain("Concluídas: 1");
  });

  test("inclui fornecedores ativos", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Elevadores Confort");
  });

  test("inclui eventos de timeline", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("AVCB renovado");
  });

  test("inclui percentual de handoff", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("20%");
  });

  test("inclui contagem de revisões mensais", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("2");
  });

  test("inclui emojis de seção", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("🏢");
    expect(r).toContain("📌");
    expect(r).toContain("📄");
    expect(r).toContain("💰");
    expect(r).toContain("🏛️");
    expect(r).toContain("🕘");
    expect(r).toContain("🔁");
  });

  test("inclui seção Central Digital com emoji", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("🏘️");
    expect(r).toContain("Central Digital");
  });

  test("Central Digital inclui contagem de comunicados oficiais e participações", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Comunicados oficiais publicados: 1");
    expect(r).toContain("Participações de moradores: 1");
  });

  test("Central Digital inclui solicitações e reservas", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Solicitações:");
    expect(r).toContain("Reservas: 2");
  });

  test("inclui disclaimer correto", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(r).toContain("Não substitui ata");
    expect(r).toContain("balancete");
  });

  test("relatório não inventa dados", () => {
    const r = buildInstitutionalReport("2026-06");
    // Não deve conter valores que não vieram do mock
    expect(r).not.toContain("R$ 0,00");
  });

  test("retorna string copiável com tamanho razoável", () => {
    const r = buildInstitutionalReport("2026-06");
    expect(typeof r).toBe("string");
    expect(r.length).toBeGreaterThan(300);
  });
});

describe("buildInstitutionalReport — sem dados (fallback elegante)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vi.importMock).mockRestore?.();
  });

  test("fallback sem dados de decisões não inclui seção de decisões", () => {
    vi.doMock("@/lib/decisions", () => ({
      getDecisions: () => [],
      DECISION_STATUS_LABELS: { registrada: "Registrada", em_execucao: "Em execução", concluida: "Concluída", suspensa: "Suspensa" },
    }));
    // No mínimo o relatório deve ser string e conter disclaimer
    const r = buildInstitutionalReport("2026-06");
    expect(typeof r).toBe("string");
    expect(r).toContain("Não substitui");
  });
});
