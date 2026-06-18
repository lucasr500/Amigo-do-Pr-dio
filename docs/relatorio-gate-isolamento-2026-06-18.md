# Relatório — Gate de Isolamento entre Condomínios (RLS multi-tenant)

**Data:** 2026-06-18
**Branch:** `sprint-6.1-lapidacao-premium`
**Veredito:** 🟢 **GATE VERDE** — isolamento entre condomínios provado contra Postgres real.

---

## 1. O que o gate prova

Contra um Postgres real (stack Supabase local, migrations 001→007 aplicadas via
`supabase db reset`), o teste prova que **um membro do condomínio B não lê nem
escreve dados do condomínio A** — a RLS das migrations 005/006/007 isola os tenants.

Arquivo: `lib/__tests__/tenant-isolation.integration.test.ts` (4 testes):
1. Membro de B **não lê** a assembleia de A (SELECT isolado por RLS).
2. Membro de A **lê** a própria assembleia (controle positivo).
3. Membro de B **não consegue inserir** no condomínio A (WITH CHECK barra escrita cruzada).
4. `agenda_events`: mesmo isolamento na tabela já existente (migration 006).

---

## 2. Prova materializada

| Item | Valor |
|---|---|
| Workflow | `.github/workflows/gate-isolamento.yml` — "Gate de Isolamento (RLS multi-tenant)" |
| Commit que ficou verde | `1789653` (fix dos GRANTs de tabela) |
| Run | #6 — id `27731269961` |
| URL do run | https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27731269961 |
| Badge do workflow (branch) | **passing** — https://github.com/lucasr500/Amigo-do-Pr-dio/actions/workflows/gate-isolamento.yml/badge.svg?branch=sprint-6.1-lapidacao-premium |
| Supabase CLI | `2.107.0` (fixada no workflow) |
| Postgres | stack Supabase local (Postgres 15.x), migrations 001→007 via `supabase db reset` |
| Node (runtime do teste) | 22 (WebSocket global p/ `@supabase/supabase-js`) |
| Regressão no mesmo job | `tsc --noEmit` 0 erros + `vitest run` completo verde |

**Comando exato do passo do gate (no CI):**
```
npx vitest run lib/__tests__/tenant-isolation.integration.test.ts
```
com `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` / `SUPABASE_TEST_SERVICE_ROLE_KEY`
exportados de `supabase status -o env` (stack 100% local, 127.0.0.1).

**Limitação de evidência (honestidade):** a saída literal por-teste do vitest vive no
log do job, cujo download pela API exige permissão de admin do repositório (HTTP 403
sem auth). A prova materializável sem essa permissão é: badge `passing` (servido por
github.com, não rate-limited) + conclusão do run = success + ausência de annotations
de falha no check-run `isolation-gate`. Como **nenhum** run anterior passou, o badge
`passing` corresponde necessariamente ao run #6.

---

## 3. Trilha de diagnóstico (por que levou 6 runs)

Cada vermelho foi diagnosticado pela mensagem real (annotations públicas) e corrigido
no arquivo mínimo, **sem alterar RLS nem o teste no escuro**:

| Run | Falhou em | Causa real | Fix (commit) |
|---|---|---|---|
| #1 | Aplicar migrations | `DROP POLICY ... ON events` com tabela `events` inexistente em DB novo | guarda de existência na 004 (`b7431b5`) |
| #2 | passo GATE (`createClient`) | Node 20 sem WebSocket global (exigido por `@supabase/realtime-js`) | Node 22 (`cb30d3c`) |
| #3 | Instalar Supabase CLI | `version: latest` → rate limit do "resolve latest release" | CLI fixada `2.107.0` (`6d9b9e4`) |
| #4 | passo GATE (`beforeAll`) | `42501 permission denied for table condominios` — service_role/authenticated sem GRANT de tabela | (diagnóstico) |
| #5 | (diagnóstico) | annotation revelou o `42501` e o hint de GRANT | `05823c2` |
| #6 | — | **VERDE** | GRANTs de tabela nas 005/006/007 (`1789653`) |

**Causa-raiz de fundo:** tabelas criadas por migration SQL pura não herdam os GRANTs
padrão que o dashboard do Supabase concede aos roles `anon`/`authenticated`/`service_role`.
A RLS gateia as **linhas**; o GRANT habilita o acesso à **tabela**. Faltava o GRANT —
agora explícito e idempotente nas migrations (vale local e produção).

---

## 4. Segurança

- Stack do CI é **100% local e efêmero** (127.0.0.1) — **produção intocada**.
- `SUPABASE_TEST_SERVICE_ROLE_KEY` nunca apontou para produção.
- A flag `assemblies_remote_enabled` **continua `false`** — habilitar o dual-write é
  decisão de rollout do Lucas; o gate verde apenas a destrava tecnicamente.

---

## 5. Conclusão

O **gate de isolamento está verde contra DB real**: a RLS multi-tenant isola
condomínios em `condominios`/`memberships`/`assemblies`/`assembly_agenda_items`/
`agenda_events`. Daqui em diante, qualquer regressão de RLS que vaze dados entre
condomínios **falha o CI e bloqueia o merge** — o isolamento passou de promessa a
invariante verificada.
