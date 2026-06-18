# Relatório de Alinhamento — Amigo do Prédio

**Data:** 2026-06-18 · **Branch:** `sprint-6.1-lapidacao-premium` · **Autonomia:** cirúrgica
**Método:** leitura de código + Notion canônico (Direção Oficial jun/2026; Tese Integração
2026-06-17) + verificações objetivas. Cada "pronto" ancorado em `arquivo:linha`.
**Anterior:** `docs/relatorio-estado-atual-2026-06-14.md` · `docs/relatorio-gate-isolamento-2026-06-18.md`.

---

## 1. Veredito de alinhamento (placar por eixo)

| Eixo | % | Selo | Síntese |
|---|---|---|---|
| 1 — Direção Oficial (SaaS multi-tenant, multi-persona, Não-Exposição) | ~55% | 🟡 | Fundação relacional + RLS **provada isolada**; dados ainda local-first; tenant só via dual-write gated-off. |
| 2 — Tese / wedge da Assembleia | ~72% | 🟡 | Entidade + loop + separação jurídica ✅. Wedge **agora em destaque no Início** (esta sprint). |
| 3 — Apple-like | ~78% | 🟡 | Vocabulário unificado, badge resumo→detalhe, "o que faço agora?" reforçado. Atrito restante: semântica do "Perguntar". |
| 4 — Personas | ~40% | 🟡 | Síndico maduro; condômino/conselho/funcionário foundational (Completo-Pleno, não bloqueia). |
| 5 — Completo-Núcleo | ~50% | 🟡 | Auth/sync reais (gated), **isolamento provado**; faltam plano de dados relacional em runtime + jurídico. |

**Gargalo dominante (único):** o plano de dados ainda é **local-first**. O multi-tenant
relacional está construído e provado isolado, mas nenhum módulo o consome em runtime (só
dual-write gated-off de assembleias/agenda). Tudo "compartilhado/multi-persona" é demo até a
migração relacional deliberada (com RLS+isolamento) — que **não pode ser feita "de passagem"**.

---

## 2. Evidências-chave (arquivo:linha)

