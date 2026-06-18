# Relatório — Sprint Canal de Solicitações + Enquetes (lote duplo relacional)
**Data:** 2026-06-18 · **Branch:** `sprint-canal-enquetes` (a partir de `main` mergeada) · **Flags:** `requests_remote_enabled` e `polls_remote_enabled` = `false` (intocadas)

> Missão: levar **Canal de Solicitações** (010) e **Enquetes** (011) ao modelo relacional, cada um
> com migration nova validada pelo **gate de CI**, molde completo, RLS por papel × visibilidade,
> as quatro provas — tudo gated-off. Duas entidades, fatiadas e commitadas uma de cada vez.

---

## 0. Passo zero — merge do Mural → main (cadência do Lucas)

`sprint-mural-relacional` mergeada em `main` (`--no-ff`, commit `fb8376c`) **com autorização
explícita do Lucas** após sinalizar que a branch carregava 63 commits — incluindo UI **não-gated**
(flip de navegação opção A, selos de natureza, home do morador, UX 6.0–6.2), não só o relacional
gated. Decisão registrada: "merge all 63 to main". Branch nova (`sprint-canal-enquetes`) criada a
partir da `main` atualizada. Cadência fixada: cada fatia verde vira merge; `main` é a fonte de verdade.

---

## 1. O que foi entregue

### Bloco 1 — Canal de Solicitações (`community_requests`, migration 010)

| WS | Entrega | Commit |
|---|---|---|
| A — migration + gate | `010_community_requests.sql`: RLS **papel × visibilidade + AUTORIA** (`created_by uuid DEFAULT auth.uid()`); morador lê as públicas + a própria (mesmo privada), não a privada alheia; cria a própria; só gestão muda status. Gate estendido. | `bc8c4af` |
| B — molde | flag `requests_remote_enabled`; `communityRequestsRemote/Merge/Sync`; push em `community-requests.ts` (add/update/delete; `updateRequest` cobre resolve/close/respond); pull em `app/page.tsx`. | `c0c1eb2` |
| C — provas | merge, pull no-op, paridade (mirrors serializados), reversibilidade (flag off = zero rede). | `bc32ce2` |

### Bloco 2 — Enquetes (`community_polls` + `poll_votes`, migration 011)

| WS | Entrega | Commit |
|---|---|---|
| A — migration + gate | `011_community_polls.sql` (DUAS tabelas). **PRIVACIDADE DO VOTO**: SELECT em `poll_votes` = o próprio voto (`voted_by = auth.uid()`) OU gestão (apuração) — não vaza entre pares. Gate estendido. | `f8fbb2d` |
| B — molde | flag `polls_remote_enabled`; `communityPollsRemote/Merge/Sync` (push/list de polls **E** votes; pull reconcilia as duas sub-entidades); push em `community-polls.ts` (addPoll/updatePoll/deletePoll com cascade; `vote` com mirror-delete dos votos substituídos no re-voto); pull em `app/page.tsx`. | `d01d8f2` |
| C — provas | merge (polls+votes), pull no-op, paridade (polls+votes + **agregado correto**), reversibilidade. | `7bddbb4` |

---

## 2. Gate de CI — saída (Postgres real, `supabase db reset` aplica 001→011)

| Run | SHA | Cobre | Conclusão |
|---|---|---|---|
| [27785617489](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27785617489) | `bc8c4af` | migration 010 + gate (Canal: papel×visibilidade + autoria) | ✅ success |
| [27786103364](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27786103364) | `bc32ce2` | Canal molde + provas + regressão | ✅ success |
| [27786521444](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27786521444) | `f8fbb2d` | migration 011 + gate (Enquetes + privacidade do voto) | ✅ success |
| [27787043069](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27787043069) | `7bddbb4` | Enquetes molde + provas + regressão (937 testes) | ✅ success |

**Novos casos do gate (contra DB real):**
- **community_requests:** gestor A lê todas; B lê 0 (isolamento); residente lê a pública e a
  **própria privada**, **não** a privada alheia; residente **cria a própria** (`created_by=auth.uid()`),
  **não muda status** (RLS filtra → 0 linhas, status intacto); B não insere em A.
