"use client";

import {
  getAgendaEvents,
  getDocumentos,
  getLastBackupAt,
  getOcorrencias,
  getPendencias,
  getProfile,
  getStorageSizeKB,
  DOCUMENTO_CRITICIDADE,
  DOCUMENTOS_ESSENCIAIS_IDS,
  WARN_AGENDA_EVENTS,
  WARN_OCORRENCIAS,
  WARN_PENDENCIAS,
  type DocumentoEssencialId,
} from "@/lib/session";
import { getCurrentFinancialSnapshot, isFinancialEntryOverdue } from "@/lib/financial";
import { runLocalDataValidationChecks } from "@/lib/local-validation";

export type LocalIntegritySeverity = "ok" | "info" | "warning" | "critical";

export type LocalIntegrityIssue = {
  id: string;
  module: "backup" | "pendencias" | "agenda" | "documentos" | "financeiro" | "perfil";
  severity: Exclude<LocalIntegritySeverity, "ok">;
  title: string;
  detail: string;
};

export type LocalIntegrityReport = {
  score: number;
  status: LocalIntegritySeverity;
  storageSizeKB: number;
  counts: {
    pendencias: number;
    agenda: number;
    ocorrencias: number;
    documentos: number;
    financialEntries: number;
  };
  issues: LocalIntegrityIssue[];
};

function isValidISODate(value?: string): boolean {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

export function buildLocalIntegrityReport(): LocalIntegrityReport {
  const profile = getProfile();
  const pendencias = getPendencias();
  const agenda = getAgendaEvents();
  const ocorrencias = getOcorrencias();
  const documentos = getDocumentos();
  const financialSnapshot = getCurrentFinancialSnapshot();
  const lastBackupAt = getLastBackupAt();
  const validationChecks = runLocalDataValidationChecks();
  const issues: LocalIntegrityIssue[] = [];

  if (!profile?.nomeCondominio) {
    issues.push({
      id: "profile_missing_name",
      module: "perfil",
      severity: "info",
      title: "Perfil sem nome do condomínio",
      detail: "Nomear o prédio melhora relatórios, backups e leitura operacional.",
    });
  }

  // Alertas de volume alto — avisa antes de atingir o limite de descarte
  if (pendencias.length >= WARN_PENDENCIAS) {
    issues.push({
      id: "pendencias_high_volume",
      module: "pendencias",
      severity: "warning",
      title: `Volume alto de pendências: ${pendencias.length} registros`,
      detail: `Aproximando do limite (${WARN_PENDENCIAS}+). Exporte um backup e archive pendências antigas concluídas.`,
    });
  }
  if (agenda.length >= WARN_AGENDA_EVENTS) {
    issues.push({
      id: "agenda_high_volume",
      module: "agenda",
      severity: "warning",
      title: `Volume alto na agenda: ${agenda.length} eventos`,
      detail: `Aproximando do limite (${WARN_AGENDA_EVENTS}+). Exporte um backup e conclua ou remova eventos passados.`,
    });
  }
  if (ocorrencias.length >= WARN_OCORRENCIAS) {
    issues.push({
      id: "ocorrencias_high_volume",
      module: "pendencias",
      severity: "info",
      title: `Volume alto de ocorrências: ${ocorrencias.length} registros`,
      detail: `Próximo do limite (${WARN_OCORRENCIAS}+). Considere exportar um backup.`,
    });
  }

  const stalePendencias = pendencias.filter((p) => p.status === "aberta" && !p.dueDate && !p.responsavel);
  if (stalePendencias.length >= 3) {
    issues.push({
      id: "pendencias_without_owner_or_due",
      module: "pendencias",
      severity: "warning",
      title: `${stalePendencias.length} pendências sem prazo nem responsável`,
      detail: "Tarefas sem dono e sem data tendem a parar na rotina.",
    });
  }

  const invalidAgenda = agenda.filter((event) => !isValidISODate(event.date));
  if (invalidAgenda.length > 0) {
    issues.push({
      id: "agenda_invalid_dates",
      module: "agenda",
      severity: "critical",
      title: "Eventos com data inválida",
      detail: "Revise eventos antigos ou importados para evitar falhas de priorização.",
    });
  }

  const missingCriticalDocs = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => {
    const doc = documentos.find((item) => item.id === id);
    return DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica" && (!doc || doc.status === "nao_tenho" || doc.status === "precisa_localizar");
  });
  if (missingCriticalDocs.length > 0) {
    issues.push({
      id: "documents_critical_missing",
      module: "documentos",
      severity: missingCriticalDocs.length >= 3 ? "critical" : "warning",
      title: `${missingCriticalDocs.length} documento${missingCriticalDocs.length > 1 ? "s" : ""} crítico${missingCriticalDocs.length > 1 ? "s" : ""} sem confirmação`,
      detail: "Documentos críticos sem status reduzem confiabilidade do score e da priorização.",
    });
  }

  const invalidEntries = financialSnapshot.entries.filter((entry) => !entry.title || !Number.isFinite(entry.amount) || entry.amount <= 0);
  if (invalidEntries.length > 0) {
    issues.push({
      id: "financial_invalid_entries",
      module: "financeiro",
      severity: "warning",
      title: "Lançamentos financeiros incompletos",
      detail: "Revise títulos e valores para manter o resumo mensal confiável.",
    });
  }

  if (financialSnapshot.entries.some((entry) => isFinancialEntryOverdue(entry))) {
    issues.push({
      id: "financial_overdue_entries",
      module: "financeiro",
      severity: "critical",
      title: "Há contas vencidas no financeiro",
      detail: "Contas vencidas aparecem no Command Center e devem virar ação operacional.",
    });
  }

  if (!lastBackupAt) {
    issues.push({
      id: "backup_never_exported",
      module: "backup",
      severity: "warning",
      title: "Nenhum backup manual exportado",
      detail: "Em modo local-first, exportar JSON reduz risco de perda ao trocar dispositivo ou limpar navegador.",
    });
  }

  const failedValidations = validationChecks.filter((check) => !check.ok);
  if (failedValidations.length > 0) {
    issues.push({
      id: "local_validation_failed",
      module: "backup",
      severity: "critical",
      title: "Validação local de dados falhou",
      detail: failedValidations.map((check) => check.label).join("; "),
    });
  }

  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const warning = issues.filter((issue) => issue.severity === "warning").length;
  const info = issues.filter((issue) => issue.severity === "info").length;
  const score = Math.max(0, 100 - critical * 25 - warning * 12 - info * 4);
  const status: LocalIntegritySeverity =
    critical > 0 ? "critical" : warning > 0 ? "warning" : info > 0 ? "info" : "ok";

  return {
    score,
    status,
    storageSizeKB: getStorageSizeKB(),
    counts: {
      pendencias: pendencias.length,
      agenda: agenda.length,
      ocorrencias: ocorrencias.length,
      documentos: documentos.length,
      financialEntries: financialSnapshot.entries.length,
    },
    issues,
  };
}
