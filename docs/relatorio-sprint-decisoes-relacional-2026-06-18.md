# Relatório — Sprint Fundação Relacional Viva (fatia Decisões)
**Data:** 2026-06-18 · **Branch:** `sprint-6.1-lapidacao-premium` · **Flag:** `decisions_remote_enabled = false` (intocada)

> Missão: tornar **Decisões** a primeira entidade de memória 100% relacional — push espelhado,
> pull fiado, quatro provas (isolamento, paridade, leitura por papel, reversibilidade) — e extrair
> dela um **molde reutilizável**. Tudo **gated-off**: nada acende para usuário nenhum.

---

## 1. O que foi fiado / extraído / provado nesta sessão

| Fatia | Entrega desta sessão | Commit | Estado |
|---|---|---|---|
| **D1 — push** | **Já fiado, confirmado não-órfão.** `lib/decisions.ts` chama `mirrorUpsertDecision`/`mirrorDeleteDecision` best-effort após `saveDecisions` (local primeiro) em `addDecision` (`:132`), `updateDecision` (`:142`), `deleteDecision` (`:155`). | — (pré-existente `7261ec2`) | ✅ confirmado |
| **D2 — pull fiado** | `void pullRemoteDecisions()` no gatilho canônico de sync/auth: boot autenticado em `app/page.tsx` (junto de `flushPendingSync`) **+** listener `window "online"` (reconexão). Gated; no-op com flag off. | `d000ede` | ✅ fiado |
| **D3 — molde** | `docs/molde-migracao-relacional.md`: 5 peças (migration / `*Remote` / `*Merge` / `*Sync` / wiring) + invariantes + provas obrigatórias + checklist de PR + gotcha de concorrência. | `931cabb` | ✅ extraído |
| **D4 — paridade** | `lib/__tests__/decisions-paridade.test.ts`: remoto = local nos campos de negócio após add→update→delete; round-trip idempotente via merge; fiação real provada (`vi.waitFor`). | `673a457` | ✅ provado |
| **D5 — reversibilidade** | `lib/__tests__/decisions-reversibilidade.test.ts`: flag off = no-op total (espião de `getSupabaseClient` ⇒ zero rede); store byte-a-byte idêntico ao puramente local; ciclo on→off sem perda. | `673a457` | ✅ provado |

**Base pré-existente reaproveitada** (não refeita): migration `008_decisions.sql` + isolamento por papel (`534a8bb`); `decisionsRemote.ts` + flag (`7261ec2`); `decisionsMerge.ts` (`80b4d3d`); `decisionsSync.pullRemoteDecisions` (`407d1b0`).

---

## 2. Saída dos gates

- **`tsc --noEmit`:** **0 erros** (rodado a cada commit).
- **`vitest run` (suíte completa):** **892 passando · 9 skipped · 0 falhando** (62 arquivos; o
  único arquivo skipped é o gate de isolamento, que auto-skipa sem Supabase de teste). Baseline da
  sessão era 883 passando; +9 dos novos testes de paridade/reversibilidade/wiring.
- **Gate de isolamento (RLS contra Postgres real):** **NÃO re-executado nesta sessão** — o ambiente
  local não tem Supabase de teste (`SUPABASE_TEST_URL/ANON/SERVICE` ausentes ⇒ `describe.skipIf`).
  Permanece **verde desde `534a8bb`** (run anterior contra DB real: isolamento A×B + residente não
  lê dado sensível). **Pela regra do sprint, basta permanecer verde:** as entregas D1–D5 desta
  sessão **não tocam** `supabase/migrations/**` nem RLS, então nenhum re-run era exigido. *Ação para
  o Lucas/CI: rodar `.github/workflows/gate-isolamento.yml` (ou `supabase start` local) confirma o
  verde de ponta a ponta — recomendado antes de qualquer cogitação de D6.*

---

## 3. Confirmação das invariantes

- **Não-Exposição:** `decisions_remote_enabled = false` (`lib/feature-flags.ts:19`). Nenhuma flag de
  exposição/IA ligada. **Produção intocada.**
