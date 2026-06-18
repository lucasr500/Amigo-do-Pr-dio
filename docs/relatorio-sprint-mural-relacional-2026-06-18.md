# Relatório — Sprint Mural/Comunicados Relacional (1ª migration nova via gate de CI)
**Data:** 2026-06-18 · **Branch:** `sprint-mural-relacional` · **Flag:** `mural_remote_enabled = false` (intocada)

> Missão: levar o Mural/Comunicados (`lib/community-posts.ts`) ao modelo relacional multi-tenant
> aplicando o **molde completo** (5 peças), com **migration nova validada pelo gate de CI** (não
> local), gated-off, com as quatro provas — e **fixar o processo "migration → gate de CI → wiring"**
> que as próximas entidades (Canal, Enquetes, Documentos, OS, moderação) vão reusar.

---

## 1. O que foi entregue

| WS | Entrega | Commit |
|---|---|---|
| **A — migration + gate** | `009_community_posts.sql` (tabela + RLS por **papel × visibilidade** + GRANTs + rollback, idempotente) + extensão do gate de isolamento (isolamento A×B + prova de papel/visibilidade em `community_posts`) | `ffeaf68` |
| **B — molde completo** | flag `mural_remote_enabled:false`; `communityPostsRemote.ts` (push/list, `nature` derivada); `communityPostsMerge.ts`; `communityPostsSync.ts` (pull no-op); push fiado em `community-posts.ts`; pull fiado em `app/page.tsx` (boot/online) | `24e646d` |
| **C — provas** | merge, pull no-op, **paridade** (mirrors serializados; natureza+visibilidade preservadas), **reversibilidade** (flag off = zero rede; byte-a-byte; on→off sem perda) | `c3f0e1a` |
| **D — gates** | tsc 0 · vitest verde · **gate de CI verde contra Postgres real** (ver §3) | — |
| **E — comentários** | **NÃO executado** (anti-escopo de moderação + risco/tempo) — ver §6 | — |

---

## 2. A diferença desta fatia: RLS por **papel × visibilidade** (não só filtro de UI)

A 008 (Decisões) restringia leitura a gestão+conselho de forma fixa. O Mural carrega `visibility`
(gestao|conselho|moradores|publico) e a leitura tem de **respeitar o papel do leitor** — o que antes
era só `canSeeVisibility` na UI (`lib/community-permissions.ts`) virou **regra de banco**:

```sql
CASE visibility
  WHEN 'gestao'    THEN has_condominio_role(condominio_id, ARRAY['owner','manager'])
  WHEN 'conselho'  THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
  WHEN 'moradores' THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council','resident'])
  WHEN 'publico'   THEN is_condominio_member(condominio_id)   -- inclui viewer
  ELSE false
END
```

Em qualquer ramo exige membership ativa no condomínio → **isolamento A×B preservado**. Escrita
(ins/upd/del) = **gestão (owner/manager)** — comunicado oficial; council não publica no mural
(`canCreatePost=false`); opinião de morador no relacional é fase social posterior (não concedida).

**Separação de natureza como fato de banco:** `nature` (opiniao|comunicado|deliberacao) é **derivada
de `origin`** via `natureOfPost` e gravada **denormalizada** (write-only no espelho; o pull a ignora,
pois o tipo local a deriva). O autor nunca rotula — o sistema classifica.

---

## 3. Gate de CI — saída (a prova que substitui o Supabase local)

`supabase db reset` aplica **001→009** contra Postgres real no GitHub Actions; roda o gate de
isolamento (agora com `community_posts`) **e** a regressão (`tsc` + `vitest run` completo).

| Run | SHA | Cobre | Conclusão |
|---|---|---|---|
| [27783780408](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27783780408) | `ffeaf68` | migration 009 + gate estendido (isolamento + papel×visibilidade) | ✅ **success** |
| [27784277419](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27784277419) | `c3f0e1a` | molde completo + provas + regressão (908 testes) | ✅ **success** |

**Novos casos do gate (contra DB real):** gestor de A lê seus posts; gestor de B **não** lê post de
A (isolamento); **residente de A LÊ o post `moradores`** mas **NÃO lê o `gestao`** (papel×visibilidade);
residente **não publica**; gestor de B **não insere** em A.

