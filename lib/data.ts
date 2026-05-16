import knowledgeData from "./knowledge.json";

const KNOWLEDGE_BASE = (knowledgeData as { base: KnowledgeEntry[] }).base;

export type Topic = {
  id: string;
  title: string;
  icon: string;
  examplePrompt: string;
};

export type KnowledgeEntry = {
  id: string;
  categoria: string;
  pergunta: string;
  resposta: string;
  contexto: string;
  dica?: string;
  keywords: string[];
};

// Nível de confiança exibido ao usuário com base no score de match.
export type ConfidenceLevel = "high" | "medium" | "none";

export type AnswerResult = {
  text: string;
  matched: KnowledgeEntry | null;
  score: number;
  isDefault: boolean;
  // Top-5 entradas mais próximas; populado apenas quando isDefault = true
  suggestions: KnowledgeEntry[];
  // Tokens expandidos usados no match — exposto para logging e diagnóstico
  tokens: string[];
  // true quando a pergunta não continha nenhum termo condominial
  blockedByDomainAnchor: boolean;
  // Categoria inferida pelos anchors mesmo sem match exato na base
  detectedCategory: string | null;
  // Substitui o texto genérico de fallback quando a categoria é conhecida
  contextualFallback: string | null;
};

// ─── Text helpers ─────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 2);
}

// ─── Synonym expansion ────────────────────────────────────────────────────────
// Maps common user terms to canonical terms used in the knowledge base.
// Direction: what the user might say → what the base uses.

