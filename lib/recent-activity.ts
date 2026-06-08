// Resumo de atividade recente desde a última visita — responde "o que mudou?".
// Determinístico, 100% local-first. Compara timestamps com previousOpenedAt.

import { getSessionMeta, getHealthHistory, getLastBackupAt } from "./session";
import { getPendencias } from "./session-pendencias";
import { getAgendaEvents } from "./session-agenda";
import { getMonthlyReviewHistory } from "./session-monthly-review";

export type ActivityItem = {
  id: string;
  label: string;
  detail?: string;
  type: "pendencia" | "agenda" | "saude" | "backup" | "revisao" | "documento" | "outro";
};

export type RecentActivitySummary = {
  since: string | null;       // ISO — "desde sua última visita em DD/MM"
  sinceLabel: string;         // "Desde ontem" / "Desde 3 dias atrás" etc.
  items: ActivityItem[];
  hasActivity: boolean;
  isFirstVisit: boolean;
};

function daysAgo(isoA: string, isoB: string): number {
  return Math.round((new Date(isoB).getTime() - new Date(isoA).getTime()) / 86400000);
}

function formatSinceLabel(isoTimestamp: string): string {
  const days = daysAgo(isoTimestamp, new Date().toISOString());
  if (days === 0) return "Nesta sessão";
  if (days === 1) return "Desde ontem";
  if (days <= 6) return `Nos últimos ${days} dias`;
  if (days <= 13) return "Na última semana";
  return `Há ${days} dias`;
}

export function buildRecentActivitySummary(): RecentActivitySummary {
  const meta = getSessionMeta();
  const since = meta.previousOpenedAt ?? null;

  if (!since) {
    return {
      since: null,
      sinceLabel: "Bem-vindo",
      items: [],
      hasActivity: false,
      isFirstVisit: true,
    };
  }

  const sinceLabel = formatSinceLabel(since);
  const items: ActivityItem[] = [];

  // Pendências criadas ou concluídas desde a última visita
  try {
    const all = getPendencias();
    const novas = all.filter(p => p.createdAt > since && p.status === "aberta");
    const concluidas = all.filter(p => p.completedAt && p.completedAt > since);
    if (novas.length > 0) {
      items.push({
        id: "pendencias-novas",
        label: `${novas.length} pendência${novas.length > 1 ? "s" : ""} nova${novas.length > 1 ? "s" : ""} criada${novas.length > 1 ? "s" : ""}`,
        detail: novas[0].titulo,
        type: "pendencia",
      });
    }
    if (concluidas.length > 0) {
      items.push({
        id: "pendencias-concluidas",
        label: `${concluidas.length} pendência${concluidas.length > 1 ? "s" : ""} concluída${concluidas.length > 1 ? "s" : ""}`,
        detail: concluidas[0].titulo,
        type: "pendencia",
      });
    }
  } catch { /* silencioso */ }

  // Eventos de agenda adicionados desde a última visita
  try {
    const eventos = getAgendaEvents();
    const novos = eventos.filter(e => e.createdAt && e.createdAt > since);
    if (novos.length > 0) {
      items.push({
        id: "agenda-novos",
        label: `${novos.length} evento${novos.length > 1 ? "s" : ""} adicionado${novos.length > 1 ? "s" : ""} na agenda`,
        detail: novos[0].title,
        type: "agenda",
      });
    }
  } catch { /* silencioso */ }

  // Revisão mensal concluída desde a última visita
  try {
    const history = getMonthlyReviewHistory();
    const recente = history.filter(s => s.completedAt > since);
    if (recente.length > 0) {
      items.push({
        id: "revisao-concluida",
        label: `Revisão mensal concluída (score: ${recente[0].score}%)`,
        type: "revisao",
      });
    }
  } catch { /* silencioso */ }

  // Backup exportado desde a última visita
  try {
    const lastBackup = getLastBackupAt();
    if (lastBackup && lastBackup > since) {
      items.push({
        id: "backup",
        label: "Backup exportado",
        detail: new Date(lastBackup).toLocaleDateString("pt-BR"),
        type: "backup",
      });
    }
  } catch { /* silencioso */ }

  // Variação de HealthScore
  try {
    const hist = getHealthHistory();
    if (hist.length >= 2) {
      const recent = hist[hist.length - 1];
      const prev = hist[hist.length - 2];
      if (recent && prev && recent.date > since.slice(0, 10)) {
        const delta = recent.percentage - prev.percentage;
        if (Math.abs(delta) >= 2) {
          items.push({
            id: "saude-delta",
            label: delta > 0 ? `Saúde subiu ${delta}% (${recent.percentage}%)` : `Saúde caiu ${Math.abs(delta)}% (${recent.percentage}%)`,
            type: "saude",
          });
        }
      }
    }
  } catch { /* silencioso */ }

  return {
    since,
    sinceLabel,
    items: items.slice(0, 4),
    hasActivity: items.length > 0,
    isFirstVisit: false,
  };
}
