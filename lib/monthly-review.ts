// Motor de revisão mensal — análise determinística, local-first.
// Sem IA, sem Supabase, sem side effects. Puro e testável.

import { currentMonthKey, getFinancialSummary } from "@/lib/financial";
import { todayISO } from "@/lib/session-core";
import {
  getDocumentos,
  isDocumentoVencido,
  isDocumentoProximoVencimento,
  DOCUMENTO_CRITICIDADE,
  DOCUMENTO_LABEL,
  DOCUMENTOS_ESSENCIAIS_IDS,
  type DocumentoEssencialId,
} from "@/lib/session-documentos";
import { getPendencias } from "@/lib/session-pendencias";
import { getAgendaEvents } from "@/lib/session-agenda";
import { getMemoriaOperacional, getMemoriaAssistida } from "@/lib/session";
import { STALE_TASK_DAYS } from "@/lib/health-config";
import { buildLocalIntegrityReport } from "@/lib/local-integrity";
import { getRequests } from "@/lib/community-requests";
import { getActivePosts, getComments } from "@/lib/community-posts";

export type MonthlyReviewStatus = "pendente" | "em_andamento" | "concluida";

export type MonthlyReviewSectionKey =
  | "financeiro"
  | "documentos"
  | "agenda"
  | "pendencias"
  | "integridade"
  | "comunidade"
  | "resumo";

export type MonthlyReviewSeverity = "info" | "warning" | "critical";

export type MonthlyReviewItem = {
  id: string;
  section: MonthlyReviewSectionKey;
  title: string;
  description: string;
  severity: MonthlyReviewSeverity;
  actionLabel?: string;
  actionTarget?: "condominio" | "agenda" | "pendencias" | "financeiro";
};

export type MonthlyReviewReport = {
  month: string;
  status: MonthlyReviewStatus;
  score: number;
  headline: string;
  summary: string;
  items: MonthlyReviewItem[];
  sections: Record<MonthlyReviewSectionKey, MonthlyReviewItem[]>;
  recommendedFirstAction?: MonthlyReviewItem;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
};

// ─── Helpers internos ─────────────────────────────────────────────────────────

