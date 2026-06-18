// Cutover de LEITURA de Decisões (D4) — deliberado e reversível.
// Puxa as decisões remotas do condomínio ativo, faz merge com o store local e grava
// o resultado localmente. A UI segue lendo o store local (getDecisions) — um único
// caminho de leitura, sem read-through espalhado.
//
// SEGURANÇA (invariante): com `decisions_remote_enabled` off OU anônimo OU sem
// condomínio, é NO-OP TOTAL — o store local não é tocado, comportamento byte-a-byte
// idêntico ao atual. Nada de backfill silencioso: o pull só roda quando chamado a
// partir do fluxo de sync/auth (ainda NÃO fiado — ver decisionsSync.wiring pendente).
//
// Vive separado de decisions.ts para não criar ciclo de import (decisions.ts importa
// decisionsRemote; este módulo importa decisions + decisionsRemote + decisionsMerge).

import { isEnabled } from "@/lib/feature-flags";
import { getDecisions, saveDecisions } from "@/lib/decisions";
import { listRemoteDecisions } from "@/lib/tenant/decisionsRemote";
import { mergeDecisions } from "@/lib/tenant/decisionsMerge";

export type PullResult = { merged: boolean; remoteCount: number };

/**
 * Cutover de leitura: merge remoto→local, preservando local-first como fallback.
 * Retorna { merged:false } sem tocar o store quando a flag está off / anônimo /
 * sem condomínio / remoto vazio. Best-effort: nunca lança.
 */
export async function pullRemoteDecisions(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("decisions_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemoteDecisions();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getDecisions();
    const merged = mergeDecisions(local, remote);
    saveDecisions(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    // Falha de rede/SDK nunca regride o local — segue local-first.
    return { merged: false, remoteCount: 0 };
  }
}
