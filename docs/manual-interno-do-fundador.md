# Manual Interno do Fundador — Amigo do Prédio

> **Guia operacional para continuar o produto de forma autônoma.**
> Escrito para ser lido no início de qualquer nova sessão de trabalho.
> Assume que você sabe programar e quer saber *o que fazer*, não *como fazer*.

---

## Estado atual do produto (2026-05-23 — Fases 87/88/89A)

### Bundle
- Rota principal (`/`): 224 kB First Load JS (margem 6 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS (inalterado)
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues nas Fases 87/88/89A (Onboarding, Plano Supabase e Stubs de Arquitetura)

Três fases complementares que introduzem o fluxo de onboarding de primeiro acesso, documentam o plano técnico de backend e preparam a arquitetura para sincronização futura — sem instalar SDKs, sem auth real e sem alterar package.json.

**Fase 87 — Onboarding / Login UX**
- **`lib/session.ts` — `KEYS.ONBOARDING_COMPLETE`:** nova chave `"amigo_onboarding_complete"` adicionada ao objeto `KEYS`. Centraliza o controle de estado do onboarding junto às demais chaves localStorage.
- **`lib/session.ts` — `isFirstRun()` e `markFirstRunComplete()`:** `isFirstRun()` retorna `true` apenas se o usuário não tem flag de onboarding E não tem perfil — evita falsos positivos para usuários existentes. `markFirstRunComplete()` grava a flag no localStorage. Ambas exportadas. Safe em SSR (guard `typeof window === "undefined"`).
- **`components/onboarding/OnboardingFlow.tsx` (novo):** overlay de 4 etapas renderizado como bottom sheet no mobile (`rounded-t-[28px]`) e card centrado no desktop (`sm:rounded-[28px]`). Fundo cream `#F7F1E8`, backdrop navy/55 com `backdrop-blur-sm`. Etapa 1: boas-vindas + "Começar" + "Pular configuração". Etapa 2: nome do condomínio, tipo de síndico (chips: morador/profissional), tem elevador (chips: Sim/Não). Etapa 3: datas de vencimento AVCB/Seguro/Mandato. Etapa 4: resumo dos dados preenchidos + badge "Dados salvos neste dispositivo" + card neutro "Sincronização em nuvem (em breve)". `finish()` chama `saveProfile()` + `saveMemoriaOperacional()` + `markFirstRunComplete()`. Sem dependências externas — usa apenas funções existentes de `lib/session.ts`.
- **`app/page.tsx` — integração do OnboardingFlow:** `isFirstRun` importado de `@/lib/session`. `OnboardingFlow` carregado via `dynamic()` com `ssr: false`. Estado `showOnboarding` inicializado como `false`; primeiro `useEffect` detecta `isFirstRun()` e ativa o overlay. JSX do overlay posicionado antes de `<BottomNav>` (z-50, fixed, full-screen). `onComplete` fecha o overlay e chama `setRefreshKey` para atualizar a Home.
- **`app/page.tsx` — seção "Conta e sincronização":** seção "Preferências futuras" renomeada para "Conta e sincronização". Exibe: ícone 💾 + "Dados salvos neste dispositivo" + card neutro com ☁️ "Sincronização em nuvem — Em breve". Design consistente com paleta Navy/Cream/Terracotta.

**Fase 88 — Plano técnico Supabase/Backend**
- **`docs/supabase-backend-plan.md` (novo):** documento completo de arquitetura cobrindo visão geral, objetivos, schema (`profiles` + `app_snapshots`), RLS, auth, sync snapshot-based (last-write-wins), integração com bundle (SDK lazy-loaded), privacidade/LGPD, checklist de produção e estratégia de rollback.
- **`supabase/migrations/001_initial_schema.sql` (novo):** SQL executável para criar tabelas `profiles` e `app_snapshots` com triggers `updated_at`, índice único por usuário e todas as políticas RLS.

**Fase 89A — Preparação arquitetural (stubs)**
- **`lib/supabase/client.ts` (novo — stub):** `hasSupabaseConfig()` verifica variáveis de ambiente. `createSupabaseClient()` retorna `null` neste ciclo (SDK não instalado). Interface `SupabaseClientStub` tipifica o contrato futuro.
- **`lib/auth/authClient.ts` (novo — stub):** tipos `AuthUser`, `AuthSession`, `AuthResult` definidos. Funções `signIn`, `signUp`, `signOut`, `getSession` exportadas como async stubs que retornam erros neutros. Sem dependência do SDK.
- **`lib/sync/syncEngine.ts` (novo — stub):** tipos `SnapshotPayload`, `SyncResult` definidos. `buildSnapshot()` funcional — monta o objeto com `UserBackup` + `device_hint`. `uploadSnapshot()` e `downloadSnapshot()` como stubs que retornam `null`/erro neutro. Reutiliza o tipo `UserBackup` de `lib/session.ts`.
- **Limites mantidos:** `@supabase/supabase-js` não instalado. `package.json`, lockfiles, manifest, `.env` inalterados. Nenhuma chamada de rede real. Nenhum login funcional. Nenhuma rota nova.

---

## Estado anterior do produto (2026-05-23 — Fase 86)

### Bundle
- Rota principal (`/`): 223 kB First Load JS (margem 7 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS (inalterado)
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 86 (Agenda Mensal v2 — Ícones Operacionais)

Fase visual e informativa: a Agenda Mensal da Home deixa de ser apenas uma grade com pontinhos e passa a comunicar visualmente a rotina do prédio com ícones operacionais discretos por tipo de evento e vencimento. Nenhuma lógica de dados, nenhuma estrutura da Home, nenhum componente externo foi alterado.

- **`components/AgendaMensal.tsx` — `TYPE_ICONS`:** mapeamento de ícone por tipo de evento manual (`AgendaEventType`) — 13 tipos: assembleia 🧾, manutencao 🛠️, dedetizacao 🌿, caixa_agua 💧, extintores 🧯, vistoria 🔍, obra 🧱, cobranca 📌, reuniao 🧾, fornecedor 📌, comunicado 📢, retorno ↩️, outro 📍.
- **`components/AgendaMensal.tsx` — `SYSTEM_ICONS`:** mapeamento de ícone por label de vencimento monitorado — 10 itens: AVCB 🧯, Seguro 🛡️, Mandato 🗳️, AGO 🧾, Dedetização 🌿, Caixa d'água 💧, Elevador ⬆️, Extintores 🧯, SPDA ⚡, Elétrica 💡. Fallback: 📅.
- **`components/AgendaMensal.tsx` — tipos `SystemEntry` e `ManualEntry`:** campo `icon: string` adicionado a ambos. `buildSystemEntries()` popula o campo via `SYSTEM_ICONS`. `buildEventMap()` popula o campo para entradas manuais via `TYPE_ICONS`. Zero mudança na lógica de datas, filtros ou fontes de dados.
- **`components/AgendaMensal.tsx` — indicadores na grade:** dot de 3px substituído por linha de ícones `text-[8px]` posicionada `absolute bottom-[2px]`, com até 2 ícones visíveis + `+N` para overflow (ex: `+1`). Cor do overflow adaptada ao estado do dia (white/70 em dia selecionado hoje, navy-400 nos demais). Altura da célula `h-[34px]` preservada. Grade mantida legível no mobile pequeno.
- **`components/AgendaMensal.tsx` — lista do dia selecionado:** dot colorido substituído por emoji `text-[15px]` à esquerda com `flex items-start`. Layout de duas linhas: label em `font-medium text-navy-700` (negrito leve) + subtítulo `text-[11px] text-navy-400` ("Vencimento monitorado" para sistema; título truncado ou "Evento manual" para entradas manuais). Espaçamento entre itens aumentado para `space-y-2.5`. Botão "+ Agendar neste dia" e comportamento de navegação intocados.
- **`components/AgendaMensal.tsx` — legenda compacta:** frase única abaixo da lista e do botão: "Ícones indicam vencimentos e eventos operacionais do prédio." — `text-[10px] text-navy-300`. Sem lista de ícones, sem poluição visual.
- **Limites mantidos:** AgendaPredio, HomeCondominioHub, HomeAcaoHub, GuidancePanel, Response, app/page.tsx, lib/session.ts, lib/urgency.ts, lib/data.ts, lib/knowledge.json, package.json, manifest e backup schema inalterados. Sem IA, RAG, backend, login, billing, push, recorrência, nova aba ou nova rota.

---

## Estado anterior do produto (2026-05-22 — Fase 85)

### Bundle
- Rota principal (`/`): 223 kB First Load JS (margem 7 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS (inalterado)
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 85 (Legibilidade Mobile do Assistente)

Fase cirúrgica de legibilidade: remove código morto do componente de resposta e adiciona separação visual clara entre a resposta principal e os blocos auxiliares, melhorando a leitura de respostas longas no mobile.

- **`components/Response.tsx` — remoção de `isTyping` (código morto):** estado `const [isTyping, setIsTyping] = useState(false)` removido — sempre false após Fase 84. Removidos também os dois `setIsTyping(false)` do useEffect e as três condições `!isTyping &&` do JSX (linhas de conteúdo contextual, fallback e action pills). Nenhuma mudança visual — os blocos `!isDefault && entry`, `isDefault && (...)` e `!isLoading && (...)` continuam renderizando exatamente o mesmo conteúdo, apenas sem o guard inútil.
- **`components/Response.tsx` — separação visual de respostas longas:** wrapper dos blocos auxiliares alterado de `mt-4 space-y-2.5` para `mt-5 border-t border-navy-100/60 pt-4 space-y-3`. O `border-t` cria uma linha divisória discreta entre o texto da resposta e os blocos auxiliares (Próximo passo, Contexto do prédio, Base legal, Dica prática), tornando explícito que são camadas de contexto, não continuação do texto. Espaçamento entre blocos aumentado de 10px para 12px (`space-y-2.5` → `space-y-3`). Section: `pb-6` → `pb-8` no mobile (unifica com sm — mais margem inferior). Action pills: `mt-2.5` → `mt-3`. Todos os blocos de conteúdo, lógica de contexto local, fallback, disclaimers, like, copiar, salvar próximo passo, favoritos e histórico preservados integralmente.
- **Limites mantidos:** sem alteração de KB, motor de busca, Agenda, AgendaMensal, HomeCondominioHub, HomeAcaoHub, GuidancePanel, libs, simuladores, package.json, manifest. Sem IA, RAG, backend, login, billing, push, recorrência, nova aba ou nova rota.

### Estado anterior do produto (2026-05-22 — Fase 84)

### Bundle (Fase 84)
- Rota principal (`/`): 223 kB First Load JS (margem 7 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS (inalterado)
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 84 (Confiabilidade do Assistente e Saúde Operacional acionável)

Fase cirúrgica de confiabilidade: elimina percepção de truncamento no Assistente e torna o índice de Saúde Operacional compreensível para o usuário em uso normal com dados preenchidos.

- **`components/Response.tsx` — exibição imediata:** substituído efeito typewriter character-by-character (setInterval 14ms/char) por exibição instantânea do texto completo com `animate-fade-in`. Elimina a percepção de resposta truncada no mobile, que ocorria quando o usuário observava durante a animação — padrões como "Sim. O|" eram o cursor de digitação, não corte real. Cursor piscante (`animate-blink`) removido do JSX. Todos os blocos auxiliares intactos: Próximo passo, Contexto do prédio, Base legal, Dica prática, Checklist operacional, CTA de comunicado, Aviso regional, Aviso de categoria sensível, disclaimer geral. Estado `isTyping` preservado (sempre false — condicionais `!isTyping` no JSX continuam válidas). Motor de busca, KB, GuidancePanel, lógica de contexto local inalterados.
- **`components/HomeCondominioHub.tsx` — microcopy da Saúde Operacional:** duas linhas adicionadas abaixo da `diagnosticPhrase`: (1) "Considera dados cadastrados, alertas ativos, próximos passos e revisão semanal." — explica o que compõe o índice; (2) "Para melhorar: resolva alertas, conclua passos e mantenha os prazos atualizados." — orienta como subir a porcentagem. Cálculo do índice, barra, badge, porcentagem e `lib/health-score.ts` inalterados. Sem modal, tooltip complexo, novo sistema de gamificação ou promessa jurídica.
- **`components/AgendaMensal.tsx`:** não alterado nesta fase.
- **Limites mantidos:** sem IA, RAG, backend, login, billing, push, recorrência, integração externa, nova rota, nova aba. lib/knowledge.json, lib/data.ts, lib/guidance.ts, lib/session.ts, lib/health-score.ts, motor de busca, simuladores, package.json, manifest inalterados.

### Estado anterior do produto (2026-05-22 — Fase 83)

### Bundle (Fase 83)
- Rota principal (`/`): 224 kB First Load JS (margem 6 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS (inalterado)
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 83 (Agenda Central e Home sem redundância)

Agenda do Prédio promovida a coração do produto ao lado do Assistente. Home menos redundante, com hierarquia clara de blocos.

- **`components/AgendaMensal.tsx` (novo):** calendário mensal compacto da Home. Grade de 7 colunas com dias do mês, destaque para hoje e dia selecionado, dots em dias com eventos. Ao tocar em um dia, lista itens abaixo; se não houver eventos, "Nada agendado para este dia." CTA "+ Agendar neste dia" navega para Ferramentas → Rotina do síndico → Agenda. Fontes de dados: eventos manuais de `getAgendaEvents()` (título truncado, tipo genérico, sem nota) + vencimentos automáticos calculados do `getMemoriaOperacional()` (AVCB, Seguro, Mandato, AGO, Dedetização, Caixa d'água, Elevador, Extintores, SPDA, Elétrica) com labels genéricos. Renderizado via `dynamic()` no chunk da Home. Sem IA, push, recorrência, Google Calendar, nova rota.
- **`app/page.tsx` — AgendaMensal integrada:** importada com `dynamic()`. Posicionada entre `HomeCondominioHub` e `GuidancePanel` quando `hasCondominioData === true`. Hierarquia da Home com dados: HomeCondominioHub → AgendaMensal → GuidancePanel → HomeAcaoHub (enxugado).
- **`components/HomeAcaoHub.tsx` — enxugado:** bloco "Próxima data" removido (coberto por AgendaMensal); CTA "Ver agenda →" removido; título "O que fazer agora" → "Próximos passos do prédio"; CTA "Perguntar ao Assistente →" adicionado com prop `onNavigateToAssistente`; prop `onNavigateToAgenda` removida. Revisão semanal, pendências (add/complete), CTA registrar ocorrência e telemetria preservados.
- **`components/BottomNav.tsx`:** label "Condomínio" → "Minha Conta". `id: "condominio"`, `AppTab`, lógica interna e estrutura da aba inalterados. Preparação conceitual da área do cliente — sem login, billing, backend ou conta real.
- **`components/QuickAccessCards.tsx` — temas com perguntas:** reorganizado para fluxo tema→pergunta→ação. Cards agora mostram título do tema e "Ver perguntas →". Ao clicar no card, exibe lista de 5 perguntas sugeridas (definidas em `THEME_QUESTIONS` inline — sem tocar lib/data.ts, KB ou motor). Ao clicar em uma pergunta, preenche o input normalmente (mesma lógica de `onSelect` anterior). Botão "← Temas" volta à grade. Comportamento colapsado preservado.
- **Limites mantidos:** sem IA, RAG, backend, login real, push, recorrência, integração externa (Google Calendar, Apple Calendar), nova rota, nova aba, app store, OCR, upload, inadimplência por unidade, gestão financeira. lib/knowledge.json, lib/data.ts, lib/guidance.ts, motor de busca, simuladores, package.json, manifest inalterados.

### Hierarquia da Home com dados (Fase 83)

1. HomeCondominioHub — saúde operacional, índice, sinais
2. AgendaMensal — calendário do mês, eventos, vencimentos
3. GuidancePanel — alertas críticos e de atenção, prioridades
4. HomeAcaoHub — próximos passos, revisão semanal, CTAs (Registrar + Assistente)
5. ContextualInsight — condicional (apenas sem alerta crítico/pendente)
6. HomeContextual — condicional
7. DicaDoDia — condicional

### "Minha Conta" — preparação

BottomNav agora exibe "Minha Conta". A aba continua sendo `id: "condominio"` internamente. A área ainda não tem login, billing, conta real ou backend. É apenas um reposicionamento conceitual que prepara a linguagem para quando a área do cliente evoluir.

---

## Estado anterior do produto (2026-05-21 — Fase 82)

### Bundle
- Rota principal (`/`): 222 kB First Load JS (margem 8 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully (inalterado — fase documental)

### Entregues na Fase 82 (Documento técnico de IA futura — sem implementação)

Fase exclusivamente documental. Nenhum arquivo de código, componente, lib, bundle ou runtime foi alterado.

- **`docs/plano-futuro-ia-assistente.md` (novo — documento central):** registro técnico e estratégico consolidado sobre a possibilidade futura de IA no Assistente. 15 seções: resumo executivo, quando usar/não usar IA, arquitetura proposta, backend necessário, guardrails, prompt base (apenas documentação), dados permitidos/proibidos, logs e privacidade, estimativa de custo, critérios antes de implementar, estratégia de rollout, riscos e decisão atual.
- **IA continua não implementada.** O Assistente permanece 100% determinístico com contexto local (Fase 81).
- **Decisão registrada:** IA só será avaliada após telemetria ativa com dados reais, taxa de fallback real > 30%, backend seguro, política de privacidade, termos de uso e revisão jurídica prontos.
- **GuidancePanel, saúde operacional, agenda, simuladores e alertas de prazos permanecem determinísticos** independentemente de qualquer IA futura.
- **Documentos anteriores relacionados preservados:** `plano-futuro-ia-rag-contextual.md` (Fase 64), `plano-ia-rag-futuro.md` (Fase 34–36), `plano-tecnico-ia-rag-fase-36.md` (Fase 36) — o novo documento é o mais atualizado e deve ser consultado como referência primária.

---

## Estado anterior do produto (2026-05-21 — Fase 81)

### Bundle
- Rota principal (`/`): 222 kB First Load JS (margem 8 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 81 (Assistente contextual sem IA)

Extensão determinística do Assistente: respostas agora consideram dados locais já cadastrados quando o tema da pergunta tem relação clara com esses dados. Nenhuma IA, RAG, backend ou KB alterados.

- **`components/Response.tsx` — `getLocalContextNotice()` estendido:** adicionados dois novos contextos ao bloco "Contexto do prédio" já existente:
  - **Barulho/ocorrência:** detectado por palavras-chave simples (barulho, reclamação, perturbação, vizinho, morador). Exibe sugestão de registrar ocorrência e criar próximo passo. Sem dados locais sensíveis, texto fixo.
  - **Agenda futura:** importa `getUpcomingAgendaEvents(90)` de `lib/session.ts`. Para temas de manutenção (filtra tipos: manutencao, dedetizacao, caixa_agua, extintores, vistoria), exibe mensagem se houver evento futuro relacionado. Para temas de assembleia (filtra tipos: assembleia, reuniao), idem. Sem expor título, nota ou data exata do evento.
- **Tipo `LocalContextNotice.contextType` estendido:** de `"avcb" | "seguro" | "mandato" | "manutencao"` para `"avcb" | "seguro" | "mandato" | "manutencao" | "barulho" | "agenda"`.
- **Telemetria `local_context_notice_shown` preservada:** evento existente absorve os novos `context_type` sem alteração em `lib/telemetry.ts`. Sem envio de título, nota, data, unidade, query ou dados sensíveis.
- **Fallback mais honesto:** texto atualizado de "Não encontrei uma orientação específica na base atual..." para "Não encontrei uma orientação específica para essa situação na base atual. Use a resposta como ponto de partida e, se envolver risco jurídico, financeiro, trabalhista ou técnico, confirme com profissional habilitado." Três sugestões discretas em texto adicionadas: reformular a pergunta, registrar como ocorrência, criar próximo passo. Sem botões novos, sem navegação, sem alterar `app/page.tsx`.
- **Limites mantidos:** motor de busca inalterado, KB inalterada, GuidancePanel inalterado, HomeAcaoHub inalterado, AgendaPredio inalterado, sem IA, sem RAG, sem backend.
- **Hipóteses futuras (não implementadas):**
  - *IA no Assistente:* continua hipótese futura; depende de backend seguro, custo, logs sem PII e revisão jurídica.

---

## Estado anterior do produto (2026-05-21 — Fase 80)

### Bundle
- Rota principal (`/`): 222 kB First Load JS
- Admin (`/admin`): 204 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 80 (Conta & Dados — reorganização interna da aba Condomínio)

Reorganização visual e conceitual da aba Condomínio sem nenhuma feature nova. Sem login, cobrança, backend, conta real, termos completos ou suporte ativo.

- **Cabeçalho interno atualizado em `app/page.tsx`:** quando há dados cadastrados, título muda de "Dados do prédio" para "Conta & Dados"; subtitle atualizado para "Dados do prédio, histórico, backup e preferências do app." Sem dados, mantém "Ativar monitoramento" e copy original.
- **Rótulos de seção discretos:** quando `hasCondominioData`, quatro marcadores visuais aparecem acima de cada grupo — "Dados do prédio", "Vencimentos e rotinas", "Histórico operacional", "Backup e segurança". Apenas labels de texto uppercase/tracking; nenhum componente interno alterado.
- **Bloco estático "Suporte e termos":** informa que suporte, termos de uso e política de privacidade serão adicionados antes de qualquer versão comercial. Sem formulário, sem e-mail, sem integração externa. Aparece sempre, incluindo estado sem dados.
- **Bloco estático "Preferências futuras":** informa que conta, cor do app, notificações e assinatura são hipóteses futuras. Sem toggle, sem persistência, sem backend. Aparece sempre.
- **BottomNav inalterado:** label "Condomínio" preservado no menu inferior.
- **Arquivos de componentes inalterados:** `OnboardingProfile`, `MemoriaPanel`, `TimelineOperacional`, `RevisaoMensal`, `BackupPanel` — nenhum tocado. `id="revisao-mensal"` preservado para scroll do link de Revisão Mensal.
- **Hipóteses futuras (não implementadas):**
  - *"Minha Conta":* aba poderá evoluir para área de conta real quando houver login, billing, suporte e termos finalizados — não implementar antes disso.
  - *IA no Assistente:* fallback ancorado na KB; depende de backend seguro e revisão jurídica.

### Diretriz comercial atual

O Amigo do Prédio segue como produto pré-beta interno. Ainda não é vendável, não deve ser apresentado como beta para síndicos, não deve receber tráfego pago e não deve ser posicionado como SaaS pronto.

Posicionamento correto nesta etapa: copiloto operacional leve para síndicos que precisam acompanhar prazos, organizar ações e decidir com mais clareza.

O produto não é advogado virtual, consultoria jurídica, substituto da administradora, ERP condominial, ferramenta de compliance completo ou app B2B para administradoras.

Features seguem congeladas fora de entregas pequenas e justificadas. O trabalho permitido é reduzir risco, melhorar observabilidade, reforçar confiança e consolidar o ciclo existente: dúvida → ação → acompanhamento → histórico.

Supabase é apenas telemetria interna opcional. Não é backend de persistência, não sincroniza dados do condomínio, não substitui localStorage e não deve receber PII.

Critérios mínimos antes de cogitar venda: smoke test interno repetido sem bug crítico, telemetria interna ativa ou validada, termos/disclaimers revisados, backup confiável, evidência de retorno recorrente e suporte esperado documentado.

---

## Estado anterior do produto (2026-05-21 — Fase 79)

### Bundle
- Rota principal (`/`): 221 kB First Load JS (margem 9 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 79 (Agenda do Prédio v1)

Lista leve de eventos operacionais futuros integrada à Rotina do síndico. Sem calendário mensal, sem recorrência, sem push, sem nova aba, sem rota, sem modal obrigatório.

- **`components/AgendaPredio.tsx` (novo):** formulário de criação (título, data, tipo, nota, opção de criar próximo passo vinculado), lista de pendentes ordenados por data com urgência por cor, concluir/excluir com confirmação, lista colapsável de concluídos. Disclaimer operacional ao fim.
- **13 tipos de evento:** assembleia, manutencao, dedetizacao, caixa_agua, extintores, vistoria, obra, cobranca, reuniao, fornecedor, comunicado, retorno, outro.
- **`lib/session.ts`:** `AgendaEventType`, `AgendaEvent`, `KEYS.AGENDA = "amigo_agenda"`, `"agenda"` adicionado ao union `Pendencia.origem`. 7 funções: `getAgendaEvents`, `addAgendaEvent`, `updateAgendaEvent`, `completeAgendaEvent`, `deleteAgendaEvent`, `getUpcomingAgendaEvents`, `getAgendaEventById`.
- **Backup v4:** `UserBackup.version` agora inclui `"4"`, com campo `agenda?: AgendaEvent[]`. Import/export/validate atualizados. v1/v2/v3 continuam funcionando sem quebra — ao importar backup antigo, `KEYS.AGENDA` é limpo.
- **`HomeAcaoHub`:** evento mais urgente da agenda compete com datas monitoradas. Quando a agenda vence, seção muda de "Próxima data" para "Próximo na agenda". CTA "Ver agenda →" adicionado ao lado de "+ Registrar ocorrência →". Prop `onNavigateToAgenda` conectada em `app/page.tsx`.
- **`TimelineOperacional`:** eventos de agenda concluídos entram como "Item da agenda concluído" (📅) sem expor título, nota ou data exata.
- **Telemetria (3 eventos):** `agenda_event_created`, `agenda_event_completed`, `agenda_event_deleted` — propriedades: `type`, `days_until`, `has_note`, `has_linked_step`. Sem título, nota, data, local ou PII.
- **`app/page.tsx`:** `"agenda-predio"` adicionado ao tipo `ToolAnchor` e ao `ANCHOR_TO_GROUP`. `AgendaPredio` exibido abaixo de `RegistroRapido` dentro do grupo "Rotina do síndico". `handleNavigateToAgenda` conectado.
- **`BackupPanel.tsx`:** texto de exportação atualizado para "Backup v4: memória, próximos passos, ocorrências e agenda". Summary de importação mostra contagem de eventos da agenda.
- **Hipóteses futuras documentadas (não implementadas):**
  - *IA no Assistente:* fallback ancorado na KB, não substituto do GuidancePanel; depende de backend seguro, custo, logs sem PII e revisão jurídica; antes da IA, melhorar contexto local determinístico.
  - *Condomínio → Conta:* aba poderá evoluir para "Conta" quando houver login, billing, suporte e termos — não implementar antes disso para evitar expectativa falsa.

### Diretriz comercial atual

O Amigo do Prédio segue como produto pré-beta interno. Ainda não é vendável, não deve ser apresentado como beta para síndicos, não deve receber tráfego pago e não deve ser posicionado como SaaS pronto.

Posicionamento correto nesta etapa: copiloto operacional leve para síndicos que precisam acompanhar prazos, organizar ações e decidir com mais clareza.

O produto não é advogado virtual, consultoria jurídica, substituto da administradora, ERP condominial, ferramenta de compliance completo ou app B2B para administradoras.

Features seguem congeladas fora de entregas pequenas e justificadas. O trabalho permitido é reduzir risco, melhorar observabilidade, reforçar confiança e consolidar o ciclo existente: dúvida → ação → acompanhamento → histórico.

Supabase é apenas telemetria interna opcional. Não é backend de persistência, não sincroniza dados do condomínio, não substitui localStorage e não deve receber PII.

Critérios mínimos antes de cogitar venda: smoke test interno repetido sem bug crítico, telemetria interna ativa ou validada, termos/disclaimers revisados, backup confiável, evidência de retorno recorrente e suporte esperado documentado.

---

## Estado anterior do produto (2026-05-21 — Fase 78)

### Bundle
- Rota principal (`/`): 221 kB First Load JS (margem 9 kB — abaixo do limite de 230 kB)
- Admin (`/admin`): 204 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 77 (Reset seguro, feedback de backup e validação do Assistente)

Ciclo de controle interno e testabilidade. Nenhuma feature nova de produto adicionada. Sem IA, login, billing, backend, WhatsApp, nova aba, KB, guidance, schema de backup ou motor de busca alterados.

- **Reset seguro (`components/BackupPanel.tsx`):** nova seção discreta "Novo condomínio / limpar dados" abaixo de Exportar/Restaurar. Fluxo de 3 estados: idle → confirming → done. O estado confirming exige digitar "APAGAR" antes de habilitar o botão "Apagar dados". Após confirmar, chama `clearAllData()` e reutiliza `onImported?.()` para disparar `setRefreshKey` e atualizar o app para estado zerado. Exibe feedback "Dados apagados. Você pode começar um novo condomínio." Nenhum dado apagado sem confirmação explícita.
- **`clearAllData()` em `lib/session.ts`:** função centralizada que remove todas as 18 chaves `amigo_*` via `Object.values(KEYS).forEach(removeItem)`. SSR-safe (`typeof window === "undefined"`). Reutiliza o `KEYS` existente. Não altera schema de backup v1/v2/v3. Não cria backup v4.
- **Feedback de exportação (`components/BackupPanel.tsx`):** após clicar "Exportar dados", exibe mensagem `"Backup exportado: amigo-do-predio-backup-YYYY-MM-DD.json"` que desaparece após 4 s. Não altera formato, conteúdo ou versão do backup. Não envia dados para servidor.
- **Validação do Assistente (sem alteração de código):** `Response.tsx` inspecionado — o card principal não tem `max-height`, `overflow: hidden` ou qualquer constraint de altura. Texto da resposta principal (`<p>` com `text-[15px] leading-[1.7]`) e conteúdo contextual (próximo passo, base legal, dica, veja também) renderizam sem truncamento real. Nenhuma correção necessária.
- **Smoke test:** seções 16 e 17 adicionadas ao `docs/smoke-test-interno.md` — roteiro do reset seguro (10 itens) e roteiro das 5 perguntas do Assistente com critérios detalhados.
- **Bundle:** 221 kB (sem variação vs Fase 76B). Margem 9 kB.

---

## Estado anterior do produto (2026-05-20 — Fase 73)

### Bundle
- Rota principal (`/`): 225 kB First Load JS (margem 5 kB — abaixo do limite de 230 kB)
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

### Entregues na Fase 73 (Home enxuta, Saúde Operacional e Central de Ações)

Reorganização da arquitetura de informação da Home e da aba Ferramentas. Nenhuma feature nova adicionada.

- **Hub "Saúde operacional" (`components/HomeResumoPredio.tsx`):** substituído o card "Hoje no prédio" por um hub com status qualitativo de 5 níveis: *Crítico / Atenção / Em evolução / Bem acompanhado / Tudo em ordem*. Status determinístico baseado em sinais locais (prazos críticos, alertas de atenção, passos parados há mais de 14 dias, dados essenciais completos, pendências abertas, ocorrências da semana). Frase diagnóstica contextual e chips indicadores (até 5). Sem score numérico, sem porcentagem, sem linguagem de regularidade legal, sem gamificação.
- **Hub posicionado antes do GuidancePanel:** a Home responde "Como está meu prédio agora?" antes de mostrar as ações urgentes.
- **CondominioStatusHeader simplificado:** removidas as linhas de item por item (AVCB, Seguro, Mandato, etc.) que duplicavam o GuidancePanel. O header mantém apenas: nome do condomínio + badge geral + contagem de itens em dia ("X itens em dia"). GuidancePanel continua sendo o único lugar com detalhe e ação por item.
- **RegistroRapido movido para Ferramentas:** saiu da aba Início como formulário completo. Entrou na aba Ferramentas no grupo "Rotina do síndico" (primeiro item). Na Home, mantido apenas atalho discreto "+ Registrar ocorrência" que navega para Ferramentas.
- **Ferramentas em grupos visuais:** aba Ferramentas reorganizada com cabeçalhos de seção: *Rotina do síndico / Comunicados / Simuladores / Checklists*. PainelOperacional permanece ao final como área de exploração por tema. Sem nova rota, sem modal complexo, sem nova ferramenta.
- **Aba Condomínio: copy de papel:** título alterado de "Memória do prédio" para "Dados do prédio" quando há dados cadastrados. Subtitle adicionado: "Dados que alimentam o monitoramento de prazos e alertas do app." Clarifica o papel da aba sem criar conta, login ou pagamento.
- **Bundle:** 225 kB (−1 kB vs Fase 72). Margem: 5 kB. Simplificação do CondominioStatusHeader reduziu o JS ligeiramente.
- **Sem IA, login, billing, backend, WhatsApp, nova aba, KB, guidance, backup, simuladores ou motor de busca alterados.**

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

---

## Fase 75 — Índice de Saúde Operacional (2026-05-20)

Adicionado `SaudeOperacionalPanel` na aba Condomínio (guarded por `hasCondominioData`, antes de `OnboardingProfile`).

**O que é:** percentual operacional local (0–100%) indicando organização dos dados cadastrados no app. Determinístico, 100% client-side, sem IA, sem backend, sem Supabase, sem dado remoto.

**Não é:** indicação de regularidade jurídica, compliance, ausência de risco ou garantia de qualquer natureza. Proibido usar: "100% regular", "regularizado", "sem risco", "compliance", "conformidade", "saúde jurídica", "garantia", "segurança jurídica".

**Score (MAX_RAW = 90, normalizado para 100%):**
- Essenciais (AVCB/Seguro/Mandato): 30 pts
- Estado de alertas (guidance crítico/atenção): 20 pts
- Próximos passos (stale/contagem): 15 pts
- Revisão semanal concluída: 10 pts
- Rotinas cadastradas (proporcional a 3+): 10 pts
- Ocorrência com hasNextStep (semana): 5 pts

**Faixas:** 0–39 Crítico · 40–59 Atenção · 60–79 Em evolução · 80–94 Bem acompanhado · 95–100 Tudo em ordem

**Arquivos:** `lib/health-score.ts` (novo), `components/SaudeOperacionalPanel.tsx` (novo), `app/page.tsx` (dynamic import + render condicional). Nenhum arquivo congelado foi alterado.

---

---

## Fase 76 — Saúde Operacional compacta no Início (2026-05-20)

`SaudeOperacionalPanel` agora aceita `variant?: "full" | "compact"`.

- **Início:** renderiza `variant="compact"` — exibe porcentagem, barra, frase diagnóstica, até 3 sinais (fatores missing/partial) e microcopy "Baseado nos dados cadastrados no app."
- **Condomínio:** mantém `variant="full"` — fatores completos, sugestões, disclaimer intactos.

`HomeResumoPredio` foi removido da renderização do Início (arquivo não modificado). Eliminada redundância entre os dois blocos de "Saúde operacional" na Home.

Ordem da Home com dados: CondominioStatusHeader → SaudeOperacionalPanel compact → GuidancePanel → RevisaoSemanalCard → PendenciasCard → demais blocos.

Sem IA, login, billing, backend, nova aba, promessa jurídica ou compliance. Nenhum arquivo congelado alterado.

---

---

## Fase 76B — Home consolidada em dois hubs (2026-05-20)

Reorganização da Home para responder duas perguntas em poucos segundos:
- "Como está meu prédio?" → Hub 1
- "O que fazer agora?" → Hub 2

**Hub 1 — `HomeCondominioHub`**: substitui `CondominioStatusHeader` + `SaudeOperacionalPanel compact`. Um único card com nome do prédio, porcentagem de saúde operacional, barra, frase diagnóstica, até 3 sinais e microcopy "Índice operacional baseado nos dados cadastrados no app." Usa `computeHealthScore()` + `getProfile()`.

**Hub 2 — `HomeAcaoHub`**: substitui `RevisaoSemanalCard` + `PendenciasCard` + `ProximasDatas` + botão RegistroRapido. Um único card com 4 seções: revisão semanal (status + "Revisar agora"), próximos passos (lista top 3 com conclusão + adicionar), próxima data mais urgente, atalho "Registrar ocorrência →".

**Aba Condomínio**: `SaudeOperacionalPanel full` removido. A aba volta a focar nos dados (OnboardingProfile, MemoriaPanel, TimelineOperacional, RevisaoMensal, BackupPanel).

Ordem final do Início com dados: HomeCondominioHub → GuidancePanel → HomeAcaoHub → Contextual/Dica.

"Home motiva, Condomínio alimenta. GuidancePanel detalha e permite ação."

Sem IA, login, billing, backend, nova aba, promessa jurídica ou compliance. Nenhum arquivo congelado alterado. Bundle `/` mantido.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-20 (Fase 76B)*
*Atualizar a seção "Estado atual" a cada sprint.*
