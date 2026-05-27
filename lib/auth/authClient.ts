// Cliente de autenticação — magic link via Supabase.
// Usa getSupabaseClient() lazy para não incluir SDK no bundle inicial.

import { getSupabaseClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface AuthResult {
  session: AuthSession | null;
  error: string | null;
}

// Envia magic link para o email informado.
export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
  const sb = await getSupabaseClient();
  if (!sb) return { error: "Serviço de autenticação não configurado." };

  const { error } = await sb.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
    },
  });

  if (error) return { error: error.message };
  return { error: null };
}

// Obtém a sessão ativa (se houver).
export async function getSession(): Promise<AuthSession | null> {
  const sb = await getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb.auth.getSession();
  if (error || !data.session) return null;

  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email ?? null,
    },
    accessToken: data.session.access_token,
  };
}

// Encerra a sessão ativa.
export async function signOut(): Promise<{ error: string | null }> {
  const sb = await getSupabaseClient();
  if (!sb) return { error: null };

  const { error } = await sb.auth.signOut();
  if (error) return { error: error.message };
  return { error: null };
}

// Registra listener de mudança de auth state — retorna função de cleanup.
export async function onAuthStateChange(
  callback: (session: AuthSession | null) => void
): Promise<() => void> {
  const sb = await getSupabaseClient();
  if (!sb) return () => {};

  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      callback(null);
      return;
    }
    callback({
      user: { id: session.user.id, email: session.user.email ?? null },
      accessToken: session.access_token,
    });
  });

  return () => data.subscription.unsubscribe();
}
