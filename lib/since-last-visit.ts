// Contextualizador de sessão — "desde sua última visita".
// Compara estado atual com a sessão anterior usando dados locais.
// Sem IA. Sem backend. Determinístico.
// Alimenta HomePriorityStrip e outros componentes de continuidade.

import { getSessionMeta, getNotifications, getHealthHistory } from "./session";
import { computeHealthScore } from "./health-score";

export type SinceLastVisitContext = {
  hasContext: boolean;
  daysSince: number;
  newNotificationsCount: number;
  healthDelta: number | null;
  contextPhrase: string | null;
};

function daysBetweenISO(isoA: string): number {
  const a = new Date(isoA);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

export function buildSinceLastVisitContext(): SinceLastVisitContext {
  const meta = getSessionMeta();

  if (!meta.previousOpenedAt) {
    return { hasContext: false, daysSince: 0, newNotificationsCount: 0, healthDelta: null, contextPhrase: null };
  }

  const daysSince = daysBetweenISO(meta.previousOpenedAt);

  // Sem contexto se abriu mais de uma vez hoje
  if (daysSince < 1) {
    return { hasContext: false, daysSince: 0, newNotificationsCount: 0, healthDelta: null, contextPhrase: null };
  }

  // Notificações criadas desde a última visita
  const prevTime = new Date(meta.previousOpenedAt).getTime();
  const newNotificationsCount = getNotifications().filter(
    (n) => !n.dismissed && new Date(n.createdAt).getTime() > prevTime
  ).length;

  // Delta do health score entre hoje e a última visita
  const history = getHealthHistory();
  const todayStr   = new Date().toISOString().slice(0, 10);
  const prevDayStr = new Date(meta.previousOpenedAt).toISOString().slice(0, 10);
  const todaySnap  = history.find((s) => s.date === todayStr);
  const prevSnap   = history.find((s) => s.date === prevDayStr);

  let healthDelta: number | null = null;
  if (todaySnap && prevSnap && todayStr !== prevDayStr) {
    healthDelta = todaySnap.percentage - prevSnap.percentage;
  } else if (!todaySnap) {
    // Compara score atual calculado com o snapshot mais recente
    const olderSnap = history
      .filter((s) => s.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (olderSnap) {
      healthDelta = computeHealthScore().percentage - olderSnap.percentage;
    }
  }

  const dayLabel = daysSince === 1 ? "ontem" : `há ${daysSince} dias`;

  let contextPhrase: string | null = null;

  if (newNotificationsCount > 0) {
    contextPhrase = `${newNotificationsCount} alerta${newNotificationsCount > 1 ? "s" : ""} novo${newNotificationsCount > 1 ? "s" : ""} desde ${dayLabel}`;
  } else if (healthDelta !== null && healthDelta >= 5) {
    contextPhrase = `Score operacional subiu ${healthDelta}% desde ${dayLabel}`;
  } else if (healthDelta !== null && healthDelta <= -5) {
    contextPhrase = `Score caiu ${Math.abs(healthDelta)}% desde ${dayLabel} — verifique alertas`;
  } else if (daysSince >= 3) {
    contextPhrase = `Última visita ${dayLabel} — tudo monitorado`;
  } else {
    contextPhrase = `Sem novos alertas desde ${dayLabel}`;
  }

  return { hasContext: true, daysSince, newNotificationsCount, healthDelta, contextPhrase };
}
