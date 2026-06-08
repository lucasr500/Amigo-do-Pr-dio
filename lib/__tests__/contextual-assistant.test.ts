import { describe, test, expect } from "vitest";
import { buildAssistantContext, enrichResponseWithContext } from "@/lib/contextual-assistant";
import type { CondominioProfile, MemoriaOperacional, Pendencia } from "@/lib/session";
import type { DocumentoEssencial } from "@/lib/session-documentos";

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("contextual assistant — resposta com dados do prédio", () => {
  test("injeta contexto de AVCB quando a pergunta é relevante", () => {
    const memoria: MemoriaOperacional = { vencimentoAVCB: futureDate(20) };
    const ctx = buildAssistantContext(null, memoria, [], []);
    const response = enrichResponseWithContext("Resposta da KB.", "Como renovar AVCB?", ctx);
    expect(response).toContain("Contexto do seu condomínio");
    expect(response).toContain("AVCB");
    expect(response).toContain("Resposta da KB.");
  });

  test("não injeta contexto quando a pergunta é irrelevante", () => {
    const memoria: MemoriaOperacional = { vencimentoAVCB: futureDate(20) };
    const ctx = buildAssistantContext(null, memoria, [], []);
    const response = enrichResponseWithContext("Resposta da KB.", "Como funciona rateio?", ctx);
    expect(response).toBe("Resposta da KB.");
  });

  test("não inventa dado ausente de seguro", () => {
    const ctx = buildAssistantContext(null, {}, [], []);
    const response = enrichResponseWithContext("Resposta da KB.", "Seguro do condomínio", ctx);
    expect(response).toBe("Resposta da KB.");
  });

  test("injeta contexto de mandato com ressalva operacional", () => {
    const memoria: MemoriaOperacional = { fimMandatoSindico: futureDate(50) };
    const ctx = buildAssistantContext({ nomeCondominio: "Edifício Teste" } as CondominioProfile, memoria, [], []);
    const response = enrichResponseWithContext("Resposta da KB.", "mandato do síndico", ctx);
    expect(response).toContain("mandato cadastrado");
    expect(response).toContain("apoio operacional");
    expect(response).toContain("não substitui avaliação jurídica");
  });

  test("injeta contagem de pendências abertas e próximas do prazo", () => {
    const pendencias: Pendencia[] = [
      {
        id: "p1",
        titulo: "A",
        status: "aberta",
        createdAt: "2026-01-01T00:00:00.000Z",
        categoria: "operacional",
        origem: "manual",
        matchedId: null,
        prioridade: "media",
        dueDate: futureDate(2),
      },
      {
        id: "p2",
        titulo: "B",
        status: "aberta",
        createdAt: "2026-01-01T00:00:00.000Z",
        categoria: "operacional",
        origem: "manual",
        matchedId: null,
        prioridade: "media",
      },
    ];
    const ctx = buildAssistantContext(null, {}, pendencias, []);
    const response = enrichResponseWithContext("Resposta da KB.", "Como priorizar pendências?", ctx);
    expect(response).toContain("2 pendências abertas");
    expect(response).toContain("1 vencida ou próxima");
  });

  test("usa dataVencimento para contar documento vencido", () => {
    const documentos: DocumentoEssencial[] = [{
      id: "avcb_clcb",
      status: "tenho",
      dataVencimento: "2020-01-01",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }];
    const ctx = buildAssistantContext(null, {}, [], documentos);
    expect(ctx.documentosVencidos).toBe(1);
  });

  test("linguagem contextual evita afirmação de irregularidade", () => {
    const memoria: MemoriaOperacional = { vencimentoSeguro: "2020-01-01" };
    const ctx = buildAssistantContext(null, memoria, [], []);
    const response = enrichResponseWithContext("Resposta da KB.", "seguro vencido", ctx);
    expect(response.toLowerCase()).not.toContain("está irregular");
    expect(response.toLowerCase()).not.toContain("garante conformidade");
  });
});
