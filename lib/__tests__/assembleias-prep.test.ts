import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { addAssembly, addAgendaItem, updateAgendaItem } from "@/lib/session-assembleias";
import { getPreparationSummary, criarEnquetePorPauta } from "@/lib/assembleias-loop";
import { addAssemblyComment } from "@/lib/assembly-discussion";

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

describe("getPreparationSummary", () => {
  test("assembleia sem pauta → total 0, pct 0", () => {
    const a = addAssembly({ titulo: "AGE", tipo: "age", status: "rascunho" });
    const s = getPreparationSummary(a.id);
    expect(s.total).toBe(0);
    expect(s.pct).toBe(0);
  });

  test("conta contexto, enquete e discussão por item", () => {
    const a = addAssembly({ titulo: "AGE", tipo: "age", status: "convocada" });
    const i1 = addAgendaItem({ assemblyId: a.id, titulo: "Fachada", tipo: "deliberacao" });
    const i2 = addAgendaItem({ assemblyId: a.id, titulo: "Portão", tipo: "deliberacao" });

    // i1 ganha contexto + enquete + 1 comentário publicado
    updateAgendaItem(i1.id, { descricao: "Orçamento de pintura da fachada" });
    criarEnquetePorPauta(i1.id, { opcoes: ["A favor", "Contra"] });
    addAssemblyComment(i1.id, a.id, "Síndico", "manager", "Três orçamentos anexados", true);

    const s = getPreparationSummary(a.id);
    expect(s.total).toBe(2);
    expect(s.comContexto).toBe(1);
    expect(s.comEnquete).toBe(1);
    expect(s.comDiscussao).toBe(1);
    expect(s.pct).toBe(50); // 1 de 2 com contexto

    const prepI1 = s.itens.find((i) => i.itemId === i1.id)!;
    expect(prepI1.hasContexto).toBe(true);
    expect(prepI1.hasEnquete).toBe(true);
    expect(prepI1.pollId).toBeTruthy();
    expect(prepI1.comentariosPublicados).toBe(1);

    const prepI2 = s.itens.find((i) => i.itemId === i2.id)!;
    expect(prepI2.hasContexto).toBe(false);
    expect(prepI2.hasEnquete).toBe(false);
  });

  test("comentário pendente não conta como discussão", () => {
    const a = addAssembly({ titulo: "AGE", tipo: "age", status: "convocada" });
    const i1 = addAgendaItem({ assemblyId: a.id, titulo: "X", tipo: "deliberacao" });
    addAssemblyComment(i1.id, a.id, "Morador", "resident", "pendente de moderação", false);
    expect(getPreparationSummary(a.id).comDiscussao).toBe(0);
  });
});