function makeItem(
  id: string,
  section: MonthlyReviewSectionKey,
  title: string,
  description: string,
  severity: MonthlyReviewSeverity,
  actionLabel?: string,
  actionTarget?: MonthlyReviewItem["actionTarget"]
): MonthlyReviewItem {
  return { id, section, title, description, severity, actionLabel, actionTarget };
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function isPast(iso: string, today: string): boolean {
  return iso < today;
}

// ─── Seções de análise ────────────────────────────────────────────────────────

function buildFinancialItems(): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];
  const month = currentMonthKey();

  let summary: ReturnType<typeof getFinancialSummary> | null = null;
  try { summary = getFinancialSummary(month); } catch { return items; }
  if (!summary) return items;

  const hasData = summary.totalReceitas > 0 || summary.totalDespesas > 0 ||
    summary.estimatedBalance !== 0 || summary.contasVencidas.length > 0;

  if (!hasData) {
    items.push(makeItem(
      "fin_no_data", "financeiro",
      "Financeiro deste mês não preenchido",
      "Sem dados financeiros não é possível avaliar saúde de caixa nem risco.",
      "info", "Acessar financeiro", "condominio"
    ));
    return items;
  }

  // Contas vencidas
  if (summary.contasVencidas.length > 0) {
    const total = summary.contasVencidas.reduce((s, e) => s + e.amount, 0);
    items.push(makeItem(
      "fin_overdue", "financeiro",
      `${summary.contasVencidas.length} conta${summary.contasVencidas.length > 1 ? "s" : ""} vencida${summary.contasVencidas.length > 1 ? "s" : ""}`,
      `Total de R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em atraso. Regularize para evitar multa e interrupção de serviço.`,
      "critical", "Ver contas vencidas", "condominio"
    ));
  }

  // Risco crítico de caixa
  if (summary.cashRisk === "critico" || summary.cashRiskAnalysis.level === "crítico") {
    items.push(makeItem(
      "fin_cash_risk", "financeiro",
      "Risco de caixa crítico",
      summary.cashRiskAnalysis.reasons[0] ?? "Indicadores financeiros apontam risco de caixa.",
      "critical", "Revisar financeiro", "condominio"
    ));
  } else if (summary.cashRisk === "atencao" || summary.cashRiskAnalysis.level === "atenção") {
    items.push(makeItem(
      "fin_cash_attention", "financeiro",
      "Atenção ao caixa",
      summary.cashRiskAnalysis.reasons[0] ?? "Caixa requer monitoramento próximo.",
      "warning", "Revisar financeiro", "condominio"
    ));
  }

  // Contas próximas (3 dias)
  const proximas3d = summary.contasProximas.filter((e) => {
    if (!e.dueDate) return false;
    const diff = Math.floor((new Date(e.dueDate).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 3;
  });
  if (proximas3d.length > 0) {
    const total = proximas3d.reduce((s, e) => s + e.amount, 0);
    items.push(makeItem(
      "fin_due_soon", "financeiro",
      `${proximas3d.length} conta${proximas3d.length > 1 ? "s" : ""} vence${proximas3d.length > 1 ? "m" : ""} em até 3 dias`,
      `Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Prepare o pagamento para evitar atraso.`,
      "warning", "Ver contas próximas", "condominio"
    ));
  }

  // Inadimplência alta
  if ((summary.delinquencyRate ?? 0) >= 20) {
    items.push(makeItem(
      "fin_delinquency", "financeiro",
      `Inadimplência de ${summary.delinquencyRate}% está acima do aceitável`,
      "Inadimplência acima de 20% compromete previsibilidade de caixa.",
      "critical", "Revisar inadimplência", "condominio"
    ));
  } else if ((summary.delinquencyRate ?? 0) >= 10) {
    items.push(makeItem(
      "fin_delinquency_atencao", "financeiro",
      `Inadimplência de ${summary.delinquencyRate}% requer acompanhamento`,
      "Acompanhe de perto para evitar impacto no caixa.",
      "warning", "Revisar inadimplência", "condominio"
    ));
  }

  // Alertas financeiros adicionais
  for (const alert of summary.alerts.slice(0, 2)) {
    if (items.some((i) => i.id === `fin_alert_${alert.id}`)) continue;
    items.push(makeItem(
      `fin_alert_${alert.id}`, "financeiro",
      alert.title, alert.reason,
      alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "info",
      "Ver financeiro", "condominio"
    ));
  }

  return items;
}

function buildDocumentosItems(today: string): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];
  const docs = getDocumentos();
  const docsMap = new Map(docs.map((d) => [d.id, d]));

  for (const rawId of DOCUMENTOS_ESSENCIAIS_IDS) {
    const id = rawId as DocumentoEssencialId;
    const doc = docsMap.get(id);
    const criticidade = DOCUMENTO_CRITICIDADE[id];
    const label = DOCUMENTO_LABEL[id];

    if (!doc || doc.status === "nao_tenho" || doc.status === "precisa_localizar") {
      if (criticidade === "critica") {
        items.push(makeItem(
          `doc_missing_${id}`, "documentos",
          `${label} não localizado`,
          "Documento crítico não confirmado no sistema. Localize ou atualize o status.",
          "critical", "Ver documentos", "condominio"
        ));
      }
      continue;
    }

    if (doc.status === "nao_se_aplica") continue;

    if (isDocumentoVencido(doc, today)) {
      const severity = criticidade === "critica" ? "critical" : "warning";
      items.push(makeItem(
        `doc_expired_${id}`, "documentos",
        `${label} — vencido`,
        "Documento com vencimento ultrapassado. Regularize para manter conformidade operacional.",
        severity, "Ver documentos", "condominio"
      ));
    } else if (isDocumentoProximoVencimento(doc, 60, today)) {
      const severity = criticidade === "critica" ? "warning" : "info";
      items.push(makeItem(
        `doc_expiring_${id}`, "documentos",
        `${label} — vence em breve`,
        "Documento vence em menos de 60 dias. Providencie renovação com antecedência.",
        severity, "Ver documentos", "condominio"
      ));
    }
  }

  // Documentos sem revisão recente (sem reviewedAt ou > 90 dias)
  const semRevisaoRecente = docs.filter((d) => {
    if (d.status !== "tenho") return false;
    if (!d.reviewedAt) return true;
    return daysAgo(d.reviewedAt) > 90;
  });
  if (semRevisaoRecente.length >= 3) {
    items.push(makeItem(
      "doc_not_reviewed", "documentos",
      `${semRevisaoRecente.length} documentos sem revisão nos últimos 90 dias`,
      "Revise periodicamente para garantir que os dados estão atualizados.",
      "info", "Ver documentos", "condominio"
    ));
  }

  return items;
}

