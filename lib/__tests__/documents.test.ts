import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { getUnifiedDocuments, getDocumentsForRole, getUnifiedDocumentsSummary } from "@/lib/documents";
import { saveDocumentos } from "@/lib/session-documentos";
import { addPublicDocument } from "@/lib/community-documents";
import { KEYS } from "@/lib/session-core";

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
afterEach(() => { localStorageMock.clear(); });

describe("documentos unificados (W1.1) — leitura sem perda + papel", () => {
  test("lê os DOIS stores legados sem perda (estado antigo → modelo unificado)", () => {
    // Estado pré-unificação: dados já existentes nos dois stores.
    saveDocumentos([
      { id: "avcb_clcb", status: "tenho", dataVencimento: "2026-12-01", updatedAt: "2026-06-01T00:00:00Z" },
      { id: "convencao", status: "nao_tenho", updatedAt: "2026-06-01T00:00:00Z" },
    ]);
    addPublicDocument({ title: "Ata AGO março", category: "ata", visibility: "moradores", publishedAt: "2026-03-10" });

    const all = getUnifiedDocuments();
    expect(all).toHaveLength(3); // 2 essenciais + 1 público — nada perdido
    const avcb = all.find((d) => d.uid === "ess:avcb_clcb");
    expect(avcb?.source).toBe("essencial");
    expect(avcb?.visibility).toBe("gestao");          // essenciais = conformidade interna
    expect(avcb?.vencimento).toBe("2026-12-01");
    const ata = all.find((d) => d.source === "publico");
    expect(ata?.title).toBe("Ata AGO março");
    expect(ata?.visibility).toBe("moradores");
  });

  test("filtro por papel: morador vê só moradores/público; nunca essenciais (gestao)", () => {
    saveDocumentos([{ id: "avcb_clcb", status: "tenho", updatedAt: "2026-06-01T00:00:00Z" }]);
    addPublicDocument({ title: "Convenção", category: "convencao", visibility: "moradores", publishedAt: "2026-01-01" });
    addPublicDocument({ title: "Contrato restrito", category: "contrato_publico", visibility: "gestao", publishedAt: "2026-01-01" });

    const morador = getDocumentsForRole("resident");
    expect(morador.map((d) => d.title).sort()).toEqual(["Convenção"]); // só o público de moradores
    expect(morador.some((d) => d.visibility === "gestao")).toBe(false); // nunca dado de gestão

    const gestao = getDocumentsForRole("manager");
    expect(gestao).toHaveLength(3); // gestão vê tudo
  });

  test("resumo por papel conta visíveis e fontes", () => {
    saveDocumentos([{ id: "avcb_clcb", status: "tenho", updatedAt: "2026-06-01T00:00:00Z" }]);
    addPublicDocument({ title: "Aviso", category: "aviso", visibility: "publico", publishedAt: "2026-01-01" });
    const r = getUnifiedDocumentsSummary("resident");
    expect(r.total).toBe(2);
    expect(r.visiveis).toBe(1);
    expect(r.porFonte).toEqual({ essencial: 0, publico: 1 });
  });
});
