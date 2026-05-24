# Plano Pré-Beta — Amigo do Prédio

> **Documento operacional interno — uso do fundador.**
> Criado em 2026-05-24. Derivado do Relatório Técnico-Comercial (mesma data).
> Transforma análise estratégica em ação concreta para os próximos 7–14 dias.
> Foco: preparar o produto para os primeiros síndicos reais sem comprometer a tese.

---

## 1. Estado atual em uma página

### O que o produto já é hoje

O Amigo do Prédio é um PWA mobile-first funcional e visualmente premium, com todas as funcionalidades centrais implementadas e funcionando:

- **Home** — cockpit operacional com calendário mensal (HomeAgendaCard), índice de saúde clicável (HomeSaudeCard), 3 cards de ação rápida com badges (HomeQuickStats), GuidancePreview motivador para estado sem dados.
- **Agenda** — criação, lista com urgência, concluir/excluir, histórico, integração com Home.
- **Saúde Operacional** — tela full-screen com ring SVG, 5 níveis de status, áreas monitoradas e últimos registros.
- **Pendências** — 3 abas (Abertas / Em andamento / Concluídas), próximos passos com checklist visual, marcação com animação.
- **Assistente** — 4 categorias em accordion com chips de subtema, motor determinístico 4 camadas, 316 entradas KB, 87% recall, 0 falha crítica em 83 perguntas de auditoria.
- **Ferramentas** — 4 grupos: rotina (registro rápido + agenda), comunicados (4 modelos), simuladores (multa + reajuste), checklists (4 operacionais).
- **Conta/Condomínio** — Onboarding 4 etapas, MemoriaPanel, BackupPanel v4, TimelineOperacional, RevisaoMensal. Funcional; visual ainda não atingiu nível premium das demais telas.
- **Onboarding** — overlay 4 etapas ativo no primeiro acesso via `isFirstRun()`. Permite pular etapas.

### O que ainda é local

**Tudo.** Todos os dados do condomínio vivem no `localStorage` do dispositivo do usuário em 18 chaves `amigo_*`. Não há conta, não há login, não há dado no servidor além da telemetria.

### O que já está em produção

- Telemetria Supabase REST confirmada funcionando: POST `/rest/v1/events` retorna 201.
- `/admin` exibindo **"Fonte: Supabase (dados reais)"** com sessões, queries, fallback e distribuição de habit tier.
- App publicado na Vercel com deploy automático a cada push em `main`.
- PWA instalável em Android e iOS.

### O que a telemetria permite observar hoje

- Contagem de sessões únicas, retorno, duração.
- Queries ao Assistente: categoria respondida, score, taxa de fallback.
- Categorias com mais fallback (onde expandir a KB).
- Adoção do monitoramento: `memoria_saved`, `onboarding_completed`.
- Uso de ferramentas: comunicados copiados, simuladores calculados, pendências criadas/concluídas.
- Revisão semanal e mensal.

**Limitação atual:** os dados de telemetria são de sessões internas de desenvolvimento. Nenhum dado de síndico real existe ainda.

### Qual é o estágio real

**Pré-beta interno avançado.** O produto está tecnicamente completo, visualmente premium, com base de conhecimento auditada e telemetria ativa. Faltam dois pré-requisitos não-técnicos (revisão jurídica dos termos + smoke test físico) antes de mostrar para o primeiro síndico real.

---

## 2. Objetivo do pré-beta

### Para que serve o pré-beta

O pré-beta não existe para escalar. Existe para descobrir se síndicos reais entendem o produto, cadastram dados mínimos, voltam ao app e usam Agenda/Assistente/Pendências sem suporte constante — e para identificar os 3–5 problemas de jornada que o fundador, por estar imerso no produto, não consegue enxergar sozinho.

### O que queremos aprender

1. O síndico entende o que o app faz nos primeiros 2 minutos, sem explicação?
2. Ele preenche os dados do onboarding (AVCB, seguro, mandato) sem instrução adicional?
3. Ele faz mais de uma pergunta no Assistente na primeira sessão?
4. Ele volta ao app após o primeiro uso? Em quanto tempo?
5. Qual a primeira coisa que ele clica? Qual funcionalidade ele ignora completamente?
6. Ele consegue exportar um backup sem ajuda?
7. Qual a taxa de fallback real com perguntas de síndico de verdade?
8. Há algum bug visual grave em dispositivo físico que não aparece no desktop?

### O que NÃO queremos validar ainda

- Se ele pagaria (deixar para depois da segunda semana de uso).
- Se funciona para síndico profissional com múltiplos condomínios (não é o caso de uso alvo agora).
- Se a IA ou RAG seria útil (não existe e não deve existir antes de ter dados de fallback real).
- Se a integração com WhatsApp seria melhor (fase 4, longe daqui).
- Se o modelo de negócio está correto (validar retenção antes de preço).

### Número ideal de usuários iniciais

**3 a 5 síndicos.** Menos do que 3 não gera padrão. Mais do que 5 no primeiro ciclo é mais difícil de acompanhar com qualidade de observação. O objetivo é profundidade, não amostra estatística.

### Perfil dos usuários ideais para o primeiro beta

- Síndico morador, 35–60 anos, eleito em assembleia.
- Usa smartphone Android ou iPhone regularmente.
- Condomínio de 15–80 unidades (não prédio de 2 aptos nem condomínio de 500).
- Tem algum problema atual ativo (inadimplência, obra, assembleia pendente) — garante motivação real.
- Do relacionamento próximo do fundador — facilita conversa aberta sobre o que não funcionou.
- **Não** é advogado, administrador de condomínios profissional nem programador — queremos a persona real não-técnica.

---

## 3. Critérios mínimos antes de mostrar para usuários reais

Legenda: ✅ pronto | ⚠️ precisa revisar | ❌ pendente | 🚫 não obrigatório para beta

