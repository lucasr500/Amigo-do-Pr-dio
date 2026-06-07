// Sistema de milestones operacionais — gamificação leve para retenção.
// Registra quando o síndico atinge marcos relevantes pela primeira vez.
// Determinístico, local-first, sem IA.

import { safeRead, safeWrite } from "./session-core";

const MILESTONES_KEY = "amigo_milestones";

export type MilestoneId =
  | "score_60"         // Saúde operacional atingiu 60%
  | "score_75"         // Saúde operacional atingiu 75%
  | "score_90"         // Saúde operacional atingiu 90%
  | "essentials_done"  // 3 datas essenciais cadastradas
  | "docs_mapped"      // Primeiros documentos mapeados
  | "first_review"     // Primeira revisão mensal concluída
  | "pendencia_clear"  // Primeiro mês sem pendências vencidas
  | "10_resolved"      // 10 pendências resolvidas no total
  | "setup_complete";  // Implantação 100% concluída

export type Milestone = {
  id: MilestoneId;
  achievedAt: string; // ISO timestamp
};

export type MilestoneStore = {
  achieved: Milestone[];
  lastSeenAt?: string; // ISO timestamp — usado para exibir apenas novos
};

// ── Storage ────────────────────────────────────────────────────────────────────

function getMilestones(): MilestoneStore {
  return safeRead<MilestoneStore>(MILESTONES_KEY, { achieved: [] });
}

function saveMilestones(store: MilestoneStore): void {
  safeWrite(MILESTONES_KEY, store);
}

export function hasAchieved(id: MilestoneId): boolean {
  return getMilestones().achieved.some((m) => m.id === id);
}

function recordMilestone(id: MilestoneId): void {
  const store = getMilestones();
  if (store.achieved.some((m) => m.id === id)) return;
  store.achieved.push({ id, achievedAt: new Date().toISOString() });
  saveMilestones(store);
}

// ── Textos dos marcos ─────────────────────────────────────────────────────────

export const MILESTONE_TEXT: Record<MilestoneId, { title: string; message: string }> = {
  score_60:       { title: "Prédio bem monitorado", message: "Saúde operacional acima de 60%. O monitoramento está ativo e gerando valor." },
  score_75:       { title: "Organização avançada", message: "Saúde operacional acima de 75%. Este prédio está claramente mais protegido que a média." },
  score_90:       { title: "Excelência operacional", message: "Saúde operacional acima de 90%. Gestão de referência — continue assim." },
  essentials_done:{ title: "Essenciais completos", message: "AVCB, seguro e mandato cadastrados. O monitoramento de risco está ativo." },
  docs_mapped:    { title: "Documentação iniciada", message: "Primeiros documentos mapeados. Continue — documentação completa reduz risco jurídico." },
  first_review:   { title: "Primeira revisão mensal", message: "Revisão mensal concluída. Este hábito é o principal diferencial de síndicos organizados." },
  pendencia_clear:{ title: "Mês sem pendências vencidas", message: "Nenhuma pendência com prazo vencido. Gestão proativa em ação." },
  "10_resolved":  { title: "10 pendências resolvidas", message: "10 próximos passos resolvidos. Você está construindo um histórico sólido de gestão." },
  setup_complete: { title: "Implantação concluída", message: "Configuração do prédio completa. O app agora opera com máxima precisão." },
};

// ── Avaliação automática — chamada pelo scheduler ────────────────────────────

// Avalia milestones de forma síncrona usando imports diretos
// (milestones.ts não é importado por session.ts — sem dependência circular)
import { computeHealthScore } from "./health-score";
import {
  getMemoriaOperacional, getMemoriaAssistida, getDocumentos,
  getPendenciasConcluidas, getPendenciasAbertas,
} from "./session";
import { getLastCompletedMonthlyReview } from "./session-monthly-review";

export function evaluateMilestones(): MilestoneId[] {
  const newOnes: MilestoneId[] = [];

  function check(id: MilestoneId, condition: () => boolean): void {
    if (!hasAchieved(id) && condition()) {
      recordMilestone(id);
      newOnes.push(id);
    }
  }

  try {
    const health   = computeHealthScore();
    const m        = getMemoriaOperacional();
    const a        = getMemoriaAssistida();
    const docs     = getDocumentos();
    const resolved = getPendenciasConcluidas();
    const open     = getPendenciasAbertas();
    const today    = new Date().toISOString().slice(0, 10);

    check("score_60", () => health.percentage >= 60);
    check("score_75", () => health.percentage >= 75);
    check("score_90", () => health.percentage >= 90);

    check("essentials_done", () => {
      const hasAvcb    = !!(m.vencimentoAVCB || a.avcb?.value);
      const hasSeguro  = !!(m.vencimentoSeguro || a.seguro?.value);
      const hasMandato = !!(m.fimMandatoSindico || a.mandato?.value);
      return hasAvcb && hasSeguro && hasMandato;
    });

    check("docs_mapped", () => docs.length > 0);

    check("first_review", () => !!getLastCompletedMonthlyReview());

    check("pendencia_clear", () =>
      open.filter((p) => p.dueDate && p.dueDate < today).length === 0 && open.length > 0
    );

    check("10_resolved", () => resolved.length >= 10);

  } catch {
    // Silently ignore errors — milestones são secundários
  }

  return newOnes;
}

// ── Leitura de novos milestones para UI ───────────────────────────────────────

export function getNewMilestones(): Milestone[] {
  const store = getMilestones();
  if (!store.lastSeenAt) {
    // Nunca visto — retorna tudo (mas marca como visto para não repetir)
    const all = store.achieved.slice();
    store.lastSeenAt = new Date().toISOString();
    saveMilestones(store);
    return all;
  }
  const newOnes = store.achieved.filter((m) => m.achievedAt > store.lastSeenAt!);
  if (newOnes.length > 0) {
    store.lastSeenAt = new Date().toISOString();
    saveMilestones(store);
  }
  return newOnes;
}

export function getAllMilestones(): Milestone[] {
  return getMilestones().achieved;
}
