// Diagnóstico de cloud backup — função pura, sem efeitos colaterais.
// Recebe estado como parâmetros para facilitar testes sem mocks de ambiente.

import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";
import type { SyncState } from "@/lib/sync/syncStatus";
import type { UserBackup } from "@/lib/session";
import { compareSnapshots } from "@/lib/sync/syncConflict";
import { formatLastSync } from "@/lib/sync/syncStatus";

export type CloudBackupStatus =
  | "local_only"    // não autenticado — dados só no dispositivo
  | "ready"         // autenticado, sem backup remoto ainda
  | "synced"        // backup remoto atualizado (< 7 dias)
  | "stale"         // backup remoto desatualizado (>= 7 dias)
  | "conflict"      // versões local/remoto divergem
  | "demo_paused"   // Demo Mode ativo — sync pausado
  | "offline"       // sem rede com backup pendente
  | "error";        // erro na última tentativa

export interface CloudBackupDiagnostics {
  isAuthenticated: boolean;
  isDemoActive: boolean;
  hasRemoteBackup: boolean;
  remoteUpdatedAt: string | null;
  remoteVersion: number | null;
  lastLocalSyncAt: string | null;
  autoBackupEnabled: boolean;
  status: CloudBackupStatus;
  message: string;
}

const STALE_DAYS = 7;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

export interface DiagnosticsInput {
  isAuthenticated: boolean;
  isDemo: boolean;
  isOnline: boolean;
  remoteMeta: RemoteSnapshotMeta | null;
  syncState: SyncState;
  lastLocalSyncAt: string | null;
  autoBackupEnabled: boolean;
  localBackup?: UserBackup | null;
}

export function getCloudBackupDiagnostics(input: DiagnosticsInput): CloudBackupDiagnostics {
  const {
    isAuthenticated,
    isDemo,
    isOnline,
    remoteMeta,
    syncState,
    lastLocalSyncAt,
    autoBackupEnabled,
    localBackup,
  } = input;

  const base: Omit<CloudBackupDiagnostics, "status" | "message"> = {
    isAuthenticated,
    isDemoActive: isDemo,
    hasRemoteBackup: remoteMeta?.exists ?? false,
    remoteUpdatedAt: remoteMeta?.updatedAt ?? null,
    remoteVersion: remoteMeta?.version ?? null,
    lastLocalSyncAt,
    autoBackupEnabled,
  };

  // Demo Mode — maior prioridade
  if (isDemo) {
    return {
      ...base,
      status: "demo_paused",
      message: "Modo demonstração ativo. Backup pausado para proteger seus dados reais.",
    };
  }

  // Não autenticado
  if (!isAuthenticated) {
    return {
      ...base,
      status: "local_only",
      message: "Seus dados ficam neste dispositivo. Faça login para ativar o backup na nuvem.",
    };
  }

  // Offline com backup pendente
  if (!isOnline && syncState === "offline") {
    return {
      ...base,
      status: "offline",
      message: "Sem conexão. O backup será retomado automaticamente quando voltar online.",
    };
  }

  // Erro na última tentativa
  if (syncState === "error") {
    return {
      ...base,
      status: "error",
      message: "Erro ao sincronizar. Tente salvar novamente ou use o backup manual.",
    };
  }

  // Conflito entre local e remoto
  if (localBackup && remoteMeta?.exists) {
    const cmp = compareSnapshots(localBackup, remoteMeta, lastLocalSyncAt);
    if (cmp.status === "conflict") {
      return {
        ...base,
        status: "conflict",
        message: cmp.reason ?? "Versões diferentes encontradas. Resolva o conflito antes de continuar.",
      };
    }
  }

  // Sem backup remoto ainda
  if (!remoteMeta?.exists) {
    return {
      ...base,
      status: "ready",
      message: "Conta conectada. Nenhum backup na nuvem ainda. Salve agora para proteger seus dados.",
    };
  }

  // Tem backup remoto — verificar desatualização
  const lastSync = lastLocalSyncAt ? new Date(lastLocalSyncAt).getTime() : NaN;
  const isStale = isNaN(lastSync) || Date.now() - lastSync > STALE_MS;

  if (isStale) {
    const when = lastLocalSyncAt ? `Último backup ${formatLastSync(lastLocalSyncAt)}.` : "Nunca sincronizado neste dispositivo.";
    return {
      ...base,
      status: "stale",
      message: `Backup desatualizado. ${when} Salve agora.`,
    };
  }

  return {
    ...base,
    status: "synced",
    message: `Backup na nuvem salvo ${formatLastSync(lastLocalSyncAt)}.`,
  };
}
