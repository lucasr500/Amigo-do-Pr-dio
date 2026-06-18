// ─── Loop da Assembleia: informar → discutir → organizar → decidir → lembrar ──
// Conecta a entidade Assembleia (session-assembleias) aos módulos existentes que
// fecham o ciclo: Decisão (decisions), Enquete (community-polls) e Timeline
// (community-timeline). Mantido separado de session-assembleias.ts para isolar as
// dependências cruzadas e evitar ciclos de import na camada de dados pura.

import {
  getAssemblyById, updateAssembly, getAgendaItemById, updateAgendaItem,
  getAgendaItems, countDecided,
  type AgendaItemTipo,
} from "@/lib/session-assembleias";
import { addDecision, type DecisionRiskLevel } from "@/lib/decisions";
import { emitDecisionRegistered, emitAssembleiaRealizada } from "@/lib/community-timeline";
import { addPoll } from "@/lib/community-polls";
import type { Visibility } from "@/lib/community-types";

// ─── Ciclo de vida da assembleia ──────────────────────────────────────────────

/** Convoca: passa de rascunho → convocada e carimba o momento da convocação. */
export function convocarAssembleia(id: string): void {
  const a = getAssemblyById(id);
  if (!a) return;
  updateAssembly(id, { status: "convocada", convocadaEm: a.convocadaEm ?? new Date().toISOString() });
}

/**
 * Realiza: passa a assembleia para "realizada", registra quórum atingido (se houver)
 * e emite o evento de timeline (ramo "lembrar"). Idempotente no efeito de timeline
 * (dedupe por sourceId na janela de 24h).
 */
export function realizarAssembleia(id: string, quorumAtingido?: number): void {
  const a = getAssemblyById(id);
  if (!a) return;
  updateAssembly(id, {
    status: "realizada",
    quorumAtingido: typeof quorumAtingido === "number" ? quorumAtingido : a.quorumAtingido,
  });
  emitAssembleiaRealizada(id, a.titulo, countDecided(id));
}

/** Encerra: assembleia concluída e arquivada (status terminal). */
export function encerrarAssembleia(id: string): void {
  if (!getAssemblyById(id)) return;
  updateAssembly(id, { status: "encerrada" });
}

// ─── Deliberação de um item de pauta → Decisão registrada (ramo "decidir") ────

export type DeliberarOptions = {
  resultado: string;                 // o que foi deliberado
  registrarDecisao?: boolean;        // default true: gera Decision na memória institucional
  contexto?: string;                 // contexto da decisão (default: descrição do item)
  fundamento?: string;               // fundamento jurídico/técnico
  riskLevel?: DecisionRiskLevel;
  proximoPasso?: string;
};

/**
 * Delibera um item de pauta: grava o resultado, carimba decididoEm e — quando
 * `registrarDecisao` (default true) — cria uma Decision vinculada (linkedDecisionId)
 * e emite o evento de timeline da decisão. Retorna o id da decisão criada, se houver.
 */
export function deliberarItem(itemId: string, opts: DeliberarOptions): string | null {
  const item = getAgendaItemById(itemId);
  if (!item) return null;

  const decididoEm = new Date().toISOString();
  let decisionId: string | null = item.linkedDecisionId ?? null;

  const deveRegistrar = opts.registrarDecisao !== false;
  if (deveRegistrar && !item.linkedDecisionId) {
    const assembly = getAssemblyById(item.assemblyId);
    const contexto =
      opts.contexto?.trim() ||
      item.descricao?.trim() ||
      (assembly ? `Deliberado na assembleia "${assembly.titulo}".` : "Deliberado em assembleia.");
    const decision = addDecision({
      title: item.titulo,
      date: decididoEm.slice(0, 10),
      category: "assembleia",
      context: contexto,
      rationale: opts.fundamento?.trim() || "Deliberação em assembleia.",
      outcome: opts.resultado.trim(),
      riskLevel: opts.riskLevel,
      nextStep: opts.proximoPasso?.trim() || undefined,
    });
    decisionId = decision.id;
    emitDecisionRegistered(decision.id, decision.title, "Assembleia");
  }

  updateAgendaItem(itemId, {
    resultado: opts.resultado.trim(),
    decididoEm,
    linkedDecisionId: decisionId ?? undefined,
  });

  return decisionId;
}

// ─── Enquete por pauta (ramo "discutir") ──────────────────────────────────────

export type EnquetePorPautaOptions = {
  opcoes: string[];                  // rótulos das opções (mín. 2)
  descricao?: string;
  visibility?: Visibility;           // default "moradores"
};

/**
 * Cria uma enquete vinculada a um item de pauta e grava o linkedPollId no item.
 * Reutiliza o módulo community-polls (votos, resultados, disclaimer já existentes).
 * Retorna o id da enquete, ou null se o item não existir ou faltarem opções.
 */
export function criarEnquetePorPauta(itemId: string, opts: EnquetePorPautaOptions): string | null {
  const item = getAgendaItemById(itemId);
  if (!item) return null;

  const opcoes = opts.opcoes.map((o) => o.trim()).filter(Boolean);
  if (opcoes.length < 2) return null;

  const poll = addPoll({
    title: item.titulo,
    description: opts.descricao?.trim() || item.descricao?.trim() || "",
    options: opcoes.map((label, idx) => ({ id: `opt_${idx}_${Math.random().toString(36).slice(2, 6)}`, label })),
    visibility: opts.visibility ?? "moradores",
    status: "ativa",
  });

  updateAgendaItem(itemId, { linkedPollId: poll.id });
  return poll.id;
}

// ─── Derivado: progresso de deliberação de uma assembleia ─────────────────────

export function deliberacaoProgress(assemblyId: string): { total: number; decididos: number; pct: number } {
  const itens = getAgendaItems(assemblyId);
  const deliberaveis = itens.filter((i) => i.tipo === ("deliberacao" as AgendaItemTipo) || i.tipo === ("eleicao" as AgendaItemTipo));
  const total = deliberaveis.length;
  const decididos = deliberaveis.filter((i) => !!i.decididoEm).length;
  const pct = total === 0 ? 0 : Math.round((decididos / total) * 100);
  return { total, decididos, pct };
}
