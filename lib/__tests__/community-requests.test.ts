import { beforeEach, afterEach, describe, expect, test } from "vitest";
import {
  getRequests,
  saveRequests,
  addRequest,
  updateRequest,
  resolveRequest,
  closeRequest,
  deleteRequest,
  getOpenRequests,
  getRequestsByStatus,
  getRequestSummary,
  buildRequestsWhatsAppText,
} from "@/lib/community-requests";
import type { ResidentRequest } from "@/lib/community-types";

// ── localStorage stub ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => localStorageMock.clear());

// ── getRequests ───────────────────────────────────────────────────────────────

describe("getRequests", () => {
  test("retorna array vazio quando não há dados", () => {
    expect(getRequests()).toEqual([]);
  });

  test("retorna solicitações salvas", () => {
    const req: ResidentRequest = {
      id: "req-1", unitNumber: "302", authorName: "João", type: "barulho",
      title: "Barulho", description: "Barulho alto", status: "recebido",
      priority: "normal", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
    };
    localStorageMock.setItem("amigo_community_requests", JSON.stringify([req]));
    expect(getRequests()).toHaveLength(1);
    expect(getRequests()[0].id).toBe("req-1");
  });
});

// ── saveRequests ──────────────────────────────────────────────────────────────

describe("saveRequests", () => {
  test("persiste array no localStorage", () => {
    const req: ResidentRequest = {
      id: "r1", unitNumber: "101", authorName: "A", type: "manutencao",
      title: "Título", description: "Desc", status: "recebido",
      priority: "normal", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
    };
    saveRequests([req]);
    expect(getRequests()).toHaveLength(1);
  });

  test("sobrescreve dados anteriores", () => {
    const req: ResidentRequest = {
      id: "r2", unitNumber: "201", authorName: "B", type: "barulho",
      title: "B", description: "D", status: "recebido",
      priority: "normal", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z",
    };
    saveRequests([req]);
    saveRequests([]);
    expect(getRequests()).toEqual([]);
  });
});

// ── addRequest ────────────────────────────────────────────────────────────────

describe("addRequest", () => {
  test("cria solicitação com status recebido", () => {
    const req = addRequest({
      unitNumber: "302", authorName: "Carlos", type: "barulho",
      title: "Barulho alto", description: "Ruído após 22h", priority: "alta",
    });
    expect(req.id).toBeTruthy();
    expect(req.status).toBe("recebido");
    expect(req.createdAt).toBeTruthy();
    expect(req.updatedAt).toBeTruthy();
  });

  test("persiste no localStorage", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "manutencao", title: "Lâmpada", description: "Queimada", priority: "normal" });
    expect(getRequests()).toHaveLength(1);
  });

  test("acumula múltiplas solicitações", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "manutencao", title: "T1", description: "D1", priority: "normal" });
    addRequest({ unitNumber: "201", authorName: "B", type: "barulho", title: "T2", description: "D2", priority: "alta" });
    expect(getRequests()).toHaveLength(2);
  });

  test("gera id único por solicitação", () => {
    const r1 = addRequest({ unitNumber: "101", authorName: "A", type: "manutencao", title: "T1", description: "D1", priority: "normal" });
    const r2 = addRequest({ unitNumber: "201", authorName: "B", type: "barulho", title: "T2", description: "D2", priority: "alta" });
    expect(r1.id).not.toBe(r2.id);
  });
});

// ── updateRequest ─────────────────────────────────────────────────────────────

describe("updateRequest", () => {
  test("atualiza campos da solicitação", () => {
    const req = addRequest({ unitNumber: "301", authorName: "Lu", type: "barulho", title: "Barulho", description: "Desc", priority: "normal" });
    updateRequest(req.id, { status: "em_analise" });
    const updated = getRequests().find((r) => r.id === req.id);
    expect(updated?.status).toBe("em_analise");
  });

  test("não afeta outras solicitações", () => {
    const r1 = addRequest({ unitNumber: "101", authorName: "A", type: "manutencao", title: "T1", description: "D1", priority: "normal" });
    const r2 = addRequest({ unitNumber: "201", authorName: "B", type: "barulho", title: "T2", description: "D2", priority: "alta" });
    updateRequest(r1.id, { status: "em_analise" });
    const r2After = getRequests().find((r) => r.id === r2.id);
    expect(r2After?.status).toBe("recebido");
  });
});

// ── resolveRequest ────────────────────────────────────────────────────────────

describe("resolveRequest", () => {
  test("muda status para resolvido com nota", () => {
    const req = addRequest({ unitNumber: "401", authorName: "X", type: "manutencao", title: "Lâmpada", description: "Queimada", priority: "normal" });
    resolveRequest(req.id, "Trocada em 05/06");
    const updated = getRequests().find((r) => r.id === req.id);
    expect(updated?.status).toBe("resolvido");
    expect(updated?.resolutionNote).toBe("Trocada em 05/06");
    expect(updated?.closedAt).toBeTruthy();
  });
});