| # | Critério | Status | Observação |
|---|---|---|---|
| 1 | UI principal consistente (Home, Agenda, Saúde, Pendências, Assistente, Ferramentas) | ✅ pronto | UI-1 a UI-4 concluídas |
| 2 | Onboarding claro e funcional | ✅ pronto | 4 etapas, permite pular, detecta first run corretamente |
| 3 | Disclaimers jurídicos nas respostas do Assistente | ✅ pronto | Presentes em cada resposta — mas linguagem precisa de revisão |
| 4 | Política de privacidade mínima | ⚠️ precisa revisar | Rascunho existe (`docs/rascunho-termos-de-uso.md`) — não revisado por advogado |
| 5 | Termos de uso mínimos | ⚠️ precisa revisar | Mesmo rascunho — revisão jurídica é bloqueador real |
| 6 | Backup/export funcionando e documentado | ✅ pronto | BackupPanel v4, export JSON, import com validação, reset com confirmação "APAGAR" |
| 7 | Reset seguro com confirmação | ✅ pronto | Confirmar digitando "APAGAR" — protege contra acidente |
| 8 | Telemetria registrando uso real | ✅ pronto | POST 201 confirmado, /admin com dados reais |
| 9 | /admin lendo dados do Supabase | ✅ pronto | "Fonte: Supabase (dados reais)" confirmado |
| 10 | Base de conhecimento com cobertura mínima nos temas principais | ⚠️ precisa revisar | LGPD com apenas 6 entradas, financeiro com 14 — abaixo do ideal |
| 11 | Fluxo de primeiro uso compreensível sem instrução | ✅ pronto | GuidancePreview + onboarding guiam o novo usuário |
| 12 | Estado vazio bem tratado em todas as telas | ✅ pronto | GuidancePreview na Home; mensagens de estado vazio no Assistente e Agenda |
| 13 | Mobile responsivo testado em dispositivo físico | ⚠️ precisa revisar | Testado em desktop/DevTools — falta teste em iOS e Android físico real |
| 14 | Bugs críticos ausentes | ⚠️ pendente | Depende do smoke test físico (item 13) |
| 15 | Tela Conta visualmente consistente com restante do app | ⚠️ precisa revisar | Funcional mas não atingiu nível visual premium das demais telas |
| 16 | Canal de feedback ativo (WhatsApp direto ou formulário) | ❌ pendente | Não existe ainda — bloqueador antes do primeiro convite |
| 17 | Instrução de backup no onboarding | ❌ pendente | Onboarding atual não menciona backup — risco de perda de dados |
| 18 | Roteiro de convite para beta com expectativas claras | ❌ pendente | Falta texto de convite, instrução de uso e formulário de feedback |
| 19 | Auth / login real | 🚫 não obrigatório | Dados locais são suficientes para beta pequeno |
| 20 | Sincronização em nuvem | 🚫 não obrigatório | Backup manual cobre o risco para 5 usuários |
| 21 | Notificações push | 🚫 não obrigatório | Agenda e health score cobrem lembretes in-app |
| 22 | Landing page | 🚫 não obrigatório | Para beta de relacionamento, link direto é suficiente |

**Bloqueadores reais antes do primeiro convite:**
1. Revisão jurídica de termos de uso e política de privacidade (externo).
2. Smoke test físico em iOS e Android.
3. Canal de feedback ativo.
4. Roteiro de convite escrito.

---

## 4. Riscos que precisam ser mitigados antes do beta

### Riscos jurídicos

| Risco | Descrição | Mitigação atual | Ação antes do beta |
|---|---|---|---|
| **Parecer como consultoria jurídica** | Síndico segue orientação do app e tem problema → responsabiliza o produto | Disclaimers em cada resposta, linguagem condicional | Revisar toda linguagem de certeza absoluta; garantir que nenhuma frase diz "você pode" ou "é permitido" sem ressalva |
| **Risco OAB** | Entendimento de que orientação automatizada é exercício ilegal da advocacia | Posicionamento como "orientação informativa" + analogia com manual prático | Advogado revisar os termos e confirmar o posicionamento antes do primeiro usuário externo |
| **Promessa excessiva** | Síndico toma decisão grave (demitir, multar, cobrar judicialmente) com base em resposta imprecisa | Fallback honesto, score de confiança exibido ("Pode variar"), disclaimers por categoria | Não remover nenhum disclaimer existente; revisar respostas de categorias críticas (trabalhista, financeiro, cobrança judicial) |
| **LGPD — dados condominiais** | Dados de moradores e funcionários no dispositivo do síndico | Tudo local, sem PII na telemetria | Garantir que o texto dos termos menciona que dados ficam no dispositivo do usuário; mencionar no onboarding |
| **LGPD — telemetria** | Eventos enviados ao Supabase podem conter dados pessoais | Zero PII nos 47 tipos de evento — confirmado em auditoria | Manter a regra: nenhum texto livre, nenhum dado de unidade/morador/data real nos eventos |

### Riscos de produto

| Risco | Descrição | Mitigação atual | Ação antes do beta |
|---|---|---|---|
| **Usuário não preenche dados** | Sem AVCB/seguro/mandato cadastrados, health score e alertas entregam valor zero | GuidancePreview com exemplos mockados | Tornar o valor do monitoramento mais explícito no onboarding — mostrar *o que acontece* quando os dados são preenchidos |
| **App parece vazio sem onboarding** | Síndico abre, não entende o que fazer, fecha | GuidancePreview, Hero com CTA | Validar se o síndico conclui o onboarding sem instrução adicional no smoke test real |
| **Confusão entre Agenda, Saúde, Pendências e Assistente** | Usuário não entende qual tela usar para qual situação | Labels claros na BottomNav, subviews hierarquicamente ligadas à Home | Observar silenciosamente durante o teste com síndico — não explicar, só observar |
| **Falta de hábito de retorno** | Usuário usa uma vez e não volta | Alertas de prazo criam utilidade recorrente automática | Confirmar com o beta tester se ele voltou espontaneamente após 3 e 7 dias |
| **Excesso de telas** | Síndico se perde na navegação | 5 abas fixas com labels claros; home é o centro de entrada | Não adicionar features durante o beta — observar o que já existe |

### Riscos técnicos

