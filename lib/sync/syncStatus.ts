// Estado de sincronização — persiste o último status para exibição na UI.

const KEY = "amigo_sync_status";

export type SyncState = "idle" | "local_only" | "ready_to_sync" | "syncing" | "synced" | "error" | "offline";

export interface SyncStatus {
  state: SyncState;
  lastSyncAt: string | null; // ISO timestamp
  errorMsg: string | null;
}

function read(): SyncStatus {
  if (typeof window === "undefined")
    return { state: "idle", lastSyncAt: null, errorMsg: null };
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? (JSON.parse(raw) as SyncStatus)
      : { state: "idle", lastSyncAt: null, errorMsg: null };
  } catch {
    return { state: "idle", lastSyncAt: null, errorMsg: null };
  }
}

function write(status: SyncStatus): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(status));
  } catch { /* quota — ignora */ }
}

export function getSyncStatus(): SyncStatus {
  return read();
}

export function setSyncLocalOnly(): void {
  write({ state: "local_only", lastSyncAt: read().lastSyncAt, errorMsg: null });
}

export function setSyncReadyToSync(): void {
  write({ state: "ready_to_sync", lastSyncAt: read().lastSyncAt, errorMsg: null });
}

export function setSyncSyncing(): void {
  write({ state: "syncing", lastSyncAt: read().lastSyncAt, errorMsg: null });
}

export function setSyncSynced(): void {
  write({ state: "synced", lastSyncAt: new Date().toISOString(), errorMsg: null });
}

export function setSyncError(msg: string): void {
  write({ state: "error", lastSyncAt: read().lastSyncAt, errorMsg: msg });
}

export function setSyncOffline(): void {
  write({ state: "offline", lastSyncAt: read().lastSyncAt, errorMsg: null });
}

export function formatLastSync(iso: string | null): string {
  if (!iso) return "Nunca sincronizado";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Agora mesmo";
  if (mins < 60) return `Há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs}h`;
  return `Há ${Math.floor(hrs / 24)}d`;
}
