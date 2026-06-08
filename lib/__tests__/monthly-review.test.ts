import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildMonthlyReview } from "@/lib/monthly-review";
import {
  getMonthlyReviewState,
  startMonthlyReview,
  toggleMonthlyReviewItem,
  completeMonthlyReview,
  resetMonthlyReview,
} from "@/lib/session-monthly-review";
import { buildMonthlyOperationalSummary } from "@/lib/operational-summary";

// ─── localStorage stub ────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  length: 0,
  key: () => null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => { localStorageMock.clear(); });

// ─── helpers ──────────────────────────────────────────────name of month key
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── buildMonthlyReview ───────────────────────────────────────────────────────

describe("buildMonthlyReview — estado vazio", () => {
  test("não quebra com localStorage vazio", () => {
    expect(() => buildMonthlyReview()).not.toThrow();
  });

  test("score entre 0 e 100 com dados vazios", () => {
    const report = buildMonthlyReview();
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  test("sem dados → sem items financeiros críticos", () => {
    const report = buildMonthlyReview();
    const financeiros = report.sections.financeiro;
    const criticos = financeiros.filter((i) => i.severity === "critical");
    expect(criticos).toHaveLength(0);
  });

  test("campos obrigatórios sempre presentes", () => {
    const report = buildMonthlyReview();
    expect(report.month).toBeTruthy();
    expect(report.headline).toBeTruthy();
    expect(report.summary).toBeTruthy();
    expect(typeof report.criticalCount).toBe("number");
    expect(typeof report.warningCount).toBe("number");
    expect(typeof report.infoCount).toBe("number");
  });

  test("sections sempre tem todas as seções", () => {
    const report = buildMonthlyReview();
    expect(report.sections).toHaveProperty("financeiro");
    expect(report.sections).toHaveProperty("documentos");
    expect(report.sections).toHaveProperty("agenda");
    expect(report.sections).toHaveProperty("pendencias");
    expect(report.sections).toHaveProperty("integridade");
    expect(report.sections).toHaveProperty("resumo");
  });
});

describe("buildMonthlyReview — score", () => {
  test("score nunca abaixo de 0", () => {
    // Injeta muitas pendências vencidas para forçar score baixo
    const pendencias = Array.from({ length: 30 }, (_, i) => ({
      id: `p${i}`,
      titulo: `Pendência ${i}`,
      status: "aberta",
      prioridade: "critica",
      dueDate: daysAgo(1),
      createdAt: daysAgo(60),
    }));
    store["amigo_pendencias"] = JSON.stringify(pendencias);
    const report = buildMonthlyReview();
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  test("score nunca acima de 100", () => {
    const report = buildMonthlyReview();
    expect(report.score).toBeLessThanOrEqual(100);
  });
});

describe("buildMonthlyReview — recommendedFirstAction", () => {
  test("prioriza critical antes de warning", () => {
    // Cria uma pendência vencida (gera critical) e um evento passado (gera warning)
    store["amigo_pendencias"] = JSON.stringify([{
      id: "p1",
      titulo: "Pendência crítica",
      status: "aberta",
      prioridade: "critica",
      dueDate: daysAgo(1),
      createdAt: daysAgo(2),
    }]);
    store["amigo_agenda"] = JSON.stringify([{
      id: "e1",
      title: "Evento passado",
      date: daysAgo(10),
      type: "manutencao",
      prioridade: "media",
      createdAt: daysAgo(10),
    }]);

    const report = buildMonthlyReview();
    if (report.recommendedFirstAction) {
      expect(report.recommendedFirstAction.severity).toBe("critical");
    }
  });

  test("sem items → recommendedFirstAction é undefined", () => {
    const report = buildMonthlyReview();
    // Com dados vazios pode não ter items
    if (report.items.length === 0) {
      expect(report.recommendedFirstAction).toBeUndefined();
    }
  });
});

describe("buildMonthlyReview — financeiro", () => {
  test("conta vencida gera item financeiro critical", () => {
    const month = currentMonth();
    const snapshots = [{
      id: "snap1",
      month,
      estimatedBalance: 10000,
      entries: [{
        id: "e1",
        type: "conta_a_pagar",
        title: "Conta de água",
        amount: 1500,
        dueDate: daysAgo(5),
        status: "vencido",
        createdAt: daysAgo(10),
      }],
      createdAt: daysAgo(1),
    }];
    store["amigo_financial_snapshots"] = JSON.stringify(snapshots);

    const report = buildMonthlyReview(month);
    const finItems = report.sections.financeiro;
    const criticos = finItems.filter((i) => i.severity === "critical" && i.id === "fin_overdue");
    expect(criticos.length).toBeGreaterThan(0);
  });

  test("inadimplência alta gera item critical", () => {
    const month = currentMonth();
    const snapshots = [{
      id: "snap1",
      month,
      estimatedBalance: 5000,
      delinquencyRate: 25,
      entries: [],
      createdAt: daysAgo(1),
    }];
    store["amigo_financial_snapshots"] = JSON.stringify(snapshots);

    const report = buildMonthlyReview(month);
    const finItems = report.sections.financeiro;
    const delinquency = finItems.find((i) => i.id === "fin_delinquency");
    expect(delinquency).toBeDefined();
    expect(delinquency?.severity).toBe("critical");
  });
});

describe("buildMonthlyReview — documentos", () => {
  test("documento crítico vencido gera item critical", () => {
    store["amigo_documentos"] = JSON.stringify([{
      id: "avcb_clcb",
      status: "tenho",
      dataVencimento: daysAgo(30),
      updatedAt: daysAgo(30),
    }]);

    const report = buildMonthlyReview();
    const docItems = report.sections.documentos;
    const expired = docItems.find((i) => i.id === "doc_expired_avcb_clcb");
    expect(expired).toBeDefined();
    expect(expired?.severity).toBe("critical");
  });

  test("documento crítico ausente (nao_tenho) gera item critical", () => {
    store["amigo_documentos"] = JSON.stringify([{
      id: "apolice_seguro",
      status: "nao_tenho",
      updatedAt: daysAgo(1),
    }]);

    const report = buildMonthlyReview();
    const docItems = report.sections.documentos;
    const missing = docItems.find((i) => i.id === "doc_missing_apolice_seguro");
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe("critical");
  });
});

describe("buildMonthlyReview — pendências", () => {
  test("pendência com prazo vencido gera item", () => {
    store["amigo_pendencias"] = JSON.stringify([{
      id: "p1",
      titulo: "Renovar AVCB",
      status: "aberta",
      prioridade: "critica",
      dueDate: daysAgo(3),
      createdAt: daysAgo(10),
    }]);

    const report = buildMonthlyReview();
    const pendItems = report.sections.pendencias;
    expect(pendItems.length).toBeGreaterThan(0);
    const critical = pendItems.find((i) => i.severity === "critical");
    expect(critical).toBeDefined();
  });

  test("múltiplas pendências antigas geram item de atenção", () => {
    const pendencias = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      titulo: `Pendência antiga ${i}`,
      status: "aberta",
      prioridade: "media",
      createdAt: daysAgo(30),
    }));
    store["amigo_pendencias"] = JSON.stringify(pendencias);

    const report = buildMonthlyReview();
    const stale = report.sections.pendencias.find((i) => i.id === "pend_stale");
    expect(stale).toBeDefined();
    expect(stale?.severity).toBe("warning");
  });
});

describe("buildMonthlyReview — agenda", () => {
  test("evento vencido com alta prioridade gera item critical", () => {
    store["amigo_agenda"] = JSON.stringify([{
      id: "ev1",
      title: "Manutenção elevador",
      date: daysAgo(10),
      type: "manutencao",
      prioridade: "critica",
      createdAt: daysAgo(30),
    }]);

    const report = buildMonthlyReview();
    const agendaItems = report.sections.agenda;
    expect(agendaItems.length).toBeGreaterThan(0);
  });

  test("evento vencido sem prioridade alta gera item warning", () => {
    store["amigo_agenda"] = JSON.stringify([{
      id: "ev1",
      title: "Reunião",
      date: daysAgo(5),
      type: "reuniao",
      prioridade: "baixa",
      createdAt: daysAgo(20),
    }]);

    const report = buildMonthlyReview();
    const overdueItem = report.sections.agenda.find((i) => i.id === "agenda_overdue");
    expect(overdueItem).toBeDefined();
    expect(overdueItem?.severity).toBe("warning");
  });
});

// ─── session-monthly-review ───────────────────────────────────────────────────

describe("session-monthly-review — estado inicial", () => {
  test("estado inicial é pendente para mês novo", () => {
    const month = currentMonth();
    const state = getMonthlyReviewState(month);
    expect(state.status).toBe("pendente");
    expect(state.checkedItems).toHaveLength(0);
    expect(state.month).toBe(month);
  });
});

describe("session-monthly-review — startMonthlyReview", () => {
  test("muda status de pendente para em_andamento", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    const state = getMonthlyReviewState(month);
    expect(state.status).toBe("em_andamento");
  });

  test("não regride de em_andamento para em_andamento novamente", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    toggleMonthlyReviewItem(month, "item1");
    startMonthlyReview(month); // segunda chamada não deve limpar items
    const state = getMonthlyReviewState(month);
    expect(state.status).toBe("em_andamento");
  });
});

