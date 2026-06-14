# Índice de Documentação — Amigo do Prédio

> **Responde a "onde estamos?" e "qual documento vale?".**
> Criado em 2026-06-14 no realinhamento à nova direção (SaaS multi-tenant + multi-persona).

---

## 1. Hierarquia de fontes (qual vence quando divergem)

1. **Notion — fonte canônica de objetivos.** Página "🏢 Amigo do Prédio — Central de
   Inteligência" + base "AdP — Backlog de Produto". Quando repositório e Notion
   divergirem, **o Notion vence**.
2. **`docs/roadmap-pre-lancamento.md`** — direção de produto, Regra de Não-Exposição e
   **Definição de Pronto**. É a execução dos objetivos do Notion.
3. **`docs/multi-tenant-roadmap.md`** — roadmap técnico canônico do SaaS (Sprints 7–10).
4. **`docs/ia-assistente.md`** — fonte única sobre IA no Assistente.
5. **Git (`git log`)** — registro real de execução, por Sprint.

---

## 2. Os dois sistemas de numeração (Fases × Sprints)

Existem **dois** sistemas que rodaram em paralelo. **Não há mapa 1:1 entre eles** — não
invente correspondência.

| Sistema | Onde vive | Faixa | O que é |
|---|---|---|---|
| **Fases** | `docs/*.md` (nomes e títulos) | ~5 a ~90 | Numeração de desenvolvimento/documentação interna. Granular, não-sequencial (há saltos: 48→57→67…). |
| **Sprints** | Mensagens de commit (`git log`) | 4.0 a 6.2 | Numeração de execução por entrega. É o registro real do que foi commitado. |

**Por que divergem:** as "Fases" contavam passos de trabalho e documentos; os "Sprints"
contavam entregas no git. Uma Sprint pode conter várias Fases, e algumas Fases foram só
documentais (sem commit próprio).

**Regra daqui pra frente:** usar **Sprint** (git) como numeração oficial de execução. O
roadmap técnico (`multi-tenant-roadmap.md`) já segue Sprints (próximas: 7–10). As "Fases"
ficam como histórico nos documentos antigos — não criar Fases novas.

### Sprints registrados no git (execução real)
`6.2` acessibilidade/estados premium · `6.1` lapidação premium · `6.0` **fundação SaaS
multi-tenant** · `5.9–5.6` hardening local/UX · `5.5–5.4` sync + cloud backup · `5.2`
arquitetura apple-like/hubs · `5.1` canal do morador · `5.0` reservas/central digital ·
`4.9` mural oficial · `4.8–4.0` hubs/agenda/timeline/memória · sprints iniciais:
`SYNC-AND-AUTH-ACTIVATION`, evolução profunda, consolidação.

---

## 3. Inventário de documentos por finalidade

### 🧭 Direção (atual — vale para o futuro)
| Documento | Papel |
|---|---|
| `roadmap-pre-lancamento.md` | Direção de produto + Regra de Não-Exposição + Definição de Pronto |
| `multi-tenant-roadmap.md` | Roadmap técnico SaaS (Sprints 7–10) |
| `ia-assistente.md` | Fonte única sobre IA no Assistente |
| `supabase-backend-plan.md` | Backend snapshot single-user (parcialmente superado pelo multi-tenant) |

### 📜 Histórico de execução (preservado — não reescrever)
Relatórios e resultados por Fase: `resultado-*`, `relatorio-*`, `resultado-checklist-*`,
`resultado-matriz-maturidade-*`, `resultado-validacao-cenarios-*`, `teste-*`,
`cenarios-internos-*`, `lacunas-base-conhecimento-*`, `hardening-pre-beta-fase-35.md`,
`consolidacao-interna-sem-beta-fase-45.md`, `relatorio-tecnico-comercial-*`. São registro
do que foi feito sob a direção anterior.

### 🧩 Tese e posicionamento
| Documento | Nota |
|---|---|
| `tese-produto-copiloto-operacional.md` | Núcleo do síndico — válido, mas dentro do produto multi-persona agora |
| `tese-tempo-ate-alivio.md` | Princípio de UX (tempo até o alívio) |

### 📚 KB / Assistente determinístico
`guia-qualidade-editorial-kb.md`, `limites-motor-deterministico.md`,
`matriz-maturidade-fluxos.md`, `laboratorio-cenarios-sindico.md`,
`perguntas-teste-assistente-fase-29.md`.

### 🔒 Jurídico e privacidade
`rascunho-politica-privacidade.md`, `rascunho-termos-de-uso.md`,
`status-documentos-legais-fase-39.md`.

### 🛠️ Operação / setup
`setup-supabase-telemetria.md`, `status-supabase-telemetria-fase-39.md`,
`RELATORIO_AUTH_PRODUCAO.md`, `manual-interno-do-fundador.md`, `demo-script.md`,
`checklist-release-candidate-interno.md`, `smoke-test-interno.md`,
`protocolo-smoke-test-estados-do-usuario.md`.

### ⛔ SUPERSEDED (consolidados — manter só como histórico)
Consolidados em `ia-assistente.md`: `plano-futuro-ia-assistente.md`,
`plano-tecnico-ia-rag-fase-36.md`, `plano-ia-rag-futuro.md`,
`plano-futuro-ia-rag-contextual.md`, `preparacao-kb-para-rag.md`.

### 🗂️ Planos de beta (revisar à luz da Regra de Não-Exposição)
`plano-pre-beta-amigo-do-predio.md`, `plano-beta-futura.md`,
`plano-feedback-beta-futura.md`, `roadmap-pre-lancamento.md` (já realinhado).

---

## 4. Onde estamos (resumo de 1 parágrafo)

O produto é um PWA maduro com cockpit do síndico, Central Digital (mural, solicitações,
documentos, enquetes, reservas) e fundação SaaS multi-tenant já no código (login magic
link, sync de snapshots, migration 005 com papéis owner/manager/council/resident/viewer).
**Sprint atual: 6.2.** Próximo trabalho real: migrar dados de `localStorage` para o modelo
relacional por condomínio (Sprint 7+) e completar os fluxos das 4 personas até a Definição
de Pronto. **Sem exposição externa até o produto ser julgado completo.**

---

*Documento interno — Amigo do Prédio · 2026-06-14 · Fonte canônica: Notion.*
