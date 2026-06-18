// ─── GATE DE EXPOSIÇÃO — Isolamento entre condomínios (RLS contra DB real) ─────
//
// Este é o teste inegociável da Definição de Pronto: prova que um membro do
// condomínio B NÃO consegue ler nem escrever dados do condomínio A, contra um
// Postgres real com as RLS das migrations 005/006/007 aplicadas.
//
// Auto-skip quando o ambiente não tem um Supabase de teste configurado — assim a
// suíte local (803 testes) continua verde sem DB. Para RODAR o gate:
//
//   1) Suba um Supabase local (seguro, descartável, não toca produção):
//        supabase init && supabase start && supabase db reset
//   2) Exporte as chaves que o `supabase start` imprime:
//        export SUPABASE_TEST_URL="http://127.0.0.1:54321"
//        export SUPABASE_TEST_ANON_KEY="<anon key impressa>"
//        export SUPABASE_TEST_SERVICE_ROLE_KEY="<service_role key impressa>"
//   3) npx vitest run lib/__tests__/tenant-isolation.integration.test.ts
//
// NUNCA aponte SUPABASE_TEST_SERVICE_ROLE_KEY para produção. Use só o stack local.

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_TEST_URL;
const ANON = process.env.SUPABASE_TEST_ANON_KEY;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const HAS_DB = Boolean(URL && ANON && SERVICE);

// Identificadores únicos por execução para idempotência entre runs.
const stamp = Date.now();
const userA = { email: `iso-a-${stamp}@test.local`, password: "test-pass-A-123456" };
const userB = { email: `iso-b-${stamp}@test.local`, password: "test-pass-B-123456" };
// userC = RESIDENTE do condomínio A — prova a RLS por papel das Decisões (residente não lê).
const userC = { email: `iso-c-${stamp}@test.local`, password: "test-pass-C-123456" };

describe.skipIf(!HAS_DB)("isolamento entre condomínios (gate de exposição)", () => {
  let admin: SupabaseClient;
  let condA = "";
  let condB = "";
  let userAId = "";
  let userBId = "";
  let userCId = "";
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let clientC: SupabaseClient;
  const assemblyAId = `iso-asm-a-${stamp}`;
  const decisionAId = `iso-dec-a-${stamp}`;

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });

    // 1. Cria três usuários confirmados (A owner de A, B owner de B, C residente de A).
    const a = await admin.auth.admin.createUser({ ...userA, email_confirm: true });
    const b = await admin.auth.admin.createUser({ ...userB, email_confirm: true });
    const c = await admin.auth.admin.createUser({ ...userC, email_confirm: true });
    userAId = a.data.user!.id;
    userBId = b.data.user!.id;
    userCId = c.data.user!.id;

    // 2. Cria dois condomínios (service role ignora RLS no setup) + memberships.
    const insA = await admin.from("condominios").insert({ owner_id: userAId, nome: "Cond A (iso)" }).select("id").single();
    const insB = await admin.from("condominios").insert({ owner_id: userBId, nome: "Cond B (iso)" }).select("id").single();
    condA = insA.data!.id;
    condB = insB.data!.id;
    await admin.from("memberships").insert([
      { user_id: userAId, condominio_id: condA, role: "owner", status: "active" },
      { user_id: userBId, condominio_id: condB, role: "owner", status: "active" },
      { user_id: userCId, condominio_id: condA, role: "resident", status: "active" },
    ]);

    // 3. Clientes anônimos autenticados como cada usuário (sujeitos à RLS).
    clientA = createClient(URL!, ANON!, { auth: { persistSession: false } });
    clientB = createClient(URL!, ANON!, { auth: { persistSession: false } });
    clientC = createClient(URL!, ANON!, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword(userA);
    await clientB.auth.signInWithPassword(userB);
    await clientC.auth.signInWithPassword(userC);

    // 4. Usuário A cria uma assembleia e uma decisão no condomínio A (permitido: owner).
    const created = await clientA.from("assemblies").insert({
      id: assemblyAId, condominio_id: condA, titulo: "AGO de teste — A", tipo: "ago", status: "convocada",
    });
    expect(created.error).toBeNull();
    const dec = await clientA.from("decisions").insert({
      id: decisionAId, condominio_id: condA, title: "Decisão sensível — A", category: "juridico",
      status: "registrada", visibility: "gestao",
    });
    expect(dec.error).toBeNull();
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("decisions").delete().eq("id", decisionAId);
    await admin.from("assemblies").delete().eq("id", assemblyAId);
    if (condA) await admin.from("condominios").delete().eq("id", condA);
    if (condB) await admin.from("condominios").delete().eq("id", condB);
    if (userAId) await admin.auth.admin.deleteUser(userAId);
    if (userBId) await admin.auth.admin.deleteUser(userBId);
    if (userCId) await admin.auth.admin.deleteUser(userCId);
  });

  test("membro de B NÃO lê a assembleia de A (SELECT isolado por RLS)", async () => {
    const { data } = await clientB.from("assemblies").select("id").eq("id", assemblyAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("membro de A lê a própria assembleia", async () => {
    const { data } = await clientA.from("assemblies").select("id").eq("id", assemblyAId);
    expect(data).toHaveLength(1);
  });

  test("membro de B NÃO consegue inserir no condomínio A (WITH CHECK barra escrita cruzada)", async () => {
    const { error } = await clientB.from("assemblies").insert({
      id: `iso-asm-b-cross-${stamp}`, condominio_id: condA, titulo: "Invasão", tipo: "ago", status: "rascunho",
    });
    expect(error).not.toBeNull(); // RLS deve recusar
  });

  test("agenda_events: mesmo isolamento na tabela já existente (migration 006)", async () => {
    const evId = `iso-ev-a-${stamp}`;
    const ins = await clientA.from("agenda_events").insert({ id: evId, condominio_id: condA, title: "Evento A" });
    expect(ins.error).toBeNull();
    const { data: seenByB } = await clientB.from("agenda_events").select("id").eq("id", evId);
    expect(seenByB ?? []).toHaveLength(0);
    await admin.from("agenda_events").delete().eq("id", evId);
  });

  // ── decisions (migration 008): isolamento entre condomínios + RLS por papel ──
  // A leitura de Decisões é restrita a gestão+conselho (difere do 007 de propósito).

  test("decisions: gestor de A lê a própria decisão", async () => {
    const { data } = await clientA.from("decisions").select("id").eq("id", decisionAId);
    expect(data).toHaveLength(1);
  });

  test("decisions: gestor de B NÃO lê decisão de A (isolamento entre condomínios)", async () => {
    const { data } = await clientB.from("decisions").select("id").eq("id", decisionAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("decisions: RESIDENTE do próprio condomínio A NÃO lê decisão (RLS por papel)", async () => {
    const { data } = await clientC.from("decisions").select("id").eq("id", decisionAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("decisions: gestor de B NÃO insere no condomínio A (WITH CHECK barra cruzado)", async () => {
    const { error } = await clientB.from("decisions").insert({
      id: `iso-dec-b-cross-${stamp}`, condominio_id: condA, title: "Invasão", category: "outro", status: "registrada",
    });
    expect(error).not.toBeNull();
  });

  test("decisions: RESIDENTE de A NÃO escreve decisão (sem papel de escrita)", async () => {
    const { error } = await clientC.from("decisions").insert({
      id: `iso-dec-c-${stamp}`, condominio_id: condA, title: "Morador escrevendo", category: "outro", status: "registrada",
    });
    expect(error).not.toBeNull();
  });
});
