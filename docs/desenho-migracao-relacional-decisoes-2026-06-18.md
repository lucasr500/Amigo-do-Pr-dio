# Desenho — Migração relacional do módulo DECISÕES

**Data:** 2026-06-18 · **Branch:** `sprint-6.1-lapidacao-premium` · **Status:** DESENHO (não implementar)
**Aprovação:** Lucas autorizou o desenho. **Nada** de código de produção, migration aplicada,
flag ligada ou dado migrado nesta entrega.
**Padrão espelhado (já provado):** `lib/tenant/assembliesRemote.ts` + `lib/tenant/assembliesMerge.ts`
+ `supabase/migrations/007_assemblies.sql` + `lib/__tests__/tenant-isolation.integration.test.ts`
(gate verde, runs #6/#7 — `docs/relatorio-gate-isolamento-2026-06-18.md`).

> **Invariantes preservadas:** Regra de Não-Exposição; flags de exposição inalteradas;
> produção intocada; gate de isolamento preservado. Local-first continua a fonte de verdade
> até o cutover deliberado e testado.

---

## 1. Escopo e por que Decisões primeiro

**Escopo: somente a entidade `Decision`** (`lib/decisions.ts:24-42`). Nada de timeline,
documentos, fornecedores ou pendências nesta fatia.

Por que é o primeiro módulo certo:
- **Autocontida.** `Decision` é um registro plano (sem coleções aninhadas), com IDs estáveis
  do cliente (`dec_${Date.now()}_${rand}`, `decisions.ts:65-67`) — chave de upsert ideal,
  exatamente como `assemblies`.
- **Já acoplada ao wedge.** `deliberarItem()` cria uma `Decision` e grava `linkedDecisionId`
  no item de pauta (`lib/assembleias-loop.ts:77-95`). Levar Decisões ao relacional consolida
  o ramo **decidir→lembrar** que a Assembleia já alimenta.
- **Estruturalmente igual a `Assembly`** — mesma forma de tipo (id/createdAt/updatedAt +
  campos escalares), então o espelho de `assembliesRemote`/`assembliesMerge`/migration 007 é
  quase 1:1. **Menor risco de split-brain.**
- **Timeline fica DEPOIS** — é *derivada* das fontes (decisões, documentos, eventos). Migrar
  uma fonte antes de um agregado evita reescrever o agregado duas vezes.

---

## 2. Modelo relacional proposto — `decisions`

Espelha a migration 007 (PK `text` client-side, `condominio_id` + `ON DELETE CASCADE`,
índices por condomínio, trigger `updated_at`, GRANTs aos roles). **Não aplicar.**

```sql
-- migration NNN_decisions.sql  (número a definir na implementação: provável 009,
-- pois 008 está reservada para assembly_comments — ver Tese)
CREATE TABLE IF NOT EXISTS decisions (
  id                   text PRIMARY KEY,                       -- ID estável do cliente (dec_...)
  condominio_id        uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  title                text NOT NULL,
  date                 date,                                   -- Decision.date (YYYY-MM-DD)
  category             text NOT NULL DEFAULT 'outro'
                         CHECK (category IN ('financeiro','obras','juridico','trabalhista',
                           'assembleia','manutencao','regimento','fornecedor','seguranca',
                           'morador','outro')),
  context              text,
  rationale            text,
  outcome              text,
  status               text NOT NULL DEFAULT 'registrada'
                         CHECK (status IN ('registrada','em_execucao','concluida','suspensa')),
  -- visibilidade (decidido pelo Lucas): reusa o enum de community-types (gestao|conselho|
  -- moradores|publico). DEFAULT 'gestao' (seguro). A RLS de SELECT nesta fase só libera
  -- gestão+conselho; a coluna deixa o schema pronto para o futuro sem UX de morador agora.
  visibility           text NOT NULL DEFAULT 'gestao'
                         CHECK (visibility IN ('gestao','conselho','moradores','publico')),
  risk_level           text CHECK (risk_level IN ('baixo','medio','alto')),  -- nullable
  risk_notes           text,
  next_step            text,
  -- vínculos: TEXT sem FK — os alvos (documentos/fornecedores/pendências/unidade) ainda
  -- são local-first. Adicionar FK só quando essas entidades forem relacionais.
  linked_unit          text,
  linked_document_id   text,
  linked_supplier_id   text,
  linked_pendencia_id  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decisions_condominio_idx          ON decisions(condominio_id);
CREATE INDEX IF NOT EXISTS decisions_condominio_date_idx     ON decisions(condominio_id, date);
CREATE INDEX IF NOT EXISTS decisions_condominio_category_idx ON decisions(condominio_id, category);

CREATE OR REPLACE TRIGGER decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- GRANTs de tabela (RLS gateia linhas; GRANT habilita a tabela). Idempotente.
GRANT ALL ON TABLE decisions TO anon, authenticated, service_role;
```

**Mapeamento camelCase ↔ snake_case** (no `decisionsRemote.ts`, espelhando `assembliesRemote`):
`riskLevel→risk_level`, `riskNotes→risk_notes`, `nextStep→next_step`, `linkedUnit→linked_unit`,
`linkedDocumentId→linked_document_id`, etc. `createdAt/updatedAt` preservados.

**Caps:** manter a regra local (`saveDecisions` corta em 500, `decisions.ts:112`) — não há
cap no servidor; RLS + índice por condomínio bastam.

---

## 3. RLS por `condominio_id` + papéis — **DECIDIDO (Lucas)**

Decisão cravada: **a leitura de Decisões é restrita a gestão + conselho** nesta fase.
Residente e viewer **não leem** decisão — exposição a morador é **Completo-Pleno**, fora do
escopo do Núcleo. Isto **difere deliberadamente do 007** (que dá leitura a qualquer membro):
decisões carregam categorias sensíveis (`juridico`, `trabalhista`, `financeiro`, `morador`),
então o SELECT é gateado por papel, não por mera filiação. Escrita mantém owner/manager/council.
A coluna `visibility` (DEFAULT `gestao`) deixa o schema **pronto para o futuro** — sem nenhuma
UX voltada ao morador agora; a RLS desta fase não concede leitura externa a `moradores/publico`.

| Papel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| owner | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ |
| council | ✅ | ✅ | ✅ | ✅ |
| resident | ⛔ | ⛔ | ⛔ | ⛔ |
| viewer | ⛔ | ⛔ | ⛔ | ⛔ |

```sql
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- LEITURA: só gestão + conselho (difere do 007 de propósito — dado sensível).
DROP POLICY IF EXISTS "decisions: leitura por gestao/conselho" ON decisions;
CREATE POLICY "decisions: leitura por gestao/conselho" ON decisions
  FOR SELECT USING (has_condominio_role(condominio_id, ARRAY['owner','manager','council']));

-- ESCRITA: owner/manager/council (idêntico ao padrão 007).
DROP POLICY IF EXISTS "decisions: escrita por gestor (ins)" ON decisions;
CREATE POLICY "decisions: escrita por gestor (ins)" ON decisions
  FOR INSERT WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner','manager','council']));
-- (upd) e (del) idênticos: USING + WITH CHECK com has_condominio_role(... ['owner','manager','council']).
```

> **Risco LGPD do ponto 1 — MITIGADO POR PADRÃO.** A leitura restrita a gestão+conselho remove
> a exposição de deliberação sensível ao condômino. O alerta anterior está **resolvido** e a
> regra fica registrada como decidida.

**Paridade local↔remoto (lane Cowork, item não-bloqueante):** o tipo `Decision`
(`lib/decisions.ts:24-42`) ganha `visibility?: Visibility` com **default `'gestao'` em
`normalizeDecision`** — para o dual-write/merge mapearem 1:1 com a coluna. *Opcional:* a UI de
criação **pode** pré-sugerir a visibilidade a partir de `natureOfDecision` (categoria
`assembleia` → `moradores`), mas **o default seguro permanece `gestao` e nunca alarga sozinho**.

---

## 4. Dual-write gated — espelho fiel de Assembleias

**Flag nova:** `decisions_remote_enabled` (default **false**), em `lib/feature-flags.ts`,
com o mesmo comentário-guarda de `assemblies_remote_enabled:18` ("só liga após o gate de
isolamento de `decisions` verde"). Defaults atuais **inalterados** nesta entrega.

**`lib/tenant/decisionsRemote.ts`** — espelha `assembliesRemote.ts`:
- `mirrorUpsertDecision(d: Decision)` e `mirrorDeleteDecision(id)`: best-effort, **nunca
  lança, nunca bloqueia a UI**; no-op se `!window`, flag off ou sem condomínio ativo
  (`getActiveCondominioId()`). Import dinâmico do SDK; cast local de tipos; `onConflict: "id"`.
- `listRemoteDecisions(condominioId?)`: lê do relacional (para o cutover de leitura, §5).
- Sem `SERVICE_ROLE` no cliente — anon + RLS, como todo o app.

**Pontos de chamada** (na implementação, lane Cowork) — em `lib/decisions.ts`, espelhando
`session-assembleias.ts:154,169,178`:
- `addDecision` → `void mirrorUpsertDecision(decision)`
- `updateDecision` → `void mirrorUpsertDecision(updated)`
- `deleteDecision` → `void mirrorDeleteDecision(id)`

**`lib/tenant/decisionsMerge.ts`** — espelha `assembliesMerge.ts`: `mergeById` por `id`;
conflito vence o `updatedAt ?? createdAt` mais recente; empate preserva o local; **sem
tombstones** (exclusão é tratada pelo push). Determinístico, testável.

---

## 5. Cutover de LEITURA deliberado (não "de passagem")

Regra canônica: **"sync segue a autenticação"** (`feature-flags.ts:88` `syncFollowsAuth`).
O cutover respeita isso e **preserva local-first como fallback**:

1. **Gatilho explícito, não silencioso.** Quando (autenticado) **e** (`tenant_enabled` e
   condomínio ativo) **e** (`decisions_remote_enabled` on), um `pullRemoteDecisions()` é
   chamado **no fluxo de sync/auth** (espelhando a Fatia 2b da Agenda) — não dentro de
   `getDecisions()`. `getDecisions()` continua lendo o store local.
2. **Pull → merge → store local.** `pullRemoteDecisions()` faz `listRemoteDecisions()` e
   `mergeDecisions(local, remote)` (§4), gravando o resultado no store local. A UI segue
   lendo local — **um único caminho de leitura**, sem read-through espalhado.
3. **Anônimo / flag off / offline:** zero rede, comportamento atual idêntico. Local é a
   verdade. Nenhuma migração automática de dados legados; o push (dual-write) é que popula o
   relacional a partir do uso.
4. **Sem big-bang.** Nenhum backfill silencioso do localStorage para o servidor. Se o Lucas
   quiser semear decisões antigas, é uma ação **explícita e separada** (botão "enviar memória
   ao servidor"), fora deste cutover.

Resultado: multi-device/multi-persona de Decisões **só** quando autenticado + flag on + gate
verde; caso contrário, o app é exatamente o de hoje.

---

## 6. Teste de isolamento entre condomínios — `decisions`

Espelha `tenant-isolation.integration.test.ts` (auto-skip sem `SUPABASE_TEST_*`; roda no CI
com Supabase local via Docker). Casos a adicionar (mesma estrutura do gate da 007):
1. **Gestor** de B **não lê** decisão de A (`SELECT` isolado por condomínio).
2. **Gestor/conselho** de A **lê** a própria decisão (controle positivo).
3. Gestor de B **não insere** em `decisions` do condomínio A (`WITH CHECK` barra cruzado).
4. **Residente do próprio condomínio A NÃO lê** decisão (RLS por papel, §3 decidida) **e não
   escreve** — cobre o papel sensível: o vazamento aqui não é entre condomínios, é entre papéis.

Critério: 4 casos verdes contra Postgres real. O job do gate (`.github/workflows/gate-isolamento.yml`)
já aplica `001→007`; passa a aplicar também a migration de `decisions` no `db reset` — sem
mudança de infra além da nova migration. **Nota:** o caso 4 exige criar uma membership
`resident` no setup (o gate atual só cria `owner`) — pequeno acréscimo ao `beforeAll`.

---

## 7. BLOQUEIOS EXPLÍCITOS (só o Lucas decide — travam a IMPLEMENTAÇÃO)

Nenhum destes é assumido. Cada um **trava ligar a leitura/escrita remota em produção**
(não trava escrever o código gated-off):

| Bloqueio | Por que trava | Estado |
|---|---|---|
| **Região do Supabase** (`sa-east-1`/São Paulo) | Decisões contêm dados pessoais (morador, inadimplência, jurídico) | ✅ **RESOLVIDO** — confirmada `sa-east-1`/São Paulo. **Elimina a cláusula de transferência internacional** (Arts. 33–36 não se aplicam). *Impacto jurídico: sinalizar ao jurídico para **simplificar** o texto de Termos/Privacidade — remover a menção a transferência internacional.* |
| **Visibilidade de decisão para residente** (§3) | Define a RLS de SELECT | ✅ **RESOLVIDO** — leitura restrita a gestão+conselho; residente/viewer não leem. Coluna `visibility` no schema, default `gestao`. |
| **"Sync segue a autenticação"** como política | O cutover de leitura depende dessa regra cravada como política | ✅ **FORMALIZADA** — `sync_enabled` segue o auth (`syncFollowsAuth`, `feature-flags.ts:88`); registrada como política de produto. |
| **Controlador PF → PJ** | Quem responde pelos dados ao ligar o sync. Hoje PF (Lucas) | 🟡 **ABERTO** — decisão de controlador/responsabilidade do Lucas, **sem urgência**. Não bloqueia D1–D5 (código gated-off); bloqueia apenas o **rollout** (D6, ligar o remoto). |

---

## 8. Plano de implementação faseado (para DEPOIS) + fronteira de lanes

**Fronteira de lanes (evita lock contention no git):**
- **Lane Windows** (este agente): `supabase/**` (a migration de `decisions`) + `.github/**`
  (o gate) + `docs/**`.
- **Lane Cowork**: `lib/**` (`feature-flags`, `decisionsRemote`, `decisionsMerge`, pontos de
  chamada em `decisions.ts`, `pullRemoteDecisions`) + `components/**` (se houver UI de status).
- **Sincronização:** uma lane de cada vez por arquivo; commits por caminho explícito; nunca
  `git add -A`; gate verde antes de cada commit que toque `lib/**`/`supabase/**`.

**Fases (cada uma com gate verde, reversível):**
| Fase | Lane | Entrega | Gate |
|---|---|---|---|
| D1 | Windows | migration `NNN_decisions.sql` (tabela + coluna `visibility` + RLS leitura gestão/conselho + GRANTs) | aplica no CI; gate 007 intacto |
| D2 | Windows | casos de `decisions` no teste de isolamento (inclui residente **não lê**, exige membership `resident` no setup) | 4 casos verdes contra DB real |
| D3 | Cowork | `Decision.visibility` (default `gestao` em `normalizeDecision`) + `decisions_remote_enabled` (default false) + `decisionsRemote.ts` + dual-write nos 3 pontos | tsc 0 · suíte verde · flag off |
| D4 | Cowork | `decisionsMerge.ts` + testes de merge (espelha agendaMerge) | testes de merge verdes |
| D5 | Cowork | `pullRemoteDecisions()` no fluxo de sync/auth (cutover de leitura, gated) | comportamento anônimo idêntico |
| D6 | Lucas | **único bloqueio remanescente: PF→PJ** → decidir ligar `decisions_remote_enabled` em rollout controlado | — |

**Riscos & rollback:**
- **Split-brain (local vs remoto):** mitigado por merge determinístico (last-write-wins por
  `updatedAt`) e push idempotente (`onConflict:"id"`). Rollback: desligar a flag → volta a
  local-first puro; dados locais intactos.
- **Exposição de decisão sensível a residente:** **resolvido** — RLS de SELECT só gestão+conselho
  (§3 decidida); residente/viewer não leem. Coluna `visibility` default `gestao` reforça.
- **Cutover acidental:** impossível sem a flag (default false) + auth + tenant ativo.
  Rollback de qualquer fase D1–D5: reverter o commit da lane; nada exposto pois flag off.
- **Migration:** idempotente (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`); rollback = `DROP TABLE
  IF EXISTS decisions` (documentado no cabeçalho, como 005/006/007).

---

## 9. Resumo executivo

Decisões é o **segundo módulo** a sair do local-first, depois de Assembleias — e o de **menor
risco**, por ser plano, autocontido e já acoplado ao wedge. O caminho é um **espelho fiel** do
que o gate já provou: tabela `condominio_id`-scoped + RLS por papel, dual-write gated-off,
merge determinístico, cutover de leitura **deliberado** atrás de `decisions_remote_enabled` e
da regra "sync segue a autenticação". **Três dos quatro bloqueios foram resolvidos pelo Lucas**
(região `sa-east-1` → sem transferência internacional; leitura restrita a gestão+conselho;
"sync segue a auth" formalizada). **Resta só PF→PJ**, sem urgência, que trava apenas o rollout
(D6), não o código gated-off. Até ligar: produção intocada, Regra de Não-Exposição intacta.

**Próxima ação (quando o Lucas autorizar a implementação):** Fase **D1** (migration de
`decisions` + coluna `visibility` + RLS leitura gestão/conselho, lane Windows) — sem ligar
flag, validada pelo teste de isolamento (D2, incluindo o caso "residente não lê").

---

## 10. Changelog do desenho

- **2026-06-18 (rev. 2):** decisões do Lucas incorporadas — coluna `visibility` (default
  `gestao`); RLS de leitura restrita a gestão+conselho (residente/viewer não leem; difere do
  007 de propósito); região `sa-east-1` confirmada (bloqueio resolvido, sinalizar jurídico p/
  simplificar Termos/Privacidade); "sync segue a auth" formalizada; `Decision.visibility` na
  lane Cowork; teste de isolamento ganha o caso "residente não lê". Resta só **PF→PJ** aberto.
- **2026-06-18 (rev. 3 — IMPLEMENTADO):** D1–D4 entregues, gated-off, gate VERDE contra DB real.
  D1 `008_decisions.sql` + isolamento (`534a8bb`); D2 `decisionsRemote` + flag
  `decisions_remote_enabled:false` + dual-write (`7261ec2`); D3 `decisionsMerge` (`80b4d3d`);
  D4 `decisionsSync.pullRemoteDecisions` gated, **não fiado** no sync (`407d1b0`). Pendentes:
  **D4-wiring** (ponto de gatilho no fluxo de sync — pausado p/ confirmação) e **D6** (rollout,
  bloqueado por PF→PJ).
```
