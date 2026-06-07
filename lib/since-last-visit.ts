// Contextualizador de sessão — "desde sua última visita".
// Compara estado atual com a sessão anterior usando dados locais.
// Sem IA. Sem backend. Determinístico.
// Alimenta HomePriorityStrip e outros componentes de continuidade.

import { getSessionMeta, getNotifications, getHealthHistory, getPendenciasConcluidas, getPendenciasAbertas, getOcorrencias, getMemoriaOperacional, getMemoriaAssistida } from "./session";
import { computeHealthScore } from "./health-score";

export type SinceLastVisitContext = {
  hasContext: boolean;
  daysSince: number;
  newNotificationsCount: number;
  healthDelta: number | null;
  contextPhrase: string | null;
  // Dados expandidos para "desde sua última visita" e "últimos 30 dias"
  pendenciasConcluidasSince: number;   // concluídas desde última visita
  novasOcorrenciasSince: number;       // ocorrências criadas desde última visita
  pendenciasConcluidasMes: number;     // concluídas nos últimos 30 dias
  novasOcorrenciasMes: number;         // ocorrências nos últimos 30 dias
  novasPendenciasSince: number;        // pendências abertas desde última visita
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

  const now = Date.now();
  const cutoff30d = now - 30 * 86_400_000;

  const pendConcluidas = getPendenciasConcluidas();
  const pendAbertas = getPendenciasAbertas();
  const ocorrencias = getOcorrencias();

  const pendenciasConcluidasMes = pendConcluidas.filter(
    (p) => p.completedAt && new Date(p.completedAt).getTime() >= cutoff30d
  ).length;

  const novasOcorrenciasMes = ocorrencias.filter(
    (o) => new Date(o.createdAt).getTime() >= cutoff30d
  ).length;

  if (!meta.previousOpenedAt) {
    return {
      hasContext: false, daysSince: 0,
      newNotificationsCount: 0, healthDelta: null, contextPhrase: null,
      pendenciasConcluidasSince: 0, novasOcorrenciasSince: 0,
      pendenciasConcluidasMes, novasOcorrenciasMes, novasPendenciasSince: 0,
    };
  }

  const daysSince = daysBetweenISO(meta.previousOpenedAt);

  if (daysSince < 1) {
    // Mesmo dia — mas urgências de datas críticas ainda devem ser exibidas
    const m2 = getMemoriaOperacional();
    const a2 = getMemoriaAssistida();
    function daysUntilDate2(iso: string | undefined): number | null {
      if (!iso) return null;
      const d = new Date(`${iso}T00:00:00`);
      if (isNaN(d.getTime())) return null;
      const now = new Date(); now.setHours(0, 0, 0, 0);
      return Math.floor((d.getTime() - now.getTime()) / 86400000);
    }
    const avcbD = daysUntilDate2(m2.vencimentoAVCB || a2.avcb?.value);
    const segD  = daysUntilDate2(m2.vencimentoSeguro || a2.seguro?.value);
    const mandD = daysUntilDate2(m2.fimMandatoSindico || a2.mandato?.value);
    const urgente = (
      (avcbD !== null && avcbD <= 7) ? (avcbD <= 0 ? `AVCB vencido há ${Math.abs(avcbD)} dia${Math.abs(avcbD) !== 1 ? "s" : ""}` : `AVCB vence em ${avcbD} dia${avcbD !== 1 ? "s" : ""}`) :
      (segD  !== null && segD  <= 7) ? (segD  <= 0 ? `Seguro predial vencido` : `Seguro vence em ${segD} dia${segD !== 1 ? "s" : ""}`) :
      (mandD !== null && mandD <= 30) ? `Mandato vence em ${mandD} dias` :
      null
    );
    return {
      hasContext: !!urgente, daysSince: 0,
      newNotificationsCount: 0, healthDelta: null, contextPhrase: urgente,
      pendenciasConcluidasSince: 0, novasOcorrenciasSince: 0,
      pendenciasConcluidasMes, novasOcorrenciasMes, novasPendenciasSince: 0,
    };
  }

  const prevTime = new Date(meta.previousOpenedAt).getTime();

  const newNotificationsCount = getNotifications().filter(
    (n) => !n.dismissed && new Date(n.createdAt).getTime() > prevTime
  ).length;

  const pendenciasConcluidasSince = pendConcluidas.filter(
    (p) => p.completedAt && new Date(p.completedAt).getTime() > prevTime
  ).length;

  const novasOcorrenciasSince = ocorrencias.filter(
    (o) => new Date(o.createdAt).getTime() > prevTime
  ).length;

  const novasPendenciasSince = pendAbertas.filter(
    (p) => new Date(p.createdAt).getTime() > prevTime
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
    const olderSnap = history
      .filter((s) => s.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (olderSnap) {
      healthDelta = computeHealthScore().percentage - olderSnap.percentage;
    }
  }

  const dayLabel = daysSince === 1 ? "ontem" : `há ${daysSince} dias`;

  // Detecta urgências de datas críticas para priorizar na contextPhrase
  const m = getMemoriaOperacional();
  const assistida = getMemoriaAssistida();

  function daysUntilDate(iso: string | undefined): number | null {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - now.getTime()) / 86400000);
  }

  const avcbDate = m.vencimentoAVCB || assistida.avcb?.value;
  const seguroDate = m.vencimentoSeguro || assistida.seguro?.value;
  const mandatoDate = m.fimMandatoSindico || assistida.mandato?.value;

  const avcbDays = daysUntilDate(avcbDate);
  const seguroDays = daysUntilDate(seguroDate);
  const mandatoDays = daysUntilDate(mandatoDate);

  // Urgência por data crítica iminente (prioridade máxima na contextPhrase)
  const urgentDatePhrase = (() => {
    if (avcbDays !== null && avcbDays <= 0) return `AVCB vencido há ${Math.abs(avcbDays)} dia${Math.abs(avcbDays) !== 1 ? "s" : ""}`;
    if (seguroDays !== null && seguroDays <= 0) return `Seguro predial vencido`;
    if (mandatoDays !== null && mandatoDays <= 0) return `Mandato do síndico vencido`;
    if (avcbDays !== null && avcbDays <= 7) return `AVCB vence em ${avcbDays} dia${avcbDays !== 1 ? "s" : ""}`;
    if (seguroDays !== null && seguroDays <= 7) return `Seguro vence em ${seguroDays} dia${seguroDays !== 1 ? "s" : ""}`;
    if (mandatoDays !== null && mandatoDays <= 30) return `Mandato vence em ${mandatoDays} dias`;
    if (avcbDays !== null && avcbDays <= 30) return `AVCB vence em ${avcbDays} dias`;
    if (seguroDays !== null && seguroDays <= 30) return `Seguro vence em ${seguroDays} dias`;
    return null;
  })();

  let contextPhrase: string | null = null;

  if (urgentDatePhrase) {
    // Urgência de data crítica sobrepõe qualquer outra mensagem
    contextPhrase = urgentDatePhrase;
  } else if (newNotificationsCount > 0) {
    contextPhrase = `${newNotificationsCount} alerta${newNotificationsCount > 1 ? "s" : ""} novo${newNotificationsCount > 1 ? "s" : ""} desde ${dayLabel}`;
  } else if (pendenciasConcluidasSince > 0) {
    contextPhrase = `${pendenciasConcluidasSince} pendência${pendenciasConcluidasSince > 1 ? "s" : ""} resolvida${pendenciasConcluidasSince > 1 ? "s" : ""} desde ${dayLabel}`;
  } else if (healthDelta !== null && healthDelta >= 5) {
    contextPhrase = `Score operacional subiu ${healthDelta}% desde ${dayLabel}`;
  } else if (healthDelta !== null && healthDelta <= -5) {
    contextPhrase = `Score caiu ${Math.abs(healthDelta)}% desde ${dayLabel} — verifique alertas`;
  } else if (daysSince >= 3) {
    contextPhrase = `Última visita ${dayLabel} — tudo monitorado`;
  } else {
    contextPhrase = `Sem novos alertas desde ${dayLabel}`;
  }

  return {
    hasContext: true, daysSince,
    newNotificationsCount, healthDelta, contextPhrase,
    pendenciasConcluidasSince, novasOcorrenciasSince,
    pendenciasConcluidasMes, novasOcorrenciasMes, novasPendenciasSince,
  };
}
