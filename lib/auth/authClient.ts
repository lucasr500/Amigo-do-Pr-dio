// Stub de arquitetura — Fase 89A
// Implementar quando @supabase/supabase-js for instalado e auth real for habilitada.

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

// TODO: implementar com createSupabaseClient() quando SDK instalado
export async function signIn(_email: string, _password: string): Promise<AuthResult> {
  return { session: null, error: "Auth não disponível neste ciclo." };
}

// TODO: implementar com createSupabaseClient() quando SDK instalado
export async function signUp(_email: string, _password: string): Promise<AuthResult> {
  return { session: null, error: "Auth não disponível neste ciclo." };
}

// TODO: implementar com createSupabaseClient() quando SDK instalado
export async function signOut(): Promise<{ error: string | null }> {
  return { error: null };
}

// TODO: implementar com createSupabaseClient() quando SDK instalado
export async function getSession(): Promise<AuthSession | null> {
  return null;
}
