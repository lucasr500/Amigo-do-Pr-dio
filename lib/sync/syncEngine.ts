// Stub de arquitetura — Fase 89A
// Implementar quando @supabase/supabase-js for instalado e sessão ativa existir.

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

// TODO: implementar com createSupabaseClient() + upsert em app_snapshots
export async function uploadSnapshot(
  _userId: string,
  _backup: UserBackup
): Promise<SyncResult> {
  return { ok: false, error: "Sync não disponível neste ciclo." };
}

// TODO: implementar com createSupabaseClient() + select em app_snapshots
export async function downloadSnapshot(_userId: string): Promise<UserBackup | null> {
  return null;
}

// Monta o objeto de snapshot a partir do backup local
export function buildSnapshot(userId: string, backup: UserBackup): SnapshotPayload {
  return {
    user_id: userId,
    payload: backup,
    version: 4,
    device_hint: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : null,
  };
}
