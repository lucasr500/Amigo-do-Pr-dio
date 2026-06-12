import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/auth/callback/route";

function callbackRequest(query: string): NextRequest {
  return new NextRequest(`https://app.example.com/auth/callback${query}`);
}

function location(res: Response): string {
  return res.headers.get("location") ?? "";
}

describe("auth callback — fluxo com code", () => {
  test("code presente é repassado para a raiz (troca client-side)", async () => {
    const res = await GET(callbackRequest("?code=abc123"));
    expect(location(res)).toBe("https://app.example.com/?code=abc123");
  });

  test("next relativo é respeitado", async () => {
    const res = await GET(callbackRequest("?code=abc&next=/conta"));
    expect(location(res)).toBe("https://app.example.com/conta?code=abc");
  });

  test("sem code e sem erro redireciona para a raiz", async () => {
    const res = await GET(callbackRequest(""));
    expect(location(res)).toBe("https://app.example.com/");
  });
});

describe("auth callback — open redirect bloqueado", () => {
  test("next absoluto externo é ignorado", async () => {
    const res = await GET(callbackRequest("?code=abc&next=https://evil.com/phish"));
    expect(location(res)).toBe("https://app.example.com/?code=abc");
  });

  test("next protocol-relative (//evil.com) é ignorado", async () => {
    const res = await GET(callbackRequest("?code=abc&next=//evil.com"));
    expect(location(res)).toBe("https://app.example.com/?code=abc");
  });
});

describe("auth callback — erros do Supabase (magic link expirado)", () => {
  test("otp_expired vira /?auth_error=otp_expired", async () => {
    const res = await GET(
      callbackRequest("?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired")
    );
    expect(location(res)).toBe("https://app.example.com/?auth_error=otp_expired");
  });

  test("access_denied sem error_code conhecido vira auth_failed", async () => {
    const res = await GET(callbackRequest("?error=server_error&error_code=unexpected_failure"));
    expect(location(res)).toBe("https://app.example.com/?auth_error=auth_failed");
  });

  test("error sem error_code vira auth_failed", async () => {
    const res = await GET(callbackRequest("?error=access_denied"));
    expect(location(res)).toBe("https://app.example.com/?auth_error=auth_failed");
  });

  test("error_description nunca vaza para a URL final", async () => {
    const res = await GET(
      callbackRequest("?error=access_denied&error_code=otp_expired&error_description=stack+trace+secreto")
    );
    expect(location(res)).not.toContain("secreto");
    expect(location(res)).not.toContain("error_description");
  });

  test("erro tem precedência sobre code (não tenta sessão com link inválido)", async () => {
    const res = await GET(callbackRequest("?code=abc&error_code=otp_expired"));
    expect(location(res)).toBe("https://app.example.com/?auth_error=otp_expired");
  });
});

describe("authErrors — mensagens amigáveis", () => {
  test("otp_expired tem mensagem dedicada", async () => {
    const { authErrorMessage } = await import("@/lib/auth/authErrors");
    expect(authErrorMessage("otp_expired")).toContain("expirou");
  });

  test("código desconhecido cai no fallback genérico", async () => {
    const { authErrorMessage } = await import("@/lib/auth/authErrors");
    expect(authErrorMessage("whatever")).toContain("Não foi possível entrar");
  });
});

describe("authErrors — consumeAuthErrorFromUrl", () => {
  const replaceState = vi.fn();

  beforeEach(() => {
    replaceState.mockClear();
  });

  function stubWindow(href: string): void {
    vi.stubGlobal("window", {
      location: { href },
      history: { replaceState },
    });
  }

  test("lê o código, limpa a URL e retorna mensagem", async () => {
    stubWindow("https://app.example.com/?auth_error=otp_expired");
    const { consumeAuthErrorFromUrl } = await import("@/lib/auth/authErrors");
    const msg = consumeAuthErrorFromUrl();
    expect(msg).toContain("expirou");
    expect(replaceState).toHaveBeenCalledWith({}, "", "/");
  });

  test("sem auth_error retorna null e não mexe na URL", async () => {
    stubWindow("https://app.example.com/");
    const { consumeAuthErrorFromUrl } = await import("@/lib/auth/authErrors");
    expect(consumeAuthErrorFromUrl()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });

  test("preserva outros parâmetros da URL ao limpar", async () => {
    stubWindow("https://app.example.com/?code=abc&auth_error=otp_expired");
    const { consumeAuthErrorFromUrl } = await import("@/lib/auth/authErrors");
    consumeAuthErrorFromUrl();
    expect(replaceState).toHaveBeenCalledWith({}, "", "/?code=abc");
  });
});
