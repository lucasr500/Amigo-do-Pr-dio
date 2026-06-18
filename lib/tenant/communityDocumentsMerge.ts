// Merge puro dos Documentos (local ↔ remoto). Sem React, sem localStorage, sem rede.
// Determinístico. Espelha os demais *Merge: une por id, last-write-wins por updatedAt ??
// createdAt, sem tombstones (exclusões via push).

import type { PublicDocument } from "@/lib/community-types";

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

export function mergeDocuments(local: PublicDocument[], remote: PublicDocument[]): PublicDocument[] {
  return mergeById(local, remote);
}
