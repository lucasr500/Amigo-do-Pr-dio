// Cutover de LEITURA do Mural (009) — deliberado e reversível.
// Puxa os posts remotos do condomínio ativo, faz merge com o store local e grava
// o resultado localmente. A UI segue lendo o store local (getPosts/getActivePosts/…)
// — um único caminho de leitura, sem read-through espalhado.
//
// SEGURANÇA (invariante): com `mural_remote_enabled` off OU anônimo OU sem condomínio,
// é NO-OP TOTAL — o store local não é tocado, comportamento byte-a-byte idêntico ao
// atual. O pull só roda quando chamado a partir do fluxo de sync/auth (app/page.tsx).
//
// Vive separado de community-posts.ts para não criar ciclo de import (community-posts
// importa communityPostsRemote; este módulo importa community-posts + Remote + Merge).

import { isEnabled } from "@/lib/feature-flags";
import { getPosts, savePosts } from "@/lib/community-posts";
import { listRemotePosts } from "@/lib/tenant/communityPostsRemote";
import { mergePosts } from "@/lib/tenant/communityPostsMerge";

export type PullResult = { merged: boolean; remoteCount: number };

/**
 * Cutover de leitura: merge remoto→local, preservando local-first como fallback.
 * Retorna { merged:false } sem tocar o store quando a flag está off / anônimo /
 * sem condomínio / remoto vazio. Best-effort: nunca lança.
 */
export async function pullRemotePosts(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("mural_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemotePosts();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getPosts();
    const merged = mergePosts(local, remote);
    savePosts(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    // Falha de rede/SDK nunca regride o local — segue local-first.
    return { merged: false, remoteCount: 0 };
  }
}