const SYNONYMS: Record<string, string[]> = {
  suspender: ["cortar"],
  interromper: ["cortar"],
  bloquear: ["cortar", "proibir"],
  devedor: ["inadimplente", "inadimplencia"],
  reuniao: ["assembleia"],
  reformar: ["obra", "reforma"],
  construir: ["obra"],
  regra: ["convencao", "regimento"],
  multar: ["multa"],
  penalidade: ["multa", "sancao"],
  demissao: ["demitir", "rescisao"],
  dispensar: ["demitir"],
  trabalhador: ["funcionario", "empregado"],
  porteiro: ["funcionario"],
  zelador: ["funcionario"],
  proibir: ["vedar"],
  pagar: ["quitar"],
  votar: ["voto"],
  taxa: ["condominio", "taxa"],
  cachorro: ["animal", "pet"],
  gato: ["animal", "pet"],
  // locação
  aluguel: ["locacao", "locatario"],
  alugar: ["locacao"],
  inquilino: ["locatario", "locacao"],
  locatario: ["locacao", "inquilino"],
  proprietario: ["locador"],
  // assembleias / notificações
  convocar: ["convocacao"],
  notificar: ["notificacao"],
  avisar: ["notificacao"],
  comunicar: ["notificacao"],
  // regimento / convenção
  regulamento: ["regimento", "convencao"],
  estatuto: ["convencao"],
  // cobrança / inadimplência
  cobrar: ["cobranca", "inadimplencia"],
  divida: ["inadimplencia", "inadimplente"],
  atraso: ["inadimplencia", "mora"],
  // funcionários
  seguranca: ["funcionario"],
  faxineira: ["funcionario", "empregado"],
  // responsabilidade / danos
  dano: ["responsabilidade"],
  prejuizo: ["responsabilidade", "dano"],
  estrago: ["responsabilidade", "dano"],
  vazar: ["vazamento", "responsabilidade"],
  vazou: ["vazamento", "responsabilidade"],
  // dados / lgpd
  dados: ["lgpd"],
  privacidade: ["lgpd"],
  // plurais — o anchor gate usa Set.has() exato; plurais precisam de mapeamento explícito
  cameras: ["camera"],
  imagens: ["camera", "lgpd"],
  elevadores: ["elevador"],
  // vocabulário natural do usuário — termos que não passariam no anchor gate sem expansão
  roubo: ["furto"],
  infiltracao: ["vazamento", "responsabilidade"],
  goteira: ["vazamento", "responsabilidade"],
  portao: ["garagem"],
  vizinho: ["responsabilidade", "dano"],
  vigilancia: ["camera"],
  // Fix: "portaria" (o local físico) deve expandir para "porteiro" (a pessoa/função)
  // Sem isso, "o funcionário da portaria" seria bloqueado pelo anchor gate
  portaria: ["porteiro", "funcionario"],
  // segurança contra incêndio
  incendio: ["seguro", "vistoria"],
  avcb: ["vistoria"],
  // controle de pragas
  dedetizar: ["dedetizacao"],
  // cobrança judicial / prescrição
  prescrever: ["prescricao"],
  parcelar: ["parcelamento", "acordo"],
  // registro de documentos
  cartorio: ["registro", "convencao"],
  // mediação extrajudicial
  mediar: ["mediacao"],
  // locação judicial
  despejo: ["locacao", "despejo"],
  fianca: ["garantia", "locacao"],
  retomada: ["locacao"],
  // incorporação imobiliária
  distrato: ["rescisao", "incorporacao"],
  incorporadora: ["incorporacao"],
  // responsabilidade civil — ruína e empreiteiro
  ruina: ["responsabilidade", "dano"],
  empreiteiro: ["obra", "contrato"],
  marquise: ["responsabilidade", "dano"],
  // associação de moradores
  associacao: ["condominio"],
  // Fase 7: novos tópicos operacionais
  balancete: ["financeiro", "prestacao"],
  administradora: ["gestao", "contrato"],
  sinistro: ["seguro", "responsabilidade"],
  extintor: ["seguranca", "incendio"],
  bicicleta: ["areas-comuns", "garagem"],
  pararraios: ["spda", "manutencao"],
  impugnar: ["contestar", "assembleia"],
  loteamento: ["condominio", "juridico"],
  fornecedor: ["contrato", "gestao"],
  reajuste: ["taxa", "financeiro"],
  prestacao: ["gestao", "financeiro"],
  // Fase 8: tópicos operacionais do dia a dia
  encomenda: ["entrega", "gestao"],
  varanda: ["sacada", "fachada", "convencao"],
  sacada: ["varanda", "fachada", "convencao"],
  visitante: ["convidado", "multa"],
  orcamento: ["financeiro", "previsao"],
  virtual: ["portaria", "tecnologia"],
  arquivo: ["documentos", "gestao"],
  // Fase 9: lacunas operacionais do dia a dia
  atestado: ["medico", "doenca", "saude"],
  hidrometro: ["agua", "consumo", "medicao"],
  feriado: ["obra", "horario"],
  // Fase 10: novos temas operacionais
  credenciada: ["empresa", "manutencao"],
  cotacao: ["fornecedor", "contratacao"],
  quorum: ["assembleia", "votacao"],
  periodico: ["exame", "saude"],
  bombeiros: ["avcb", "incendio"],
  comunicado: ["notificacao", "morador"],
  // Fase 11: prevenção e risco operacional
  embargo: ["obra", "interdito", "proibida"],
  penal: ["responsabilidade", "crime"],
  aviso: ["notificacao"],
  previo: ["rescisao", "aviso"],
  reincidente: ["multa", "contumaz"],
  apólice: ["seguro", "cobertura"],
  revisao: ["contrato", "gestao"],
  // Fase 12: temporalidade e recorrência
  recarga: ["extintor", "validade"],
  bacteriologica: ["agua", "analise", "limpeza"],
  dissidio: ["reajuste", "salario", "cct"],
  retencao: ["documento", "prazo", "guardar"],
  regularizacao: ["obra", "alvara", "prazo"],
  antecipacao: ["seguro", "renovacao", "prazo"],
  // Fase 13: perfil operacional contextual
  piscina: ["area-comum", "lazer", "limpeza"],
  manobrista: ["garagem", "carro", "estacionamento"],
  terceirizado: ["empresa", "prestador", "portaria"],
  destituicao: ["afastar", "remover", "sindico"],
  playground: ["parquinho", "crianca", "area-comum"],
  // Fase 30: linguagem real de WhatsApp e consultas cotidianas
  // Multas/convivência
  festa: ["barulho", "ruido", "perturbacao"],
  som: ["barulho", "ruido"],
  advertir: ["advertencia", "multa", "notificacao"],
  infrator: ["multa", "advertencia", "notificacao"],
  // Obras/documentação técnica
  laudo: ["obra", "documentacao", "engenheiro"],
  rrt: ["obra", "documentacao"],
  engenheiro: ["obra", "estrutura"],
  solar: ["obra", "autorizacao"],
  regularizar: ["regularizacao", "obra", "alvara"],
  // Assembleias
  edital: ["convocacao", "assembleia"],
  eleicao: ["assembleia", "votacao", "sindico"],
  destituir: ["destituicao", "sindico", "assembleia"],
  aprovacao: ["votacao", "assembleia", "quorum"],
  previsao: ["financeiro", "orcamento"],
  // Cobrança/inadimplência
  acordo: ["parcelamento", "inadimplencia"],
  negativar: ["negativacao", "inadimplencia"],
  extra: ["taxa"],
  // Funcionários/trabalhista
  escala: ["funcionario", "trabalhista"],
  folga: ["funcionario", "trabalhista"],
  falta: ["funcionario", "trabalhista"],
  horario: ["funcionario", "trabalho", "obra"],
  // LGPD
  filmagem: ["camera", "lgpd"],
  gravacao: ["camera", "lgpd"],
  imobiliaria: ["locacao"],
  // Fase 29: sinônimos ausentes mais impactantes
  venceu: ["vencimento", "prazo"],
  vencida: ["vencimento", "prazo"],
  expirou: ["vencimento", "prazo"],
  paga: ["inadimplente", "inadimplencia", "cobranca"],
  pago: ["quitar", "inadimplencia"],
  deve: ["inadimplente", "inadimplencia"],
  dono: ["proprietario", "locador"],
  trocar: ["substituir", "reforma", "obra"],
  piso: ["reforma", "obra"],
  parede: ["reforma", "obra"],
  teto: ["reforma", "obra"],
  janela: ["reforma", "obra"],
  porta: ["reforma", "obra"],
  domingo: ["horario", "obra"],
  art: ["obra", "documentacao", "regularizacao"],
  foto: ["imagem", "lgpd", "camera"],
  fotos: ["imagem", "camera", "lgpd"],
  whatsapp: ["comunicacao", "lgpd"],
  grupo: ["comunicacao", "lgpd"],
  lista: ["lgpd", "inadimplencia"],
  devedores: ["inadimplente", "lgpd"],
  faço: ["gestao"],
  faltou: ["funcionario", "trabalho"],
  briga: ["multa", "responsabilidade"],
  reclamar: ["notificacao", "multa"],
  votação: ["votacao", "assembleia"],
  garagem: ["garagem", "estacionamento"],
  vaga: ["garagem", "estacionamento"],
  raios: ["spda", "pararraios"],
  cota: ["taxa", "inadimplencia"],
  contribuicao: ["taxa", "rateio"],
  // Fase 32: novos termos para lacunas críticas
  airbnb: ["locacao", "temporada", "hospedagem"],
  temporada: ["locacao", "hospedagem", "curto"],
  hospedagem: ["locacao", "temporada"],
  desempate: ["empate", "votacao", "voto"],
  empatou: ["empate", "votacao"],
  minerva: ["votacao", "sindico", "voto"],
  advertencias: ["advertencia", "multa", "notificacao"],
  documentar: ["documentacao", "registro", "prova"],
  infracao: ["multa", "advertencia", "notificacao"],
  familiar: ["parente", "familia", "conflito"],
  nepotismo: ["conflito", "interesses", "empresa"],
};

