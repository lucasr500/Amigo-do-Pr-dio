"use client";

import { buildCommandCenter } from "@/lib/command-center";
import { buildMonthlyFinancialExecutiveSummary, currentMonthKey } from "@/lib/financial";
import { buildLocalIntegrityReport } from "@/lib/local-integrity";
import { getAgendaEvents, getPendencias } from "@/lib/session";
import { getDocumentosSummary } from "@/lib/session-documentos";

export function buildMonthlyOperationalSummary(month = currentMonthKey()): string {
  const command = buildCommandCenter();
  const integrity = buildLocalIntegrityReport();
  const pendencias = getPendencias();
  const agenda = getAgendaEvents();
  const docSummary = getDocumentosSummary();
  const abertas = pendencias.filter((p) => p.status === "aberta");
  const concluidas = pendencias.filter((p) => p.status === "concluida");
  const eventosAbertos = agenda.filter((event) => !event.completedAt);

  // Seção documental
  const docLine =
    docSummary.criticosPendentes > 0
      ? `${docSummary.criticosPendentes} crítico${docSummary.criticosPendentes > 1 ? "s" : ""} pendente${docSummary.criticosPendentes > 1 ? "s" : ""}, ${docSummary.vencidos} vencido${docSummary.vencidos !== 1 ? "s" : ""}, ${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""}`
      : docSummary.vencidos > 0
      ? `${docSummary.vencidos} vencido${docSummary.vencidos !== 1 ? "s" : ""} para regularizar, ${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""}`
      : docSummary.proximos > 0
      ? `${docSummary.proximos} vencem em breve, ${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""} — sem pendências críticas`
      : `${docSummary.tenho} regular${docSummary.tenho !== 1 ? "es" : ""} — sem pendências críticas registradas no app`;

  return [
    `Resumo operacional mensal — ${month}`,
    "",
    `Status geral: ${command.summaryText}`,
    `Score operacional: ${command.healthPercentage}%`,
    `Integridade dos dados locais: ${integrity.score}/100`,
    "",
    "Prioridades:",
    command.todayFocus.length > 0
      ? command.todayFocus.map((item) => `- ${item.title}: ${item.reason}`).join("\n")
      : "- Nenhuma prioridade crítica detectada.",
    "",
    "Rotina:",
    `- Pendências abertas: ${abertas.length}`,
    `- Pendências concluídas: ${concluidas.length}`,
    `- Eventos abertos na agenda: ${eventosAbertos.length}`,
    `- Documentos: ${docLine}`,
    "",
    buildMonthlyFinancialExecutiveSummary(month),
    "",
    "Observação: resumo auxiliar gerado com dados locais informados manualmente. Não substitui documentos oficiais, demonstrativos contábeis, guarda documental oficial ou orientação profissional.",
  ].join("\n");
}
