import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  addAssembly, getAssemblies, getAssemblyById,
  addAgendaItem, getAgendaItems, getAgendaItemById, deleteAssembly,
  normalizeAssembly, normalizeAgendaItem,
} from "@/lib/session-assembleias";
import {
  convocarAssembleia, realizarAssembleia, encerrarAssembleia,
  deliberarItem, criarEnquetePorPauta, deliberacaoProgress,
} from "@/lib/assembleias-loop";
import { getDecisions } from "@/lib/decisions";
import { getTimeline } from "@/lib/community-timeline";
import { getPolls } from "@/lib/community-polls";

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

// ─── Normalizadores ──────────────────────────────────────────────────────────

describe("normalizeAssembly", () => {
  test("objeto vazio → defaults seguros", () => {
    const a = normalizeAssembly({});
    expect(a.id).toBeTruthy();
    expect(a.titulo).toBe("Assembleia sem título");
    expect(a.tipo).toBe("ago");
    expect(a.status).toBe("rascunho");
  });
  test("tipo e status inválidos caem nos defaults", () => {
    const a = normalizeAssembly({ tipo: "xpto" as never, status: "zzz" as never });
    expect(a.tipo).toBe("ago");
    expect(a.status).toBe("rascunho");
  });
});

describe("normalizeAgendaItem", () => {
  test("tipo inválido → deliberacao", () => {
    expect(normalizeAgendaItem({ tipo: "nope" as never }).tipo).toBe("deliberacao");
  });
});

// ─── CRUD ──────────────────────────────────────────────────────────────────

describe("CRUD de assembleias e pauta", () => {
  test("add/get assembleia persiste", () => {
    const a = addAssembly({ titulo: "AGO 2026", tipo: "ago", status: "rascunho" });
    expect(getAssemblies()).toHaveLength(1);
    expect(getAssemblyById(a.id)?.titulo).toBe("AGO 2026");
  });

  test("itens de pauta recebem ordem incremental e são lidos por assembleia", () => {
    const a = addAssembly({ titulo: "X", tipo: "ago", status: "rascunho" });
    addAgendaItem({ assemblyId: a.id, titulo: "Item 1", tipo: "deliberacao" });
    addAgendaItem({ assemblyId: a.id, titulo: "Item 2", tipo: "informe" });
    const itens = getAgendaItems(a.id);
    expect(itens.map((i) => i.ordem)).toEqual([0, 1]);
    expect(itens.map((i) => i.titulo)).toEqual(["Item 1", "Item 2"]);
  });

  test("excluir assembleia faz cascata na pauta (espelha ON DELETE CASCADE)", () => {
    const a = addAssembly({ titulo: "X", tipo: "ago", status: "rascunho" });
    addAgendaItem({ assemblyId: a.id, titulo: "Item 1", tipo: "deliberacao" });
    deleteAssembly(a.id);
    expect(getAssemblies()).toHaveLength(0);
    expect(getAgendaItems(a.id)).toHaveLength(0);
  });
});

// ─── Ciclo de vida ────────────────────────────────────────────────────────

describe("ciclo de vida da assembleia", () => {
  test("convocar → realizar → encerrar avança o status e carimba convocação", () => {
    const a = addAssembly({ titulo: "X", tipo: "ago", status: "rascunho" });
    convocarAssembleia(a.id);
    let cur = getAssemblyById(a.id)!;
    expect(cur.status).toBe("convocada");
    expect(cur.convocadaEm).toBeTruthy();

    realizarAssembleia(a.id, 42);
    cur = getAssemblyById(a.id)!;
    expect(cur.status).toBe("realizada");
    expect(cur.quorumAtingido).toBe(42);

    encerrarAssembleia(a.id);
    expect(getAssemblyById(a.id)!.status).toBe("encerrada");
  });

  test("realizar emite evento de timeline assembleia_realizada", () => {
    const a = addAssembly({ titulo: "AGO", tipo: "ago", status: "convocada" });
    realizarAssembleia(a.id);
    const ev = getTimeline().find((e) => e.type === "assembleia_realizada" && e.sourceId === a.id);
    expect(ev).toBeTruthy();
    expect(ev?.visibility).toBe("moradores");
  });
});

