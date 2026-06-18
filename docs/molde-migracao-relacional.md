# Molde de migração relacional — extraído da fatia **Decisões**

> Objetivo: tornar a **próxima** entidade de memória relacional (espelhada no servidor,
> gated-off, reversível) uma tarefa de **horas, não dias**. Este molde é o padrão que a
> fatia Decisões provou ponta-a-ponta — copie-o, troque os nomes, rode os gates.
>
> **Fonte canônica do molde (referência viva):**
> - migration: `supabase/migrations/008_decisions.sql`
> - push/list: `lib/tenant/decisionsRemote.ts`
> - merge puro: `lib/tenant/decisionsMerge.ts`
> - pull (cutover de leitura): `lib/tenant/decisionsSync.ts`
> - wiring: `lib/decisions.ts` (push-no-save) + `app/page.tsx` (pull-no-boot/online)
> - provas: `lib/__tests__/decisions-paridade.test.ts` (paridade) +
>   `lib/__tests__/decisions-reversibilidade.test.ts` (reversibilidade) +
>   `lib/__tests__/decisions-sync.test.ts` (no-op do pull) +
>   `lib/__tests__/tenant-isolation.integration.test.ts` (RLS contra DB real)

---

## Invariantes (valem em TODA migração que usar este molde)

1. **Não-Exposição:** a flag `<entidade>_remote_enabled` nasce `false`. Nada acende para usuário.
2. **Local-first é a verdade:** a UI continua lendo `get<Entidade>()`. O servidor é cópia.
3. **Sem perda de dado:** nenhuma operação remota regride/sobrescreve/apaga o store local.
4. **Best-effort defensivo:** toda função remota **nunca lança** e **nunca bloqueia a UI**.
   Falha de rede/SDK = no-op silencioso, local preservado.
5. **Gate obrigatório:** tocar `lib/**`, `supabase/**` ou `package*.json` exige `tsc --noEmit` 0
   + `vitest run` verde antes do commit. Tocar `supabase/migrations/**` exige rodar o **gate de
   isolamento contra Postgres real**.
6. **Um escritor por arquivo / commit por caminho explícito** (nunca `git add .`).

---

## As 5 peças (ordem de execução)

### Peça 1 — Migration por entidade (espelha `008_decisions.sql`)

Copie `008_decisions.sql`, renomeie a tabela/colunas/políticas. Pontos fixos do molde:

- **PK = `id text`** (o ID estável do cliente, ex.: `dec_…`) — é a chave de upsert (`onConflict:"id"`).
- **`condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE`** — escopo do tenant.
- **`created_at`/`updated_at timestamptz DEFAULT now()`** + trigger `update_updated_at_column()`
  (o **servidor** gere os timestamps; o push **não** os envia — ver Peça 2).
- **Índices**: `(condominio_id)` e os `(condominio_id, <campo de filtro>)` que a UI usa.
- **RLS** com as funções `SECURITY DEFINER` da 005 (`has_condominio_role(...)`):
  - **Leitura**: decida o papel conforme a sensibilidade do dado. Decisões = **só gestão+conselho**
    (dado jurídico/trabalhista). Dado não sensível pode espelhar 007 (qualquer membro).
  - **Escrita (ins/upd/del)**: `owner/manager/council` (padrão).