function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    // Tokens fracos (preposições, interrogativos, genéricos) não expandem sinônimos.
    // Evita falsos positivos: "para" → "pararraios" → "spda" → passa domain gate erroneamente.
    if (WEAK_KEYWORDS.has(token)) continue;
    const syns = SYNONYMS[token];
    if (syns) syns.forEach((s) => expanded.add(normalize(s)));
    // Stem-based synonym lookup (4 chars)
    const stem = token.slice(0, Math.max(4, token.length - 3));
    for (const [key, syns2] of Object.entries(SYNONYMS)) {
      if (stem.length >= 4 && key !== token && key.startsWith(stem)) {
        syns2.forEach((s) => expanded.add(normalize(s)));
      }
    }
  }
  return Array.from(expanded);
}

// ─── Category detection ───────────────────────────────────────────────────────
// Mapeia cada categoria para palavras discriminadoras usadas para inferir o tema
// provável de uma pergunta mesmo quando não há match exato na base.
// Strings já normalizadas (sem acento, lowercase).

const CATEGORY_ANCHORS: Record<string, string[]> = {
  multas:          ["multa", "advertencia", "infracao", "punicao", "penalidade", "sancao", "contumaz", "reincidente"],
  obras:           ["obra", "reforma", "reparo", "construcao", "art", "nbr", "alvara", "regularizacao", "empreiteiro", "piso", "parede", "infiltracao", "goteira"],
  assembleias:     ["assembleia", "ata", "convocacao", "quorum", "eleicao", "ago", "age", "votacao", "deliberacao", "pauta", "empate", "desempate"],
  inadimplencia:   ["inadimplente", "inadimplencia", "boleto", "cota", "juros", "mora", "atraso", "negativacao", "spc", "serasa", "parcelamento", "prescricao", "protesto", "devedor"],
  cobranca:        ["cobranca", "cobrar", "boleto", "divida", "execucao", "judicial"],
  funcionarios:    ["porteiro", "zelador", "faxineira", "escala", "jornada", "ferias", "rescisao", "adicional", "noturno", "demitir"],
  trabalhista:     ["clt", "inss", "fgts", "dissidio", "gestante", "estabilidade", "afastamento", "demitir", "jornada"],
  convencao:       ["convencao", "regimento", "regulamento", "estatuto"],
  locacao:         ["inquilino", "locatario", "locacao", "aluguel", "proprietario", "locador", "despejo", "fianca", "dono", "airbnb", "temporada", "hospedagem"],
  lgpd:            ["lgpd", "privacidade", "camera", "imagem", "gravacao", "dados", "whatsapp", "grupo", "foto"],
  responsabilidade:["responsabilidade", "dano", "vazamento", "infiltracao", "goteira", "vizinho", "ruina", "marquise", "sinistro"],
  gestao:          ["sindico", "administradora", "balancete", "fornecedor", "contrato", "cotacao", "destituicao"],
  financeiro:      ["taxa", "rateio", "fundo", "reserva", "reajuste", "orcamento", "balancete", "despesa"],
  "areas-comuns":  ["garagem", "vaga", "elevador", "piscina", "academia", "salao", "bicicleta", "playground", "area"],
  manutencao:      ["avcb", "extintor", "spda", "dedetizacao", "vistoria", "limpeza", "manutencao"],
  juridico:        ["juridico", "lei", "codigo", "civil", "prescricao", "judicial", "recurso"],
};

