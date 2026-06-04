// Regras determinísticas para geração de notificações.
// Cada regra produz zero ou uma notificação candidata.
// Sem IA — todas as regras são baseadas em dados do localStorage.

import {
  getMemoriaOperacional,
  getMemoriaAssistida,
  getDocumentos,
  getFuncionarios,
  getPendenciasAbertas,
  getWeeklyReviewState,
  getCurrentWeekKey,
  getMovimentacoes,
  getSaldoAtual,
  DOCUMENTOS_ESSENCIAIS_IDS,
} from "@/lib/session";
import type { AppNotification } from "@/lib/session";
import type { NotificationType } from "./notification-types";

type NotificationCandidate = Omit<AppNotification, "id" | "createdAt" | "read" | "dismissed">;

// Cooldown mínimo em ms entre re-geração do mesmo tipo de notificação.
// Previne spam ao reabrir o app várias vezes no mesmo dia.
const COOLDOWN_MS: Record<NotificationType, number> = {
  critical_deadline:      6 * 3_600_000,        // 6 horas
  weekly_review:          24 * 3_600_000,       // 24 horas
  monthly_review:         7 * 24 * 3_600_000,   // 7 dias
  overdue_document:       7 * 24 * 3_600_000,   // 7 dias
  overdue_vacation:       3 * 24 * 3_600_000,   // 3 dias
  implementation_gap:     7 * 24 * 3_600_000,   // 7 dias
  health_drop:            24 * 3_600_000,       // 24 horas
  stale_pending:          3 * 24 * 3_600_000,   // 3 dias
  routine_overdue:        7 * 24 * 3_600_000,   // 7 dias
  onboarding_incomplete:  7 * 24 * 3_600_000,   // 7 dias
  financial_alert:        7 * 24 * 3_600_000,   // 7 dias
};

export type CooldownMap = Partial<Record<string, number>>; // tipo → lastGeneratedMs

function daysUntil(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

function daysSince(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const d = isoDate.length === 10 ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / 86_400_000);
}

// Verifica se a notificação do tipo indicado já foi gerada dentro do cooldown.
function isCoolingDown(
  type: NotificationType,
  key: string,
  lastGeneratedMap: CooldownMap
): boolean {
  const lastMs = lastGeneratedMap[key];
  if (!lastMs) return false;
  return Date.now() - lastMs < COOLDOWN_MS[type];
}

