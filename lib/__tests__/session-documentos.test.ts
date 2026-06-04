import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  getDocumentos,
  upsertDocumento,
  saveDocumentos,
  getDocumentosSummary,
  isDocumentoVencido,
  isDocumentoProximoVencimento,
  isDocumentoFaltante,
  suggestedRenewalDate,
  buildPendenciaFromDocumento,
  buildAgendaFromDocumento,
  buildFinancialFromDocumento,
  DOCUMENTO_LABEL,
  DOCUMENTO_CRITICIDADE,
  DOCUMENTOS_ESSENCIAIS_IDS,
  type DocumentoEssencial,
} from "@/lib/session-documentos";

// ─── localStorage stub ────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => { localStorageMock.clear(); });

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeDoc(overrides: Partial<DocumentoEssencial> = {}): DocumentoEssencial {
  return {
    id: "avcb_clcb",
    status: "tenho",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── isDocumentoVencido ───────────────────────────────────────────────────────

describe("isDocumentoVencido", () => {
  test("dataVencimento no passado → vencido", () => {
    const doc = makeDoc({ dataVencimento: "2025-01-01" });
    expect(isDocumentoVencido(doc, "2026-06-04")).toBe(true);
  });

  test("dataVencimento no futuro → não vencido", () => {
    const doc = makeDoc({ dataVencimento: "2027-01-01" });
    expect(isDocumentoVencido(doc, "2026-06-04")).toBe(false);
  });

  test("sem dataVencimento → não vencido", () => {
    const doc = makeDoc({ dataVencimento: undefined });
    expect(isDocumentoVencido(doc, "2026-06-04")).toBe(false);
  });

  test("dataVencimento igual a hoje → não vencido (hoje não é passado)", () => {
    expect(isDocumentoVencido(makeDoc({ dataVencimento: "2026-06-04" }), "2026-06-04")).toBe(false);
  });
});

// ─── isDocumentoProximoVencimento ─────────────────────────────────────────────

describe("isDocumentoProximoVencimento", () => {
  test("vencimento em 30 dias com janela 60 → próximo", () => {
    const doc = makeDoc({ dataVencimento: "2026-07-04" });
    expect(isDocumentoProximoVencimento(doc, 60, "2026-06-04")).toBe(true);
  });

  test("vencimento em 90 dias com janela 60 → não próximo", () => {
    const doc = makeDoc({ dataVencimento: "2026-09-02" });
    expect(isDocumentoProximoVencimento(doc, 60, "2026-06-04")).toBe(false);
  });

  test("já vencido → não é próximo", () => {
    const doc = makeDoc({ dataVencimento: "2025-01-01" });
    expect(isDocumentoProximoVencimento(doc, 60, "2026-06-04")).toBe(false);
  });

  test("sem dataVencimento → false", () => {
    expect(isDocumentoProximoVencimento(makeDoc(), 60, "2026-06-04")).toBe(false);
  });
});

// ─── isDocumentoFaltante ──────────────────────────────────────────────────────

describe("isDocumentoFaltante", () => {
  test("undefined → faltante", () => {
    expect(isDocumentoFaltante(undefined)).toBe(true);
  });

  test("status nao_tenho → faltante", () => {
    expect(isDocumentoFaltante(makeDoc({ status: "nao_tenho" }))).toBe(true);
  });

  test("status precisa_localizar → faltante", () => {
    expect(isDocumentoFaltante(makeDoc({ status: "precisa_localizar" }))).toBe(true);
  });

  test("status tenho → não faltante", () => {
    expect(isDocumentoFaltante(makeDoc({ status: "tenho" }))).toBe(false);
  });

  test("status nao_se_aplica → não faltante", () => {
    expect(isDocumentoFaltante(makeDoc({ status: "nao_se_aplica" }))).toBe(false);
  });
});

// ─── getDocumentosSummary ─────────────────────────────────────────────────────

describe("getDocumentosSummary", () => {
  test("sem dados → retorna estrutura válida com zeros", () => {
    const s = getDocumentosSummary("2026-06-04");
    expect(s.total).toBe(DOCUMENTOS_ESSENCIAIS_IDS.length);
    expect(s.tenho).toBe(0);
    expect(s.faltam).toBe(0);
    expect(s.vencidos).toBe(0);
    expect(s.proximos).toBe(0);
    expect(s.criticos).toBeGreaterThan(0); // há críticos nos IDs
  });

  test("documento crítico ausente → criticosPendentes > 0", () => {
    const s = getDocumentosSummary("2026-06-04");
    expect(s.criticosPendentes).toBeGreaterThan(0);
  });

  test("documento confirmado → contado em tenho", () => {
    upsertDocumento(makeDoc({ id: "avcb_clcb", status: "tenho" }));
    const s = getDocumentosSummary("2026-06-04");
    expect(s.tenho).toBeGreaterThanOrEqual(1);
  });

  test("documento vencido → contado em vencidos", () => {
    upsertDocumento(makeDoc({ id: "avcb_clcb", status: "tenho", dataVencimento: "2020-01-01" }));
    const s = getDocumentosSummary("2026-06-04");
    expect(s.vencidos).toBeGreaterThanOrEqual(1);
  });

  test("documento próximo → contado em proximos", () => {
    upsertDocumento(makeDoc({ id: "apolice_seguro", status: "tenho", dataVencimento: "2026-07-04" }));
    const s = getDocumentosSummary("2026-06-04");
    expect(s.proximos).toBeGreaterThanOrEqual(1);
  });

  test("filtro Faltam — status nao_tenho → contado em faltam", () => {
    upsertDocumento(makeDoc({ id: "convencao", status: "nao_tenho" }));
    const s = getDocumentosSummary("2026-06-04");
    expect(s.faltam).toBeGreaterThanOrEqual(1);
  });
});

// ─── suggestedRenewalDate ─────────────────────────────────────────────────────

describe("suggestedRenewalDate", () => {
  test("critico → 30 dias antes", () => {
    const date = suggestedRenewalDate("avcb_clcb", "2026-08-04", "2026-06-04");
    expect(date).toBe("2026-07-05");
  });

  test("importante → 15 dias antes", () => {
    const date = suggestedRenewalDate("contrato_elevador", "2026-08-04", "2026-06-04");
    expect(date).toBe("2026-07-20");
  });

  test("recomendada → 7 dias antes", () => {
    const date = suggestedRenewalDate("contrato_limpeza", "2026-08-04", "2026-06-04");
    expect(date).toBe("2026-07-28");
  });

  test("data sugerida já passou → fallback é hoje", () => {
    const date = suggestedRenewalDate("avcb_clcb", "2026-01-01", "2026-06-04");
    expect(date).toBe("2026-06-04");
  });
});

// ─── buildPendenciaFromDocumento ──────────────────────────────────────────────

describe("buildPendenciaFromDocumento", () => {
  test("documento crítico ausente → prioridade alta, linkedType documento", () => {
    const payload = buildPendenciaFromDocumento("avcb_clcb", undefined, "2026-06-04");
    expect(payload.linkedType).toBe("documento");
    expect(payload.linkedId).toBe("avcb_clcb");
    expect(payload.prioridade).toBe("alta");
    expect(payload.origem).toBe("documento");
  });

  test("documento crítico vencido → prioridade critica", () => {
    const doc = makeDoc({ id: "avcb_clcb", dataVencimento: "2020-01-01" });
    const payload = buildPendenciaFromDocumento("avcb_clcb", doc, "2026-06-04");
    expect(payload.prioridade).toBe("critica");
  });

  test("documento importante → prioridade media", () => {
    const payload = buildPendenciaFromDocumento("contrato_elevador", undefined, "2026-06-04");
    expect(payload.prioridade).toBe("media");
  });

  test("documento recomendado → prioridade baixa", () => {
    const payload = buildPendenciaFromDocumento("contrato_limpeza", undefined, "2026-06-04");
    expect(payload.prioridade).toBe("baixa");
  });

  test("titulo contém nome do documento", () => {
    const payload = buildPendenciaFromDocumento("avcb_clcb", undefined, "2026-06-04");
    expect(payload.titulo).toContain("AVCB");
  });

  test("vencido → titulo menciona vencido", () => {
    const doc = makeDoc({ id: "avcb_clcb", dataVencimento: "2020-01-01" });
    const payload = buildPendenciaFromDocumento("avcb_clcb", doc, "2026-06-04");
    expect(payload.titulo.toLowerCase()).toContain("vencid");
  });

  test("matchedId === linkedId === docId (anti-duplicata)", () => {
    const payload = buildPendenciaFromDocumento("convencao", undefined, "2026-06-04");
    expect(payload.matchedId).toBe(payload.linkedId);
    expect(payload.linkedId).toBe("convencao");
  });
});

// ─── buildAgendaFromDocumento ─────────────────────────────────────────────────

describe("buildAgendaFromDocumento", () => {
  test("documento crítico → data 30 dias antes e prioridade alta", () => {
    const payload = buildAgendaFromDocumento("avcb_clcb", "2026-09-04", "2026-06-04");
    expect(payload.prioridade).toBe("alta");
    expect(payload.type).toBe("vistoria");
    expect(payload.date).toBe("2026-08-05");
  });

  test("note contém padrão [doc:id] para anti-duplicata", () => {
    const payload = buildAgendaFromDocumento("avcb_clcb", "2026-09-04", "2026-06-04");
    expect(payload.note).toContain("[doc:avcb_clcb]");
  });

  test("title contém nome do documento", () => {
    const payload = buildAgendaFromDocumento("apolice_seguro", "2026-09-04", "2026-06-04");
    expect(payload.title).toContain("Apólice");
  });

  test("data sugerida já passou → fallback é hoje", () => {
    const payload = buildAgendaFromDocumento("avcb_clcb", "2026-01-01", "2026-06-04");
    expect(payload.date).toBe("2026-06-04");
  });
});

// ─── buildFinancialFromDocumento ──────────────────────────────────────────────

describe("buildFinancialFromDocumento", () => {
  test("gera payload conta_a_pagar com valor informado", () => {
    const payload = buildFinancialFromDocumento("apolice_seguro", 5000, "2026-12-01");
    expect(payload.type).toBe("conta_a_pagar");
    expect(payload.amount).toBe(5000);
    expect(payload.dueDate).toBe("2026-12-01");
  });

  test("categoria de segurança → Seguro", () => {
    const payload = buildFinancialFromDocumento("apolice_seguro", 1000);
    expect(payload.category).toBe("Seguro");
  });

  test("categoria de manutenção → Manutenção", () => {
    const payload = buildFinancialFromDocumento("contrato_elevador", 1200);
    expect(payload.category).toBe("Manutenção");
  });

  test("notes contém 'Controle auxiliar'", () => {
    const payload = buildFinancialFromDocumento("avcb_clcb", 3000);
    expect(payload.notes).toContain("Controle auxiliar");
  });

  test("title contém nome do documento", () => {
    const payload = buildFinancialFromDocumento("avcb_clcb", 1500);
    expect(payload.title).toContain("AVCB");
  });
});

// ─── CRUD básico ──────────────────────────────────────────────────────────────

describe("getDocumentos / upsertDocumento", () => {
  test("lista vazia inicialmente", () => {
    expect(getDocumentos()).toHaveLength(0);
  });

  test("upsert persiste e lê de volta", () => {
    upsertDocumento(makeDoc({ id: "convencao", status: "tenho" }));
    const docs = getDocumentos();
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe("convencao");
    expect(docs[0].status).toBe("tenho");
  });

  test("upsert atualiza sem duplicar", () => {
    upsertDocumento(makeDoc({ id: "avcb_clcb", status: "nao_tenho" }));
    upsertDocumento(makeDoc({ id: "avcb_clcb", status: "tenho" }));
    const docs = getDocumentos();
    expect(docs).toHaveLength(1);
    expect(docs[0].status).toBe("tenho");
  });

  test("salvar múltiplos documentos", () => {
    saveDocumentos([
      makeDoc({ id: "avcb_clcb", status: "tenho" }),
      makeDoc({ id: "convencao", status: "precisa_localizar" }),
    ]);
    expect(getDocumentos()).toHaveLength(2);
  });
});

// ─── Constantes exportadas ────────────────────────────────────────────────────

describe("DOCUMENTO_LABEL / DOCUMENTO_CRITICIDADE", () => {
  test("todos os IDs têm label", () => {
    for (const id of DOCUMENTOS_ESSENCIAIS_IDS) {
      expect(DOCUMENTO_LABEL[id]).toBeTruthy();
    }
  });

  test("todos os IDs têm criticidade", () => {
    for (const id of DOCUMENTOS_ESSENCIAIS_IDS) {
      expect(["critica", "importante", "recomendada"]).toContain(DOCUMENTO_CRITICIDADE[id]);
    }
  });

  test("há documentos críticos na lista", () => {
    const criticos = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => DOCUMENTO_CRITICIDADE[id] === "critica");
    expect(criticos.length).toBeGreaterThan(0);
  });
});
