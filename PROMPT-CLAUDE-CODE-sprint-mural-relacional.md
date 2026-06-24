# Prompt para o Claude Code — Sprint: Mural/Comunicados Relacional (1ª migration nova, via gate de CI)

> **Cole isto inteiro no Claude Code.** Autossuficiente. Reusa `docs/molde-migracao-relacional.md`. Esta é a **primeira entidade que exige tabela nova** — ela também **estabelece o processo de migration validada por CI** que todas as próximas (Canal, Enquetes, Documentos, ordens de serviço, moderação) vão reusar.

---

## 0. O que você vai entregar

Levar o **Mural/Comunicados** (`lib/community-posts.ts`) ao modelo relacional multi-tenant, aplicando o **molde completo** (as 5 peças), com **migration nova** validada pelo **gate de isolamento no GitHub Actions** (não local). Tudo **gated-off**, com as **quatro provas** (gates, paridade, reversibilidade, leitura por papel) e respeitando a **separação de natureza** (opinião ≠ comunicado ≠ deliberação) e a **visibilidade por papel** que já existem na UI.

---

## 1. Por que isto, e por que agora (objetivos do Lucas)

O Mural/Comunicados é a **superfície de integração nº 1** na ordem que o Lucas fixou (1-Mural, 2-Canal, 3-Enquetes, 4-Documentos). É onde o condomínio **se informa e se alinha** — o primeiro lugar onde "todos na mesma página" vira dado compartilhado por prédio, com o síndico publicando o oficial e o morador vendo conforme seu papel.

E há um ganho de processo igualmente importante: como é a **primeira migration nova** desde que a fundação foi provada, este sprint **fixa o fluxo "migration → gate de CI → wiring"** que destrava toda a fronteira que precisa de tabela (Documentos, Fornecedores, Timeline, ordens de serviço, moderação). Acertar aqui é acertar o método.

---

## 2. Invariantes inegociáveis (todo commit)

1. **Não-Exposição:** novo flag `mural_remote_enabled` = `false` (default). Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** a UI segue lendo `getPosts()`/`getActivePosts()` etc. O pull só faz `merge → save` local. Flag off ⇒ byte-a-byte idêntico ao de hoje.
3. **Sem perda de dado:** falha de rede/SDK = no-op silencioso; o local nunca regride.
4. **Best-effort + pull reconcilia** (decisão desta fase): push best-effort (`void mirror...`); sem outbox.
5. **Separação de natureza e visibilidade preservadas:** o modelo relacional carrega `nature` (`opiniao|comunicado|deliberacao`) e `visibility` (`gestao|conselho|moradores|publico`). A RLS de leitura **respeita a visibilidade por papel** — não é só filtro de UI.
6. **Migration validada por CI antes do wiring** (ver §4-A). Não fiar push/pull antes do gate verde contra Postgres real no GitHub Actions.
7. **Commit por caminho explícito**; branch dedicada; **manifesto de donos de arquivo** (ver §7) — Cowork está em `docs/`+jurídico, não em código, nesta janela.

---

## 3. Estado verificado — o que existe e o que falta

| Peça | Existe? | Onde / ação |
|---|---|---|
| Store local do Mural | ✅ | `lib/community-posts.ts` — `InstitutionalPost`, `addPost/updatePost/archivePost/pinPost/deletePost`, `getPosts/savePosts`, `getActivePosts/getOfficialPosts/getResidentPosts/getPublishedPosts` |
| Visibilidade por papel | ✅ | `lib/community-permissions.ts` — `canSeeVisibility`, `filterByVisibility` |
| Natureza | ✅ | `lib/content-nature.ts` — `ContentNature` |
| Tabela relacional | ❌ | **criar migration `009_community_posts.sql`** |
| Remote (push/list) | ❌ | **criar `lib/tenant/communityPostsRemote.ts`** |
| Merge | ❌ | **criar `lib/tenant/communityPostsMerge.ts`** |
| Pull/sync | ❌ | **criar `lib/tenant/communityPostsSync.ts`** + wiring em `app/page.tsx` |
| Flag | ❌ | **adicionar `mural_remote_enabled: false`** em `lib/feature-flags.ts` |

**Templates a copiar:** migration `008_decisions.sql` (tabela + RLS por papel + GRANTs + rollback idempotente); `decisionsRemote.ts` / `decisionsMerge.ts` / `decisionsSync.ts`; wiring em `app/page.tsx` (boot autenticado + listener online).

---

## 4. Workstreams (ordem — a ordem importa por causa do gate)

