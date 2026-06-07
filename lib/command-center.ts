// Command Center — agrega o estado operacional completo do condomínio.
// Fonte única de verdade para Home cockpit, CommandCenterPanel e SaudeScreen.
// Sem IA. Totalmente determinístico. Roda 100% client-side.

import { buildActionPlan, type ActionItem, type ActionPriority } from "@/lib/action-plan";
import { buildGuidanceEngine, type GuidanceEngineItem } from "./guidance-engine";
export type { GuidanceEngineItem } from "./guidance-engine";
import {
  getNotifications,
  getPendenciasAbertas,
  getAgendaEvents,
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
import {
  getFinancialSummary,
  getMonthOverMonthComparison,
  getUpcomingBillsByWindow,
  getCurrentFinancialSnapshot,
  currentMonthKey,
} from "@/lib/financial";
import { buildLocalIntegrityReport } from "@/lib/local-integrity";
import {
  isDocumentoVencido,
  isDocumentoProximoVencimento,
  isDocumentoFaltante,
  getDocumentosSummary,
  DOCUMENTO_LABEL,
  DOCUMENTO_CRITICIDADE as DOC_CRITICIDADE,
} from "@/lib/session-documentos";
import { buildMonthlyReview } from "@/lib/monthly-review";
import {
  getMonthlyReviewState,
  getLastCompletedMonthlyReview,
  getMonthlyReviewTrend,
} from "@/lib/session-monthly-review";
import { KEYS } from "@/lib/session-core";

export type RiskLevel = "critico" | "atencao" | "estavel" | "sem-dados";

export type CommandAction = ActionItem & {
  sourceModule?: string; // "avcb" | "seguro" | "funcionarios" | "documentos" | "pendencias" | "rotina"
  resolveTarget?: "condominio" | "ferramentas" | "agenda" | "pendencias"; // aba para resolver
  motivo?: string;
  impacto?: string;
  cta?: string;
  origemDados?: string;
  scoreImpact?: string;
};

export type DailyFocusItem = {
  id: string;
  title: string;
  reason: string;
  target: "condominio" | "ferramentas" | "agenda" | "pendencias";
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
  todayFocus: DailyFocusItem[];
};

const FINANCIAL_STORAGE_KEY = "amigo_financial_snapshots";
export const COMMAND_CENTER_CACHE_TTL_MS = 15_000;

// Inclui apenas keys que afetam decisões operacionais.
// Exclui QUERIES, AUDIT_LOG, INTERACTIONS, STATS, SHARES (alta frequência, não afetam guidance).
const COMMAND_CENTER_SIGNATURE_KEYS = [
  KEYS.PROFILE,
  KEYS.MEMORIA,
  KEYS.MEMORIA_ASSISTIDA,
  KEYS.DOCUMENTOS,
  KEYS.FUNCIONARIOS,
  KEYS.MANUTENCOES,
  KEYS.PENDENCIAS,
  KEYS.OCORRENCIAS,
  KEYS.AGENDA,
  KEYS.NOTIFICATIONS,
  KEYS.MONTHLY_REVIEW_STATE,
  KEYS.REVISAO_SEMANAL,
  KEYS.HEALTH_HISTORY,
  FINANCIAL_STORAGE_KEY,
] as const;

type CommandCenterCacheEntry = {
  signature: string;
  createdAt: number;
  value: CommandCenterResult;
};

type CommandCenterCacheOptions = {
  force?: boolean;
  now?: number;
  build?: () => CommandCenterResult;
};

let commandCenterCache: CommandCenterCacheEntry | null = null;

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getCommandCenterSignature(today = new Date().toISOString().slice(0, 10)): string {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return `server:${today}`;
  }

  try {
    const parts = COMMAND_CENTER_SIGNATURE_KEYS.map((key) => {
      const raw = localStorage.getItem(key) ?? "";
      return `${key}:${raw.length}:${hashString(raw)}`;
    });
    return `${today}|${parts.join("|")}`;
  } catch {
    return `storage-unavailable:${today}`;
  }
}

