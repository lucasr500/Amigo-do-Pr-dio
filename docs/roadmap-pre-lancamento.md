# Roadmap De Maturação Interna — Amigo do Prédio

> **Critérios claros de prontidão operacional interna.**
> O produto está em fase de lapidação silenciosa. Este documento define o que
> precisa estar sólido antes de qualquer exposição externa.

---

## Critérios internos

### Motor de respostas
- [x] Recall A (resposta direta): 100% — sem falso negativo nas perguntas diretas (Fase 33)
- [x] Sem falso positivo em categorias de alto risco (Fase 33: CNH bloqueada, LGPD, trabalhista ok)
- [x] Base de conhecimento: lacunas 1–4 preenchidas (Fase 32): advertência, desempate, documentação, Airbnb
- [x] Bloqueio de fora-do-escopo: 100% (4/4 casos de teste) — Fase 33
- [x] KB com guia de qualidade editorial (Fase 34): `docs/guia-qualidade-editorial-kb.md`
- [x] 5 novas lacunas editoriais resolvidas (Fase 34): emergência, subsíndico, multa inválida, dano vizinho, animal locatário
- [x] KB preparada para RAG futuro — documentação estrutural pronta (Fase 34)
- [ ] Recall geral ≥ 75% no painel /admin (projetado ~87% com AUDIT_CASES Fase 33 — verificar ao vivo)
- [x] Confidence gap calibrado: < 20% de respostas borderline na auditoria — 11/83 = 13,3% (Fase 57 — confirmado offline)

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
- [x] localStorage não excede limites típicos — `getStorageSizeKB()` implementado; indicador visível no BackupPanel (Fase 51)
- [x] PWA instalável no Android e iOS — ícones criados (Fase 36): icon-192, icon-512, apple-touch-icon — verificar em dispositivo real

### Conteúdo legal
- [x] Disclaimer jurídico visível e claro em toda resposta do Assistente
- [x] Sem resposta que afirme "pode fazer X" sem mencionar que depende da convenção — auditoria editorial concluída (Fase 57): 316 entradas varridas, 3 corrigidas (`autorizacao-obras`, `vaga-uso-comum-preferencia`, `coleta-seletiva-condominio`)
- [x] Dados sensíveis (LGPD, trabalhista, financeiro) com aviso de "consulte especialista" — Fase 53: `SENSITIVE_CATEGORY_NOTICE` em `Response.tsx`

---

## Foco atual de maturação interna