function detectCategory(tokens: string[]): string | null {
  const scores: Record<string, number> = {};
  for (const [category, anchors] of Object.entries(CATEGORY_ANCHORS)) {
    let score = 0;
    for (const token of tokens) {
      const stem = token.slice(0, Math.max(4, token.length - 3));
      for (const anchor of anchors) {
        if (anchor === token || (stem.length >= 4 && anchor.startsWith(stem))) {
          score++;
        }
      }
    }
    if (score > 0) scores[category] = score;
  }
  if (Object.keys(scores).length === 0) return null;
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

// Mensagens de fallback contextual por categoria.
// Tom: "entendi o tema, mas não encontrei a resposta exata" — nunca puro "não sei".
const CONTEXTUAL_FALLBACK_MESSAGES: Record<string, string> = {
  multas:
    "Não encontrei uma orientação exata para esse caso, mas sua dúvida parece envolver multa, advertência ou infração condominial. Veja abaixo orientações próximas.",
  obras:
    "Não encontrei uma resposta exata, mas sua pergunta parece tratar de obra, reforma ou alteração na unidade. Essas situações normalmente exigem atenção à convenção, ao regulamento interno e, em alguns casos, à documentação técnica.",
  assembleias:
    "Não encontrei um encaixe perfeito, mas sua dúvida parece envolver assembleia, quórum, ata ou convocação. Separei orientações próximas que podem ajudar.",
  inadimplencia:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver cobrança, boleto, juros ou inadimplência. Veja os caminhos mais próximos.",
  cobranca:
    "Não encontrei uma orientação exata, mas sua dúvida parece envolver cobrança de condomínio, boleto ou procedimento de execução. Veja temas relacionados.",
  funcionarios:
    "Não encontrei uma orientação exata, mas sua dúvida parece envolver funcionários, porteiro, zelador ou obrigações trabalhistas. Separei temas relacionados.",
  trabalhista:
    "Não encontrei uma orientação exata, mas sua dúvida parece envolver direitos trabalhistas, jornada, rescisão ou contrato de trabalho. Separei orientações próximas.",
  convencao:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver convenção, regulamento interno ou alteração de regra condominial. Veja orientações próximas.",
  locacao:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver inquilino, proprietário, locação ou responsabilidade pela unidade. Veja temas relacionados.",
  lgpd:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver dados pessoais, imagens, câmeras ou privacidade no condomínio. Veja orientações próximas.",
  responsabilidade:
    "Não encontrei uma orientação exata, mas sua dúvida parece envolver dano, vazamento ou responsabilidade civil. Veja orientações próximas.",
  gestao:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver gestão condominial, síndico, administradora ou organização interna. Veja orientações próximas.",
  financeiro:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver finanças do condomínio, taxa, rateio ou fundo de reserva. Veja orientações próximas.",
  "areas-comuns":
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver áreas comuns — garagem, piscina, elevador ou outros espaços coletivos. Veja orientações próximas.",
  manutencao:
    "Não encontrei uma resposta exata, mas sua dúvida parece envolver manutenção, vistoria, AVCB, extintores ou equipamentos do prédio. Veja orientações próximas.",
  juridico:
    "Não encontrei uma resposta exata, mas sua dúvida parece ter natureza jurídica específica. Veja orientações próximas e, se necessário, consulte um especialista.",
};

const FALLBACK_GENERIC =
  "Ainda não encontrei uma resposta suficientemente próxima na base do Amigo do Prédio. Tente reformular com mais contexto — por exemplo: quem está envolvido, o que aconteceu e qual providência o síndico quer tomar.";

function getContextualFallbackMessage(category: string | null): string {
  if (!category) return FALLBACK_GENERIC;
  return CONTEXTUAL_FALLBACK_MESSAGES[category] ?? FALLBACK_GENERIC;
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export const TOPICS: Topic[] = [
  {
    id: "multas",
    title: "Multas e advertências",
    icon: "⚖️",
    examplePrompt: "Posso aplicar multa sem assembleia?",
  },
  {
    id: "obras",
    title: "Obras em unidades",
    icon: "🔨",
    examplePrompt: "Morador precisa avisar antes de fazer obra?",
  },
  {
    id: "assembleias",
    title: "Assembleias",
    icon: "👥",
    examplePrompt: "Como convocar assembleia extraordinária?",
  },
  {
    id: "inadimplencia",
    title: "Inadimplência",
    icon: "💰",
    examplePrompt: "Como cobrar moradores inadimplentes?",
  },
  {
    id: "funcionarios",
    title: "Funcionários",
    icon: "🧹",
    examplePrompt: "Posso contratar zelador como PJ?",
  },
  {
    id: "convencao",
    title: "Convenção e regras",
    icon: "📜",
    examplePrompt: "Como mudar uma regra da convenção?",
  },
  {
    id: "locacao",
    title: "Locação e inquilinos",
    icon: "🏠",
    examplePrompt: "Inquilino pode votar em assembleia?",
  },
  {
    id: "lgpd",
    title: "Proteção de dados",
    icon: "🔒",
    examplePrompt: "O condomínio pode publicar lista de devedores?",
  },
  {
    id: "responsabilidade",
    title: "Danos e responsabilidade",
    icon: "🛡️",
    examplePrompt: "Vazamento do apartamento de cima: quem paga?",
  },
  {
    id: "trabalhista",
    title: "Direitos trabalhistas",
    icon: "📋",
    examplePrompt: "Qual a jornada correta do porteiro?",
  },
  {
    id: "gestao",
    title: "Gestão do condomínio",
    icon: "🏛️",
    examplePrompt: "Quais são os deveres do síndico?",
  },
  {
    id: "financeiro",
    title: "Finanças e rateio",
    icon: "💼",
    examplePrompt: "Como calcular o rateio das despesas?",
  },
];

// ─── Confidence label ─────────────────────────────────────────────────────────
// Converte score numérico em sinalização visual de confiança para o usuário.
//   score >= 20 → match exato ou múltiplos tokens fortes → "Resposta confiável"
//   score  8-19 → match por keywords próximas → "Pode variar conforme o caso"
//   isDefault   → fora da base → "Base ainda não cobre esse tema"

export function getConfidenceLabel(
  score: number,
  isDefault: boolean
): { label: string; level: ConfidenceLevel } {
  if (isDefault) return { label: "Base ainda não cobre esse tema", level: "none" };
  if (score >= 20) return { label: "Resposta confiável", level: "high" };
  return { label: "Pode variar conforme o caso", level: "medium" };
}

// ─── Query logging ─────────────────────────────────────────────────────────────
// Salva perguntas no localStorage para análise futura de uso real.
// Estrutura preparada para eventual envio a backend (substituir safeWrite por fetch).

type QueryLog = {
  ts: string;
  q: string;
  tokens: string[];
  matchedId: string | null;
  score: number;
  isDefault: boolean;
  blockedByDomainAnchor: boolean;
  // Categoria da entrada matched — facilita análise de cobertura por domínio
  categoria: string | null;
};

export function logQuery(question: string, result: AnswerResult): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("amigo_queries");
    const logs: QueryLog[] = raw ? (JSON.parse(raw) as QueryLog[]) : [];
    logs.push({
      ts: new Date().toISOString(),
      q: question,
      tokens: result.tokens,
      matchedId: result.matched?.id ?? null,
      score: result.score,
      isDefault: result.isDefault,
      blockedByDomainAnchor: result.blockedByDomainAnchor,
      categoria: result.matched?.categoria ?? null,
    });
    // Mantém as 200 perguntas mais recentes
    if (logs.length > 200) logs.splice(0, logs.length - 200);
    localStorage.setItem("amigo_queries", JSON.stringify(logs));
  } catch {
    // localStorage indisponível (modo privado, storage cheio)
  }
}

