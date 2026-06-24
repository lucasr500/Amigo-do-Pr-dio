# Prompt para o Claude Code — Sprint: Canal de Solicitações + Enquetes (lote duplo relacional)

> **Cole isto inteiro no Claude Code.** Autossuficiente. Reusa o processo provado no Mural: **migration → gate de CI verde → wiring**, e o molde (`docs/molde-migracao-relacional.md`) com a variante de **RLS por papel × visibilidade**. Duas entidades nesta janela ("maior lote que passa nos gates"), mas **fatiadas e commitadas uma de cada vez**.

---

## 0. Passo zero — merge do Mural (cadência decidida pelo Lucas)

Antes de começar: **abrir o PR `sprint-mural-relacional` → `main` e mergear** (tudo gated, flags off → produção byte-a-byte idêntica; é seguro). A partir daí, **branch nova a partir de `main` atualizada** para esta fatia. Cadência fixada: cada fatia verde vira PR e merge — main é a fonte de verdade, sem branches empilhadas.

---

## 1. O que você vai entregar

Levar **Canal de Solicitações** (`lib/community-requests.ts`) e **Enquetes** (`lib/community-polls.ts`) ao modelo relacional, cada uma com **migration nova validada pelo gate de CI**, molde completo, **RLS por papel × visibilidade**, as quatro provas, tudo **gated-off**. São as superfícies de integração nº 2 e nº 3 da ordem do Lucas.

---

## 2. Por que isto (objetivos do Lucas)

- **Canal de Solicitações = o verbo central do morador:** "levantar uma questão e vê-la andar". É o que substitui o grupo de WhatsApp e reduz ruído/briga — dá um caminho legítimo, com **status visível e honesto** (recebido → análise → resolvido/arquivado-com-justificativa). Relacional = a questão do morador e a resposta da gestão passam a ser dado compartilhado por prédio.
- **Enquetes = a voz do morador antes da assembleia:** consulta consultiva que faz a assembleia chegar "mastigada", com menos ruído. Relacional = todos veem o **resultado agregado**, sem expor o voto individual.

Referência de experiência: `docs/ia-ux-camada-integracao-morador.md` (§6 Canal, §7 Enquetes).

---

## 3. Invariantes inegociáveis (todo commit)

1. **Não-Exposição:** dois flags novos, `requests_remote_enabled=false` e `polls_remote_enabled=false`. Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** a UI segue lendo os stores locais; o pull só faz `merge → save` local. Flag off ⇒ byte-a-byte idêntico ao de hoje.
3. **Sem perda de dado:** falha de rede/SDK = no-op silencioso; o local nunca regride.
4. **Best-effort + pull reconcilia** (sem outbox).
5. **RLS por papel × visibilidade no banco** (não só na UI) — reusar a variante provada no Mural (`canSeeVisibility` virado regra de banco).
6. **Migration validada por gate de CI antes do wiring** (push → GitHub Actions contra Postgres real). Não fiar push/pull antes do gate verde.
7. **Commit por caminho explícito**; uma entidade por vez; **manifesto de donos de arquivo** (§8). Se o escopo de uma entidade inchar (ver Enquetes/votos), **pare e reporte** — como foi feito com o stretch de comentários.

---

## 4. Estado verificado

| Entidade | Store local (existe) | Tipos | Criar |
|---|---|---|---|
| **Canal** | `lib/community-requests.ts`: `getRequests/saveRequests/addRequest/updateRequest/resolveRequest/closeRequest/respondToRequest/deleteRequest` | `ResidentRequest`, `RequestStatus`, `RequestType`, `RequestPriority` (em `community-types.ts`) | migration `010_community_requests.sql` · `communityRequestsRemote/Merge/Sync.ts` · flag `requests_remote_enabled` · wiring |
| **Enquetes** | `lib/community-polls.ts`: `getPolls/savePolls/addPoll/updatePoll/closePoll/deletePoll` **+ votos** `getVotes/saveVotes/vote/getPollResults` | `Poll`, `PollOption`, `PollStatus`, `PollVote` | migration `011_community_polls.sql` (polls **+ poll_votes**) · `communityPollsRemote/Merge/Sync.ts` · flag `polls_remote_enabled` · wiring |

**Template:** `009_community_posts.sql` + `communityPosts*.ts` (a fatia mais recente, já com a variante papel×visibilidade) e o wiring em `app/page.tsx`.

---

## 5. Workstreams (ordem — uma entidade fecha verde antes da outra)