### Fase interna (onde estamos)
- Fundador testa todas as funcionalidades
- Identifica bugs e inconsistências antes de qualquer usuário externo
- Sem pressão de feedback, sem compromisso de suporte
- Dura até os critérios internos acima estarem verificados ao vivo
- Produto segue pré-beta interno: ainda não vendável, sem teste com síndicos por enquanto, sem tráfego pago e sem exposição comercial.
- Features seguem congeladas fora de entregas pequenas e justificadas. Próximas fases devem elevar confiança, observabilidade e clareza operacional sem IA, login, billing ou backend completo.

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
- [x] **Fase 67 — Primeiros 10 Segundos + Calibração de Urgência:** Hero com subtitle "Monitora prazos do prédio e orienta em situações críticas." e chips reduzidos de 5 para 3 (barulho, inadimplente, vazamento) — GuidancePreview visível sem scroll em iPhones menores; 6 rotinas operacionais atrasadas rebaixadas de `"critico"` para `"atencao"` no `guidance.ts` (dedet, caixa, elevador, extintores, SPDA, elétrica) com urgencyLabel mais preciso — AVCB/seguro/mandato/AGO permanecem `"critico"`; `PendenciasCard` com indicador "+N ocultos" quando há mais de 5 pendências abertas; `HomeResumoPredio` exibe "Confira os alertas acima para os detalhes." em vez de repetir o urgencyLabel do GuidancePanel. Bundle 225 kB. TypeScript zero erros. Zero feature nova.
- [x] **Fase 70 — Maturidade comercial percebida sem overbuilding:** microcopy curta em Próximos Passos, Revisão Mensal, Timeline, Backup e Assistente para reforçar o ciclo dúvida → ação → acompanhamento → histórico, limites informativos e dados locais enquanto não há login. Documentação atualizada para registrar produto pré-beta interno, não vendável, sem teste com síndicos por enquanto, features congeladas e Supabase apenas como telemetria opcional. Sem IA, login, billing, backend completo, nova feature, nova aba, KB, guidance ou schema.
- [x] **Fase 71 — Rotina viva do síndico:** registro rápido de ocorrências leves com dados locais, próximo passo opcional com `origem: "ocorrencia"`, mensagem administrativa copiável e determinística, Timeline alimentada por ocorrências sem descrição livre e backup v3 com compatibilidade v1/v2. Supabase continua apenas como telemetria opcional e recebe somente tipo/flags agregadas, nunca descrição, unidade/local, nomes, texto da mensagem ou datas reais. Revisão semanal, assembleia leve, biblioteca de decisões e score operacional ficam como hipóteses futuras.
- [x] **Fase 73 — Home enxuta, Saúde Operacional e Central de Ações:** reorganização da arquitetura de informação sem feature nova. Hub "Saúde operacional" em `HomeResumoPredio` com 5 status qualitativos (Crítico/Atenção/Em evolução/Bem acompanhado/Tudo em ordem) baseados em sinais locais — sem score, porcentagem ou linguagem jurídica. Hub posicionado antes do GuidancePanel: identidade → saúde → prioridades. `CondominioStatusHeader` simplificado: removidas linhas de alerta/atenção por item (já no GuidancePanel); mantidos nome + badge + "X itens em dia". `RegistroRapido` movido da Home para Ferramentas (grupo "Rotina do síndico"); atalho discreto "+ Registrar ocorrência" permanece na Home. Ferramentas organizadas em 4 grupos visuais: Rotina do síndico / Comunicados / Simuladores / Checklists. Aba Condomínio renomeada "Dados do prédio" com subtitle "Dados que alimentam o monitoramento." Bundle 225 kB (−1 kB vs Fase 72). Margem 5 kB. TypeScript zero erros. Sem IA, login, billing, backend, nova aba, KB, guidance, backup ou motor de busca.
- [x] **Fase 72 — Revisão semanal compacta:** card "Revisão rápida da semana" condicional e discreto para revisar ocorrências, próximos passos, pendências antigas, alertas ativos e revisão mensal disponível. Estado local efêmero (`amigo_revisao_semanal`) fica fora do backup; não há backup v4. Conclusão alimenta Timeline apenas com "Revisão semanal concluída". Telemetria sem PII (`weekly_review_viewed`, `weekly_review_completed`) usa somente `week_key`, contagens e booleanos. Sem IA, login, billing, backend, WhatsApp, nova aba, calendário, filtros ou push.
- [x] **Fase 66 — Validação Mobile, Densidade da Home e Controle de Bundle:** `ContextualInsight` convertido para `dynamic()` → `lib/insights.ts` sai do chunk inicial; bundle / cai de 226 para 225 kB; `DicaDoDia` oculta no estado sem dados para preservar foco do onboarding em `GuidancePreview` + CTA de cadastro; auditoria completa da Home por 5 cenários (sem dados, dados em dia, 1 alerta crítico, muitas manutenções, vários próximos passos); análise do GuidancePanel pós-Fase 65 (linguagem de rotinas, alarmismo, ROTINA_DISCLAIMER); análise do assistente contextual (bloco "Contexto do prédio"). Zero feature nova. Bundle 225 kB. TypeScript zero erros.
- [x] **Fase 64 — Assistente contextual sem IA + preparação para IA futura:** `Response` passa a exibir um aviso discreto "Contexto do prédio" quando a orientação combina com dados locais já existentes na MemoriaOperacional (seguro, AVCB, mandato/assembleia e manutenção); sem dado local, a resposta permanece igual. Sugestões hardcoded por categoria usam o `onSuggestionSelect` existente, sem busca nova, conversa persistente ou scoring novo. `HistoryPanel` ganhou microcopy "Perguntas recentes" / "Retome uma dúvida anterior." Telemetria sem PII: `local_context_notice_shown` envia apenas categoria, tipo de contexto e booleano de memória. Documento `docs/plano-futuro-ia-rag-contextual.md` criado para delimitar IA/RAG futura como fallback ancorado na KB, não substituto do produto. Bundle 226 kB. Sem IA, RAG, API externa, backend, schema, KB, motor de busca ou biblioteca.
- [x] **Fase 63 — Home Cockpit + atualização manual:** novo bloco `HomeResumoPredio` ("Hoje no prédio") na Home com dados, usando apenas estado local para resumir pendências abertas, ações concluídas no mês, status operacional e próxima atenção via guidance; hierarquia ajustada para Status/Header → GuidancePanel → Hoje no prédio → Próximos passos → Revisão Mensal → Próximas datas → Contextual/Dica; controle discreto "Atualizado agora" + "Atualizar" incrementa `refreshKey` e re-lê dados locais, sem fetch externo/Supabase/escrita; pull-to-refresh não implementado por risco desnecessário no iOS PWA; telemetria sem PII (`home_summary_viewed`, `home_refreshed_manual`). Bundle 225 kB. Sem backend, IA, nova aba, calendário, gráfico, KB, motor de busca ou biblioteca.
- [x] **Fase 61 — Ritual Mensal + prova de valor acumulado:** `RevisaoMensalCard` da Home enriquecido com "Este mês no prédio" (próximos passos concluídos no mês, pendências abertas, alertas de guidance acompanhados); regra de exibição: oculto sem memória operacional, visível com dados quando a revisão ainda não foi concluída no mês e estamos entre dias 1–7 ou o card ainda não foi aberto/visto no mês; controle local mínimo `amigo_revisao_mensal_home` (`seenMonthKey`, `openCount`) sem backup/schema operacional; CTA "Fazer revisão" navega para aba Condomínio e rola até `#revisao-mensal`; `RevisaoMensal` ganhou "O que foi resolvido neste mês" com até 4 pendências concluídas; telemetria sem PII (`revisao_mensal_progress_viewed` + contagens seguras); `ProximasDatas` não alterado para evitar refactor visual. Bundle 224 kB. Sem backend, IA, nova aba, calendário, notificações, KB ou bibliotecas.
- [x] **Fase 60 — Ritual Mensal na Home:** `RevisaoMensalCard.tsx` (novo) surfacea a Revisão Mensal na aba Início de forma discreta — exibe-se apenas quando há dados de memória operacional e a revisão não foi concluída no mês calendário atual; lê `lastRevisaoMensalAt` de `getSessionMeta()` após hidratação, reavalia a cada `refreshKey`, desaparece automaticamente após `recordRevisaoMensal()`; CTA "Fazer revisão" navega para aba Condomínio (sem rota nova, sem modal obrigatório); posição: após `PendenciasCard`, antes de `DicaDoDia` — GuidancePanel crítico permanece prioritário; oculto no estado sem dados para não diluir onboarding; +2 eventos de telemetria sem PII (`revisao_mensal_surface_seen`, `revisao_mensal_opened_from_home`). Bundle 223 kB (sem variação). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 60 — Higiene documental mínima:** comentário de setup em `lib/telemetry.ts` alinhado ao guia Supabase atual (`read_anon TO anon`); README atualizado para estado real do produto (PWA mobile-first, Next.js 14, TypeScript, Tailwind, localStorage, sem backend completo/login/billing, telemetria opcional privacy-safe, paleta atual, limite 230 kB); `docs/setup-supabase-telemetria.md` neutralizado para "uso externo" / "exposição externa". Zero alteração funcional. Sem beta, sem síndicos.
- [x] **Fase 59 — Integração segura dos ciclos GuidancePanel ↔ Próximos Passos:** resolver item no GuidancePanel (`commitResolution`) agora conclui automaticamente a pendência aberta com `origem: "guidance"` e `matchedId` correspondente, quando existir — sem marcar datas como renovadas sem novo valor real; evento `pendencia_completed_from_guidance_resolution` com `{ guidance_id, priority }` (zero PII); concluir pendência de `origem: "guidance"` no `PendenciasCard` exibe mensagem discreta de 5 s: "Concluído. Se isso envolvia vencimento, atualize a data no monitoramento." — sem modal, sem fluxo obrigatório, sem abrir MemoriaPanel automaticamente; destaque temporal discreto em pendências abertas há mais de 14 dias ("Aberto há mais de 14 dias") calculado por `createdAt`, sem `dueDate`, sem prazo editável, sem alarme. Bundle 223 kB (sem variação). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 58 — Cold Start & Preview de Valor:** estado sem dados da Home redesenhado para demonstrar o valor do monitoramento antes do cadastro; novo componente `GuidancePreview.tsx` (estático, sem localStorage, sem interferência no GuidancePanel real) com 2 itens mockados (AVCB vence em 23 dias + Mandato termina em 68 dias), badge "Exemplo" e CTA "Cadastrar as 3 datas"; Hero com copy atualizado ("Em 2 minutos o monitoramento está ativo"); `PendenciasCard` empty state re-escrito para ensinar o loop Assistente → próximo passo → acompanhamento; `MemoriaPanel` intro note atualizada para incluir orientação "Não sabe agora? Use lembrar depois". Bundle 223 kB (+1 kB). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 57 — Auditoria editorial da KB (fechar critérios de conteúdo legal):** 316 entradas varridas com análise de padrões assertivos (`pode fazer X`, `é obrigado`, `tem direito a Y`); 3 entradas corrigidas — `autorizacao-obras` (documentos exigíveis dependem da convenção/regimento), `coleta-seletiva-condominio` (exigências específicas variam por legislação municipal), `vaga-uso-comum-preferencia` (locação requer aprovação em assembleia; "direito de preferência legal" suavizado). 25 entradas avaliadas e mantidas — assertivas baseadas em estatuto legal direto (CLT, CC, CPC, NR-10). Confidence gap: 11/83 = 13,3% (< 20%). Recall A: 100%. FAIL: 0. Build 222 kB. TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 56 — Ativação segura do Supabase (docs e validação):** `docs/setup-supabase-telemetria.md` corrigido — bug RLS `TO authenticated` → `TO anon` (o `/admin` usa anon key via `fetchRecentEvents()`; sem correção, painel nunca leria dados remotos); referências ao campo `q` removidas das queries SQL (eliminado na Fase 49); +7 eventos novos documentados (pendências, backup_imported, session_duration); checklist de ativação 9 passos criado; SQL de diagnóstico expandido (+pendências por origem, taxa de conclusão). Auditoria offline confirmada: 87% recall (72/83 PASS, 0 FAIL), Recall A 100%, Bloqueio C 100% — motor estável. TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 55 — Onboarding sem bloqueio: "Não sei agora — lembrar depois":** botão discreto abaixo do input de cada campo essencial vazio (AVCB, Seguro, Mandato) no MemoriaPanel; cria pendência com `origem: "memoria"`, título específico por campo, `categoria: "gestao"`, `matchedId: fieldKey`; deduplicação via `getPendenciasAbertas()` filtrado por `origem + matchedId`, inicializado no `useEffect` de mount; feedback "Lembrete salvo ✓" inline; evento `pendencia_created_from_memoria` com `{ field }` — zero PII; `"memoria"` adicionado ao union `Pendencia.origem` em `session.ts`; ajuste opcional de títulos do GuidancePanel via `GUIDANCE_TITULO_OVERRIDE` (5 verbos de ação mais precisos). Bundle 222 kB (sem variação). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 54 — Conexão GuidancePanel → Próximos passos:** botão "Salvar nos próximos passos" no painel de ações de cada item do GuidancePanel (critico e atencao); título gerado deterministicamente (`Renovar X` para type expiry, `X` para type done); `origem: "guidance"`, `matchedId: item.id`; deduplicação por `getPendenciasAbertas()` filtrado por `origem + matchedId` — inicializado no `useEffect([refreshKey])`; `onPendenciaSaved` callback propaga `setRefreshKey` para atualizar PendenciasCard imediatamente; feedback inline "Salvo ✓" por item; evento `pendencia_created_from_guidance` com `{ guidance_id, priority }` — zero PII; bundle 222 kB (sem variação). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 53 — Disclaimers jurídicos inline nas categorias sensíveis:** `SENSITIVE_CATEGORY_NOTICE` adicionado em `Response.tsx` — aviso específico para lgpd, trabalhista e financeiro; aparece antes do disclaimer geral, após os blocos contextuais; visual discreto (bg-navy-50/50, text-navy-500, InfoIcon navy-500); zero impacto em bundle (222 kB); zero novos arquivos ou dependências; fecha 2 dos 3 critérios de "Conteúdo legal" do roadmap. TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 52 — Estabilização técnica e performance:** `MemoriaPanel` e `OnboardingProfile` convertidos para `dynamic()` (aba Condomínio — padrão consistente com demais componentes lazy da aba); função morta `toolHighlight` removida de `page.tsx`; bundle de 225 kB → 222 kB (−3 kB, margem 8 kB); fluxos Assistente→Pendências→Home→Timeline validados; telemetria de pendências auditada — zero PII; botão Voltar validado. Fase de estabilização: zero features novas. TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 51 — Consolidação segura da camada "Próximos passos":** backup v2 com `pendencias` incluso no export/import; compatibilidade total com backups v1 antigos (campo ausente → ignorado silenciosamente); `getStorageSizeKB()` + indicador discreto "~X KB" no BackupPanel (fecha critério roadmap); 3 eventos de telemetria sem PII (`pendencia_created_manual`, `pendencia_created_from_response`, `pendencia_completed`); pendências concluídas aparecem na TimelineOperacional como `tipo: "pendencia"`; botão "Voltar ←" no topo do Assistente quando há resposta ativa — restaura pergunta no input, não duplica ActionPills existentes, não altera arquitetura. Bundle 225 kB (+1 kB). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 50 — Utilidade recorrente — Próximos passos:** sistema leve de pendências do síndico implementado; `Pendencia` type + 5 funções em `lib/session.ts` (chave `amigo_pendencias`, máx 50 registros, fora do backup v1); `PendenciasCard` novo componente na aba Início (sempre visível, lista até 5 abertas, conclusão circular, adição manual inline, estado vazio informativo); botão "Salvar nos próximos passos" em Response integrado ao bloco "Próximo passo" com feedback "Salvo ✓" por resposta; prop `onSavePendencia` opcional — zero breaking change. Bundle 224 kB (+1 kB). TypeScript zero erros. Sem beta, sem síndicos.
- [x] **Fase 49 — Privacidade da telemetria e ativação segura:** query bruta (`q: q.slice(0,80)`) removida dos eventos `query_submitted` e `query_fallback` — substituída por campos estruturais sem PII: `matched_id`, `categoria`, `score`, `query_length` (submitted) e `detected_category`, `score`, `blocked_by_domain`, `query_length` (fallback); `/admin` `aggregateRemote()` adaptado para novos campos sem quebrar dados locais; `source: "local" | "remote"` adicionado ao tipo `Aggregated` com rótulos diferenciados na UI; documentação de privacidade criada no manual com inventário completo de campos coletados e evitados; telemetria pronta para ativação segura. Bundle 223 kB. Sem beta, sem síndicos.

