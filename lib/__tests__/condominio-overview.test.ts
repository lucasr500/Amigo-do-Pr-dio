import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildCondominioOverview } from "../condominio-overview";
import type { CommandCenterResult, CommandAction } from "../command-center";
import type { HealthScoreResult } from "../health-score";
import type { FinancialSummary } from "../financial";
import type { MonthlyReviewState, MonthlyReviewSnapshot } from "../session-monthly-review";

// ─── localStorage mock ────────────────────────────────────────────────────────

const store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  },
  writable: false,
});

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../session", () => ({
  hasMemoriaOperacional: vi.fn(() => false),
  hasProfile: vi.fn(() => false),
  getLastBackupAt: vi.fn(() => null),
}));
vi.mock("../health-score", () => ({
  computeHealthScore: vi.fn(),
}));
vi.mock("../command-center", () => ({
  buildCommandCenter: vi.fn(),
}));
vi.mock("../financial", () => ({
  getFinancialSummary: vi.fn(),
  currentMonthKey: vi.fn(() => "2026-06"),
}));
vi.mock("../session-documentos", () => ({
  getDocumentosSummary: vi.fn(() => ({
    total: 10, tenho: 8, faltam: 2, vencidos: 0, proximos: 0,
    criticos: 0, criticosPendentes: 0, semRevisao: 0,
  })),
}));
vi.mock("../session-monthly-review", () => ({
  getMonthlyReviewState: vi.fn(),
  getLastCompletedMonthlyReview: vi.fn(() => null),
}));
vi.mock("../session-agenda", () => ({
  getUpcomingAgendaEvents: vi.fn(() => []),
}));
vi.mock("../session-pendencias", () => ({
  getPendenciasAbertas: vi.fn(() => []),
}));
vi.mock("../local-integrity", () => ({
  buildLocalIntegrityReport: vi.fn(() => ({
    score: 100, status: "ok" as const, storageSizeKB: 10,
    counts: {} as never, issues: [],
  })),
}));
vi.mock("../session-core", () => ({
  todayISO: vi.fn(() => "2026-06-05"),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

import * as sessionMod from "../session";
import * as healthMod from "../health-score";
import * as cmdMod from "../command-center";
import * as financialMod from "../financial";
import * as reviewMod from "../session-monthly-review";

function makeHealth(pct: number): HealthScoreResult {
  const key =
    pct <= 39 ? "critico" as const :
    pct <= 59 ? "atencao" as const :
    pct <= 79 ? "em-evolucao" as const :
    pct <= 94 ? "bem-acompanhado" as const : "tudo-em-ordem" as const;
  return {
    percentage: pct, statusKey: key, statusLabel: "Bom",
    diagnosticPhrase: "OK.", factors: [], suggestions: [],
    howToGain10Pts: [], biggestBottleneck: "",
  };
}

function makeCmd(overrides: Partial<CommandCenterResult> = {}): CommandCenterResult {
  return {
    riskLevel: "estavel" as const,
    topPriority: null,
    urgentActions: [],
    thisWeekActions: [],
    allActions: [],
    criticalNotifications: [],
    warningNotifications: [],
    unreadCount: 0,
    summaryText: "Sem ações urgentes.",
    upgradeText: "",
    stalePendenciasCount: 0,
    missingDocsCount: 0,
    overdueVacationsCount: 0,
    manutencoesAtrasadas: 0,
    healthPercentage: 80,
    implantacaoPct: 0,
    correlacoes: [],
    todayAnswer: "",
    topRisco: "",
    maiorLacuna: "",
    maiorMelhoria: "",
    guidanceTopTres: [],
    guidanceTopRisco: null,
    guidanceMaiorLacuna: null,
    guidanceMaiorMelhoria: null,
    todayFocus: [],
    ...overrides,
  };
}

function makeFinancial(cashRisk: FinancialSummary["cashRisk"] = "baixo"): FinancialSummary {
  return {
    month: "2026-06",
    estimatedBalance: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    totalInvestido: 0,
    contasVencidas: [],
    contasProximas: [],
    cashRisk,
    cashRiskAnalysis: {
      level: cashRisk === "critico" ? "crítico" as const : cashRisk === "atencao" ? "atenção" as const : "baixo" as const,
      reasons: [],
      nextAction: "",
      severityScore: 0,
    },
    alerts: [],
  };
}

function makeReviewState(status: MonthlyReviewState["status"]): MonthlyReviewState {
  return { month: "2026-06", status, checkedItems: [], updatedAt: "2026-06-05T00:00:00Z" };
}

function withData() {
  vi.mocked(sessionMod.hasMemoriaOperacional).mockReturnValue(true);
  vi.mocked(sessionMod.hasProfile).mockReturnValue(false);
}
function noData() {
  vi.mocked(sessionMod.hasMemoriaOperacional).mockReturnValue(false);
  vi.mocked(sessionMod.hasProfile).mockReturnValue(false);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  noData();
  vi.mocked(healthMod.computeHealthScore).mockReturnValue(makeHealth(80));
  vi.mocked(cmdMod.buildCommandCenter).mockReturnValue(makeCmd());
  vi.mocked(financialMod.getFinancialSummary).mockReturnValue(makeFinancial("baixo"));
  vi.mocked(reviewMod.getMonthlyReviewState).mockReturnValue(makeReviewState("pendente"));
  vi.mocked(reviewMod.getLastCompletedMonthlyReview).mockReturnValue(null);
  vi.mocked(sessionMod.getLastBackupAt).mockReturnValue(null);
});

// 1. Estado incompleto
describe("estado incompleto", () => {
  it("retorna status incompleto sem dados", () => {
    expect(buildCondominioOverview().status).toBe("incompleto");
  });
  it("metrics vazio quando incompleto", () => {
    expect(buildCondominioOverview().metrics).toHaveLength(0);
  });
  it("headline de ativação quando incompleto", () => {
    expect(buildCondominioOverview().headline).toBe("Ative o monitoramento");
  });
  it("revisão mensal pendente sem dados", () => {
    expect(buildCondominioOverview().monthlyReview.status).toBe("pendente");
  });
});

// 2. Estado bom com dados
describe("estado bom", () => {
  beforeEach(withData);
  it("status bom com health 80 e risco estavel", () => {
    expect(buildCondominioOverview().status).toBe("bom");
  });
  it("gera 6 métricas", () => {
    expect(buildCondominioOverview().metrics).toHaveLength(6);
  });
  it("métrica revisao atencao quando pendente", () => {
    const rev = buildCondominioOverview().metrics.find((x) => x.id === "revisao");
    expect(rev?.status).toBe("atencao");
  });
  it("métrica financeiro bom", () => {
    const fin = buildCondominioOverview().metrics.find((x) => x.id === "financeiro");
    expect(fin?.status).toBe("bom");
  });
  it("métrica documentos atencao com faltantes", () => {
    const docs = buildCondominioOverview().metrics.find((x) => x.id === "documentos");
    expect(docs?.status).toBe("atencao");
  });
  it("métrica pendencias bom sem pendências", () => {
    const pend = buildCondominioOverview().metrics.find((x) => x.id === "pendencias");
    expect(pend?.status).toBe("bom");
  });
});

// 3. Status crítico
describe("derivação status critico", () => {
  beforeEach(withData);
  it("critico quando healthPct < 40", () => {
    vi.mocked(healthMod.computeHealthScore).mockReturnValue(makeHealth(35));
    expect(buildCondominioOverview().status).toBe("critico");
  });
  it("critico quando riskLevel critico", () => {
    vi.mocked(cmdMod.buildCommandCenter).mockReturnValue(makeCmd({ riskLevel: "critico" as const }));
    expect(buildCondominioOverview().status).toBe("critico");
  });
  it("critico quando cashRisk critico", () => {
    vi.mocked(financialMod.getFinancialSummary).mockReturnValue(makeFinancial("critico"));
    expect(buildCondominioOverview().status).toBe("critico");
  });
});

// 4. Status atenção
describe("derivação status atencao", () => {
  beforeEach(withData);
  it("atencao quando healthPct < 70", () => {
    vi.mocked(healthMod.computeHealthScore).mockReturnValue(makeHealth(60));
    expect(buildCondominioOverview().status).toBe("atencao");
  });
  it("atencao quando há urgentActions", () => {
    const action: CommandAction = {
      id: "1", titulo: "Renovar AVCB", descricao: "Vencido",
      prioridade: "urgente", categoria: "legal",
      resolveTarget: "condominio", motivo: "Vencido", cta: "Resolver",
      sourceModule: "avcb",
    };
    vi.mocked(cmdMod.buildCommandCenter).mockReturnValue(makeCmd({ urgentActions: [action] }));
    expect(buildCondominioOverview().status).toBe("atencao");
  });
});

// 5. nextAction mapeada
describe("nextAction", () => {
  beforeEach(withData);
  it("nextAction preenchida quando topPriority existe", () => {
    const action: CommandAction = {
      id: "1", titulo: "Renovar AVCB", descricao: "Regularidade",
      prioridade: "urgente", categoria: "legal",
      resolveTarget: "condominio", motivo: "Vencido há 30 dias", cta: "Renovar",
    };
    vi.mocked(cmdMod.buildCommandCenter).mockReturnValue(makeCmd({ topPriority: action }));
    const m = buildCondominioOverview();
    expect(m.nextAction?.title).toBe("Renovar AVCB");
    expect(m.nextAction?.reason).toBe("Vencido há 30 dias");
    expect(m.nextAction?.cta).toBe("Renovar");
    expect(m.nextAction?.tabTarget).toBe("condominio");
  });
  it("nextAction undefined quando topPriority null", () => {
    expect(buildCondominioOverview().nextAction).toBeUndefined();
  });
});

// 6. Warnings
describe("warnings", () => {
  beforeEach(withData);
  it("warnings limitados a 2 urgentActions", () => {
    const makeAction = (id: string, titulo: string): CommandAction => ({
      id, titulo, descricao: "", prioridade: "urgente", categoria: "operacional",
      resolveTarget: "condominio",
    });
    vi.mocked(cmdMod.buildCommandCenter).mockReturnValue(makeCmd({
      urgentActions: [
        makeAction("1", "Renovar AVCB"),
        makeAction("2", "Vistoria elevador"),
        makeAction("3", "Terceira ação"),
      ],
    }));
    const w = buildCondominioOverview().warnings;
    expect(w).toHaveLength(2);
    expect(w[0]).toBe("Renovar AVCB");
  });
});

// 7. Revisão concluída com score
describe("revisao mensal concluida", () => {
  beforeEach(withData);
  it("score e detalhe presentes quando há snapshot concluído", () => {
    vi.mocked(reviewMod.getMonthlyReviewState).mockReturnValue(makeReviewState("concluida"));
    const snap: MonthlyReviewSnapshot = {
      month: "2026-06", score: 88, status: "concluida",
      headline: "OK", criticalCount: 0, warningCount: 1, infoCount: 0,
      checkedCount: 10, totalItems: 12, topItems: [],
      completedAt: "2026-06-05T10:00:00Z",
    };
    vi.mocked(reviewMod.getLastCompletedMonthlyReview).mockReturnValue(snap);
    const m = buildCondominioOverview();
    expect(m.monthlyReview.status).toBe("concluida");
    expect(m.monthlyReview.score).toBe(88);
    expect(m.monthlyReview.detail).toContain("88");
  });
});