// ── closeRequest ──────────────────────────────────────────────────────────────

describe("closeRequest", () => {
  test("fecha como recusado", () => {
    const req = addRequest({ unitNumber: "501", authorName: "Y", type: "sugestao", title: "Espelho", description: "No elevador", priority: "baixa" });
    closeRequest(req.id, "recusado");
    const updated = getRequests().find((r) => r.id === req.id);
    expect(updated?.status).toBe("recusado");
    expect(updated?.closedAt).toBeTruthy();
  });

  test("fecha como arquivado", () => {
    const req = addRequest({ unitNumber: "601", authorName: "Z", type: "sugestao", title: "Câmera", description: "Mais câmeras", priority: "normal" });
    closeRequest(req.id, "arquivado");
    const updated = getRequests().find((r) => r.id === req.id);
    expect(updated?.status).toBe("arquivado");
  });
});

// ── deleteRequest ─────────────────────────────────────────────────────────────

describe("deleteRequest", () => {
  test("remove solicitação do array", () => {
    const req = addRequest({ unitNumber: "701", authorName: "W", type: "barulho", title: "T", description: "D", priority: "normal" });
    deleteRequest(req.id);
    expect(getRequests().find((r) => r.id === req.id)).toBeUndefined();
  });
});

// ── getOpenRequests ───────────────────────────────────────────────────────────

describe("getOpenRequests", () => {
  test("exclui status fechados", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "barulho", title: "T1", description: "D1", priority: "normal" });
    const req2 = addRequest({ unitNumber: "201", authorName: "B", type: "manutencao", title: "T2", description: "D2", priority: "normal" });
    resolveRequest(req2.id, "Resolvido");
    const open = getOpenRequests();
    expect(open.every((r) => r.status !== "resolvido" && r.status !== "recusado" && r.status !== "arquivado")).toBe(true);
  });

  test("retorna array vazio quando todas estão fechadas", () => {
    const req = addRequest({ unitNumber: "301", authorName: "C", type: "sugestao", title: "T3", description: "D3", priority: "baixa" });
    resolveRequest(req.id, "OK");
    expect(getOpenRequests()).toHaveLength(0);
  });
});

// ── getRequestsByStatus ───────────────────────────────────────────────────────

describe("getRequestsByStatus", () => {
  test("filtra por status informado", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "barulho", title: "T1", description: "D", priority: "normal" });
    const req = addRequest({ unitNumber: "201", authorName: "B", type: "manutencao", title: "T2", description: "D", priority: "normal" });
    updateRequest(req.id, { status: "em_analise" });
    const result = getRequestsByStatus("em_analise");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(req.id);
  });
});

// ── getRequestSummary ─────────────────────────────────────────────────────────

describe("getRequestSummary", () => {
  test("retorna zeros quando não há solicitações", () => {
    const s = getRequestSummary();
    expect(s.total).toBe(0);
    expect(s.open).toBe(0);
    expect(s.resolved).toBe(0);
    expect(s.urgent).toBe(0);
  });

  test("conta corretamente total, abertas e resolvidas", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "barulho", title: "T1", description: "D", priority: "normal" });
    const req2 = addRequest({ unitNumber: "201", authorName: "B", type: "manutencao", title: "T2", description: "D", priority: "normal" });
    resolveRequest(req2.id, "Feito");
    const s = getRequestSummary();
    expect(s.total).toBe(2);
    expect(s.open).toBe(1);
    expect(s.resolved).toBe(1);
  });

  test("conta urgentes apenas entre abertas", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "barulho", title: "T1", description: "D", priority: "urgente" });
    const req2 = addRequest({ unitNumber: "201", authorName: "B", type: "manutencao", title: "T2", description: "D", priority: "urgente" });
    resolveRequest(req2.id, "OK");
    const s = getRequestSummary();
    expect(s.urgent).toBe(1);
  });
});

// ── buildRequestsWhatsAppText ─────────────────────────────────────────────────

describe("buildRequestsWhatsAppText", () => {
  test("inclui título e protocolo", () => {
    const req = addRequest({ unitNumber: "302", authorName: "João", type: "barulho", title: "Barulho alto", description: "Após 22h", priority: "alta" });
    const text = buildRequestsWhatsAppText(req);
    expect(text).toContain("Barulho alto");
    expect(text).toContain("302");
    expect(text).toContain("Protocolo");
  });

  test("inclui nota de resolução quando presente", () => {
    const req = addRequest({ unitNumber: "101", authorName: "A", type: "manutencao", title: "Lâmpada", description: "Queimada", priority: "normal" });
    resolveRequest(req.id, "Trocada com sucesso");
    const resolved = getRequests().find((r) => r.id === req.id)!;
    const text = buildRequestsWhatsAppText(resolved);
    expect(text).toContain("Trocada com sucesso");
  });
});
