// Route handler para magic link callback do Supabase.
// Repassa o code para a raiz (a troca por sessão acontece no client via
// detectSessionInUrl) e converte erros do Supabase em estado amigável.

import { NextRequest, NextResponse } from "next/server";

// Códigos de erro do Supabase que têm mensagem dedicada na UI.
// Qualquer outro vira "auth_failed" — nunca repassamos error_description cru
// para a URL (poderia carregar texto arbitrário/injetável do provedor).
const KNOWN_AUTH_ERRORS = new Set(["otp_expired", "access_denied"]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Sanitiza next: aceita apenas caminhos relativos da mesma origem.
  // "//evil.com" e "https://evil.com" seriam aceitos por new URL(next, origin)
  // sem esta guarda — open redirect.
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Erro vindo do Supabase (ex.: magic link expirado chega como
  // error=access_denied&error_code=otp_expired&error_description=...).
  // Redireciona para a raiz com um código seguro — a UI mostra mensagem
  // compreensível em vez de uma home ambígua.
  const errorParam = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  if (errorParam || errorCode) {
    const safeCode =
      errorCode && KNOWN_AUTH_ERRORS.has(errorCode)
        ? errorCode
        : "auth_failed";
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", safeCode);
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (code) {
    // Supabase envia o code no query string.
    // Redirecionamos para a raiz com o code ainda na URL — o AuthContext
    // client-side trata a sessão via detectSessionInUrl: true no createClient.
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set("code", code);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Sem code e sem erro — redireciona direto para a raiz
  return NextResponse.redirect(new URL("/", origin));
}
