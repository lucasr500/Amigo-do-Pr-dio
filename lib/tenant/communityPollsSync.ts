// Cutover de LEITURA das Enquetes (011) — reconcilia DUAS sub-entidades (polls + votes).
// Puxa polls e votos remotos do condomínio ativo, faz merge com os stores locais e grava.
// A UI segue lendo os stores locais (getPolls/getVotes/getPollResults) — um único caminho.
//
// SEGURANÇA (invariante): com `polls_remote_enabled` off OU anônimo OU sem condomínio,
// é NO-OP TOTAL — stores locais intocados, byte-a-byte idêntico ao atual. A privacidade do
// voto é da RLS: listRemoteVotes só retorna o próprio voto + (p/ gestão) todos.
//
// Vive separado de community-polls.ts para não criar ciclo de import.

import { isEnabled } from "@/lib/feature-flags";
import { getPolls, savePolls, getVotes, saveVotes } from "@/lib/community-polls";
import { listRemotePolls, listRemoteVotes } from "@/lib/tenant/communityPollsRemote";
import { mergePolls, mergeVotes } from "@/lib/tenant/communityPollsMerge";

export type PullResult = { merged: boolean; remoteCount: number };

/**
 * Cutover de leitura: merge remoto→local de polls e votes, preservando local-first.
 * No-op (sem tocar os stores) com off / anônimo / sem condomínio / remoto vazio.
 * Best-effort: nunca lança.
 */
export async function pullRemotePolls(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("polls_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remotePolls = await listRemotePolls();
    const remoteVotes = await listRemoteVotes();
    let merged = false;
    if (remotePolls.length > 0) { savePolls(mergePolls(getPolls(), remotePolls)); merged = true; }
    if (remoteVotes.length > 0) { saveVotes(mergeVotes(getVotes(), remoteVotes)); merged = true; }
    return { merged, remoteCount: remotePolls.length + remoteVotes.length };
  } catch {
    return { merged: false, remoteCount: 0 };
  }
}