function buildAgendaItems(today: string): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];
  const events = getAgendaEvents();

  const atrasados = events.filter((e) => !e.completedAt && isPast(e.date, today));
  if (atrasados.length > 0) {
    const alta = atrasados.filter((e) => e.prioridade === "critica" || e.prioridade === "alta");
    if (alta.length > 0) {
      items.push(makeItem(
        "agenda_overdue_high", "agenda",
        `${alta.length} evento${alta.length > 1 ? "s" : ""} prioritário${alta.length > 1 ? "s" : ""} em atraso`,
        `${alta.map((e) => e.title).slice(0, 2).join(", ")}${alta.length > 2 ? " e outros" : ""}. Revise e marque como concluído ou reagende.`,
        "critical", "Ver agenda", "agenda"
      ));
    } else {
      items.push(makeItem(
        "agenda_overdue", "agenda",
        `${atrasados.length} evento${atrasados.length > 1 ? "s" : ""} com data passada sem conclusão`,
        "Eventos passados não marcados como concluídos. Revise se foram realizados.",
        "warning", "Ver agenda", "agenda"
      ));
    }
  }

  // Próximos 7 dias
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const futureDateStr = futureDate.toISOString().slice(0, 10);
  const proximos = events.filter((e) => !e.completedAt && e.date > today && e.date <= futureDateStr);
  if (proximos.length > 0) {
    items.push(makeItem(
      "agenda_upcoming", "agenda",
      `${proximos.length} evento${proximos.length > 1 ? "s" : ""} na próxima semana`,
      proximos.slice(0, 2).map((e) => e.title).join(", ") + (proximos.length > 2 ? " e outros" : "") + ".",
      "info", "Ver agenda", "agenda"
    ));
  }

  return items;
}

function buildPendenciasItems(today: string): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];
  const pendencias = getPendencias().filter((p) => p.status === "aberta");

  // Vencidas
  const vencidas = pendencias.filter((p) => p.dueDate && p.dueDate < today);
  if (vencidas.length > 0) {
    const criticas = vencidas.filter((p) => p.prioridade === "critica" || p.prioridade === "alta");
    if (criticas.length > 0) {
      items.push(makeItem(
        "pend_overdue_critica", "pendencias",
        `${criticas.length} pendência${criticas.length > 1 ? "s" : ""} crítica${criticas.length > 1 ? "s" : ""} vencida${criticas.length > 1 ? "s" : ""}`,
        `${criticas.slice(0, 2).map((p) => p.titulo).join(", ")}${criticas.length > 2 ? " e outras" : ""}. Resolva com urgência.`,
        "critical", "Ver pendências", "pendencias"
      ));
    } else {
      items.push(makeItem(
        "pend_overdue", "pendencias",
        `${vencidas.length} pendência${vencidas.length > 1 ? "s" : ""} com prazo vencido`,
        "Pendências com data de vencimento ultrapassada. Resolva ou reagende.",
        "warning", "Ver pendências", "pendencias"
      ));
    }
  }

  // Pendências antigas (> STALE_TASK_DAYS)
  const antigas = pendencias.filter((p) => daysAgo(p.createdAt) > STALE_TASK_DAYS && !(p.dueDate && p.dueDate < today));
  if (antigas.length >= 3) {
    items.push(makeItem(
      "pend_stale", "pendencias",
      `${antigas.length} pendência${antigas.length > 1 ? "s" : ""} parada${antigas.length > 1 ? "s" : ""} há mais de ${STALE_TASK_DAYS} dias`,
      "Pendências sem progresso há muito tempo. Avance, delegue ou arquive.",
      "warning", "Ver pendências", "pendencias"
    ));
  }

  // Sem responsável (volume alto)
  const semResponsavel = pendencias.filter((p) => !p.responsavel);
  if (semResponsavel.length >= 5) {
    items.push(makeItem(
      "pend_no_owner", "pendencias",
      `${semResponsavel.length} pendências sem responsável definido`,
      "Atribuir responsável aumenta a probabilidade de resolução.",
      "info", "Ver pendências", "pendencias"
    ));
  }

  // Volume elevado de abertas
  if (pendencias.length >= 20) {
    items.push(makeItem(
      "pend_volume", "pendencias",
      `${pendencias.length} pendências abertas no total`,
      "Volume elevado. Considere revisar e arquivar o que não é mais relevante.",
      "info", "Ver pendências", "pendencias"
    ));
  }

  return items;
}

