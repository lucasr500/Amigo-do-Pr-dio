// Route handler para magic link callback do Supabase.
// Troca o code pelo token de sessão e redireciona para a raiz.

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
