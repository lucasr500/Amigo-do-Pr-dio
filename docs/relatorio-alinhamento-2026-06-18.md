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