function buildIntegridadeItems(): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];

  let report: ReturnType<typeof buildLocalIntegrityReport> | null = null;
  try {
    report = buildLocalIntegrityReport();
  } catch {
    return items;
  }

  if (!report) return items;

  for (const issue of report.issues.filter((i) => i.severity === "critical" || i.severity === "warning").slice(0, 3)) {
    items.push(makeItem(
      `integ_${issue.id}`, "integridade",
      issue.title, issue.detail,
      issue.severity === "critical" ? "critical" : "warning",
      "Verificar integridade", "condominio"
    ));
  }

  if (report.score < 60) {
    items.push(makeItem(
      "integ_score_low", "integridade",
      `Score de integridade local: ${report.score}/100`,
      "Dados locais com baixa integridade. Revise e faça backup para proteger as informações.",
      "warning", "Verificar dados", "condominio"
    ));
  }

  return items;
}

// ─── Seção prospectiva — próximos 30 dias ────────────────────────────────────

function buildProspectivaItems(today: string): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];

  function daysUntil(iso: string | undefined): number | null {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const now = new Date(today + "T00:00:00");
    return Math.floor((d.getTime() - now.getTime()) / 86400000);
  }

  const m        = getMemoriaOperacional();
  const assistida = getMemoriaAssistida();

  const avcbDate    = m.vencimentoAVCB || assistida.avcb?.value;
  const seguroDate  = m.vencimentoSeguro || assistida.seguro?.value;
  const mandatoDate = m.fimMandatoSindico || assistida.mandato?.value;

  const avcbDays    = daysUntil(avcbDate);
  const seguroDays  = daysUntil(seguroDate);
  const mandatoDays = daysUntil(mandatoDate);

  // AVCB vencendo nos próximos 30 dias
  if (avcbDays !== null && avcbDays > 0 && avcbDays <= 30) {
    items.push(makeItem(
      "prosp_avcb", "agenda",
      `AVCB vence em ${avcbDays} dia${avcbDays !== 1 ? "s" : ""}`,
      "Inicie o processo de renovação agora para evitar vencimento durante a tramitação.",
      avcbDays <= 7 ? "critical" : "warning", "Ver datas", "condominio"
    ));
  }

  // Seguro vencendo nos próximos 30 dias
  if (seguroDays !== null && seguroDays > 0 && seguroDays <= 30) {
    items.push(makeItem(
      "prosp_seguro", "agenda",
      `Seguro predial vence em ${seguroDays} dia${seguroDays !== 1 ? "s" : ""}`,
      "Contate a corretora para renovação. Condomínio não pode ficar sem cobertura.",
      seguroDays <= 7 ? "critical" : "warning", "Ver datas", "condominio"
    ));
  }

  // Mandato vencendo nos próximos 60 dias
  if (mandatoDays !== null && mandatoDays > 0 && mandatoDays <= 60) {
    items.push(makeItem(
      "prosp_mandato", "agenda",
      `Mandato do síndico vence em ${mandatoDays} dia${mandatoDays !== 1 ? "s" : ""}`,
      mandatoDays <= 30
        ? "Convoque a assembleia de renovação ou eleição com antecedência mínima exigida pela convenção."
        : "Planeje a convocação da assembleia com antecedência para garantir quórum.",
      mandatoDays <= 30 ? "warning" : "info", "Ver datas", "condominio"
    ));
  }

  // Documentos vencendo nos próximos 30 dias (usa dataVencimento — campo string)
  const docs = getDocumentos();
  const docsVencendo = docs.filter((d) => {
    if (d.status !== "tenho" || !d.dataVencimento) return false;
    const days = daysUntil(d.dataVencimento);
    return days !== null && days > 0 && days <= 30;
  });
  if (docsVencendo.length > 0 && !items.some((i) => ["prosp_avcb", "prosp_seguro"].includes(i.id))) {
    items.push(makeItem(
      "prosp_docs_vencendo", "agenda",
      `${docsVencendo.length} documento${docsVencendo.length > 1 ? "s" : ""} vence${docsVencendo.length > 1 ? "m" : ""} em até 30 dias`,
      docsVencendo.slice(0, 2).map((d) => DOCUMENTO_LABEL[d.id as DocumentoEssencialId] ?? d.id).join(", ") + (docsVencendo.length > 2 ? " e outros" : "") + ". Inicie renovação.",
      "warning", "Ver documentos", "condominio"
    ));
  }

  return items;
}