**Suíte local:** tsc 0 · **908 passando · 15 skipped** (9 originais + 6 do gate `community_posts`,
auto-skip sem DB) · 0 falhando.

---

## 4. Processo fixado — **"migration → gate de CI → wiring"** (padrão reusável)

Este sprint estabeleceu o fluxo que toda entidade com tabela nova vai reusar:

1. **Escrever a migration** (`NNN_<entidade>.sql`) espelhando a 008/009 — idempotente, com rollback;
   RLS conforme a sensibilidade (Decisões = papel fixo; Mural = papel×visibilidade).
2. **Estender o gate** (`tenant-isolation.integration.test.ts`) com isolamento A×B + a regra de papel.
3. **Push da branch → o gate roda no GitHub Actions** (`db reset` aplica 001→NNN; Docker nativo do
   runner; nada toca produção). **Esperar verde.** Diagnosticar vermelho pela annotation pública,
   corrigir no arquivo mínimo, sem mexer na RLS no escuro.
4. **Só então o wiring** (remote/merge/sync + push no domínio + pull em `app/page.tsx`), gated-off.
5. **Re-push** revalida tudo (gate + regressão) contra Postgres real.

Não exige Supabase local na máquina do Lucas — o gate de CI é a fonte de verdade do isolamento.
*(Recomendação para o molde: incorporar este fluxo + a variante de RLS papel×visibilidade ao
`docs/molde-migracao-relacional.md` na próxima janela em que docs/** for lane de código.)*

---

## 5. Invariantes confirmadas

- **Não-Exposição:** `mural_remote_enabled = false` (`lib/feature-flags.ts`). Nenhuma flag de
  exposição/IA ligada. **Produção intocada.**
- **Local-first:** a UI segue em `getPosts()/getActivePosts()/…`. O pull só faz `merge → savePosts`;
  com a flag off é **no-op total** (provado). Push best-effort, `void mirror…`, sem outbox.
- **Sem perda de dado:** flag off = zero rede (espião de `getSupabaseClient`); ciclo on→off sem perda;
  byte-a-byte idêntico ao puramente local (provados em reversibilidade).
- **Natureza e visibilidade preservadas** no round-trip (provado em paridade).

---

## 6. Por que E (comentários) NÃO foi feito

Relacionalizar `Comment` traz **estados de moderação** (publicado/pendente/oculto/removido) e uma RLS
de **visibilidade derivada do post-pai** — e §6 do escopo **proíbe moderação** nesta janela. Fazer
metade (sem moderação) deixaria o modelo incoerente e arriscaria vazamento de escopo. Conforme a
regra ("qualquer dúvida de risco/tempo → parar e reportar"), **comentários ficam para o próximo
sprint**, com seu próprio par migration+gate.

---

## 7. Próxima fatia recomendada (ordem do Lucas: 2-Canal, 3-Enquetes, 4-Documentos)

**Canal** é o próximo na ordem. Com o processo já fixado e o molde maduro, é uma migration nova
(`010_channel*.sql`) + gate + molde — horas, não dias. Alternativa de altíssimo reuso e baixo risco:
**comentários do Mural** (fecha o loop discussão), assim que a política de moderação for decidida.

**Bloqueio de rollout inalterado:** ligar qualquer `*_remote_enabled` em produção segue travado só
pela decisão **PF→PJ** do Lucas — não trava o código gated-off.

---

## 8. Commits desta sessão (branch `sprint-mural-relacional`)

```
c3f0e1a  test(mural): provas de merge, pull no-op, paridade e reversibilidade (009)
24e646d  feat(mural): molde relacional completo do Mural — push/merge/sync + wiring (gated-off)
ffeaf68  feat(mural): migration 009 community_posts + gate de isolamento por papel×visibilidade
```

**Definição de Pronto:** ✅ migration 009 idempotente c/ rollback + gate de CI verde (isolamento +
papel/visibilidade) · molde completo fiado gated-off · paridade/reversibilidade/pull no-op provados ·
natureza e visibilidade preservadas · tsc 0 · vitest verde · produção intocada · sem perda de dado ·
relatório escrito.