### A — Migration nova + gate de CI (FAZER PRIMEIRO; é o desbloqueio)
1. Escrever `supabase/migrations/009_community_posts.sql` espelhando a 008: tabela `community_posts` (PK = id do cliente; `condominio_id` FK; campos do `InstitutionalPost` mapeados; `nature`, `visibility`, `status`, `pinned`, `origin`, timestamps), índices, trigger `updated_at`, RLS, GRANTs, bloco de rollback. **Idempotente** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
2. **RLS por papel + visibilidade** (a diferença vs. Decisões): leitura não é só gestão — o morador **lê posts cuja `visibility` o papel dele alcança** (`canSeeVisibility` virado regra de banco). Escrita (comunicado oficial) restrita a gestão; opinião de morador é fase social posterior (nesta janela, escrita = gestão, como hoje).
3. Estender o gate `lib/__tests__/tenant-isolation.integration.test.ts`: isolamento A×B em `community_posts` **e** prova de papel/visibilidade (morador de A lê o comunicado `publico`/`moradores`, NÃO lê o `gestao`; morador de B não lê nada de A).
4. **Push numa branch → o gate roda no GitHub Actions contra Postgres real.** Só seguir para B quando o gate ficar **verde** (é a regra que substitui o Supabase local). Diagnosticar vermelho pela annotation pública, corrigir no arquivo mínimo, sem mexer na RLS no escuro.

### B — Molde completo (só após gate verde)
- `communityPostsRemote.ts`: `mirrorUpsertPost`, `mirrorDeletePost`, `listRemotePosts` — gated, best-effort, no-op com flag off (padrão `decisionsRemote.ts`).
- `communityPostsMerge.ts`: `mergePosts` (last-write-wins por id; **serializar mirrors nas provas** — corrida documentada no molde).
- `communityPostsSync.ts`: `pullRemotePosts` no-op-quando-off; wiring em `app/page.tsx` no gatilho canônico, gated por `mural_remote_enabled`.
- Fiar push em `community-posts.ts` (`addPost/updatePost/archivePost/pinPost/deletePost` chamam o mirror best-effort após `savePosts`).

### C — Provas (reusar molde + testes de Decisões)
- **Paridade** (mirrors serializados), **reversibilidade** (flag off = zero rede via espião; byte-a-byte; on→off sem perda), **pull no-op**.
- Mocks em memória de `@/lib/supabase/client` e `@/lib/tenant/tenantClient`; `condominio_id` único por teste.

### D — Gates verdes (transversal)
- `tsc` 0 · `vitest` verde (contagem sobe a partir de 892) · gate de isolamento verde **incluindo a nova cobertura de `community_posts`**.

### E — Opcional (só se A–D verdes e sobrar janela): comentários
- Replicar o molde para `Comment` (discussão no post) — tabela `community_comments`, mesma RLS/visibilidade, mesmas provas. Se houver qualquer dúvida de risco ou de tempo, **parar e reportar**; comentários podem ser o próximo sprint.

---

## 5. Definição de Pronto (TODAS verdadeiras)

- [ ] `009_community_posts.sql` criada, idempotente, com rollback; **gate de CI verde** cobrindo isolamento + papel/visibilidade de `community_posts`.
- [ ] Molde completo fiado (remote/merge/sync + push no domínio + pull em `app/page.tsx`), gated por `mural_remote_enabled=false`.
- [ ] **Paridade**, **reversibilidade** e **pull no-op** provados; natureza e visibilidade preservadas no round-trip.
- [ ] `tsc` 0 · `vitest` verde · produção intocada · sem perda de dado.
- [ ] **Relatório de sprint** (`docs/relatorio-sprint-mural-relacional-2026-06-XX.md`): migration + URL do run do gate, provas + commits, e **registro do processo "migration → gate de CI → wiring"** como padrão reusável.

---

## 6. Anti-escopo (NÃO nesta janela)

- Não ligar flags de exposição/IA. Não construir outbox.
- Não implementar moderação/estados de moderação (é o pacote `docs/espec-papel-funcionario-e-moderacao.md`, sprint posterior). Preservar só o modelo de natureza/visibilidade que já existe.
- Não relacionalizar Canal/Enquetes/Documentos ainda (vêm na ordem do Lucas, depois).
- Não permitir escrita de opinião por morador no relacional ainda (escrita = gestão, como hoje).
- Não tocar `financial*`, `session.ts`, `Response.tsx`.

---

## 7. Manifesto de donos de arquivo (blindagem de lane — decisão do Lucas)

Nesta janela:
- **Claude Code (você)** é o único a editar: `supabase/**`, `lib/**`, `components/**`, `app/**`, `lib/__tests__/**`.
- **Cowork** edita apenas `docs/**`, arquivos jurídicos e o Notion — **zero** código nesta janela.
- Regra: nenhum arquivo é tocado pelas duas lanes ao mesmo tempo. Se um arquivo de código aparecer modificado sem ser por você (sync do OneDrive), **pare, revalide com o gate e só commite o snapshot verde** — como foi feito na fatia Decisões.

---

## 8. Primeiro passo concreto

1. Branch da fatia. 2. `tsc`/`vitest` para fotografar o baseline (892). 3. Abrir `008_decisions.sql` + `decisions*.ts` como referência e `lib/community-posts.ts` para mapear o schema. 4. Escrever a migration 009 + estender o gate, **push e esperar o gate de CI verde** antes de qualquer wiring. 5. Reportar o resultado do gate antes de seguir para B.