// ─── Answer matching ───────────────────────────────────────────────────────────
//
// Pipeline de precisão em 4 camadas:
//   1. DOMAIN_ANCHOR_WORDS  — guarda de domínio: sem âncora condominial → fallback imediato
//   2. WEAK_KEYWORDS        — reduz peso de termos genéricos (aparecem em 5+ entradas)
//   3. hasNonWeakMatch      — exige ao menos 1 token específico para aceitar a entrada
//   4. SCORE_THRESHOLD      — limiar mínimo de pontuação para retornar resposta
//
// Pesos de match (token não-fraco / fraco):
//   perguntaHay  → +5 / +2
//   keywordsHay  → +4 / +1
//   supportHay   → +1 / +0   (texto completo da resposta: peso mínimo, só tokens específicos)

// Limiar mínimo para retornar resposta direta.
const SCORE_THRESHOLD = 8;
// Pontuação mínima para considerar o match "claro" — abaixo disso exige gap de confiança.
const MIN_CLEAR_WIN_SCORE = 14;
// Gap mínimo entre 1º e 2º candidato quando score < MIN_CLEAR_WIN_SCORE.
// Previne falso positivo: se dois candidatos pontuam de forma similar, melhor oferecer
// fallback contextual honesto do que arriscar resposta errada.
const MIN_CONFIDENCE_GAP = 4;

