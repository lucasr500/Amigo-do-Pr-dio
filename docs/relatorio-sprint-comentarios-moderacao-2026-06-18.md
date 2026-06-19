# Relatório — Sprint Comentários + Moderação (o pacote jurídico-estrutural)
**Data:** 2026-06-18 · **Branch:** `sprint-comentarios-moderacao` (a partir de `main` `fafcb82`) · **Flag:** `comments_remote_enabled = false`

> O sprint mais sensível: moderação como blindagem jurídica desde o dia 1, GATEADA POR RLS no
> banco (não na UI). Três blocos, gate-verde entre cada um. Tudo gated-off.

---

## 1. O que foi entregue (por bloco)

### Bloco 1 — Comentários relacional (migration 014)
`014_community_comments.sql`: estado de moderação por RLS **status × papel**. `publicado` visível
conforme a **visibilidade do post-pai** (Variante A, via `can_read_published_comment`);
`pendente`/`oculto` invisível à comunidade mas o **autor vê o próprio** e gestão/conselho veem a
fila; `removido` só gestão/conselho (auditoria). Morador cria o próprio (`created_by=auth.uid()`);
só gestão/conselho muda status. **SEM policy/grant de DELETE → remoção é SOFT** (status `removido`,
preservado), nunca hard-delete. Molde completo (sem `mirrorDelete`). **Commits `3180991`, `db81b7e`, `0236191`.**

### Bloco 2 — Pré-moderação de sensível (migration 015)
`015_comment_premoderation.sql`: trigger `BEFORE INSERT` que, ao detectar conteúdo sensível
(heurística de termos OU `sensitive` declarado), força `status='pendente'` e `sensitive=true` **no
servidor** — o cliente não publica sensível direto. `lib/content-moderation.ts` (`isSensitiveContent`,
heurística pura) fiado em `addComment` (fecha por padrão mesmo com `autoApprove`). **Commit `0cbafd2`.**

### Bloco 3 — Trilha de auditoria imutável (migration 016)
`016_moderation_log.sql`: append-only. SELECT só gestão/conselho; INSERT por quem age
(`actor_id=auth.uid()`); **SEM UPDATE/DELETE e GRANT só SELECT/INSERT → imutável**. Helper
`moderationLog.logModerationAction` fiado em `addComment` (`criado`/`marcado_sensivel`) e
`moderateComment` (`aprovado`/`ocultado`/`removido`), com snapshot. **Commits `31c3c64`, `45eb08e`.**

---

## 2. Gate de CI — saída (Postgres real, `supabase db reset` aplica 001→016)

| Run | Cobre | Conclusão |
|---|---|---|
| [27796365325](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27796365325) | migration 014 + gate (status×papel) | ✅ success |
| [27796640004](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27796640004) | Comentários molde + provas | ✅ success |
| [27796934450](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27796934450) | Bloco 2 (pré-moderação no servidor) | ✅ success |
| [27797167660](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27797167660) | migration 016 + gate (imutabilidade + isolamento) | ✅ success |
| [27797379793](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27797379793) | trilha fiada + regressão (984 testes) | ✅ success |

**Casos novos do gate (contra DB real):**
- **community_comments:** gestão vê tudo (fila + removidos); B não vê (isolamento); residente vê
  publicado no post `moradores`, **NÃO** no post `gestao` (herda a visibilidade do post-pai); vê o
  próprio pendente, **não** o pendente de outro, **não** o removido; cria o próprio; **não modera**
  (RLS filtra); forja barrada; **nem a gestão faz hard-delete** (comentário persiste).
- **pré-moderação:** termo sensível pedindo `publicado` vira `pendente`+`sensitive` (o trigger
  fechou); conteúdo comum permanece publicado.
- **moderation_log:** gestão lê, residente não, B não (isolamento); membro registra a própria ação;
  **UPDATE barrado** (entrada inalterada); **DELETE barrado** (entrada persiste).

**Suíte local:** tsc 0 · **984 passando · 64 skipped** · 0 falhando.

---

## 3. A regra de moderação como ela ficou (para o Cowork conferir contra a spec)

| Spec (Parte 2) | Como ficou no código | Nota |
|---|---|---|
| Estados `publicado/pendente/aprovado/removido/rejeitado` | **Preservado o CommentStatus existente**: `publicado/pendente/oculto/removido`. `aprovado`→`publicado`; `oculto`=ocultar; `rejeitado` não usado (pendente que nunca publica). | Anti-escopo: não mudar o modelo local. |
| `moderation_status` em posts e comentários | Aplicado a **comentários** (014). Posts já têm `visibility` (009); moderação de posts é fatia futura. | — |
| Dispara sensível: categoria / heurística / alvo nominal | **Heurística de termos** (015 + `content-moderation.ts`) + flag `sensitive` declarada. Alvo nominal por NLP **não** implementado (fora de escopo); termos cobrem o pior caso. | Lista inicial; Lucas refina. |
| `moderation_log.actor_membership_id` | **`actor_id`** = `auth.uid()` (forge-proof; a membership é derivável de user+condomínio). | Desvio consciente p/ simplicidade. |
| Numeração `015 = moderation_log` | `015` = pré-moderação (ordem de execução), `016` = moderation_log. | Sequencial. |
| Remoção preserva (nunca hard-delete) | **Garantido por arquitetura**: sem `mirrorDelete`, sem policy/grant de DELETE. | Gate-provado. |
| Defaults seguros (fechado por padrão) | Trigger força `pendente`; `addComment` fecha mesmo com `autoApprove`; status default da tabela = `pendente`. | Gate-provado. |

---

## 4. Invariantes confirmadas
- **Não-Exposição:** `comments_remote_enabled = false`. Produção intocada.
- **Local-first:** UI lê o store local; pull só faz `merge → save`; flag off = no-op total (provado).
- **Sem perda de dado / nunca hard-delete:** remoção é status `removido` (soft); log imutável.
- **Moderação no banco:** status×papel, pré-moderação e imutabilidade do log gate-provados contra Postgres real.

---

## 5. Stretch (§7 — denúncia com SLA) NÃO executado
A denúncia reativa precisa de SLA/fila (timing) que pode inchar. Sprint sensível já entregue e
verde; parei e reportei conforme a regra. O `denunciado` já está no enum do log e gate-provado
(membro registra a própria denúncia), então um `reportComment` futuro é barato.

---

## 6. Commits desta sessão (branch `sprint-comentarios-moderacao`)
```
45eb08e  feat(moderacao): trilha de auditoria fiada — toda ação loga com snapshot (gated-off)
31c3c64  feat(moderacao): migration 016 moderation_log append-only + gate (imutável + isolamento)
0cbafd2  feat(moderacao): pré-moderação de sensível — defaults seguros (Bloco 2)
0236191  test(comentarios): provas merge/pull/paridade/reversibilidade (014)
db81b7e  feat(comentarios): molde relacional completo dos Comentários (gated-off)
3180991  feat(comentarios): migration 014 community_comments + gate (status×papel)
```

**Definição de Pronto:** ✅ 014 (status×papel) + 015 (pré-moderação) + 016 (log append-only),
idempotentes c/ rollback, gate de CI verde · cliente não publica sensível direto (provado) ·
remoção soft, nunca hard-delete · trilha imutável, toda ação logada (provado) · molde fiado gated ·
paridade/reversibilidade/pull no-op provados · tsc 0 · vitest verde · produção intocada · sem perda
de dado · relatório escrito.
