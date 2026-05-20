# Manual Interno do Fundador — Amigo do Prédio

> **Guia operacional para continuar o produto de forma autônoma.**
> Escrito para ser lido no início de qualquer nova sessão de trabalho.
> Assume que você sabe programar e quer saber *o que fazer*, não *como fazer*.

---

## Estado atual do produto (2026-05-20 — Fase 72)

### Bundle
- Rota principal (`/`): 226 kB First Load JS (margem 4 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully

### Diretriz comercial atual

O Amigo do Prédio segue como produto pré-beta interno. Ainda não é vendável, não deve ser apresentado como beta para síndicos, não deve receber tráfego pago e não deve ser posicionado como SaaS pronto.

Posicionamento correto nesta etapa: copiloto operacional leve para síndicos que precisam acompanhar prazos, organizar ações e decidir com mais clareza.

O produto não é advogado virtual, consultoria jurídica, substituto da administradora, ERP condominial, ferramenta de compliance completo ou app B2B para administradoras.

Features seguem congeladas fora de entregas pequenas e justificadas. O trabalho permitido é reduzir risco, melhorar observabilidade, reforçar confiança e consolidar o ciclo existente: dúvida → ação → acompanhamento → histórico.

Supabase é apenas telemetria interna opcional. Não é backend de persistência, não sincroniza dados do condomínio, não substitui localStorage e não deve receber PII.

Critérios mínimos antes de cogitar venda: smoke test interno repetido sem bug crítico, telemetria interna ativa ou validada, termos/disclaimers revisados, backup confiável, evidência de retorno recorrente e suporte esperado documentado.

### Entregues na Fase 72 (Revisão semanal compacta)

Fecha o ciclo leve da rotina viva: ocorrência → próximo passo → revisão semanal → histórico.

- **Revisão rápida da semana:** card compacto e condicional na Home com dados. Só aparece quando há memória operacional e algo útil para revisar: ocorrências da semana, próximos passos abertos/antigos, alertas ativos ou revisão mensal disponível.
- **Sem obrigação formal:** não é auditoria, compliance, checklist jurídico, calendário ou protocolo. É apenas ritual interno de organização para o síndico não deixar situações paradas.
- **Estado local efêmero:** `amigo_revisao_semanal` guarda apenas semana revisada e timestamp local. Não entra no backup e não cria backup v4.
- **Timeline:** ao concluir, registra somente "Revisão semanal concluída", sem descrição de ocorrência, unidade/local, texto livre ou dado sensível.
- **Telemetria sem PII:** `weekly_review_viewed` e `weekly_review_completed` enviam apenas `week_key`, contagens e booleanos permitidos. Nada de texto livre, pergunta/resposta, data exata ou dados do condomínio.
- **Sem expansão de produto:** sem IA, login, billing, backend, WhatsApp, nova aba, calendário, filtros, arquivamento ou push notification.

### Entregues na Fase 71 (Rotina viva do síndico)

Primeira camada de rotina semanal sem ERP, sem protocolo formal e sem backend.

- **Registro rápido:** componente compacto para registrar ocorrências simples da rotina do prédio: barulho, vazamento, obra, inadimplência, manutenção, funcionário, área comum, assembleia e outro. Campos mínimos: tipo, descrição curta e unidade/local opcional. Não é livro oficial, denúncia, protocolo jurídico ou sistema de gestão.
- **Próximo passo por ocorrência:** ao salvar uma ocorrência, o usuário pode criar uma pendência com `origem: "ocorrencia"` para acompanhar a situação. Não há prazo editável, responsável, prioridade, comentários ou subtarefas.
- **Mensagem administrativa copiável:** para tipos compatíveis, o app gera modelo curto, determinístico e editável para moradores. Não integra WhatsApp, não envia automaticamente e não inclui nomes, unidade/local ou texto da ocorrência.
- **Timeline:** ocorrência registrada aparece como memória operacional humana, sem descrição livre. A timeline continua sendo histórico leve, não log técnico.
- **Backup v3:** exporta/importa ocorrências junto de perfil, memória, favoritos, checklists e pendências. Backups v1 e v2 continuam aceitos.
- **Telemetria sem PII:** `ocorrencia_created`, `admin_message_generated` e `admin_message_copied` enviam apenas tipo, origem/flags e mês agregado quando aplicável. Nunca enviam descrição, unidade/local, nome, texto da mensagem, data exata ou dados do condomínio.
- **Revisão semanal:** documentada como próxima evolução; não implementada nesta fase para manter a entrega pequena.

### Entregues na Fase 70 (Maturidade comercial percebida sem overbuilding)

Fase de microcopy e documentação. Zero feature nova.

- **`components/PendenciasCard.tsx`:** subtítulo e empty state reforçam o ciclo "dúvida/alerta → ação acompanhável → conclusão", sem novo layout.
- **`components/RevisaoMensalCard.tsx`:** copy da revisão mensal ajustada para comunicar retorno recorrente e itens que ficaram para trás.
- **`components/TimelineOperacional.tsx`:** título/copy ajustados para "Histórico operacional" e memória do que foi feito, evitando tom de log técnico.
- **`components/BackupPanel.tsx`:** copy esclarece que, enquanto não há login, o backup protege os dados salvos no dispositivo.
- **`components/Response.tsx`:** disclaimer reforça caráter informativo e apoio administrativo ao síndico; fallback passa a dizer que não encontrou orientação específica na base atual.
- **Documentação:** roadmap e smoke test registram pré-beta interno, produto ainda não vendável, sem teste com síndicos por enquanto, features congeladas, Supabase como telemetria opcional e critérios mínimos antes de venda.
- **Sem alterações:** Hero, GuidancePreview, MemoriaPanel, GuidancePanel, thresholds de guidance, KB, motor de busca, schema de backup, package, manifest, simuladores e estrutura da Home.

### Entregues na Fase 67 (Primeiros 10 Segundos + Calibração de Urgência)

Duas correções cirúrgicas dos achados do relatório pós-Fase 66. Zero feature nova.

- **`components/Hero.tsx`:** subtitle atualizado de "Assistente, memória e rotina em um só lugar." para "Monitora prazos do prédio e orienta em situações críticas." — comunica a função dual (monitoramento + orientação) nos primeiros 2 segundos. Chips situacionais reduzidos de 5 para 3 (barulho, inadimplente, vazamento) — economiza ~35px verticais, tornando o `GuidancePreview` visível sem scroll em iPhones menores.
- **`lib/guidance.ts`:** 6 rotinas operacionais atrasadas (`dedet-atrasada`, `caixa-atrasada`, `elevador-atrasado`, `extintores-atrasados`, `spda-atrasado`, `eletrica-atrasada`) rebaixadas de `priority: "critico"` para `priority: "atencao"`. AVCB, seguro, mandato e AGO permanecem `"critico"`. urgencyLabel de cada rotina ajustado para refletir incerteza operacional ("verificar se realizada", "confirmar com a prestadora", "verificar laudo com técnico") em vez de "possivelmente atrasada". Motor de prioridade e ordenação preservados.
- **`components/PendenciasCard.tsx`:** indicador de overflow `"+N próximos passos ocultos"` quando há mais de 5 pendências abertas. Zero expansão automática, zero paginação, zero modal.
- **`components/HomeResumoPredio.tsx`:** suprime `"Próxima atenção: {urgencyLabel}"` (que duplicava o GuidancePanel acima) e exibe "Confira os alertas acima para os detalhes." quando `guidanceCount > 0`. Quando não há alertas, mantém "Sem alertas ativos agora. Mantenha as datas essenciais atualizadas."
- **Bundle:** 225 kB (inalterado). Sem nova feature, nova aba, novo card, schema, KB, motor, backup ou biblioteca.

### Entregues na Fase 66 (Validação Mobile, Densidade da Home e Controle de Bundle)

Fase de estabilização pós-Fases 58–65. Zero feature nova. Foco em hierarquia da Home, alarmismo do GuidancePanel e bundle.

- **`app/page.tsx`:** `ContextualInsight` convertido de import estático para `dynamic()` com `ssr: false`. `lib/insights.ts` (~7.6 kB fonte, único consumidor) sai do chunk inicial → bundle / cai de 226 kB para 225 kB.
- **`app/page.tsx`:** `DicaDoDia` oculta no estado sem dados (`!hasCondominioData && ...`). Estado sem dados agora mantém foco em `Hero` + `GuidancePreview` como onboarding principal, sem que a dica operacional dispute atenção com o CTA de cadastro.
- **Auditoria documentada:** hierarquia da Home por cenário (sem dados, dados em dia, 1 alerta crítico, muitas manutenções atrasadas, vários próximos passos); análise do GuidancePanel pós-Fase 65; análise do assistente contextual. Sem problema objetivo encontrado além dos dois acima.
- **Sem backend, login, IA/RAG, calendário, nova aba, schema, KB, motor de busca, biblioteca ou feature nova.**

### Entregues na Fase 65 (Monitoramento de rotinas recorrentes no GuidancePanel)

Expandiu o GuidancePanel para cobrir rotinas operacionais além de vencimentos: dedetização, limpeza da caixa d'água, manutenção do elevador, extintores, SPDA e vistoria elétrica. Motor determinístico com thresholds e `ROTINA_DISCLAIMER` para clareza de periodicidade. Bundle 226 kB.

### Entregues na Fase 64 (Assistente contextual sem IA + preparação para IA futura)

Torna o Assistente mais conectado ao prédio usando apenas dados locais já cadastrados, sem IA, RAG, API externa, backend, login, alteração de schema, KB ou motor de busca.

- **`components/Response.tsx`:** adiciona aviso discreto "Contexto do prédio" quando a orientação tem relação com dados existentes na MemoriaOperacional. Sem dado local relevante, a resposta permanece igual.
- **Contextos cobertos:** seguro, AVCB, mandato/assembleia e manutenção. Quando a data é válida e simples de calcular, o texto menciona apenas a distância em dias; nunca transmite datas reais nem inventa informação.
- **Perguntas relacionadas:** sugestões hardcoded por categoria para multas, obras, inadimplência/cobrança e assembleias, usando o `onSuggestionSelect` já existente. Não cria busca nova, conversa persistente ou refinamento de scoring.
- **`components/HistoryPanel.tsx`:** microcopy ajustada para "Perguntas recentes" + "Retome uma dúvida anterior." Sem threads e sem memória semântica.
- **Telemetria privacy-safe:** evento `local_context_notice_shown` com apenas `categoria`, `context_type` e `has_memoria`. Zero pergunta, resposta, datas reais, dados do condomínio ou texto livre.
- **Plano futuro de IA/RAG:** `docs/plano-futuro-ia-rag-contextual.md` documenta onde IA entraria depois como fallback ancorado na KB e protegido por backend seguro, sem substituir GuidancePanel, MemoriaOperacional ou Próximos Passos.

### Entregues na Fase 63 (Home Cockpit + atualização manual)

Fortalece a aba Início como cockpit operacional leve, sem criar dashboard pesado, calendário, nova aba, backend ou nova arquitetura.

- **`components/HomeResumoPredio.tsx` (novo):** bloco compacto "Hoje no prédio" para usuários com dados. Usa apenas dados locais: pendências abertas, pendências concluídas no mês, `computeCondominioHealth()` e `buildGuidanceItems()` para sintetizar status, progresso e próxima atenção. Não exibe títulos de pendências nem datas reais.
- **`app/page.tsx`:** hierarquia da Home com dados ajustada para: Status/Header → GuidancePanel → Hoje no prédio → Próximos passos → Revisão Mensal → Próximas datas → Contextual/Dica. GuidancePanel continua prioritário quando há alerta real; DicaDoDia perde protagonismo quando há ações concretas.
- **Atualização manual:** controle discreto "Atualizado agora" + botão "Atualizar" no topo da Home com dados. Ao clicar, incrementa `refreshKey`, re-lê estado local e mostra feedback "Dados atualizados". Não faz fetch externo, não chama Supabase e não altera dados.
- **Pull-to-refresh:** não implementado. Decisão: risco desnecessário para scroll nativo/iOS PWA; botão explícito entrega a sensação de app vivo com menor superfície de regressão.
- **Telemetria privacy-safe:** adicionados `home_summary_viewed` e `home_refreshed_manual` com apenas `pending_count`, `completed_month_count`, `has_guidance` e `has_memoria`. Zero títulos, datas reais, texto livre ou dados do condomínio.
- **Sem backend, login, IA/RAG, calendário, kanban, nova aba, simulador, upload, WhatsApp, biblioteca, KB ou motor de busca.**

### Entregues na Fase 61 (Ritual Mensal + prova de valor acumulado)

Transforma a Revisão Mensal em ritual recorrente visível na Home e adiciona uma primeira camada de valor acumulado sem dashboard, calendário, nova aba ou backend.

- **`components/RevisaoMensalCard.tsx`:** card da Home enriquecido com bloco "Este mês no prédio": próximos passos concluídos no mês, pendências abertas e alertas acompanhados (`origem: "guidance"` concluídos no mês). Se não houver dados, mostra "Conclua próximos passos para montar o resumo do mês." Copy principal: "Sua revisão mensal está disponível" + "Reserve 3 minutos para verificar pendências, vencimentos e cuidados importantes do prédio."
- **Regra de exibição:** permanece oculto sem memória operacional; com dados, aparece quando a revisão ainda não foi concluída no mês e estamos entre os dias 1–7 ou o card ainda não foi aberto/visto no mês. Controle mínimo em `localStorage` (`amigo_revisao_mensal_home`) registra apenas `seenMonthKey` e `openCount`; não entra no backup e não altera dados operacionais.
- **`app/page.tsx`:** CTA "Fazer revisão" navega para a aba Condomínio e rola até a seção `#revisao-mensal`. Sem rota nova, sem modal, sem bloqueio de uso, sem notificação.
- **`components/RevisaoMensal.tsx`:** seção "O que foi resolvido neste mês" mostra até 4 pendências concluídas no mês via `getPendenciasConcluidas()`, com títulos truncados; estado vazio: "Os próximos passos concluídos neste mês aparecerão aqui."
- **`lib/telemetry.ts`:** adiciona `revisao_mensal_progress_viewed`; eventos da revisão mensal usam apenas `month_key`, `open_count`, `completed_count` e `pending_count`. Zero texto livre, zero dados do condomínio, zero datas reais.
- **`ProximasDatas`:** não alterado nesta fase. Agrupamento por horizonte temporal fica como hipótese futura por exigir mudança visual maior e risco desnecessário para o objetivo central.
- **Sem backend, login, IA/RAG, push notification, nova aba, calendário, kanban, responsáveis, anexos, comentários, upload, WhatsApp, paywall, novas ferramentas financeiras ou KB.**

### Complemento documental da Fase 60

Higiene documental mínima, sem alteração funcional: README atualizado para refletir o estado real do PWA, comentário de setup em `lib/telemetry.ts` alinhado ao guia Supabase atual (`read_anon TO anon`) e linguagem do guia de telemetria neutralizada para "uso externo" / "exposição externa". Nenhuma UI, lógica de produto, localStorage, telemetria runtime, Supabase runtime, KB ou componente visual foi alterado.

### Entregues na Fase 60 (ritual mensal na Home)

Surfacea a Revisão Mensal na aba Início de forma discreta, no momento certo, sem push notification, backend ou modal obrigatório.

- **`components/RevisaoMensalCard.tsx` (novo):** card leve para a aba Início. Lê `lastRevisaoMensalAt` via `getSessionMeta()` após hidratação. Exibe-se apenas quando: (1) há `hasMemoriaOperacional()` e (2) a revisão não foi concluída no mês calendário atual (year + month). Reutiliza `trackedRef` para disparar `revisao_mensal_surface_seen` apenas uma vez por mount, independente de quantas vezes `refreshKey` mudar. CTA "Fazer revisão" dispara `revisao_mensal_opened_from_home` e navega para aba Condomínio via `onOpen` prop — a `RevisaoMensal` real já está lá e se auto-exibe.
- **`app/page.tsx`:** import estático de `RevisaoMensalCard`; renderizado na aba Início após `PendenciasCard` e antes de `DicaDoDia`, gatilhado por `hasCondominioData` — garante que usuários sem dados não vejam o card.
- **`lib/telemetry.ts`:** +2 eventos ao union `TelemetryEvent` — `revisao_mensal_surface_seen` e `revisao_mensal_opened_from_home`. Fields: `{}` — zero PII.
- **Decisão sobre estado sem dados:** card oculto. Sem dados de memória, `buildStatusItems()` retorna array vazio e a RevisaoMensal no destino nada exibiria. Além disso, o foco da Home sem dados é `GuidancePreview` + CTA de onboarding — que não pode ser diluído por ritual que pressupõe dados existentes.
- **Hierarquia na Home com dados:** GuidancePanel (urgências críticas) → ProximasDatas → ContextualInsight → HomeContextual → PendenciasCard → **RevisaoMensalCard** → DicaDoDia. Urgências continuam prioritárias.
- **Desaparece automaticamente:** quando `recordRevisaoMensal()` é chamado na aba Condomínio, `onDone` incrementa `refreshKey` → `RevisaoMensalCard` re-avalia → some da Home.
- **Build:** 223 kB (sem variação). Margem: 7 kB antes do limite.

### Entregues na Fase 59 (integração segura GuidancePanel ↔ Próximos Passos)

Fecha o ciclo de utilidade recorrente sem criar automações perigosas — alertas de AVCB/Seguro/Mandato não são marcados como renovados sem dado real.

- **`components/GuidancePanel.tsx`:** `commitResolution()` agora detecta pendência aberta com `origem === "guidance"` e `matchedId === item.id`. Se encontrar, chama `completePendencia(related.id)` imediatamente após gravar o dado no localStorage, e dispara `pendencia_completed_from_guidance_resolution { guidance_id, priority }`. A Timeline recolhe a conclusão normalmente via `onResolved?.()` depois dos 2500 ms de sucesso. Import de `completePendencia` adicionado.
- **`components/PendenciasCard.tsx`:** ao concluir pendência com `origem === "guidance"`, exibe por 5 s a mensagem discreta: "Concluído. Se isso envolvia vencimento, atualize a data no monitoramento." — sem modal, sem navegação forçada, sem abrir MemoriaPanel. Implementado via `guidanceFeedback` state + `feedbackTimer` ref com cleanup no unmount.
- **`components/PendenciasCard.tsx`:** indicador temporal discreto "Aberto há mais de 14 dias" abaixo da tag de categoria de cada pendência com mais de 14 dias de `createdAt`. Helper `isStale(createdAt)` puro, calculado no render — zero persistência, zero dueDate, zero prazo editável.
- **`lib/telemetry.ts`:** `"pendencia_completed_from_guidance_resolution"` adicionado ao union `TelemetryEvent`. Fields enviados: `guidance_id`, `priority` — zero PII.
- **Decisão registrada:** concluir pendência no PendenciasCard nunca atualiza GuidancePanel nem grava dados de memória automaticamente. Motivo: AVCB, Seguro e Mandato exigem nova data real — marcar automaticamente como renovado seria dado falso, perigoso para o condomínio.
- **Build:** 223 kB (sem variação). Margem: 7 kB antes do limite.

### Entregues na Fase 58 (cold start & preview de valor)

Resolve o principal gap de produto: usuário sem dados não conseguia perceber o valor do app antes de qualquer cadastro.

- **`components/GuidancePreview.tsx` (novo):** componente estático de preview — nenhum hook, nenhum localStorage, JSX puro. Mostra 2 itens de monitoramento simulados (AVCB vencendo em 23 dias + Mandato em 68 dias) com badges "Exemplo" e um CTA "Cadastrar as 3 datas" que aciona o scroll para o MemoriaPanel. Aparece na tela inicial apenas quando `!hasCondominioData`.
- **`app/page.tsx`:** import de `GuidancePreview` adicionado; bloco `{!hasCondominioData && <GuidancePreview onSetup={handleScrollToMemoria} />}` inserido entre Hero e o bloco GuidancePanel/CondominioStatusHeader — garante que usuários sem dados vejam imediatamente o que o monitoramento entrega, sem exigir cadastro primeiro.
- **`components/Hero.tsx`:** copy do corpo atualizado para incluir prazo concreto — "Em 2 minutos o monitoramento está ativo e o app avisa você antes que qualquer prazo vire urgência." (+14 chars; promise de tempo + promise de valor).
- **`components/PendenciasCard.tsx`:** estado vazio reescrito para ensinar o loop correto: "Quando o Assistente responder uma pergunta, você pode **salvar o próximo passo aqui** para acompanhar depois." — orienta o fluxo Assistente → Próximos passos em vez de apenas indicar vazio.
- **`components/MemoriaPanel.tsx`:** nota de intro (quando `essentialCount === 0`) expandida com instrução de menor fricção: "Não sabe uma data agora? Use 'lembrar depois' no campo e preencha quando encontrar o documento." — remove bloqueio cognitivo do onboarding.
- **Build:** 223 kB (+1 kB). Margem: 7 kB antes do limite.

### Entregues na Fase 57 (auditoria editorial da KB)

- **3 entradas da KB corrigidas em `lib/knowledge.json`** — apenas campo `resposta`, sem alteração de IDs, categorias, keywords ou estrutura:
  - **`autorizacao-obras`:** adicionado "— os documentos exigíveis dependem do tipo de obra e do que a convenção ou regimento prevê." ao fim da resposta. Antes: afirmava que síndico *pode exigir* ART e autorização da prefeitura de forma universal; agora relativiza corretamente.
  - **`coleta-seletiva-condominio`:** substituída assertiva "O condomínio é obrigado... com lixeiras separadas por tipo de material" por formulação que indica base legal nacional (Lei 12.305/2010) e adiciona "As exigências específicas... variam conforme a legislação do município." Obrigação geral preservada; variação municipal explicitada.
  - **`vaga-uso-comum-preferencia`:** adicionado "desde que haja aprovação em assembleia" à permissão de locação de vagas comuns; removido "legal" de "direito de preferência legal" (CC art. 1.338 aplica-se a vagas privadas, não inequivocamente a vagas de uso comum). Procedimento e prazo mantidos intactos.
- **25 entradas avaliadas e mantidas** — assertivas baseadas em estatuto direto (CLT, CC, CPC, NR-10, Lei do Inquilinato). Afirmativas legais não precisam de ressalva de convenção.
- **Confidence gap fechado:** 11/83 REVIEW = 13,3% — abaixo do limiar de 20%. Todos são B→A (motor respondeu casos grays — não é regressão).
- **Auditoria offline estável:** 72/83 PASS (87%), 0 FAIL, Recall A 100%, Bloqueio C 100% — idêntico à Fase 56.
- **Build:** 222 kB (sem variação). TypeScript: zero erros.
- **Critérios internos fechados pela Fase 57:** "Confidence gap < 20%" e "Sem resposta categórica sem ressalva de convenção" — ambos `[x]` no roadmap.

### Entregues na Fase 56 (ativação segura do Supabase — docs e validação)

Fase de documentação e auditoria. Zero alterações de código-fonte.

- **`docs/setup-supabase-telemetria.md` corrigido e atualizado:**
  - **Bug RLS corrigido:** policy `"read_admin" TO authenticated` → `"read_anon" TO anon`. A função `fetchRecentEvents()` em `lib/telemetry.ts` usa a anon key; com `TO authenticated`, o `/admin` nunca conseguiria ler dados remotos mesmo com Supabase configurado. Bug silencioso — painel caía silenciosamente para dados locais sem indicação de erro.
  - **Eventos `q` removidos:** referências a `properties->>'q'` nas queries SQL e na tabela de eventos esperados removidas — campo eliminado na Fase 49. Queries atualizadas para usar `properties->>'categoria'` (fallback por categoria) e pendência metrics.
  - **Novos eventos documentados:** +7 eventos adicionados à tabela — `session_duration`, `backup_imported`, `pendencia_created_manual/from_response/from_guidance/from_memoria`, `pendencia_completed`.
  - **Checklist de ativação criado:** 9 itens sequenciais — desde criar projeto Supabase até confirmar dados no `/admin` em produção.
  - **SQL de diagnóstico expandido:** +2 queries novas — pendências criadas por origem e taxa de conclusão de pendências.
  - Versão atualizada para Fase 56 (2026-05-19).

- **Auditoria offline confirmada:** `node scripts/audit.js` — 72/83 PASS (87%), 0 FAIL, 11 REVIEW (todos B→A — motor respondeu em casos esperados como fallback, não é regressão). Recall A: 100% (64/64). Bloqueio C: 100% (4/4). Resultado idêntico à Fase 37 — motor estável após todas as fases de produto.

- **Privacidade confirmada:** zero PII nos eventos de telemetria. Inventário completo documentado no manual. Todos os 5 novos eventos de pendência (Fases 50–55) transmitem apenas `categoria`, `origem`, `matched_id` — nunca título, nunca texto do usuário.

- **`.env.local` ainda não criado** — ativação do Supabase é ação manual do fundador (~15 min). Guia agora correto e completo.

### Entregues na Fase 55 (onboarding sem bloqueio: "Não sei agora — lembrar depois")
- **`Pendencia.origem` ampliado:** adicionado `"memoria"` ao union em `lib/session.ts`. Distingue pendências criadas pelo MemoriaPanel de pendências manuais (`"manual"`), de resposta (`"response"`) e de guidance (`"guidance"`). Backups v2 exportam/importam essa origem normalmente; backups v1 não são afetados.
- **`MEMORIA_LEMBRAR` em MemoriaPanel.tsx:** mapa módulo-nível com títulos e campo de telemetria para os 3 essenciais. Títulos: "Cadastrar data do AVCB" / "Cadastrar vencimento do seguro condominial" / "Cadastrar fim do mandato do síndico".
- **`savedMemoriaIds: Set<string>` state:** inicializado no `useEffect` de mount a partir de `getPendenciasAbertas()` filtrado por `origem === "memoria"`. Garante que ao re-abrir o panel (re-mount por troca de aba), o estado "Lembrete salvo ✓" persiste enquanto a pendência estiver aberta.
- **`handleLembrarDepois(key)` handler:** guard de duplicata → `addPendencia({ titulo, categoria: "gestao", origem: "memoria", matchedId: key })` → `trackEvent("pendencia_created_from_memoria", { field })` → `setSavedMemoriaIds`.
- **Botão JSX:** `"Não sei agora — lembrar depois"` / `"Lembrete salvo ✓"` — renderizado abaixo do input de data apenas quando `ESSENTIAL_KEYS.includes(key)` e `!(draft[key] && draft[key] !== "")`. Invisível após preenchimento do campo. Estilo `text-[11px] text-navy-400 hover:text-navy-600` — discretíssimo, sem terracota, sem alarme.
- **`GUIDANCE_TITULO_OVERRIDE` em GuidancePanel.tsx:** 5 verbos de ação mais precisos para pendências criadas via guidance: "Convocar AGO", "Agendar dedetização", "Verificar limpeza da caixa d'água", "Agendar manutenção do elevador", "Verificar inspeção dos extintores". Sem impacto no layout do GuidancePanel.
- **Bundle:** 222 kB (sem variação). Margem: 8 kB antes do limite.

### Entregues na Fase 54 (conexão GuidancePanel → Próximos passos)
- **`onPendenciaSaved?: () => void` em GuidancePanel:** novo callback opcional; propagado para `page.tsx` como `() => setRefreshKey((k) => k + 1)` — garante que o `PendenciasCard` na aba Início reflita imediatamente a nova pendência criada.
- **`savedGuidanceIds: Set<string>` state:** inicializado no `useEffect([refreshKey])` a partir de `getPendenciasAbertas()` filtrado por `origem === "guidance"`. Deduplicação persistente: se o usuário sair do app e voltar, o botão continua "Salvo ✓" enquanto a pendência estiver aberta. Ao concluir a pendência (PendenciasCard), `refreshKey` muda → `useEffect` re-executa → `savedGuidanceIds` atualizado.
- **`guidanceCategoria(id)` helper inline:** mapeia prefixos de `GuidanceItem.id` para categorias: `avcb/dedet/caixa/elevador/extintores` → `"manutencao"`, `ago` → `"assembleias"`, `seguro/mandato` → `"gestao"`. Zero impacto em outros sistemas.
- **`handleSaveGuidancePendencia(item)`:** cria pendência com `titulo` determinístico (`Renovar X` para type expiry, `X` para type done), `origem: "guidance"`, `matchedId: item.id`. Dispara `pendencia_created_from_guidance` com `{ guidance_id, priority }` — zero PII. Atualiza `savedGuidanceIds` localmente e chama `onPendenciaSaved?.()`.
- **Botão JSX:** `"Salvar nos próximos passos"` / `"Salvo ✓"` — terciário e discreto, dentro do bloco `!isResolving`, abaixo dos botões primário (Registrar) e secundário (Ver orientação). Estilo idêntico ao botão equivalente em `Response.tsx` (`text-[11px] text-navy-500 hover:bg-navy-200/60`). Desabilitado quando já salvo.
- **Bundle:** 222 kB (sem variação). Margem: 8 kB antes do limite.

### Entregues na Fase 53 (disclaimers jurídicos inline nas categorias sensíveis)
- **`SENSITIVE_CATEGORY_NOTICE` em `Response.tsx`:** mapa simples `Partial<Record<string, string>>` com avisos específicos para `lgpd`, `trabalhista` e `financeiro`. Zero novos componentes, zero dependências, zero impacto em outros arquivos.
- **Posição na UI:** o aviso sensível aparece logo antes do "Aviso jurídico" geral — após os blocos Próximo passo / Base legal / Dica prática / CTAs / Aviso regional CCT. Visível apenas para as três categorias sensíveis; demais categorias inalteradas.
- **Visual:** `rounded-lg bg-navy-50/50 px-3 py-2.5` com `InfoIcon` em `text-navy-500` e texto em `text-[12.5px] text-navy-500` — discreta, premium, sem alarme, sem duplicação visual do disclaimer geral.
- **Critérios internos fechados:** 2 dos 3 itens de "Conteúdo legal" no roadmap marcados como concluídos (`disclaimer visível` + `dados sensíveis com aviso`). Critério remanescente: "sem resposta que afirme 'pode fazer X' sem mencionar que depende da convenção" — auditoria editorial.
- **Bundle:** 222 kB (sem variação). Margem: 8 kB antes do limite.

### Entregues na Fase 52 (estabilização técnica e performance)
- **Dynamic imports: MemoriaPanel + OnboardingProfile:** movidos de imports estáticos para `dynamic(() => import(...), { ssr: false })` — exclusivos da aba Condomínio, mesmo padrão já aplicado a `TimelineOperacional`, `RevisaoMensal` e `BackupPanel`. Ambos têm `if (!hydrated) return null` — sem flash de conteúdo parcial. Comportamento `autoExpand` do MemoriaPanel preservado: o prop `true` é recebido quando o componente monta, e o `useEffect([autoExpand, hydrated, expanded])` dispara na hidratação.
- **Dead code removido:** função `toolHighlight` em `app/page.tsx` estava definida mas nunca chamada no JSX (os componentes usam `highlighted={highlightToolAnchor === anchor}` diretamente). Removida sem impacto.
- **Validação lógica dos fluxos (Fase 51):** todos os fluxos rastreados no código sem regressão: salvar pendência via Response → `handleSavePendencia` + `addPendencia` + `refreshKey` ✓; concluir pendência → `completePendencia` + local state ✓; Timeline ao navegar para Condomínio → monta fresh e lê localStorage atualizado ✓; backup v2 exporta/importa pendências ✓; backup v1 continua importando silenciosamente ✓; botão Voltar restaura pergunta no input ✓.
- **Telemetria auditada:** 3 eventos de pendência confirmados sem PII — `pendencia_created_manual` envia `{}`; `pendencia_created_from_response` envia `{ categoria, matched_id }`; `pendencia_completed` envia `{ categoria, origem, matched_id }`. Título nunca transmitido. No-op silencioso sem Supabase.
- **Bundle:** 222 kB (−3 kB vs Fase 51). Margem: 8 kB antes do limite.

### Entregues na Fase 51 (consolidação segura da camada "Próximos passos")
- **Backup v2:** `exportUserData()` agora exporta versão `"2"` com campo `pendencias: Pendencia[]`. `parseAndValidateUserData()` e `importUserData()` aceitam v1 (sem pendências) e v2 (com pendências). Backups v1 antigos continuam importando sem erro — campo pendências é simplesmente ausente e ignorado. `ImportResult.summary` ganhou `pendenciasCount?: number`.
- **Indicador de armazenamento:** `getStorageSizeKB()` em `lib/session.ts` — conta apenas chaves `amigo_*` em UTF-16, retorna KB arredondado. `BackupPanel.tsx` lê via `useEffect` e exibe "Dados armazenados: ~X KB" discretamente no rodapé. Fecha critério roadmap `[ ] localStorage não excede limites típicos`.
- **Timeline de pendências concluídas:** `getPendenciasConcluidas()` adicionado em `lib/session.ts`. `TimelineOperacional.tsx` inclui pendências com `status === "concluida"` como eventos `tipo: "pendencia"` com ícone `✓`. Fecha o ciclo de utilidade recorrente: o síndico vê o que resolveu no histórico do condomínio.
- **Telemetria de pendências (sem PII):** 3 eventos adicionados a `TelemetryEvent`: `pendencia_created_manual`, `pendencia_created_from_response`, `pendencia_completed`. Campos enviados: `categoria`, `origem`, `matched_id` — nunca o título. `PendenciasCard` dispara `pendencia_created_manual` e `pendencia_completed`. `page.tsx` dispara `pendencia_created_from_response` em `handleSavePendencia`.
- **Botão "Voltar" no Assistente:** aparece no canto superior esquerdo da aba Assistente quando há resposta ativa (`submittedQuestion && !isLoading`). Seta `←` pequena + texto "Voltar". Chama `handleBack`, que limpa a resposta e restaura a pergunta no input para reedição. Não aparece na tela inicial do Assistente. Não quebra favoritos, histórico, compartilhamento, CTAs ou ActionPills existentes.
- **Bundle:** 225 kB (+1 kB). Margem: 5 kB antes do limite.

### Entregues na Fase 50 (utilidade recorrente — Próximos passos)
- **`lib/session.ts`:** tipo `Pendencia` + chave `amigo_pendencias` + 5 funções: `addPendencia`, `completePendencia`, `deletePendencia`, `getPendencias`, `getPendenciasAbertas`. Máx 50 registros. Não incluído no backup v1 (chave separada, sem impacto em import/export).
- **`components/PendenciasCard.tsx`** (novo): card na aba Início, sempre visível. Mostra até 5 pendências abertas com botão de conclusão circular; formulário inline para adição manual; estado vazio com instrução de uso do Assistente. Usa `refreshKey` para re-leitura após saves externos.
- **`components/Response.tsx`:** prop opcional `onSavePendencia` adicionada; estado `savedPendenciaId` para feedback "Salvo ✓" por resposta; botão "Salvar nos próximos passos" ao final do bloco "Próximo passo" — aparece apenas quando `CAT_TO_NEXTACTION[categoria]` existe e prop está conectada.
- **`app/page.tsx`:** `handleSavePendencia` criado; `onSavePendencia` passado para Response; `PendenciasCard` renderizado na aba Início após HomeContextual.
- **Bundle:** 224 kB (+1 kB). Margem: 6 kB antes do limite.

### Entregues na Fase 49 (privacidade da telemetria e ativação segura)
- **Query bruta removida do Supabase:** `q: q.slice(0, 80)` eliminado dos eventos `query_submitted` e `query_fallback` em `app/page.tsx`. Substituído por campos estruturais sem PII: `matched_id`, `categoria`, `score`, `query_length` (submitted) e `detected_category`, `score`, `blocked_by_domain`, `query_length` (fallback).
- **Admin adaptado:** `aggregateRemote()` em `app/admin/page.tsx` atualizado para usar os novos campos. `Aggregated` type ganhou campo `source: "local" | "remote"`. Rótulos das seções "Top perguntas" e "Tokens sem resposta" agora diferem entre fonte local e remota — sem quebrar dados locais (localStorage).
- **Documentação de privacidade:** seção "Privacidade: query bruta nunca é enviada ao Supabase" criada no manual com lista completa de campos coletados, o que cada um representa, o que é evitado e por quê.
- **Nota localStorage:** explicitado que `logQuery()` armazena query completa apenas localmente (no dispositivo do usuário) — jamais transmitida.

### Entregues na Fase 48 (validação técnica silenciosa)
- **PWA manifest:** `short_name` corrigido de `"Amigo do Prédio"` (16 chars) → `"Amigo Prédio"` (12 chars) — evita truncamento no home screen Android. `name` mantido como "Amigo do Prédio".
- **Telemetria auditada:** zero PII nos eventos estruturados. Exceção identificada e documentada: `q:` nos eventos de query — resolvida na Fase 49.
- **PWA config validada:** manifest.ts, layout.tsx, icons (192/512/apple-touch-icon), maskable, theme_color, background_color, safe-area, display standalone — todos corretos.
- **Supabase:** NOT ativado (sem `.env.local`). Telemetria opera em no-op silencioso. Guia completo em `docs/setup-supabase-telemetria.md`. Próximo passo manual: criar projeto Supabase + criar `.env.local`.
- **Auditoria /admin:** requer browser com dev server (`npm run dev` → `localhost:3000/admin`). Offline (scripts/audit.js) confirmou 87% recall. Auditoria ao vivo é passo do fundador.

### Entregues na Fase 47 (coerência visual e percepção premium)
- **Hero copy**: corpo atualizado para nomear os 3 essenciais — "Registre AVCB, seguro e mandato do síndico — 3 datas que protegem o prédio. O app avisa antes que qualquer prazo vire urgência." Usuários sem dados agora entendem o valor antes de qualquer cadastro.
- **MemoriaPanel título expandido**: "Datas e manutenções" → "Vencimentos e manutenções" — elimina inconsistência com o texto do estado colapsado.
- **AskInput botão submit**: `bg-navy-800 hover:bg-navy-900` → `bg-navy-700 hover:bg-navy-800` — alinha com a cor primária da marca (`#234B63` = navy-700), coerente com todos os botões "Salvar" do app.
- **Auditoria terracota**: todos os usos de terracota validados como semanticamente corretos — apenas em estados de urgência/ação: GuidancePanel (critico + botão urgentes), CondominioStatusHeader (badge critico + linhas de alerta), ProximasDatas (vencido/urgente), Response (dica prática + ActionPill ativo + toast).
- **Identidade visual confirmada**: BrandMark usa `/brand/logo-oficial.png` com `bg-[#234B63]` ✓; BottomNav `bg-[#fffaf1]/[0.96]` ✓; fundo body `#FBF8F2` ✓; nenhum novo elemento pesado de azul introduzido.

### Entregues na Fase 46 (maturação interna — sem beta)
- **MemoriaPanel progressivo:** seção "Essenciais" (AVCB, Seguro, Mandato) com indicador de progresso (dots + contador "X/3"); collapsed state com subtítulos contextuais por nível de preenchimento; seção "Manutenções e rotinas" renomeada; texto de intro focado nas 3 datas essenciais; abertura inteligente — foca nos essenciais se incompletos, expande rotinas se prontos. Premissa: `docs/consolidacao-interna-sem-beta-fase-45.md`.
- **Response — ação antes de explicação:** "Próximo passo" movido para o topo do card de contexto (antes da base legal); aparece sempre quando disponível para a categoria (não mais exclusivo quando sem dica); maior destaque visual (border-navy-500). Ordem: Próximo passo → Base legal → Dica prática → Veja também → CTAs → Disclaimer.

### Entregues na Fase 45 (estética completa)
- Nova paleta Navy #234B63 / Cream #F7F1E8 / Terracotta #C97852; sistema de cores Tailwind atualizado; sage eliminado; ícones PWA regenerados; 19 componentes atualizados; build 222 kB.

### Entregues na Fase 44
- **Validação interna:** 20 cenários do laboratório (Fase 43) avaliados — média 3.85/5. Zero falhas críticas. Resultado documentado em `docs/resultado-validacao-cenarios-fase-44.md`.
- **Matriz de maturidade aplicada:** 13 fluxos reavaliados. Resultado em `docs/resultado-matriz-maturidade-fase-44.md`.
- **Hero chips refinados:** chip 3 "Nome no grupo" → "Querem expor inadimplente" (label mais preciso). Chip 5 "Convocar assembleia" → "Vazamento entre apts." (crise > procedimento, score +0.5).
- **TOPICS lgpd:** examplePrompt mudou de duplicata do chip 3 para "Câmera no corredor: precisa de autorização?" — elimina redundância e cobre cenário C21.
- **TOPICS financeiro:** examplePrompt mudou de abstrato → "Como calcular o reajuste necessário da cota condominial?" — mais acionável, conecta ao SimuladorReajusteCota.
- **CAT_TO_NEXTACTION expandido:** +5 categorias — `cobranca`, `trabalhista`, `financeiro`, `areas-comuns`, `manutencao`. Total: 15 categorias com próximo passo.
- **CAT_TO_COMUNICADO expandido:** +`manutencao` (comunicado de serviço) e +`financeiro` (simular reajuste). Total: 9 categorias com bridge Assistente → Ferramentas.

### Entregues na Fase 43
- **Hero reposicionado:** "Recebeu um problema no condomínio?" — chips situacionais (5 situações clicáveis → Assistente + auto-submit). "Ativar monitoramento" passou para link secundário. `onSuggestionSelect` prop adicionado.
- **AskInput situacional:** placeholder mudou para "Morador fez obra sem avisar. O que faço?" — ativa modo mental correto.
- **QuickAccessCards situacionais:** cards agora mostram `examplePrompt` (pergunta real) como texto principal e `title` como label secundário.
- **"Próximo passo" nas respostas:** `CAT_TO_NEXTACTION` em `Response.tsx` — 10 categorias cobertas, renderizado quando `!entry.dica`.
- **CAT_TO_COMUNICADO expandido:** adicionadas categorias `responsabilidade` (registrar ocorrência) e `gestao` (comunicado interno).
- **TOPICS atualizados:** 9 examplePrompts reescritos para linguagem situacional real de síndico.
- **Docs criados:** `laboratorio-cenarios-sindico.md` (50+ cenários), `matriz-maturidade-fluxos.md` (11 fluxos × 7 critérios), `tese-tempo-ate-alivio.md`.

### Entregues na Fase 42
- **SimuladorReajusteCota:** `components/SimuladorReajusteCota.tsx` — calculadora de reajuste de cota condominial. 7 campos, cálculo de arrecadação líquida, despesa projetada, balanço e % mínimo de reajuste. `ssr: false`, disclaimers, telemetria `simulador_reajuste_calculado`.
- **ProximasDatas:** subtitle adicionado — "Vencimentos e manutenções antes que virem urgência."
- **Telemetria:** `simulador_reajuste_calculado` adicionado ao `TelemetryEvent`.
- **Docs:** `visao-futura-financeiro-demonstrativos.md` atualizado (seção SimuladorReajusteCota); RC checklist com grupo 9b.

### Entregues na Fase 41
- **"Próximas datas":** `components/ProximasDatas.tsx` — lista de vencimentos e rotinas calculadas, ordenada por urgência, integrada na aba Início (apenas quando hasCondominioData). Toque em item → Assistente com pergunta contextual.
- **Insight de mandato:** `lib/insights.ts` — cobre janela 90–180 dias de antecipação do fim de mandato (GuidancePanel já cobre ≤ 90 dias)
- **"Perguntar sobre":** `components/PainelOperacional.tsx` — label "Explorar mais" renomeado para eliminar confusão entre ferramenta e atalho de Assistente
- **Visão futura financeiro:** `docs/visao-futura-financeiro-demonstrativos.md` — raciocínio documentado sobre demonstrativo da administradora, previsão orçamentária, reajuste de cota

### Entregues na Fase 40
- **Tese de produto:** `docs/tese-produto-copiloto-operacional.md` — posicionamento, 5 dores campeões, sequência problema→ação, limites jurídicos
- **Campo de mandato do síndico:** `lib/session.ts` (`fimMandatoSindico`), `lib/guidance.ts` (5 níveis de alerta), `components/MemoriaPanel.tsx`, `components/CondominioStatusHeader.tsx`
- **Reposicionamento de copy:** Hero ("Entenda, responda e organize"), Ferramentas ("Ação prática"), Assistente ("Qual é a situação?"), aba Condomínio ("Ativar monitoramento")
- **Integração Assistente → Ferramentas:** `CAT_TO_COMUNICADO` em `components/Response.tsx` — CTAs de comunicado para multas, obras, assembleias, inadimplência/cobrança
- **Onboarding aprimorado:** bridge menciona mandato do síndico; collapsed state orientado a ativação
- **Compatibilidade retroativa:** `fimMandatoSindico` é opcional — backups antigos sem o campo continuam funcionando

### Entregues na Fase 38
- **Admin hardening:** `app/admin/page.tsx` — produção sem `NEXT_PUBLIC_ADMIN_KEY` → bloqueio automático (antes: auto-login)
- **CCT copy fix:** `components/Response.tsx` — aviso regional mais claro sobre limitação CCT SECOVI-Rio
- **Setup Supabase:** `docs/setup-supabase-telemetria.md` — SQL, env vars, queries de acompanhamento
- **Rascunho jurídico:** `docs/rascunho-termos-de-uso.md` e `docs/rascunho-politica-privacidade.md` (LGPD)
- **PWA report:** `docs/resultado-teste-pwa-fase-38.md` — estado técnico + checklist por plataforma
- **Checklist RC atualizado:** tabela de histórico + status por grupo
- **Relatório RC:** `docs/relatorio-rc-interno-fase-38.md`

### Pendências operacionais internas
- **Configurar Supabase** — 15 min, ver `docs/setup-supabase-telemetria.md` (corrigido na Fase 56 — guia agora fiel ao código). Checklist completo no documento.
- **Auditoria /admin ao vivo** — `npm run dev` → `localhost:3000/admin` → "Rodar auditoria". Recall esperado 87% (confirmado offline na Fase 56).
- **Teste PWA em dispositivo físico** — Android (Chrome) e iOS (Safari) — guia: `docs/teste-pwa-dispositivo-real.md`
- **Revisão jurídica** dos rascunhos legais — `docs/rascunho-termos-de-uso.md`, `docs/rascunho-politica-privacidade.md`
- **Canal de feedback** antes de qualquer exposição externa

### Funcionalidades ativas
- 4 abas com navegação Apple-like (BottomNav fixo)
- Aba Início: monitoramento de datas, guidance operacional, dica do dia
- Aba Assistente: 316 entradas KB, motor determinístico, fallback contextual em 16 categorias
- Aba Ferramentas: Gerador de Comunicados (4 modelos), Simulador de Multa/Juros, Checklists (4)
- Aba Condomínio: perfil (editável), memória operacional, timeline, revisão mensal, backup JSON
- Admin (`/admin`): telemetria, auditoria de 83 perguntas (Fase 33), exportação de dados

### Entregues na Fase 37
- **Favicon criado:** `app/favicon.ico` — 32×32 PNG-in-ICO, 177 bytes, sem dependências externas
- **NaN corrigido em MemoriaPanel:** `salvar()` valida `isNaN(dt.getTime())` antes de calcular dias de validade
- **urgencyVencimento() defensivo:** `lib/urgency.ts` retorna `"ausente"` para datas inválidas (antes: `"em-dia"`)
- **AUDIT_CASES atualizados:** 5 casos reclassificados B→A — refletem expansão da KB nas Fases 33–34
- **Auditoria offline confirmada:** `scripts/audit.js` — Recall A 100% (64/64), Bloqueio C 100% (4/4), 72/83 PASS (87%)
- **Guia de teste PWA:** `docs/teste-pwa-dispositivo-real.md` — DevTools, Android, iOS, checklists
- **Relatório RC:** `docs/relatorio-rc-interno-fase-37.md` — 20 grupos, estado por grupo

### Entregues na Fase 36
- **PWA instalável:** ícones criados via script Node.js puro (`scripts/generate-icons.js`)
  → `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`
- **Manifest corrigido:** `app/manifest.ts` com 4 entradas de ícone (192 any, 192 maskable, 512 any, 512 maskable)
- **Layout atualizado:** `app/layout.tsx` referencia apple-touch-icon para iOS
- **Checklist RC:** `docs/checklist-release-candidate-interno.md` — 20 grupos de verificação interna
- **Plano técnico futuro:** `docs/plano-tecnico-ia-rag-fase-36.md` — referência arquivada, não ativa nesta fase

### Qualidade da KB e motor
- Entradas KB: 316 (+5 da Fase 34)
- Motor determinístico: Recall A 100%, Bloqueio C 100% — confirmado offline Fase 37
- Guia editorial: `docs/guia-qualidade-editorial-kb.md`
- Preparação futura da KB: `docs/preparacao-kb-para-rag.md`
- Princípio: não mexer no motor sem bug documentado; foco na qualidade da KB

### Pendências operacionais internas
- **Teste em dispositivo físico:** verificar PWA em Android (Chrome) e iOS (Safari) — guia: `docs/teste-pwa-dispositivo-real.md`
- **Verificação manual grupos 4–16:** fluxo zero dados, onboarding, assistente, ferramentas, backup (relatório RC, seções 4–16)
- **Auditoria ao vivo em /admin:** clicar "Rodar auditoria" e confirmar recall ≥ 75% — esperado 87%
- **Exposição externa:** manter bloqueada até nova decisão explícita do fundador.

---

## Como fazer alterações com segurança

### Antes de alterar qualquer coisa
1. `npx tsc --noEmit` — confirmar zero erros como ponto de partida
2. Identificar o arquivo exato que precisa mudar (não adivinhar)
3. Ler o arquivo inteiro antes de editar (contexto importa)

### Após alteração
1. `npx tsc --noEmit` — zero erros é obrigatório
2. `npx next build` — build limpo, sem warnings críticos
3. Testar a funcionalidade manualmente no browser

### Fluxo de dados
```
localStorage
  └─ lib/session.ts (todas as leituras/escritas passam por aqui)
       ├─ getProfile() / saveProfile()
       ├─ getMemoriaOperacional() / saveMemoriaOperacional()
       ├─ getChecklistStorage() / saveChecklistProgress()
       └─ exportUserData() / importUserData()
```

**Nunca ler localStorage diretamente nos componentes.** Sempre via `lib/session.ts`.

---

## Arquivos críticos e o que cada um faz

| Arquivo | Responsabilidade |
|---|---|
| `lib/data.ts` | Motor de respostas: SYNONYMS, KB, findAnswer(), scoring, fallback |
| `lib/session.ts` | Persistência: todos os acessos ao localStorage |
| `lib/guidance.ts` | Lógica de prioridades operacionais (GuidancePanel) |
| `lib/urgency.ts` | Cálculo de urgência de datas (vencido, urgente, breve, ok) |
| `lib/telemetry.ts` | Eventos de analytics (Supabase, silencioso se não configurado) |
| `lib/checklists.ts` | Definição estática dos 4 checklists |
| `lib/comunicados.ts` | Modelos de comunicados: tipos, campos, função de geração, disclaimers |
| `app/page.tsx` | Orquestrador principal: estado, handlers, renderização por aba |
| `components/BottomNav.tsx` | Navegação inferior fixa |
| `components/ComunicadoPanel.tsx` | Gerador de comunicados — usa lib/comunicados.ts para os templates |
| `components/SimuladorMulta.tsx` | Calculadora de multa e juros (local, estimativa) |
| `components/GuidancePanel.tsx` | Painel de prioridades da aba Início |
| `components/CondominioStatusHeader.tsx` | Header de status da aba Início |
| `components/MemoriaPanel.tsx` | Formulário de datas operacionais (aba Condomínio) |

---

## Como expandir a base de conhecimento (KB)

A KB está em `lib/data.ts` como array `KNOWLEDGE_BASE`. Cada entrada tem:

```typescript
{
  id: "id-unico",
  pergunta: "Como fazer X?",
  resposta: "...",
  keywords: ["palavra", "chave"],
  categoria: "multas",
  suporte: "opcional — texto extra para scoring",
  dica: "opcional — texto após a resposta",
}
```

**Para adicionar uma entrada:**
1. Escolher `id` único (kebab-case, descritivo)
2. Escolher `categoria` existente (ver `CATEGORY_ANCHORS` em data.ts)
3. Escrever `pergunta` como o síndico escreveria (linguagem natural)
4. Escrever `resposta` objetiva: o que pode fazer, o que não pode, o que recomenda
5. Listar `keywords` específicas (o que a pergunta precisa ter para chegar aqui)
6. Rodar `npx tsc --noEmit` para confirmar

**Para testar uma entrada:**
- Abrir `/admin` → seção Auditoria → rodar com a pergunta nova
- Ver se o score é ≥ 14 e se a resposta retornada é a certa

---

## Como adicionar um sinônimo

Em `lib/data.ts`, array `SYNONYMS`:

```typescript
{
  novaPalavra: ["sinonimo1", "sinonimo2"],
}
```

As palavras são normalizadas (sem acento, minúsculas) automaticamente antes do matching.
Sempre rodar `npx tsc --noEmit` após adicionar — TypeScript vai pegar duplicate keys.

---

## Como adicionar um novo comunicado

Em `lib/comunicados.ts`, array `COMUNICADO_TEMPLATES`:

```typescript
{
  id: "meu-modelo" as ComunicadoId, // adicionar ao tipo ComunicadoId também
  icon: "📄",
  title: "Título do modelo",
  description: "Descrição curta para o card seletor",
  disclaimer: "Texto de cautela — aparece abaixo do botão copiar.",
  fields: [
    { id: "campo1", label: "Nome do campo", type: "text", placeholder: "Exemplo" },
  ],
  generate: (v, condoName) => {
    const campo = v.campo1 || "_____";
    return `TÍTULO DO COMUNICADO${condoName ? `\n${condoName}` : ""}

Prezados condôminos,

${campo}

Atenciosamente,
A Administração`;
  },
},
```

Passos:
1. Adicionar o novo `id` ao tipo `ComunicadoId` no topo do arquivo
2. Adicionar o objeto ao array `COMUNICADO_TEMPLATES`
3. `ComunicadoPanel.tsx` renderiza automaticamente todos os modelos do array
4. Rodar `npx tsc --noEmit` para confirmar zero erros

**Limite de modelos no seletor:** o grid é 2×2. Mais de 4 modelos muda o layout para uma lista; ajustar o CSS em ComunicadoPanel se necessário.

---

## Como adicionar um checklist

Em `lib/checklists.ts`, array `CHECKLISTS`:
```typescript
{
  id: "novo-checklist",
  title: "Título",
  icon: "🔧",
  description: "Descrição curta",
  items: [
    { id: "item-1", text: "Primeiro item", critical: true },
    { id: "item-2", text: "Segundo item" },
  ],
  recurrenceDays: 365, // opcional
  recurrenceLabel: "Anual", // opcional
}
```
O ChecklistPanel renderiza automaticamente todos os checklists do array.

---

## Performance e bundle

### Estratégia de carregamento (atualizado na Fase 52)
Components de abas não-iniciais são carregados sob demanda via `next/dynamic` com `ssr: false`.

**Componentes com dynamic import em page.tsx:**
- Aba Ferramentas: ComunicadoPanel, SimuladorMulta, ChecklistPanel, PainelOperacional, SimuladorReajusteCota
- Aba Condomínio: OnboardingProfile, MemoriaPanel, TimelineOperacional, RevisaoMensal, BackupPanel

**Componentes estáticos (carregam no boot — aba Início e Assistente):**
- Header, Hero, DicaDoDia, HomeContextual, CondominioStatusHeader, GuidancePanel, ContextualInsight
- ProximasDatas, PendenciasCard, AskInput, Response, QuickAccessCards
- FavoritesPanel, HistoryPanel (Assistente — pequenos, carregam com a aba)

### Quando o bundle crescer
Se o First Load JS da rota `/` ultrapassar 230 kB, investigar:
1. `npx next build` — ver qual chunk cresceu
2. Verificar imports novos em componentes de aba Início
3. Verificar se um componente grande foi importado estaticamente em page.tsx
4. Avaliar mover para dynamic import

### Não fazer
- Não usar dynamic import para componentes da aba Início (carregam imediatamente)
- Não usar SSR para componentes que leem localStorage (sempre `ssr: false`)

---

## Telemetria — o que acompanhar

Sem Supabase configurado: todos os eventos são silenciosos (no-op).

Para ativar, criar `.env.local` com:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_ADMIN_KEY=<senha-do-painel>
```

Eventos mais importantes para acompanhar:
- `session_open`: quantos usuários abrem o app por dia
- `query_submitted` vs `query_fallback`: taxa de sucesso do assistente
- `onboarding_completed`: quantos ativam o monitoramento
- `comunicado_copiado`: uso real das ferramentas (tipo + campos preenchidos)
- `simulador_calculado`: uso do simulador de multa
- `guidance_resolved`: usuários resolvendo pendências reais

### Privacidade: query bruta nunca é enviada ao Supabase (Fase 49)

A pergunta digitada pelo usuário **nunca é transmitida** para o Supabase. Em vez disso, os eventos de query enviam apenas sinais estruturais:

**`query_submitted`** (match encontrado na KB):
- `matched_id` — ID da entrada KB que respondeu (ex: `"barulho-noite-22h"`) — não é PII
- `categoria` — categoria da resposta (ex: `"multas"`) — não é PII
- `score` — pontuação do match (número inteiro) — não é PII
- `query_length` — comprimento em caracteres da pergunta — não é PII

**`query_fallback`** (sem match):
- `detected_category` — categoria inferida pelo motor mesmo sem match (ex: `"obras"`) — não é PII
- `score` — score máximo atingido (mostra o quão perto chegou) — não é PII
- `blocked_by_domain` — `true` se a pergunta estava fora do escopo condominial — não é PII
- `query_length` — comprimento em caracteres — não é PII

**O que isso permite analisar:**
- Quais categorias da KB são mais consultadas → priorizar melhorias editoriais
- Quais categorias têm mais fallback → lacunas de cobertura
- Score médio dos fallbacks → calibrar limiares do motor
- Se os fora-do-escopo estão sendo bloqueados corretamente

**O que é evitado:**
- Texto literal da pergunta (pode conter nomes, apartamentos, valores)
- Tokens normalizados da query (derivados do texto, igualmente sensíveis)
- Qualquer dado do perfil, memória operacional ou localStorage

**Nota: localStorage é local-only.** O log de queries em `amigo_queries` (via `logQuery()`) permanece no dispositivo do usuário — jamais é transmitido ao Supabase. O painel `/admin` acessa esse log localmente quando não há Supabase configurado.

### Propriedades seguras coletadas (eventos de ferramentas)
- `tipo_comunicado`: qual modelo foi usado ("assembleia", "obra", etc.)
- `campos_preenchidos`: contagem de campos preenchidos (número, não conteúdo)
- `meses`: meses de atraso no simulador (número)
- `usou_valores_padrao`: true se taxas padrão 1% juros / 2% multa foram usadas
- `source`: origem do evento ("ferramentas")

---

## Debugging comum

### "TypeScript error em data.ts" ao adicionar sinônimo
Causa: duplicate key no objeto SYNONYMS.
Fix: procurar a key existente com `grep` e remover o duplicado.

### "Componente não re-renderiza após salvar perfil"
Causa: `refreshKey` não foi incrementado após a ação.
Fix: verificar se o callback `onSaved` ou `onProfileSaved` chama `setRefreshKey(k => k + 1)` em page.tsx.

### "GuidancePanel não mostra nada"
Causa: `hasMemoriaOperacional()` retorna false.
Fix: verificar se há dados em MemoriaPanel. Sem data de vencimento cadastrada, nada aparece.

### "Build falha com chunk too large"
Causa: algum import pesado foi adicionado.
Fix: verificar se o novo componente tem dependências desnecessárias. Remover ou usar dynamic import.

---

## Próximas tarefas prioritárias (pós-Fase 60)

1. **Configurar Supabase** (ação manual — ~15 min) — `docs/setup-supabase-telemetria.md` agora correto e com checklist completo. Telemetria privacy-safe (Fase 49). Bug RLS corrigido no guia (Fase 56).
2. **Rodar auditoria em /admin ao vivo** — `npm run dev` → `localhost:3000/admin` → "Rodar auditoria" — esperado 87% (confirmado offline Fase 56).
3. **Teste PWA em dispositivo físico** — Android (Chrome) e iOS (Safari) — guia: `docs/teste-pwa-dispositivo-real.md`.
4. **Revisão jurídica** dos rascunhos legais (`docs/rascunho-termos-de-uso.md`, `docs/rascunho-politica-privacidade.md`)
5. **Canal de feedback** antes de qualquer exposição externa
6. **Manter sem exposição externa** — ver `docs/consolidacao-interna-sem-beta-fase-45.md`

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-20 (Fase 72)*
*Atualizar a seção "Estado atual" a cada sprint.*
