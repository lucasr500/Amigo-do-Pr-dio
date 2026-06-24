# Prompt para o Claude Code — Sprint: Comentários + Moderação (o pacote jurídico-estrutural)

> **Cole isto inteiro no Claude Code.** Autossuficiente. Reusa o molde (`docs/molde-migracao-relacional.md`, incl. Variantes A/B) e a especificação de produto **`docs/espec-papel-funcionario-e-moderacao.md` (Parte 2 — Moderação)** como fonte do modelo. Este é o sprint mais sensível: a moderação não é polimento, é **blindagem jurídica desde o dia 1**. Fatie em blocos, gate-verde entre cada um, pare-e-reporte se inchar.

---

## 0. O que você vai entregar
Dar **discussão** aos posts do Mural (Comentários) de forma **relacional e gated**, com **moderação híbrida** como **regra de banco** e uma **trilha de auditoria imutável**. Modelo decidido pelo Lucas (objetivo 10): **reativo no geral + pré-moderação em temas sensíveis**, com separação inegociável **opinião ≠ comunicado oficial ≠ deliberação** e **defaults seguros (fechado por padrão)**.

---

## 1. Por que isto (e por que é diferente dos outros sprints)
Conteúdo de morador = risco real de difamação, calúnia, injúria e exposição de inadimplência. A própria Tese é dura: moderação, trilha de auditoria e separação de natureza são **estruturais, não enfeite**. "Visibilidade só na UI = vazamento" — o **estado de moderação tem de ser gateado por RLS no banco**. A formação jurídica do Lucas é a vantagem competitiva; este sprint a transforma em arquitetura. Errar aqui é dano reputacional e jurídico no momento da exposição.

---

## 2. Invariantes inegociáveis (todo commit)
1. **Não-Exposição:** flag nova `comments_remote_enabled=false`. Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** UI lê o store local; pull faz `merge → save` local. Flag off ⇒ byte-a-byte idêntico.
3. **Sem perda de dado:** falha de rede/SDK = no-op; local nunca regride. **Remoção nunca é hard-delete** — preserva para auditoria.
4. **Best-effort + pull reconcilia** (sem outbox).
5. **Moderação e visibilidade no BANCO** (RLS), não na UI — provado contra Postgres real no gate.
6. **migration → gate de CI verde → wiring.** Não fiar antes do gate.
7. **Defaults seguros:** em dúvida, o sistema **fecha** (conteúdo sensível nasce invisível), não abre.
8. **Commit por bloco**; **manifesto de donos de arquivo** (§8); parar-e-reportar se inchar.

---

## 3. Estado verificado
| Peça | Existe | Onde / ação |
|---|---|---|
| Store local de comentários | ✅ | `lib/community-posts.ts`: `Comment`, `addComment`, `getComments`, `getCommentsForPost`, `moderateComment`, `saveComments` |
| Estados de moderação locais | ✅ | `community-types.ts`: `CommentStatus = "publicado" \| "pendente" \| "oculto" \| "removido"` (PRESERVAR — são a base) |
| Natureza (opinião/oficial/deliberação) | ✅ | `content-nature.ts` (transversal) |
| Tabela relacional de comentários | ❌ | **migration `014_community_comments.sql`** |
| Trilha de auditoria | ❌ | **migration `015_moderation_log.sql`** (append-only) |
| Heurística de "sensível" | ❌ | **criar** (lista de termos + categoria) — ver Bloco 3 |
| Remote/Merge/Sync + flag + wiring | ❌ | **criar** pelo molde |

**Templates:** `009_community_posts.sql` + `communityPosts*.ts` (Variante A — papel×visibilidade) e `decisionsSync.ts`/wiring.

---

## 4. Blocos (gate-verde entre cada um)

### Bloco 1 — Comentários relacional (migration 014)
- Tabela `community_comments` (campos do `Comment`: `post_id`, autor, texto, `status` = `CommentStatus`, `created_at`/`updated_at`), índices `(condominio_id)`/`(condominio_id, post_id)`, trigger, GRANTs, rollback, idempotente.
- **RLS por status × papel (a regra-chave):**
  - `publicado` → visível conforme a visibilidade do post-pai (Variante A).
  - `pendente`/`oculto` → **invisível à comunidade**; o **autor vê o próprio**; gestão/conselho veem (fila de moderação).
  - `removido` → invisível a todos **exceto** gestão/conselho (auditoria) — **nunca apagado**.
  - Escrita: morador cria o próprio comentário; **só gestão/conselho** muda `status` (aprovar/ocultar/remover). Autoria `created_by DEFAULT auth.uid()`, forja barrada.
- Molde completo (`communityCommentsRemote/Merge/Sync.ts` + push em `community-posts.ts` (`addComment`/`moderateComment`) + pull em `app/page.tsx`), gated.
- **Push → gate de CI verde** (isolamento + visibilidade por status×papel) antes do wiring. **Provas** (paridade/reversibilidade/pull no-op). **Commit verde.**