- Separação jurídica derivada e unificada: `lib/content-nature.ts:59-93`; tooltip em `components/ContentNatureBadge.tsx:35`. Aplicada em Assembleia, Mural, Decisões, Home do morador.
- Entidade Assembleia + loop: `lib/session-assembleias.ts:29-57`; `lib/assembleias-loop.ts` (deliberar→decisão→timeline); `supabase/migrations/007_assemblies.sql`.
- Wedge no Início (esta sprint): `lib/assembly-home.ts`; `components/AssemblyHomeCard.tsx`; `components/tabs/HomeTab.tsx` (seção "Governança/Assembleia"); deep-link via `components/tabs/MemoriaTab.tsx` (`focusedSection`).
- Não-Exposição respeitada: `assemblies_remote_enabled:false` em `lib/feature-flags.ts:18`; dual-write gated em `lib/tenant/assembliesRemote.ts`.
- Isolamento provado: `docs/relatorio-gate-isolamento-2026-06-18.md` (run #6, GRANTs nas migrations 005/006/007).
- Multi-tenant = 1 usuário ↔ N condomínios (não administradora): Notion "Escopo multi-tenant"; schema `migrations/005`.

---

## 3. O que mudou desde 06-14

1. **Gate de isolamento: ⛔ → 🟢 provado** (run #6). O "coração do Bloco B" deixou de ser desconhecido — maior redução de risco do período.
2. **Entidade Assembleia (gap nº3 da Tese): inexistente → construída** com loop completo, local-first e gated.
3. **Separação jurídica opinião≠comunicado≠deliberação:** virou estrutura real, derivada e unificada (ORIGIN_BADGE eliminado).
4. **Wedge enquadrado:** a Assembleia passou de chip soterrado em "Memória" a **destaque no Início do síndico** (esta sprint).

---

## 4. Divergências (severidade · dono)

| Divergência | Sev. | Dono |
|---|---|---|
| Páginas legais publicadas (`/termos`, `/privacidade`) defasadas vs. minutas; sem aceite no onboarding; LIA/região pendentes | Alta | Jurídico / Lucas |
| Tese cita gate "ainda não confirmado"; já está **verde** (run #6) — atualizar a nota da Tese | Baixa | Notion |
| Multi-tenant descrito como fundação viva; em runtime ainda **dormente** (só dual-write gated) | Média | Código (decisão do Lucas) |
| "Perguntar" (nav central) aponta para KB jurídica genérica, não "Pergunte ao Prédio" | Média | Lucas (copy/produto) |

---

## 5. O que foi aprimorado nesta sprint (log)

**Fatia 1 — Destacar o wedge da Assembleia** (Eixo 2/3; commit `190caef`).
- *Por quê é alta alavancagem:* a Tese define a Assembleia como porta de entrada do produto
  ("não um módulo entre doze"); ela estava como 2ª chip dentro de "Memória". Trazê-la ao
  Início (superfície de maior atenção) fecha o maior gap de enquadramento, sem custo de dados.
- *O que entrou:* `lib/assembly-home.ts` (resumo derivado: preparar/convocar/deliberar/abrir
  conforme o estado da assembleia em foco) + 5 testes; `components/AssemblyHomeCard.tsx`;
  seção "Governança/Assembleia" no `HomeTab`; `focusedSection` no `MemoriaTab` para deep-link
  Início → Memória → Assembleias.
- *Invariantes:* aditivo e reversível; nav de 5 itens intacta; nenhum dado migrado; flag de
  exposição inalterada; `tsc` 0 · `vitest` 851 verdes + 4 gate skipados.

---

## 6. Decisões que dependem do Lucas (não-código)

1. **Plano de dados relacional em runtime** (gargalo dominante) — autorizar o desenho do
   plano deliberado de migração por módulo, com RLS + isolamento testado. Não "de passagem".
2. **Semântica do "Perguntar"** — manter como tira-dúvidas jurídico ou reposicionar quando
   houver "Pergunte ao Prédio" (IA sobre dados do condomínio).
3. **Jurídico de exposição** — publicar páginas legais vigentes + aceite no onboarding + LIA +
   confirmar região Supabase. Pré-requisito do portão Completo-Núcleo.
4. **Ligar `assemblies_remote_enabled`** — decisão exclusiva de rollout, pós-gate verde.

---

## 7. Riscos

- **Tratar maturidade técnica como autorização de exposição.** Só o julgamento do Lucas
  contra o portão Completo-Núcleo libera. Gate verde ≠ exposição.
- **Migração relacional big-bang.** 44+ componentes dependem de `session.ts`; a estratégia
  correta é dual-write por módulo (padrão já provado em agenda/assembleias), nunca de uma vez.
- **Camada social sem o jurídico fechado.** Conteúdo de morador = difamação/exposição; a
  separação de natureza já existe, mas moderação por denúncia e termos/aceite faltam.

---

## 8. Próxima ação única (recomendada)

**Desenhar (sem implementar) o plano de migração relacional do primeiro módulo de memória
(decisões ou timeline) com dual-write gated + teste de isolamento**, espelhando o padrão de
`assembliesRemote`/migration 007 já provado pelo gate. É o único caminho que move o gargalo
dominante (Eixo 1/5) e converte a fundação isolada em valor multi-persona real — mantendo a
Regra de Não-Exposição. Requer o OK do Lucas antes de qualquer código (decisão estrutural).

---

## 9. Revisão 2026-06-18 (pós-verificação) — início da Fase 2 (migração de Decisões)

**Estado verificado (HEAD `f45a4fb`):** `tsc` 0 · `vitest` 855 verdes + 4 do gate skipados ·
`build` Compiled successfully (`/` 188 kB) · gate de isolamento **verde** (run #9, `f45a4fb`,
GATE + Regressão OK, zero annotation de falha) · flags de exposição todas `false`.

**Confirmação do contexto vs. código:**
| Item | Status | Evidência |
|---|---|---|
| Separação de natureza nas 4 superfícies + timeline sem selo | ✅ | `lib/content-nature.ts:59-93`; `ContentNatureBadge.tsx:35`; MuralPanel/DecisionsPanel/ResidentHomeTab/AssembleiasPanel |
| Card do wedge no Início | ✅ | `lib/assembly-home.ts`; `components/AssemblyHomeCard.tsx`; `HomeTab` seção "Governança" |
| `Decision.visibility?` default `gestao`, aditivo/inerte | ✅ | `lib/decisions.ts:34,88-92` (opcional, normalizeDecision preenche `gestao`) |
| Multi-tenant relacional dormente em runtime (gargalo) | ✅ | só dual-write gated-off (`assembliesRemote`/`agendaRemote`); nenhum read relacional |
| Desenho rev.2 de Decisões aprovado | ✅ | `docs/desenho-migracao-relacional-decisoes-2026-06-18.md` |

**Divergência detectada e resolvida nesta sessão:** a paridade local fez `Decision.visibility`
**obrigatório**, quebrando `tsc` (`DecisionsPanel` FormState + seeds de `demo-data`). Corrigido
para **opcional** (`visibility?:`), fiel ao desenho rev.2 (`lib/decisions.ts:34`). Severidade:
média; dono: código. **Fechada.**

**Gargalo dominante (reafirmado):** plano de dados local-first; multi-tenant provado isolado mas
não consumido. **Único bloqueio do Lucas:** **PF→PJ** — trava só o rollout (D6, ligar remoto),
não o código gated-off (D1–D5). Região (`sa-east-1`), visibilidade (gestão/conselho) e
"sync segue a auth" já decididos.

### Log da Fase 2 — migração relacional de Decisões (gated-off)
| Fatia | Entrega | Commit | Gate / testes |
|---|---|---|---|
| **D1** | `supabase/migrations/008_decisions.sql` (tabela + `visibility` + RLS **leitura gestão/conselho** + GRANTs) + 5 casos no teste de isolamento (isolamento entre condomínios **e** residente NÃO lê/escreve) | `534a8bb` | **gate VERDE** (run sobre `534a8bb`: migration aplicada, GATE OK com os 9 casos, Regressão OK, zero falha) |
| **D2** | `lib/tenant/decisionsRemote.ts` (dual-write PUSH best-effort, anon+RLS) + flag `decisions_remote_enabled` (default **false**) + dual-write nos 3 pontos do CRUD | `7261ec2` | tsc 0 · 860 verdes |
| **D3** | `lib/tenant/decisionsMerge.ts` (last-write-wins por `updatedAt`, sem tombstones) + 5 testes | `80b4d3d` | tsc 0 · merge testado |
| **D4** | `lib/tenant/decisionsSync.ts` (`pullRemoteDecisions`: pull→merge→store local; NO-OP total com flag off/anônimo/sem condomínio) + 2 testes de no-op | `407d1b0` | tsc 0 · 862 verdes |
| **D4-wiring** | fiar `pullRemoteDecisions()` no fluxo de sync/auth (ponto de gatilho) | ⏸️ **pausado** | shared-flow; ver abaixo |
| **D6** | ligar `decisions_remote_enabled` em produção | ⛔ **bloqueado** | PF→PJ (decisão do Lucas) |

**Estado:** D1–D4 entregues, **gated-off e reversíveis**. Com `decisions_remote_enabled` false
(default), o comportamento é **byte-a-byte idêntico** ao atual — zero rede, zero leitura remota.
A RLS de Decisões está **provada contra DB real** (residente não lê dado sensível; isolamento
entre condomínios). Flags de exposição **inalteradas**; produção **intocada**.

**Por que D4-wiring está pausado (não é trivialidade):** o cutover de leitura precisa de um
**ponto de gatilho no fluxo de sync/auth** (`lib/auth/AuthContext.tsx` / `lib/sync/autoSync.ts`)
— uma área de **fluxo compartilhado**. O padrão já provado (assemblies/agenda) fez **apenas o
PUSH** e deixou o read-pull **não fiado**; não há precedente do ponto de gatilho. A função
`pullRemoteDecisions` está pronta e gated; fiá-la muda orquestração compartilhada sem entregar
valor enquanto a flag está off. **Recomendação:** confirmar o ponto de gatilho com o Lucas (ou
fazer junto do read-cutover de Assembleias/Agenda, unificando o seam) antes de fiar. Decisão de
fluxo, não estrutural-nova — mas é o lugar certo para um checkpoint, por "segurança máxima".
