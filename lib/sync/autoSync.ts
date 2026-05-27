// Auto-sync com debounce, retry e fila offline.
// Acionado após mudanças de dados quando o usuário está autenticado e sync_enabled.

import { isEnabled } from "@/lib/feature-flags";
import { setSyncSyncing, setSyncSynced, setSyncError, setSyncOffline } from "@/lib/sync/syncStatus";
import { getUserBackupJson, type UserBackup } from "@/lib/session";

const QUEUE_KEY = "amigo_sync_queue";
const DEBOUNCE_MS = 4_000;   // 4 s após última chamada
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 8_000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

interface SyncJob {
  userId: string;
  enqueuedAt: string;
}

function readQueue(): SyncJob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncJob) : null;
  } catch {
    return null;
  }
}

function writeQueue(job: SyncJob | null): void {
  if (typeof window === "undefined") return;
  try {
    if (job) localStorage.setItem(QUEUE_KEY, JSON.stringify(job));
    else localStorage.removeItem(QUEUE_KEY);
  } catch { /* quota — ignora */ }
}

async function executeSync(userId: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setSyncOffline();
    return false;
  }

  try {
    const { uploadSnapshot } = await import("@/lib/sync/syncEngine");
    setSyncSyncing();
    const backup = JSON.parse(getUserBackupJson()) as UserBackup;
    const result = await uploadSnapshot(userId, backup);
    if (result.ok) {
      setSyncSynced();
      writeQueue(null);
      retryCount = 0;
      return true;
    } else {
      setSyncError(result.error ?? "Erro desconhecido.");
      return false;
    }
  } catch (e) {
    setSyncError(e instanceof Error ? e.message : "Erro de rede.");
    return false;
  }
}

async function retryLoop(userId: string): Promise<void> {
  if (retryCount >= MAX_RETRIES) {
    retryCount = 0;
    return;
  }
  retryCount++;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * retryCount));
  const ok = await executeSync(userId);
  if (!ok) retryLoop(userId);
}

// Chama após qualquer mutação de dados.
// userId: ID do usuário autenticado.
export function scheduleSync(userId: string): void {
  if (!isEnabled("sync_enabled")) return;
  if (!userId || userId === "guest") return;

  // Salva na fila para sobreviver a recargas de página
  writeQueue({ userId, enqueuedAt: new Date().toISOString() });

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    const ok = await executeSync(userId);
    if (!ok) retryLoop(userId);
  }, DEBOUNCE_MS);
}

// Deve ser chamado no startup para reprocessar jobs pendentes (ex: offline → online).
export async function flushPendingSync(): Promise<void> {
  if (!isEnabled("sync_enabled")) return;
  const job = readQueue();
  if (!job) return;
  await executeSync(job.userId);
}

// Registra listener online para flush automático ao reconectar.
export function startOnlineListener(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    const job = readQueue();
    if (job) executeSync(job.userId);
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
