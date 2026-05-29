// Command Center — agrega o estado operacional completo do condomínio.
// Fonte única de verdade para Home cockpit, CommandCenterPanel e SaudeScreen.
// Sem IA. Totalmente determinístico. Roda 100% client-side.

import { buildActionPlan, type ActionItem, type ActionPriority } from "@/lib/action-plan";
import { buildGuidanceEngine, type GuidanceEngineItem } from "./guidance-engine";
export type { GuidanceEngineItem } from "./guidance-engine";
import {
  getNotifications,
  getPendenciasAbertas,
  getDocumentos,
  getFuncionarios,
  getManutencoes,
  getMemoriaOperacional,
  getImplantacaoMode,
  getMemoriaAssistida,
  getProfile,
  getOcorrencias,
  DOCUMENTOS_ESSENCIAIS_IDS,
  DOCUMENTO_CRITICIDADE,
  type AppNotification,
  type DocumentoEssencialId,
} from "@/lib/session";
import { computeHealthScore } from "@/lib/health-score";
import { STALE_TASK_DAYS } from "@/lib/health-config";
import { contarStatusManutencoes, temManutencaoCriticaAtrasada } from "@/lib/recorrencias";

export type RiskLevel = "critico" | "atencao" | "estavel" | "sem-dados";

export type CommandAction = ActionItem & {
  sourceModule?: string; // "avcb" | "seguro" | "funcionarios" | "documentos" | "pendencias" | "rotina"
  resolveTarget?: "condominio" | "ferramentas" | "agenda" | "pendencias"; // aba para resolver
};

