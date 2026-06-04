import { NextRequest, NextResponse } from "next/server";

// ADMIN_KEY é lida server-side — nunca exposta no bundle do cliente.
// Sem prefixo NEXT_PUBLIC_: o valor jamais chega ao browser.
export async function POST(request: NextRequest): Promise<NextResponse> {
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
