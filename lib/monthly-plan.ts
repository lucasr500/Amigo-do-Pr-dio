import { currentMonthKey, getCurrentFinancialSnapshot, getFinancialSummary } from "./financial";
import { buildGuidanceEngine } from "./guidance-engine";
import { getRecentDecisions } from "./decisions";
import { getMonthlyReviewState } from "./session-monthly-review";
import {
  getDocumentos,
  getLastBackupAt,
  getPendenciasAbertas,
  DOCUMENTO_LABEL,
  type DocumentoEssencial,
} from "./session";

export type MonthlyPlanTarget =
  | "pendencias"
  | "financeiro"
  | "documentos"
  | "backup"
  | "monthly-review"
  | "agenda"
  | "guidance"
  | "decisions";

export type MonthlyPlanItem = {
  slot: "hoje" | "semana" | "mes";
  title: string;
  reason: string;
  target: MonthlyPlanTarget;
  urgency: "critico" | "atencao" | "rotina";
};

export type LocalOperationalAlert = {
  id: string;
  title: string;
  body: string;
  target: MonthlyPlanTarget;
  severity: "critical" | "warning" | "info";
};

export type MonthlyPlan = {
  title: string;
  subtitle: string;
  items: MonthlyPlanItem[];
  alerts: LocalOperationalAlert[];
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - now.getTime()) / 86_400_000);
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function docDueDate(doc: DocumentoEssencial): string | undefined {
  return doc.dataVencimento || doc.vencimento?.value;
}

function docLabel(doc: DocumentoEssencial): string {
  return doc.id in DOCUMENTO_LABEL
    ? DOCUMENTO_LABEL[doc.id as keyof typeof DOCUMENTO_LABEL]
    : doc.id;
}

export function buildLocalOperationalAlerts(limit = 3): LocalOperationalAlert[] {
  const alerts: LocalOperationalAlert[] = [];
  const today = todayISO();

  const pendencias = getPendenciasAbertas();
  const overduePendencias = pendencias.filter((p) => p.dueDate && p.dueDate < today);
  if (overduePendencias.length > 0) {
    alerts.push({
      id: "pendencias_vencidas",
      title: `${overduePendencias.length} pendência${overduePendencias.length !== 1 ? "s" : ""} vencida${overduePendencias.length !== 1 ? "s" : ""}`,
      body: "Itens vencidos merecem triagem antes de novas tarefas.",
      target: "pendencias",
      severity: "critical",
    });
  }

  const stalePendencias = pendencias.filter((p) => daysSince(p.createdAt) !== null && daysSince(p.createdAt)! > 60);
  if (stalePendencias.length > 0) {
    alerts.push({
      id: "pendencias_antigas",
      title: `${stalePendencias.length} pendência${stalePendencias.length !== 1 ? "s" : ""} aberta${stalePendencias.length !== 1 ? "s" : ""} há mais de 60 dias`,
      body: "Pendências antigas tendem a se perder sem responsável ou próximo passo.",
      target: "pendencias",
      severity: "warning",
    });
  }

  const docs = getDocumentos();
  const docOverdue = docs.find((doc) => doc.status === "tenho" && docDueDate(doc) && docDueDate(doc)! < today);
  if (docOverdue) {
    alerts.push({
      id: `doc_vencido_${docOverdue.id}`,
      title: `Documento vencido: ${docLabel(docOverdue)}`,
      body: "Atualize o vencimento ou registre o plano de renovação.",
      target: "documentos",
      severity: "critical",
    });
  }

  const docSoon = docs
    .map((doc) => ({ doc, days: daysUntil(docDueDate(doc)) }))
    .filter((item) => item.doc.status === "tenho" && item.days !== null && item.days >= 0 && item.days <= 30)
    .sort((a, b) => a.days! - b.days!)[0];
  if (docSoon) {
    alerts.push({
      id: `doc_vencendo_${docSoon.doc.id}`,
      title: `${docLabel(docSoon.doc)} vence em ${docSoon.days} dia${docSoon.days !== 1 ? "s" : ""}`,
      body: "Antecipar renovação reduz risco operacional.",
      target: "documentos",
      severity: docSoon.days! <= 7 ? "critical" : "warning",
    });
  }

  const financialSnapshot = getCurrentFinancialSnapshot(currentMonthKey());
  const financialSummary = getFinancialSummary(currentMonthKey());
  const hasFinancialData =
    financialSnapshot.entries.length > 0 ||
    financialSnapshot.estimatedBalance !== 0 ||
    financialSnapshot.delinquencyRate !== undefined ||
    financialSnapshot.liquidityReserve !== undefined;
  if (!hasFinancialData) {
    alerts.push({
      id: "financial_snapshot_missing",
      title: "Resumo financeiro do mês ausente",
      body: "Registrar saldo, inadimplência e principais contas melhora o cockpit.",
      target: "financeiro",
      severity: "info",
    });
  } else if (financialSummary.alerts.length > 0) {
    const alert = financialSummary.alerts[0];
    alerts.push({
      id: `financial_${alert.id}`,
      title: alert.title,
      body: alert.reason,
      target: "financeiro",
      severity: alert.severity,
    });
  }

  const backupDays = daysSince(getLastBackupAt());
  if (backupDays === null || backupDays > 30) {
    alerts.push({
      id: "backup_overdue",
      title: backupDays === null ? "Nenhum backup exportado" : `Backup há ${backupDays} dias`,
      body: "Exporte uma cópia local para proteger o histórico do condomínio.",
      target: "backup",
      severity: backupDays !== null && backupDays > 60 ? "warning" : "info",
    });
  }

  const monthState = getMonthlyReviewState(currentMonthKey());
  const dayOfMonth = new Date().getDate();
  if (dayOfMonth >= 25 && monthState.status !== "concluida") {
    alerts.push({
      id: "monthly_review_pending",
      title: "Revisão mensal pendente",
      body: "Fechar a revisão ajuda a consolidar financeiro, documentos e próximos passos.",
      target: "monthly-review",
      severity: "warning",
    });
  }

  return alerts
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, limit);
}