// ─── Seção de comunidade — Central Digital ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildComunidadeItems(_today: string): MonthlyReviewItem[] {
  const items: MonthlyReviewItem[] = [];

  // Wrap in try/catch — community data is optional and may not exist
  try {
    const requests = getRequests();
    const closedStatuses = ["resolvido", "recusado", "arquivado"] as const;
    const openRequests = requests.filter((r) => !closedStatuses.includes(r.status as typeof closedStatuses[number]));

    // Solicitações urgentes sem resposta há mais de 7 dias
    const urgentStale = openRequests.filter((r) => {
      if (r.priority !== "urgente") return false;
      const days = Math.floor((Date.now() - new Date(r.updatedAt).getTime()) / 86400000);
      return days > 7;
    });
    if (urgentStale.length > 0) {
      items.push(makeItem(
        "com_urgent_requests", "comunidade",
        `${urgentStale.length} solicitação${urgentStale.length > 1 ? "ões" : ""} urgente${urgentStale.length > 1 ? "s" : ""} sem resposta há mais de 7 dias`,
        "Solicitações urgentes pendentes geram insatisfação e risco reputacional. Responda ou altere o status.",
        "critical", "Ver solicitações", "condominio"
      ));
    }

    // Volume alto de solicitações abertas
    if (openRequests.length >= 10) {
      items.push(makeItem(
        "com_open_requests", "comunidade",
        `${openRequests.length} solicitações abertas na Central`,
        "Volume elevado de solicitações sem resolução. Revise e priorize para manter a operação organizada.",
        "warning", "Ver solicitações", "condominio"
      ));
    }

    // Comunicação: último post oficial muito antigo (> 30 dias)
    const posts = getActivePosts();
    if (posts.length > 0) {
      const mostRecent = posts[0];
      const daysSincePost = Math.floor((Date.now() - new Date(mostRecent.createdAt).getTime()) / 86400000);
      if (daysSincePost > 30) {
        items.push(makeItem(
          "com_no_recent_post", "comunidade",
          `Último comunicado oficial há ${daysSincePost} dias`,
          "Comunicação ativa com moradores reduz conflitos e aumenta percepção de gestão profissional.",
          "info", "Ver mural", "condominio"
        ));
      }
    } else {
      items.push(makeItem(
        "com_no_posts", "comunidade",
        "Nenhum comunicado oficial publicado",
        "Publique avisos, regras e informações no Mural Oficial para manter moradores informados.",
        "info", "Ver mural", "condominio"
      ));
    }

    // Comentários pendentes de moderação
    const comments = getComments();
    const pendingComments = comments.filter((c) => c.status === "pendente");
    if (pendingComments.length > 0) {
      items.push(makeItem(
        "com_pending_comments", "comunidade",
        `${pendingComments.length} comentário${pendingComments.length > 1 ? "s" : ""} aguardando moderação`,
        "Comentários pendentes ficam invisíveis para moradores. Modere para manter o mural ativo.",
        "info", "Ver mural", "condominio"
      ));
    }
  } catch {
    // Dados de comunidade indisponíveis — seção fica vazia
  }

  return items;
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function buildMonthlyReview(month?: string, status: MonthlyReviewStatus = "pendente"): MonthlyReviewReport {
  const today = todayISO();
  const resolvedMonth = month ?? currentMonthKey();

  const finItems        = buildFinancialItems();
  const docItems        = buildDocumentosItems(today);
  const agendaItems     = buildAgendaItems(today);
  const pendItems       = buildPendenciasItems(today);
  const integItems      = buildIntegridadeItems();
  const prospectivaItems = buildProspectivaItems(today);
  const comunidadeItems  = buildComunidadeItems(today);

  const allItems: MonthlyReviewItem[] = [
    ...finItems,
    ...docItems,
    ...agendaItems,
    ...prospectivaItems,
    ...pendItems,
    ...integItems,
    ...comunidadeItems,
  ];

  const criticalCount = allItems.filter((i) => i.severity === "critical").length;
  const warningCount  = allItems.filter((i) => i.severity === "warning").length;
  const infoCount     = allItems.filter((i) => i.severity === "info").length;

  // Score: parte de 100, desconta por severidade
  const raw = 100 - criticalCount * 12 - warningCount * 5 - infoCount * 1;
  const score = Math.min(100, Math.max(0, raw));

  // recommendedFirstAction: primeiro critical, depois warning, depois info
  const recommendedFirstAction =
    allItems.find((i) => i.severity === "critical") ??
    allItems.find((i) => i.severity === "warning") ??
    allItems[0];

  // Headline e summary
  const mesFormatado = new Date(`${resolvedMonth}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  let headline: string;
  let summary: string;

  if (criticalCount > 0) {
    headline = `${criticalCount} ponto${criticalCount > 1 ? "s" : ""} crítico${criticalCount > 1 ? "s" : ""} para resolver`;
    summary = `Revisão de ${mesFormatado} identificou itens urgentes. Resolva os pontos críticos antes de encerrar o mês.`;
  } else if (warningCount > 0) {
    headline = `${warningCount} ponto${warningCount > 1 ? "s" : ""} de atenção identificado${warningCount > 1 ? "s" : ""}`;
    summary = `Revisão de ${mesFormatado} sem itens críticos. Verifique os pontos de atenção para manter o condomínio organizado.`;
  } else if (allItems.length === 0) {
    headline = "Tudo em ordem";
    summary = `Revisão de ${mesFormatado} sem pontos de atenção identificados. Mantenha os dados atualizados.`;
  } else {
    headline = `${infoCount} informação${infoCount > 1 ? "ões" : ""} para revisar`;
    summary = `Revisão de ${mesFormatado} sem alertas críticos. Verifique os itens informativos.`;
  }

  const sections: MonthlyReviewReport["sections"] = {
    financeiro:  finItems,
    documentos:  docItems,
    agenda:      [...agendaItems, ...prospectivaItems],
    pendencias:  pendItems,
    integridade: integItems,
    comunidade:  comunidadeItems,
    resumo:      [],
  };

  return {
    month: resolvedMonth,
    status,
    score,
    headline,
    summary,
    items: allItems,
    sections,
    recommendedFirstAction,
    criticalCount,
    warningCount,
    infoCount,
  };
}