| Risco | Severidade | Mitigação atual | Ação antes do beta |
|---|---|---|---|
| **Perda de dados por localStorage** | Alta | Backup JSON manual, reset com confirmação | Adicionar instrução de backup no onboarding (Etapa 4 ou pop-up pós-onboarding) |
| **Mobile edge cases físicos** | Média | Testado em DevTools — não em dispositivo real | Smoke test em Android físico e iOS físico antes do primeiro convite |
| **Safe area e notch no iOS** | Média | Tailwind `safe-area` configurado | Confirmar no smoke test físico que BottomNav não fica atrás do home indicator do iPhone |
| **PWA install prompt** | Baixa | Manifest configurado | Testar prompt de instalação no Android Chrome e no iOS Safari antes do beta |
| **Ausência de sync** | Alta (pós-troca de celular) | Backup manual | Instruir o beta tester sobre o backup antes de entregar o link |
| **Telemetria sem dados de beta** | Baixa | Fallback silencioso | Confirmar no /admin que os eventos do beta tester aparecem corretamente |
| **Base de conhecimento incompleta** | Média | 316 entradas, 87% recall | Expandir LGPD e financeiro antes do beta; monitorar fallback real durante o beta |
| **Bundle próximo do limite** | Baixa | 224 kB / limite 230 kB | Manter 230 kB como linha vermelha — não adicionar dependências |

---

## 5. Plano dos próximos 7 dias

### Bloco 1 — Dia 1: Revisar disclaimers e linguagem jurídica

**Objetivo:** garantir que nenhuma frase do produto pareça certeza jurídica.

**Tarefa:**
1. Revisar o rascunho de Termos de Uso (`docs/rascunho-termos-de-uso.md`) e identificar lacunas críticas para envio a advogado.
2. Reler os disclaimers em `components/Response.tsx` — verificar se a linguagem das respostas das categorias sensíveis (trabalhista, financeiro, lgpd, cobranca, juridico) tem o aviso correto e visível.
3. Verificar copy do onboarding — nenhuma frase deve prometer compliance ou resultado garantido.

**Arquivos prováveis:** `docs/rascunho-termos-de-uso.md`, `components/Response.tsx`, `components/onboarding/OnboardingFlow.tsx`

**Critério de aceite:** nenhuma frase em nenhuma tela usa linguagem de certeza jurídica sem ressalva. Rascunho dos termos está organizado para revisão externa.

**Risco:** baixo (não altera código — apenas identifica o que precisa ser corrigido ou enviado ao advogado).

---

### Bloco 2 — Dias 2 e 3: Smoke test físico completo

**Objetivo:** confirmar que o produto funciona corretamente em dispositivo real antes de mostrar para qualquer pessoa.

**Tarefa:**
1. Instalar o PWA em Android físico (Chrome). Percorrer todas as telas do checklist da Seção 8.
2. Instalar o PWA em iPhone (Safari). Verificar safe area, scroll, BottomNav, home indicator.
3. Registrar qualquer bug visual, comportamento quebrado ou passo confuso em lista.
4. Corrigir bugs críticos identificados (visual ou funcional graves).

**Arquivos prováveis:** depende dos bugs encontrados. Prováveis: CSS de safe area em `globals.css` ou `BottomNav.tsx`, ajustes de scroll em telas específicas.

**Critério de aceite:** todas as telas renderizam corretamente em Android e iOS físico. BottomNav visível sem sobreposição. Backup funciona. Onboarding completa as 4 etapas sem travamento.

**Risco:** médio (pode revelar bugs visuais não visíveis no desktop). Se bug crítico for encontrado, bloco 3 pode precisar ser reordenado.

---

### Bloco 3 — Dia 4: Polir tela Conta/Condomínio

**Objetivo:** trazer a tela Conta para o nível visual premium das demais telas.

**Tarefa:**
1. Revisar a tela Conta (aba `condominio`) no mesmo nível visual de Home e Saúde Operacional.
2. Garantir que a seção "Conta e sincronização" (badge "Dados salvos neste dispositivo" + card "Em breve") está visualmente coerente.
3. Garantir que o BackupPanel tem instrução de uso clara e visível (o que é, como usar, quando usar).
4. Adicionar instrução mínima de backup no final do onboarding (Etapa 4) ou logo após o onboarding.

**Arquivos prováveis:** `app/page.tsx` (seção condominio), `components/BackupPanel.tsx`, `components/onboarding/OnboardingFlow.tsx`

**Critério de aceite:** síndico que abre a aba Conta entende imediatamente onde seus dados ficam, que estão seguros, e como exportá-los.

**Risco:** baixo (ajuste visual + copy, sem alteração de lógica de dados).

---

### Bloco 4 — Dia 5: Revisar onboarding

**Objetivo:** o onboarding precisa ativar o síndico — não apenas coletar dados.

**Tarefa:**
1. Reler o copy de todas as 4 etapas do `OnboardingFlow.tsx` com olhos de síndico real, não de fundador.
2. Garantir que a Etapa 1 comunica o *valor* do app em 1–2 frases, não apenas "configure seu condomínio".
3. Garantir que a Etapa 3 (AVCB/Seguro/Mandato) explica *por que* preencher — não só *o que* preencher.
4. Garantir que a Etapa 4 menciona a existência do backup e onde encontrá-lo.
5. Testar o fluxo de "Pular configuração" — confirmar que o estado vazio da Home está bem tratado para quem pula.

**Arquivos prováveis:** `components/onboarding/OnboardingFlow.tsx`, `components/GuidancePreview.tsx`

**Critério de aceite:** o onboarding faz o síndico *querer* preencher os dados, não se sentir em um formulário burocrático.

**Risco:** baixo (copy + micro-ajustes visuais).

---

### Bloco 5 — Dias 6 e 7: Expandir lacunas críticas da KB

**Objetivo:** garantir que as categorias com menos cobertura não causem fallback na primeira sessão do beta tester.

