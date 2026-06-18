// ─── Natureza jurídica do conteúdo ───────────────────────────────────────────
// Fonte canônica e ÚNICA da separação exigida pela Tese de produto:
//   opinião de morador  ≠  comunicado oficial  ≠  deliberação de assembleia
//
// A natureza é DERIVADA da entidade — nunca selecionada pelo autor. O sistema
// classifica; o usuário não pode rotular errado. É isto que torna a separação
// "inegociável" (exigência estrutural, não cosmética): um comentário de morador
// jamais pode se passar por comunicado oficial, e um comunicado jamais por
// deliberação coletiva.
//
// Camada PURA: sem storage, sem UI, sem efeitos. Importa apenas TIPOS
// (import type), logo não cria ciclos de runtime nem depende de localStorage.

import type { InstitutionalPost, Comment, CommunityRole } from "./community-types";
import type { AssemblyComment } from "./assembly-discussion";
import type { Decision } from "./decisions";
import type { AssemblyAgendaItem } from "./session-assembleias";

// ─── Taxonomia ────────────────────────────────────────────────────────────────

export type ContentNature = "opiniao" | "comunicado" | "deliberacao";

export const CONTENT_NATURES: ContentNature[] = ["opiniao", "comunicado", "deliberacao"];

/** Rótulo curto para o selo. */
export const CONTENT_NATURE_LABELS: Record<ContentNature, string> = {
  opiniao:     "Opinião",
  comunicado:  "Comunicado oficial",
  deliberacao: "Deliberação de assembleia",
};

/** Descrição jurídica — usada em tooltip/disclaimer. Curta e precisa. */
export const CONTENT_NATURE_DESCRIPTION: Record<ContentNature, string> = {
  opiniao:
    "Manifestação individual de participante, sem efeito vinculante. Não representa a administração nem decisão coletiva.",
  comunicado:
    "Ato de comunicação oficial da administração/síndico. Informa e orienta, mas não constitui deliberação coletiva.",
  deliberacao:
    "Decisão coletiva tomada em assembleia, com efeito conforme a convenção e a legislação aplicável.",
};

/** Ordem de autoridade jurídica (opinião < comunicado < deliberação). */
export const CONTENT_NATURE_RANK: Record<ContentNature, number> = {
  opiniao: 0,
  comunicado: 1,
  deliberacao: 2,
};

export function isContentNature(v: unknown): v is ContentNature {
  return v === "opiniao" || v === "comunicado" || v === "deliberacao";
}

// ─── Classificadores determinísticos (natureza derivada, nunca escolhida) ──────

/**
 * Post do mural. Origem "morador" = opinião (participação). Origem "oficial" ou
 * "sistema" — ou ausente — = comunicado oficial (canal institucional).
 */
export function natureOfPost(post: Pick<InstitutionalPost, "origin">): ContentNature {
  return post.origin === "morador" ? "opiniao" : "comunicado";
}

/**
 * Comentário (mural ou pauta de assembleia). Participar de uma discussão é sempre
 * opinião/discussão — independe do papel do autor. Um comentário do síndico numa
 * thread é manifestação em discussão, não um comunicado oficial nem deliberação.
 */
export function natureOfComment(
  _comment?: Comment | AssemblyComment | { authorRole?: CommunityRole }
): ContentNature {
  return "opiniao";
}

/**
 * Decisão registrada. Categoria "assembleia" = deliberação de assembleia. Demais
 * categorias = ato administrativo da gestão → comunicado oficial (não é decisão
 * coletiva, ainda que registrada na memória institucional).
 */
export function natureOfDecision(decision: Pick<Decision, "category">): ContentNature {
  return decision.category === "assembleia" ? "deliberacao" : "comunicado";
}

/**
 * Item de pauta. Item deliberável (deliberação/eleição) já decidido (com
 * `decididoEm`) = deliberação de assembleia. Informe, ou item ainda não decidido,
 * = comunicado (condução/pauta — ainda não há decisão coletiva).
 */
export function natureOfAgendaItem(
  item: Pick<AssemblyAgendaItem, "tipo" | "decididoEm">
): ContentNature {
  const deliberavel = item.tipo === "deliberacao" || item.tipo === "eleicao";
  return deliberavel && !!item.decididoEm ? "deliberacao" : "comunicado";
}
