// ─── Seam do "Pergunte ao Prédio" (W6) ───────────────────────────────────────
// PONTO DE ENTRADA ÚNICO do contexto do prédio para a futura IA contextual (RAG).
// Monta um snapshot ESTRUTURADO e FILTRADO POR PAPEL dos dados do condomínio
// (decisões, linha do tempo, documentos, assembleias, transparência). Pós-relacional,
// a IA contextual plugará AQUI sem refator: ela consome PredioContext, não os stores.
//
// NÃO há IA externa neste arquivo (ai_layer_enabled segue off). É só o terreno.
// SEGURANÇA: o contexto é role-aware — o morador NUNCA recebe decisões de gestão
// nem itens de visibilidade restrita. Isto blinda o "Pergunte ao Prédio" contra
// vazamento por papel desde o dia 1 (a invariante da Tese: visibilidade não é só UI).
//
// Complementa lib/contextual-assistant.ts (enriquecimento por consulta); este é o
// snapshot estruturado completo que um motor de recuperação consumiria.

import { getRecentDecisions } from "./decisions";
import { getUnifiedTimeline } from "./timeline";
import { getDocumentsForRole } from "./documents";
import { getAssemblies } from "./session-assembleias";
import { buildTransparencySummary } from "./transparency";
import type { CommunityRole } from "./community-types";

// Papéis com acesso à camada de governança (decisões, itens internos).
const ELEVATED: CommunityRole[] = ["manager", "council"];

export type PredioContext = {
  role: CommunityRole;
  generatedAt: string;
  decisions: { total: number; recent: { title: string; date: string; category: string }[] };
  timeline: { total: number; recent: { title: string; type: string; occurredAt: string }[] };
  documents: { visible: number };
  assemblies: { total: number; next?: { titulo: string; status: string } };
  transparency: { available: boolean; month?: string };
};

export function buildPredioContext(role: CommunityRole): PredioContext {
  const elevated = ELEVATED.includes(role);

  // Decisões: só para gestão/conselho (mesma régua do relacional 008_decisions).
  const decisionsList = elevated ? getRecentDecisions(5) : [];
  const timeline = getUnifiedTimeline({ role }); // já filtrado por visibilidade do papel

  let transparency = { available: false as boolean, month: undefined as string | undefined };
  try {
    const t = buildTransparencySummary();
    transparency = { available: t.hasData, month: t.month };
  } catch { /* local-first */ }

  const assemblies = getAssemblies();
  const nextAsm = assemblies.find((a) => a.status === "convocada") || assemblies[0];

  return {
    role,
    generatedAt: new Date().toISOString(),
    decisions: {
      total: decisionsList.length,
      recent: decisionsList.map((d) => ({ title: d.title, date: d.date, category: d.category })),
    },
    timeline: {
      total: timeline.length,
      recent: timeline.slice(0, 8).map((e) => ({ title: e.title, type: e.type, occurredAt: e.occurredAt })),
    },
    documents: { visible: getDocumentsForRole(role).length },
    assemblies: {
      total: assemblies.length,
      next: nextAsm ? { titulo: nextAsm.titulo, status: nextAsm.status } : undefined,
    },
    transparency,
  };
}
