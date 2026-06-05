"use client";

import { buildCommandCenterCached } from "@/lib/command-center";
import { buildMonthlyFinancialExecutiveSummary, currentMonthKey } from "@/lib/financial";
import { buildLocalIntegrityReport } from "@/lib/local-integrity";
import { getAgendaEvents, getPendencias } from "@/lib/session";
import { getDocumentosSummary } from "@/lib/session-documentos";
import { buildMonthlyReview } from "@/lib/monthly-review";
import { getMonthlyReviewState } from "@/lib/session-monthly-review";

const STATUS_LABEL: Record<string, string> = {
  pendente:     "Pendente",
  em_andamento: "Em andamento",
  concluida:    "Concluída",
};

export function buildMonthlyOperationalSummary(month = currentMonthKey()): string {
  const command   = buildCommandCenterCached();
  const integrity = buildLocalIntegrityReport();
  const pendencias = getPendencias();
  const agenda    = getAgendaEvents();
  const docSummary = getDocumentosSummary();
  const review    = buildMonthlyReview(month);
  const reviewState = getMonthlyReviewState(month);
  const abertas   = pendencias.filter((p) => p.status === "aberta");
  const concluidas = pendencias.filter((p) => p.status === "concluida");
  const eventosAbertos = agenda.filter((event) => !event.completedAt);

  const mesFormatado = new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Seção documental
  const docLine =
    docSummary.criticosPendentes > 0
      ? `${docSummary.criticosPendentes} crítico${docSummary.criticosPendentes > 1 ? "s" : ""} pendente${docSummary.criticosPendentes > 1 ? "s" : ""}, ${docSummary.vencidos} vencido${docSummary.vencidos !== 1 ? "s" : ""}, ${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""}`
      : docSummary.vencidos > 0
      ? `${docSummary.vencidos} vencido${docSummary.vencidos !== 1 ? "s" : ""} para regularizar, ${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""}`
      : docSummary.proximos > 0
      ? `${docSummary.proximos} vencem em breve, ${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""} — sem pendências críticas`
      : `${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""} — sem pendências críticas registradas no app`;

  // Top pontos da revisão mensal
  const reviewStatusLabel = STATUS_LABEL[reviewState.status] ?? "Pendente";
  const topItems = review.items
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .slice(0, 3);
  const reviewLines =
    topItems.length > 0
      ? topItems.map((i) => `- [${i.severity === "critical" ? "!" : "~"}] ${i.title}`).join("\n")
      : "- Nenhum ponto crítico ou de atenção identificado.";

  return [
    `Resumo operacional mensal — ${mesFormatado}`,
    "",
    `Status geral: ${command.summaryText}`,
    `Score operacional: ${command.healthPercentage}%`,
    `Revisão mensal: ${reviewStatusLabel} — score de revisão: ${review.score}/100`,
    `Integridade dos dados locais: ${integrity.score}/100`,
    "",
    "Prioridades:",
    command.todayFocus.length > 0
      ? command.todayFocus.map((item) => `- ${item.title}: ${item.reason}`).join("\n")
      : "- Nenhuma prioridade crítica detectada.",
    "",
    "Pontos de atenção (revisão mensal):",
    reviewLines,
    "",
    "Rotina:",
    `- Pendências abertas: ${abertas.length}`,
    `- Pendências concluídas: ${concluidas.length}`,
    `- Eventos abertos na agenda: ${eventosAbertos.length}`,
    `- Documentos: ${docLine}`,
    "",
    buildMonthlyFinancialExecutiveSummary(month),
    "",
    "Observação: resumo auxiliar gerado com dados locais informados manualmente. Não substitui documentos oficiais, demonstrativos contábeis, prestação de contas oficial, guarda documental oficial ou orientação profissional.",
  ].join("\n");
}
