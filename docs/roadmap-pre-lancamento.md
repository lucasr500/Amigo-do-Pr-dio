# Roadmap Pré-Lançamento — Amigo do Prédio

> **Critérios claros de "pronto para beta".**
> O produto está em fase de lapidação silenciosa. Este documento define o que
> precisa estar sólido antes de convidar os primeiros usuários externos.

---

## Critérios de beta

### Motor de respostas
- [x] Recall A (resposta direta): 100% — sem falso negativo nas perguntas diretas (Fase 33)
- [x] Sem falso positivo em categorias de alto risco (Fase 33: CNH bloqueada, LGPD, trabalhista ok)
- [x] Base de conhecimento: lacunas 1–4 preenchidas (Fase 32): advertência, desempate, documentação, Airbnb
- [x] Bloqueio de fora-do-escopo: 100% (4/4 casos de teste) — Fase 33
- [x] KB com guia de qualidade editorial (Fase 34): `docs/guia-qualidade-editorial-kb.md`
- [x] 5 novas lacunas editoriais resolvidas (Fase 34): emergência, subsíndico, multa inválida, dano vizinho, animal locatário
- [x] KB preparada para RAG futuro — documentação estrutural pronta (Fase 34)
- [ ] Recall geral ≥ 75% no painel /admin (projetado ~87% com AUDIT_CASES Fase 33 — verificar ao vivo)
- [ ] Confidence gap calibrado: < 20% de respostas borderline na auditoria

### Produto / experiência
- [x] Fluxo de onboarding completo funciona sem instrução: novo usuário → ativa monitoramento em < 3 min (Fase 35)
- [x] 4 abas navegáveis sem travamento ou estado inconsistente (Fase 35)
- [x] Backup exporta e importa sem perda de dados — bug crítico corrigido (Fase 35)
- [x] ComunicadoPanel gera e copia todos os 4 modelos sem erro (Fase 31)
- [x] ComunicadoPanel exibe hint quando perfil não tem nome do condomínio (Fase 32)
- [x] SimuladorMulta calcula corretamente para 1 e 12 meses (Fase 31)
- [x] SimuladorMulta não aceita cota negativa — clampado para 0 (Fase 32)
- [x] GuidancePanel mostra prioridades corretas com dados reais (Fase 35 — verificado)
- [x] CondominioStatusHeader reflete datas reais cadastradas (Fase 35 — verificado)
- [x] OnboardingProfile: perfil existente editável na aba Condomínio (Fase 35)
- [x] Hero: caminho para Assistente sem precisar cadastrar (Fase 35)

### Técnico
- [x] TypeScript: zero erros (`npx tsc --noEmit`) — confirmado Fase 35
- [x] Build: Compiled successfully sem warnings críticos — confirmado Fase 35
- [x] Sem crash ao navegar entre abas sem dados cadastrados (Fase 35 — verificado)
- [x] Sem crash ao importar backup inválido (Fase 35 — verificado)
- [ ] localStorage não excede limites típicos (< 200 KB de dados por usuário)
- [x] PWA instalável no Android e iOS — ícones criados (Fase 36): icon-192, icon-512, apple-touch-icon — verificar em dispositivo real

### Conteúdo legal
- [ ] Disclaimer jurídico visível e claro em toda resposta do Assistente
- [ ] Sem resposta que afirme "pode fazer X" sem mencionar que depende da convenção
- [ ] Dados sensíveis (LGPD, trabalhista, financeiro) com aviso de "consulte especialista"

---

## Fases de lançamento

### Fase Alpha (onde estamos)
- Fundador testa todas as funcionalidades
- Identifica bugs e inconsistências antes de qualquer usuário externo
- Sem pressão de feedback, sem compromisso de suporte
- Dura: até critérios de beta acima estarem todos verdes

### Fase Beta Fechada (próximo passo)
- 5–15 síndicos convidados manualmente
- Perfil: síndico voluntário, prédio residencial, São Paulo ou grande cidade
- Modo: uso real, sem roteiro, sem orientação (teste de naturalidade)
- Coleta: telemetria + entrevistas curtas após 2 semanas
- Critério de sucesso: pelo menos 3 síndicos voltam sem ser lembrados
- Duração: 4–6 semanas

