import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  getMonthlyReviewHistory,
  getMonthlyReviewSnapshot,
  saveMonthlyReviewSnapshot,
  getLastCompletedMonthlyReview,
  getMonthlyReviewTrend,
  restoreMonthlyReviewHistory,
  buildMonthlyReviewSnapshotSummary,
  buildSnapshotFromReport,
  type MonthlyReviewSnapshot,
} from "@/lib/session-monthly-review";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSnapshot(month: string, score: number): MonthlyReviewSnapshot {
  return buildSnapshotFromReport(month, score, `Headline ${month}`, 0, 1, 2, 5, 8, []);
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("getMonthlyReviewHistory — estado vazio", () => {
  test("retorna array vazio se nenhum snapshot salvo", () => {
    expect(getMonthlyReviewHistory()).toEqual([]);
  });

  test("getLastCompletedMonthlyReview retorna null se vazio", () => {
    expect(getLastCompletedMonthlyReview()).toBeNull();
  });

  test("getMonthlyReviewTrend retorna sem_dados se vazio", () => {
    expect(getMonthlyReviewTrend()).toBe("sem_dados");
  });

  test("getMonthlyReviewSnapshot retorna null para mês inexistente", () => {
    expect(getMonthlyReviewSnapshot("2026-01")).toBeNull();
  });
});

describe("saveMonthlyReviewSnapshot — persistência", () => {
  test("salva e recupera um snapshot", () => {
    const snap = makeSnapshot("2026-05", 75);
    saveMonthlyReviewSnapshot(snap);
    const history = getMonthlyReviewHistory();
    expect(history).toHaveLength(1);
    expect(history[0].month).toBe("2026-05");
    expect(history[0].score).toBe(75);
  });

  test("getMonthlyReviewSnapshot recupera pelo mês", () => {
    const snap = makeSnapshot("2026-05", 82);
    saveMonthlyReviewSnapshot(snap);
    const found = getMonthlyReviewSnapshot("2026-05");
    expect(found).not.toBeNull();
    expect(found!.score).toBe(82);
  });

  test("sobrescreve snapshot do mesmo mês", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 60));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 80));
    const history = getMonthlyReviewHistory();
    expect(history).toHaveLength(1);
    expect(history[0].score).toBe(80);
  });

  test("mantém ordenação decrescente por mês (mais recente primeiro)", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-03", 60));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 80));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-04", 70));
    const history = getMonthlyReviewHistory();
    expect(history[0].month).toBe("2026-05");
    expect(history[1].month).toBe("2026-04");
    expect(history[2].month).toBe("2026-03");
  });
});

describe("getLastCompletedMonthlyReview", () => {
  test("retorna o snapshot mais recente", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-03", 55));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 85));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-04", 70));
    const last = getLastCompletedMonthlyReview();
    expect(last).not.toBeNull();
    expect(last!.month).toBe("2026-05");
  });
});

describe("getMonthlyReviewTrend", () => {
  test("retorna sem_dados com apenas 1 snapshot", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 75));
    expect(getMonthlyReviewTrend()).toBe("sem_dados");
  });

  test("retorna melhorando quando score subiu ≥5 pontos", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-04", 60));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 70));
    expect(getMonthlyReviewTrend()).toBe("melhorando");
  });

  test("retorna piorando quando score caiu ≥5 pontos", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-04", 80));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 65));
    expect(getMonthlyReviewTrend()).toBe("piorando");
  });

  test("retorna estavel quando delta < 5 pontos", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-04", 70));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 73));
    expect(getMonthlyReviewTrend()).toBe("estavel");
  });

  test("retorna estavel quando delta exato de -4 pontos", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-04", 75));
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 71));
    expect(getMonthlyReviewTrend()).toBe("estavel");
  });
});

describe("restoreMonthlyReviewHistory — backup v9", () => {
  test("restaura histórico completo", () => {
    const snaps = [
      makeSnapshot("2026-04", 70),
      makeSnapshot("2026-05", 80),
    ];
    restoreMonthlyReviewHistory(snaps);
    const history = getMonthlyReviewHistory();
    expect(history).toHaveLength(2);
  });

  test("restauração não duplica entradas existentes", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-03", 60));
    const snaps = [makeSnapshot("2026-05", 80), makeSnapshot("2026-04", 70)];
    restoreMonthlyReviewHistory(snaps);
    // restoreMonthlyReviewHistory substitui tudo
    expect(getMonthlyReviewHistory()).toHaveLength(2);
  });

  test("restauração com array vazio limpa o histórico", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 75));
    restoreMonthlyReviewHistory([]);
    expect(getMonthlyReviewHistory()).toHaveLength(0);
  });
});

describe("buildMonthlyReviewSnapshotSummary", () => {
  test("retorna string não vazia para mês com snapshot", () => {
    const snap = makeSnapshot("2026-05", 75);
    saveMonthlyReviewSnapshot(snap);
    const summary = buildMonthlyReviewSnapshotSummary("2026-05");
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });

  test("retorna string vazia para mês sem snapshot", () => {
    const summary = buildMonthlyReviewSnapshotSummary("2026-01");
    expect(summary).toBe("");
  });

  test("inclui o score no resumo", () => {
    saveMonthlyReviewSnapshot(makeSnapshot("2026-05", 82));
    const summary = buildMonthlyReviewSnapshotSummary("2026-05");
    expect(summary).toContain("82");
  });
});

describe("buildSnapshotFromReport — campos corretos", () => {
  test("preenche todos os campos obrigatórios", () => {
    const topItems = [{ id: "t1", title: "Teste", section: "financeiro" as const, severity: "critical" as const }];
    const snap = buildSnapshotFromReport("2026-06", 90, "Headline OK", 0, 1, 3, 7, 10, topItems);
    expect(snap.month).toBe("2026-06");
    expect(snap.score).toBe(90);
    expect(snap.status).toBe("concluida");
    expect(snap.criticalCount).toBe(0);
    expect(snap.warningCount).toBe(1);
    expect(snap.infoCount).toBe(3);
    expect(snap.checkedCount).toBe(7);
    expect(snap.totalItems).toBe(10);
    expect(snap.topItems).toHaveLength(1);
    expect(snap.completedAt).toBeTruthy();
  });
});