**Tarefa:**
1. Adicionar 8–10 novas entradas de LGPD em `lib/knowledge.json` (câmeras, WhatsApp de moradores, dados de inadimplentes, política de privacidade do condomínio). Ver detalhes na Seção 11.
2. Adicionar 5–6 novas entradas de financeiro (rateio extraordinário, fundo de reserva, prestação de contas, fundo de obras). Ver detalhes na Seção 11.
3. Rodar a auditoria interna no `/admin` após as adições para confirmar que o recall se mantém ≥ 87%.

**Arquivos prováveis:** `lib/knowledge.json`

**Critério de aceite:** LGPD com ≥ 14 entradas, financeiro com ≥ 18 entradas. Recall ≥ 87% confirmado na auditoria.

**Risco:** baixo (editorial puro). O único risco é adicionar entradas mal escritas — seguir o guia de qualidade editorial (`docs/guia-qualidade-editorial-kb.md`).

---

### Bloco 6 — Dia 7 (paralelo): Preparar roteiro e infraestrutura de beta

**Objetivo:** ter tudo necessário para o primeiro convite pronto antes de convidar alguém.

**Tarefa:**
1. Escrever mensagem de convite para o beta tester — clara sobre o que é, o que se espera, que não é produto acabado, que feedback é o objetivo.
2. Criar formulário simples de feedback (Google Forms ou Typeform): 5–7 perguntas. Ver Seção 9 para roteiro.
3. Ativar canal de feedback direto (WhatsApp pessoal ou número dedicado).
4. Definir lista dos 3–5 beta testers priorizados com nome, tipo de síndico e condomínio.

**Arquivos prováveis:** nenhum de código — apenas documentos externos.

**Critério de aceite:** mensagem de convite escrita, formulário de feedback criado e testado, canal de feedback ativo, lista de beta testers com contato.

**Risco:** baixo.

---

## 6. Plano dos próximos 14 dias

### Dias 8–9: Primeiro beta tester (acompanhado)

- Convidar o beta tester com melhor perfil da lista.
- Enviar link do app + mensagem de convite + formulário de feedback.
- **Sessão assistida de 20–30 min**: observar o uso sem interferir (ver Seção 9 — Roteiro de teste).
- Anotar: onde travou, o que não entendeu, o que ignorou, o que surpreendeu positivamente.
- Confirmar no `/admin` que os eventos de telemetria aparecem corretamente após a sessão.

### Dias 10–11: Análise e ajuste rápido

- Analisar dados de telemetria da primeira sessão: taxa de fallback, categorias usadas, tempo de sessão.
- Cruzar com observações anotadas.
- Corrigir apenas o que quebrou a jornada — não adicionar features.
- Priorizar: copy confuso > bug visual > lacuna de KB.

### Dias 12–13: Segunda rodada (2–3 beta testers adicionais)

- Convidar mais 2–3 beta testers com uso não-acompanhado.
- Instrução mínima por texto (sem sessão guiada desta vez — queremos uso espontâneo).
- Monitorar o `/admin` em tempo real após cada convite.
- NPS via formulário após 48h de uso.

### Dia 14: Consolidação e decisão de próximo ciclo

- Revisar feedback qualitativo dos 3–5 testers.
- Listar os 3 problemas de jornada mais recorrentes.
- Decidir se o produto precisa de mais 7 dias de ajuste ou está pronto para mais beta testers.
- Se retenção D7 > 20%: considerar preparar landing page simples e lista de espera.
- Se retenção D7 < 20%: identificar o bloqueio de retorno antes de convidar mais pessoas.

### Conteúdo e aquecimento (paralelo à segunda semana)

- Criar 2–3 posts de Instagram educativos sobre gestão condominial.
- Tema: "5 prazos que síndicos esquecem" / "Como convocar assembleia do jeito certo" / "Inadimplente: o que você pode e não pode fazer".
- **Não mencionar o app ainda** — construir autoridade no tema, não fazer marketing do produto.
- Objetivo: ter 3–5 posts prontos antes do eventual lançamento.

---

## 7. Próximas fases recomendadas de produto

### Fase A — Polimento pré-beta

**Objetivo:** eliminar todas as fricções de jornada identificadas neste plano antes do primeiro síndico real.

**Entregáveis:**
- Revisão dos disclaimers e linguagem jurídica.
- Smoke test físico iOS e Android.
- Tela Conta premium visual.
- Onboarding revisado com instrução de backup.
- Expansão KB — LGPD (6→14) e financeiro (14→18).
- Canal de feedback ativo.
- Roteiro de convite escrito.

**Não fazer:** auth, sync, RAG, landing page, billing, novas features, novos simuladores.

**Critério de conclusão:** todos os itens do checklist da Seção 3 estão ✅ ou foram deliberadamente aceitos como "não obrigatório para beta".

---

### Fase B — Base de conhecimento mínima forte

**Objetivo:** garantir que os temas mais consultados por síndicos reais têm cobertura adequada.

**Entregáveis:**
- Expansão LGPD (6→15+): câmeras, WhatsApp, dados pessoais, GDPR condominial.
- Expansão financeiro (14→20+): rateio, fundo de reserva, prestação de contas, inadimplência financeira.
- Expansão locação (10→16+): Airbnb, inquilino nas regras, notificação por infração.
- Expansão inadimplência (14→20+): prazos, protesto, ação judicial, acordos.
- Adição de variações regionais documentadas para trabalhista (SP, MG).
- Atualizar auditoria de 83→100+ perguntas com perguntas reais vindas do beta.

**Não fazer:** RAG, embeddings, IA generativa, motor novo — apenas conteúdo editorial.

**Critério de conclusão:** fallback rate real (dados de beta) < 20% na média e < 15% nas categorias principais.

---

### Fase C — Beta fechado

**Objetivo:** validar retenção real antes de qualquer investimento em escala.

**Entregáveis:**
- Beta com 5–10 síndicos.
- Formulário de NPS após 2 semanas.
- Entrevista de 15 min com cada tester.
- Análise de telemetria: ativação, fallback, retorno D7/D30.
- Primeiro estudo de caso documentado (com consentimento).
- Ajustes de jornada com base em feedback qualitativo.

**Não fazer:** novos módulos de produto, marketing externo, mídia paga.