### Bloco 1 — Canal de Solicitações (community_requests)
- **A. Migration `010` + gate:** tabela `community_requests` (campos de `ResidentRequest`: tipo, status, prioridade, visibilidade, autor, resposta, timestamps), índices, trigger, RLS, GRANTs, rollback, idempotente. **RLS papel×visibilidade:** morador lê **as próprias** solicitações + as marcadas públicas; gestão/conselho leem todas; morador **cria** a própria; só gestão muda status/responde. **Padrão de visibilidade = privado** (só gestão), o morador escolhe tornar pública. Estender o gate de isolamento cobrindo isso. **Push → gate de CI verde** antes do wiring.
- **B. Molde:** `communityRequestsRemote/Merge/Sync.ts` + push fiado em `community-requests.ts` + pull em `app/page.tsx`, gated.
- **C. Provas:** paridade (mirrors serializados), reversibilidade (flag off = zero rede), pull no-op. Commit verde antes do Bloco 2.

### Bloco 2 — Enquetes (community_polls + poll_votes)
- **A. Migration `011` + gate (DUAS tabelas):** `community_polls` e `poll_votes`. **Privacidade do voto (inegociável):** a RLS de `poll_votes` **não** permite a um morador ler o voto individual de outro; resultado é **agregado**. Gestão pode ler para apuração; o voto individual não vaza entre pares. O gate deve provar: morador de A não lê voto individual alheio; B não lê nada de A. **Push → gate de CI verde** antes do wiring.
- **B. Molde (duas sub-entidades):** o pull reconcilia **polls E votes** (espelho de `mergeAssemblies`+`mergeAgendaItems`); `communityPollsRemote/Merge/Sync.ts` + push fiado em `community-polls.ts` (`addPoll/updatePoll/closePoll/deletePoll/vote`) + pull em `app/page.tsx`, gated.
- **C. Provas:** paridade (polls + votes), reversibilidade, pull no-op, **+ prova de privacidade do voto** (agregado correto sem expor individual).

### Transversal — Gates verdes
- A cada commit: `tsc` 0 · `vitest` verde (contagem sobe a partir de 908) · gate de CI verde cobrindo `community_requests` e `community_polls`/`poll_votes`.

---

## 6. Definição de Pronto (TODAS verdadeiras)

- [ ] Migrations `010` e `011` criadas (idempotentes, rollback); **gate de CI verde** cobrindo isolamento + papel/visibilidade de ambas, **e a privacidade do voto**.
- [ ] Molde completo fiado para as duas entidades, gated (`requests_remote_enabled`/`polls_remote_enabled` = false).
- [ ] Enquetes reconcilia **polls E votes**; voto individual nunca exposto entre pares.
- [ ] Paridade, reversibilidade e pull no-op provados para cada entidade.
- [ ] `tsc` 0 · `vitest` verde · produção intocada · sem perda de dado.
- [ ] **Relatório de sprint** (`docs/relatorio-sprint-canal-enquetes-2026-06-XX.md`): migrations + URLs dos runs do gate, provas + commits, confirmação das invariantes.

---

## 7. Anti-escopo (NÃO nesta janela)

- Não ligar flags de exposição/IA. Não construir outbox.
- **Não** implementar comentários, moderação, ordens de serviço nem papel staff (são pacotes posteriores). Preservar só o modelo de status/visibilidade que já existe.
- Não relacionalizar Agenda/Documentos ainda (são o **próximo** sprint, por decisão do Lucas).
- Não tocar `financial*`, `session.ts`, `Response.tsx`.

---

## 8. Manifesto de donos de arquivo (blindagem de lane)

Nesta janela:
- **Claude Code (você):** `supabase/**`, `lib/**` (exceto `docs/`), `components/**`, `app/**`, `lib/__tests__/**`, e o **relatório** do sprint.
- **Cowork:** apenas `docs/**` (incl. `docs/molde-migracao-relacional.md`), jurídico e Notion — zero código.
- Nenhum arquivo tocado pelas duas lanes ao mesmo tempo. Se um arquivo de código aparecer modificado sem ser por você (sync do OneDrive), **pare, revalide com o gate e só commite o snapshot verde**.

---

## 9. Primeiro passo concreto

1. **PR + merge do Mural** → `main`; branch nova a partir de `main`. 2. `tsc`/`vitest` para fotografar o baseline (908). 3. Abrir `009_community_posts.sql` + `communityPosts*.ts` como referência. 4. Bloco 1 (Canal): migration `010` + gate estendido, **push e esperar o gate de CI verde** antes de qualquer wiring. 5. Reportar o gate antes de seguir. Bloco 2 (Enquetes) só depois do Bloco 1 verde.
