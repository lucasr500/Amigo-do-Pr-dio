// Trilha de auditoria de moderação (016) — escrita append-only, gated, best-effort.
// Cada ação de moderação grava UMA entrada (quem/o quê/quando + snapshot). O log é relacional
// (não local-first): com `comments_remote_enabled` off, é no-op total. actor_id é DEFAULT
// auth.uid() no banco (forge-proof). NUNCA lança; falha de rede = no-op.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";

export type ModerationAction =
  | "criado" | "marcado_sensivel" | "aprovado" | "ocultado" | "removido" | "restaurado" | "denunciado";

type DbError = { message: string } | null;
type LogRow = {
  id: string; condominio_id: string; target_type: string; target_id: string;
  action: string; reason: string | null; snapshot: unknown;
};
type LogTable = { insert: (row: LogRow) => Promise<{ error: DbError }> };
type SupabaseClient = { from: (t: "moderation_log") => LogTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

function logId(): string {
  return `mlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface LogModerationParams {
  targetId: string;
  action: ModerationAction;
  reason?: string;
  snapshot?: unknown;
  targetType?: "comment" | "post";
}

export async function logModerationAction(params: LogModerationParams): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("comments_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("moderation_log").insert({
      id: logId(),
      condominio_id: condId,
      target_type: params.targetType ?? "comment",
      target_id: params.targetId,
      action: params.action,
      reason: params.reason ?? null,
      snapshot: params.snapshot ?? null,
    });
  } catch {
    /* best-effort — nunca lança */
  }
}
