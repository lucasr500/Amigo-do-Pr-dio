import { describe, test, expect } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/api/rateLimiter";

// Os testes usam chaves únicas por teste para evitar estado compartilhado
// entre invocações (o store é singleton por módulo no mesmo processo).
let testIndex = 0;
function uniqueKey(): string {
  return `test:rl:${Date.now()}:${testIndex++}`;
}

describe("checkRateLimit", () => {
  test("primeira request é permitida", () => {
    const result = checkRateLimit(uniqueKey(), { limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test("requests dentro do limite são permitidas", () => {
    const key = uniqueKey();
    const opts = { limit: 3, windowMs: 60_000 };
    const r1 = checkRateLimit(key, opts);
    const r2 = checkRateLimit(key, opts);
    const r3 = checkRateLimit(key, opts);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  test("request além do limite é bloqueada", () => {
    const key = uniqueKey();
    const opts = { limit: 2, windowMs: 60_000 };
    checkRateLimit(key, opts);
    checkRateLimit(key, opts);
    const blocked = checkRateLimit(key, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test("chaves diferentes têm contadores independentes", () => {
    const k1 = uniqueKey();
    const k2 = uniqueKey();
    const opts = { limit: 2, windowMs: 60_000 };
    checkRateLimit(k1, opts);
    checkRateLimit(k1, opts);
    const blocked = checkRateLimit(k1, opts);
    const k2result = checkRateLimit(k2, opts);
    expect(blocked.allowed).toBe(false);
    expect(k2result.allowed).toBe(true);
  });

  test("janela expirada reseta o contador", () => {
    const key = uniqueKey();
    const opts = { limit: 1, windowMs: 1 }; // janela de 1ms
    checkRateLimit(key, opts); // esgota
    // Aguarda janela expirar
    const start = Date.now();
    while (Date.now() - start < 5) { /* spin */ }
    const result = checkRateLimit(key, opts);
    expect(result.allowed).toBe(true);
  });

  test("resetAt é maior que o momento atual", () => {
    const before = Date.now();
    const result = checkRateLimit(uniqueKey(), { limit: 5, windowMs: 10_000 });
    expect(result.resetAt).toBeGreaterThan(before);
  });
});

describe("getClientIp", () => {
  test("usa x-forwarded-for quando disponível", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  test("usa x-real-ip como fallback", () => {
    const headers = new Headers({ "x-real-ip": "5.6.7.8" });
    expect(getClientIp(headers)).toBe("5.6.7.8");
  });

  test("retorna 'unknown' quando sem headers", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });

  test("x-forwarded-for tem prioridade sobre x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
    });
    expect(getClientIp(headers)).toBe("1.1.1.1");
  });
});
