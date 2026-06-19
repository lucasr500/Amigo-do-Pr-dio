// Merge puro das Ordens de Serviço (local ↔ remoto). Sem React, sem localStorage, sem rede.
// Une por id, last-write-wins por updatedAt ?? createdAt. Sem tombstones (cancelamento é status).

import type { ServiceOrder } from "@/lib/service-orders";

type WithTimestamps = { id: string; createdAt: string; updatedAt?: string };

function ts(e: WithTimestamps): string {
  return e.updatedAt ?? e.createdAt ?? "";
}

function mergeById<T extends WithTimestamps>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const e of local) byId.set(e.id, e);
  for (const e of remote) {
    const existing = byId.get(e.id);
    if (!existing) { byId.set(e.id, e); continue; }
    if (ts(e) > ts(existing)) byId.set(e.id, e);
  }
  return Array.from(byId.values());
}

export function mergeServiceOrders(local: ServiceOrder[], remote: ServiceOrder[]): ServiceOrder[] {
  return mergeById(local, remote);
}
