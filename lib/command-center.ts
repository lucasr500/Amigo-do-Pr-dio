// Command Center — agrega o estado operacional completo do condomínio.
// Fonte única de verdade para Home cockpit, CommandCenterPanel e SaudeScreen.
// Sem IA. Totalmente determinístico. Roda 100% client-side.

import { buildActionPlan, type ActionItem, type ActionPriority } from "@/lib/action-plan";
import {
  getNotifications,
  getPendenciasAbertas,
  getDocumentos,
  getFuncionarios,
  getMemoriaOperacional,
  getImplantacaoMode,
  getMemoriaAssistida,
  DOCUMENTOS_ESSENCIAIS_IDS,
  type AppNotification,
} from "@/lib/session";
import { computeHealthScore } from "@/lib/health-score";
import { STALE_TASK_DAYS } from "@/lib/health-config";

export type RiskLevel = "critico" | "atencao" | "estavel" | "sem-dados";

export type CommandAction = ActionItem & {
  sourceModule?: string; // "avcb" | "seguro" | "funcionarios" | "documentos" | "pendencias" | "rotina"
  resolveTarget?: "condominio" | "ferramentas" | "agenda" | "pendencias"; // aba para resolver
};

export type CommandCenterResult = {
  riskLevel: RiskLevel;
  topPriority: CommandAction | null;       // ação #1 mais urgente
  urgentActions: CommandAction[];          // prioridade = urgente
  thisWeekActions: CommandAction[];        // prioridade = este_mes
  allActions: CommandAction[];             // todas ordenadas
  criticalNotifications: AppNotification[]; // severity = critical, não dispensadas
  warningNotifications: AppNotification[]; // severity = warning, não dispensadas
  unreadCount: number;                     // total não lido
  summaryText: string;                     // frase humana do estado atual
  upgradeText: string;                     // caminho prático para melhorar
  stalePendenciasCount: number;
  missingDocsCount: number;
  overdueVacationsCount: number;
  healthPercentage: number;
  implantacaoPct: number;                  // % de implantação concluída
};

function buildResolveTarget(item: ActionItem): CommandAction["resolveTarget"] {
  const id = item.id;
  if (id.startsWith("avcb") || id.startsWith("seguro") || id.startsWith("mandato") ||
      id.startsWith("rotina") || id.startsWith("docs") || id.startsWith("funcionarios") ||
      id.startsWith("ferias")) return "condominio";
  if (id.startsWith("pendencias")) return "pendencias";
  return "condominio";
}

function buildSourceModule(item: ActionItem): string {
  const id = item.id;
  if (id.startsWith("avcb"))         return "avcb";
  if (id.startsWith("seguro"))       return "seguro";
  if (id.startsWith("mandato"))      return "mandato";
  if (id.startsWith("ferias") || id.startsWith("funcionarios")) return "funcionarios";
  if (id.startsWith("docs"))         return "documentos";
  if (id.startsWith("rotina"))       return "rotina";
  if (id.startsWith("guidance"))     return "alerta";
  if (id.startsWith("pendencias"))   return "pendencias";
  return "geral";
}

