// Índice estático para busca global no produto.
// Determinístico, 100% client-side. Sem IA.
// Resolve "onde está X no produto?" com navegação direta.
// buildDynamicSearchResults complementa com conteúdo real da sessão.

import { getPendencias } from "./session-pendencias";
import { getDecisions, DECISION_STATUS_LABELS } from "./decisions";
import { getSuppliers, SUPPLIER_CATEGORY_LABELS } from "./suppliers";
import { getTimeline } from "./community-timeline";
import { getUnitEvents, UNIT_EVENT_TYPE_LABELS } from "./unit-history";

export type SearchResultType =
  | "modulo"
  | "documento"
  | "comunicado"
  | "checklist"
  | "kb_categoria"
  | "acao"
  | "pendencia"
  | "decisao"
  | "fornecedor"
  | "evento"
  | "unidade";

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: SearchResultType;
  tab: "inicio" | "agenda" | "assistente" | "ferramentas" | "condominio";
  sectionTarget?: string;       // id da seção no CondominioTab
  toolGroup?: "rotina" | "comunicados" | "simuladores" | "checklists" | "temas";
  anchor?: string;              // âncora específica dentro da aba
  action?: "openMonthlyReview" | "openBackup" | "expandMemoria";
  keywords: string[];
};

export const SEARCH_INDEX: SearchResult[] = [
  // ── MÓDULOS PRINCIPAIS ──────────────────────────────────────────────────────
  {
    id: "saude",
    title: "Saúde do Condomínio",
    description: "Índice de saúde operacional, fatores e como melhorar.",
    type: "modulo",
    tab: "inicio",
    keywords: ["saude", "score", "indice", "operacional", "nota", "porcentagem", "health"],
  },
  {
    id: "pendencias",
    title: "Pendências",
    description: "Tarefas abertas, prazos vencidos e histórico de ações.",
    type: "modulo",
    tab: "inicio",
    keywords: ["pendencias", "tarefas", "afazeres", "to do", "prazos", "vencido", "urgente"],
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Calendário de eventos, assembleias e manutenções.",
    type: "modulo",
    tab: "agenda",
    keywords: ["agenda", "calendario", "eventos", "datas", "assembleia", "reuniao", "manutencao"],
  },
  {
    id: "assistente",
    title: "Assistente",
    description: "Orientação jurídica e operacional para síndicos.",
    type: "modulo",
    tab: "assistente",
    keywords: ["assistente", "pergunta", "duvida", "orientacao", "juridico", "resposta", "ajuda"],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Receitas, despesas, inadimplência e reserva de liquidez.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "financeiro",
    keywords: ["financeiro", "dinheiro", "receita", "despesa", "caixa", "inadimplencia", "taxa", "cota", "saldo"],
  },
  {
    id: "documentos",
    title: "Documentos Essenciais",
    description: "AVCB, seguro, convenção, laudos e vencimentos.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "documentos",
    keywords: ["documentos", "avcb", "seguro", "convencao", "laudo", "contrato", "vencimento", "certidao"],
  },
  {
    id: "handoff",
    title: "Passagem de Mandato",
    description: "Organize a transição do síndico sem perder histórico.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "memoria-institucional",
    keywords: ["handoff", "passagem", "mandato", "transicao", "novo sindico", "eleicao", "troca"],
  },
  {
    id: "memoria-institucional",
    title: "Memória Institucional",
    description: "Histórico por unidade, fornecedores, decisões e passagem de mandato.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "memoria-institucional",
    keywords: ["memoria", "institucional", "historico", "fornecedor", "decisao", "unidade", "apartamento"],
  },
  {
    id: "fornecedores",
    title: "Fornecedores",
    description: "Cadastro e histórico de prestadores de serviço.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "memoria-institucional",
    keywords: ["fornecedor", "prestador", "servico", "empresa", "contato", "terceiro"],
  },
  {
    id: "decisoes",
    title: "Decisões de Assembleia",
    description: "Registro de decisões aprovadas em assembleias.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "memoria-institucional",
    keywords: ["decisao", "assembleia", "aprovado", "votacao", "ata", "deliberacao"],
  },
  {
    id: "funcionarios",
    title: "Funcionários",
    description: "Controle de férias, admissão e risco trabalhista.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "operacao",
    keywords: ["funcionario", "empregado", "porteiro", "zelador", "ferias", "admissao", "trabalhista", "clt"],
  },
  {
    id: "revisao-mensal",
    title: "Revisão Mensal",
    description: "Checklist guiado de revisão operacional com score mensal.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "revisao-mensal",
    action: "openMonthlyReview",
    keywords: ["revisao", "mensal", "checklist", "score", "relatorio", "resumo", "mes"],
  },
  {
    id: "calendario-operacional",
    title: "Calendário Operacional",
    description: "Visão de 12 meses: vencimentos, manutenções e eventos.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "documentos",
    keywords: ["calendario", "operacional", "12 meses", "anual", "vencimentos", "manutencoes", "cronograma"],
  },
  {
    id: "backup",
    title: "Backup e Dados",
    description: "Exportar, importar e verificar integridade dos dados.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "dados",
    action: "openBackup",
    keywords: ["backup", "dados", "exportar", "importar", "seguranca", "restaurar", "json"],
  },
  {
    id: "command-center",
    title: "Central de Comando",
    description: "Síntese operacional do dia: prioridades e correlações.",
    type: "modulo",
    tab: "ferramentas",
    toolGroup: "rotina",
    keywords: ["command", "central", "comando", "prioridade", "correlacao", "sintese", "urgente"],
  },
  {
    id: "central-digital",
    title: "Central Digital",
    description: "Mural oficial, solicitações e documentos públicos.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "central-digital",
    keywords: ["central", "digital", "mural", "comunicacao", "moradores", "solicitacao", "enquete"],
  },
  {
    id: "perfil",
    title: "Perfil do Condomínio",
    description: "Dados básicos: nome, elevador, tipo de gestão.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "visao-geral",
    keywords: ["perfil", "condominio", "nome", "elevador", "gestao", "configuracao", "cadastro"],
  },
  {
    id: "memoria-operacional",
    title: "Memória Operacional",
    description: "Datas de vencimentos, manutenções e rotinas do prédio.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "visao-geral",
    action: "expandMemoria",
    keywords: ["memoria", "operacional", "avcb", "seguro", "mandato", "datas", "vencimento", "rotina"],
  },
  {
    id: "notificacoes",
    title: "Notificações",
    description: "Central de alertas e configurações de notificação.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "dados",
    keywords: ["notificacao", "alerta", "aviso", "push", "lembrete"],
  },

  // ── FERRAMENTAS ─────────────────────────────────────────────────────────────
  {
    id: "comunicados",
    title: "Comunicados",
    description: "Templates de comunicados para moradores.",
    type: "modulo",
    tab: "ferramentas",
    toolGroup: "comunicados",
    keywords: ["comunicado", "template", "texto", "mensagem", "aviso", "morador", "notificacao"],
  },
  {
    id: "simulador-multa",
    title: "Simulador de Multa",
    description: "Calcule multa e juros por infração condominial.",
    type: "modulo",
    tab: "ferramentas",
    toolGroup: "simuladores",
    anchor: "simulador-multa",
    keywords: ["simulador", "multa", "juros", "calculo", "infração", "mora"],
  },
  {
    id: "simulador-reajuste",
    title: "Simulador de Reajuste de Cota",
    description: "Estime o novo valor da cota condominial.",
    type: "modulo",
    tab: "ferramentas",
    toolGroup: "simuladores",
    anchor: "simulador-reajuste",
    keywords: ["simulador", "reajuste", "cota", "taxa", "aumento", "valor", "ipca"],
  },
  {
    id: "checklists",
    title: "Checklists Operacionais",
    description: "Conferência guiada para assembleias, obras e manutenção.",
    type: "modulo",
    tab: "ferramentas",
    toolGroup: "checklists",
    keywords: ["checklist", "conferencia", "lista", "assembleia", "obra", "manutencao", "verificacao"],
  },
  {
    id: "registro-rapido",
    title: "Registro de Ocorrência",
    description: "Registre ocorrências e fatos relevantes rapidamente.",
    type: "modulo",
    tab: "ferramentas",
    toolGroup: "rotina",
    keywords: ["registro", "ocorrencia", "fato", "incidente", "anotacao", "rapido"],
  },

  // ── COMUNICADOS TEMPLATES ────────────────────────────────────────────────────
  {
    id: "tmpl-assembleia",
    title: "Comunicado: Convocação de Assembleia",
    description: "Template para convocar assembleia geral ordinária ou extraordinária.",
    type: "comunicado",
    tab: "ferramentas",
    toolGroup: "comunicados",
    keywords: ["assembleia", "convocacao", "ago", "age", "reuniao", "pauta", "convocar"],
  },
  {
    id: "tmpl-obra",
    title: "Comunicado: Aviso de Obra",
    description: "Template para comunicar obras em andamento.",
    type: "comunicado",
    tab: "ferramentas",
    toolGroup: "comunicados",
    keywords: ["obra", "reforma", "construcao", "barulho", "ruido", "aviso"],
  },
  {
    id: "tmpl-infracao",
    title: "Comunicado: Notificação de Infração",
    description: "Template formal para notificar infração às normas condominiais.",
    type: "comunicado",
    tab: "ferramentas",
    toolGroup: "comunicados",
    keywords: ["infracao", "notificacao", "multa", "advertencia", "regra", "norma"],
  },
  {
    id: "tmpl-cobranca",
    title: "Comunicado: Cobrança de Débito",
    description: "Template para cobrar débitos condominiais em aberto.",
    type: "comunicado",
    tab: "ferramentas",
    toolGroup: "comunicados",
    keywords: ["cobranca", "debito", "divida", "inadimplencia", "pagamento", "taxa"],
  },

  // ── DOCUMENTOS ESSENCIAIS ────────────────────────────────────────────────────
  {
    id: "doc-avcb",
    title: "AVCB — Auto de Vistoria do Corpo de Bombeiros",
    description: "Rastrear vencimento e renovação do AVCB.",
    type: "documento",
    tab: "condominio",
    sectionTarget: "documentos",
    keywords: ["avcb", "bombeiros", "incendio", "vistoria", "seguranca", "clcb"],
  },
  {
    id: "doc-seguro",
    title: "Seguro Predial",
    description: "Controlar apólice e vencimento do seguro obrigatório.",
    type: "documento",
    tab: "condominio",
    sectionTarget: "documentos",
    keywords: ["seguro", "apolice", "predial", "incendio", "sinistro", "cobertura"],
  },
  {
    id: "doc-convencao",
    title: "Convenção do Condomínio",
    description: "Regras fundamentais e vigência da convenção.",
    type: "documento",
    tab: "condominio",
    sectionTarget: "documentos",
    keywords: ["convencao", "regras", "normas", "estatuto", "regulamento"],
  },

  // ── MEMÓRIA INSTITUCIONAL — itens adicionais ─────────────────────────────────
  {
    id: "timeline-institucional",
    title: "Timeline Institucional",
    description: "Histórico cronológico de eventos do condomínio.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "central-digital",
    keywords: ["timeline", "historico", "cronologico", "eventos", "institucional", "registro", "auditoria"],
  },
  {
    id: "historico-unidade",
    title: "Histórico por Unidade",
    description: "Ocorrências, multas e registros por apartamento.",
    type: "modulo",
    tab: "condominio",
    sectionTarget: "memoria-institucional",
    keywords: ["unidade", "apartamento", "historico", "ocorrencia", "multa", "advertencia", "morador"],
  },

  // ── KB CATEGORIAS ────────────────────────────────────────────────────────────
  {
    id: "kb-multas",
    title: "Multas condominiais",
    description: "Perguntas sobre aplicação de multas e advertências.",
    type: "kb_categoria",
    tab: "assistente",
    keywords: ["multa", "advertencia", "penalidade", "sancao", "infração", "aplicar"],
  },
  {
    id: "kb-trabalhista",
    title: "Questões trabalhistas",
    description: "Perguntas sobre funcionários, férias, demissão e FGTS.",
    type: "kb_categoria",
    tab: "assistente",
    keywords: ["trabalhista", "funcionario", "ferias", "demissao", "rescisao", "fgts", "clt"],
  },
  {
    id: "kb-obras",
    title: "Obras e reformas",
    description: "Perguntas sobre aprovação e controle de obras.",
    type: "kb_categoria",
    tab: "assistente",
    keywords: ["obra", "reforma", "construcao", "autorizacao", "aprovacao", "barulho"],
  },
  {
    id: "kb-assembleias",
    title: "Assembleias",
    description: "Perguntas sobre convocação, quórum e deliberações.",
    type: "kb_categoria",
    tab: "assistente",
    keywords: ["assembleia", "ago", "age", "quorum", "votacao", "convocacao", "ata"],
  },
  {
    id: "kb-inadimplencia",
    title: "Inadimplência",
    description: "Perguntas sobre cobrança, protesto e juros.",
    type: "kb_categoria",
    tab: "assistente",
    keywords: ["inadimplencia", "devedor", "cobranca", "juros", "multa", "divida", "negativar"],
  },
  {
    id: "kb-areas-comuns",
    title: "Áreas comuns",
    description: "Perguntas sobre uso, restrição e manutenção de áreas comuns.",
    type: "kb_categoria",
    tab: "assistente",
    keywords: ["areas comuns", "salao", "piscina", "garagem", "academia", "playground"],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function searchGlobal(query: string, maxResults = 8): SearchResult[] {
  if (!query.trim()) return [];
  const tokens = normalize(query).split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return [];

  const scored = SEARCH_INDEX.map(item => {
    let score = 0;
    const haystack = normalize(`${item.title} ${item.description} ${item.keywords.join(" ")}`);

    for (const token of tokens) {
      if (item.title.toLowerCase().includes(token)) score += 10;
      else if (haystack.includes(token)) score += 4;
      // Partial match
      else if (haystack.split(" ").some(w => w.startsWith(token))) score += 2;
    }

    return { item, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.item);
}

// ── Busca dinâmica — conteúdo real da sessão ─────────────────────────────────

function scoreFields(tokens: string[], titleField: string, otherFields: string[]): number {
  const titleNorm = normalize(titleField);
  const rest      = normalize(otherFields.join(" "));
  let score = 0;
  for (const token of tokens) {
    if (titleNorm.includes(token))      score += 10;
    else if (rest.includes(token))      score += 4;
    else if ([...titleNorm.split(" "), ...rest.split(" ")].some(w => w.startsWith(token))) score += 2;
  }
  return score;
}

function fmtShort(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export function buildDynamicSearchResults(query: string, maxResults = 5): SearchResult[] {
  if (!query.trim()) return [];
  const tokens = normalize(query).split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return [];

  const scored: Array<{ item: SearchResult; score: number }> = [];

  // Pendências
  try {
    const today = new Date().toISOString().slice(0, 10);
    for (const p of getPendencias()) {
      const score = scoreFields(tokens, p.titulo, [p.categoria ?? "", p.status, p.descricao ?? ""]);
      if (score > 0) {
        const statusLabel = p.status === "concluida" ? "Concluída" : "Aberta";
        const duePart = p.dueDate ? ` · prazo ${fmtShort(p.dueDate)}` : "";
        const vencida = p.status === "aberta" && p.dueDate && p.dueDate < today ? " · vencida" : "";
        scored.push({
          score,
          item: {
            id: `dyn-p-${p.id}`,
            title: p.titulo,
            description: `${statusLabel} · ${p.categoria ?? "geral"}${duePart}${vencida}`,
            type: "pendencia",
            tab: "inicio",
            keywords: [],
          },
        });
      }
    }
  } catch { /* localStorage indisponível */ }

  // Decisões
  try {
    for (const d of getDecisions()) {
      const score = scoreFields(tokens, d.title, [d.category, d.status, d.outcome, d.nextStep ?? "", d.context]);
      if (score > 0) {
        scored.push({
          score,
          item: {
            id: `dyn-d-${d.id}`,
            title: d.title,
            description: `${DECISION_STATUS_LABELS[d.status]} · ${fmtShort(d.date)}`,
            type: "decisao",
            tab: "condominio",
            sectionTarget: "memoria-institucional",
            keywords: [],
          },
        });
      }
    }
  } catch { /* localStorage indisponível */ }

  // Fornecedores
  try {
    for (const s of getSuppliers()) {
      if (!s.active) continue;
      const catLabel = SUPPLIER_CATEGORY_LABELS[s.category] ?? "";
      const score    = scoreFields(tokens, s.name, [catLabel, s.notes ?? "", s.responsible ?? ""]);
      if (score > 0) {
        scored.push({
          score,
          item: {
            id: `dyn-s-${s.id}`,
            title: s.name,
            description: `${catLabel} · ativo`,
            type: "fornecedor",
            tab: "condominio",
            sectionTarget: "memoria-institucional",
            keywords: [],
          },
        });
      }
    }
  } catch { /* localStorage indisponível */ }

  // Timeline
  try {
    for (const ev of getTimeline().slice(0, 150)) {
      const score = scoreFields(tokens, ev.title, [ev.type, ev.description ?? ""]);
      if (score > 0) {
        scored.push({
          score,
          item: {
            id: `dyn-tl-${ev.id}`,
            title: ev.title,
            description: fmtShort(ev.occurredAt.slice(0, 10)),
            type: "evento",
            tab: "condominio",
            sectionTarget: "central-digital",
            keywords: [],
          },
        });
      }
    }
  } catch { /* localStorage indisponível */ }

  // Histórico por unidade
  try {
    for (const ue of getUnitEvents().slice(0, 200)) {
      const typeLabel = UNIT_EVENT_TYPE_LABELS[ue.type] ?? ue.type;
      const score     = scoreFields(tokens, `${ue.unit} ${ue.title}`, [typeLabel, ue.description, ue.unit]);
      if (score > 0) {
        scored.push({
          score,
          item: {
            id: `dyn-ue-${ue.id}`,
            title: `Unidade ${ue.unit}: ${ue.title}`,
            description: `${typeLabel} · ${fmtShort(ue.date)}`,
            type: "unidade",
            tab: "condominio",
            sectionTarget: "memoria-institucional",
            keywords: [],
          },
        });
      }
    }
  } catch { /* localStorage indisponível */ }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(r => r.item);
}
