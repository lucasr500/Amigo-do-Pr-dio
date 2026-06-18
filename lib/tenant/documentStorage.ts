// Supabase Storage — arquivos de Documentos (013), gated-off e best-effort.
// O bucket é PRIVADO; download só por signed URL (expira). Caminho do objeto:
//   "<condominio_id>/documents/<doc_id>/<arquivo>"
// A RLS de storage.objects (migration 013) garante isolamento entre condomínios e o
// respeito à visibilidade do documento — provados no gate contra Postgres real.
//
// Gating em toda função: sem window, flag `documents_remote_enabled` off ou sem condomínio
// → no-op (retorna null). NUNCA lança. Falha de rede = no-op; o local nunca regride.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";

const BUCKET = "condominio-docs";

type DbError = { message: string } | null;
type UploadBody = Blob | ArrayBuffer | Uint8Array | string;

type StorageBucket = {
  upload: (path: string, body: UploadBody, opts?: { contentType?: string; upsert?: boolean }) => Promise<{ error: DbError }>;
  createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: DbError }>;
};
type DocsUpdate = {
  update: (patch: { storage_path: string }) => {
    eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: DbError }> };
  };
};
type SupabaseClient = {
  storage: { from: (b: string) => StorageBucket };
  from: (t: "community_documents") => DocsUpdate;
};

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

/** Caminho canônico do objeto de um documento. Escopo por condomínio no 1º segmento. */
export function buildDocumentStoragePath(condominioId: string, docId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]+/g, "_");
  return `${condominioId}/documents/${docId}/${safe}`;
}

/**
 * Sobe o arquivo de um documento (best-effort, gated) e grava `storage_path` na linha
 * relacional. Retorna o caminho do objeto ou null (no-op com flag off / anônimo / falha).
 */
export async function uploadDocumentFile(docId: string, filename: string, body: UploadBody, contentType?: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isEnabled("documents_remote_enabled")) return null;
  const condId = getActiveCondominioId();
  if (!condId) return null;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return null;
    const sb = asClient(rawClient);
    const path = buildDocumentStoragePath(condId, docId, filename);
    const { error } = await sb.storage.from(BUCKET).upload(path, body, { contentType, upsert: true });
    if (error) return null;
    // Referencia o objeto no metadado (a RLS de UPDATE só deixa a gestão fazê-lo).
    await sb.from("community_documents").update({ storage_path: path }).eq("condominio_id", condId).eq("id", docId);
    return path;
  } catch {
    return null;
  }
}

/**
 * Gera uma signed URL (expira) para baixar o arquivo. Sujeita à RLS de objeto: o usuário
 * só obtém a URL se a visibilidade do documento alcançar seu papel. No-op → null.
 */
export async function getDocumentSignedUrl(storagePath: string, expiresInSeconds = 300): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isEnabled("documents_remote_enabled")) return null;
  if (!getActiveCondominioId()) return null;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return null;
    const sb = asClient(rawClient);
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