**Critério de conclusão:** NPS > 30, retorno D7 > 20%, pelo menos 1 síndico que usa espontaneamente sem instrução.

---

### Fase D — Backend e sincronização controlados

**Objetivo:** resolver o único risco técnico real de adoção: perda de dados na troca de celular.

**Entregáveis:**
- Auth via Supabase (email + magic link).
- Sync snapshot-based (last-write-wins) para `app_snapshots`.
- RLS por usuário (SQL documentado em `supabase/migrations/001_initial_schema.sql`).
- Migração transparente de localStorage para Supabase.
- UI de login integrada ao onboarding.

**Pré-requisito:** retenção D30 > 10% confirmada na Fase C — não ativar backend antes disso.

**Não fazer:** multi-condomínio, painel de administradora, permissões por perfil — tudo isso é pós-Fase D.

**Critério de conclusão:** síndico pode trocar de celular sem perder dados.

---

### Fase E — Comercialização inicial

**Objetivo:** primeiro MRR.

**Entregáveis:**
- Landing page com proposta de valor, screenshot e CTA de pré-venda.
- Oferta de fundador: R$19–29/mês para os primeiros 50 condomínios.
- Billing (Stripe ou similar).
- Plano único ou dois planos máximos.
- Post de lançamento com prova social dos beta testers (com consentimento).
- Pitch para 2–3 administradoras conhecidas.

**Pré-requisito:** Fase D implementada (dados seguros) + Fase C validada (retenção comprovada).

**Não fazer:** multi-condomínio, white label, painel de administradora — são Fase F em diante.

**Critério de conclusão:** primeiros R$500 de MRR, 20+ condomínios ativos pagantes.

---

## 8. Checklist de smoke test pré-beta

Executar em dispositivo físico Android (Chrome) e dispositivo físico iOS (Safari).

### Instalação e primeiro acesso

- [ ] App abre corretamente pelo link direto
- [ ] Prompt de "Adicionar à tela inicial" aparece no Android (Chrome)
- [ ] No iOS: "Compartilhar → Adicionar à Tela de Início" funciona
- [ ] App instalado abre como full-screen (sem barra do browser)
- [ ] Splash screen / carregamento inicial normal
- [ ] Onboarding aparece automaticamente no primeiro acesso

### Onboarding (4 etapas)

- [ ] Etapa 1 (boas-vindas): texto e botões visíveis, "Pular configuração" funciona
- [ ] Etapa 2 (nome + tipo de síndico + elevador): campos funcionam, chips selecionáveis
- [ ] Etapa 3 (AVCB + Seguro + Mandato): campos de data aceitam entrada
- [ ] Etapa 4 (resumo): exibe os dados preenchidos, badge "Dados salvos neste dispositivo"
- [ ] Após concluir: Home carrega corretamente com os dados
- [ ] Após pular: Home carrega com GuidancePreview e estado vazio correto

### Home (aba Início)

- [ ] Header com saudação correta
- [ ] HomeAgendaCard: calendário do mês visível, navegação de mês funciona
- [ ] HomeSaudeCard: ring visível, clique navega para SaudeScreen
- [ ] HomeQuickStats: 3 cards visíveis (Prazos, Pendências, Próximos Passos), badges aparecem quando há dados
- [ ] Com dados preenchidos: alertas de prazo aparecem (guidance cards)
- [ ] Com dados preenchidos: saúde operacional exibe score correto
- [ ] Scroll suave, sem sobreposição com BottomNav

### Saúde Operacional (subview de Início)

- [ ] Ring grande com percentual correto
- [ ] Status label e badge corretos
- [ ] Áreas monitoradas visíveis
- [ ] Últimos registros aparecem
- [ ] Botão/área de voltar retorna para Home

### Pendências (subview de Início)

- [ ] 3 abas: Abertas, Em andamento, Concluídas
- [ ] Cards com ícone, título, subtítulo, data
- [ ] Marcar como concluído funciona com animação
- [ ] Seção "Próximos Passos" aparece com itens manuais
- [ ] Botão de voltar retorna para Home

### Agenda (aba Agenda)

- [ ] Formulário de criação abre e funciona
- [ ] Evento criado aparece na lista
- [ ] Lista ordenada por urgência com cores corretas
- [ ] Concluir evento funciona
- [ ] Evento criado aparece no calendário da Home

### Assistente (aba Assistente)

- [ ] 4 categorias accordion visíveis
- [ ] Expandir categoria mostra chips de subtema
- [ ] Clicar em chip navega para lista de perguntas
- [ ] Clicar em pergunta envia para o Assistente e recebe resposta
- [ ] Resposta exibe próximo passo, disclaimer, score de confiança
- [ ] "Categorias" (botão voltar) retorna corretamente
- [ ] Campo de busca livre funciona
- [ ] Fallback aparece para perguntas sem resposta — não trava, não quebra

### Ferramentas (aba Ferramentas)

- [ ] 4 grupos accordion visíveis
- [ ] Comunicados: selecionar tipo, preencher campos, copiar texto
- [ ] Simulador de multa: calcular funciona, resultado exibido
- [ ] Checklists: marcar item, estado persiste após reload
- [ ] Registro rápido: salvar ocorrência funciona

### Conta (aba Conta)

- [ ] Nome do condomínio e tipo de síndico visíveis
- [ ] MemoriaPanel: datas cadastradas aparecem, nova data pode ser adicionada
- [ ] Badge "Dados salvos neste dispositivo" visível
- [ ] BackupPanel: botão de exportar JSON funciona, arquivo é baixado
- [ ] Import: subir um arquivo de backup restaura os dados corretamente
- [ ] Reset: confirmar digitando "APAGAR" funciona
- [ ] Timeline Operacional: eventos aparecem

### Persistência e reload

- [ ] Fechar e reabrir o app: todos os dados persistem
- [ ] Recarregar a página: todos os dados persistem
- [ ] Dados do onboarding persistem após reinicialização

### Telemetria

- [ ] Após uma sessão de teste, acessar `/admin` e confirmar que eventos aparecem no Supabase
- [ ] Verificar que a `session_duration` é registrada ao fechar o app

