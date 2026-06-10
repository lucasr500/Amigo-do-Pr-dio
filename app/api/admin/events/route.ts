import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/api/rateLimiter";

// Rota server-side para leitura de eventos de telemetria.
// Usa SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC_) para contornar a política
// SELECT restrita na tabela events. Requer autenticação via ADMIN_KEY no header.
//
// Esta rota substitui o acesso direto do cliente à tabela events com anon key,
// que exporia todos os eventos a qualquer pessoa que conhecesse a chave pública.

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 60 requests por minuto por IP
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`admin:events:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit excedido." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const ADMIN_KEY = process.env.ADMIN_KEY ?? "";
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Em produção sem ADMIN_KEY: bloqueia sempre
  if (!ADMIN_KEY && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Acesso não disponível." }, { status: 403 });
  }

  // Valida ADMIN_KEY via header Authorization: Bearer <key>
  if (ADMIN_KEY) {
    const authHeader = request.headers.get("Authorization") ?? "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== ADMIN_KEY) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  // Sem service role key ou URL: retorna vazio (admin usa dados locais)
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return NextResponse.json({ events: [], source: "unavailable" });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Number(limitParam) || 500, 5000);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=event,properties,ts,session_id&order=ts.desc&limit=${limit}`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        // Next.js 15 fetch cache — não cachear dados de analytics
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar eventos." }, { status: 502 });
    }

    const events = await res.json();
    return NextResponse.json({ events, source: "remote" });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
