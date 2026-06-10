// Route handler para magic link callback do Supabase.
// Troca o code pelo token de sessão e redireciona para a raiz.

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Sanitiza next: aceita apenas caminhos relativos da mesma origem.
  // "//evil.com" e "https://evil.com" seriam aceitos por new URL(next, origin)
  // sem esta guarda — open redirect.
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    // Supabase envia o code no query string.
    // Redirecionamos para a raiz com o code ainda na URL — o AuthContext
    // client-side trata a sessão via detectSessionInUrl: true no createClient.
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set("code", code);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Sem code — redireciona direto para a raiz
  return NextResponse.redirect(new URL("/", origin));
}
