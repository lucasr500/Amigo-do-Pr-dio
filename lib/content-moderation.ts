// ─── Pré-moderação de conteúdo sensível (defaults seguros) ────────────────────
// Camada PURA: sem storage, sem UI, sem rede. Espelha, no cliente, a heurística do trigger
// `premoderate_comment` (migration 015) — o SERVIDOR é a fronteira de segurança (o cliente não
// publica sensível direto), mas o cliente também fecha por padrão para coerência local-first.
//
// Conteúdo sensível = risco jurídico real (difamação/injúria, exposição de inadimplência).
// Em dúvida, FECHA (pendente), não abre. A lista é condominial e o Lucas refina — mantê-la em
// sincronia com a regex da migration 015.

// Lista inicial de termos sensíveis. Padrões com raiz sem acento (ex.: "inadimpl" casa
// "inadimplência") ou classe de caracteres ([aã]) para tolerar acento — comparação case-insensitive.
const SENSITIVE_PATTERNS: RegExp[] = [
  /\binadimpl/i,        // inadimplente, inadimplência
  /\bdevedor/i,
  /\bcalote/i,          // calote, caloteiro
  /\bladr[aã]o\b/i,
  /\bcorrup/i,          // corrupto, corrupção
  /\broubo/i,           // roubo, roubou
  /\bdesvi/i,           // desvio, desviou
  /\bprocessar\b/i,
  /\bprocesso\b/i,
  /\bdeve\b/i,          // "deve" como palavra inteira (não "devem"/"deveria")
  /\bn[aã]o\s+paga/i,   // "não paga" / "nao paga"
];

/**
 * Verdadeiro se o texto dispara a pré-moderação (tema sensível). Determinístico.
 * Em dúvida, o sistema fecha (este retorno true ⇒ o comentário nasce `pendente`).
 */
export function isSensitiveContent(text: string | undefined | null): boolean {
  if (!text) return false;
  return SENSITIVE_PATTERNS.some((re) => re.test(text));
}
