# Relatório — Sprint de Racionalização + Evolução (Amigo do Prédio)

**Data:** 2026-06-18 · **Branch:** `sprint-6.1-lapidacao-premium`
**Missão:** de "dois produtos densos fundidos" → UM produto coerente (segundo cérebro + rede
social), matando duplicação, com segurança máxima. Guiado pelo loop
informar→discutir→organizar→decidir→lembrar e pelo anti-posicionamento (não competir com
administradora em boleto/folha/financeiro).

---

## Fase 0 — Diagnóstico confirmado no código (arquivo:linha)

**Baseline:** `tsc` 0 · `vitest` 862 verdes + 9 do gate skipados · build conclui · gate de
isolamento verde · flags de exposição todas `false`. HEAD `8e9ea07` (limpo).

**Duplicação confirmada:**
| Conceito | Onde aparece (duplicado) | Fonte única alvo |
|---|---|---|
| Decisões (registro) | `MemoriaTab` (canônico) + `CondominioTab` Seção 4 "memoria-institucional" | Memória |
| "Decisões do síndico" (Q&A) | `DecisoesSindicoPanel` em `ToolsTab` — **nome colidente** com o registro | renomeado (W1.3) |
| Documentos | `DocumentosEssenciaisPanel` (essenciais) + `community/PublicDocumentsPanel` (públicos) + `CondominioTab` Seção 6 | sistema unificado por `visibility` (W1.1) |
| Linha do tempo | `MemoriaTab` + `community/TimelinePanel` + `TimelineOperacional` (Seção 7) | uma fonte com filtros (W1.2) |
| Revisão mensal | cards no Início + 3 painéis na Seção 3 ("Mais") | motor "Hoje" único (W2) |

**Mapa de dependências crítico (confirma invariante):**
- `lib/financial*` é consumido por **~18 módulos de lib** — `health-score`, `command-center`,
  `daily-briefing`, `guidance-engine`, `condominio-overview`, `operational-summary`,
  `institutional-report`, `monthly-plan/review`, `ago-report`, `financial-chart/intelligence`,
  `local-integrity/validation`, `session`. **W3 deve esvaziar só a UI e preservar/adaptar as
  libs** — removê-las quebraria Saúde/Briefing/Guidance.
- `memoria-institucional` (deep-link da Seção 4) tem **7+ consumidores** (`CondominioQuickNav`,
  `HomeFeatureShortcuts`, `InstitutionalMemoryCard`, `ManagerCockpitHero`, `MonthlyPlanCard`,
  `global-search`, `visibility-guards`). **Remover a Seção 4 (W1.4) entrelaça com a navegação**
  → vai junto/depois do checkpoint W4.

---

## Sequência de fatias (com pontos de checkpoint)

| # | Workstream | Dep. de navegação? | Estado |
|---|---|---|---|
| W1.3 | Decisões: matar colisão de nome (`DecisoesSindicoPanel`→"Guia de situações") | não | ✅ `0bf7104` |
| **W4** | **Navegação (promover Comunidade, dissolver "Mais"→"Ajustes")** | — | ⏸️ **CHECKPOINT (aguarda Lucas)** |
| W1.1 | Documentos unificados por `visibility` + migração sem perda | sim (superfície) | após W4 |
| W1.2 | Linha do tempo unificada (uma fonte, filtros) | sim (superfície) | após W4 |
| W1.4 | Remover de "Mais" o que tem casa dedicada (redireciona deep-links) | sim | após W4 |
| W2 | Motor "Hoje" único (funde Briefing/Guidance/Revisão×3/Plano/Command Center) | parcial | após W4 |
| W3 | Financeiro→Transparência (esvaziar UI, preservar libs; doc por papel) | sim | após W4 |
| W5 | Profundidade do Morador (camada social por view mode) | sim | após W4 |
| W6 | Seam de contexto p/ "Pergunte ao Prédio" (sem IA externa) | não | após W1 |

**Por que W4 antes do grosso de W1/W3/W5:** a navegação é a peça-chave — define ONDE as
superfícies unificadas (documentos, timeline, transparência, comunidade) vão morar. Construir as
unificações antes do destino arriscaria retrabalho nos 7+ deep-links. Por isso o checkpoint de
navegação é o próximo passo, e o resto sequencia a partir dele.

---

## Log de execução

### W1.3 — Decisões: colisão de nome resolvida (`0bf7104`)
- `DecisoesSindicoPanel` (playbook de situações Q&A, "N situações — críticas") usava o rótulo
  "Decisões do síndico", colidindo com o registro real de Decisões. **Renomeado para "Guia de
  situações"** (`DecisoesSindicoPanel.tsx:395,412`). Corrigida a referência cruzada defasada em
  `Response.tsx:751,755` (apontava "aba Condomínio"; agora "Ferramentas → Explorar por tema").
- **Mudança de copy registrada:** "Decisões do síndico" / "Biblioteca de decisões" → "Guia de
  situações". Prosa do KB (`knowledge.json`) **intocada** (é linguagem natural, não rótulo).
- Só coerência: sem lógica, sem dado, sem navegação. `tsc` 0 · 862 verdes.

---

## Placar de alinhamento (parcial — atualiza ao longo do sprint)
| Eixo | Antes | Agora | Nota |
|---|---|---|---|
| 3 — Apple-like (coerência de vocabulário) | ~78% | **~79%** | uma colisão de nome a menos; resto pós-W4 |
| 2 Tese · 4 Personas · 1 · 5 | = | = | movem com W1.1/W2/W3/W5 (pós-checkpoint) |

**Próxima ação única:** decisão de **layout da barra (W4)** — ver checkpoint no chat.
