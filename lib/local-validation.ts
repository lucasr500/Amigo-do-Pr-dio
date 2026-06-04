"use client";

import {
  getUserBackupJson,
  getNextOccurrenceDate,
  normalizeAgendaEvent,
  normalizePendencia,
  parseAndValidateUserData,
} from "@/lib/session";
import { normalizeFinancialSnapshot } from "@/lib/financial";

export type LocalValidationCheck = {
  id: string;
  ok: boolean;
  label: string;
};

// Backup v8 sintético mínimo — testa aceitação sem dados reais no localStorage
const SYNTHETIC_V8_BACKUP = JSON.stringify({
  version: "8",
  app: "amigo-do-predio",
  exportedAt: new Date().toISOString(),
  profile: null,
  memoria: {},
  favorites: [],
  checklists: {},
  pendencias: [],
  ocorrencias: [],
  agenda: [],
  memoriaAssistida: {},
  documentos: [],
  funcionarios: [],
  manutencoes: [],
  financialSnapshots: [],
});

// Backup v7 sintético — garante retrocompatibilidade
const SYNTHETIC_V7_BACKUP = JSON.stringify({
  version: "7",
  app: "amigo-do-predio",
  exportedAt: new Date().toISOString(),
  profile: null,
  memoria: {},
  favorites: [],
  checklists: {},
  pendencias: [],
  ocorrencias: [],
  agenda: [],
  memoriaAssistida: {},
  documentos: [],
  funcionarios: [],
  manutencoes: [],
  financialSnapshots: [],
});

// Backup antigo v1 sem financeiro — retrocompatibilidade mínima
const SYNTHETIC_V1_BACKUP = JSON.stringify({
  version: "1",
  app: "amigo-do-predio",
  exportedAt: new Date().toISOString(),
  profile: null,
  memoria: {},
  favorites: [],
  checklists: {},
});

export function runLocalDataValidationChecks(): LocalValidationCheck[] {
  const pendencia = normalizePendencia({ titulo: "" });
  const agenda = normalizeAgendaEvent({ title: "", date: "data-invalida" });
  const financial = normalizeFinancialSnapshot({
    month: "2026-06",
    estimatedBalance: Number.NaN,
    entries: [{ title: "", amount: Number.NaN } as never],
  });
  const currentBackup   = parseAndValidateUserData(getUserBackupJson());
  const invalidBackup   = parseAndValidateUserData("{invalid-json");
  const v8SyntheticTest = parseAndValidateUserData(SYNTHETIC_V8_BACKUP);
  const v7SyntheticTest = parseAndValidateUserData(SYNTHETIC_V7_BACKUP);
  const v1SyntheticTest = parseAndValidateUserData(SYNTHETIC_V1_BACKUP);

  // Recorrência mensal: 31/jan deve virar 28/fev, não 3/mar
  const rec_jan31_mensal  = getNextOccurrenceDate("2026-01-31", "mensal");
  // Trimestral: 31/jan + 3 meses = 30/abr
  const rec_jan31_trim    = getNextOccurrenceDate("2026-01-31", "trimestral");
  // Mensal em agosto: 31/ago + mensal = 30/set
  const rec_aug31_mensal  = getNextOccurrenceDate("2026-08-31", "mensal");
  // Anual em ano bissexto: 29/fev/2024 + anual = 28/fev/2025
  const rec_feb29_anual   = getNextOccurrenceDate("2024-02-29", "anual");

  return [
    {
      id: "normalize_pendencia",
      label: "Normalização de pendência antiga",
      ok: !!pendencia.id && !!pendencia.titulo && pendencia.status === "aberta",
    },
    {
      id: "normalize_agenda",
      label: "Normalização de evento antigo",
      ok: !!agenda.id && !!agenda.title && !!agenda.date && agenda.recurrence === "nenhuma",
    },
    {
      id: "normalize_financial",
      label: "Normalização financeira (NaN → 0)",
      ok: !!financial.id && financial.entries.length === 1 && Number.isFinite(financial.entries[0].amount),
    },
    {
      id: "current_backup_parse",
      label: "Export atual (v8) validável",
      ok: currentBackup.success,
    },
    {
      id: "invalid_backup_rejected",
      label: "Backup inválido rejeitado",
      ok: !invalidBackup.success,
    },
    {
      id: "v8_synthetic_accepted",
      label: "Backup sintético v8 aceito",
      ok: v8SyntheticTest.success,
    },
    {
      id: "v7_synthetic_accepted",
      label: "Backup sintético v7 (retrocompat.) aceito",
      ok: v7SyntheticTest.success,
    },
    {
      id: "v1_synthetic_accepted",
      label: "Backup sintético v1 (retrocompat. mínimo) aceito",
      ok: v1SyntheticTest.success,
    },
    {
      id: "recurrence_jan31_mensal",
      label: "Recorrência mensal: 31/jan → 28/fev (não 3/mar)",
      ok: rec_jan31_mensal === "2026-02-28",
    },
    {
      id: "recurrence_jan31_trimestral",
      label: "Recorrência trimestral: 31/jan → 30/abr",
      ok: rec_jan31_trim === "2026-04-30",
    },
    {
      id: "recurrence_aug31_mensal",
      label: "Recorrência mensal: 31/ago → 30/set",
      ok: rec_aug31_mensal === "2026-09-30",
    },
    {
      id: "recurrence_feb29_anual",
      label: "Recorrência anual: 29/fev/2024 → 28/fev/2025",
      ok: rec_feb29_anual === "2025-02-28",
    },
  ];
}