- **GRANT ALL ON TABLE `<tabela>` TO anon, authenticated, service_role** (a RLS gateia as linhas).
- **Idempotência**: `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de cada policy.
- **Cabeçalho com ROLLBACK** explícito (`DROP POLICY…; DROP TABLE IF EXISTS…`).
- **`linked_*` seguem `TEXT` sem FK** enquanto os alvos forem local-first (anti-escopo permanente).

### Peça 2 — `<entidade>Remote.ts` (push/list, gated, best-effort)

Copie `decisionsRemote.ts`. Estrutura fixa:

- **Tipos locais** (`<Entidade>Row`, `…Table`, `SupabaseClient`) — não dependa do SDK genérico;
  `cast` local via `asClient`. Import do tipo de domínio é **type-only** (sem ciclo de runtime).
- **`toRow(d, condominioId)`** camelCase→snake_case. **NÃO** envie `created_at`/`updated_at`
  (são do servidor). Defaults seguros (ex.: `visibility ?? 'gestao'`).
- **`fromRow(r)`** snake_case→camelCase, com fallbacks (`?? ''` / `?? undefined`).
- **Gating em camadas, no topo de CADA função** (a ordem importa — barata→cara):
  ```ts
  if (typeof window === "undefined") return …;          // SSR
  if (!isEnabled("<entidade>_remote_enabled")) return …; // flag (default false ⇒ zero rede)
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return …;                                  // sem tenant
  try { /* import dinâmico do SDK + query */ } catch { /* best-effort — nunca lança */ }
  ```
- Exporte **`mirrorUpsert<Entidade>(d)`**, **`mirrorDelete<Entidade>(id)`**, **`listRemote<Entidade>(condId?)`**.
- A flag deve existir em `lib/feature-flags.ts` (`<entidade>_remote_enabled: false`).

### Peça 3 — `<entidade>Merge.ts` (merge puro)

Copie `decisionsMerge.ts` (que por sua vez espelha `assembliesMerge.ts`). Regras fixas:

- **Sem React, sem localStorage, sem rede.** Determinístico e testável isoladamente.
- **União por `id`**; em conflito vence o `updatedAt ?? createdAt` mais recente (last-write-wins).
- **Empate preserva o já presente (local)** — local-first vence o empate.
- **Sem tombstones nesta fase**: a ausência de um `id` num dos lados **não apaga** o registro;
  exclusões são responsabilidade do **push** (`mirrorDelete…`).

### Peça 4 — `<entidade>Sync.ts` (pull = cutover de leitura, no-op quando off)

Copie `decisionsSync.ts`. Regras fixas:

- Vive **separado** do módulo de domínio para não criar ciclo de import.
- **`pullRemote<Entidade>()`**: `listRemote… → merge<Entidade>(local, remote) → save<Entidade>(merged)`.
- **No-op total** com flag off / anônimo / sem condomínio / remoto vazio → retorna sem tocar o store.
- **Best-effort**: falha de rede nunca regride o local (segue local-first). Nunca lança.
- A UI **continua** lendo `get<Entidade>()` — **um único caminho de leitura**, sem read-through espalhado.

### Peça 5 — Wiring (push-no-save + pull-no-sync/boot)

- **Push** em `lib/<entidade>.ts`: após **cada** `save<Entidade>(...)` (local **primeiro, sempre**),
  dispare `void mirrorUpsert<Entidade>(x)` / `void mirrorDelete<Entidade>(id)`. Fire-and-forget,
  sem `await` bloqueante, nunca propaga erro. Com a flag off o mirror já é no-op interno.
- **Pull** em `app/page.tsx` (boot autenticado) — junto de `flushPendingSync()` — e num listener
  `window "online"` (reconexão). `void pullRemote<Entidade>()`. Gated; no-op com flag off.

---

## Gotcha descoberto na fatia Decisões (baixe isto no teste, não no código de produção)

**O push é fire-and-forget (`void mirror…`).** Em produção isso é correto (best-effort; o pull
reconcilia) e o `getSupabaseClient` é um singleton memoizado. **Mas em teste**, disparar **dois ou
mais `void mirror…` concorrentes** faz dois `await import("@/lib/supabase/client")` correrem ao
mesmo tempo; sob o mock do Vitest essa corrida pode entregar o módulo mockado pela metade, e o
`catch` best-effort **engole o erro** — **perdendo um espelho no teste** (não em produção).

**Como o molde resolve** (ver `decisions-paridade.test.ts`): no teste de paridade, **serialize** o
lado remoto — semeie o local com a flag **off** (sem disparar push paralelo) e depois espelhe com
**`await mirrorUpsert…` sequencial**. Prove a fiação real (addsave dispara o push) num **único**
teste tolerante com `vi.waitFor` (uma operação só → sem corrida). Não “conserte” isso no código de
produção: o fire-and-forget é a invariante de best-effort.

---

## Provas obrigatórias (Definição de Pronto da fatia)

| Prova | Arquivo-molde | O que garante |
|---|---|---|
| **Paridade** | `decisions-paridade.test.ts` | após add→update→delete, remoto = local nos campos de negócio (sem item perdido/duplicado); round-trip idempotente via merge |
| **Reversibilidade** | `decisions-reversibilidade.test.ts` | flag off ⇒ no-op total (zero rede via espião de `getSupabaseClient`); store local byte-a-byte idêntico ao puramente local; on→off sem perda |
| **No-op do pull** | `decisions-sync.test.ts` | `pullRemote…` não toca o store com flag off / sem condomínio |
| **Isolamento (RLS)** | `tenant-isolation.integration.test.ts` | contra Postgres real: condomínio B não lê/escreve dados de A; papel sem permissão não lê dado sensível |

**Comparação de paridade:** compare **só campos de negócio** — exclua `createdAt`/`updatedAt`
(colunas do servidor, não enviadas pelo push; compará-las daria falso negativo).

---

## Checklist de PR (a próxima entidade em horas)

- [ ] `supabase/migrations/NNN_<entidade>.sql` (Peça 1) — idempotente, com rollback no cabeçalho.
- [ ] Caso da entidade no `tenant-isolation.integration.test.ts` (isolamento A×B + papel sem leitura).
- [ ] Flag `<entidade>_remote_enabled: false` em `lib/feature-flags.ts`.
- [ ] `lib/tenant/<entidade>Remote.ts` (Peça 2) — push/list gated best-effort.
- [ ] `lib/tenant/<entidade>Merge.ts` (Peça 3) + testes de merge.
- [ ] `lib/tenant/<entidade>Sync.ts` (Peça 4) + teste de no-op do pull.
- [ ] Wiring push (Peça 5) em `lib/<entidade>.ts` + wiring pull em `app/page.tsx`.
- [ ] Provas de paridade + reversibilidade (serializar mirrors — ver gotcha).
- [ ] **Gates:** `tsc --noEmit` 0 · `vitest run` verde · gate de isolamento verde (DB real se tocou migration).
- [ ] Flag permanece **false**; produção intocada; nenhum dado perdido.

---

## Anti-escopo (não fazer ao migrar uma entidade)

- Não ligar `<entidade>_remote_enabled` nem qualquer flag de exposição/IA.
- Não adicionar FK aos `linked_*` enquanto os alvos forem local-first.
- Não criar 2º caminho de leitura (read-through na UI) — a UI lê só o store local.
- Não “consertar” o fire-and-forget do push no código de produção (é a invariante best-effort).

---

### Changelog
- **2026-06-18:** molde extraído da fatia Decisões (D1–D5 gated-off, gate de isolamento verde
  contra DB real). Inclui o gotcha de concorrência do mock de push descoberto na sessão.