function computeImplantacaoPct(): number {
  const m       = getMemoriaOperacional();
  const profile = getImplantacaoMode(); // just to check if registered
  const assistida = getMemoriaAssistida();
  const docs    = getDocumentos();
  const funcs   = getFuncionarios();

  const checks = [
    !!(assistida.avcb?.value || m.vencimentoAVCB),
    !!(assistida.seguro?.value || m.vencimentoSeguro),
    !!(assistida.mandato?.value || m.fimMandatoSindico),
    docs.length > 0,
    docs.filter((d) => d.status === "tenho").length >= 3,
    funcs.length > 0,
    !!(m.administradora),
    !!(m.ultimaDedetizacao || m.ultimaLimpezaCaixaDAgua),
    !!(profile),
  ];

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function buildSummaryText(
  riskLevel: RiskLevel,
  urgentCount: number,
  stalePendencias: number,
  missingDocs: number,
  overdueVacations: number
): string {
  if (riskLevel === "sem-dados") {
    return "Configure os dados do prédio para ativar o monitoramento operacional.";
  }
  if (riskLevel === "critico") {
    const parts: string[] = [];
    if (urgentCount > 0) parts.push(`${urgentCount} ação${urgentCount > 1 ? "ões" : ""} urgente${urgentCount > 1 ? "s" : ""}`);
    if (overdueVacations > 0) parts.push(`férias vencidas`);
    return `Atenção: ${parts.join(", ")}. Resolva agora.`;
  }
  if (riskLevel === "atencao") {
    const parts: string[] = [];
    if (stalePendencias > 0) parts.push(`${stalePendencias} passo${stalePendencias > 1 ? "s" : ""} parado${stalePendencias > 1 ? "s" : ""}`);
    if (missingDocs > 0) parts.push(`${missingDocs} documento${missingDocs > 1 ? "s" : ""} a localizar`);
    return `Há pontos a resolver${parts.length ? ": " + parts.join(", ") : ""}.`;
  }
  return "Condomínio organizado. Mantenha os dados atualizados.";
}

function buildUpgradeText(
  healthPct: number,
  urgentActions: CommandAction[]
): string {
  if (urgentActions.length === 0) return "";
  const targetPct = Math.min(healthPct + 20, 100);
  const titles = urgentActions.slice(0, 2).map((a) => a.titulo.replace(/\s*—.*/, ""));
  return `Para subir de ${healthPct}% para ~${targetPct}%: ${titles.join("; ")}.`;
}

export function buildCommandCenter(): CommandCenterResult {
  const plan      = buildActionPlan();
  const health    = computeHealthScore();
  const pending   = getPendenciasAbertas();
  const docs      = getDocumentos();
  const funcs     = getFuncionarios();
  const allNotifs = getNotifications().filter((n) => !n.dismissed);

  const actions: CommandAction[] = plan.items.map((item) => ({
    ...item,
    sourceModule: buildSourceModule(item),
    resolveTarget: buildResolveTarget(item),
  }));

  const urgentActions   = actions.filter((a) => a.prioridade === "urgente");
  const thisWeekActions = actions.filter((a) => a.prioridade === "este_mes");
  const topPriority     = urgentActions[0] ?? thisWeekActions[0] ?? null;

  const criticalNotifications = allNotifs.filter((n) => n.severity === "critical");
  const warningNotifications  = allNotifs.filter((n) => n.severity === "warning");
  const unreadCount = allNotifs.filter((n) => !n.read).length;

  const stalePendencias  = pending.filter(
    (p) => Date.now() - new Date(p.createdAt).getTime() > STALE_TASK_DAYS * 86_400_000
  ).length;
  const missingDocs      = docs.filter((d) => d.status === "precisa_localizar" || d.status === "nao_tenho").length;
  const overdueVacations = funcs.filter((f) => f.status === "vencida").length;
  const implantacaoPct   = computeImplantacaoPct();

  const riskLevel: RiskLevel = (() => {
    const m = getMemoriaOperacional();
    const a = getMemoriaAssistida();
    const hasLegacy   = !!(m.vencimentoAVCB || m.vencimentoSeguro || m.fimMandatoSindico);
    const hasAssisted = !!(a.avcb || a.seguro || a.mandato);
    if (!hasLegacy && !hasAssisted) return "sem-dados";
    if (urgentActions.length > 0 || criticalNotifications.length > 0) return "critico";
    if (warningNotifications.length > 0 || stalePendencias > 0 || missingDocs > 2) return "atencao";
    return "estavel";
  })();

  const summaryText  = buildSummaryText(riskLevel, urgentActions.length, stalePendencias, missingDocs, overdueVacations);
  const upgradeText  = buildUpgradeText(health.percentage, urgentActions);

  return {
    riskLevel,
    topPriority,
    urgentActions,
    thisWeekActions,
    allActions: actions,
    criticalNotifications,
    warningNotifications,
    unreadCount,
    summaryText,
    upgradeText,
    stalePendenciasCount: stalePendencias,
    missingDocsCount: missingDocs,
    overdueVacationsCount: overdueVacations,
    healthPercentage: health.percentage,
    implantacaoPct,
  };
}