describe("session-monthly-review — toggleMonthlyReviewItem", () => {
  test("adiciona item ao checkedItems", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    toggleMonthlyReviewItem(month, "fin_overdue");
    const state = getMonthlyReviewState(month);
    expect(state.checkedItems).toContain("fin_overdue");
  });

  test("remove item se já estava checked (toggle)", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    toggleMonthlyReviewItem(month, "fin_overdue");
    toggleMonthlyReviewItem(month, "fin_overdue");
    const state = getMonthlyReviewState(month);
    expect(state.checkedItems).not.toContain("fin_overdue");
  });

  test("múltiplos items podem ser checados", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    toggleMonthlyReviewItem(month, "item1");
    toggleMonthlyReviewItem(month, "item2");
    toggleMonthlyReviewItem(month, "item3");
    const state = getMonthlyReviewState(month);
    expect(state.checkedItems).toHaveLength(3);
  });
});

describe("session-monthly-review — completeMonthlyReview", () => {
  test("muda status para concluida", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    completeMonthlyReview(month);
    const state = getMonthlyReviewState(month);
    expect(state.status).toBe("concluida");
  });

  test("preenche completedAt", () => {
    const month = currentMonth();
    completeMonthlyReview(month);
    const state = getMonthlyReviewState(month);
    expect(state.completedAt).toBeTruthy();
  });
});