// Avalia todas as regras e retorna os candidatos que passaram o cooldown.
export function evaluateNotificationRules(
  existingNotifications: AppNotification[],
  cooldownMap: CooldownMap
): NotificationCandidate[] {
  const m         = getMemoriaOperacional();
  const assistida = getMemoriaAssistida();
  const docs      = getDocumentos();
  const funcs     = getFuncionarios();
  const pendencias = getPendenciasAbertas();
  const weekKey   = getCurrentWeekKey();
  const weekly    = getWeeklyReviewState();

  const candidates: NotificationCandidate[] = [];

  // ── Regra 1: AVCB vencido ou vencendo ─────────────────────────────────────
  const avcbDate  = assistida.avcb?.value || m.vencimentoAVCB;
  const avcbDays  = daysUntil(avcbDate);
  const avcbKey   = "critical_deadline:avcb";
  if (!isCoolingDown("critical_deadline", avcbKey, cooldownMap)) {
    if (avcbDate && avcbDays !== null && avcbDays <= 30) {
      candidates.push({
        type: "critical_deadline",
        severity: avcbDays <= 0 ? "critical" : "warning",
        title: avcbDays <= 0 ? "AVCB vencido" : `AVCB vence em ${avcbDays} dia${avcbDays !== 1 ? "s" : ""}`,
        body: avcbDays <= 0
          ? "O AVCB do condomínio está vencido. Renove com urgência para evitar irregularidade."
          : "O AVCB está próximo do vencimento. Inicie o processo de renovação.",
        sourceModule: "memoria",
        actionKey: "open_memoria",
      });
    } else if (!avcbDate && assistida.avcb?.status !== "not_applicable") {
      candidates.push({
        type: "critical_deadline",
        severity: "info",
        title: "AVCB não cadastrado",
        body: "Registre a data de vencimento do AVCB para monitoramento de prazo.",
        sourceModule: "memoria",
        actionKey: "open_memoria",
      });
    }
  }

  // ── Regra 2: Seguro predial vencido ou vencendo ────────────────────────────
  const seguroDate = assistida.seguro?.value || m.vencimentoSeguro;
  const seguroDays = daysUntil(seguroDate);
  const seguroKey  = "critical_deadline:seguro";
  if (!isCoolingDown("critical_deadline", seguroKey, cooldownMap)) {
    if (seguroDate && seguroDays !== null && seguroDays <= 30) {
      candidates.push({
        type: "critical_deadline",
        severity: seguroDays <= 0 ? "critical" : "warning",
        title: seguroDays <= 0 ? "Seguro predial vencido" : `Seguro vence em ${seguroDays} dia${seguroDays !== 1 ? "s" : ""}`,
        body: seguroDays <= 0
          ? "O seguro predial está vencido. Condomínio em risco legal."
          : "Seguro predial próximo do vencimento. Contate a seguradora.",
        sourceModule: "memoria",
        actionKey: "open_memoria",
      });
    }
  }

  // ── Regra 3: Revisão semanal não feita ────────────────────────────────────
  const reviewKey = "weekly_review:current";
  const reviewDone = weekly.lastCompletedWeekKey === weekKey;
  if (!reviewDone && !isCoolingDown("weekly_review", reviewKey, cooldownMap)) {
    candidates.push({
      type: "weekly_review",
      severity: "info",
      title: "Revisão semanal pendente",
      body: "Você ainda não fez a revisão desta semana. Leva menos de 2 minutos.",
      sourceModule: "revisao",
      actionKey: "open_revisao_semanal",
    });
  }

  // ── Regra 4: Funcionários com férias vencidas ─────────────────────────────
  const funcsVencidas = funcs.filter((f) => f.status === "vencida");
  const funcKey = "overdue_vacation:vencidas";
  if (funcsVencidas.length > 0 && !isCoolingDown("overdue_vacation", funcKey, cooldownMap)) {
    candidates.push({
      type: "overdue_vacation",
      severity: "critical",
      title: `Férias vencidas (${funcsVencidas.length} funcionário${funcsVencidas.length > 1 ? "s" : ""})`,
      body: "Férias vencidas geram passivo trabalhista. Conceda ou pague em dobro.",
      sourceModule: "funcionarios",
      actionKey: "open_funcionarios",
    });
  }

  // ── Regra 5: Documentos essenciais não mapeados ───────────────────────────
  const docsRegistrados = docs.length;
  const docKey = "overdue_document:unmapped";
  if (docsRegistrados === 0 && !isCoolingDown("overdue_document", docKey, cooldownMap)) {
    candidates.push({
      type: "overdue_document",
      severity: "info",
      title: "Documentos não mapeados",
      body: `${DOCUMENTOS_ESSENCIAIS_IDS.length} documentos essenciais aguardam mapeamento de status.`,
      sourceModule: "documentos",
      actionKey: "open_documentos",
    });
  }

  // ── Regra 6: Próximos passos parados há >21 dias ─────────────────────────
  const STALE_DAYS = 21;
  const stalePendencias = pendencias.filter(
    (p) => (daysSince(p.createdAt) ?? 0) > STALE_DAYS
  );
  const staleKey = "stale_pending:old";
  if (stalePendencias.length > 0 && !isCoolingDown("stale_pending", staleKey, cooldownMap)) {
    candidates.push({
      type: "stale_pending",
      severity: "warning",
      title: `${stalePendencias.length} próximo${stalePendencias.length > 1 ? "s passos parados" : " passo parado"}`,
      body: `Há ${stalePendencias.length} próximo${stalePendencias.length > 1 ? "s passos" : " passo"} sem atualização há +${STALE_DAYS} dias.`,
      sourceModule: "pendencias",
      actionKey: "open_pendencias",
    });
  }

  // ── Regra 7: Manutenções críticas em atraso ───────────────────────────────
  const elevadorDays = daysSince(m.ultimaManutencaoElevador);
  const elevadorKey  = "routine_overdue:elevador";
  if (
    m.ultimaManutencaoElevador &&
    elevadorDays !== null &&
    elevadorDays > 45 &&
    !isCoolingDown("routine_overdue", elevadorKey, cooldownMap)
  ) {
    candidates.push({
      type: "routine_overdue",
      severity: "warning",
      title: "Manutenção do elevador em atraso",
      body: `Última manutenção foi há ${elevadorDays} dias. Recomendado a cada 30 dias.`,
      sourceModule: "memoria",
      actionKey: "open_memoria",
    });
  }

  // ── Regras 8–10: Financeiro ───────────────────────────────────────────────
  const movimentacoes = getMovimentacoes();

  // Regra 8: Nenhum dado financeiro registrado (informativo)
  const finSemDadosKey = "financial_alert:sem_dados";
  if (movimentacoes.length === 0 && !isCoolingDown("financial_alert", finSemDadosKey, cooldownMap)) {
    candidates.push({
      type: "financial_alert",
      severity: "info",
      title: "Módulo financeiro disponível",
      body: "Registre receitas e despesas para ativar o monitoramento da saúde financeira do condomínio.",
      sourceModule: "financeiro",
      actionKey: "open_financeiro",
    });
  }

  // Regra 9: Dados financeiros desatualizados (> 60 dias sem movimentação)
  if (movimentacoes.length > 0) {
    const sorted    = [...movimentacoes].sort((a, b) => b.data.localeCompare(a.data));
    const ultima    = sorted[0].data;
    const diasSince = daysSince(ultima) ?? 0;
    const finStaleKey = "financial_alert:stale";
    if (diasSince > 60 && !isCoolingDown("financial_alert", finStaleKey, cooldownMap)) {
      candidates.push({
        type: "financial_alert",
        severity: "warning",
        title: `Financeiro desatualizado há ${diasSince} dias`,
        body: "Registre movimentações recentes para manter o monitoramento financeiro ativo.",
        sourceModule: "financeiro",
        actionKey: "open_financeiro",
      });
    }

    // Regra 10: Saldo negativo
    const saldo = getSaldoAtual();
    const finNegKey = "financial_alert:negativo";
    if (saldo < 0 && !isCoolingDown("financial_alert", finNegKey, cooldownMap)) {
      candidates.push({
        type: "financial_alert",
        severity: "critical",
        title: "Saldo financeiro negativo",
        body: "As despesas registradas superam as receitas. Revise os lançamentos e a arrecadação.",
        sourceModule: "financeiro",
        actionKey: "open_financeiro",
      });
    }
  }

  // Filtra notificações que já existem e não estão dismissed (evita duplicatas visuais)
  const activeTypes = new Set(
    existingNotifications
      .filter((n) => !n.dismissed)
      .map((n) => n.type + ":" + (n.actionKey ?? ""))
  );

  return candidates.filter(
    (c) => !activeTypes.has(c.type + ":" + (c.actionKey ?? ""))
  );
}