export function clearCommandCenterCache(): void {
  commandCenterCache = null;
}

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
  const agenda    = getAgendaEvents();
  const docs      = getDocumentos();
  const funcs     = getFuncionarios();
  const allNotifs = getNotifications().filter((n) => !n.dismissed);
  const manutStatus = contarStatusManutencoes();

  const actions: CommandAction[] = plan.items.map((item) => ({
    ...item,
    sourceModule: buildSourceModule(item),
    resolveTarget: buildResolveTarget(item),
    motivo: item.descricao || "Este item aparece porque os dados locais indicam risco ou lacuna operacional.",
    impacto: item.prioridade === "urgente" ? "Reduz risco imediato e melhora a previsibilidade da rotina." : "Melhora a organização e evita esquecimento de prazos.",
    cta: "Resolver agora",
    origemDados: buildSourceModule(item),
    scoreImpact: item.prioridade === "urgente" ? "Pode melhorar o score operacional." : undefined,
  }));

  const financialSummary = getFinancialSummary();
  const integrity = buildLocalIntegrityReport();

  // ── Recomendações financeiras enriquecidas ────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const month = currentMonthKey();
  const financialSnapshot = getCurrentFinancialSnapshot(month);
  const mom = getMonthOverMonthComparison(month);
  const windows = getUpcomingBillsByWindow(financialSnapshot);
  const risk = financialSummary.cashRiskAnalysis;
  const hasFinancialData = financialSnapshot.entries.length > 0 || financialSnapshot.estimatedBalance !== 0;
  void today;

  // Alertas de risco já existentes (com texto enriquecido)
  for (const alert of financialSummary.alerts) {
    actions.push({
      id: alert.id,
      titulo: alert.title,
      descricao: alert.reason,
      prioridade: alert.severity === "critical" ? "urgente" : "este_mes",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: alert.reason,
      impacto: alert.impact,
      cta: "Revisar financeiro",
      origemDados: "financeiro",
    });
  }

  // Conta vencida de alto valor (>= R$ 5.000) — prioridade urgente
  const highValueOverdue = financialSummary.contasVencidas.filter((e) => e.amount >= 5000);
  if (highValueOverdue.length > 0) {
    const top = highValueOverdue.sort((a, b) => b.amount - a.amount)[0];
    actions.push({
      id: "financial_high_value_overdue",
      titulo: `Regularize conta vencida de alto valor: ${top.title}`,
      descricao: `Conta vencida de R$ ${top.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Risco de multa e interrupção de serviço.`,
      prioridade: "urgente",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: "Conta vencida de valor relevante representa risco operacional e financeiro imediato.",
      impacto: "Evita multa, juros e possível interrupção de serviço essencial.",
      cta: "Ver contas vencidas",
      origemDados: "financeiro",
    });
  }

  // Contas vencendo em 3 dias
  if (windows.next3Days.length > 0) {
    const total = windows.next3Days.reduce((s, e) => s + e.amount, 0);
    actions.push({
      id: "financial_bills_due_3days",
      titulo: `${windows.next3Days.length} conta${windows.next3Days.length > 1 ? "s" : ""} vencem nos próximos 3 dias`,
      descricao: `Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Prepare pagamento para evitar atraso.`,
      prioridade: "este_mes",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: "Conta próxima do vencimento requer ação imediata para evitar mora.",
      impacto: "Pagamento em dia evita multa, juros e comprometimento da reputação financeira.",
      cta: "Ver contas próximas",
      origemDados: "financeiro",
    });
  }

  // Risco crítico de caixa sem alerta já coberto
  if (risk.level === "crítico" && financialSummary.contasVencidas.length === 0 && financialSummary.estimatedBalance >= 0) {
    actions.push({
      id: "financial_cash_risk_critical",
      titulo: "Risco de caixa crítico identificado",
      descricao: risk.reasons.join(" "),
      prioridade: "urgente",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: risk.reasons[0] ?? "Indicadores financeiros apontam risco.",
      impacto: "Ação preventiva evita comprometimento do caixa operacional.",
      cta: "Revisar financeiro",
      origemDados: "financeiro",
    });
  }

  // Inadimplência alta sem alerta já coberto
  if ((financialSnapshot.delinquencyRate ?? 0) >= 20 && !financialSummary.alerts.some((a) => a.id === "financial_delinquency_high")) {
    actions.push({
      id: "financial_delinquency_critical",
      titulo: `Inadimplência de ${financialSnapshot.delinquencyRate}% está acima do aceitável`,
      descricao: "Inadimplência acima de 20% compromete previsibilidade de caixa e pode inviabilizar contratos.",
      prioridade: "urgente",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: "Nível de inadimplência informado é crítico para saúde financeira do condomínio.",
      impacto: "Priorize acordos e cobrança formal para recuperar previsibilidade de caixa.",
      cta: "Revisar inadimplência",
      origemDados: "financeiro",
    });
  }

  // MoM: piora relevante no saldo (>= R$ 2.000 de queda)
  if (mom.hasPreviousMonth && mom.balanceDelta <= -2000) {
    actions.push({
      id: "financial_balance_dropped",
      titulo: "Saldo estimado caiu em relação ao mês anterior",
      descricao: `Queda de R$ ${Math.abs(mom.balanceDelta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em relação a ${mom.previousMonth}.`,
      prioridade: "este_mes",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: "Queda relevante de saldo pode indicar aumento de despesas ou redução de arrecadação.",
      impacto: "Identifique a causa antes de aprovar novas despesas.",
      cta: "Ver comparação mensal",
      origemDados: "financeiro",
    });
  }

  // Financeiro sem dados — recomendar preenchimento
  if (!hasFinancialData) {
    actions.push({
      id: "financial_no_data",
      titulo: "Preencha o resumo financeiro do mês",
      descricao: "Sem dados financeiros não é possível avaliar saúde de caixa, risco ou contas próximas.",
      prioridade: "este_mes",
      categoria: "financeiro",
      sourceModule: "financeiro",
      resolveTarget: "condominio",
      motivo: "Dados financeiros ausentes impedem monitoramento operacional completo.",
      impacto: "Preencher ativa visão de risco, comparação mensal e recomendações automáticas.",
      cta: "Acessar financeiro",
      origemDados: "financeiro",
    });
  }
  for (const issue of integrity.issues.filter((item) => item.severity === "critical" || item.severity === "warning").slice(0, 3)) {
    actions.push({
      id: `integrity_${issue.id}`,
      titulo: issue.title,
      descricao: issue.detail,
      prioridade: issue.severity === "critical" ? "urgente" : "este_mes",
      categoria: issue.module === "financeiro" ? "financeiro" : "gestao",
      sourceModule: "integridade",
      resolveTarget: issue.module === "agenda" ? "agenda" : issue.module === "pendencias" ? "pendencias" : "condominio",
      motivo: issue.detail,
      impacto: "Aumenta confiabilidade dos dados locais e reduz risco de decisão com informação incompleta.",
      cta: "Revisar dados locais",
      origemDados: "integridade-local",
    });
  }

  // ── Recomendações documentais enriquecidas ────────────────────────────────
  {
    const docSummary = getDocumentosSummary();
    const docsPersistidos = getDocumentos();
    const docsMap = new Map(docsPersistidos.map((d) => [d.id, d]));
    const todayStr = new Date().toISOString().slice(0, 10);
    const pendenciasAbertas = getPendenciasAbertas();

    // Documento crítico vencido
    const criticosVencidos = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => {
      const doc = docsMap.get(id);
      return DOC_CRITICIDADE[id as DocumentoEssencialId] === "critica" && doc && isDocumentoVencido(doc, todayStr);
    });
    if (criticosVencidos.length > 0) {
      const id = criticosVencidos[0] as DocumentoEssencialId;
      const label = DOCUMENTO_LABEL[id];
      actions.push({
        id: "docs_critical_expired",
        titulo: `Regularize documento crítico vencido: ${label}`,
        descricao: "Documento obrigatório com vencimento ultrapassado representa risco legal e operacional.",
        prioridade: "urgente",
        categoria: "legal",
        sourceModule: "documentos",
        resolveTarget: "condominio",
        motivo: "Documento crítico vencido pode comprometer a regularidade do condomínio.",
        impacto: "Regularizar evita autuação, penalidade e responsabilidade do síndico.",
        cta: "Ver documentos",
        origemDados: "documentos",
      });
    }

    // Documento crítico ausente
    if (docSummary.criticosPendentes > 0) {
      actions.push({
        id: "docs_critical_missing",
        titulo: `${docSummary.criticosPendentes} documento${docSummary.criticosPendentes > 1 ? "s" : ""} crítico${docSummary.criticosPendentes > 1 ? "s" : ""} sem confirmar`,
        descricao: "Documentos críticos não localizados reduzem rastreabilidade operacional.",
        prioridade: "este_mes",
        categoria: "gestao",
        sourceModule: "documentos",
        resolveTarget: "condominio",
        motivo: "Documentos críticos ausentes são lacuna operacional relevante.",
        impacto: "Localizar e registrar garante rastreabilidade e reduz risco em auditorias.",
        cta: "Ver documentos críticos",
        origemDados: "documentos",
      });
    }

    // Documento próximo do vencimento (30 dias)
    const proximosVencimento = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => {
      const doc = docsMap.get(id);
      return doc && isDocumentoProximoVencimento(doc, 30, todayStr);
    });
    if (proximosVencimento.length > 0) {
      actions.push({
        id: "docs_expiring_soon",
        titulo: `${proximosVencimento.length} documento${proximosVencimento.length > 1 ? "s" : ""} vencem em 30 dias`,
        descricao: "Documentos próximos do vencimento requerem planejamento de renovação.",
        prioridade: "este_mes",
        categoria: "gestao",
        sourceModule: "documentos",
        resolveTarget: "condominio",
        motivo: "Vencimento próximo sem agendamento pode gerar irregularidade.",
        impacto: "Agendar renovação com antecedência evita multa e interrupção de cobertura.",
        cta: "Agendar renovações",
        origemDados: "documentos",
      });
    }

    // Documento vencido sem pendência aberta
    const vencidosSemPendencia = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => {
      const doc = docsMap.get(id);
      if (!doc || !isDocumentoVencido(doc, todayStr)) return false;
      return !pendenciasAbertas.some(
        (p) => (p.linkedType === "documento" && p.linkedId === id) || (p.origem === "documento" && p.matchedId === id)
      );
    });
    if (vencidosSemPendencia.length > 0 && criticosVencidos.length === 0) {
      actions.push({
        id: "docs_expired_no_task",
        titulo: `Crie pendência para ${vencidosSemPendencia.length} documento${vencidosSemPendencia.length > 1 ? "s" : ""} vencido${vencidosSemPendencia.length > 1 ? "s" : ""}`,
        descricao: "Documentos vencidos sem próximo passo ficam invisíveis na rotina operacional.",
        prioridade: "este_mes",
        categoria: "gestao",
        sourceModule: "documentos",
        resolveTarget: "condominio",
        motivo: "Vencimento sem registro de ação é lacuna operacional.",
        impacto: "Criar pendência mantém o documento no radar até regularização.",
        cta: "Ver documentos vencidos",
        origemDados: "documentos",
      });
    }

    void isDocumentoFaltante; // imported for panel — not needed here
  }

  // ── Revisão mensal ────────────────────────────────────────────────────────
  {
    const reviewState = getMonthlyReviewState(month);
    const review = buildMonthlyReview(month, reviewState.status);
    const lastCompleted = getLastCompletedMonthlyReview();
    const trend = getMonthlyReviewTrend();

    // Revisão com itens críticos — prioridade urgente (não duplica se já tem critical_review)
    if (review.criticalCount > 0 && reviewState.status !== "concluida") {
      actions.push({
        id: "monthly_review_critical",
        titulo: `Revisão mensal — ${review.criticalCount} ponto${review.criticalCount > 1 ? "s" : ""} crítico${review.criticalCount > 1 ? "s" : ""}`,
        descricao: review.recommendedFirstAction?.description ?? "Revisão mensal identificou itens urgentes.",
        prioridade: "urgente",
        categoria: "gestao",
        sourceModule: "revisao_mensal",
        resolveTarget: "condominio",
        motivo: "A revisão mensal identificou itens críticos que requerem ação.",
        impacto: "Resolver os pontos críticos reduz risco e mantém o condomínio organizado.",
        cta: "Fazer revisão mensal",
        origemDados: "revisao-mensal",
      });
    } else if (reviewState.status === "pendente" && new Date().getDate() >= 20) {
      // Nudge a partir do dia 20 se pendente — apenas se não há outra ação de revisão
      actions.push({
        id: "monthly_review_pending",
        titulo: "Revisão mensal deste mês ainda não foi iniciada",
        descricao: "Faça a revisão mensal para verificar financeiro, documentos, agenda e pendências.",
        prioridade: "este_mes",
        categoria: "gestao",
        sourceModule: "revisao_mensal",
        resolveTarget: "condominio",
        motivo: "Revisão mensal não realizada — prática de controle auxiliar recomendada.",
        impacto: "Abre visão consolidada de riscos e pontos de atenção do mês.",
        cta: "Iniciar revisão mensal",
        origemDados: "revisao-mensal",
      });
    } else if (reviewState.status === "em_andamento") {
      actions.push({
        id: "monthly_review_inprogress",
        titulo: "Revisão mensal em andamento",
        descricao: `${reviewState.checkedItems.length} de ${review.items.length} pontos verificados.`,
        prioridade: "este_mes",
        categoria: "gestao",
        sourceModule: "revisao_mensal",
        resolveTarget: "condominio",
        motivo: "Revisão mensal iniciada mas não concluída.",
        impacto: "Concluir a revisão mantém o condomínio bem acompanhado.",
        cta: "Continuar revisão",
        origemDados: "revisao-mensal",
      });
    }

    // Última revisão concluída há mais de 45 dias (novo mês ainda não iniciado)
    if (reviewState.status === "pendente" && lastCompleted) {
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(lastCompleted.completedAt).getTime()) / 86400000
      );
      if (daysSinceLast > 45 && !actions.some((a) => a.id.startsWith("monthly_review"))) {
        actions.push({
          id: "monthly_review_overdue_history",
          titulo: `Última revisão mensal foi há ${daysSinceLast} dias`,
          descricao: "A revisão mensal ajuda a identificar riscos e manter o condomínio organizado.",
          prioridade: "este_mes",
          categoria: "gestao",
          sourceModule: "revisao_mensal",
          resolveTarget: "condominio",
          motivo: `Sem revisão concluída há mais de ${daysSinceLast} dias.`,
          impacto: "Revisão regular mantém visibilidade sobre documentos, financeiro e pendências.",
          cta: "Fazer revisão mensal",
          origemDados: "revisao-mensal",
        });
      }
    }

    // Tendência piorando — sugestão leve (nunca urgente, não duplica)
    if (
      trend === "piorando" &&
      reviewState.status === "concluida" &&
      !actions.some((a) => a.id.startsWith("monthly_review"))
    ) {
      actions.push({
        id: "monthly_review_trend_down",
        titulo: "Score da revisão mensal caiu em relação ao mês anterior",
        descricao: "Verifique os pontos de atenção recorrentes para identificar a causa da queda.",
        prioridade: "este_mes",
        categoria: "gestao",
        sourceModule: "revisao_mensal",
        resolveTarget: "condominio",
        motivo: "Tendência de queda no score das revisões mensais.",
        impacto: "Identificar padrão recorrente permite ações preventivas antes que vire risco.",
        cta: "Ver histórico de revisões",
        origemDados: "revisao-mensal",
      });
    }
  }

  const sortedActions = [...actions].sort((a, b) => {
    const order: Record<ActionPriority, number> = { urgente: 0, este_mes: 1, proximos_90_dias: 2, quando_possivel: 3 };
    return order[a.prioridade] - order[b.prioridade];
  });
  const urgentActions   = sortedActions.filter((a) => a.prioridade === "urgente");
  const thisWeekActions = sortedActions.filter((a) => a.prioridade === "este_mes");
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

  const overdueAgenda = agenda.filter((event) => !event.completedAt && event.date < new Date().toISOString().slice(0, 10));
  const nextAgenda = agenda
    .filter((event) => !event.completedAt && event.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const todayFocus: DailyFocusItem[] = [];
  if (topPriority) {
    todayFocus.push({
      id: `top_${topPriority.id}`,
      title: topPriority.titulo,
      reason: topPriority.motivo || topPriority.descricao || "É a ação com maior prioridade no momento.",
      target: topPriority.resolveTarget ?? "condominio",
    });
  }
  if (overdueAgenda.length > 0) {
    todayFocus.push({
      id: "agenda_overdue",
      title: `${overdueAgenda.length} evento${overdueAgenda.length > 1 ? "s" : ""} vencido${overdueAgenda.length > 1 ? "s" : ""} na agenda`,
      reason: "Evento vencido sem fechamento vira ruído operacional e pode esconder manutenção pendente.",
      target: "agenda",
    });
  } else if (nextAgenda) {
    todayFocus.push({
      id: "agenda_next",
      title: `Próximo evento: ${nextAgenda.title}`,
      reason: `Está agendado para ${nextAgenda.date}; confira responsável e próximos passos.`,
      target: "agenda",
    });
  }
  if (financialSummary.alerts[0]) {
    todayFocus.push({
      id: `finance_${financialSummary.alerts[0].id}`,
      title: financialSummary.alerts[0].title,
      reason: financialSummary.alerts[0].reason,
      target: "condominio",
    });
  }
  if (integrity.issues[0]) {
    todayFocus.push({
      id: `integrity_${integrity.issues[0].id}`,
      title: integrity.issues[0].title,
      reason: integrity.issues[0].detail,
      target: integrity.issues[0].module === "agenda" ? "agenda" : integrity.issues[0].module === "pendencias" ? "pendencias" : "condominio",
    });
  }
  if (missingDocs > 0) {
    todayFocus.push({
      id: "docs_missing_focus",
      title: `${missingDocs} documento${missingDocs > 1 ? "s" : ""} a regularizar`,
      reason: "Documentos sem status reduzem confiança e limitam a leitura de risco do app.",
      target: "condominio",
    });
  }

  const riskLevel: RiskLevel = (() => {
    const m = getMemoriaOperacional();
    const a = getMemoriaAssistida();
    const hasLegacy   = !!(m.vencimentoAVCB || m.vencimentoSeguro || m.fimMandatoSindico);
    const hasAssisted = !!(a.avcb || a.seguro || a.mandato);
    if (!hasLegacy && !hasAssisted) return "sem-dados";
    if (urgentActions.length > 0 || criticalNotifications.length > 0 || financialSummary.cashRisk === "critico" || overdueAgenda.length > 0 || integrity.status === "critical") return "critico";
    if (warningNotifications.length > 0 || stalePendencias > 0 || missingDocs > 2 || integrity.status === "warning" || financialSummary.cashRisk === "atencao") return "atencao";
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
    allActions: sortedActions,
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
    todayFocus: todayFocus.slice(0, 3),
  };
}

export function buildCommandCenterCached(options: CommandCenterCacheOptions = {}): CommandCenterResult {
  const now = options.now ?? Date.now();
  const signature = getCommandCenterSignature();

  if (
    !options.force &&
    commandCenterCache &&
    commandCenterCache.signature === signature &&
    now - commandCenterCache.createdAt <= COMMAND_CENTER_CACHE_TTL_MS
  ) {
    return commandCenterCache.value;
  }

  try {
    const value = (options.build ?? buildCommandCenter)();
    commandCenterCache = { signature, createdAt: now, value };
    return value;
  } catch (error) {
    clearCommandCenterCache();
    throw error;
  }
}