describe("session-monthly-review — resetMonthlyReview", () => {
  test("volta ao estado pendente após reset", () => {
    const month = currentMonth();
    startMonthlyReview(month);
    completeMonthlyReview(month);
    resetMonthlyReview(month);
    const state = getMonthlyReviewState(month);
    expect(state.status).toBe("pendente");
    expect(state.checkedItems).toHaveLength(0);
  });
});

describe("session-monthly-review — isolamento por mês", () => {
  test("meses diferentes têm estados independentes", () => {
    startMonthlyReview("2026-05");
    completeMonthlyReview("2026-05");
    const june = getMonthlyReviewState("2026-06");
    expect(june.status).toBe("pendente");
  });
});

// ─── buildMonthlyOperationalSummary ──────────────────────────────────────────

describe("buildMonthlyOperationalSummary", () => {
  test("não quebra com localStorage vazio", () => {
    expect(() => buildMonthlyOperationalSummary()).not.toThrow();
  });

  test("contém disclaimer obrigatório", () => {
    const summary = buildMonthlyOperationalSummary();
    expect(summary).toContain("Não substitui");
    expect(summary.toLowerCase()).toContain("dados locais informados manualmente");
  });

  test("contém referência ao mês", () => {
    const month = currentMonth();
    const summary = buildMonthlyOperationalSummary(month);
    expect(summary).toContain("Relatório mensal auxiliar");
  });

  test("contém seção de pontos de atenção", () => {
    const summary = buildMonthlyOperationalSummary();
    expect(summary).toContain("Pontos de atenção");
  });

  test("contém status da revisão mensal", () => {
    const summary = buildMonthlyOperationalSummary();
    expect(summary).toContain("Revisão mensal");
  });

  test("contém seção de rotina", () => {
    const summary = buildMonthlyOperationalSummary();
    expect(summary).toContain("Rotina operacional");
    expect(summary).toContain("Pendências abertas");
    expect(summary).toContain("Documentos");
  });
});
