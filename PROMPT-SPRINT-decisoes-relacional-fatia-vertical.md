# PROMPT DE SPRINT — Decisões Relacional (fatia vertical impecável)

**Frente:** Amigo do Prédio · **Tema:** Fundação relacional viva (objetivo A) · **Fatia:** Decisões, ponta a ponta
**Data:** 2026-06-18 · **Modo:** gated-off · **Lane:** Cowork + Claude Code (um escritor por arquivo) · **Escopo:** uma única fatia vertical, sem largura

---

## 0. Para o agente executor (leia inteiro antes de tocar em qualquer arquivo)

Você vai transformar o módulo **Decisões** na **primeira entidade de memória 100% relacional** do Amigo do Prédio — escrita espelhada no servidor, leitura relacional fiada, com **as quatro provas** exigidas (gates, paridade, leitura por papel, reversibilidade). Tudo **gated-off**: nada acende para usuário nenhum neste sprint. `localStorage` segue sendo a fonte de verdade; o servidor apenas acumula a cópia até a paridade estar provada.

Esta é a fatia que vira **o molde** para migrar Memória, Documentos e Agenda depois. Capricho aqui economiza retrabalho em tudo o que vem.

---

## 1. Objetivo único (a fatia)

> Completar o ciclo relacional de Decisões — **push fiado → pull fiado → paridade provada → reversibilidade provada** — mantendo `decisions_remote_enabled=false` o tempo todo, sob `tsc 0` + vitest verde + gate de isolamento verde a cada commit, sem perda de dado e sem tocar produção.

Não é "começar"; é **fechar e provar**. O andaime já existe (ver §3). Você fia o que falta e adiciona as duas provas ausentes.

---

## 2. Invariantes inegociáveis (valem em todo commit)

1. **Não-Exposição:** `decisions_remote_enabled` permanece `false`. Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** a UI continua lendo `getDecisions()` do store local. O servidor é cópia. Com a flag off, o comportamento é **byte-a-byte idêntico** ao de hoje.
3. **Sem perda de dado:** nenhuma operação remota pode regredir, sobrescrever ou apagar o store local. Falha de rede/SDK = no-op silencioso, local preservado.
4. **Best-effort defensivo:** toda função remota NUNCA lança e NUNCA bloqueia a UI (segue o padrão de `assembliesRemote.ts`/`agendaRemote.ts`).
5. **Gate obrigatório:** qualquer toque em `lib/**`, `supabase/**` ou `package*.json` exige o gate de isolamento verde antes do commit. Tocar `supabase/migrations/**` exige rodar o gate contra Postgres real.
6. **Commit por caminho explícito** (nunca `git add .`), com `tsc --noEmit` 0 + `vitest run` verde antes de cada commit. Mensagem descreve o workstream.
7. **Um escritor por arquivo:** Cowork e Claude Code não editam o mesmo arquivo na mesma janela (evita truncamento no sync do OneDrive). Dividir por workstream/arquivo; combinar antes de começar.

---

## 3. Estado atual verificado — NÃO refazer o que já existe

| Já pronto | Onde | Status |
|---|---|---|
| Tabela `decisions` + RLS por papel (leitura: owner/manager/council; escrita idem) + GRANTs + rollback documentado | `supabase/migrations/008_decisions.sql` | ✅ idempotente |
| Push (dual-write) | `lib/tenant/decisionsRemote.ts` → `mirrorUpsertDecision`, `mirrorDeleteDecision`, `listRemoteDecisions` | ✅ gated, best-effort |
| Merge puro local↔remoto (last-write-wins por `id`) | `lib/tenant/decisionsMerge.ts` → `mergeDecisions` | ✅ testável |
| Cutover de leitura (pull) | `lib/tenant/decisionsSync.ts` → `pullRemoteDecisions` | ⚠️ **definido, NÃO fiado** |
| Import do push no domínio | `lib/decisions.ts` linha 8 importa `mirrorUpsertDecision`/`mirrorDeleteDecision` | ⚠️ **confirmar se está chamado** em add/update/delete |
| Gate de isolamento cobrindo Decisões | `lib/__tests__/tenant-isolation.integration.test.ts` (isolamento A×B + residente não lê/escreve) | ✅ verde |

**Tradução:** a leitura por papel **no nível do banco** já está provada pelo gate. Faltam: fiar o push (se órfão), fiar o pull, e as provas de **paridade** e **reversibilidade** no nível da aplicação.

---

## 4. Workstreams (ordem de execução)

### D1 — Confirmar/fiar o PUSH (arquivo: `lib/decisions.ts`)
- Verificar se `addDecision`, `updateDecision`, `deleteDecision` realmente chamam `mirrorUpsertDecision`/`mirrorDeleteDecision` após `saveDecisions`. O import existe (linha 8); confirmar que não é órfão.
- Se órfão: fiar as chamadas **depois** do `saveDecisions` (local primeiro, sempre), em modo best-effort (`void mirror...()` sem await que bloqueie a UI; nunca propagar erro).
- Invariante: com flag off, `mirror*` já é no-op interno — então fiar é seguro mesmo desligado.