---

## O que NÃO fazer nesta fase interna

- Não investir em marketing/SEO antes de ter produto sólido
- Não construir backend/login
- Não implementar LLM
- Não monetizar
- Não publicar na App Store
- Não construir para administradoras
- Não iniciar exposição externa
- Não testar com síndicos enquanto o fundador ainda não tiver concluído smoke tests internos e observado uso próprio recorrente
- Não criar planos, preços, paywall ou promessa comercial de venda

---

## Sequência de trabalho recomendada (próximas semanas)

### Semana 1–2 (agora)
1. Rodar smoke test interno completo em fim de semana
2. Ativar Supabase apenas como telemetria opcional, se houver disponibilidade
3. Rodar auditoria em /admin — identificar recall real
4. Testar fluxo completo sem dados: novo dispositivo → onboarding → consulta
5. Testar backup export/import, incluindo ocorrência de backup v3 e restauração de backups v1/v2 antigos
6. Testar revisão semanal: ocorrência → próximo passo → revisão concluída → Timeline

### Semana 3–4
1. Refinamento de copy e microcopy
2. Revisar documentação operacional
3. Validar checklist PWA em dispositivo físico

### Semana 5–6
1. Revalidar build e bundle
2. Revisar rascunhos jurídicos internos
3. Consolidar pendências técnicas restantes

