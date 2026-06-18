// Cutover de LEITURA dos Documentos (012) — deliberado e reversível.
// Puxa os documentos remotos do condomínio ativo, faz merge com o store local e grava.
// A UI segue lendo getPublicDocuments() — um único caminho de leitura.
//
// SEGURANÇA (invariante): com `documents_remote_enabled` off OU anônimo OU sem condomínio,
// é NO-OP TOTAL — store local intocado, byte-a-byte idêntico ao atual.

import { isEnabled } from "@/lib/feature-flags";
import { getPublicDocuments, savePublicDocuments } from "@/lib/community-documents";
import { listRemoteDocuments } from "@/lib/tenant/communityDocumentsRemote";
import { mergeDocuments } from "@/lib/tenant/communityDocumentsMerge";

export type PullResult = { merged: boolean; remoteCount: number };

export async function pullRemoteDocuments(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("documents_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemoteDocuments();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getPublicDocuments();
    const merged = mergeDocuments(local, remote);
    savePublicDocuments(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    return { merged: false, remoteCount: 0 };
  }
}
