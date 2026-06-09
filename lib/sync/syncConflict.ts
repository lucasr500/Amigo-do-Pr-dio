// Comparação pura local vs remoto para detecção de conflito de snapshot.
// Sem efeitos colaterais — usável em testes sem mocks de Supabase.

import type { UserBackup } from "@/lib/session";
import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";

export type SnapshotConflictStatus =
  | "no_remote"
  | "remote_newer"
  | "local_newer"
  | "conflict";

export type SnapshotConflictResult =
  | { status: "no_remote" }
  | { status: "remote_newer" }
  | { status: "local_newer" }
  | { status: "conflict"; reason: string };

// 2-second tolerance to avoid false conflicts from clock skew
const CLOCK_TOLERANCE_MS = 2_000;

/**
 * Compara snapshot local com metadados remotos para decidir ação de sync.
 *
 * @param localBackup   - Backup local atual (UserBackup)
 * @param remoteMeta    - Metadados do snapshot remoto (sem payload)
 * @param lastLocalSyncAt - ISO timestamp da última sincronização bem-sucedida
 *                          deste dispositivo (getSyncStatus().lastSyncAt)
 */
export function compareSnapshots(
  localBackup: UserBackup,
  remoteMeta: RemoteSnapshotMeta | null,
  lastLocalSyncAt: string | null = null
): SnapshotConflictResult {
  // Sem remoto → upload seguro
  if (!remoteMeta || !remoteMeta.exists) {
    return { status: "no_remote" };
  }

  const remoteAtRaw = remoteMeta.updatedAt
    ? new Date(remoteMeta.updatedAt).getTime()
    : 0;
  const remoteAt = isNaN(remoteAtRaw) ? 0 : remoteAtRaw;

  const localSyncAtRaw = lastLocalSyncAt
    ? new Date(lastLocalSyncAt).getTime()
    : NaN;
  const effectiveLastSyncAt = !lastLocalSyncAt || isNaN(localSyncAtRaw) ? null : localSyncAtRaw;

  // Nunca sincronizou deste dispositivo (ou timestamp inválido — trata igual)
  if (effectiveLastSyncAt === null) {
    if (!hasSignificantData(localBackup)) {
      // Local vazio → restaurar remoto é seguro
      return { status: "remote_newer" };
    }
    // Ambos têm dados e sem histórico de sync → pedir ao usuário
    return {
      status: "conflict",
      reason: "Existe um backup na nuvem. Escolha qual versão manter.",
    };
  }

  const localSyncAt = effectiveLastSyncAt;

  // Remoto mais recente que nosso último sync → outro dispositivo enviou
  if (remoteAt > localSyncAt + CLOCK_TOLERANCE_MS) {
    if (!hasSignificantData(localBackup)) {
      return { status: "remote_newer" };
    }
    return {
      status: "conflict",
      reason:
        "Um outro dispositivo atualizou o backup. Escolha qual versão manter.",
    };
  }

  // Nosso último sync é igual ou mais recente que o remoto → local é autoritativo
  return { status: "local_newer" };
}

/** Retorna true se o backup local tem dados operacionais relevantes. */
export function hasSignificantData(backup: UserBackup): boolean {
  return !!(
    backup.profile?.nomeCondominio ||
    (backup.pendencias && backup.pendencias.length > 0) ||
    (backup.ocorrencias && backup.ocorrencias.length > 0) ||
    (backup.agenda && backup.agenda.length > 0) ||
    (backup.manutencoes && backup.manutencoes.length > 0) ||
    (backup.communityPosts && backup.communityPosts.length > 0) ||
    (backup.communityRequests && backup.communityRequests.length > 0)
  );
}