### Critérios mínimos antes de cogitar venda
- Persistência e backup sem perda nos fluxos internos testados.
- Termos, privacidade e disclaimers revisados juridicamente.
- Telemetria interna mostrando uso recorrente e gargalos reais.
- Smoke test interno repetido sem bug crítico.
- Evidência de retorno ao app por alertas, próximos passos ou revisão mensal.
- Suporte esperado documentado e viável para o fundador.

### Por que não IA/login/billing/backend completo agora
- IA/RAG aumentaria risco jurídico e operacional antes de validação de retenção.
- Login e backend completo resolveriam maturidade técnica, mas aumentariam superfície de suporte sem prova comercial.
- Billing e planos pagos antecipariam promessa comercial antes de confiança, suporte e termos estarem maduros.
- O foco atual é observar, reduzir riscos e provar o ciclo operacional existente.

---

## Métricas internas de acompanhamento

| Métrica | Referência interna | Observação |
|---|---|---|
| Ativação do monitoramento | acompanhar | local/remoto se Supabase estiver ativo |
| Uso de próximos passos | acompanhar | criação e conclusão de pendências |
| Registro rápido | acompanhar | ocorrências por tipo, sem texto livre |
| Revisão semanal | acompanhar | viewed/completed, contagens agregadas |
| Recall do assistente | ≥ 75% | verificar em /admin |
| Fallback rate | acompanhar | usar categorias, sem query bruta |
| Bundle `/` | < 230 kB | manter margem operacional |