export type CorrelacaoGap = {
  id: string;
  texto: string;
  prioridade: "critica" | "atencao" | "info";
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
  manutencoesAtrasadas: number;
  healthPercentage: number;
  implantacaoPct: number;                  // % de implantação concluída
  correlacoes: CorrelacaoGap[];            // lacunas detectadas por correlação
  // Síntese operacional — respostas humanas diretas
  todayAnswer: string;    // "O que eu faria hoje se fosse síndico deste prédio?"
  topRisco: string;       // Único maior risco atual
  maiorLacuna: string;    // Maior gap operacional
  maiorMelhoria: string;  // Melhor oportunidade de melhoria
  // Guidance engine — orientação operacional rica
  guidanceTopTres: GuidanceEngineItem[];
  guidanceTopRisco: GuidanceEngineItem | null;
  guidanceMaiorLacuna: GuidanceEngineItem | null;
  guidanceMaiorMelhoria: GuidanceEngineItem | null;
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

// Detecta lacunas operacionais por correlação de dados
function buildCorrelacoes(): CorrelacaoGap[] {
  const gaps: CorrelacaoGap[] = [];
  const profile = getProfile();
  const m = getMemoriaOperacional();
  const manutencoes = getManutencoes();
  const funcs = getFuncionarios();
  const docs = getDocumentos();

  // "Tem elevador mas não tem manutenção registrada"
  if (profile?.hasElevador) {
    const temManutElevador = manutencoes.some((x) => x.id === "manut_elevador" && x.ativo && x.ultimaExecucao);
    const temMemoriaElevador = !!m.ultimaManutencaoElevador;
    if (!temManutElevador && !temMemoriaElevador) {
      gaps.push({ id: "gap_elevador", texto: "Prédio com elevador sem manutenção mensal registrada.", prioridade: "critica" });
    }
  }

  // "Tem funcionários mas sem férias mapeadas"
  const funcsSemFerias = funcs.filter((f) => f.status === "desconhecida" || (!f.ultimasFeriasGozo && !f.periodoAquisitivo));
  if (funcs.length > 0 && funcsSemFerias.length === funcs.length) {
    gaps.push({ id: "gap_ferias", texto: `Existem ${funcs.length} funcionário${funcs.length > 1 ? "s" : ""} sem histórico de férias mapeado.`, prioridade: "atencao" });
  }

  // "Documentos críticos não localizados"
  const docsCriticosNaoConfirmados = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => {
    const isCritico = DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica";
    const doc = docs.find((d) => d.id === id);
    return isCritico && (!doc || doc.status === "nao_tenho");
  });
  if (docsCriticosNaoConfirmados.length >= 2) {
    gaps.push({ id: "gap_docs_criticos", texto: `${docsCriticosNaoConfirmados.length} documentos críticos (AVCB, seguro, convenção etc.) não confirmados.`, prioridade: "atencao" });
  }

  // "Manutenções recorrentes atrasadas"
  if (manutencoes.length > 0 && temManutencaoCriticaAtrasada()) {
    gaps.push({ id: "gap_manut_atrasada", texto: "Há manutenções críticas com prazo vencido.", prioridade: "critica" });
  }

  // "Recorrências cadastradas mas sem última execução"
  const manutSemExec = manutencoes.filter((x) => x.ativo && !x.ultimaExecucao).length;
  if (manutSemExec >= 3) {
    gaps.push({ id: "gap_manut_sem_exec", texto: `${manutSemExec} manutenções sem data de última execução — cobertura operacional incompleta.`, prioridade: "info" });
  }

  // "Ocorrência urgente registrada nos últimos 7 dias"
  const ocorrencias = getOcorrencias();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const urgentOcorrencias = ocorrencias.filter(
    (o) => o.prioridade === "alta" && o.createdAt >= cutoff7d
  );
  if (urgentOcorrencias.length > 0) {
    gaps.push({
      id: "gap_ocorrencia_urgente",
      texto: `${urgentOcorrencias.length} ocorrência${urgentOcorrencias.length > 1 ? "s" : ""} de prioridade alta registrada${urgentOcorrencias.length > 1 ? "s" : ""} nos últimos 7 dias.`,
      prioridade: "atencao",
    });
  }

  // "Perfil do condomínio incompleto"
  if (profile && !profile.numUnidades && !profile.tipoGestao) {
    gaps.push({ id: "gap_perfil_incompleto", texto: "Perfil do condomínio incompleto — complete para ativar orientações específicas.", prioridade: "info" });
  }

  return gaps;
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
  const manutStatus = contarStatusManutencoes();

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
  const correlacoes      = buildCorrelacoes();
  const engine           = buildGuidanceEngine();

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

  // ── Síntese operacional (derivada do guidance engine) ────────────────────

  // "O que eu faria hoje se fosse síndico deste prédio?"
  const todayAnswer = (() => {
    if (riskLevel === "sem-dados") {
      return "Cadastraria os dados do prédio: AVCB, seguro predial e fim do mandato. São os três pilares do monitoramento operacional.";
    }
    const top3 = engine.topTresHoje;
    if (top3.length > 0) {
      const top = top3[0];
      const extras = top3.slice(1).map((i) => i.titulo).join("; ");
      return extras ? `${top.proximoPasso} Depois: ${extras}.` : top.proximoPasso;
    }
    if (urgentActions.length > 0) {
      const top = urgentActions[0];
      return `Resolveria agora: ${top.titulo.replace(/\s*—.*/, "")}.`;
    }
    if (health.percentage < 85) {
      return "Prédio estável. Completaria a revisão semanal e atualizaria qualquer dado desatualizado.";
    }
    return "Prédio bem organizado. Manteria a rotina de revisão semanal e verificaria o calendário de manutenções.";
  })();

  const topRisco = engine.topRisco
    ? engine.topRisco.titulo
    : urgentActions.length > 0
      ? urgentActions[0].titulo.replace(/\s*—.*/, "")
      : overdueVacations > 0
        ? "Férias vencidas — passivo trabalhista acumulando"
        : "Nenhum risco crítico identificado no momento";

  const maiorLacuna = engine.maiorLacuna
    ? engine.maiorLacuna.titulo
    : docs.length === 0
      ? "Documentos essenciais sem mapeamento"
      : "Dados operacionais em bom nível de cobertura";

  const maiorMelhoria = engine.maiorMelhoria
    ? engine.maiorMelhoria.titulo
    : manutStatus.total === 0
      ? "Cadastrar manutenções recorrentes ativa o calendário operacional e adiciona até 15 pts ao score"
      : "Manter a revisão semanal em dia e o calendário de manutenções atualizado";

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
    manutencoesAtrasadas: manutStatus.atrasadas,
    healthPercentage: health.percentage,
    implantacaoPct,
    correlacoes,
    todayAnswer,
    topRisco,
    maiorLacuna,
    maiorMelhoria,
    guidanceTopTres: engine.topTresHoje,
    guidanceTopRisco: engine.topRisco,
    guidanceMaiorLacuna: engine.maiorLacuna,
    guidanceMaiorMelhoria: engine.maiorMelhoria,
  };
}
