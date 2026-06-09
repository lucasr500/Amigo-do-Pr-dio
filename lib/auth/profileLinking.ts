// Vínculo entre amigo_local_id (guest) e auth.uid() (Supabase).
// Chamado após o primeiro login para preservar dados criados como guest.
// Idempotente: seguro chamar múltiplas vezes.

export interface ClaimResult {
  ok: boolean;
  error: string | null;
}

export async function claimLocalId(
  userId: string,
  localId: string
): Promise<ClaimResult> {
  if (!userId || userId === "guest") {
    return { ok: false, error: "Usuário não autenticado." };
  }
  if (!localId || localId === "guest") {
    return { ok: false, error: "Local ID inválido." };
  }

  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const sb = await getSupabaseClient();
    if (!sb) return { ok: false, error: "Supabase não configurado." };

    const { error } = await (sb as unknown as {
      from: (t: string) => {
        upsert: (row: Record<string, string>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("profiles")
      .upsert({ id: userId, local_id: localId }, { onConflict: "id" });

    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}
