// Mensagens amigáveis para códigos de erro de autenticação.
// O callback (/auth/callback) converte erros do Supabase em códigos seguros
// (whitelist) e redireciona para /?auth_error=<código>. A UI usa este mapa.

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  otp_expired:
    "Seu link de acesso expirou. Peça um novo link na área de conta.",
  access_denied:
    "O acesso pelo link não foi autorizado. Peça um novo link na área de conta.",
  auth_failed:
    "Não foi possível entrar pelo link. Peça um novo acesso na área de conta.",
};

/** Retorna a mensagem amigável para o código — fallback genérico para códigos desconhecidos. */
export function authErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.auth_failed;
}

/**
 * Lê e consome o auth_error da URL atual (uma única vez).
 * Remove o parâmetro via history.replaceState para não reaparecer em reload.
 * Retorna a mensagem amigável ou null se não há erro.
 */
export function consumeAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("auth_error");
    if (!code) return null;
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    return authErrorMessage(code);
  } catch {
    return null;
  }
}