- **community_polls:** isolamento A×B + residente lê a enquete 'moradores'; B não cria em A.
- **poll_votes (privacidade):** residente lê **só o próprio voto**, **não** o de outrem; gestão lê
  **todos** (apuração); B não lê nada de A; residente registra o próprio; **forjar `voted_by` alheio
  é barrado** (WITH CHECK).

**Suíte local:** tsc 0 · **937 passando · 33 skipped** (os skipped do gate auto-skipam sem DB) · 0 falhando.

---

## 3. Decisões de modelagem (evitando inflar escopo — §7)

- **Canal:** `ResidentRequest` local não tem visibilidade nem dono. O relacional adiciona
  `created_by DEFAULT auth.uid()` e `visibility DEFAULT 'gestao'` (privado) — **o dual-write NÃO os
  envia** (insert→DEFAULT, update→retém), então o espelho é fiel ao comportamento atual (tudo
  privado, operado pela gestão) **sem mudar o tipo local**. RLS já pronta para o morador-facing.
- **Enquetes:** duas tabelas; `vote()` re-voto faz mirror-delete dos votos substituídos + upsert do
  novo; `deletePoll` conta com `ON DELETE CASCADE` para remover os votos remotos. Privacidade do voto
  é da RLS (`voted_by = auth.uid()` OU gestão), não de filtro de UI.
- **Não foi preciso parar e reportar:** o modelo de autoria/privacidade é o mínimo correto, não
  inflação. Nenhum outbox, comentário, moderação, OS ou papel staff (anti-escopo respeitado).

---

## 4. Invariantes confirmadas

- **Não-Exposição:** `requests_remote_enabled` e `polls_remote_enabled` = `false`. Nenhuma flag de
  exposição/IA ligada. **Produção intocada.**
- **Local-first:** a UI segue nos stores locais (`getRequests`/`getPolls`/`getVotes`/`getPollResults`).
  Pull só faz `merge → save` local; com flag off é **no-op total** (provado).
- **Sem perda de dado:** flag off = zero rede (espião); ciclo on→off sem perda; byte-a-byte idêntico
  ao puramente local (provados). Merge last-write-wins por id, sem tombstones.
- **Privacidade do voto:** voto individual nunca exposto entre pares (RLS, gate-provado).

---

## 5. Próxima fatia (ordem do Lucas: 4-Documentos)

**Documentos** é o próximo. Alternativas de reuso imediato do molde: **comentários do Mural** (fecha
o loop de discussão) ou **timeline institucional** — ambas quando a política de moderação for decidida.
**Bloqueio de rollout inalterado:** ligar qualquer `*_remote_enabled` segue travado só pela decisão
**PF→PJ** do Lucas — não trava o código gated-off.

---

## 6. Commits desta sessão (branch `sprint-canal-enquetes`)

```
7bddbb4  test(enquetes): provas merge/pull/paridade(polls+votes)/reversibilidade (011)
d01d8f2  feat(enquetes): molde completo (polls + votes) — push/merge/sync + wiring (gated-off)
f8fbb2d  feat(enquetes): migration 011 community_polls + poll_votes + gate (privacidade do voto)
bc32ce2  test(canal): provas merge/pull/paridade/reversibilidade (010)
c0c1eb2  feat(canal): molde completo do Canal — push/merge/sync + wiring (gated-off)
bc8c4af  feat(canal): migration 010 community_requests + gate (papel×visibilidade + autoria)
```
(+ `fb8376c` = merge do Mural → main, passo zero.)

**Definição de Pronto:** ✅ migrations 010 e 011 idempotentes c/ rollback · gate de CI verde cobrindo
isolamento + papel/visibilidade de ambas + **privacidade do voto** · molde completo fiado gated-off ·
Enquetes reconcilia polls **E** votes; voto individual nunca exposto entre pares · paridade/
reversibilidade/pull no-op provados para cada entidade · tsc 0 · vitest verde · produção intocada ·
sem perda de dado · relatório escrito.
