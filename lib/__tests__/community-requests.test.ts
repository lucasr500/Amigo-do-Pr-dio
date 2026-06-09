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
  respondToRequest,
  getWorkNotices,
  getSuggestions,
  getRequestsByType,
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

  test("inclui resposta da gestão quando presente", () => {
    const req = addRequest({ unitNumber: "303", authorName: "Pedro", type: "sugestao", title: "Sugestão jardim", description: "Plantar flores", priority: "normal" });
    respondToRequest(req.id, "Avaliaremos na reunião do conselho.");
    const updated = getRequests().find((r) => r.id === req.id)!;
    const text = buildRequestsWhatsAppText(updated);
    expect(text).toContain("Avaliaremos na reunião");
  });

  test("inclui campos de obra quando presentes", () => {
    const req = addRequest({
      unitNumber: "401", authorName: "Marcos", type: "aviso_obra", title: "Reforma banheiro",
      description: "Troca de piso", priority: "normal",
      workStartDate: "2026-06-10", workEndDate: "2026-06-12",
      workTimeWindow: "08h–17h", workResponsible: "Carlos empreiteiro",
    });
    const text = buildRequestsWhatsAppText(req);
    expect(text).toContain("2026-06-10");
    expect(text).toContain("Carlos empreiteiro");
  });
});

// ── respondToRequest ──────────────────────────────────────────────────────────

describe("respondToRequest", () => {
  test("define managementResponse e muda status para respondida", () => {
    const req = addRequest({ unitNumber: "101", authorName: "A", type: "sugestao", title: "T", description: "D", priority: "normal" });
    respondToRequest(req.id, "Resposta da gestão");
    const updated = getRequests().find((r) => r.id === req.id)!;
    expect(updated.managementResponse).toBe("Resposta da gestão");
    expect(updated.status).toBe("respondida");
  });

  test("não altera outros campos", () => {
    const req = addRequest({ unitNumber: "202", authorName: "B", type: "duvida", title: "Dúvida garagem", description: "Como funciona?", priority: "normal" });
    respondToRequest(req.id, "Veja o regulamento.");
    const updated = getRequests().find((r) => r.id === req.id)!;
    expect(updated.title).toBe("Dúvida garagem");
    expect(updated.unitNumber).toBe("202");
  });
});

// ── getWorkNotices ────────────────────────────────────────────────────────────

describe("getWorkNotices", () => {
  test("retorna apenas avisos de obra com status aberto", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "aviso_obra", title: "Obra 1", description: "D", priority: "normal" });
    addRequest({ unitNumber: "201", authorName: "B", type: "manutencao", title: "Manutenção", description: "D", priority: "normal" });
    const obras = getWorkNotices();
    expect(obras.every((r) => r.type === "aviso_obra")).toBe(true);
    expect(obras.length).toBe(1);
  });

  test("não inclui obras resolvidas", () => {
    const req = addRequest({ unitNumber: "301", authorName: "C", type: "aviso_obra", title: "Obra fechada", description: "D", priority: "normal" });
    resolveRequest(req.id, "Concluída");
    expect(getWorkNotices().length).toBe(0);
  });

  test("retorna lista vazia quando não há obras", () => {
    addRequest({ unitNumber: "401", authorName: "D", type: "barulho", title: "Barulho", description: "D", priority: "normal" });
    expect(getWorkNotices()).toEqual([]);
  });
});

// ── getSuggestions ────────────────────────────────────────────────────────────

describe("getSuggestions", () => {
  test("retorna sugestão, dúvida e ocorrência abertas", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "sugestao", title: "S1", description: "D", priority: "normal" });
    addRequest({ unitNumber: "201", authorName: "B", type: "duvida", title: "D1", description: "D", priority: "normal" });
    addRequest({ unitNumber: "301", authorName: "C", type: "ocorrencia", title: "O1", description: "D", priority: "normal" });
    addRequest({ unitNumber: "401", authorName: "D", type: "barulho", title: "B1", description: "D", priority: "normal" });
    const sugs = getSuggestions();
    expect(sugs.length).toBe(3);
    expect(sugs.every((r) => ["sugestao", "duvida", "ocorrencia"].includes(r.type))).toBe(true);
  });

  test("não inclui sugestões resolvidas", () => {
    const req = addRequest({ unitNumber: "101", authorName: "A", type: "sugestao", title: "Resolvida", description: "D", priority: "normal" });
    resolveRequest(req.id, "OK");
    expect(getSuggestions().length).toBe(0);
  });
});

