// Stub de arquitetura — Fase 89A
// Quando @supabase/supabase-js for instalado, substituir por:
//   import { createBrowserClient } from "@supabase/ssr";
// e remover este stub.

export interface SupabaseClientStub {
  auth: {
    signInWithPassword: (creds: { email: string; password: string }) => Promise<unknown>;
    signUp: (creds: { email: string; password: string }) => Promise<unknown>;
    signOut: () => Promise<unknown>;
    getSession: () => Promise<unknown>;
  };
  from: (table: string) => unknown;
}

export function hasSupabaseConfig(): boolean {
  return (
    typeof process !== "undefined" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// TODO: substituir por createBrowserClient() quando SDK instalado
export function createSupabaseClient(): SupabaseClientStub | null {
  if (!hasSupabaseConfig()) return null;
  // SDK não instalado neste ciclo — retorna null intencionalmente
  return null;
}