// Termos que confirmam que a pergunta é sobre gestão condominial.
// Se nenhum aparecer nos tokens expandidos, a pergunta está fora do domínio → fallback.
// Checado APÓS expansão de sinônimos para cobrir "devedor" → "inadimplente", etc.
const DOMAIN_ANCHOR_WORDS = new Set([
  // financeiro
  "multa", "taxa", "condominio", "inadimplente", "inadimplencia",
  "cobranca", "fundo", "reserva", "rateio", "boleto", "juros", "mora",
  // obras
  "obra", "reforma", "construcao", "estrutura",
  // assembleias
  "assembleia", "convocacao", "quorum", "votacao", "voto", "ata",
  // funcionários
  "zelador", "porteiro", "funcionario", "empregado", "clt", "ferias",
  "rescisao", "adicional", "noturno", "teletrabalho", "terceirizacao",
  // convenção / gestão
  "convencao", "regimento", "sindico",
  // outros temas cobertos
  "garagem", "seguro", "animal", "pet",
  "barulho", "ruido", "negativacao", "spc", "serasa",
  "predio", "edificio",
  // novos temas
  "locacao", "locatario", "locador", "inquilino", "aluguel",
  "lgpd", "dados", "privacidade",
  "responsabilidade", "dano", "vazamento",
  "cobranca", "juridico",
  // áreas comuns e infraestrutura
  "elevador", "camera", "piscina", "academia", "salao",
  "furto", "manutencao", "vistoria",
  // novos temas Fase 5: segurança, saúde e aspectos jurídicos
  "incendio", "avcb", "dedetizacao", "prescricao", "protesto", "cnpj",
  "parcelamento", "mediacao",
  // Fase 6: locação, incorporação, responsabilidade e associação
  "despejo", "fianca", "retomada", "distrato", "incorporacao",
  "associacao", "ruina", "empreiteiro", "marquise",
  // Fase 7: novos tópicos operacionais
  "balancete", "administradora", "sinistro", "extintor",
  "bicicleta", "spda", "pararraios", "loteamento", "fornecedor", "reajuste",
  // Fase 8: tópicos do dia a dia
  "encomenda", "varanda", "sacada", "visitante", "orcamento",
  // Fase 9: novos tópicos operacionais
  "atestado", "hidrometro",
  // Fase 10: novos tópicos de descoberta
  "quorum", "cotacao", "periodico",
  // Fase 11: prevenção e risco
  "embargo", "reincidente", "apólice",
  // Fase 12: temporalidade e recorrência
  "recarga", "dissidio", "retencao", "regularizacao",
  // Fase 13: perfil operacional contextual
  "piscina", "manobrista", "terceirizado", "destituicao", "playground",
  // Fase 30: cobertura de linguagem real
  "advertencia", "infrator", "laudo", "gravacao", "filmagem",
  "escala", "edital", "eleicao", "protesto", "acordo",
  "cota", "morador", "condominial",
  // Fase 32: novos termos para lacunas críticas
  "airbnb", "temporada", "hospedagem", "desempate", "empate",
  "infracao", "documentar", "registrar",
]);

// Termos que aparecem em 5+ entradas e têm baixo poder discriminatório.
// Não contribuem para o match de keywords; pontuam menos no match de pergunta.
// Inclui também preposições/auxiliares curtos que geram ruído de substring (ex: "com" → "combo").
const WEAK_KEYWORDS = new Set([
  // interrogativos e auxiliares — não indicam tema
  "como", "qual", "quais", "quando", "onde", "quem",
  "posso", "pode", "deve", "devo", "preciso", "tenho", "quero",
  // preposições/conjunções curtas — criam substring noise em palavras longas
  "por", "com", "que", "nao", "sim",
  // preposições adicionais — "para" → "pararraios" causava falso positivo em consultas fora de escopo
  "para", "sem", "mas", "dos", "das", "nos", "nas",
  // termos do domínio presentes em 5+ entradas — pouco discriminatórios
  "condominio", "assembleia", "sindico",
  "pagamento", "notificacao", "aprovacao",
  "funcionario", "hora", "tempo",
  // verbos genéricos condominiais
  "aplicar", "fazer", "mudar", "alterar",
]);

// Palavras de intenção forte: bônus de +6 quando presentes na pergunta E na entrada.
// Indicam tema específico e reduzem ambiguidade entre entradas similares.
const STRONG_INTENT_WORDS = [
  "inss", "demitir", "afastamento", "justa", "rescisao",
  "ferias", "adicional", "noturno", "gestante", "estabilidade",
  "agua", "cortar", "inadimplente", "negativacao", "destituicao",
  "convocacao", "quorum", "teletrabalho", "pejotizacao",
  "furto", "vazamento",
  // Fase 5: termos de alta especificidade para novos domínios
  "prescricao", "avcb", "cnpj", "dedetizacao", "protesto",
  // Fase 6
  "distrato", "incorporacao", "ruina", "despejo", "unanimidade",
  // Fase 7
  "spda", "extintor", "loteamento", "balancete",
  // Fase 8
  "orcamento", "visitante",
  // Fase 9
  "atestado", "hidrometro",
  // Fase 10
  "quorum", "cotacao",
  // Fase 11
  "embargo", "reincidente",
  // Fase 12
  "dissidio", "retencao", "recarga",
  // Fase 13
  "piscina", "manobrista", "destituicao", "playground",
  // Fase 30: termos altamente discriminatórios adicionados
  "camera", "barulho", "vazamento", "procuracao", "gravacao",
  "inadimplencia", "rescisao",
  // Fase 32
  "desempate", "airbnb", "nepotismo",
];

