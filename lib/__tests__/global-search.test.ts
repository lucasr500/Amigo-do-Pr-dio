import { beforeEach, afterEach, describe, expect, test } from "vitest";
import { searchGlobal, buildDynamicSearchResults, filterSearchResultsForRole } from "@/lib/global-search";

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

  test.each([
    ["central", "central-digital"],
    ["mural", "central-mural"],
    ["comunicado", "central-mural"],
    ["canal", "central-canal-morador"],
    ["solicitacao", "central-canal-morador"],
    ["reserva", "central-reservas"],
    ["churrasqueira", "central-reservas"],
    ["obra", "central-canal-morador"],
    ["enquete", "central-enquetes"],
    ["votacao", "central-enquetes"],
    ["documento", "central-documentos-publicos"],
    ["ata", "central-documentos-publicos"],
    ["regimento", "central-documentos-publicos"],
    ["memoria", "memoria-institucional"],
    ["handoff", "handoff"],
    ["passagem", "handoff"],
    ["decisao", "decisoes"],
    ["fornecedor", "fornecedores"],
    ["financeiro", "financeiro"],
    ["inadimplencia", "financeiro"],
    ["backup", "backup"],
    ["nuvem", "backup"],
    ["AVCB", "doc-avcb"],
    ["seguro", "doc-seguro"],
  ])("encontra termo essencial '%s'", (query, expectedId) => {
    const r = searchGlobal(query, 20);
    expect(r.some(item => item.id === expectedId)).toBe(true);
  });

  test("entradas estáticas da Central Digital apontam para subtabs locais", () => {
    expect(searchGlobal("mural")[0]?.centralSectionTarget).toBe("mural");
    expect(searchGlobal("reserva")[0]?.centralSectionTarget).toBe("reservas");
    expect(searchGlobal("enquete")[0]?.centralSectionTarget).toBe("enquetes");
    expect(searchGlobal("canal morador")[0]?.centralSectionTarget).toBe("canal");
  });

  test("filtro de perfil remove áreas internas da gestão para morador", () => {
    const results = searchGlobal("financeiro backup memoria", 20);
    const residentResults = filterSearchResultsForRole(results, "resident");
    expect(residentResults.some((item) => item.sectionTarget === "financeiro")).toBe(false);
    expect(residentResults.some((item) => item.sectionTarget === "dados")).toBe(false);
    expect(residentResults.some((item) => item.sectionTarget === "memoria-institucional")).toBe(false);
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

describe("buildDynamicSearchResults — posts do mural", () => {
  beforeEach(() => {
    const posts = [
      { id: "post-1", title: "Manutenção da bomba d'água", body: "Haverá manutenção preventiva", category: "manutencao", origin: "oficial", visibility: "moradores", allowComments: false, pinned: true, archived: false, createdAt: "2026-06-05T10:00:00Z", updatedAt: "2026-06-05T10:00:00Z" },
      { id: "post-2", title: "Sugestão de iluminação", body: "Melhorar iluminação do estacionamento", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false, createdAt: "2026-06-06T10:00:00Z", updatedAt: "2026-06-06T10:00:00Z" },
      { id: "post-3", title: "Aviso arquivado", body: "Não deve aparecer", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: true, createdAt: "2026-05-01T10:00:00Z", updatedAt: "2026-05-01T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_posts", JSON.stringify(posts));
  });

  test("encontra post oficial por título", () => {
    const r = buildDynamicSearchResults("bomba");
    expect(r.some(item => item.type === "post" && item.title.includes("bomba"))).toBe(true);
  });

  test("encontra post de morador por título", () => {
    const r = buildDynamicSearchResults("iluminação");
    expect(r.some(item => item.type === "post" && item.title.includes("iluminação"))).toBe(true);
  });

  test("post navega para central-digital", () => {
    const r = buildDynamicSearchResults("bomba");
    const post = r.find(item => item.type === "post");
    expect(post?.sectionTarget).toBe("central-digital");
    expect(post?.centralSectionTarget).toBe("mural");
    expect(post?.tab).toBe("condominio");
  });

  test("não retorna posts arquivados", () => {
    const r = buildDynamicSearchResults("arquivado");
    expect(r.some(item => item.type === "post" && item.title.includes("arquivado"))).toBe(false);
  });
});

describe("buildDynamicSearchResults — enquetes", () => {
  beforeEach(() => {
    const polls = [
      { id: "poll-1", title: "Horário das áreas comuns", description: "Consulta sobre horário ideal", options: [], visibility: "moradores", status: "ativa", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "poll-2", title: "Reforma da piscina", description: "Votação sobre reforma", options: [], visibility: "moradores", status: "encerrada", createdAt: "2026-05-01T10:00:00Z", updatedAt: "2026-05-20T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_polls", JSON.stringify(polls));
  });

  test("encontra enquete por título", () => {
    const r = buildDynamicSearchResults("áreas comuns");
    expect(r.some(item => item.type === "enquete")).toBe(true);
  });

  test("enquete navega para central-digital", () => {
    const r = buildDynamicSearchResults("horário");
    const poll = r.find(item => item.type === "enquete");
    expect(poll?.sectionTarget).toBe("central-digital");
    expect(poll?.centralSectionTarget).toBe("enquetes");
  });
});

describe("buildDynamicSearchResults — documentos públicos", () => {
  beforeEach(() => {
    const docs = [
      { id: "doc-public-1", title: "Regimento Interno", category: "regimento_interno", description: "Uso das áreas comuns", visibility: "moradores", version: "v2", publishedAt: "2026-06-01", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "doc-council-1", title: "Ata do Conselho", category: "ata", description: "Documento restrito", visibility: "conselho", publishedAt: "2026-06-01", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_documents", JSON.stringify(docs));
  });

  test("encontra documento público real e aponta para documentos da Central Digital", () => {
    const r = buildDynamicSearchResults("Regimento");
    const doc = r.find(item => item.type === "documento" && item.title === "Regimento Interno");
    expect(doc?.sectionTarget).toBe("central-digital");
    expect(doc?.centralSectionTarget).toBe("documentos");
  });

  test("filtro de perfil respeita visibilidade de documento público", () => {
    const r = buildDynamicSearchResults("Ata Conselho", 10);
    const managerResults = filterSearchResultsForRole(r, "manager");
    const residentResults = filterSearchResultsForRole(r, "resident");
    expect(managerResults.some((item) => item.title === "Ata do Conselho")).toBe(true);
    expect(residentResults.some((item) => item.title === "Ata do Conselho")).toBe(false);
  });
});

describe("buildDynamicSearchResults — solicitações", () => {
  beforeEach(() => {
    const requests = [
      { id: "req-1", unitNumber: "302", authorName: "Morador 302", type: "barulho", title: "Barulho noturno", description: "Ruído após 22h", status: "em_analise", priority: "alta", createdAt: "2026-06-03T20:00:00Z", updatedAt: "2026-06-04T09:00:00Z" },
      { id: "req-2", unitNumber: "301", authorName: "Morador 301", type: "aviso_obra", title: "Reforma no banheiro", description: "Obra interna", status: "recebido", priority: "normal", createdAt: "2026-06-07T10:00:00Z", updatedAt: "2026-06-07T10:00:00Z" },
      { id: "req-3", unitNumber: "401", authorName: "Morador 401", type: "sugestao", title: "Sugestão de jardim", description: "Plantar flores na entrada", status: "recebido", priority: "normal", createdAt: "2026-06-07T11:00:00Z", updatedAt: "2026-06-07T11:00:00Z" },
      { id: "req-4", unitNumber: "501", authorName: "Morador 501", type: "duvida", title: "Dúvida sobre garagem", description: "Como funciona o controle?", status: "recebido", priority: "normal", createdAt: "2026-06-07T12:00:00Z", updatedAt: "2026-06-07T12:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_requests", JSON.stringify(requests));
  });

  test("encontra solicitação por título", () => {
    const r = buildDynamicSearchResults("barulho");
    expect(r.some(item => item.type === "solicitacao" && item.title.toLowerCase().includes("barulho"))).toBe(true);
  });

  test("encontra aviso de obra por tipo", () => {
    const r = buildDynamicSearchResults("reforma");
    expect(r.some(item => item.type === "obra")).toBe(true);
  });

  test("obra navega para central-digital", () => {
    const r = buildDynamicSearchResults("reforma");
    const obra = r.find(item => item.type === "obra");
    expect(obra?.sectionTarget).toBe("central-digital");
    expect(obra?.centralSectionTarget).toBe("canal");
    expect(obra?.tab).toBe("condominio");
  });

  test("encontra sugestão com type sugestao", () => {
    const r = buildDynamicSearchResults("jardim");
    expect(r.some(item => item.type === "sugestao")).toBe(true);
  });

  test("sugestão navega para central-digital", () => {
    const r = buildDynamicSearchResults("jardim");
    const sug = r.find(item => item.type === "sugestao");
    expect(sug?.sectionTarget).toBe("central-digital");
    expect(sug?.centralSectionTarget).toBe("canal");
  });

  test("dúvida retorna type sugestao", () => {
    const r = buildDynamicSearchResults("garagem");
    expect(r.some(item => item.type === "sugestao")).toBe(true);
  });

  test("solicitação navega para central-digital", () => {
    const r = buildDynamicSearchResults("barulho");
    const req = r.find(item => item.type === "solicitacao");
    expect(req?.sectionTarget).toBe("central-digital");
    expect(req?.centralSectionTarget).toBe("canal");
    expect(req?.tab).toBe("condominio");
  });
});

describe("buildDynamicSearchResults — reservas", () => {
  beforeEach(() => {
    const reservations = [
      { id: "res-1", unit: "201", requesterName: "João", space: "Salão de Festas", date: "2026-06-20", status: "aprovada", createdAt: "2026-06-08T10:00:00Z", updatedAt: "2026-06-08T10:00:00Z" },
      { id: "res-2", unit: "401", requesterName: "Ana", space: "Churrasqueira", date: "2026-06-25", status: "solicitada", createdAt: "2026-06-08T11:00:00Z", updatedAt: "2026-06-08T11:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_reservations", JSON.stringify(reservations));
  });

  test("encontra reserva por espaço", () => {
    const r = buildDynamicSearchResults("Salão de Festas");
    expect(r.some(item => item.type === "reserva" && item.title.includes("Salão"))).toBe(true);
  });

  test("reserva navega para central-digital", () => {
    const r = buildDynamicSearchResults("Churrasqueira");
    const res = r.find(item => item.type === "reserva");
    expect(res?.sectionTarget).toBe("central-digital");
    expect(res?.centralSectionTarget).toBe("reservas");
    expect(res?.tab).toBe("condominio");
  });

  test("encontra reserva por unidade", () => {
    const r = buildDynamicSearchResults("201");
    expect(r.some(item => item.type === "reserva")).toBe(true);
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