export function buildMonthlyPlan(): MonthlyPlan {
  const alerts = buildLocalOperationalAlerts(5);
  const guidance = buildGuidanceEngine();
  const decisions = getRecentDecisions(5).filter((d) => d.status === "em_execucao" && !d.linkedPendenciaId);
  const financialSnapshot = getCurrentFinancialSnapshot(currentMonthKey());
  const financialSummary = getFinancialSummary(currentMonthKey());
  const hasFinancialData =
    financialSnapshot.entries.length > 0 ||
    financialSnapshot.estimatedBalance !== 0 ||
    financialSnapshot.delinquencyRate !== undefined ||
    financialSnapshot.liquidityReserve !== undefined;

  const todayAlert = alerts[0];
  const today: MonthlyPlanItem = todayAlert
    ? {
        slot: "hoje",
        title: todayAlert.title,
        reason: todayAlert.body,
        target: todayAlert.target,
        urgency: todayAlert.severity === "critical" ? "critico" : "atencao",
      }
    : {
        slot: "hoje",
        title: guidance.topTresHoje[0]?.titulo ?? "Revisar ações recomendadas",
        reason: guidance.topTresHoje[0]?.proximoPasso ?? "Faça uma leitura rápida dos riscos e próximos passos do prédio.",
        target: "guidance",
        urgency: guidance.topTresHoje[0]?.prioridade === "critico" ? "critico" : "rotina",
      };

  const week: MonthlyPlanItem =
    decisions.length > 0
      ? {
          slot: "semana",
          title: "Acompanhar decisão em execução",
          reason: decisions[0].title,
          target: "decisions",
          urgency: "atencao",
        }
      : financialSummary.contasProximas.length > 0
        ? {
            slot: "semana",
            title: `${financialSummary.contasProximas.length} conta${financialSummary.contasProximas.length !== 1 ? "s" : ""} vence${financialSummary.contasProximas.length === 1 ? "" : "m"} esta semana`,
            reason: "Prepare pagamento ou acompanhamento para evitar juros e improviso.",
            target: "financeiro",
            urgency: "atencao",
          }
        : {
            slot: "semana",
            title: "Revisar Guidance da semana",
            reason: guidance.microGuidance[0] ?? "Use as recomendações para manter a rotina em dia.",
            target: "guidance",
            urgency: "rotina",
          };

  const monthState = getMonthlyReviewState(currentMonthKey());
  const month: MonthlyPlanItem =
    !hasFinancialData
      ? {
          slot: "mes",
          title: "Registrar financeiro do mês",
          reason: "O resumo financeiro alimenta HealthScore, Guidance e revisão mensal.",
          target: "financeiro",
          urgency: "atencao",
        }
      : monthState.status !== "concluida"
        ? {
            slot: "mes",
            title: "Fechar revisão mensal",
            reason: "Consolide os pontos do mês sem transformar isso em prestação oficial.",
            target: "monthly-review",
            urgency: "rotina",
          }
        : {
            slot: "mes",
            title: "Exportar backup atualizado",
            reason: "Proteja os dados locais e preserve a memória institucional.",
            target: "backup",
            urgency: "rotina",
          };

  return {
    title: "Plano do mês",
    subtitle: "Três prioridades para manter o condomínio organizado sem depender da memória.",
    items: [today, week, month],
    alerts: alerts.slice(0, 3),
  };
}
