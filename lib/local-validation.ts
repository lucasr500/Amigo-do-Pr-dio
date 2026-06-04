"use client";

import {
  getUserBackupJson,
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

export function runLocalDataValidationChecks(): LocalValidationCheck[] {
  const pendencia = normalizePendencia({ titulo: "" });
  const agenda = normalizeAgendaEvent({ title: "", date: "data-invalida" });
  const financial = normalizeFinancialSnapshot({
    month: "2026-06",
    estimatedBalance: Number.NaN,
    entries: [{ title: "", amount: Number.NaN } as never],
  });
  const currentBackup = parseAndValidateUserData(getUserBackupJson());
  const invalidBackup = parseAndValidateUserData("{invalid-json");

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
      label: "Normalização financeira",
      ok: !!financial.id && financial.entries.length === 1 && Number.isFinite(financial.entries[0].amount),
    },
    {
      id: "current_backup_parse",
      label: "Export atual validável",
      ok: currentBackup.success,
    },
    {
      id: "invalid_backup_rejected",
      label: "Backup inválido rejeitado",
      ok: !invalidBackup.success,
    },
  ];
}
