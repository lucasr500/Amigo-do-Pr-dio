// Cutover de LEITURA dos Comentários (014) — deliberado e reversível.
// Puxa os comentários remotos (já filtrados pela RLS de moderação status×papel) do condomínio
// ativo, faz merge com o store local e grava. A UI segue lendo getComments() / getCommentsForPost.
//
// SEGURANÇA (invariante): com `comments_remote_enabled` off OU anônimo OU sem condomínio, é
// NO-OP TOTAL — store local intocado, byte-a-byte idêntico ao atual.

import { isEnabled } from "@/lib/feature-flags";
import { getComments, saveComments } from "@/lib/community-posts";
import { listRemoteComments } from "@/lib/tenant/communityCommentsRemote";
import { mergeComments } from "@/lib/tenant/communityCommentsMerge";

export type PullResult = { merged: boolean; remoteCount: number };

export async function pullRemoteComments(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("comments_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemoteComments();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getComments();
    const merged = mergeComments(local, remote);
    saveComments(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    return { merged: false, remoteCount: 0 };
  }
}
