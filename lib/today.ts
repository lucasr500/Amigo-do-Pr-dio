// ─── Motor "Hoje" único (W2) ─────────────────────────────────────────────────
// UMA fonte priorizada de "o que faço agora?" para o Início. Funde, por baixo, a
// lógica já existente — command-center (que por sua vez agrega guidance-engine,
// financial, documentos, pendências, saúde) + o wedge da Assembleia — numa única
// lista ranqueada, eliminando a necessidade de 6 cards concorrentes na UI
// (Briefing, Guidance, Plano, Revisão mensal, Revisão semanal, Command Center).
//
// Apenas leitura/derivação; sem storage novo, sem efeitos.

import { buildCommandCenter, type RiskLevel } from "./command-center";
import { buildAssemblyHomeSummary } from "./assembly-home";

export type TodayPriority = "urgente" | "semana" | "info";
export type TodaySource = "risco" | "foco" | "guidance" | "assembleia";
export type TodayTarget = "condominio" | "ferramentas" | "agenda" | "pendencias" | "memoria";

export type TodayItem = {
  id: string;
  title: string;
  reason: string;
  priority: TodayPriority;
  source: TodaySource;
  target: TodayTarget;
};

export type TodayResult = {
  headline: string;     // a frase "o que eu faria hoje" do command-center
  risk: RiskLevel;
  items: TodayItem[];   // ranqueado: urgente → semana → info
};

const PRIORITY_RANK: Record<TodayPriority, number> = { urgente: 0, semana: 1, info: 2 };

export function buildTodayItems(): TodayResult {
  const cc = buildCommandCenter();
  const items: TodayItem[] = [];

  // 1. Wedge da Assembleia — sempre presente (porta de entrada do produto).
  const asm = buildAssemblyHomeSummary();
  items.push({
    id: "today_assembleia",
    title: asm.headline,
    reason: asm.sub,
    priority: asm.cta === "deliberar" ? "urgente" : asm.cta === "ver" ? "info" : "semana",
    source: "assembleia",
    target: "memoria",
  });

  // 2. Ações urgentes do command-center (já deduplicadas/priorizadas lá).
  for (const a of cc.urgentActions.slice(0, 4)) {
    items.push({
      id: `today_urg_${a.id}`,
      title: a.titulo,
      reason: a.motivo || a.descricao || cc.topRisco || "Item urgente.",
      priority: "urgente",
      source: "risco",
      target: a.resolveTarget || "condominio",
    });
  }

  // 3. Foco do dia (DailyFocusItem) — esta semana.
  for (const f of cc.todayFocus.slice(0, 3)) {
    items.push({
      id: `today_foco_${f.id}`,
      title: f.title,
      reason: f.reason,
      priority: "semana",
      source: "foco",
      target: f.target,
    });
  }

  // 4. Orientação rica (guidance) — info, completa o "o que melhorar".
  for (const g of cc.guidanceTopTres.slice(0, 2)) {
    items.push({
      id: `today_guid_${g.id}`,
      title: g.titulo,
      reason: g.proximoPasso || g.contexto || "Oportunidade de melhoria.",
      priority: "info",
      source: "guidance",
      target: "condominio",
    });
  }

  // Dedup por título (fontes podem coincidir) e ordenação por prioridade.
  const seen = new Set<string>();
  const deduped = items.filter((it) => {
    const key = it.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  return { headline: cc.todayAnswer || "Veja o que merece atenção hoje.", risk: cc.riskLevel, items: deduped };
}
