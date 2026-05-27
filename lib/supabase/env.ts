// Validação de env vars do Supabase — executada apenas em runtime, nunca no bundle inicial.

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

let _cached: SupabaseEnv | null | undefined = undefined;

export function getSupabaseEnv(): SupabaseEnv | null {
  if (_cached !== undefined) return _cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.trim() === "" || anonKey.trim() === "") {
    _cached = null;
    return null;
  }

  // Validação mínima de formato
  try {
    new URL(url);
  } catch {
    _cached = null;
    return null;
  }

  _cached = { url: url.trim(), anonKey: anonKey.trim() };
  return _cached;
}

export function hasSupabaseEnv(): boolean {
  return getSupabaseEnv() !== null;
}
