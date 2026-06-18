// ─── GATE DE EXPOSIÇÃO — Isolamento entre condomínios (RLS contra DB real) ─────
//
// Este é o teste inegociável da Definição de Pronto: prova que um membro do
// condomínio B NÃO consegue ler nem escrever dados do condomínio A, contra um
// Postgres real com as RLS das migrations 005/006/007/008/009 aplicadas.
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
  // community_posts (009): um post sensível (gestao) e um público-a-moradores (moradores).
  const postGestaoAId = `iso-post-gestao-a-${stamp}`;
  const postMoradoresAId = `iso-post-moradores-a-${stamp}`;
  // community_requests (010): privada da gestão, pública aos moradores, e privada do residente.
  const reqPrivAId = `iso-req-priv-a-${stamp}`;
  const reqPublicAId = `iso-req-pub-a-${stamp}`;
  const reqOwnCId = `iso-req-own-c-${stamp}`;

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

    // 5. Usuário A (owner = gestão) cria dois posts no mural de A: um 'gestao' (sensível,
    //    só gestão lê) e um 'moradores' (morador alcança). Prova a RLS por papel × visibilidade.
    const pg = await clientA.from("community_posts").insert({
      id: postGestaoAId, condominio_id: condA, title: "Comunicado interno (gestão) — A",
      category: "outro", visibility: "gestao", nature: "comunicado", origin: "oficial",
    });
    expect(pg.error).toBeNull();
    const pm = await clientA.from("community_posts").insert({
      id: postMoradoresAId, condominio_id: condA, title: "Aviso aos moradores — A",
      category: "aviso", visibility: "moradores", nature: "comunicado", origin: "oficial",
    });
    expect(pm.error).toBeNull();

    // 6. Solicitações (010) inseridas via service_role (ignora RLS) para fixar created_by:
    //    uma privada da gestão, uma pública aos moradores, uma privada do RESIDENTE (própria).
    const reqIns = await admin.from("community_requests").insert([
      { id: reqPrivAId,   condominio_id: condA, created_by: userAId, title: "Privada da gestão — A", type: "outro", visibility: "gestao" },
      { id: reqPublicAId, condominio_id: condA, created_by: userAId, title: "Pública aos moradores — A", type: "aviso_obra", visibility: "moradores" },
      { id: reqOwnCId,    condominio_id: condA, created_by: userCId, title: "Solicitação do morador — A", type: "barulho", visibility: "gestao" },
    ]);
    expect(reqIns.error).toBeNull();
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("community_requests").delete().in("id", [reqPrivAId, reqPublicAId, reqOwnCId]);
    await admin.from("community_posts").delete().eq("id", postGestaoAId);
    await admin.from("community_posts").delete().eq("id", postMoradoresAId);
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

  // ── community_posts (migration 009): isolamento A×B + RLS por PAPEL × VISIBILIDADE ──
  // A leitura replica canSeeVisibility no banco: morador alcança 'moradores'/'publico',
  // NÃO alcança 'gestao'/'conselho'. Escrita é da gestão (owner/manager).

  test("community_posts: gestor de A lê os próprios posts (gestao + moradores)", async () => {
    const { data } = await clientA.from("community_posts").select("id").in("id", [postGestaoAId, postMoradoresAId]);
    expect((data ?? []).length).toBe(2);
  });

  test("community_posts: gestor de B NÃO lê post de A (isolamento entre condomínios)", async () => {
    const { data } = await clientB.from("community_posts").select("id").eq("id", postMoradoresAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("community_posts: RESIDENTE de A LÊ o post 'moradores' (visibilidade alcança o papel)", async () => {
    const { data } = await clientC.from("community_posts").select("id").eq("id", postMoradoresAId);
    expect(data).toHaveLength(1);
  });

  test("community_posts: RESIDENTE de A NÃO lê o post 'gestao' (RLS por papel × visibilidade)", async () => {
    const { data } = await clientC.from("community_posts").select("id").eq("id", postGestaoAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("community_posts: RESIDENTE de A NÃO publica no mural (escrita = gestão)", async () => {
    const { error } = await clientC.from("community_posts").insert({
      id: `iso-post-c-${stamp}`, condominio_id: condA, title: "Morador publicando",
      category: "outro", visibility: "moradores", nature: "opiniao", origin: "morador",
    });
    expect(error).not.toBeNull();
  });

  test("community_posts: gestor de B NÃO insere no condomínio A (WITH CHECK barra cruzado)", async () => {
    const { error } = await clientB.from("community_posts").insert({
      id: `iso-post-b-cross-${stamp}`, condominio_id: condA, title: "Invasão",
      category: "outro", visibility: "publico", nature: "comunicado", origin: "oficial",
    });
    expect(error).not.toBeNull();
  });

  // ── community_requests (migration 010): isolamento + papel × visibilidade + AUTORIA ──
  // Morador lê as próprias + as públicas; NÃO lê as privadas alheias. Cria a própria;
  // só a gestão muda status. Gestão lê todas.

  test("community_requests: gestor de A lê todas as solicitações de A", async () => {
    const { data } = await clientA.from("community_requests").select("id").in("id", [reqPrivAId, reqPublicAId, reqOwnCId]);
    expect((data ?? []).length).toBe(3);
  });

  test("community_requests: gestor de B NÃO lê solicitação de A (isolamento entre condomínios)", async () => {
    const { data } = await clientB.from("community_requests").select("id").eq("id", reqPublicAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("community_requests: RESIDENTE de A LÊ a pública (moradores)", async () => {
    const { data } = await clientC.from("community_requests").select("id").eq("id", reqPublicAId);
    expect(data).toHaveLength(1);
  });

  test("community_requests: RESIDENTE de A NÃO lê a privada da gestão (papel × visibilidade)", async () => {
    const { data } = await clientC.from("community_requests").select("id").eq("id", reqPrivAId);
    expect(data ?? []).toHaveLength(0);
  });

  test("community_requests: RESIDENTE de A LÊ a PRÓPRIA solicitação privada (autoria)", async () => {
    const { data } = await clientC.from("community_requests").select("id").eq("id", reqOwnCId);
    expect(data).toHaveLength(1);
  });

  test("community_requests: RESIDENTE de A cria a PRÓPRIA solicitação (created_by = auth.uid())", async () => {
    const ownId = `iso-req-c-new-${stamp}`;
    const { error } = await clientC.from("community_requests").insert({
      id: ownId, condominio_id: condA, title: "Nova do morador", type: "sugestao",
    });
    expect(error).toBeNull();
    await admin.from("community_requests").delete().eq("id", ownId);
  });

  test("community_requests: RESIDENTE de A NÃO muda status (update = gestão; RLS filtra → 0 linhas)", async () => {
    // UPDATE bloqueado por RLS não gera erro: a policy de UPDATE (gestão) filtra a linha,
    // então nenhuma é atualizada. Provamos o no-op por .select() vazio + status intacto.
    const { data, error } = await clientC.from("community_requests")
      .update({ status: "resolvido" }).eq("id", reqOwnCId).select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
    const check = await admin.from("community_requests").select("status").eq("id", reqOwnCId).single();
    expect(check.data!.status).toBe("recebido"); // inalterado
  });

  test("community_requests: gestor de B NÃO insere no condomínio A (WITH CHECK barra cruzado)", async () => {
    const { error } = await clientB.from("community_requests").insert({
      id: `iso-req-b-cross-${stamp}`, condominio_id: condA, title: "Invasão", type: "outro",
    });
    expect(error).not.toBeNull();
  });
});
