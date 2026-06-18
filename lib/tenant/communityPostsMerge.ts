// Merge puro de Posts do Mural (local ↔ remoto). Sem React, sem localStorage, sem rede.
// Determinístico e testável. Espelha lib/tenant/decisionsMerge.ts:
//   une por `id`; em conflito vence o registro com timestamp mais recente
//   (updatedAt ?? createdAt). A ausência de um id em um dos lados NÃO apaga o
//   registro (sem tombstones nesta fase) — exclusões são tratadas pelo push.

import type { InstitutionalPost } from "@/lib/community-types";

type WithTimestamps = { id: string; createdAt: string; updatedAt?: string };

function ts(e: WithTimestamps): string {
  return e.updatedAt ?? e.createdAt ?? "";
}

function mergeById<T extends WithTimestamps>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const e of local) byId.set(e.id, e);
  for (const e of remote) {
    const existing = byId.get(e.id);
    if (!existing) {
      byId.set(e.id, e);
      continue;
    }
    // Conflito: mantém o mais recente. Em empate, preserva o já presente (local).
    if (ts(e) > ts(existing)) byId.set(e.id, e);
  }
  return Array.from(byId.values());
}

export function mergePosts(local: InstitutionalPost[], remote: InstitutionalPost[]): InstitutionalPost[] {
  return mergeById(local, remote);
}
