// Cutover de LEITURA do Canal de Solicitações (010) — deliberado e reversível.
// Puxa as solicitações remotas do condomínio ativo, faz merge com o store local e grava
// localmente. A UI segue lendo o store local (getRequests/…) — um único caminho de leitura.
//
// SEGURANÇA (invariante): com `requests_remote_enabled` off OU anônimo OU sem condomínio,
// é NO-OP TOTAL — store local intocado, byte-a-byte idêntico ao atual.
//
// Vive separado de community-requests.ts para não criar ciclo de import.

import { isEnabled } from "@/lib/feature-flags";
import { getRequests, saveRequests } from "@/lib/community-requests";
import { listRemoteRequests } from "@/lib/tenant/communityRequestsRemote";
import { mergeRequests } from "@/lib/tenant/communityRequestsMerge";

export type PullResult = { merged: boolean; remoteCount: number };

/**
 * Cutover de leitura: merge remoto→local, preservando local-first como fallback.
 * Retorna { merged:false } sem tocar o store quando off / anônimo / sem condomínio /
 * remoto vazio. Best-effort: nunca lança.
 */
export async function pullRemoteRequests(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("requests_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemoteRequests();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getRequests();
    const merged = mergeRequests(local, remote);
    saveRequests(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    return { merged: false, remoteCount: 0 };
  }
}
