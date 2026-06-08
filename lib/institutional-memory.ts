// Resumo quantitativo da memória institucional acumulada.
// Derivado de dados existentes — sem side effects, sem persistência nova.

import { getDecisions } from "./decisions";
import { getActiveSuppliers } from "./suppliers";
import { getUnitEvents } from "./unit-history";
import { getTimeline } from "./community-timeline";
import { getHandoffProgress } from "./handoff";
import { getPendencias } from "./session-pendencias";
import { getMonthlyReviewHistory } from "./session-monthly-review";

export type InstitutionalMemorySummary = {
  decisionCount: number;
  supplierCount: number;
  unitEventCount: number;
  timelineEventCount: number;
  pendenciaCompletedCount: number;
  monthlyReviewCount: number;
  handoffPct: number;
  totalRecords: number;
  hasData: boolean;
  lastActivityDate: string | null;  // YYYY-MM-DD
  highlight: string;
  nextStep: string | null;
};

export function buildInstitutionalMemorySummary(): InstitutionalMemorySummary {
  let decisionCount = 0;
  let supplierCount = 0;
  let unitEventCount = 0;
  let timelineEventCount = 0;
  let pendenciaCompletedCount = 0;
  let monthlyReviewCount = 0;
  let handoffPct = 0;
  const dateCandidates: string[] = [];

  try {
    const decisions = getDecisions();
    decisionCount = decisions.length;
    if (decisions.length > 0) dateCandidates.push(decisions[decisions.length - 1].updatedAt);
  } catch { /* silencioso */ }

  try {
    supplierCount = getActiveSuppliers().length;
  } catch { /* silencioso */ }

  try {
    const unitEvents = getUnitEvents();
    unitEventCount = unitEvents.length;
    if (unitEvents.length > 0) dateCandidates.push(unitEvents[unitEvents.length - 1].createdAt);
  } catch { /* silencioso */ }

  try {
    const tl = getTimeline();
    timelineEventCount = tl.length;
    if (tl.length > 0) dateCandidates.push(tl[0].createdAt);
  } catch { /* silencioso */ }

  try {
    const pendencias = getPendencias();
    pendenciaCompletedCount = pendencias.filter((p) => p.status === "concluida").length;
  } catch { /* silencioso */ }

  try {
    monthlyReviewCount = getMonthlyReviewHistory().length;
  } catch { /* silencioso */ }

  try {
    handoffPct = getHandoffProgress().pct;
  } catch { /* silencioso */ }

  const totalRecords = decisionCount + supplierCount + unitEventCount + timelineEventCount + monthlyReviewCount;
  const hasData = totalRecords > 0;

  const lastActivityDate =
    dateCandidates.length > 0
      ? [...dateCandidates].sort().reverse()[0].slice(0, 10)
      : null;

  const highlight = hasData
    ? `${totalRecords} registro${totalRecords > 1 ? "s" : ""} ${totalRecords > 1 ? "institucionais" : "institucional"} acumulado${totalRecords > 1 ? "s" : ""}.`
    : "A memória institucional do condomínio começa aqui.";

  let nextStep: string | null = null;
  if (supplierCount === 0) nextStep = "Cadastre os fornecedores essenciais do prédio.";
  else if (decisionCount === 0) nextStep = "Registre a primeira decisão do mandato.";
  else if (monthlyReviewCount === 0) nextStep = "Conclua a primeira revisão mensal.";
  else if (handoffPct < 30) nextStep = "Avance no checklist de passagem de mandato.";

  return {
    decisionCount,
    supplierCount,
    unitEventCount,
    timelineEventCount,
    pendenciaCompletedCount,
    monthlyReviewCount,
    handoffPct,
    totalRecords,
    hasData,
    lastActivityDate,
    highlight,
    nextStep,
  };
}