### Visual e responsividade

- [ ] BottomNav não fica oculta atrás do home indicator do iPhone
- [ ] Sem overflow horizontal em nenhuma tela
- [ ] Cards e botões com tamanho de toque adequado (mínimo 44px)
- [ ] Textos legíveis sem zoom

---

## 9. Roteiro de teste com síndico real

### Antes do teste

- Explicar que é um beta inicial — o produto está funcional mas em fase de refinamento.
- Deixar claro que não é consultoria jurídica — o app orienta, não aconselha formalmente.
- Pedir consentimento explícito: "Posso anotar o que você fizer? Não tem certo ou errado — quero aprender com o seu uso."
- **Observar em silêncio durante o teste — não explicar, não guiar, não sugerir.** A confusão do usuário é o dado mais valioso.
- Não mostrar features — deixar o usuário descobrir.
- Registrar: onde hesita, onde clica errado, o que relê, o que ignora.

### Durante o teste — Tarefas sem instrução de como fazer

Apresentar apenas a situação, não o caminho:

1. "Abra o app e explore por 2 minutos como quiser."
2. "Seu AVCB vence em 45 dias. Registre isso no app."
3. "Um morador está fazendo barulho toda noite. Use o app para saber o que você pode fazer."
4. "Olhe a aba de Agenda e crie um evento para a assembleia do próximo mês."
5. "Verifique a 'saúde' do seu condomínio e me explique o que você entende daquele número."
6. "Crie uma pendência para lembrar de ligar para a seguradora."
7. "Exporte um backup dos dados do seu condomínio."

### Observações a registrar durante o teste

- Tempo até a primeira ação (onde clicou primeiro?)
- Chegou a fazer uma pergunta no Assistente? Qual?
- Conseguiu preencher as datas no onboarding sem ajuda?
- Acessou a aba Saúde Operacional? Entendeu o número?
- Criou alguma pendência espontaneamente?
- Expressou confusão com algum termo ou tela?
- Qual parte do app pareceu mais útil?

### Perguntas depois do teste (15 min de conversa)

1. O que ficou claro desde o primeiro momento?
2. O que confundiu ou precisou de mais explicação?
3. Em que momento do dia você usaria esse app? O que teria que acontecer para você abrir?
4. O que pareceu mais útil para o seu dia a dia?
5. O que parece desnecessário ou poderia ser removido?
6. Quando você voltou pro app depois da primeira vez — o que te motivou (ou não)?
7. Pagaria por isso? Quanto, por mês?
8. Indicaria para outro síndico? Com que palavras?
9. O que precisaria mudar para você usar isso toda semana?

### Formulário de NPS (enviar após 7 dias de uso)

- Nota de 0 a 10: "Com que probabilidade você recomendaria o Amigo do Prédio para outro síndico?"
- Pergunta aberta: "O que levou a essa nota?"
- Pergunta aberta: "O que mudaria no app?"
- Pergunta opcional: "Voltou a usar o app nos últimos 7 dias? O que te fez abrir?"

---

## 10. Métricas que devem ser observadas no /admin

### Métricas de ativação (primeiros 2 dias)

| Evento | O que mede | Como interpretar |
|---|---|---|
| `session_open` | Número de sessões | Mede engajamento inicial; `is_returning: true` indica retorno |
| `onboarding_completed` | Se o usuário completou o onboarding | Se ausente: usuário pulou ou abandonou — Home ficou no estado vazio |
| `memoria_saved` | Se as datas operacionais foram salvas | Principal proxy de ativação: sem isso, o produto entrega valor zero |
| `session_duration` | Segundos de sessão | < 60s = abandono rápido; > 180s = usuário explorou o produto |

### Métricas do Assistente (sessão a sessão)

| Evento | O que mede | Como interpretar |
|---|---|---|
| `query_submitted` | Pergunta respondida com sucesso | Deve aparecer na primeira sessão — se não aparecer, o Assistente não foi usado |
| `query_fallback` | Pergunta sem resposta na KB | Taxa > 25% indica gap editorial relevante naquele beta tester |
| `query_fallback.detected_category` | Categoria sem cobertura | Usa para priorizar expansão da KB — se aparece "financeiro" muito, expandir lá |
| Categorias clicadas nos chips | Subtema de maior interesse | Compara com o que o síndico reportou verbalmente — valida ou contradiz |

### Métricas de retenção (após D3, D7, D14)

| Evento | O que mede | Como interpretar |
|---|---|---|
| `session_open` com `is_returning: true` | Retorno ao app | Se não aparece após D3: não retornou — investigar por que (entrevista) |
| `weekly_review_completed` | Revisão semanal | Se aparece na primeira semana: síndico adotou o ritual — fortíssimo sinal de retenção |
| `pendencia_completed` | Pendência marcada como feita | Se pendências são criadas mas nunca concluídas: loop de tarefa não está funcionando |

### Métricas de ferramentas (sinal de uso real)

| Evento | O que mede | Como interpretar |
|---|---|---|
| `comunicado_copiado` | Comunicado gerado e copiado | Sinal de uso prático imediato — o síndico vai usar em situação real |
| `simulador_calculado` | Cálculo de multa ou reajuste | Uso situacional — indica problema ativo no condomínio |
| `agenda_event_created` | Evento de agenda criado | Adoção do módulo de agenda — crítico para retenção |
| `ocorrencia_created` | Ocorrência registrada | Uso do registro rápido — sinal de que o síndico está documentando |
| `backup_exported` | Backup baixado | Síndico preocupado com seus dados — sinal de engajamento sério |

### Queries SQL úteis durante o beta

```sql
-- Sessões do beta (substituir pelo session_id do tester se necessário)
SELECT event, properties, ts
FROM events
WHERE ts > now() - interval '14 days'
ORDER BY ts DESC
LIMIT 50;

-- Taxa de fallback do beta
SELECT
  count(*) filter (where event = 'query_submitted') as respondidas,
  count(*) filter (where event = 'query_fallback') as fallbacks,
  round(100.0 * count(*) filter (where event = 'query_fallback') /
    nullif(count(*) filter (where event IN ('query_submitted', 'query_fallback')), 0), 1) as taxa
FROM events
WHERE event IN ('query_submitted', 'query_fallback')
  AND ts > now() - interval '14 days';

-- Categorias com mais fallback
SELECT properties->>'categoria' as categoria, count(*) as fallbacks
FROM events
WHERE event = 'query_fallback'
  AND ts > now() - interval '14 days'
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
```

