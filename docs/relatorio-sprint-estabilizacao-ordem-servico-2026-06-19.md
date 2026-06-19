# Relatório — Estabilização de Lane + Ordem de Serviço + papel staff
**Data:** 2026-06-19 · **Branch:** `sprint-estabilizacao-ordem-servico` (de `main` `1ca1816`) · **Flag:** `service_orders_remote_enabled = false`

> Duas fases sequenciais. Fase 0 (estabilização + reverificação real) tinha de fechar verde antes
> da Fase 1 (Ordem de Serviço + papel staff, gated-off). Ambas fecharam verde.

---

## FASE 0 — Estabilização & Reverificação (números reais)

### Honestidade sobre o diagnóstico
O prompt descrevia a árvore como **corrompida** (71 arquivos truncados, 421 "modificados" por
CRLF). **No momento da verificação, isso NÃO se confirmou.** `git status` acusava **uma única**
modificação rastreada — `docs/molde-migracao-relacional.md` (+30 linhas, lane do Cowork, bem-formada,
sem truncamento) — e arquivos `.md` de prompt não rastreados. As centenas de linhas eram **avisos de
CRLF do git** (informativos, não modificações). `tsc 0` e a suíte já rodavam verdes. Portanto **não**
executei `git restore .` (apagaria o trabalho legítimo do Cowork no molde). Fiz as tarefas
preventivas/úteis e reporto a divergência com honestidade.

### Números reais (reverificação)
- **`npm ci`:** limpo — 432 pacotes, **0 vulnerabilidades**.
- **`tsc --noEmit`:** **0 erros**.
- **`vitest run`:** **984 passando · 64 skipped** (HEAD `1ca1816`); um arquivo skipped é o gate de
  isolamento (auto-skip sem DB).
- **`npm run build`:** **✓ compilou** (um arquivo truncado quebraria o build — confirma árvore sã).
- **Bundle de `/`:** **187 kB First Load JS** (route 55.7 kB). Orçamento `/ < 230 kB` ✅. Sem libs novas.

### Blindagem da lane
- **`.gitattributes`** criado (`* text=auto eol=lf`, `*.sql eol=lf`, binários `binary`) — commit
  `9e0fded`. `git add --renormalize .` confirmou que **os blobs do repo já eram LF** (renormalize
  só tocou `.gitattributes` + o molde do Cowork; zero mudança de conteúdo nos ~400 arquivos). Após
  isso, os avisos do git inverteram para "CRLF will be replaced by LF" — a normalização passou a agir.
- **Recomendação (não executada, decisão do Lucas):** trabalhar num clone fora do OneDrive e
  sincronizar só via Git elimina a causa-raiz (o OneDrive mexendo em `.git/` causou um `index.lock`
  órfão de 0 byte nesta sessão, que precisei limpar).

### service_role auditado (`app/api/admin/events/route.ts`)
Route handler **server-side** (nunca vai ao bundle do cliente). Usa `SUPABASE_SERVICE_ROLE_KEY`
(**sem** `NEXT_PUBLIC_` → não exposta). Exige `ADMIN_KEY` via `Authorization: Bearer` (em produção
sem `ADMIN_KEY` → **403**; chave errada → **401**). Rate-limit 60/min/IP. Sem chave/URL → retorna
vazio. **Ponto a notar:** em DEV sem `ADMIN_KEY` o guard de produção não se aplica — aceitável
(local), mas **em produção `ADMIN_KEY` deve estar setada** (senão bloqueia tudo). ✅ Confirmado seguro.

---

## FASE 1 — Ordem de Serviço + papel staff (gated-off)

### Entregas
- **Papel `staff` (aditivo):** adicionado a `MembershipRole` (`lib/tenant/types.ts`) + entrada
  `read_only` em `effectiveRole`. Migration 017 faz `ALTER` do CHECK de `memberships` p/ incluir
  `staff`. **Não** alterou papéis/RLS existentes (009–016 seguem verdes no gate).
- **Migration 017 `service_orders`** (P1): RLS **staff×papel** + trigger de proteção de colunas +
  soft-only. **Commit `020c1a5`.**
- **Molde gated + loop** (P1/P2): `lib/service-orders.ts` + `serviceOrders{Remote,Merge,Sync}.ts` +
  flag `service_orders_remote_enabled=false` + pull em `app/page.tsx`. Loop:
  `createServiceOrderFromRequest` (Canal→ordem) e `completeServiceOrder` (comprova → linha do tempo).
  **Commit `b6cf14b`.**

