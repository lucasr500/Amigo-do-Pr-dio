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

## 3. RLS por `condominio_id` + papéis

Espelha a política do gate (007): **leitura = membro ativo**; **escrita = owner/manager/council**
via as funções `is_condominio_member` / `has_condominio_role` (SECURITY DEFINER, migration 005).

| Papel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| owner | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ |
| council | ✅ | ✅ | ✅ | ✅ |
| resident | ✅¹ | ⛔ | ⛔ | ⛔ |
| viewer | ✅¹ | ⛔ | ⛔ | ⛔ |

```sql
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decisions: leitura por membro" ON decisions;
CREATE POLICY "decisions: leitura por membro" ON decisions
  FOR SELECT USING (is_condominio_member(condominio_id));
DROP POLICY IF EXISTS "decisions: escrita por gestor (ins)" ON decisions;
CREATE POLICY "decisions: escrita por gestor (ins)" ON decisions
  FOR INSERT WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner','manager','council']));
-- (upd) e (del) idênticos ao padrão 007.
```

**¹ Ponto de decisão de produto/jurídico [INCERTO — decisão do Lucas]:** decisões contêm
categorias sensíveis (`juridico`, `trabalhista`, `financeiro`, `morador`). O espelho fiel do
gate dá **leitura a qualquer membro** — incluindo residente. Isso pode **expor deliberação
sensível** a condômino. Duas opções, a decidir antes de ligar a leitura:
- **(a) MVP fiel ao 007:** SELECT = membro. Simples, mas residente lê tudo.
- **(b) Recomendada:** adicionar coluna `visibility` (`gestao|conselho|moradores|publico`,
  como em `community-types.ts:25`) e gatear o SELECT por papel × visibilidade. Custa uma coluna
  + um classificador derivado (ex.: `natureOfDecision`/categoria → visibilidade padrão). É a
  separação que a Tese exige ("visibilidade só na UI = vazamento"). **Enquanto não decidido,
  o cutover de leitura para residente fica bloqueado** (escrita/leitura gestão seguem ok).

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
1. Membro de B **não lê** decisão de A (`SELECT` isolado).
2. Membro de A **lê** a própria decisão (controle positivo).
3. Membro de B **não insere** em `decisions` do condomínio A (`WITH CHECK` barra cruzado).
4. **Residente** de A: lê conforme a política escolhida (§3) e **não escreve** (INSERT/UPDATE
   negados) — cobre o papel de menor privilégio.

Critério: 4 casos verdes contra Postgres real. O job do gate (`.github/workflows/gate-isolamento.yml`)
já aplica `001→007`; passa a aplicar também a migration de `decisions` no `db reset` — sem
mudança de infra além da nova migration.

---

## 7. BLOQUEIOS EXPLÍCITOS (só o Lucas decide — travam a IMPLEMENTAÇÃO)

Nenhum destes é assumido. Cada um **trava ligar a leitura/escrita remota em produção**
(não trava escrever o código gated-off):

| Bloqueio | Por que trava | Estado |
|---|---|---|
| **Região do Supabase** (`sa-east-1`/São Paulo) + cláusula de **transferência internacional** | Decisões contêm dados pessoais (morador, inadimplência, jurídico). Sync para região fora do BR sem cláusula = exposição LGPD (Arts. 33–36) | [INCERTO] URL não revela região (`.env.local`); pendente em `docs/relatorio-estado-atual-2026-06-14.md` |
| **Controlador PF → PJ** | Quem responde pelos dados ao ligar o sync. Hoje PF (Lucas) | [INCERTO] declarado, não resolvido |
| **Modelo de auth** (magic link) + **"sync segue a autenticação"** confirmados como caminho oficial | O cutover de leitura depende dessa regra estar cravada como política, não só código | ✅ implementado (`authClient.ts`, `syncFollowsAuth`); falta o **ok formal** do Lucas como política de produto |
| **Visibilidade de decisão para residente** (§3) | Define a RLS de SELECT; sem isso, leitura de residente fica bloqueada | [INCERTO] decisão de produto/jurídico |

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
| D1 | Windows | migration `NNN_decisions.sql` (tabela + RLS + GRANTs) | aplica no CI; gate 007 intacto |
| D2 | Windows | casos de `decisions` no teste de isolamento | 4 casos verdes contra DB real |
| D3 | Cowork | `decisions_remote_enabled` (default false) + `decisionsRemote.ts` + dual-write nos 3 pontos | tsc 0 · suíte verde · flag off |
| D4 | Cowork | `decisionsMerge.ts` + testes de merge (espelha agendaMerge) | testes de merge verdes |
| D5 | Cowork | `pullRemoteDecisions()` no fluxo de sync/auth (cutover de leitura, gated) | comportamento anônimo idêntico |
| D6 | Lucas | resolver §7 → decidir ligar `decisions_remote_enabled` em rollout controlado | — |

**Riscos & rollback:**
- **Split-brain (local vs remoto):** mitigado por merge determinístico (last-write-wins por
  `updatedAt`) e push idempotente (`onConflict:"id"`). Rollback: desligar a flag → volta a
  local-first puro; dados locais intactos.
- **Exposição de decisão sensível a residente:** mitigado bloqueando a leitura de residente
  até §3 decidido. Rollback: `visibility` default `gestao`.
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
da regra "sync segue a autenticação". **Nada liga sem o Lucas** resolver os 4 bloqueios da §7
— sobretudo **região do Supabase** (transferência internacional) e **visibilidade de decisão
para residente**. Até lá: código gated-off, produção intocada, Regra de Não-Exposição intacta.

**Próxima ação (quando o Lucas autorizar a implementação):** Fase **D1** (migration de
`decisions` + RLS, lane Windows) — sem ligar flag, validada pelo teste de isolamento (D2).
```
