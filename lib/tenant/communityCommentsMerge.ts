// Merge puro dos Comentários (local ↔ remoto). Sem React, sem localStorage, sem rede.
// Determinístico. Une por id, last-write-wins por updatedAt ?? createdAt. Sem tombstones:
// a ausência não apaga (remoção é status 'removido', tratada pelo push).

import type { Comment } from "@/lib/community-types";

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

export function mergeComments(local: Comment[], remote: Comment[]): Comment[] {
  return mergeById(local, remote);
}
