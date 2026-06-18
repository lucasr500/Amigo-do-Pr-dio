import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/api/rateLimiter";

// ADMIN_KEY é lida server-side — nunca exposta no bundle do cliente.
// Sem prefixo NEXT_PUBLIC_: o valor jamais chega ao browser.
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 10 tentativas por minuto por IP — proteção contra brute force manual
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`admin:auth:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const ADMIN_KEY = process.env.ADMIN_KEY ?? "";

  // Sem chave configurada em produção → bloquear sempre
  if (!ADMIN_KEY && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Acesso não disponível." }, { status: 403 });
  }

  // Sem chave em desenvolvimento → auto-autoriza (mantém UX de dev)
  if (!ADMIN_KEY) {
    return NextResponse.json({ ok: true });
  }

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!password || password !== ADMIN_KEY) {
    // Resposta genérica — não revela se a chave existe ou qual é o formato esperado
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