### D2 — Fiar o PULL (arquivos: ponto de sync/auth + `lib/decisionsSync.ts` é só leitura)
- Chamar `pullRemoteDecisions()` a partir do fluxo canônico de sync/auth — o mesmo gatilho que já dispara o sync de snapshot ao autenticar/voltar online (ver `lib/sync/autoSync.ts` → `flushPendingSync`/`startOnlineListener`, e o boot em `app/page.tsx`).
- Gating: `pullRemoteDecisions` já é no-op total com flag off/anônimo/sem condomínio — fiar não muda comportamento atual.
- Não criar segundo caminho de leitura: a UI continua em `getDecisions()`; o pull só faz merge→`saveDecisions` no store local.

### D3 — PROVA de paridade (novo arquivo de teste)
- Teste que prova: após uma sequência `add → update → delete` com a flag **ligada em ambiente de teste**, as linhas remotas (`listRemoteDecisions`) refletem exatamente o store local (`getDecisions`), sem item perdido, duplicado ou dessincronizado.
- Cobrir o round-trip via `mergeDecisions` (idempotência: merge(local, remote) estável).
- Nível: unit/integration com mock do cliente Supabase OU integração no gate, conforme o padrão já usado para assembleias.

### D4 — PROVA de reversibilidade (novo arquivo de teste)
- Teste que prova: com `decisions_remote_enabled=false`, `mirrorUpsertDecision`/`mirrorDeleteDecision`/`pullRemoteDecisions` são **no-op total** — zero rede, store local intocado, saída byte-a-byte idêntica à do fluxo puramente local.
- Teste que prova: ligar→desligar a flag retorna ao estado 100% local sem perda (o local nunca foi degradado).

### D5 — Manter os gates verdes (transversal)
- A cada commit: `tsc --noEmit` 0 · `vitest run` verde · se tocou `lib/**`/`supabase/**`, gate de isolamento verde.
- O gate já cobre Decisões (isolamento + papel). Se D1–D4 não tocarem RLS nem migration, o gate não precisa de extensão — só permanecer verde.

---

## 5. Definição de Pronto (TODAS verdadeiras — sua escolha)

- [ ] **Gates verdes:** `tsc` 0 + vitest verde + gate de isolamento verde contra Postgres real.
- [ ] **Paridade provada:** teste demonstra local == remoto após add/update/delete (D3).
- [ ] **Leitura por papel provada:** mantida pelo gate (residente não lê; gestão/conselho leem) + pull fiado respeita o papel via RLS (D2 + gate).
- [ ] **Reversibilidade provada:** teste demonstra no-op com flag off e retorno ao estado local sem perda (D4).
- [ ] `decisions_remote_enabled` permanece `false`; produção intocada; nenhum dado perdido.
- [ ] **Relatório de sprint** escrito (ver §7).

---

## 6. Anti-escopo (NÃO fazer nesta janela)

- Não ligar nenhuma flag de exposição/IA. Não expor Decisões a morador (é Completo-Pleno, e a RLS desta fase nem concede).
- Não migrar Memória/Documentos/Agenda ainda — esta fatia é só Decisões (o molde).
- Não adicionar FKs aos vínculos (`linked_*` seguem TEXT enquanto os alvos forem local-first).
- Não tocar `financial*` nem os 18 importadores.
- Não introduzir tombstones/exclusão relacional complexa — exclusão é via push (`mirrorDeleteDecision`), suficiente nesta fase.
- Não refatorar `session.ts`/`Response.tsx` (fora de escopo).

---

## 7. Entregável final

Ao concluir, escrever `docs/relatorio-sprint-decisoes-relacional-2026-06-XX.md` com:
- O que foi fiado (D1/D2) e o que foi provado (D3/D4), com commits.
- Saída dos gates (tsc, contagem de testes, run do gate de isolamento).
- Confirmação das invariantes (flag off, produção intocada, sem perda).
- **Próxima fatia recomendada** (qual entidade migrar a seguir usando este molde) e qualquer descoberta que mude a estratégia — para o Lucas decidir.

---

## 8. Disciplina das duas lanes (Cowork + Claude Code)

- Antes de começar, dividir os arquivos: ex. Claude Code fia D1/D2 (domínio + sync); Cowork escreve D3/D4 (testes novos) — **arquivos distintos, zero sobreposição**.
- Nunca dois escritores no mesmo arquivo na mesma janela.
- Branch dedicada à fatia; commits por caminho explícito; combinar (merge) só com os gates verdes.
- Em conflito de sync (OneDrive), parar e reconciliar antes de seguir — arquivo truncado é pior que lentidão.