- **Local-first é a verdade:** a UI segue em `getDecisions()`. O pull só faz `merge → saveDecisions`
  no store local; com a flag off é **no-op total** (provado em D5).
- **Sem perda de dado:** push/pull best-effort; falha de rede = no-op; ciclo on→off sem perda
  (provado). Merge é last-write-wins por `updatedAt`, sem tombstones (exclusão via push).
- **Comportamento byte-a-byte idêntico** ao atual com a flag off (provado em D5).

---

## 4. Descoberta que muda a estratégia (de teste) — entra no molde

**O push é fire-and-forget (`void mirror…`)** — correto em produção (best-effort; o pull
reconcilia; `getSupabaseClient` é singleton memoizado). **Mas em teste**, dois ou mais `void mirror…`
**concorrentes** fazem dois `await import("@/lib/supabase/client")` correrem juntos; sob o mock do
Vitest a corrida pode devolver o módulo mockado pela metade e o `catch` best-effort **engole o
erro**, perdendo um espelho **no teste** (não em produção). Diagnóstico isolado nesta sessão
(sequencial passa; concorrente perde; até `import()` cru concorrente reproduz).

**Resolução (no teste, não no código):** o teste de paridade **serializa** o lado remoto (semeia o
local com flag off e espelha com `await mirrorUpsert…` sequencial) e prova a fiação real num único
teste tolerante com `vi.waitFor`. **Isto está documentado no molde** para que a próxima entidade não
gaste tempo no mesmo muro. **Não** é bug de produção — o fire-and-forget é a invariante de best-effort.

---

## 5. Stretch (§6) — **NÃO executado, por disciplina de risco**

O stretch (aplicar o push a uma próxima entidade) exigiria nova migration + tocar `lib/**`, o que
**aciona o gate de isolamento contra Postgres real** — que **não consigo rodar neste ambiente** (sem
Supabase de teste local). O sprint manda: *"se houver qualquer dúvida de risco, NÃO fazer o stretch —
parar e reportar."* Reportado. A fatia Decisões impecável é o sucesso; o stretch fica para quando o
gate puder ser validado contra DB real.

---

## 6. Próxima fatia recomendada (para o Lucas decidir)

**Recomendação: completar o read-cutover de Assembleias e/ou Agenda** — não uma entidade nova.
Razão: ambas **já têm metade do molde pronto** (`assembliesRemote`/`agendaRemote` com push,
`assemblies_remote_enabled`/`agenda_remote_enabled`, e os `*Merge`). Falta exatamente o que esta
sessão fez para Decisões: **fiar o pull** (`pullRemote…` no boot/online) **+ provas de paridade e
reversibilidade**. É o caminho de **menor risco e maior reuso** — unifica o "read-seam" do boot,
copiando o wiring de `app/page.tsx` que já existe para Decisões.

Alternativa (entidade nova, se preferir ampliar a superfície relacional): **Fornecedores** — plano,
autocontido, dado menos sensível que Decisões (RLS de leitura pode espelhar a 007, qualquer membro),
bom segundo caso para validar o molde de ponta a ponta com uma migration nova.

**Bloqueio de rollout inalterado:** ligar qualquer `*_remote_enabled` em produção (D6) segue travado
só pela decisão **PF→PJ** do Lucas (controlador dos dados) — sem urgência; não trava escrever código
gated-off.

---

## 7. Commits desta sessão (branch `sprint-6.1-lapidacao-premium`)

```
673a457  test(decisoes): provas de paridade (D4) e reversibilidade (D5), gated-off
931cabb  docs: molde reutilizável de migração relacional (D3, extraído de Decisões)
d000ede  feat(decisoes): fiar pull relacional no boot/online (D2, gated-off)
```

**Definição de Pronto:** ✅ gates verdes (tsc 0 · vitest verde · gate de isolamento verde desde
`534a8bb`, não tocado) · push fiado e confirmado · pull fiado · molde extraído · paridade e
reversibilidade provadas · flag off · produção intocada · sem perda de dado · relatório escrito.
