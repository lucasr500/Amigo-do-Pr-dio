// ─── Resumo da Assembleia para o Início do síndico ───────────────────────────
// Destaca o wedge da Tese ("a Assembleia Inteligente é a porta de entrada, não um
// módulo entre doze") na superfície de maior atenção — respondendo "o que faço
// agora?". Derivado dos dados locais (session-assembleias); sem storage, sem efeitos.

import {
  getAssemblies, getAgendaItems, ASSEMBLY_STATUS_LABELS, type Assembly,
} from "./session-assembleias";

export type AssemblyHomeCta = "preparar" | "convocar" | "deliberar" | "ver";

export type AssemblyHomeSummary = {
  hasAny: boolean;
  focus: Assembly | null;        // assembleia em foco (a que mais demanda ação)
  itemCount: number;
  decidedCount: number;
  pendingDeliberations: number;
  cta: AssemblyHomeCta;
  headline: string;              // resumo (o que fazer)
  sub: string;                   // detalhe (qual assembleia / contexto)
};

// Prioriza a assembleia que ainda demanda ação: convocada > rascunho > realizada > encerrada.
// Empata pela ordem natural de getAssemblies (mais recente primeiro).
function pickFocus(list: Assembly[]): Assembly | null {
  if (list.length === 0) return null;
  const rank: Record<Assembly["status"], number> = {
    convocada: 0, rascunho: 1, realizada: 2, encerrada: 3,
  };
  return [...list].sort((a, b) => rank[a.status] - rank[b.status])[0];
}

export function buildAssemblyHomeSummary(): AssemblyHomeSummary {
  let list: Assembly[] = [];
  try { list = getAssemblies(); } catch { /* local-first: silencioso */ }

  const focus = pickFocus(list);

  if (!focus) {
    return {
      hasAny: false, focus: null, itemCount: 0, decidedCount: 0, pendingDeliberations: 0,
      cta: "preparar",
      headline: "Prepare a próxima assembleia",
      sub: "Monte a pauta, ouça os moradores e registre as decisões — vira memória do prédio.",
    };
  }

  let items: ReturnType<typeof getAgendaItems> = [];
  try { items = getAgendaItems(focus.id); } catch { /* silencioso */ }

  const itemCount = items.length;
  const deliberaveis = items.filter((i) => i.tipo === "deliberacao" || i.tipo === "eleicao");
  const decidedCount = deliberaveis.filter((i) => !!i.decididoEm).length;
  const pendingDeliberations = deliberaveis.length - decidedCount;

  let cta: AssemblyHomeCta;
  if (focus.status === "rascunho") cta = itemCount === 0 ? "preparar" : "convocar";
  else if (focus.status === "convocada" || focus.status === "realizada") cta = pendingDeliberations > 0 ? "deliberar" : "ver";
  else cta = "ver"; // encerrada

  const headline: Record<AssemblyHomeCta, string> = {
    preparar: "Monte a pauta da assembleia",
    convocar: "Pauta pronta — convoque os condôminos",
    deliberar: pendingDeliberations === 1
      ? "1 item aguardando deliberação"
      : `${pendingDeliberations} itens aguardando deliberação`,
    ver: "Assembleia registrada na memória",
  };

  return {
    hasAny: true,
    focus,
    itemCount,
    decidedCount,
    pendingDeliberations,
    cta,
    headline: headline[cta],
    sub: `${focus.titulo} · ${ASSEMBLY_STATUS_LABELS[focus.status]}`,
  };
}
