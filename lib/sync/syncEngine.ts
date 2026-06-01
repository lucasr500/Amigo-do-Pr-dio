// Motor de sincronização — upload/download de snapshots no Supabase.
// Lazy-loaded: o SDK nunca entra no bundle inicial.

import type { UserBackup } from "@/lib/session";
import { SESSION_SCHEMA_VERSION } from "@/lib/session";

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

function devLog(msg: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[sync] ${msg}`, data ?? "");
  }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb as any)
      .from("app_snapshots")
      .upsert(
        {
          user_id: snap.user_id,
          payload: snap.payload,
          version: snap.version,
          device_hint: snap.device_hint,
        },
        { onConflict: "user_id" }
      );

    if (error) {
      devLog("upload failed", { userId: userId.slice(0, 8) + "…", error: (error as { message: string }).message });
      return { ok: false, error: (error as { message: string }).message };
    }

    devLog("upload ok", { userId: userId.slice(0, 8) + "…", version: snap.version });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any)
      .from("app_snapshots")
      .select("payload, version")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return (data as { payload: UserBackup }).payload;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any)
      .from("app_snapshots")
      .select("version, updated_at")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error || !data) return { exists: false, version: null, updatedAt: null };

    const row = data as { version: number; updated_at: string };
    devLog("remote meta", { userId: userId.slice(0, 8) + "…", version: row.version });
    return { exists: true, version: row.version, updatedAt: row.updated_at };
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
