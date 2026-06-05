import { hasMemoriaOperacional, hasProfile, getLastBackupAt } from "@/lib/session";
import { computeHealthScore } from "@/lib/health-score";
import { buildCommandCenter } from "@/lib/command-center";
import { getFinancialSummary, currentMonthKey } from "@/lib/financial";
import { getDocumentosSummary } from "@/lib/session-documentos";
import {
  getMonthlyReviewState,
  getLastCompletedMonthlyReview,
  type MonthlyReviewStateStatus,
} from "@/lib/session-monthly-review";
import { getUpcomingAgendaEvents } from "@/lib/session-agenda";
import { getPendenciasAbertas } from "@/lib/session-pendencias";
import { buildLocalIntegrityReport } from "@/lib/local-integrity";
import { todayISO } from "@/lib/session-core";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CondominioOverviewStatus = "bom" | "atencao" | "critico" | "incompleto";

export type CondominioOverviewMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  status: CondominioOverviewStatus;
  // Navigation target — section id OR tab name
  sectionTarget?: string;
  tabTarget?: "inicio" | "agenda" | "ferramentas";
};

export type CondominioOverviewModel = {
  headline: string;
  subtitle: string;
  status: CondominioOverviewStatus;
  healthScore?: number;
  healthLabel?: string;
  monthlyReview: {
    status: MonthlyReviewStateStatus;
    label: string;
    detail: string;
    score?: number;
  };
  nextAction?: {
    title: string;
    reason: string;
    cta: string;
    tabTarget?: "inicio" | "agenda" | "ferramentas" | "condominio";
    sectionTarget?: string;
  };
  metrics: CondominioOverviewMetric[];
  warnings: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(isoA: string, isoB: string): number {
  return Math.round((new Date(isoB).getTime() - new Date(isoA).getTime()) / 86400000);
}

function deriveStatus(
  healthPct: number,
  riskLevel: string,
  hasCriticalIntegrity: boolean,
  financialCritical: boolean,
  docsCriticalPending: boolean,
  urgentActionsCount: number,
): CondominioOverviewStatus {
  if (healthPct < 40 || riskLevel === "critico" || hasCriticalIntegrity || financialCritical) {
    return "critico";
  }
  if (healthPct < 70 || riskLevel === "atencao" || docsCriticalPending || urgentActionsCount > 0) {
    return "atencao";
  }
  return "bom";
}

const STATUS_HEADLINES: Record<CondominioOverviewStatus, string> = {
  bom:       "Prédio sob controle",
  atencao:   "Atenção a alguns pontos",
  critico:   "Há pontos críticos abertos",
  incompleto:"Ative o monitoramento",
};

// ─── Motor principal ──────────────────────────────────────────────────────────

export function buildCondominioOverview(): CondominioOverviewModel {
  // ── Verificação de dados ──────────────────────────────────────────────────
  const hasData = hasMemoriaOperacional() || hasProfile();

  if (!hasData) {
    return {
      headline:  "Ative o monitoramento",
      subtitle:  "Cadastre os dados essenciais para ver a saúde operacional do seu prédio.",
      status:    "incompleto",
      monthlyReview: {
        status: "pendente",
        label:  "Não iniciado",
        detail: "Configure o prédio para ativar a revisão mensal.",
      },
      metrics:  [],
      warnings: [],
    };
  }

  // ── Leitura de dados (cada chamada é leve e síncrona) ────────────────────
  const today = todayISO();
  const month = currentMonthKey();

  let health;
  try { health = computeHealthScore(); } catch { health = null; }

  let cmd;
  try { cmd = buildCommandCenter(); } catch { cmd = null; }

  let financial;
  try { financial = getFinancialSummary(month); } catch { financial = null; }

  let docSummary;
  try { docSummary = getDocumentosSummary(today); } catch { docSummary = null; }

  const reviewState   = getMonthlyReviewState(month);
  const lastReview    = getLastCompletedMonthlyReview();
  const upcomingEvents = getUpcomingAgendaEvents(15);
  const pendencias    = getPendenciasAbertas();
  const backupAt      = getLastBackupAt();

  let integrity;
  try { integrity = buildLocalIntegrityReport(); } catch { integrity = null; }

  // ── Status geral ─────────────────────────────────────────────────────────
  const healthPct        = health?.percentage ?? 50;
  const riskLevel        = cmd?.riskLevel ?? "sem-dados";
  const hasCriticalIntegrity = integrity?.issues.some((i) => i.severity === "critical") ?? false;
  const financialCritical = financial?.cashRisk === "critico";
  const docsCriticalPending = (docSummary?.criticosPendentes ?? 0) > 0;
  const urgentCount       = cmd?.urgentActions.length ?? 0;

  const status = deriveStatus(
    healthPct, riskLevel, hasCriticalIntegrity,
    financialCritical, docsCriticalPending, urgentCount,
  );

  const headline = STATUS_HEADLINES[status];
  const subtitle = cmd?.summaryText || health?.diagnosticPhrase || "Dados locais — controle auxiliar.";

  // ── Revisão mensal ────────────────────────────────────────────────────────
  const reviewStatus = reviewState.status;
  const reviewLabels: Record<MonthlyReviewStateStatus, string> = {
    pendente:     "Pendente",
    em_andamento: "Em andamento",
    concluida:    "Concluída",
  };
  const monthlyReview = {
    status: reviewStatus,
    label:  reviewLabels[reviewStatus],
    detail: lastReview
      ? `Último score: ${lastReview.score}/100`
      : reviewStatus === "concluida"
        ? "Concluída este mês"
        : "Inicie a revisão deste mês",
    score: lastReview?.score,
  };

  // ── Métricas compactas ────────────────────────────────────────────────────
  const metrics: CondominioOverviewMetric[] = [];

  // 1. Revisão
  metrics.push({
    id:      "revisao",
    label:   "Revisão",
    value:   reviewLabels[reviewStatus],
    detail:  lastReview ? `${lastReview.score}/100` : undefined,
    status:  reviewStatus === "concluida" ? "bom" : "atencao",
    sectionTarget: "revisao-mensal",
  });

  // 2. Financeiro
  if (financial) {
    const fStatus: CondominioOverviewStatus =
      financial.cashRisk === "critico" ? "critico" :
      financial.cashRisk === "atencao" ? "atencao" : "bom";
    metrics.push({
      id:     "financeiro",
      label:  "Financeiro",
      value:  financial.cashRisk === "critico" ? "Crítico"
            : financial.cashRisk === "atencao"  ? "Atenção"
            : "Em ordem",
      detail: financial.contasVencidas.length > 0
        ? `${financial.contasVencidas.length} vencida${financial.contasVencidas.length > 1 ? "s" : ""}`
        : undefined,
      status: fStatus,
      sectionTarget: "financeiro",
    });
  } else {
    metrics.push({
      id: "financeiro", label: "Financeiro",
      value: "Sem dados", status: "incompleto", sectionTarget: "financeiro",
    });
  }

  // 3. Documentos
  if (docSummary) {
    const dStatus: CondominioOverviewStatus =
      docSummary.criticosPendentes > 0 || docSummary.vencidos > 0 ? "critico" :
      docSummary.proximos > 0 || docSummary.faltam > 0 ? "atencao" : "bom";
    metrics.push({
      id:     "documentos",
      label:  "Documentos",
      value:  docSummary.criticosPendentes > 0
        ? `${docSummary.criticosPendentes} crítico${docSummary.criticosPendentes > 1 ? "s" : ""}`
        : `${docSummary.tenho}/${docSummary.total}`,
      detail: docSummary.vencidos > 0 ? `${docSummary.vencidos} vencido${docSummary.vencidos > 1 ? "s" : ""}` : undefined,
      status: dStatus,
      sectionTarget: "documentos",
    });
  } else {
    metrics.push({
      id: "documentos", label: "Documentos",
      value: "Sem dados", status: "incompleto", sectionTarget: "documentos",
    });
  }

  // 4. Agenda
  const nextEvent = upcomingEvents[0];
  const daysUntilNext = nextEvent ? daysBetween(today, nextEvent.date) : null;
  metrics.push({
    id:    "agenda",
    label: "Agenda",
    value: nextEvent ? "Há eventos" : "Livre",
    detail: daysUntilNext !== null
      ? (daysUntilNext <= 0 ? "Hoje" : `em ${daysUntilNext}d`)
      : undefined,
    status: daysUntilNext !== null && daysUntilNext <= 3 ? "atencao" : "bom",
    tabTarget: "agenda",
  });

  // 5. Pendências
  const overdueCount = pendencias.filter((p) => !!p.dueDate && p.dueDate <= today).length;
  metrics.push({
    id:     "pendencias",
    label:  "Pendências",
    value:  pendencias.length === 0 ? "Em dia" : `${pendencias.length} abertas`,
    detail: overdueCount > 0 ? `${overdueCount} vencida${overdueCount > 1 ? "s" : ""}` : undefined,
    status: overdueCount > 0 ? "critico" : pendencias.length > 3 ? "atencao" : pendencias.length > 0 ? "atencao" : "bom",
    tabTarget: "inicio",
  });

  // 6. Dados/Backup
  const daysSinceBackup = backupAt ? daysBetween(backupAt, today) : null;
  metrics.push({
    id:     "dados",
    label:  "Dados",
    value:  !backupAt ? "Sem backup"
          : daysSinceBackup !== null && daysSinceBackup > 30 ? "Backup antigo"
          : "Protegido",
    detail: daysSinceBackup !== null ? `há ${daysSinceBackup}d` : undefined,
    status: !backupAt || (daysSinceBackup !== null && daysSinceBackup > 60) ? "atencao" : "bom",
    sectionTarget: "dados",
  });

  // ── Próxima ação ──────────────────────────────────────────────────────────
  const topAction = cmd?.topPriority;
  const nextAction = topAction ? {
    title:  topAction.titulo,
    reason: topAction.motivo || topAction.descricao || "",
    cta:    topAction.cta || "Ver detalhes",
    tabTarget:     topAction.resolveTarget === "ferramentas" ? "ferramentas" as const
                 : topAction.resolveTarget === "agenda"      ? "agenda" as const
                 : topAction.resolveTarget === "pendencias"  ? "inicio" as const
                 : "condominio" as const,
    sectionTarget: topAction.resolveTarget === "condominio" ? "visao-geral" : undefined,
  } : undefined;

  // ── Warnings ─────────────────────────────────────────────────────────────
  const warnings: string[] = [];
  if (cmd?.urgentActions) {
    for (const a of cmd.urgentActions.slice(0, 2)) {
      if (a.titulo && !a.titulo.includes("senha") && !a.titulo.includes("login")) {
        warnings.push(a.titulo);
      }
    }
  }

  return {
    headline,
    subtitle,
    status,
    healthScore:  health?.percentage,
    healthLabel:  health?.statusLabel,
    monthlyReview,
    nextAction,
    metrics,
    warnings,
  };
}
