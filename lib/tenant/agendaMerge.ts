// Merge puro de eventos de Agenda (local ↔ remoto) — Fatia 2a (pronto para 2b).
// Sem React, sem localStorage, sem rede. Determinístico e testável.
//
// Regra: une por `id`; em conflito vence o evento com timestamp mais recente
// (updatedAt ?? createdAt). A AUSÊNCIA de um id em um dos lados NÃO apaga o evento
// (sem tombstones nesta fase) — exclusões são tratadas pelo push, não pela ausência.

import type { AgendaEvent } from "@/lib/session-agenda";

function eventTimestamp(e: AgendaEvent): string {
  return e.updatedAt ?? e.createdAt ?? "";
}

export function mergeAgendaEvents(
  local: AgendaEvent[],
  remote: AgendaEvent[]
): AgendaEvent[] {
  const byId = new Map<string, AgendaEvent>();

  for (const e of local) byId.set(e.id, e);

  for (const e of remote) {
    const existing = byId.get(e.id);
    if (!existing) {
      byId.set(e.id, e);
      continue;
    }
    // Conflito: mantém o mais recente. Em empate, preserva o já presente (local).
    if (eventTimestamp(e) > eventTimestamp(existing)) {
      byId.set(e.id, e);
    }
  }

  return Array.from(byId.values());
}