### Fase Beta Aberta
- Landing page pública com formulário "quero testar"
- Lista de espera, convites em lotes
- Foco: volume de feedback, não viral
- Monitora: taxa de ativação (cadastra dados do prédio?), retenção D7, categorias de pergunta mais comuns
- Critério de sucesso: NPS > 40, retenção D7 > 25%

### Lançamento público
- Apenas quando produto for estável e monetização definida
- Foco inicial: síndicos voluntários (não administradoras)
- Canal: comunidades de síndicos no WhatsApp, grupos no Facebook, LinkedIn

- [x] Tese de copiloto operacional documentada (Fase 40): `docs/tese-produto-copiloto-operacional.md`
- [x] Reposicionamento de copy principal: Hero, Ferramentas, Assistente, Condomínio (Fase 40)
- [x] Campo de vencimento do mandato do síndico implementado (Fase 40): MemoriaPanel, GuidancePanel, StatusHeader, guidance.ts
- [x] Integração Assistente → Ferramentas aprimorada: CTAs de comunicado por categoria (Fase 40)
- [x] Onboarding reposicionado como "ativar monitoramento", não "preencher formulário" (Fase 40)
- [x] Seção "Próximas datas" na aba Início (Fase 41): `components/ProximasDatas.tsx` — vencimentos + rotinas calculadas, ordenados por urgência
- [x] PainelOperacional: "Explorar mais" renomeado para "Perguntar sobre" (Fase 41) — elimina confusão entre ferramenta e atalho de Assistente
- [x] Insight de mandato adicionado (Fase 41): `lib/insights.ts` — cobre janela 90–180 dias (pré-GuidancePanel)
- [x] Visão futura financeiro documentada (Fase 41): `docs/visao-futura-financeiro-demonstrativos.md` — demonstrativo da administradora, previsão orçamentária, reajuste de cota
- [x] **Fase 43 — Tempo até o alívio:** Hero reposicionado para "problema-primeiro" com chips situacionais; QuickAccessCards mostram perguntas situacionais; AskInput com placeholder situacional; "Próximo passo" explícito nas respostas do Assistente (10 categorias); CAT_TO_COMUNICADO expandido (responsabilidade, gestão); TOPICS examplePrompts atualizados para situações reais; Laboratório de 50+ cenários criado; Matriz de maturidade de 11 fluxos; Tese do tempo até o alívio documentada
- [x] **Fase 44 — Validação e lapidação cirúrgica:** 20 cenários validados internamente (média 3.85/5, zero falhas críticas); Hero chip 3 → "Querem expor inadimplente" (mais preciso), chip 5 → "Vazamento entre apts." (crise > procedimento); TOPICS lgpd e financeiro refinados; CAT_TO_NEXTACTION expandido para 15 categorias; CAT_TO_COMUNICADO expandido para 9 categorias (manutencao + financeiro); Documentos: resultado-validacao-cenarios-fase-44.md, resultado-matriz-maturidade-fase-44.md
- [x] **Fase 45 — Atualização estética completa:** Nova paleta Navy #234B63 / Cream #F7F1E8 / Terracotta #C97852; sistema de cores Tailwind atualizado (navy + terracotta + cream); sage eliminado de todos os componentes (18 arquivos); ícones PWA regenerados com novo design (dois volumes, fundo #234B63); Header, Hero, Response, GuidancePanel, DicaDoDia, OnboardingProfile, BackupPanel, ChecklistPanel, ComunicadoPanel, CondominioStatusHeader, ContextualInsight, FavoritesPanel, MemoriaPanel, PainelOperacional, ProximasDatas, QuickAccessCards, RevisaoMensal, SimuladorReajusteCota, TimelineOperacional — todos atualizados; PWA theme-color #234B63; apple statusBarStyle → black-translucent; build 222 kB
- [x] **Fase 46 — Maturação interna (sem beta):** MemoriaPanel progressivo — seção "Essenciais" (AVCB/Seguro/Mandato) com dots de progresso (X/3), collapsed state com subtítulos contextuais por nível (0/parcial/completo+rotinas), abertura inteligente, intro text focada nas 3 essenciais; Response reorganizada — "Próximo passo" movido para primeiro card (antes da base legal), sempre visível quando disponível para a categoria (removido `!entry.dica`), destaque visual reforçado. Premissa registrada: `docs/consolidacao-interna-sem-beta-fase-45.md` — sem beta, sem síndicos, sem exposição externa.
- [x] **Fase 47 — Coerência visual e percepção premium:** Hero copy atualizado para nomear AVCB, seguro e mandato antes do cadastro; MemoriaPanel título corrigido (consistência colapsado ↔ expandido); AskInput submit alinhado à cor primária navy-700; auditoria de terracota confirmou uso semanticamente correto em todos os componentes (urgência/ação); identidade BrandMark + bg-body + BottomNav validados. Bundle 223 kB. Sem beta, sem síndicos.
- [x] **Fase 48 — Validação técnica silenciosa:** PWA manifest auditado e corrigido (`short_name` 16→12 chars para evitar truncamento Android); telemetria auditada — zero PII estrutural, exceção documentada (`q:` truncado nos eventos de query); todos os arquivos PWA validados (manifest, layout, icons, safe-area, maskable, theme_color); Supabase documentado como próximo passo manual (guia completo em `docs/setup-supabase-telemetria.md`); auditoria /admin documentada como ação do fundador (recall esperado 87%). Bundle 223 kB. Sem beta, sem síndicos.
- [x] **Fase 50 — Utilidade recorrente — Próximos passos:** sistema leve de pendências do síndico implementado; `Pendencia` type + 5 funções em `lib/session.ts` (chave `amigo_pendencias`, máx 50 registros, fora do backup v1); `PendenciasCard` novo componente na aba Início (sempre visível, lista até 5 abertas, conclusão circular, adição manual inline, estado vazio informativo); botão "Salvar nos próximos passos" em Response integrado ao bloco "Próximo passo" com feedback "Salvo ✓" por resposta; prop `onSavePendencia` opcional — zero breaking change. Bundle 224 kB (+1 kB). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 49 — Privacidade da telemetria e ativação segura:** query bruta (`q: q.slice(0,80)`) removida dos eventos `query_submitted` e `query_fallback` — substituída por campos estruturais sem PII: `matched_id`, `categoria`, `score`, `query_length` (submitted) e `detected_category`, `score`, `blocked_by_domain`, `query_length` (fallback); `/admin` `aggregateRemote()` adaptado para novos campos sem quebrar dados locais; `source: "local" | "remote"` adicionado ao tipo `Aggregated` com rótulos diferenciados na UI; documentação de privacidade criada no manual com inventário completo de campos coletados e evitados; telemetria pronta para ativação segura. Bundle 223 kB. Sem beta, sem síndicos.

