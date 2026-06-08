import { beforeEach, afterEach, describe, expect, test } from "vitest";
import { searchGlobal, buildDynamicSearchResults } from "@/lib/global-search";

// ── localStorage stub ─────────────────────────────────────────────────────────

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

afterEach(() => localStorageMock.clear());

// ── searchGlobal (estático) ───────────────────────────────────────────────────

describe("searchGlobal — índice estático", () => {
  test("retorna vazio para query em branco", () => {
    expect(searchGlobal("")).toHaveLength(0);
    expect(searchGlobal("  ")).toHaveLength(0);
  });

  test("encontra módulo 'Financeiro' por palavra-chave", () => {
    const r = searchGlobal("financeiro");
    expect(r.some(item => item.id === "financeiro")).toBe(true);
  });

  test("encontra módulo 'AVCB' por palavra-chave", () => {
    const r = searchGlobal("avcb");
    expect(r.some(item => item.id === "doc-avcb")).toBe(true);
  });

  test("encontra 'passagem de mandato' por 'handoff'", () => {
    const r = searchGlobal("passagem mandato");
    expect(r.some(item => item.id === "handoff")).toBe(true);
  });

  test("normaliza acentos — 'decisão' encontra módulo de decisões", () => {
    const r = searchGlobal("decisão");
    expect(r.some(item => item.id === "decisoes")).toBe(true);
  });

  test("respeita maxResults", () => {
    const r = searchGlobal("condominio", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });

  test("retorna resultados ordenados por score (título antes de descrição)", () => {
    const r = searchGlobal("financeiro", 5);
    const finIdx = r.findIndex(item => item.id === "financeiro");
    expect(finIdx).toBe(0); // title match deve ser o primeiro
  });
});

// ── buildDynamicSearchResults ─────────────────────────────────────────────────

describe("buildDynamicSearchResults — pendências", () => {
  beforeEach(() => {
    const pendencias = [
      { id: "p1", titulo: "Renovar AVCB urgente", descricao: "Vence em 5 dias", categoria: "documentos", status: "aberta", dueDate: "2026-06-13", prioridade: "alta", createdAt: "2026-05-20T10:00:00Z" },
      { id: "p2", titulo: "Limpeza da caixa d'água", descricao: "Prazo vencido", categoria: "manutencao", status: "aberta", dueDate: "2026-01-01", prioridade: "alta", createdAt: "2026-05-18T10:00:00Z" },
      { id: "p3", titulo: "Notificação de multa — ap. 71", descricao: "", categoria: "multas", status: "concluida", createdAt: "2026-05-10T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_pendencias", JSON.stringify(pendencias));
  });

  test("encontra pendência por título", () => {
    const r = buildDynamicSearchResults("AVCB");
    expect(r.some(item => item.type === "pendencia" && item.title.includes("AVCB"))).toBe(true);
  });

  test("encontra pendência por categoria", () => {
    const r = buildDynamicSearchResults("manutencao");
    expect(r.some(item => item.type === "pendencia")).toBe(true);
  });

  test("pendência tem tab 'inicio'", () => {
    const r = buildDynamicSearchResults("AVCB");
    const pendencia = r.find(item => item.type === "pendencia");
    expect(pendencia?.tab).toBe("inicio");
  });

  test("normaliza acentos — 'agua' encontra 'caixa d'água'", () => {
    const r = buildDynamicSearchResults("agua");
    expect(r.some(item => item.type === "pendencia")).toBe(true);
  });
});

describe("buildDynamicSearchResults — decisões", () => {
  beforeEach(() => {
    const decisions = [
      {
        id: "d1", title: "Contratar empresa de elevador",
        date: "2026-05-01", category: "manutencao",
        context: "Elevador com falhas frequentes", rationale: "Segurança",
        outcome: "Aprovado", status: "em_execucao",
        createdAt: "2026-05-01T10:00:00Z", updatedAt: "2026-05-01T10:00:00Z",
      },
      {
        id: "d2", title: "Aprovação de obra no térreo",
        date: "2026-04-15", category: "obras",
        context: "", rationale: "", outcome: "Aprovado em assembleia", status: "concluida",
        createdAt: "2026-04-15T10:00:00Z", updatedAt: "2026-04-20T10:00:00Z",
      },
    ];
    localStorageMock.setItem("amigo_decisions", JSON.stringify(decisions));
  });

  test("encontra decisão por título", () => {
    const r = buildDynamicSearchResults("elevador");
    expect(r.some(item => item.type === "decisao")).toBe(true);
  });

  test("decisão navega para memoria-institucional", () => {
    const r = buildDynamicSearchResults("elevador");
    const dec = r.find(item => item.type === "decisao");
    expect(dec?.sectionTarget).toBe("memoria-institucional");
  });

  test("encontra decisão por categoria", () => {
    const r = buildDynamicSearchResults("obras");
    expect(r.some(item => item.type === "decisao")).toBe(true);
  });
});

describe("buildDynamicSearchResults — fornecedores", () => {
  beforeEach(() => {
    const suppliers = [
      { id: "s1", name: "Elevadores Confort", category: "elevador", active: true, serviceHistory: [], createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T10:00:00Z" },
      { id: "s2", name: "Limpeza Total", category: "limpeza", active: true, serviceHistory: [], createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T10:00:00Z" },
      { id: "s3", name: "Empresa Inativa", category: "outro", active: false, serviceHistory: [], createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_suppliers", JSON.stringify(suppliers));
  });

  test("encontra fornecedor por nome", () => {
    const r = buildDynamicSearchResults("Elevadores");
    expect(r.some(item => item.type === "fornecedor" && item.title.includes("Elevadores"))).toBe(true);
  });

  test("não retorna fornecedores inativos", () => {
    const r = buildDynamicSearchResults("Inativa");
    expect(r.some(item => item.type === "fornecedor" && item.title.includes("Inativa"))).toBe(false);
  });

  test("encontra fornecedor por categoria", () => {
    const r = buildDynamicSearchResults("limpeza");
    expect(r.some(item => item.type === "fornecedor")).toBe(true);
  });
});

describe("buildDynamicSearchResults — timeline", () => {
  beforeEach(() => {
    const timeline = [
      { id: "tl1", type: "documento", title: "AVCB renovado", description: "Documento atualizado", visibility: "interna", sourceModule: "documentos", occurredAt: "2026-06-01T10:00:00Z", createdAt: "2026-06-01T10:00:00Z" },
      { id: "tl2", type: "assembleia", title: "AGO realizada com sucesso", description: "", visibility: "moradores", sourceModule: "agenda", occurredAt: "2026-05-15T10:00:00Z", createdAt: "2026-05-15T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_timeline", JSON.stringify(timeline));
  });

  test("encontra evento de timeline por título", () => {
    const r = buildDynamicSearchResults("AVCB");
    expect(r.some(item => item.type === "evento")).toBe(true);
  });

  test("evento navega para central-digital", () => {
    const r = buildDynamicSearchResults("AGO");
    const ev = r.find(item => item.type === "evento");
    expect(ev?.sectionTarget).toBe("central-digital");
  });
});

describe("buildDynamicSearchResults — histórico por unidade", () => {
  beforeEach(() => {
    const unitEvents = [
      { id: "ue1", unit: "302", type: "reclamacao", date: "2026-06-01", title: "Barulho noturno", description: "Reclamação de moradores do andar", status: "aberto", createdAt: "2026-06-01T10:00:00Z" },
      { id: "ue2", unit: "401", type: "multa", date: "2026-05-20", title: "Multa por infração", description: "Multa por uso indevido da garagem", status: "aberto", createdAt: "2026-05-20T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_unit_events", JSON.stringify(unitEvents));
  });

  test("encontra histórico por unidade", () => {
    const r = buildDynamicSearchResults("302");
    expect(r.some(item => item.type === "unidade" && item.title.includes("302"))).toBe(true);
  });

  test("encontra histórico por conteúdo", () => {
    const r = buildDynamicSearchResults("barulho");
    expect(r.some(item => item.type === "unidade")).toBe(true);
  });

  test("unidade navega para memoria-institucional", () => {
    const r = buildDynamicSearchResults("302");
    const ue = r.find(item => item.type === "unidade");
    expect(ue?.sectionTarget).toBe("memoria-institucional");
  });
});

describe("buildDynamicSearchResults — comportamento geral", () => {
  test("retorna vazio para query em branco", () => {
    expect(buildDynamicSearchResults("")).toHaveLength(0);
    expect(buildDynamicSearchResults("  ")).toHaveLength(0);
  });

  test("retorna vazio com localStorage vazio", () => {
    const r = buildDynamicSearchResults("qualquer coisa");
    expect(r).toHaveLength(0);
  });

  test("respeita maxResults", () => {
    const pendencias = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`, titulo: `Pendência de AVCB número ${i}`,
      status: "aberta", categoria: "documentos", createdAt: "2026-06-01T10:00:00Z",
    }));
    localStorageMock.setItem("amigo_pendencias", JSON.stringify(pendencias));
    const r = buildDynamicSearchResults("AVCB", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