// ── getRequestsByType ─────────────────────────────────────────────────────────

describe("getRequestsByType", () => {
  test("filtra por tipo duvida", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "duvida", title: "Dúvida 1", description: "D", priority: "normal" });
    addRequest({ unitNumber: "201", authorName: "B", type: "sugestao", title: "Sugestão 1", description: "D", priority: "normal" });
    const duvidas = getRequestsByType("duvida");
    expect(duvidas.length).toBe(1);
    expect(duvidas[0].type).toBe("duvida");
  });

  test("filtra por tipo ocorrencia", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "ocorrencia", title: "Ocorrência leve", description: "D", priority: "normal" });
    const ocorrencias = getRequestsByType("ocorrencia");
    expect(ocorrencias.length).toBe(1);
    expect(ocorrencias[0].type).toBe("ocorrencia");
  });

  test("retorna vazio quando tipo não existe", () => {
    addRequest({ unitNumber: "101", authorName: "A", type: "barulho", title: "T", description: "D", priority: "normal" });
    expect(getRequestsByType("duvida")).toEqual([]);
  });
});

// ── aviso_obra com campos de obra ─────────────────────────────────────────────

describe("aviso_obra campos extras", () => {
  test("persiste campos workStartDate, workEndDate, workTimeWindow, workResponsible", () => {
    const req = addRequest({
      unitNumber: "501", authorName: "Fábio", type: "aviso_obra", title: "Reforma cozinha",
      description: "Troca de azulejos", priority: "normal",
      workStartDate: "2026-06-15", workEndDate: "2026-06-20",
      workTimeWindow: "09h–18h", workResponsible: "João pedreiro",
    });
    const saved = getRequests().find((r) => r.id === req.id)!;
    expect(saved.workStartDate).toBe("2026-06-15");
    expect(saved.workEndDate).toBe("2026-06-20");
    expect(saved.workTimeWindow).toBe("09h–18h");
    expect(saved.workResponsible).toBe("João pedreiro");
  });

  test("campos opcionais são undefined quando não fornecidos", () => {
    const req = addRequest({ unitNumber: "601", authorName: "G", type: "aviso_obra", title: "Pintura", description: "Parede", priority: "normal" });
    const saved = getRequests().find((r) => r.id === req.id)!;
    expect(saved.workStartDate).toBeUndefined();
    expect(saved.workResponsible).toBeUndefined();
  });
});

// ── respondida e status intermediário ────────────────────────────────────────

describe("status respondida", () => {
  test("getSuggestions inclui itens com status respondida", () => {
    const req = addRequest({ unitNumber: "101", authorName: "A", type: "sugestao", title: "Sugestão", description: "D", priority: "normal" });
    respondToRequest(req.id, "Vai ser avaliada");
    expect(getSuggestions().length).toBe(1);
  });

  test("getWorkNotices exclui obra arquivada", () => {
    const req = addRequest({ unitNumber: "201", authorName: "B", type: "aviso_obra", title: "Obra", description: "D", priority: "normal" });
    closeRequest(req.id, "arquivado");
    expect(getWorkNotices().length).toBe(0);
  });

  test("getRequestsByType inclui todos os status inclusive respondida", () => {
    const req = addRequest({ unitNumber: "301", authorName: "C", type: "duvida", title: "Dúvida", description: "D", priority: "normal" });
    respondToRequest(req.id, "Resposta");
    expect(getRequestsByType("duvida").length).toBe(1);
    expect(getRequestsByType("duvida")[0].status).toBe("respondida");
  });

  test("respondToRequest em ocorrencia muda status corretamente", () => {
    const req = addRequest({ unitNumber: "401", authorName: "D", type: "ocorrencia", title: "Ocorrência", description: "D", priority: "normal" });
    respondToRequest(req.id, "Ciente, vamos verificar.");
    const updated = getRequests().find((r) => r.id === req.id)!;
    expect(updated.status).toBe("respondida");
    expect(updated.managementResponse).toBe("Ciente, vamos verificar.");
  });
});