// ─── Loop: deliberação → decisão → timeline ─────────────────────────────────

describe("deliberarItem fecha o loop", () => {
  test("gera decisão (categoria assembleia), vincula ao item e emite timeline", () => {
    const a = addAssembly({ titulo: "AGO", tipo: "ago", status: "convocada" });
    const item = addAgendaItem({ assemblyId: a.id, titulo: "Aprovar contas", tipo: "deliberacao" });

    const decisionId = deliberarItem(item.id, { resultado: "Contas aprovadas por maioria" });
    expect(decisionId).toBeTruthy();

    const updated = getAgendaItemById(item.id)!;
    expect(updated.decididoEm).toBeTruthy();
    expect(updated.resultado).toBe("Contas aprovadas por maioria");
    expect(updated.linkedDecisionId).toBe(decisionId);

    const decision = getDecisions().find((d) => d.id === decisionId)!;
    expect(decision.category).toBe("assembleia");
    expect(decision.outcome).toBe("Contas aprovadas por maioria");

    expect(getTimeline().some((e) => e.type === "decisao_registrada" && e.sourceId === decisionId)).toBe(true);
  });

  test("registrarDecisao=false não cria decisão, mas grava resultado", () => {
    const a = addAssembly({ titulo: "AGO", tipo: "ago", status: "convocada" });
    const item = addAgendaItem({ assemblyId: a.id, titulo: "Informe do conselho", tipo: "informe" });
    const before = getDecisions().length;
    const r = deliberarItem(item.id, { resultado: "Comunicado lido", registrarDecisao: false });
    expect(r).toBeNull();
    expect(getDecisions().length).toBe(before);
    expect(getAgendaItemById(item.id)!.resultado).toBe("Comunicado lido");
  });

  test("deliberacaoProgress conta apenas itens deliberáveis", () => {
    const a = addAssembly({ titulo: "AGO", tipo: "ago", status: "convocada" });
    const i1 = addAgendaItem({ assemblyId: a.id, titulo: "Del 1", tipo: "deliberacao" });
    addAgendaItem({ assemblyId: a.id, titulo: "Del 2", tipo: "deliberacao" });
    addAgendaItem({ assemblyId: a.id, titulo: "Informe", tipo: "informe" });
    deliberarItem(i1.id, { resultado: "ok" });
    const p = deliberacaoProgress(a.id);
    expect(p.total).toBe(2);
    expect(p.decididos).toBe(1);
    expect(p.pct).toBe(50);
  });
});

// ─── Enquete por pauta ──────────────────────────────────────────────────────

describe("criarEnquetePorPauta", () => {
  test("cria enquete ativa e vincula o pollId ao item", () => {
    const a = addAssembly({ titulo: "AGE", tipo: "age", status: "convocada" });
    const item = addAgendaItem({ assemblyId: a.id, titulo: "Pintura da fachada", tipo: "deliberacao" });
    const pollId = criarEnquetePorPauta(item.id, { opcoes: ["A favor", "Contra"] });
    expect(pollId).toBeTruthy();
    expect(getAgendaItemById(item.id)!.linkedPollId).toBe(pollId);
    const poll = getPolls().find((p) => p.id === pollId)!;
    expect(poll.status).toBe("ativa");
    expect(poll.options).toHaveLength(2);
  });

  test("menos de 2 opções → null, sem criar enquete", () => {
    const a = addAssembly({ titulo: "AGE", tipo: "age", status: "convocada" });
    const item = addAgendaItem({ assemblyId: a.id, titulo: "X", tipo: "deliberacao" });
    const before = getPolls().length;
    expect(criarEnquetePorPauta(item.id, { opcoes: ["só uma"] })).toBeNull();
    expect(getPolls().length).toBe(before);
  });
});