### Bloco 2 — Pré-moderação de sensível (defaults seguros)
- **Gatilho determinístico** que marca um comentário como **sensível** → nasce `pendente` (não publica até aprovação):
  1. **Lista de termos** (condominial) — começar com (Lucas refina): `inadimplente, inadimplência, devedor, caloteiro, deve, não paga, processo, processar, ladrão, corrupto, roubo, desvio` + menção a unidade/nome em contexto negativo.
  2. **Categoria declarada** sensível (financeiro/acusação).
- Em dúvida, **fecha** (pendente), não abre. A decisão é **no servidor** (o cliente não pode forçar `publicado` num conteúdo sensível) — validar na escrita/trigger.
- Conteúdo comum segue **reativo**: publica e pode ser denunciado/removido.
- **Provas:** termo sensível ⇒ `pendente`; comum ⇒ `publicado`; cliente não consegue publicar sensível direto (provar no gate).

### Bloco 3 — Trilha de auditoria imutável (migration 015)
- Tabela `moderation_log` **append-only**: `id, condominio_id, target_type('comment'), target_id, action('criado|marcado_sensivel|aprovado|ocultado|removido|restaurado|denunciado'), actor_membership_id, reason, snapshot(jsonb do conteúdo no momento), created_at`.
- **RLS:** INSERT por quem age; **SELECT só gestão/conselho**; **sem UPDATE/DELETE** (imutável — sem policy de update/delete, e GRANT sem update/delete).
- Cada ação de moderação (Bloco 2 + aprovar/ocultar/remover) grava no log, com snapshot.
- **Provas:** toda ação gera entrada; log não é editável/apagável (provar no gate que update/delete são barrados); B não lê log de A.

### Transversal — Gates verdes
- A cada commit: `tsc` 0 · `vitest` verde · gate de CI verde cobrindo `community_comments` (status×papel) e `moderation_log` (imutabilidade + isolamento).

---

## 5. Definição de Pronto (TODAS verdadeiras)
- [ ] `014` (comentários, RLS status×papel) e `015` (moderation_log append-only) — idempotentes, rollback; **gate de CI verde**.
- [ ] Pré-moderação de sensível com **defaults seguros** (cliente não publica sensível direto; provado no gate).
- [ ] Remoção é **soft** (preservada para auditoria), nunca hard-delete.
- [ ] Trilha imutável: toda ação logada; log não editável/apagável (provado no gate).
- [ ] Molde fiado, gated (`comments_remote_enabled=false`); paridade/reversibilidade/pull no-op provados.
- [ ] `tsc` 0 · `vitest` verde · produção intocada · sem perda de dado.
- [ ] **Relatório** (`docs/relatorio-sprint-comentarios-moderacao-2026-06-XX.md`): migrations + URLs dos runs do gate, a regra de moderação como ela ficou (para o Cowork conferir contra a spec), provas + commits.

---

## 6. Anti-escopo (NÃO nesta janela)
- Não ligar flags de exposição/IA. Não construir outbox.
- Não implementar Reservas, Ordem de Serviço nem papel staff (sprints próprios).
- Não criar UI nova de "fila de moderação" além do necessário para o fluxo — o foco é o **backbone** (dado + RLS + auditoria); a UI rica de moderação pode ser fatia seguinte.
- Não tocar `financial*`, `session.ts`, `Response.tsx`.

---

## 7. Stretch (só se Blocos 1–3 verdes e sobrar janela)
Denúncia reativa (`denunciar`) com SLA: botão que cria entrada `denunciado` no log e move para a fila. Qualquer dúvida de risco/tempo: **pare e reporte**.

---

## 8. Manifesto de donos de arquivo
- **Claude Code:** `supabase/**`, `lib/**`, `components/**`, `app/**`, `lib/__tests__/**`, relatório do sprint.
- **Cowork:** `docs/**` (incl. molde e a spec de moderação), jurídico, Notion, Drive — zero código.
- Nenhum arquivo nas duas lanes ao mesmo tempo. Arquivo de código mexido sem ser por você → pare, revalide com o gate, commite só o snapshot verde.

---

## 9. Primeiro passo concreto
1. Branch a partir de `main` (`fafcb82`). 2. `tsc`/`vitest` baseline. 3. Ler `docs/espec-papel-funcionario-e-moderacao.md` (Parte 2) + `community-posts.ts`/`Comment`. 4. **Bloco 1**: migration `014` + gate estendido (status×papel), **push e esperar o gate de CI verde** antes do wiring; reportar o gate. 5. Um bloco verde antes do próximo. A imutabilidade do log (Bloco 3) e os defaults seguros (Bloco 2) são as provas que mais importam — não as deixe para o fim sem teste.
