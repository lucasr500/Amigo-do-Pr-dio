// Merge puro das Enquetes (local ↔ remoto) — polls E votes. Sem React, sem localStorage,
// sem rede. Determinístico. Espelha o par mergeAssemblies + mergeAgendaItems: cada sub-
// entidade tem seu merge por id (last-write-wins). Votos não têm updatedAt — o critério
// cai em createdAt (votos são imutáveis; re-voto = delete + insert, tratado pelo push).

import type { Poll, PollVote } from "@/lib/community-types";

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

export function mergePolls(local: Poll[], remote: Poll[]): Poll[] {
  return mergeById(local, remote);
}

export function mergeVotes(local: PollVote[], remote: PollVote[]): PollVote[] {
  return mergeById(local, remote);
}
