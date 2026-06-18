// Rate limiter em memória para rotas server-side.
// LIMITAÇÃO CONHECIDA: resets a cada cold start serverless.
// Protege contra brute force manual, não contra ataques distribuídos.
// Para proteção real distribuída: usar Vercel Rate Limiting ou Upstash Redis.

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitWindow>();

export interface RateLimitOptions {
  /** Requests permitidas na janela */
  limit: number;
  /** Janela em milissegundos */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/** Extrai IP do request Next.js, priorizando headers de proxy. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Verifica e incrementa o contador de rate limit para uma chave.
 * Seguro para uso concorrente em um único processo.
 */
export function checkRateLimit(
  key: string,
  opts: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // Janela nova ou expirada
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.limit - 1, resetAt };
  }

  if (entry.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt };
}

// Limpeza periódica de janelas expiradas (evita memory leak em processos long-lived)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, 60_000);
}