// Texto exibido quando nenhuma resposta é encontrada.
// Curto por design — o restante das informações é exibido via UI (chips + sugestões).
export const DEFAULT_ANSWER =
  "Ainda não tenho orientações sobre esse tema específico. Tente reformular a pergunta ou explore os temas abaixo.";

// Retorna entradas da mesma categoria para sugestões de aprofundamento.
// ─── Audit helpers (dev/admin only) ──────────────────────────────────────────

export type AuditExpectedType = "A" | "B" | "C";

export type AuditResult = {
  question: string;
  expectedType: AuditExpectedType;
  expectedCategory?: string;
  actualType: "A" | "B" | "C";
  actualCategory: string | null;
  score: number;
  matchedId: string | null;
  blockedByDomainAnchor: boolean;
  status: "pass" | "review" | "fail";
  note: string;
};

export function auditQuestion(
  question: string,
  expectedType: AuditExpectedType,
  expectedCategory?: string
): AuditResult {
  const result = findAnswer(question);
  const actualType: "A" | "B" | "C" = result.isDefault
    ? result.blockedByDomainAnchor ? "C" : "B"
    : "A";

  let status: "pass" | "review" | "fail";
  let note = "";

  if (actualType === expectedType) {
    if (expectedType === "B" && expectedCategory && result.detectedCategory !== expectedCategory) {
      status = "review";
      note = `Categoria detectada '${result.detectedCategory}' difere do esperado '${expectedCategory}'`;
    } else {
      status = "pass";
      note = expectedType === "A" && result.score < 12 ? `Score baixo (${result.score})` : "";
    }
  } else if (expectedType === "A" && actualType === "B") {
    status = "review";
    note = `Esperava resposta direta, caiu em fallback contextual (score ${result.score})`;
  } else if (expectedType === "A" && actualType === "C") {
    status = "fail";
    note = "Bloqueado por domain gate — deveria ter respondido";
  } else if (expectedType === "B" && actualType === "A") {
    status = "review";
    note = `Respondeu diretamente quando era esperado fallback (score ${result.score}, id: ${result.matched?.id ?? "?"})`;
  } else if (expectedType === "C" && actualType !== "C") {
    status = "fail";
    note = `Deveria ter sido bloqueado. Retornou tipo ${actualType}`;
  } else {
    status = "pass";
    note = "";
  }

  return {
    question,
    expectedType,
    expectedCategory,
    actualType,
    actualCategory: result.detectedCategory,
    score: result.score,
    matchedId: result.matched?.id ?? null,
    blockedByDomainAnchor: result.blockedByDomainAnchor,
    status,
    note,
  };
}

export function getRelatedEntries(
  categoria: string,
  excludeId: string,
  limit = 2
): KnowledgeEntry[] {
  return KNOWLEDGE_BASE
    .filter((e) => e.categoria === categoria && e.id !== excludeId)
    .slice(0, limit);
}

// Retorna sugestões padrão quando não há candidatos com score.
// Quando a categoria é conhecida, prioriza entradas dessa categoria.
function getDefaultSuggestions(detectedCategory: string | null = null): KnowledgeEntry[] {
  if (detectedCategory) {
    const catEntries = KNOWLEDGE_BASE
      .filter((e) => e.categoria === detectedCategory)
      .slice(0, 3);
    if (catEntries.length >= 2) return catEntries;
  }
  const order = [
    "multas", "inadimplencia", "assembleias",
    "funcionarios", "obras", "convencao",
    "locacao", "lgpd", "responsabilidade",
  ];
  const picked: KnowledgeEntry[] = [];
  for (const cat of order) {
    if (picked.length >= 3) break;
    const entry = KNOWLEDGE_BASE.find((e) => e.categoria === cat);
    if (entry) picked.push(entry);
  }
  return picked;
}

