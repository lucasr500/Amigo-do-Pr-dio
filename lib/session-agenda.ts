// ─── Domínio: Agenda ─────────────────────────────────────────────────────────
// Tipos, normalizador e CRUD de eventos da agenda do prédio.
// Recorrência, templates e vínculo com pendências incluídos.
// Persiste em localStorage via session-core. Sem lógica de UI.

import { safeRead, safeWrite, KEYS, todayISO } from "./session-core";
import type { PendenciaPrioridade } from "./session-pendencias";
import { mirrorUpsert, mirrorDelete } from "@/lib/tenant/agendaRemote";

// ─── Caps de armazenamento ────────────────────────────────────────────────────
export const MAX_AGENDA_EVENTS  = 365;
export const WARN_AGENDA_EVENTS = 300;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type AgendaEventType =
  | "assembleia"
  | "manutencao"
  | "dedetizacao"
  | "caixa_agua"
  | "extintores"
  | "vistoria"
  | "obra"
  | "cobranca"
  | "reuniao"
  | "fornecedor"
  | "comunicado"
  | "retorno"
  | "outro";

export type AgendaRecurrence =
  | "nenhuma"
  | "semanal"
  | "mensal"
  | "trimestral"
  | "semestral"
  | "anual";

export type AgendaEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: AgendaEventType;
  note?: string;
  responsavel?: string;
  prioridade?: PendenciaPrioridade;
  recurrence?: AgendaRecurrence;
  templateId?: string;
  source?: "manual" | "template";
  linkedPendenciaId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

// ─── Normalizador ─────────────────────────────────────────────────────────────

export function normalizeAgendaEvent(raw: Partial<AgendaEvent>): AgendaEvent {
  const now = new Date().toISOString();
  const recurrence: AgendaRecurrence =
    raw.recurrence === "semanal" ||
    raw.recurrence === "mensal" ||
    raw.recurrence === "trimestral" ||
    raw.recurrence === "semestral" ||
    raw.recurrence === "anual"
      ? raw.recurrence
      : "nenhuma";
  return {
    id: raw.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: raw.title?.trim() || "Evento sem título",
    date: raw.date || todayISO(),
    type: raw.type || "outro",
    note: raw.note?.trim() || undefined,
    responsavel: raw.responsavel?.trim() || undefined,
    prioridade: raw.prioridade || "media",
    recurrence,
    templateId: raw.templateId,
    source: raw.source || "manual",
    linkedPendenciaId: raw.linkedPendenciaId,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAgendaEvents(): AgendaEvent[] {
  return safeRead<Partial<AgendaEvent>[]>(KEYS.AGENDA, []).map(normalizeAgendaEvent);
}

// Grava a lista inteira (usado pelo cutover de leitura relacional — agendaSync).
export function saveAgendaEvents(list: AgendaEvent[]): void {
  safeWrite(KEYS.AGENDA, list.map(normalizeAgendaEvent));
}

export function addAgendaEvent(
  e: Omit<AgendaEvent, "id" | "createdAt">
): AgendaEvent {
  const all = getAgendaEvents();
  const nova: AgendaEvent = {
    ...e,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  all.push(nova);
  // Preserva eventos futuros; descarta apenas eventos passados/concluídos mais antigos
  if (all.length > MAX_AGENDA_EVENTS) {
    const today   = todayISO();
    const futuros = all.filter((ev) => !ev.completedAt && ev.date >= today);
    const outros  = all.filter((ev) => ev.completedAt || ev.date < today);
    const maxOutros = Math.max(0, MAX_AGENDA_EVENTS - futuros.length);
    safeWrite(KEYS.AGENDA, [...futuros, ...outros.slice(-maxOutros)]);
  } else {
    safeWrite(KEYS.AGENDA, all);
  }
  void mirrorUpsert(nova); // dual-write PUSH best-effort (no-op se flag off)
  return nova;
}

export function updateAgendaEvent(
  id: string,
  changes: Partial<Omit<AgendaEvent, "id" | "createdAt">>
): void {
  safeWrite(
    KEYS.AGENDA,
    getAgendaEvents().map((e) =>
      e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e
    )
  );
  const u = getAgendaEventById(id);
  if (u) void mirrorUpsert(u); // dual-write PUSH best-effort (no-op se flag off)
}

export function completeAgendaEvent(id: string): void {
  const event = getAgendaEventById(id);
  const completedAt = new Date().toISOString();
  updateAgendaEvent(id, { completedAt });

  if (!event || !event.recurrence || event.recurrence === "nenhuma") return;
  const nextDate = getNextOccurrenceDate(event.date, event.recurrence);
  addAgendaEvent({
    title: event.title,
    date: nextDate,
    type: event.type,
    note: event.note,
    responsavel: event.responsavel,
    prioridade: event.prioridade,
    recurrence: event.recurrence,
    templateId: event.templateId,
    source: event.source,
  });
}

export function deleteAgendaEvent(id: string): void {
  safeWrite(KEYS.AGENDA, getAgendaEvents().filter((e) => e.id !== id));
  void mirrorDelete(id); // dual-write PUSH best-effort (no-op se flag off)
}

export function getUpcomingAgendaEvents(limitDays = 90): AgendaEvent[] {
  const today = todayISO();
  return getAgendaEvents()
    .filter((e) => !e.completedAt && e.date >= today)
    .filter((e) => {
      const diff = Math.floor(
        (new Date(e.date).getTime() - new Date(today).getTime()) / 86400000
      );
      return diff <= limitDays;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getAgendaEventById(id: string): AgendaEvent | null {
  return getAgendaEvents().find((e) => e.id === id) ?? null;
}

// ─── Recorrência ──────────────────────────────────────────────────────────────

export function getNextOccurrenceDate(date: string, recurrence: AgendaRecurrence): string {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year  = parseInt(yearStr,  10);
  const month = parseInt(monthStr, 10); // 1-based (Jan=1, Dec=12)
  const day   = parseInt(dayStr,   10);

  // Clamps `d` to the last valid day of month `m` (1-based) in year `y`.
  // new Date(y, m, 0) uses month as 0-based internally: day 0 rolls back to
  // the last day of the preceding month, giving us the last day of month m.
  function clampToMonth(y: number, m: number, d: number): string {
    const daysInMonth = new Date(y, m, 0).getDate();
    const clamped = Math.min(d, daysInMonth);
    return `${y}-${String(m).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
  }

  if (recurrence === "semanal") {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  if (recurrence === "mensal") {
    const total = year * 12 + (month - 1) + 1;
    return clampToMonth(Math.floor(total / 12), (total % 12) + 1, day);
  }
  if (recurrence === "trimestral") {
    const total = year * 12 + (month - 1) + 3;
    return clampToMonth(Math.floor(total / 12), (total % 12) + 1, day);
  }
  if (recurrence === "semestral") {
    const total = year * 12 + (month - 1) + 6;
    return clampToMonth(Math.floor(total / 12), (total % 12) + 1, day);
  }
  if (recurrence === "anual") {
    return clampToMonth(year + 1, month, day);
  }
  return date;
}