---

---

## Fase 75 — Índice de Saúde Operacional (2026-05-20)

**Entregue:** `SaudeOperacionalPanel` na aba Condomínio. Índice percentual local (0–100%) de organização operacional dos dados cadastrados.

- Determinístico, client-side, sem IA, sem backend, sem login, sem billing, sem nova aba.
- Não indica regularidade jurídica, compliance ou ausência de risco.
- Faixas: Crítico / Atenção / Em evolução / Bem acompanhado / Tudo em ordem.
- Dynamic import (ssr:false). Nenhum arquivo congelado alterado. Bundle / mantido.

---

---

## Fase 76 — Saúde Operacional compacta no Início (2026-05-20)

**Entregue:** versão compacta do índice de Saúde Operacional na aba Início.

- `SaudeOperacionalPanel variant="compact"` substitui `HomeResumoPredio` na Home.
- Compact: porcentagem + barra + frase + até 3 sinais + microcopy curta.
- Full (Condomínio): fatores, sugestões, disclaimer — inalterado.
- Redundância eliminada. Home motiva; Condomínio explica.
- Sem IA, login, billing, backend, nova aba, promessa jurídica.

---

---

## Fase 76B — Home consolidada em dois hubs (2026-05-20)

**Entregue:** reorganização da Home em cockpit operacional com dois hubs.

- `HomeCondominioHub`: identidade + saúde operacional (% + barra + status + sinais).
- `HomeAcaoHub`: rotina consolidada (revisão semanal + próximos passos + próxima data + registrar ocorrência).
- `SaudeOperacionalPanel full` removido da aba Condomínio (redundante com o hub).
- 4 componentes separados removidos da Home; substituídos por 2 hubs dinâmicos.
- Bundle `/` mantido ou reduzido (imports estáticos pesados movidos para chunks lazy).
- Sem IA, login, billing, backend, nova aba, promessa jurídica.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-20 (Fase 76B)*
*Atualizar conforme marcos forem atingidos.*