export function findAnswer(question: string): AnswerResult {
  const normQ = normalize(question);
  const baseTokens = tokenize(normQ);

  if (baseTokens.length === 0) {
    return {
      text: DEFAULT_ANSWER,
      matched: null,
      score: 0,
      isDefault: true,
      suggestions: getDefaultSuggestions(null),
      tokens: [],
      blockedByDomainAnchor: false,
      detectedCategory: null,
      contextualFallback: FALLBACK_GENERIC,
    };
  }

  // Expansão de sinônimos antes da checagem de âncora — cobre "devedor" → "inadimplente"
  const tokens = expandWithSynonyms(baseTokens);

  // Camada 1 — guarda de domínio: nenhum termo condominial → fora do escopo → fallback imediato
  const hasDomainAnchor = tokens.some((t) => DOMAIN_ANCHOR_WORDS.has(t));
  if (!hasDomainAnchor) {
    return {
      text: DEFAULT_ANSWER,
      matched: null,
      score: 0,
      isDefault: true,
      suggestions: getDefaultSuggestions(null),
      tokens,
      blockedByDomainAnchor: true,
      detectedCategory: null,
      contextualFallback: FALLBACK_GENERIC,
    };
  }

  // Categoria inferida — usada para fallback contextual e sugestões mais relevantes
  const detectedCategory = detectCategory(tokens);
  const contextualFallback = getContextualFallbackMessage(detectedCategory);

  const questionStrong = STRONG_INTENT_WORDS.filter((w) => normQ.includes(w));

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  // Coleta todos os candidatos pontuados para oferecer como sugestões no fallback
  const candidates: { entry: KnowledgeEntry; score: number }[] = [];

  for (const entry of KNOWLEDGE_BASE) {
    const perguntaHay = normalize(entry.pergunta);
    const keywordsHay = normalize(entry.keywords.join(" "));
    // supportHay incluído mas com peso mínimo; ajuda recall sem prejudicar precisão
    const supportHay = normalize(
      `${entry.resposta} ${entry.contexto} ${entry.dica ?? ""}`
    );

    // Filtra palavras fortes da pergunta que batem com esta entrada
    const strongMatches = questionStrong.filter(
      (w) => perguntaHay.includes(w) || keywordsHay.includes(w)
    );
    // 2+ palavras fortes na pergunta mas nenhuma bate com a entrada → skip
    if (questionStrong.length >= 2 && strongMatches.length === 0) continue;

    let score = 0;
    // Camada 3 — ao menos 1 token não-fraco deve bater antes de aceitar a entrada
    let hasNonWeakMatch = false;

    for (const token of tokens) {
      const isWeak = WEAK_KEYWORDS.has(token);
      const stem = token.slice(0, Math.max(4, token.length - 3));

      if (perguntaHay.includes(stem)) {
        // Match no texto da pergunta da base: peso alto para termos específicos, baixo para fracos
        score += isWeak ? 2 : 5;
        if (!isWeak) hasNonWeakMatch = true;
      } else if (keywordsHay.includes(stem)) {
        // Termos fracos ignorados em keywords — evita acúmulo de pontos por termos genéricos
        if (!isWeak) {
          score += 4;
          hasNonWeakMatch = true;
        } else {
          score += 1;
        }
      } else if (!isWeak && supportHay.includes(stem)) {
        // Corpo da resposta: peso mínimo, somente tokens específicos (evita ruído de conteúdo)
        score += 1;
      }
    }

    score += strongMatches.length * 6;
    // Match exato do texto normalizado da pergunta — sinal muito forte
    if (perguntaHay.includes(normQ)) score += 20;

    // Camada 3 — descarta entradas sem nenhum match em token específico
    if (!hasNonWeakMatch && strongMatches.length === 0) continue;

    if (score > 0) candidates.push({ entry, score });

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= SCORE_THRESHOLD) {
    // Verifica se o match é claro o suficiente para retornar diretamente
    // Quando score é borderline E existe candidato quase-igual → melhor oferecer fallback contextual
    candidates.sort((a, b) => b.score - a.score);
    const secondScore = candidates.length >= 2 ? candidates[1].score : 0;
    const isAmbiguous =
      bestScore < MIN_CLEAR_WIN_SCORE && secondScore >= bestScore - MIN_CONFIDENCE_GAP;

    if (!isAmbiguous) {
      return {
        text: best.resposta,
        matched: best,
        score: bestScore,
        isDefault: false,
        suggestions: [],
        tokens,
        blockedByDomainAnchor: false,
        detectedCategory,
        contextualFallback: null,
      };
    }
    // Ambíguo: deixa cair para fallback com boas sugestões (candidatos já ordenados acima)
  }

  // Score abaixo do limiar ou ambíguo — combina top candidatos + extras da categoria detectada (até 5)
  if (candidates[0]?.score !== bestScore) {
    // Só re-ordena se não foi ordenado pelo bloco de confidence-gap acima
    candidates.sort((a, b) => b.score - a.score);
  }
  const topCandidates = candidates.slice(0, 3).map((c) => c.entry);

  let suggestions: KnowledgeEntry[];
  if (topCandidates.length > 0) {
    const topIds = new Set(topCandidates.map((e) => e.id));
    const categoryExtras = detectedCategory
      ? KNOWLEDGE_BASE
          .filter((e) => e.categoria === detectedCategory && !topIds.has(e.id))
          .slice(0, 2)
      : [];
    suggestions = [...topCandidates, ...categoryExtras].slice(0, 5);
  } else {
    suggestions = getDefaultSuggestions(detectedCategory);
  }

  return {
    text: DEFAULT_ANSWER,
    matched: null,
    score: 0,
    isDefault: true,
    suggestions,
    tokens,
    blockedByDomainAnchor: false,
    detectedCategory,
    contextualFallback,
  };
}
