// Motor de sincronização — upload/download de snapshots no Supabase.
// Lazy-loaded: o SDK nunca entra no bundle inicial.

import type { UserBackup } from "@/lib/session";

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

// Faz upsert do snapshot local para app_snapshots.
export async function uploadSnapshot(
  userId: string,
  backup: UserBackup
): Promise<SyncResult> {
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

    if (error) return { ok: false, error: (error as { message: string }).message };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}

// Baixa o snapshot mais recente do usuário.
export async function downloadSnapshot(userId: string): Promise<UserBackup | null> {
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

export function buildSnapshot(userId: string, backup: UserBackup): SnapshotPayload {
  return {
    user_id: userId,
    payload: backup,
    version: 5,
    device_hint:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : null,
  };
}