---

## 11. Lacunas da base de conhecimento antes do beta

### LGPD — 6 entradas → meta: 15+

**Por que importa:** com a crescente digitalização dos condomínios (câmeras, WhatsApp, planilhas de moradores), os síndicos têm dúvidas frequentes sobre o que é legal ou não. Com apenas 6 entradas, qualquer pergunta levemente diferente cai em fallback.

**Risco se faltar:** síndico pergunta sobre câmera no corredor e recebe fallback. Perde confiança no Assistente logo na primeira sessão.

**Entradas mínimas sugeridas (9 novas):**
1. "Posso divulgar a lista de inadimplentes no mural do condomínio?"
2. "WhatsApp de moradores: posso usar para comunicados oficiais?"
3. "Funcionário do condomínio: posso fotografar a ocorrência para registrar?"
4. "Câmera de segurança: quanto tempo posso guardar as imagens?"
5. "Preciso avisar os moradores que há câmeras nas áreas comuns?"
6. "Posso compartilhar imagens de câmeras com a polícia?"
7. "Morador pediu para ver as imagens da câmera. Sou obrigado a mostrar?"
8. "Dados de moradores em planilha: o que o condomínio pode guardar?"
9. "O condomínio precisa ter uma política de privacidade formal?"

---

### Financeiro — 14 entradas → meta: 20+

**Por que importa:** rateio, fundo de reserva e prestação de contas são assuntos de toda assembleia. Com 14 entradas, a cobertura é básica mas não cobre variações comuns.

**Risco se faltar:** síndico consulta sobre cota extraordinária ou fundo de obras e recebe fallback — exatamente quando ele mais precisa de orientação.

**Entradas mínimas sugeridas (6 novas):**
1. "Posso fazer rateio extraordinário sem aprovação em assembleia?"
2. "Qual a diferença entre fundo de reserva e fundo de obras?"
3. "Posso usar o fundo de reserva para manutenção emergencial?"
4. "Como justificar aumento de cota condominial para os moradores?"
5. "Prestação de contas: qual a frequência mínima exigida por lei?"
6. "Sobrou dinheiro no orçamento do ano. O que fazer com o saldo?"

---

### Locação — 10 entradas → meta: 16+

**Por que importa:** Airbnb e locação por temporada são conflito recorrente. Com 10 entradas, há lacunas em situações práticas do dia a dia.

**Risco se faltar:** síndico pergunta sobre inquilino que descumpre regras e recebe fallback.

**Entradas mínimas sugeridas (6 novas):**
1. "Inquilino fez obra sem autorização. Quem o síndico deve notificar: locatário ou proprietário?"
2. "Morador aluga o apartamento pelo Airbnb. Como posso restringir?"
3. "Proprietário não informou que alugou o apartamento. O que posso exigir?"
4. "Inquilino deve cotas do condomínio. O que fazer?"
5. "Posso exigir que o proprietário informe os dados do locatário?"
6. "Inquilino assediou funcionário do condomínio. Quem é responsável?"

---

### Inadimplência — 14 entradas → meta: 20+

**Por que importa:** é o problema mais recorrente em condomínios. 14 entradas cobre o básico mas não perguntas sobre acordo, parcelamento e execução.

**Risco se faltar:** o síndico com maior problema ativo (inadimplência) é exatamente quem mais vai testar o Assistente — e encontrar fallback é crítico aqui.

**Entradas mínimas sugeridas (6 novas):**
1. "Posso parcelar a dívida do morador inadimplente? Como formalizar?"
2. "Morador ofereceu pagar metade da dívida. Posso aceitar e quitar o resto?"
3. "Quanto tempo leva uma ação de execução condominial na prática?"
4. "Posso cortar o acesso do inadimplente à garagem?"
5. "Inadimplente quer participar de assembleia mas deve 6 meses. O que diz a lei?"
6. "Qual a diferença entre multa por inadimplência e juros de mora?"

---

### Obras e ART/RRT — 30 entradas (adequado, verificar gaps de RRT)

**Por que importa:** obras com ART/RRT são obrigatórias e o síndico muitas vezes não sabe a diferença.

**Entradas mínimas sugeridas (3 novas, se necessário):**
1. "Qual a diferença entre ART e RRT? Quando exigir cada um?"
2. "Obra de morador: posso exigir ART para reforma de banheiro?"
3. "Prestador fez obra sem ART. Quem é o responsável se houver acidente?"

---

### Seguro e AVCB — cobertura em manutenção (15 entradas)

**Por que importa:** AVCB vencido é um dos maiores riscos operacionais e um dos prazos mais monitorados pelo app.

**Verificar se existem entradas para:**
1. "AVCB venceu há 30 dias. Qual o risco imediato?"
2. "Seguro do condomínio cobre dano causado por morador?"
3. "Posso contratar qualquer seguradora ou precisa ser aprovado em assembleia?"

---

## 12. O que NÃO fazer agora

Seja firme. Cada item abaixo é uma distração que pode atrasar o beta ou comprometer a tese.

