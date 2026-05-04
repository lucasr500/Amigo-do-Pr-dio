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
  // Top-3 entradas mais próximas; populado apenas quando isDefault = true
  suggestions: KnowledgeEntry[];
  // Tokens expandidos usados no match — exposto para logging e diagnóstico
  tokens: string[];
  // true quando a pergunta não continha nenhum termo condominial
  blockedByDomainAnchor: boolean;
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
};

function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) syns.forEach((s) => expanded.add(normalize(s)));
    // Stem-based synonym lookup (4 chars)
    const stem = token.slice(0, Math.max(4, token.length - 3));
    for (const [key, syns2] of Object.entries(SYNONYMS)) {
      if (key !== token && key.startsWith(stem)) {
        syns2.forEach((s) => expanded.add(normalize(s)));
      }
    }
  }
  return Array.from(expanded);
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
// Estrutura preparada para eventual envio a backend.

type QueryLog = {
  ts: string;
  q: string;
  tokens: string[];
  matchedId: string | null;
  score: number;
  isDefault: boolean;
  blockedByDomainAnchor: boolean;
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

// Limiar mínimo. Mantido em 8 — o trabalho real de precisão é feito pelas camadas 1–3.
const SCORE_THRESHOLD = 8;

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
  // termos do domínio presentes em 5+ entradas — pouco discriminatórios
  "condominio", "assembleia", "sindico",
  "pagamento", "notificacao", "aprovacao",
  "funcionario", "jornada", "hora", "tempo",
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
];

// Texto exibido quando nenhuma resposta é encontrada.
// Curto por design — o restante das informações é exibido via UI (chips + sugestões).
export const DEFAULT_ANSWER =
  "Não encontrei uma resposta específica para essa pergunta.";

// Retorna entradas da mesma categoria para sugestões de aprofundamento.
export function getRelatedEntries(
  categoria: string,
  excludeId: string,
  limit = 2
): KnowledgeEntry[] {
  return KNOWLEDGE_BASE
    .filter((e) => e.categoria === categoria && e.id !== excludeId)
    .slice(0, limit);
}

// Retorna 3 entradas de categorias diversas como sugestão padrão quando não há candidatos com score.
function getDefaultSuggestions(): KnowledgeEntry[] {
  const order = ["multas", "inadimplencia", "assembleias", "funcionarios", "obras", "convencao"];
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
      suggestions: getDefaultSuggestions(),
      tokens: [],
      blockedByDomainAnchor: false,
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
      suggestions: getDefaultSuggestions(),
      tokens,
      blockedByDomainAnchor: true,
    };
  }

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
    return {
      text: best.resposta,
      matched: best,
      score: bestScore,
      isDefault: false,
      suggestions: [],
      tokens,
      blockedByDomainAnchor: false,
    };
  }

  // Score abaixo do limiar: ordena candidatos e oferece top-3 como sugestões de navegação
  candidates.sort((a, b) => b.score - a.score);
  const suggestions = candidates.slice(0, 3).map((c) => c.entry);

  return {
    text: DEFAULT_ANSWER,
    matched: null,
    score: 0,
    isDefault: true,
    suggestions: suggestions.length > 0 ? suggestions : getDefaultSuggestions(),
    tokens,
    blockedByDomainAnchor: false,
  };
}