---

## O que NÃO fazer antes do beta

- Não investir em marketing/SEO antes de ter produto sólido
- Não construir backend/login antes de validar retenção
- Não implementar LLM antes de atingir critérios do plano-ia-rag-futuro.md
- Não monetizar antes de ter ≥ 50 usuários ativos regulares
- Não publicar na App Store antes de ter feedback beta
- Não construir para administradoras antes de validar para síndicos individuais

---

## Sequência de trabalho recomendada (próximas semanas)

### Semana 1–2 (agora)
1. Rodar auditoria em /admin — identificar recall real
2. Preencher lacunas de alta prioridade (5 entradas na KB)
3. Testar fluxo completo sem dados: novo dispositivo → onboarding → consulta
4. Testar backup export/import

### Semana 3–4
1. Refinamento de copy e microcopy
2. Identificar e convidar 5 primeiros beta testers
3. Criar canal de feedback (WhatsApp direto ou Notion form)

### Semana 5–6
1. Coletar feedback dos primeiros 5 usuários
2. Ajustar com base no feedback real
3. Expandir para 15 usuários se os primeiros 5 forem positivos

---

## Métricas de acompanhamento (pós-beta)

| Métrica | Alvo beta | Alvo lançamento |
|---|---|---|
| Ativação (onboarding completo) | > 60% | > 75% |
| Retenção D3 | > 30% | > 40% |
| Retenção D7 | > 20% | > 30% |
| Recall do assistente | > 75% | > 85% |
| Fallback rate | < 40% | < 25% |
| NPS | > 30 | > 50 |

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-18 (Fase 50)*
*Atualizar conforme marcos forem atingidos.*
