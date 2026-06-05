// Motor de sincronização — upload/download de snapshots no Supabase.
// Lazy-loaded: o SDK nunca entra no bundle inicial.

import type { UserBackup } from "@/lib/session";
import { SESSION_SCHEMA_VERSION } from "@/lib/session";
import { syncDebug } from "@/lib/sync/syncLogger";

export interface SnapshotPayload {
  user_id: string;
  payload: UserBackup;
  version: number;
  device_hint: string | null;
}

export interface SyncResult {
  ok: boolean;
  error: string | null;
}

export interface RemoteSnapshotMeta {
  exists: boolean;
  version: number | null;
  updatedAt: string | null;
}

type SyncError = { message: string };

type AppSnapshotRecord = {
  user_id: string;
  payload: UserBackup;
  version: number;
  device_hint: string | null;
};

type AppSnapshotQuery<T> = {
  eq: (column: string, value: string) => AppSnapshotQuery<T>;
  order: (column: string, opts: { ascending: boolean }) => AppSnapshotQuery<T>;
  limit: (count: number) => AppSnapshotQuery<T>;
  single: () => Promise<{ data: T | null; error: SyncError | null }>;
};

type AppSnapshotsTable = {
  upsert: (
    record: AppSnapshotRecord,
    options: { onConflict: string }
  ) => Promise<{ error: SyncError | null }>;
  select: <T>(columns: string) => AppSnapshotQuery<T>;
};

function appSnapshotsTable(client: unknown): AppSnapshotsTable {
  return (client as { from: (table: "app_snapshots") => AppSnapshotsTable }).from("app_snapshots");
}

// Faz upsert do snapshot local para app_snapshots.
export async function uploadSnapshot(
  userId: string,
  backup: UserBackup
): Promise<SyncResult> {
  if (!userId || userId === "guest") {
    return { ok: false, error: "Usuário não autenticado." };
  }

  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const sb = await getSupabaseClient();
    if (!sb) return { ok: false, error: "Supabase não configurado." };

    const snap = buildSnapshot(userId, backup);
    const table = appSnapshotsTable(sb);

    const { error } = await table.upsert(
      {
        user_id: snap.user_id,
        payload: snap.payload,
        version: snap.version,
        device_hint: snap.device_hint,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      syncDebug("sync", "upload failed", { userId: userId.slice(0, 8) + "…", error: error.message });
      return { ok: false, error: error.message };
    }

    syncDebug("sync", "upload ok", { userId: userId.slice(0, 8) + "…", version: snap.version });
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}

// Baixa o snapshot mais recente do usuário.
export async function downloadSnapshot(userId: string): Promise<UserBackup | null> {
  if (!userId || userId === "guest") return null;

  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const sb = await getSupabaseClient();
    if (!sb) return null;
    const table = appSnapshotsTable(sb);

    const { data, error } = await table
      .select<{ payload: UserBackup; version: number }>("payload, version")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.payload;
  } catch {
    return null;
  }
}

// Verifica metadados do backup remoto sem baixar o payload.
export async function checkRemoteSnapshot(userId: string): Promise<RemoteSnapshotMeta> {
  if (!userId || userId === "guest") return { exists: false, version: null, updatedAt: null };

  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const sb = await getSupabaseClient();
    if (!sb) return { exists: false, version: null, updatedAt: null };
    const table = appSnapshotsTable(sb);

    const { data, error } = await table
      .select<{ version: number; updated_at: string }>("version, updated_at")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error || !data) return { exists: false, version: null, updatedAt: null };

    syncDebug("sync", "remote meta", { userId: userId.slice(0, 8) + "…", version: data.version });
    return { exists: true, version: data.version, updatedAt: data.updated_at };
  } catch {
    return { exists: false, version: null, updatedAt: null };
  }
}

export function buildSnapshot(userId: string, backup: UserBackup): SnapshotPayload {
  return {
    user_id: userId,
    payload: backup,
    version: SESSION_SCHEMA_VERSION,
    device_hint:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : null,
  };
}
