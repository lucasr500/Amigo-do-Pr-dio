// Cliente Supabase com lazy loading — o SDK nunca entra no bundle inicial.
// Todas as funções que precisam do cliente devem ser async.

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export { hasSupabaseEnv as hasSupabaseConfig };

type AppSupabaseClient = SupabaseClient<Database>;

let _client: AppSupabaseClient | null = null;

// Retorna singleton lazy — importa SDK apenas na primeira chamada.
export async function getSupabaseClient(): Promise<AppSupabaseClient | null> {
  if (_client) return _client;

  const env = getSupabaseEnv();
  if (!env) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    _client = createClient<Database>(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "amigo_sb_session",
      },
    });
    return _client;
  } catch {
    return null;
  }
}

// Limpa o singleton (logout / troca de conta).
export function clearSupabaseClient(): void {
  _client = null;
}