### Gate de CI — saída
| Run | SHA | Cobre | Conclusão |
|---|---|---|---|
| [27802622917](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27802622917) | `020c1a5` | migration 017 + 12 casos staff×papel | ✅ success |
| [27802897422](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27802897422) | `b6cf14b` | molde + loop + regressão (992 testes) | ✅ success |

**Casos do gate (Postgres real):** gestão vê todas as ordens; **staff vê só a atribuída a si**, não
a não-atribuída; **resident barrado**; staff de A não existe em B → **B não vê** (isolamento); staff
**comprova** (status/evidence); **trigger reverte** título/reatribuição tentados pela staff; staff
não toca ordem alheia (RLS filtra); resident/B não criam; **forja de `created_by` barrada**; **sem
hard-delete** (ordem persiste).

**Suíte final:** tsc 0 · **992 passando · 76 skipped** · 0 falhando.

---

## A regra como ficou × spec (Parte 1 — Ordem de Serviço)

| Spec | Como ficou | Nota |
|---|---|---|
| `staff` em `MembershipRole`, rótulo "Funcionário/Zelador" | Aditivo no enum + CHECK de memberships (017) | ✅ |
| SELECT: gestão todas; staff só atribuídas; resident não | `is_assigned_staff(condo, membership)` na policy | ✅ gate-provado |
| UPDATE staff só na própria, só campos operacionais | RLS (assignee = sua membership) **+ trigger** que reverte título/categoria/prioridade/atribuição/escopo | Coluna-level via trigger (RLS é row-level) |
| Marcar feita + comprovar só pela staff dona | `status`/`evidence` editáveis pela staff dona | ✅ |
| DELETE só owner/manager | **Endurecido para soft-only**: SEM policy/grant de DELETE → nem a gestão hard-deleta (cancelamento é status `cancelada`) | Desvio consciente (mais seguro que a spec) |
| `assignee_membership_id` base da RLS | FK a `memberships(id)` | ✅ |
| Loop solicitação→ordem→execução→timeline | `createServiceOrderFromRequest` + `completeServiceOrder`→`addTimelineEvent` | Mínimo, sem UI de vitrine; visibilidade `gestao` (default seguro) |
| `evidence[]` (foto/nota) | `jsonb` `[{kind,url|text,created_at}]`; foto via Storage é fase futura | — |

---

## Invariantes confirmadas
- **Não-Exposição:** `service_orders_remote_enabled=false` (e todas as demais off). Produção intocada.
- **Local-first:** UI lê `getServiceOrders()`; pull só faz `merge→save`; flag off = no-op (provado).
- **Sem perda de dado / soft-only:** sem `mirrorDelete`, sem policy/grant de DELETE; cancelamento é status.
- **RLS no banco:** staff×papel + isolamento + proteção de colunas, gate-provados contra Postgres real.
- **Aditivo:** 009–016 seguem verdes no gate (o enum não regrediu RLS provada).

---

## Commits (por caminho)
```
b6cf14b  feat(ordem-servico): molde relacional + loop (gated-off)
         — lib/service-orders.ts, lib/tenant/serviceOrders{Remote,Merge,Sync}.ts,
           lib/feature-flags.ts, app/page.tsx, lib/__tests__/service-orders*.test.ts
020c1a5  feat(staff): papel staff + migration 017 + gate
         — lib/tenant/types.ts, lib/tenant/effectiveRole.ts,
           supabase/migrations/017_service_orders.sql, lib/__tests__/tenant-isolation.integration.test.ts
9e0fded  chore: .gitattributes (eol=lf)
```

---

## O que ficou incerto + como confirmar
- **Molde do Cowork não-commitado:** `docs/molde-migracao-relacional.md` tem +30 linhas (Variantes
  A/B/C) na árvore, **não commitadas** — é lane do Cowork; deixei intacto. *Confirmar:* o Cowork
  commita na lane dele.
- **Dual-write da staff (futuro):** o `mirrorUpsert` usa `upsert` (INSERT...ON CONFLICT). Quando a
  staff for write-facing, o INSERT WITH CHECK (gestão) barraria o upsert da staff; precisará de um
  caminho **update-only** para a staff. Hoje só a gestão escreve (single-user), então é no-op. *Confirmar
  na fatia staff-facing.*
- **Causa-raiz do OneDrive:** o `.gitattributes` blinda o churn, mas a recomendação de clone fora do
  OneDrive (decisão do Lucas) elimina o `index.lock` órfão. *Confirmar:* decisão de ambiente do Lucas.
