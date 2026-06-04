"use client";

import { buildCommandCenter } from "@/lib/command-center";
import { buildMonthlyFinancialExecutiveSummary, currentMonthKey } from "@/lib/financial";
import { buildLocalIntegrityReport } from "@/lib/local-integrity";
import { getAgendaEvents, getDocumentos, getPendencias } from "@/lib/session";

export function buildMonthlyOperationalSummary(month = currentMonthKey()): string {
  const command = buildCommandCenter();
  const integrity = buildLocalIntegrityReport();
  const pendencias = getPendencias();
  const agenda = getAgendaEvents();
  const documentos = getDocumentos();
  const abertas = pendencias.filter((p) => p.status === "aberta");
  const concluidas = pendencias.filter((p) => p.status === "concluida");
  const eventosAbertos = agenda.filter((event) => !event.completedAt);
  const docsConfirmados = documentos.filter((doc) => doc.status === "tenho");

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
    `- Documentos confirmados: ${docsConfirmados.length}/${documentos.length || "não revisado"}`,
    "",
    buildMonthlyFinancialExecutiveSummary(month),
    "",
    "Observação: resumo auxiliar gerado com dados locais informados manualmente. Não substitui documentos oficiais, demonstrativos contábeis ou orientação profissional.",
  ].join("\n");
}
