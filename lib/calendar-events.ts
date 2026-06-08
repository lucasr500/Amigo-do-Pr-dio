// Camada de normalização de eventos de calendário.
// Agrega fontes heterogêneas em um tipo unificado CalendarEvent.
// Sem side effects — apenas lê dados existentes.

import { getAgendaEvents } from "./session-agenda";
import { getDocumentos, DOCUMENTO_LABEL, type DocumentoEssencialId } from "./session-documentos";
import { getFuncionarios } from "./session";
import { buildEventosCalendario } from "./recorrencias";

export type CalendarEventSource =
  | "agenda"
  | "documento"
  | "manutencao"
  | "ferias"
  | "revisao";

export type CalendarEventSeverity = "critical" | "warning" | "info" | "neutral";

export type CalendarEvent = {
  id: string;
  date: string;                     // YYYY-MM-DD
  title: string;
  type: string;                     // tipo original do evento
  source: CalendarEventSource;
  severity: CalendarEventSeverity;
  detail?: string;
};

function severityFromDaysUntil(days: number): CalendarEventSeverity {
  if (days < 0) return "critical";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "info";
}

function daysUntil(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// Retorna todos os eventos agregados dos próximos N dias (e passados recentes).
export function getAggregatedCalendarEvents(horizonDays = 365): CalendarEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date();
  limit.setDate(limit.getDate() + horizonDays);
  const limitISO = limit.toISOString().slice(0, 10);
  // 30 dias atrás como passado recente
  const past = new Date();
  past.setDate(past.getDate() - 30);
  const pastISO = past.toISOString().slice(0, 10);

  const events: CalendarEvent[] = [];

  // 1. Eventos manuais da agenda
  try {
    const agenda = getAgendaEvents();
    for (const e of agenda) {
      if (!e.date || e.date < pastISO || e.date > limitISO) continue;
      events.push({
        id: `agenda-${e.id}`,
        date: e.date,
        title: e.title,
        type: e.type,
        source: "agenda",
        severity: e.date < today ? "neutral" : "info",
        detail: e.note,
      });
    }
  } catch { /* silencioso */ }

  // 2. Vencimentos de documentos
  try {
    const docs = getDocumentos();
    for (const d of docs) {
      if (!d.dataVencimento) continue;
      if (d.dataVencimento < pastISO || d.dataVencimento > limitISO) continue;
      const days = daysUntil(d.dataVencimento);
      events.push({
        id: `doc-${d.id}`,
        date: d.dataVencimento,
        title: DOCUMENTO_LABEL[d.id as DocumentoEssencialId] ?? d.id,
        type: "documento",
        source: "documento",
        severity: severityFromDaysUntil(days),
        detail: "Vencimento",
      });
    }
  } catch { /* silencioso */ }

  // 3. Manutenções recorrentes
  try {
    const recorrencias = buildEventosCalendario();
    for (const r of recorrencias) {
      if (!r.data || r.data < pastISO || r.data > limitISO) continue;
      const days = daysUntil(r.data);
      events.push({
        id: `manut-${r.origem}-${r.data}`,
        date: r.data,
        title: r.label,
        type: "manutencao",
        source: "manutencao",
        severity: severityFromDaysUntil(days),
        detail: r.criticidade,
      });
    }
  } catch { /* silencioso */ }

  // 4. Férias de funcionários
  try {
    const funcionarios = getFuncionarios();
    for (const f of funcionarios) {
      if (!f.ultimasFeriasGozo) continue;
      // Próximas férias = ~1 ano após última fruição
      const ultima = new Date(`${f.ultimasFeriasGozo}T00:00:00`);
      const proximas = new Date(ultima);
      proximas.setFullYear(proximas.getFullYear() + 1);
      const proximasISO = proximas.toISOString().slice(0, 10);
      if (proximasISO < pastISO || proximasISO > limitISO) continue;
      events.push({
        id: `ferias-${f.id}`,
        date: proximasISO,
        title: `Férias — ${f.nomeFuncao}`,
        type: "ferias",
        source: "ferias",
        severity: severityFromDaysUntil(daysUntil(proximasISO)),
        detail: f.cargo,
      });
    }
  } catch { /* silencioso */ }

  // Ordenar por data
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// Retorna eventos agrupados por data: { "2026-06-15": [CalendarEvent, ...] }
export function getEventsByDate(horizonDays = 365): Map<string, CalendarEvent[]> {
  const all = getAggregatedCalendarEvents(horizonDays);
  const map = new Map<string, CalendarEvent[]>();
  for (const e of all) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

// Retorna eventos do mês especificado (YYYY-MM)
export function getEventsForMonth(monthKey: string): CalendarEvent[] {
  const all = getAggregatedCalendarEvents(400);
  return all.filter(e => e.date.startsWith(monthKey));
}