| O que não fazer | Por que é tentador | Por que não fazer agora |
|---|---|---|
| **Não ativar auth/login real** | Stubs estão prontos — parece que é só "ligar" | Sem retenção comprovada, o backend é custo e complexidade sem retorno |
| **Não implementar sync em nuvem** | Risco de perda de dados existe | Backup manual cobre para 5 beta testers; sync real é para pós-Fase C |
| **Não adicionar IA/RAG** | Alta taxa de fallback parece pedir isso | Fallback real ainda não foi medido com usuários reais; KB editorial resolve 80% dos gaps |
| **Não integrar WhatsApp** | É onde o síndico já está | É Fase 4 — meses de trabalho para feature que não foi pedida ainda |
| **Não criar billing/paywall** | Quer validar disposição de pagar | Valide retenção primeiro; perguntar sobre preço antes de ter retorno D7 é prematuro |
| **Não vender publicamente antes do beta privado** | Produto parece pronto | Um bug grave em público corrói confiança de forma irreversível |
| **Não prometer parecer jurídico em nenhum material** | Parece mais convincente | É o maior risco legal do produto — uma frase errada no site pode ser usada contra o fundador |
| **Não escalar antes de testar retenção** | Tráfego parece mais urgente do que retenção | Escalar sem retenção é queimar dinheiro em CAC para usuários que não voltam |
| **Não refatorar a arquitetura** | Acoplamento de app/page.tsx incomoda | Nenhum bug crítico documentado — refatorar sem necessidade é risco de regressão |
| **Não poluir UI com features novas durante o beta** | Beta tester pede feature → vontade de implementar | O objetivo do beta é aprender, não agradar; features durante o beta contaminam os dados |
| **Não comparar com ChatGPT ou IA generativa** | Parece diferencial positivo | O diferencial do produto é a curadoria determinística — mencionar IA como ausência é mais honesto e seguro |
| **Não esperar os termos perfeitos para começar** | Risco jurídico real | Rascunho com advogado externo revisando é suficiente para beta privado de 5 pessoas — não para lançamento público |

---

## 13. Critério de "pronto para beta fechado"

O produto estará pronto para o primeiro convite real quando todos os critérios abaixo estiverem satisfeitos:

| # | Critério | Status atual | Como verificar |
|---|---|---|---|
| 1 | **Fluxo de novo usuário está claro** — onboarding guia, GuidancePreview motiva, estado vazio não confunde | ✅ pronto | Smoke test físico com alguém que nunca viu o app |
| 2 | **Disclaimers jurídicos adequados** — linguagem sem certeza absoluta em nenhuma resposta | ⚠️ revisar | Reler todas as categorias sensíveis em `Response.tsx` |
| 3 | **Termos de uso e privacidade revisados externamente** | ❌ pendente | Advogado externo confirma que posicionamento é adequado |
| 4 | **Tela Conta explica claramente onde ficam os dados e como exportar** | ⚠️ revisar | Síndico de teste entende sem instrução |
| 5 | **Assistente polido** — 4 categorias accordion funcionais, fallback honesto, score de confiança visível | ✅ pronto | Confirmado em smoke test desktop |
| 6 | **KB cobre temas críticos** — LGPD ≥ 14, financeiro ≥ 18, inadimplência ≥ 18 | ⚠️ revisar | Contar entradas em `lib/knowledge.json` após expansão |
| 7 | **Telemetria registrando uso corretamente** | ✅ pronto | `/admin` com "Fonte: Supabase (dados reais)" |
| 8 | **Sem bug visual grave no mobile físico** | ❌ pendente | Checklist da Seção 8 completo sem item crítico aberto |
| 9 | **Canal de feedback ativo** — forma de receber mensagem direta do beta tester | ❌ pendente | Número de WhatsApp ou formulário criado e testado |
| 10 | **Roteiro de convite escrito** — mensagem de convite clara sobre o que é e o que se espera | ❌ pendente | Texto escrito e revisado |

**Regra prática:** itens 3, 8, 9 e 10 são bloqueadores duros. Os demais são "necessariamente bons o suficiente" — perfeito é inimigo do beta.

---

## 14. Recomendação executiva final

### Qual é o próximo passo mais inteligente

**Smoke test físico em um dia, termos enviados para advogado no mesmo dia.**

São as duas ações de maior impacto e maior urgência. O smoke test físico pode ser feito pelo fundador em 3–4 horas com um smartphone Android e um iPhone. O envio do rascunho de termos para revisão externa pode ser feito em paralelo — são ações independentes.

Com esses dois itens resolvidos, o produto está tecnicamente pronto para os primeiros 3 síndicos.

### Qual é o maior risco de foco

**Continuar polindo o produto sem nenhum dado de usuário real.**

O produto tem 90+ fases de desenvolvimento, interface premium, motor sofisticado e KB auditada. O próximo aprendizado não virá de mais código. Virá de observar um síndico real usando o app pela primeira vez e vendo onde ele trava, onde ele se impressiona, e — mais importante — se ele volta.

Cada semana de iteração sem usuários reais é uma aposta cega em o quê o síndico quer. O beta converte essa aposta em dado.

### Qual frente deve ser priorizada primeiro

1. **Jurídico** (termos + disclaimers) — desbloqueador e proteção do fundador.
2. **Smoke test físico** — desbloqueador técnico.
3. **Canal de feedback + roteiro** — infraestrutura mínima para aprender do beta.
4. **KB gaps** — editorial, paralelo ao resto.

**Não priorizar:** auth, sync, IA, billing, landing page. Essas frentes têm retorno zero antes de ter retenção comprovada.

### O que deve ser protegido na visão do produto

**A tese de que o síndico não precisa de IA — precisa de organização, orientação correta e lembretes.**

Toda pressão de feature virá de fora: "por que não tem IA?", "por que não tem WhatsApp?", "por que não tem login?". Essas pressões são legítimas para o longo prazo, mas perigosas se priorizada antes de validar o básico.

O produto que impressiona um síndico voluntário de 50 anos num beta privado é um produto simples, confiável, mobile-first, que avisa os prazos antes que virem problema e responde as dúvidas recorrentes sem alucinação. Esse produto já existe. O próximo passo é mostrá-lo para as pessoas certas.

### Frase para o fundador no dia do primeiro convite de beta

> "O objetivo hoje não é convencer. É aprender. Se o síndico ficou confuso, é dado. Se não voltou, é dado. Se usou sem instrução, é dado. Qualquer resultado é melhor do que zero usuários."

---

*Amigo do Prédio — Plano Pré-Beta*
*Versão: 2026-05-24 (pós-Fase 90G + UI-1 a UI-4)*
*Documento interno — uso do fundador.*
