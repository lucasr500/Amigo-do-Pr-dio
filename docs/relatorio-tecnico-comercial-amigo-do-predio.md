# Relatório Técnico-Comercial — Amigo do Prédio

> **Documento estratégico interno — visão de fundador.**
> Gerado em 2026-05-24. Baseado em análise profunda do código, documentação e histórico de desenvolvimento (90+ fases).
> Serve como base para tomada de decisão interna, planejamento comercial, pitch adaptado ou conversa com sócios, parceiros e investidores.

---

## 1. Resumo Executivo

O **Amigo do Prédio** é uma central operacional mobile-first para síndicos. O produto combina monitoramento de prazos críticos, agenda mensal, gestão de pendências, saúde operacional do condomínio e assistente com base de conhecimento condominial curada — tudo em uma experiência integrada, sem backend e sem fricção de cadastro.

**A tese central** não é um chatbot. É um copiloto operacional: enquanto um chatbot responde quando perguntado, o Amigo do Prédio avisa antes do problema virar urgência, organiza o que precisa ser feito, acompanha a execução e mantém o histórico do prédio. O síndico sai do improviso e entra no controle.

**O problema resolvido** é real, recorrente e emocionalmente desgastante: síndicos — especialmente voluntários — administram condomínios com dezenas a centenas de unidades, lidando com conflitos de vizinhança, prazos de documentação, obrigações trabalhistas e decisões jurídicas sem suporte técnico adequado, sem método e sem memória centralizada. O custo de não ter orientação correta pode ser multas administrativas, ações judiciais trabalhistas ou acidentes por falta de manutenção.

**Estágio atual**: MVP funcional completo, em fase de lapidação silenciosa interna. Produto pré-beta — ainda não exposto a usuários reais. Interface premium, base de conhecimento com 316 entradas em 16 categorias, motor de busca determinístico, sistema de alertas, agenda, saúde operacional, pendências, ferramentas e telemetria ativa via Supabase.

**Oportunidade comercial**: Brasil tem aproximadamente 180.000 condomínios. O síndico profissional é um público emergente e crescente. Administradoras buscam diferenciais de atendimento. O modelo SaaS por condomínio ou por administradora tem potencial de ticket recorrente com custo de aquisição baixo.

**Próximo marco recomendado**: beta privado com 5 a 10 síndicos conhecidos, coleta de feedback qualitativo e análise da telemetria para identificar gaps reais antes de qualquer investimento em aquisição.

---

## 2. Definição do Produto

### O que é o Amigo do Prédio

O Amigo do Prédio é um aplicativo web progressivo (PWA) mobile-first voltado exclusivamente para a gestão operacional de condomínios. É projetado para síndicos — voluntários e profissionais — que precisam acompanhar prazos, responder dúvidas do dia a dia, organizar ações e manter histórico sem depender de planilhas, administradoras ou advogados para cada decisão simples.

O produto funciona inteiramente no dispositivo do usuário. Todos os dados são armazenados localmente. Não há login obrigatório, não há servidor de dados e não há custo de uso inicial. O síndico instala como PWA e começa a usar em minutos.

### Público-alvo

**Primário:** Síndico morador — eleito pelos condôminos, sem formação específica, acumula o cargo com sua vida profissional, tem pouco tempo e muita responsabilidade.

**Secundário:** Síndico profissional — gerencia múltiplos condomínios, precisa de agilidade operacional e padronização de processos.

**Indireto:** Administradoras de condomínios — potencial canal B2B2C.

### Contexto de uso

O produto é usado no momento da dúvida ou urgência operacional: "recebi reclamação de barulho, o que faço?", "o AVCB vence em 20 dias", "morador deve 3 meses", "quero multar um condômino mas não sei o procedimento". É um produto de bolso, não de desktop.

### Principais jornadas

1. **Dúvida → Orientação → Ação**: síndico digita o problema no Assistente, recebe orientação com próximo passo claro e CTA para ferramenta relevante (comunicado, checklist, simulador)
2. **Monitoramento de prazos**: app avisa sobre AVCB, seguro, mandato, manutenções antes que virem urgência
3. **Registro e acompanhamento**: ocorrência registrada, próximo passo criado, revisão semanal concluída, histórico alimentado
4. **Consulta rápida**: síndico abre o app para verificar próxima data crítica ou status da saúde operacional

### Proposta de valor em uma frase

> **"Menos improviso. Mais controle."**

O produto transforma o síndico de reativo para proativo: ele deixa de correr atrás de prazos vencidos, respostas improvisadas e pendências esquecidas.

### O que o produto não é — posicionamento responsável

O Amigo do Prédio **orienta operacionalmente**. Ele não:
- Fornece consultoria jurídica ou emite pareceres
- Substitui advogado, administradora ou decisão formal em assembleia
- Garante conformidade legal com a convenção específica do condomínio
- Resolve conflitos ou processa documentos formais

Toda resposta do Assistente inclui disclaimer: "Esta orientação tem caráter informativo. Situações específicas podem exigir análise da administradora, assessoria jurídica ou profissional responsável."

O produto está deliberadamente posicionado como **recurso de orientação operacional** — como um manual prático bem escrito, atualizado e acessível no celular — não como consultoria.

---

## 3. Problema de Mercado

### O síndico voluntário: o perfil mais comum e mais desassistido

No Brasil, a grande maioria dos condomínios é gerida por síndicos moradores eleitos em assembleia. Esses profissionais não são formados para o cargo. Assumem a responsabilidade por decisões jurídicas (multas, cobranças, demissões, contratações), técnicas (manutenção, segurança, obras) e financeiras (orçamento, rateio, prestação de contas) sem treinamento, sem suporte e frequentemente sem remuneração.

O resultado é uma combinação de problemas que o Amigo do Prédio endereça diretamente:

**Excesso de demandas simultâneas**: o síndico responde a moradores no WhatsApp, resolve conflitos de vizinhança, contrata prestadores, acompanha obras, convoca assembleias — tudo ao mesmo tempo, sem ferramenta de organização.

**Comunicação fragmentada**: as informações críticas do condomínio estão espalhadas em e-mails, WhatsApp, planilhas, papéis físicos e memória do síndico anterior. Não há centralização.

**Dúvidas repetitivas sem resposta confiável**: as mesmas 5 situações aparecem toda semana — barulho, inadimplência, obra não autorizada, convocação de assembleia, funcionário que faltou. O síndico não sabe se pode multar, como deve notificar, qual o prazo correto. Perguntar para a administradora leva horas. Contratar advogado é caro. Grupos de WhatsApp dão respostas contraditórias.

**Prazos esquecidos com consequências graves**: AVCB vencido significa embargo do prédio e risco de vida. Seguro vencido significa responsabilidade civil descoberta. Mandato vencido sem renovação em ata gera insegurança jurídica. Elevador sem manutenção pode causar acidente. Nenhum desses prazos tem lembrança automática no dia a dia do síndico.

**Pendências operacionais sem acompanhamento**: o síndico decide uma ação ("vou multar o morador do 302") mas não registra, não acompanha, não conclui. Semanas depois a situação se agravou.

**Insegurança sobre como agir**: o síndico muitas vezes sabe que há um problema mas não sabe qual é o procedimento correto — notificar antes de multar? Quantas advertências? Quem convoca a assembleia? Pode cortar acesso à área comum? Essa insegurança paralisa.

**Dependência excessiva da administradora**: a administradora cobre o mínimo obrigatório, mas não está disponível a qualquer hora para orientar decisões cotidianas. O síndico precisa de autonomia operacional.

**Baixa maturidade tecnológica do setor**: o setor condominial no Brasil ainda opera com planilhas, e-mail e WhatsApp como principais ferramentas de gestão. Softwares existentes são ERPs pesados, caros e voltados para administradoras — não para o síndico individual.

### Por que o problema é caro

Um AVCB vencido pode resultar em embargo do condomínio por bombeiros — com custo de regularização de dezenas de milhares de reais. Uma demissão sem procedimento correto pode gerar passivo trabalhista de meses de salário + encargos. Uma assembleia convocada errado pode ser anulada judicialmente, forçando nova convocação com todos os custos associados. Uma multa aplicada sem as advertências prévias necessárias pode ser contestada e revertida.

O custo do improviso é real e mensurável. O Amigo do Prédio reduz esse custo com orientação antecipada e organização.

---

## 4. Público-Alvo e Personas

### Persona 1 — Síndico Morador

**Perfil:** Adulto de 35–60 anos. Profissional de outra área (engenheiro, professor, aposentado, empresário). Eleito em assembleia. Sem formação em gestão condominial. Usa WhatsApp intensamente. Tem smartphone Android ou iPhone.

**Dores principais:**
- Não sabe se pode fazer X sem consultar advogado
- Perde prazos porque não há sistema de lembrança
- Decisões improvisadas com medo de responsabilização pessoal
- Conflitos com moradores que acham que o síndico não faz nada
- Sem tempo para pesquisar legislação

**Motivações:**
- Fazer um trabalho reconhecido pela comunidade
- Evitar problemas legais para si e para o condomínio
- Resolver situações com segurança e sem constrangimento

**Objeções potenciais:**
- "Já tenho WhatsApp e planilha"
- "A administradora cuida disso"
- "Não sei se posso confiar em respostas de app"

**Valor percebido:** segurança na decisão, organização das pendências, não perder prazos críticos

**Risco de churn:** baixo se ativar monitoramento de prazos — o app ganha utilidade recorrente automaticamente

**Mensagem comercial:** "Saiba o que fazer antes de errar. Prazos, pendências e decisões do condomínio — tudo organizado no celular."

---

### Persona 2 — Síndico Profissional

**Perfil:** Gerencia 5–20 condomínios simultaneamente. Precisa de agilidade. Busca padronização. Conhece mais da legislação, mas precisa de velocidade operacional.

**Dores principais:**
- Acompanhar múltiplos condomínios sem ferramenta adequada
- Padronizar comunicados e procedimentos
- Justificar ações para conselhos de cada prédio

**Motivações:**
- Aumentar eficiência operacional
- Reduzir tempo por condomínio
- Oferecer serviço diferenciado

**Objeções:**
- "Preciso de versão multi-condomínio"
- "Já uso ferramentas da minha administradora"

**Valor percebido:** velocidade operacional, padronização, geração rápida de comunicados

**Risco de churn:** médio — precisa de multi-condomínio para adoção plena

**Mensagem comercial:** "Padronize a gestão de todos os seus prédios. Procedimentos, comunicados e prazos em um só lugar."

---

### Persona 3 — Administradora de Condomínios

**Perfil:** Empresa que gerencia dezenas a centenas de condomínios. Precisa de diferencial competitivo e de reduzir carga operacional do atendimento.

**Dores principais:**
- Síndicos que ligam para tirar dúvidas básicas
- Falta de padronização entre condomínios
- Dificuldade de demonstrar valor além do básico (boletos, prestação de contas)

**Motivações:**
- Diferenciar o serviço com tecnologia
- Reduzir tempo de suporte operacional
- Fidelizar síndicos clientes

**Objeções:**
- "Já temos sistema próprio"
- "Não queremos concorrente dentro do produto"

**Valor percebido:** ferramenta white-label para oferecer aos clientes, redução de chamadas de suporte básico

**Risco de churn:** alto se não houver integração com sistema da administradora

**Mensagem comercial:** "Ofereça aos seus síndicos uma central operacional digital. Reduza suporte, fidelize clientes."

---

### Persona 4 — Conselho Consultivo/Fiscal

**Perfil:** Membros do conselho que participam de decisões mas não têm ferramenta para acompanhar o andamento das deliberações.

**Dores:** falta de visibilidade sobre o que foi decidido, o que está pendente e o que foi executado

**Valor percebido:** transparência operacional, histórico de ações

**Relevância atual:** baixa — o produto ainda é individual por condomínio, sem perfis diferenciados

---

### Persona 5 — Condomínio com Baixa Organização Documental

**Perfil:** Prédio que não tem AVCB atualizado, não sabe quando foi a última dedetização, não tem histórico de manutenções.

**Dores:** urgência de regularização, risco de embargo, ansiedade por não saber por onde começar

**Valor percebido:** app estrutura o que falta, aponta prioridades, reduz a sensação de caos

**Mensagem comercial:** "Não sabe por onde começar? Em 2 minutos o app mostra o que precisa ser regularizado."

---

## 5. Proposta de Valor

### Camadas da proposta de valor

**Camada 1 — Organização da rotina condominial**
O síndico tem um lugar centralizado para registrar o que acontece no condomínio, criar próximos passos e acompanhar o andamento. Sai do WhatsApp e das planilhas.

**Camada 2 — Agenda e prazos**
Os 10 vencimentos e rotinas críticos do prédio são monitorados automaticamente com alertas em 4 níveis de urgência (90/60/30 dias e vencido). O síndico não precisa lembrar — o app lembra por ele.

**Camada 3 — Pendências e próximos passos**
Cada situação vira uma pendência rastreável. O síndico sabe exatamente o que está aberto, o que está em andamento e o que já foi resolvido.

**Camada 4 — Saúde operacional**
Score percentual (0–100%) que sintetiza o estado do condomínio em 5 fatores: essenciais cadastrados, alertas ativos, próximos passos, revisão semanal e rotinas registradas. Mostra ao síndico onde está e para onde precisa melhorar.

**Camada 5 — Respostas rápidas com base curada**
316 entradas em 16 categorias jurídicas e operacionais, com motor de busca determinístico que entende linguagem natural do síndico ("Morador faz barulho toda noite. Posso multar?"). Sem IA generativa — sem risco de alucinação.

**Camada 6 — Ferramentas operacionais integradas**
Gerador de comunicados (4 modelos), simulador de multas e juros, simulador de reajuste de cota, checklists operacionais, registro de ocorrências — tudo integrado ao fluxo do Assistente.

**Camada 7 — Histórico e memória local**
Timeline operacional registra o que foi feito. Revisão mensal estrutura o acompanhamento recorrente. Backup exportável protege os dados enquanto não há sync.

**Camada 8 — Tranquilidade operacional**
Resultado de tudo o acima: o síndico toma decisões com mais segurança, não perde prazos importantes e tem evidência documentada das ações tomadas.

### Frases de posicionamento candidatas

| Frase | Avaliação |
|---|---|
| "Seu condomínio, sob controle." | Forte. Comunica o resultado emocional desejado. |
| "Menos improviso. Mais controle." | Melhor para conversão — aponta diretamente a dor. |
| "O braço direito digital do síndico." | Humaniza bem. Risco: "digital" pode soar genérico. |
| "A central operacional do síndico moderno." | Posiciona premium. Pode intimidar síndico voluntário. |
| "Do problema ao comunicado em minutos." | Forte para demos — destaca o fluxo completo. |

**Recomendação:** usar "Menos improviso. Mais controle." como tagline principal. "Seu condomínio, sob controle." como frase de marca (mais emocional). Para conversão direta: "Do problema ao comunicado em minutos."

---

## 6. Estado Atual do MVP

O produto está tecnicamente completo como MVP. Todas as funcionalidades centrais estão implementadas e funcionando. O que ainda falta não é funcionalidade — é maturação, telemetria real e validação com usuários.

### 6.1 Interface Principal

A home premium apresenta:
- **Header dinâmico** com saudação contextual ("Bom dia, Síndico!") e status do condomínio
- **HomeAgendaCard**: calendário mensal compacto com ícones operacionais por tipo de evento (13 tipos manuais, 10 tipos automáticos de vencimento)
- **HomeSaudeCard**: card clicável com indicador circular (ring SVG animado), percentual e status qualitativo — navega para tela Saúde Operacional
- **HomeQuickStats**: 3 cards de ação rápida (Prazos, Pendências, Próximos Passos) com badges numéricos verdes e navegação direta
- **Bottom Navigation** fixa com 5 abas: Início, Agenda, Assistente, Ferramentas, Conta
- Layout mobile-first com paleta Navy #234B63 / Cream #F7F1E8 / Terracotta #C97852

O estado sem dados exibe `GuidancePreview` com 2 itens mockados (AVCB + Mandato) com badge "Exemplo" — demonstra o valor do monitoramento antes de qualquer cadastro.

### 6.2 Agenda

A aba Agenda (`AgendaPredio`) oferece:
- Formulário de criação com título, data, tipo (13 categorias), nota e vínculo opcional com próximo passo
- Lista de eventos pendentes ordenados por urgência com cores por status
- Concluir/excluir com confirmação
- Histórico de concluídos colapsável
- Integração com Home: evento mais urgente compete com vencimentos monitorados
- Calendário mensal visual na Home com indicadores de ícone por dia

### 6.3 Saúde Operacional

Tela premium dedicada (`SaudeScreen`) com:
- **Indicador circular grande** (108px SVG ring) com percentual e cor por status
- **Título de status**: Crítico / Atenção / Em evolução / Bem acompanhado / Tudo em ordem
- **Badge** qualitativo colorido
- **Seção "Áreas monitoradas"**: Documentação, Prazos e vencimentos, Manutenções, Fornecedores — com status ok/partial/missing e ícone correspondente
- **"Últimos registros"**: merge de eventos de agenda concluídos + pendências concluídas, top 4 por data

Score calculado por 6 fatores: essenciais cadastrados (30 pts), alertas ativos (20 pts), próximos passos (15 pts), revisão semanal (10 pts), rotinas cadastradas (10 pts), ocorrência com acompanhamento (5 pts). Total: 90 pts → normalizado para 100%.

### 6.4 Pendências

Tela premium dedicada (`PendenciasScreen`) com:
- **3 abas**: Abertas, Em andamento, Concluídas
- Em andamento = abertas com origens de sistema (guidance/response/memoria/ocorrencia) — pendências que requerem ação do síndico
- Concluídas = top 12 por data de conclusão
- Cada card com: ícone por categoria, título, subtítulo de origem, data, badge de prioridade (Alta = guidance, Média = system, sem badge = manual)
- **Seção "Próximos Passos"**: checklist visual com até 6 itens (manual/agenda/revisão), marcação de conclusão com animação circular, data de criação
- `handleComplete` dispara `completePendencia()` + `logInteraction()` + `trackEvent()` + refresh de estado

### 6.5 Assistente

O Assistente é o núcleo de orientação do produto:
- **QuickAccessCards**: 4 categorias principais com subtemas (Rotina e convivência, Obras e manutenção, Gestão e assembleias, Jurídico e obrigações) — expansão accordion com chips de subtema
- **Motor de busca determinístico** em 4 camadas: domain anchor gate → weak keywords → hasNonWeakMatch → score threshold
- **316 entradas** em 16 categorias com pergunta, resposta, contexto, dica e keywords
- **280+ sinônimos** para expansão de linguagem natural
- **Resposta com blocos auxiliares**: Próximo passo (sempre primeiro), Contexto do prédio (dados locais relevantes), Base legal (dica da entrada KB), Veja também, CTA de comunicado/checklist, Aviso por categoria sensível (LGPD/trabalhista/financeiro), Disclaimer geral
- **Fallback contextual**: detecta categoria mesmo sem match exato e oferece sugestões próximas
- **Histórico de perguntas** (últimas 200 no localStorage)
- **Favoritos**: respostas salvas localmente
- **Modo colapsado**: botão "Perguntar sobre outro tema" na parte inferior do Assistente após resposta
- Confiança de score exibida ao usuário: "Resposta confiável" (score ≥ 20), "Pode variar" (8–19), "Base ainda não cobre" (fallback)

### 6.6 Ferramentas

Organizadas em 4 grupos com menu accordion:
- **Rotina do síndico**: Registro rápido de ocorrências (9 tipos), Agenda do Prédio
- **Comunicados**: gerador de 4 modelos de comunicado (multa, advertência, obra, assembleia) com personalização por nome do condomínio
- **Simuladores**: SimuladorMulta (valor × multa × juros × meses), SimuladorReajusteCota (porcentagem + validação anti-negativo)
- **Checklists**: 4 checklists operacionais com persistência por checklist e data de última interação

### 6.7 Conta / Dados Locais

A aba "Conta" (internamente: `condominio`) abriga:
- **OnboardingProfile**: nome do condomínio, tipo de síndico (morador/profissional), tem elevador
- **MemoriaPanel**: progressivo com "Essenciais" (AVCB, Seguro, Mandato) + dots de progresso + "Manutenções e rotinas" colapsável
- **TimelineOperacional**: histórico de ações sem texto livre ou PII
- **RevisaoMensal**: ritual mensal com checklist de vencimentos e rotinas, "O que foi resolvido este mês"
- **BackupPanel**: export/import JSON (v4), indicador de tamanho em KB, reset com confirmação (digitar "APAGAR")
- Bloco estático "Conta e sincronização" com badge "Dados salvos neste dispositivo" e card "Sincronização em nuvem — Em breve"

**Ausência intencional**: sem login real, sem sync, sem dados em servidor. Documentado como próxima fase.

### 6.8 Onboarding

Fluxo de 4 etapas em overlay (bottom sheet mobile / card desktop):
1. Boas-vindas + "Começar" / "Pular configuração"
2. Nome do condomínio, tipo de síndico (chips), tem elevador (chips)
3. Datas AVCB / Seguro / Mandato
4. Resumo + badge "Dados salvos neste dispositivo"

Ativado automaticamente no primeiro acesso via `isFirstRun()`. Detectado por ausência de flag `amigo_onboarding_complete` E ausência de perfil — evita falsos positivos para usuários existentes.

### 6.9 Admin / Fundador

Painel em `/admin` protegido por senha (`NEXT_PUBLIC_ADMIN_KEY`):
- Lê telemetria **real** via Supabase (fonte: "Supabase (dados reais)")
- Fallback para localStorage quando Supabase indisponível
- Exibe: sessões, queries, taxa de fallback, top queries, tokens de fallback, distribuição de habit tier
- Inclui auditoria do motor de busca: run de 83 perguntas de teste com resultado PASS/REVIEW/FAIL por tipo esperado (A/B/C)
- Recall projetado: ~87% (72/83 PASS offline, 0 FAIL)

---

## 7. Evolução Recente do Produto

O produto passou por mais de 90 fases documentadas de desenvolvimento. A seguir, um mapeamento das fases estrategicamente mais relevantes:

| Fase | Nome | Objetivo | Impacto Técnico | Impacto Comercial |
|---|---|---|---|---|
| Fases 1–40 | Fundação e MVP | Motor de busca, KB, alertas, simuladores, checklists | Arquitetura de dados local, motor determinístico, 316 entradas KB | Produto funcional do zero |
| Fase 43 | Tempo até o alívio | Hero problema-primeiro, chips situacionais, próximo passo explícito | Reescrita de copy, CAT_TO_NEXTACTION, CAT_TO_COMUNICADO expandidos | Ativação mais rápida — síndico em crise encontra valor em segundos |
| Fase 45 | Atualização estética | Nova paleta Navy/Cream/Terracotta, ícones PWA, 18 arquivos atualizados | Sistema de cores Tailwind reconstruído, sage eliminado | App passa de "funcional" para "premium" — confiança percebida aumenta |
| Fase 49 | Privacidade da telemetria | Remoção de query bruta dos eventos, campos estruturais sem PII | Telemetria redesenhada, LGPD-safe | Viabiliza ativação do Supabase sem risco regulatório |
| Fase 79 | Agenda do Prédio v1 | Lista de eventos operacionais com 13 tipos | AgendaPredio, AgendaEvent, backup v4, integração Home | Fecha o ciclo de rotina viva do síndico |
| Fase 83 | Agenda Central + Home sem redundância | Calendário mensal na Home, QuickAccessCards tema→pergunta | AgendaMensal, refactor HomeAcaoHub, BottomNav "Minha Conta" | Home deixa de ser painel e vira cockpit operacional |
| Fase 86 | Agenda Mensal v2 — Ícones | Ícones operacionais no calendário por tipo de evento | TYPE_ICONS + SYSTEM_ICONS, dois níveis de label na lista do dia | Calendário passa a comunicar operação, não apenas datas |
| Fases 87–89A | Onboarding + Stubs de Arquitetura | Onboarding de 4 etapas, plano Supabase, stubs de auth/sync | OnboardingFlow, isFirstRun(), lib/supabase stubs, migration SQL | Produto pronto para usuário virgem; arquitetura de backend documentada |
| Fase 90D/E/G | Telemetria real confirmada | Correção de typo de URL Supabase (smjjh→smjih), headers REST | POST 201 confirmado, /admin mostrando dados reais | Fundador passa a ter dados reais de uso pela primeira vez |
| UI-1 | Fundação visual premium | Header, Hero, BottomNav, HomeActionCard, Cards reutilizáveis | Componentes base criados, animações fade-in-up | Interface sai do MVP bruto para o nível SaaS premium |
| UI-2 | Home + Agenda premium | HomeAgendaCard, HomeSaudeCard, HomeQuickStats, subviews | app/page.tsx reestruturado, subView state, dinamic imports | Home se torna uma central de controle premium scaneável |
| UI-3 | Saúde Operacional + Pendências | SaudeScreen, PendenciasScreen como subviews do Início | Telas full-screen premium, ring SVG, accordion de áreas | UX premium completa para as duas telas mais importantes |
| UI-4 | Categorias agrupadas do Assistente | 4 macro-categorias com subtemas em chips accordion | QuickAccessCards refatorado, CATEGORY_GROUPS, expandedCategory | Assistente parecer mais organizado e menos intimidador |

---

## 8. Arquitetura Técnica Atual

### Stack

| Camada | Tecnologia | Versão | Observação |
|---|---|---|---|
| Framework | Next.js | 14.2.35 | App Router, SSG, sem SSR de dados |
| UI | React | 18.3.1 | Hooks, dynamic imports, Suspense |
| Linguagem | TypeScript | 5.5.3 | Zero erros em produção |
| Estilo | Tailwind CSS | 3.4.6 | Config customizada (navy/cream/terracotta) |
| Deploy | Vercel | — | Static export, edge CDN |
| Repositório | GitHub | — | Branch main, CI via Vercel |
| Telemetria | Supabase REST | — | Sem SDK — chamadas fetch diretas |
| Dados | localStorage | — | Persistência principal |
| PWA | Next.js + manifest | — | Instalável em Android e iOS |

**Dependências externas em produção: zero além de Next.js/React.** O `@supabase/supabase-js` NÃO está instalado. A telemetria usa `fetch()` direto na API REST do Supabase. Isso elimina qualquer dependência de SDK de terceiros no bundle.

### Bundle

```
Rota /         → 225 kB First Load JS (margem de 5 kB antes do limite de 230 kB)
Rota /admin    → 204 kB First Load JS
Rota /manifest → 0 B
```

O limite interno de 230 kB é um critério de release: impede que novas features degradem a performance mobile. Componentes pesados (MemoriaPanel, OnboardingProfile, ContextualInsight) são lazy-loaded com `dynamic()` + `ssr: false`.

### Separação de responsabilidades

```
app/page.tsx          → Orquestração de estado global, navegação entre abas e subviews
lib/session.ts        → Toda persistência (localStorage). 18 chaves amigo_*. Migração futura: substituir safeRead/safeWrite por fetch()
lib/data.ts           → Motor de busca + TOPICS + SYNONYMS + CATEGORY_ANCHORS + auditoria
lib/knowledge.json    → Base de conhecimento: 316 entradas, 16 categorias
lib/health-score.ts   → Score de saúde operacional: 100% client-side, determinístico
lib/guidance.ts       → Alertas de prazos: 4 criticals (AVCB/Seguro/Mandato/AGO) + 6 rotinas (atencao)
lib/telemetry.ts      → Batching de eventos (8 eventos / 7s), flush automático, fallback silencioso
lib/urgency.ts        → Helpers de cálculo de datas (ate/desde/past)
lib/insights.ts       → Insights contextuais (mandato 90–180 dias)
lib/checklists.ts     → Definição dos 4 checklists operacionais
lib/comunicados.ts    → Templates de 4 comunicados
lib/guidance.ts       → GuidanceItems com priority, type, urgencyLabel, nextStep
components/           → UI desacoplada de lógica de dados
```

### O que roda client-side (100%)

- Toda a aplicação, incluindo motor de busca, score de saúde, alertas, agenda, pendências, checklists, simuladores, comunicados, backup
- localStorage como único banco de dados
- Sem API route no Next.js (rota /admin usa apenas client-side fetch para Supabase)

### O que depende de Supabase

- Telemetria de eventos (POST /rest/v1/events) — opcional, fallback silencioso se indisponível
- Leitura do painel /admin (GET /rest/v1/events) — apenas para o fundador

### O que é stub (preparado mas não funcional)

- `lib/supabase/client.ts` — `createSupabaseClient()` retorna null (SDK não instalado)
- `lib/auth/authClient.ts` — `signIn/signUp/signOut/getSession` retornam erros neutros
- `lib/sync/syncEngine.ts` — `buildSnapshot()` é funcional; `uploadSnapshot/downloadSnapshot` são stubs
- `supabase/migrations/001_initial_schema.sql` — SQL executável para `profiles` + `app_snapshots` com RLS

---

## 9. Modelo de Dados e Estado

### Chaves localStorage (18 chaves amigo_*)

| Chave | Conteúdo | Entra no Backup | Observação |
|---|---|---|---|
| amigo_profile | CondominioProfile (tipo síndico, nome, elevador) | Sim (v1+) | |
| amigo_memoria | MemoriaOperacional (datas, fornecedores) | Sim (v1+) | |
| amigo_pendencias | Pendencia[] (máx 50) | Sim (v2+) | |
| amigo_ocorrencias | Ocorrencia[] | Sim (v3+) | |
| amigo_agenda | AgendaEvent[] | Sim (v4) | |
| amigo_favorites | FavoriteEntry[] | Sim (v2+) | |
| amigo_checklists | ChecklistStorage | Sim (v2+) | |
| amigo_queries | QueryLog[] (máx 200) | Sim (v1+) | Perguntas do Assistente |
| amigo_stats | UsageStats | Não | |
| amigo_shares | ShareLog[] | Não | |
| amigo_checklist_events | ChecklistEvent[] | Não | |
| amigo_interactions | interação[] | Não | |
| amigo_session_meta | SessionMeta | Não | |
| amigo_resolution_events | ResolutionEvent[] | Não | |
| amigo_revisao_mensal_home | {seenMonthKey, openCount} | Não | Efêmero |
| amigo_revisao_semanal | WeeklyReviewState | Não | Efêmero |
| amigo_onboarding_complete | boolean | Não | Flag de primeiro uso |

### Backup

Versão 4 com campos: `version`, `profile`, `memoria`, `pendencias`, `ocorrencias`, `agenda`, `favorites`, `checklists`, `queries`. Retrocompatível com v1/v2/v3.

### Risco do localStorage

**Risco principal:** dados ficam presos no dispositivo/navegador. Se o síndico trocar de celular, usar modo privado, limpar dados do navegador ou reinstalar o app, perde tudo. O backup manual por JSON mitiga mas não elimina o risco.

**Benefícios no MVP:** zero fricção de login, zero custo de infraestrutura de dados, zero risco de vazamento remoto, funciona offline, instalação instantânea como PWA.

**Migração futura:** a arquitetura foi desenhada para facilitar a migração. `safeRead/safeWrite` em `lib/session.ts` são os únicos pontos de acesso ao localStorage — substituir por `fetch()` para um endpoint de backend mantém as assinaturas de função intactas.

---

## 10. Telemetria e Aprendizado do Produto

### Arquitetura de telemetria

- **Tabela Supabase**: `events` com campos `id`, `event`, `properties` (jsonb), `ts`, `session_id`
- **RLS**: INSERT para anon (escrita do app), SELECT para anon (leitura do /admin)
- **Batching**: fila de até 8 eventos, flush a cada 7 segundos ou quando a fila enche
- **Session duration**: tracked via Page Visibility API — flush imediato ao esconder página
- **Fallback**: se Supabase indisponível, eventos são descartados silenciosamente (não bloqueiam o produto)
- **Status atual**: POST /rest/v1/events retornando 201 confirmado em produção

### Inventário de eventos (47 tipos)

Cobrindo: sessões, queries do assistente, fallbacks, checklists, memória, timeline, revisão mensal, refresh manual, onboarding, guidance, backup, comunicados, simuladores, pendências, ocorrências, revisão semanal, agenda.

**Privacidade garantida:** nenhum evento envia texto livre, query bruta, data real de vencimento, nome do condomínio, unidade, descrição de ocorrência ou qualquer dado pessoal. Apenas: tipo, categoria, contagens, booleanos e score.

### Importância comercial da telemetria

A telemetria ativa permite ao fundador responder perguntas críticas sem teste com usuários:
- Qual categoria de pergunta tem maior fallback rate? (indica gaps editoriais)
- Qual funcionalidade é mais usada? (guia roadmap)
- Qual o tempo médio de sessão? (proxy de engajamento)
- Qual a taxa de ativação do monitoramento? (proxy de onboarding)
- Onde os usuários abandonam? (funil de retenção)

### Métricas recomendadas

| Métrica | Referência Alvo | Como Coletar |
|---|---|---|
| **Sessões únicas** | — | Contagem de session_id distintos |
| **Queries por sessão** | > 2 | query_submitted / sessões |
| **Taxa de fallback do Assistente** | < 25% | query_fallback / query_submitted |
| **Ativação de monitoramento** | > 60% dos usuários | memoria_saved |
| **Tempo até primeiro valor** | < 5 min | Tempo entre session_open e primeira query/memoria |
| **Pendências criadas** | — | pendencia_created_* |
| **Pendências concluídas** | > 30% das criadas | pendencia_completed / pendencia_created |
| **Uso da agenda** | — | agenda_event_created |
| **Uso do Assistente** | > 3 queries/sessão | query_submitted |
| **Retorno D7** | > 20% | Sessões de usuários com session_open > 7 dias atrás |
| **Retorno D30** | > 10% | Idem para 30 dias |
| **Revisão semanal** | > 40% dos usuários com dados | weekly_review_completed |
| **Comunicados gerados** | — | comunicado_gerado |
| **Simuladores usados** | — | simulador_calculado |
| **Taxa de backup** | — | backup_exported |
| **Categorias sem resposta** | — | query_fallback.detected_category |

### Painel /admin atual

O painel exibe: total de sessões, total de queries, fallback count e rate, top queries, top fallback tokens, distribuição de habit tier, eventos recentes. Com Supabase ativo, exibe "Fonte: Supabase (dados reais)". Inclui auditoria do motor com 83 perguntas de teste.

---

## 11. Base de Conhecimento

### Dimensão atual

| Categoria | Entradas | Observação |
|---|---|---|
| gestao | 49 | Mais densa — decisões do síndico, administradora |
| trabalhista | 47 | CLT, FGTS, jornada, rescisão |
| obras | 30 | Autorização, ART, responsabilidade |
| funcionarios | 23 | Porteiro, zelador, encargos |
| areas-comuns | 20 | Garagem, elevador, piscina |
| multas | 19 | Procedimento, valor, advertência |
| responsabilidade | 17 | Vazamento, dano, infiltração |
| convencao | 16 | Regras, alteração, Airbnb |
| manutencao | 15 | AVCB, extintores, SPDA |
| inadimplencia | 14 | Cobrança, protesto, parcelamento |
| financeiro | 14 | Taxa, fundo de reserva, reajuste |
| assembleias | 18 | Convocação, quórum, ata |
| juridico | 10 | Prescrição, recurso, execução |
| locacao | 10 | Inquilino, despejo, Airbnb |
| cobranca | 8 | Execução judicial, boleto |
| lgpd | 6 | Câmeras, dados, WhatsApp |
| **Total** | **316** | |

### Vantagens da base curada

- **Zero alucinação**: respostas determinísticas, testadas em auditoria (87% recall, 0 FAIL)
- **Linguagem condominial**: escrita para o síndico, não para advogado
- **Disclaimers embutidos**: cada resposta tem ressalvas sobre convenção e caso concreto
- **Governança editorial**: guia de qualidade (`docs/guia-qualidade-editorial-kb.md`) define padrões

### Limitações da base

- **Convenção CCT SECOVI-Rio** para dados trabalhistas — síndicos de outros estados precisam verificar a CCT local (documentado no rascunho de Termos de Uso, seção 4)
- **Legislação municipal**: coleta seletiva, posturas e horários de obras variam por município
- **Gaps editoriais conhecidos**: LGPD com apenas 6 entradas (subcategoria mais subrepresentada), locação com 10

### Evolução da base

A base está estruturada para futura ingestão em RAG:
- Cada entrada tem `id`, `categoria`, `pergunta`, `resposta`, `contexto`, `dica`, `keywords`
- `docs/preparacao-kb-para-rag.md` documenta a estrutura de embeddings futura
- O motor atual já identifica `detectedCategory` mesmo sem match exato — base para filtro semântico futuro

**Próximos passos editoriais recomendados:**
1. Expandir LGPD (6 → 15+ entradas) — tema crescente
2. Aumentar cobertura de condomínios de uso misto
3. Incluir variações regionais documentadas (SP/RJ/MG)
4. Alimentar lacunas identificadas pela telemetria de fallback

---

## 12. UX e Design

### Evolução visual

O produto passou por uma transformação estética deliberada e documentada:

**Antes (Fases 1–44):** MVP funcional com interface básica. Funcional, mas sem a credibilidade visual necessária para convencer síndicos de que é um produto sério.

**Depois (Fase 45 em diante):** Interface Apple-like mobile-first com:
- Paleta Navy #234B63 / Cream #F7F1E8 / Terracotta #C97852 — sem sage, sem cores berrantes
- Cards brancos com `rounded-[18px]`, `shadow-card` (sombra difusa suave), bordas discretas
- Tipografia forte nos títulos (`font-display`), suave nos subtítulos, concisa no microcopy
- Animações `fade-in-up` com stagger — sensação de app nativo premium
- Ring SVG para score (não barra simples) — visual mais sofisticado
- Bottom Navigation com active state navy, items inativos em cinza

**Fases UI-1 a UI-4:** refatoração visual completa das telas principais (Home, Agenda, Saúde Operacional, Pendências, Assistente) para atingir o nível das referências premium.

### Por que o design importa comercialmente

Para um síndico voluntário de 50 anos que está avaliando usar o app, o design é proxy de confiabilidade. Um app que parece premium transmite: "foi feito com cuidado", "é profissional", "posso confiar nas orientações". Um app com visual bruto transmite: "foi feito de qualquer jeito", "pode estar errado".

A decisão de investir em qualidade visual antes do beta é estratégica — o síndico precisa ser impressionado desde o primeiro uso, sem a percepção de "ainda estamos melhorando".

### Hierarquia de informação atual na Home

```
1. Header — saudação + status
2. HomeAgendaCard — calendário do mês
3. HomeSaudeCard — índice de saúde (clicável → SaudeScreen)
4. HomeQuickStats — Prazos / Pendências / Próximos Passos (clicáveis)
```

Sem dados: `GuidancePreview` (mockado) + Hero com CTA de cadastro.

---

## 13. Diferenciais Competitivos

### Diferenciais do produto

| Diferencial | Descrição | Nível de maturidade atual |
|---|---|---|
| **Foco específico em condomínio** | Não é um chatbot genérico — escopo deliberado, motor com domain anchor gate | Alto |
| **Linguagem do síndico** | "Morador faz barulho toda noite" — não "regras de perturbação do sossego" | Alto |
| **Rotina operacional + orientação** | Agenda + Pendências + Saúde + Assistente integrados | Alto |
| **Base curada 100% determinística** | Zero alucinação, 87% recall, 0 falha crítica | Alto |
| **Mobile-first PWA sem app store** | Instalação em segundos, funciona offline, sem fricção de download | Alto |
| **Score de saúde operacional** | Feedback visual único e de fácil leitura do estado do condomínio | Médio |
| **Telemetria desde cedo** | Dados reais de uso antes mesmo do beta — vantagem competitiva de aprendizado | Médio |
| **Custo zero de MVP** | Sem dependências pagas além de Vercel (plano free) + Supabase (plano free) | Alto |
| **Potencial RAG contextual** | KB estruturada para embeddings futuros, plano documentado | Baixo (futuro) |
| **Potencial de personalização** | Convenção + regimento + atas específicas do condomínio como contexto | Baixo (futuro) |

### Comparação com alternativas

| Alternativa | Modelo | Problema que não resolve | Onde o Amigo do Prédio ganha |
|---|---|---|---|
| **Grupo de WhatsApp** | Informal, sem estrutura | Informações contraditórias, sem histórico, sem proatividade | Base curada + monitoramento automático + histórico |
| **Administradora tradicional** | Serviço pago | Não disponível a qualquer hora, foco nos obrigatórios | Disponibilidade 24/7, orientação imediata, foco no síndico |
| **Planilhas do Excel** | Manual | Não avisa prazos, não orienta decisões | Automação de alertas + Assistente integrado |
| **Apps genéricos de tarefas** | Horizontal | Não entende condomínio, sem orientação jurídico-operacional | Especificidade condominial + 316 entradas curadas |
| **Chatbots genéricos (GPT)** | IA generativa | Alucinação, sem foco condominial, sem ferramentas integradas | Determinístico, curado, ferramentas e monitoramento integrados |
| **ERPs condominiais (Condomínio21, SuperLógica)** | B2B pesado | Caros, complexos, voltados para administradoras | Simplicidade, mobile-first, voltado para o síndico individual |

---

## 14. Limitações Atuais

Honestidade é parte da tese de fundador. O produto tem limitações reais que precisam ser endereçadas antes de escala:

| Limitação | Impacto | Mitigação atual | Roadmap |
|---|---|---|---|
| **Sem login real** | Dados presos no dispositivo, sem multi-conta | Backup JSON manual | Fase 2: auth via Supabase |
| **Sem sync multi-dispositivo** | Não funciona em celular + tablet simultaneamente | Backup manual | Fase 2: snapshots Supabase |
| **localStorage como persistência** | Risco de perda de dados (modo privado, limpeza) | Backup exportável, instrução no onboarding | Fase 2: sync remoto |
| **Sem IA/RAG** | Motor não cobre perguntas fora das 316 entradas | Fallback contextual honesto + sugestões | Fase 3: RAG controlado |
| **Sem WhatsApp** | Principal canal do síndico não está integrado | — | Fase 4: interface conversacional |
| **Sem importação de documentos** | Convenção e atas não alimentam o Assistente | — | Fase 3: upload + ingestão |
| **Sem billing** | Produto gratuito sem modelo de receita ativo | — | Fase 5: billing |
| **Sem multi-condomínio** | Síndico profissional não pode usar para múltiplos prédios | — | Fase 5: workspace multi |
| **Sem painel de administradora** | Canal B2B não atendido | — | Fase 5: admin dashboard |
| **Sem permissões por perfil** | Sem distinção síndico / conselheiro / morador | — | Fase 5 |
| **CCT SECOVI-Rio apenas** | Trabalhista impreciso fora do Rio | Disclaimer nos termos | Expansão editorial regional |
| **Rascunho de Termos e Privacidade** | Sem proteção jurídica formal | Disclaimers em todas as respostas | Revisão jurídica antes do beta |
| **Sem suporte documentado** | Usuário em problema não tem canal | — | Canal de feedback antes do beta |

---

## 15. Riscos Técnicos

| Risco | Severidade | Mitigação Atual | Ação Recomendada |
|---|---|---|---|
| **Perda de dados por localStorage** | Alta | Backup JSON manual, instrução no onboarding | Sincronização remota como prioridade da Fase 2 |
| **Acoplamento excessivo em app/page.tsx** | Média | Componentes desacoplados com props; app/page.tsx é o único orquestrador | Refatorar para Context ou Zustand quando o arquivo crescer |
| **Bundle hitting 230 kB limit** | Média | Limite monitorado a cada fase; dynamic imports agressivos | Manter disciplina de lazy-load; avaliar tree-shaking adicional |
| **Degradação de precisão do motor** | Média | Auditoria de 83 casos; 0 falha crítica; guia editorial | Expandir suite de auditoria conforme novos casos reais de uso |
| **Stale data na KB** | Alta (longo prazo) | Auditoria editorial feita; guia de qualidade documentado | Revisão semestral da KB; processo de atualização formalizado |
| **Dependência de Vercel** | Baixa | Next.js portável | Manter portabilidade — evitar Vercel-specific features |
| **Dependência de Supabase** | Baixa (telemetria apenas) | Fallback silencioso se Supabase cair | SDK não instalado; migração trivial se necessário |
| **LGPD** | Média | Zero PII na telemetria; dados locais no dispositivo do usuário | Política de privacidade revisada por advogado antes do beta |
| **Risco de escalabilidade de localStorage** | Alta (pós-beta) | getStorageSizeKB() com alerta no BackupPanel | Migração para sync remoto após validação de retenção |
| **Motor sem cobertura de linguagem regional** | Média | 280+ sinônimos; fallback contextual honesto | Alimentar novos sinônimos com dados reais de fallback |

---

## 16. Riscos Comerciais e Jurídicos

### Risco OAB — consultoria jurídica

**Natureza do risco:** O Conselho Federal da OAB tem entendimento de que sistemas que fornecem orientação jurídica de forma automatizada podem caracterizar exercício ilegal da advocacia ou captação indevida de clientela.

**Mitigação implementada:**
- Todas as respostas têm disclaimer de caráter informativo
- Linguagem condicional: "a legislação prevê", "geralmente exige", "conforme a convenção"
- Categorias sensíveis (LGPD, trabalhista, financeiro) têm aviso específico de "consulte especialista"
- Posicionamento explícito: "orientação operacional", não "consultoria jurídica"
- Analogia documentada internamente: "como um manual prático bem escrito" — não advogado virtual

**Avaliação:** risco real mas gerenciável com posicionamento correto. Concorrentes como GuiaCondomínio e dezenas de sites de artigos condominiais operam no mesmo espaço sem embargo. O diferencial do Amigo do Prédio é a curadoria, não a geração autônoma.

**Ação recomendada:** revisão jurídica dos Termos de Uso e disclaimers por advogado especializado antes do primeiro usuário externo.

### Risco de promessa excessiva

O produto pode parecer mais completo do que é se a comunicação não for cuidadosa. Um síndico que usa o app para tomar uma decisão grave (demitir funcionário, cobrar judicialmente, aplicar multa com valor errado) com base em uma resposta imprecisa pode ter prejuízo real.

**Mitigação:** disclaimers presentes, linguagem condicional, fallback honesto. Risco cresce se base editorial for ampliada sem rigor ou se IA generativa for adicionada sem guardrails.

### Resistência de administradoras

Administradoras podem ver o produto como ameaça (síndico mais autônomo = menos dependência delas) ou como oportunidade (diferencial competitivo para oferecer a clientes).

**Avaliação:** no curto prazo, síndico voluntário é o público-alvo. Administradoras são canal futuro — não ameaça imediata.

### Adoção por síndicos menos digitais

A persona mais desassistida (síndico voluntário de 60+ anos) pode ter baixa adesão ao PWA. O onboarding precisa ser simples o suficiente para qualquer usuário.

**Avaliação:** o onboarding atual é progressivo e permite pular etapas. O risco existe mas é gerenciável com instrução de uso.

### LGPD e dados condominiais

Dados do condomínio no dispositivo do síndico são dados pessoais de terceiros (moradores com inadimplência, funcionários com jornada registrada). Quando o produto evoluir para sync remoto, precisará de LGPD compliance completo.

**Avaliação:** no estágio atual (dados apenas locais, sem PII na telemetria), o risco é baixo. Aumenta significativamente com o backend.

---

## 17. Oportunidades Comerciais

### B2C — Síndico Individual

**Modelo:** freemium com plano pago por condomínio.

**Vantagens:**
- Ciclo de venda curto (síndico decide sozinho)
- Onboarding digital completo sem intervenção humana
- Produto atual já atende o caso de uso principal

**Desafios:**
- CAC via mídia paga pode ser alto para um produto freemium
- Churn alto se o síndico perder o cargo
- Ticket individual baixo

**Ticket possível:** R$29–59/mês por condomínio (plano básico), R$79–99/mês (plano premium com IA/RAG)

**Aderência ao MVP:** alta — produto já funciona para essa persona.

---

### B2B — Administradora de Condomínios

**Modelo:** licença por administradora ou por condomínio gerenciado.

**Vantagens:**
- Ticket muito maior (1 contrato = dezenas de condomínios)
- Ciclo de decisão único para múltiplas instalações
- Reduz suporte de dúvidas básicas para a administradora

**Desafios:**
- Ciclo de venda longo (decisão corporativa)
- Pode exigir integração com sistema da administradora
- Risco de customização excessiva

**Ticket possível:** R$500–2.000/mês para administradora de 20–100 condomínios

**Aderência ao MVP:** média — produto atual é individual, não tem multi-condomínio nem painel administrativo.

---

### B2B2C — Administradora distribui para seus síndicos

**Modelo:** administradora paga licença e distribui o app para os síndicos dos condomínios que gerencia, como diferencial de serviço.

**Vantagens:**
- Base de usuários cresce sem CAC direto
- Administradora absorve o custo — síndico usa de graça
- Prova social: "a sua administradora usa o Amigo do Prédio"

**Desafios:**
- Precisa de plano específico para administradoras
- Pode exigir white label ou customização de marca

**Ticket possível:** R$15–30/condomínio/mês cobrado da administradora

**Aderência ao MVP:** baixa — exige multi-conta mínimo.

---

### Premium por condomínio — Upload de documentos

**Modelo:** plano premium onde o síndico faz upload da convenção, regimento e atas do próprio condomínio — as respostas do Assistente passam a incluir contexto específico do prédio via RAG.

**Vantagens:**
- Proposta de valor única e difícil de copiar
- Alta percepção de valor ("me responde sobre minha convenção")
- Monetização natural de feature avançada

**Desafios:**
- Requer RAG, backend, OCR, gestão de documentos — esforço de Fase 3
- Questões jurídicas de responsabilidade sobre respostas com documentos específicos

**Ticket possível:** R$79–149/mês por condomínio com documentos carregados

---

### White Label para Administradoras

**Modelo:** versão personalizada com marca e cores da administradora.

**Vantagens:**
- Ticket 3–5x maior que licença padrão
- Fidelização da administradora
- Marketing indireto (todos os síndicos veem a marca da administradora)

**Desafios:**
- Requer infra de white-label (subdomínios, temas, logos)
- Suporte é mais complexo

**Ticket possível:** R$2.000–5.000/mês por administradora (inclui customização + licenças)

---

### WhatsApp como Interface

**Modelo:** síndico envia mensagem para um número de WhatsApp Business e recebe orientação operacional com o mesmo motor do Assistente.

**Vantagens:**
- Encontra o usuário onde ele já está
- Viralização natural ("envio pelo grupo do condomínio")
- Baixíssima fricção de adoção

**Desafios:**
- Meta Verified Business Program + mensalidade da API
- Custo por conversa no modelo de precificação da Meta
- Complexidade de manter estado de contexto por conversa

**Ticket possível:** R$0,10–0,30/conversa (cobrado do usuário ou absorvido no plano)

**Aderência ao MVP:** zero — requer Fase 4 completa.

---

### Conteúdo e Autoridade Digital

**Modelo não-produto:** Instagram, YouTube Shorts, TikTok com conteúdo educativo para síndicos. Construção de audiência → conversão para o app.

**Vantagens:**
- CAC orgânico baixo ou zero
- Constrói confiança antes da primeira instalação
- Base de SEO e backlinks

**Desafios:**
- Tempo de produção de conteúdo
- Autoridade demora a construir

**Recomendação:** iniciar com Instagram em paralelo ao beta. Carrosséis educativos ("5 erros que síndicos cometem na convocação de assembleia") são o formato ideal.

---

## 18. Estratégia de Monetização

### Hipóteses de planos

| Plano | Público | Preço Sugerido (mensal) | Funcionalidades Incluídas | Risco |
|---|---|---|---|---|
| **Gratuito** | Síndico com uso limitado | R$0 | Assistente (limitado a X queries/mês), monitoramento básico (3 datas), sem ferramentas premium | Churn alto se limites frustrarem |
| **Síndico Essencial** | Síndico individual | R$29–39 | Todas as funcionalidades atuais, backup ilimitado | Percepção de valor precisa ser validada |
| **Síndico Premium** | Síndico com RAG | R$69–99 | Essencial + upload de convenção/regimento + respostas contextualizadas | Depende de Fase 3 implementada |
| **Condomínio Pro** | Condomínio com conselho | R$99–149 | Premium + múltiplos perfis (síndico + conselheiros) | Depende de auth + permissões |
| **Administradora** | Empresas | R$500–2.000 | Multi-condomínio + painel admin + relatórios | Depende de Fase 5 |
| **White Label** | Administradora grande | R$2.000–5.000 | Administradora + marca própria + subdomínio | Exige customização |

**Nota:** estes preços são hipóteses iniciais baseadas no mercado de SaaS brasileiro para PMEs e no valor percebido declarado em pesquisas do setor condominial. Devem ser validados com síndicos reais antes de fixar.

**Modelo recomendado para lançamento inicial:** freemium + plano único de ~R$29–39/mês, sem plano gratuito com limite frustrante. Simplicidade de conversão é mais importante que segmentação prematura.

---

## 19. Go-to-Market

### Fase 1 — Aquecimento de marca (agora → 4 semanas)

**Objetivo:** construir presença antes de abrir o beta.

- Criar perfil no Instagram (@amigodopredio ou equivalente)
- Publicar 2–3 carrosséis educativos por semana: "5 prazos que síndicos esquecem", "Como convocar assembleia do jeito certo", "Inadimplente: o que você pode e não pode fazer"
- Não mencionar o app ainda — construir autoridade no tema
- Coletar emails via formulário de interesse ("Quero ser notificado do lançamento")

---

### Fase 2 — Beta privado (semanas 5–10)

**Objetivo:** validar o produto com síndicos reais em ambiente controlado.

**Critérios de entrada no beta:**
- Smoke test interno sem bug crítico
- Termos de uso e política de privacidade revisados por advogado
- Canal de feedback ativo (WhatsApp direto ou formulário Typeform)
- Telemetria confirmada funcionando

**Seleção de beta testers:**
- 5–10 síndicos de relacionamento próximo (não estranhos)
- Mix de síndico voluntário e profissional
- Mix de condomínio pequeno (10–30 unidades) e médio (50–150 unidades)

**Entrega no beta:**
- Acesso ao app com link direto
- Breve instrução de 5 minutos (vídeo ou PDF)
- Sessão de onboarding assistida (uma vez)

**Coleta de feedback:**
- NPS após 2 semanas
- Entrevista de 15 minutos com cada beta tester
- Análise da telemetria: fallback rate, ativação, pendências

---

### Fase 3 — Ajustes com feedback (semanas 11–14)

**Objetivo:** corrigir os 3–5 problemas críticos identificados no beta.

- Não adicionar features — apenas corrigir o que quebrou a jornada
- Atualizar KB com gaps identificados nos fallbacks reais
- Ajustar copy e microcopy com base no feedback
- Preparar primeiro estudo de caso (com consentimento do beta tester)

---

### Fase 4 — Pré-venda e landing page (semanas 15–18)

**Objetivo:** validar disposição de pagar antes de implementar billing.

- Landing page com proposta de valor clara, screenshot e CTA de pré-venda
- Oferta de fundador: R$19/mês (ou R$199/ano) para os primeiros 50 condomínios
- Lista de espera com email capture
- Demo em vídeo de 3 minutos

---

### Fase 5 — Lançamento inicial (semana 19+)

**Objetivo:** primeiro MRR.

- Billing implementado (Stripe ou similar)
- Plano único ou dois planos máximos
- Post de lançamento nas redes sociais com prova social dos beta testers
- Pitch para 2–3 administradoras conhecidas

---

### Fase 6 — Parcerias (trimestre 2–3)

**Objetivo:** escalar via B2B2C.

- Pitch formal para administradoras regionais
- Proposta de white-label para administradoras médias (50+ condomínios)
- Parceria com sindicatos de síndicos profissionais
- Presença em feiras do setor condominial (SECOVI, AABIC)

---

## 20. Roadmap Recomendado

### Fase 1 — Consolidação do Beta (0–3 meses)

**Objetivo:** produto pronto para os primeiros usuários reais.

| Entregável | Tipo | Esforço | Prioridade |
|---|---|---|---|
| Revisão jurídica de Termos de Uso | Jurídico | 1 semana (advogado externo) | Crítica |
| Revisão de Política de Privacidade | Jurídico | 1 semana | Crítica |
| Canal de feedback ativo (WhatsApp/formulário) | Produto | 1 dia | Alta |
| Smoke test completo em dispositivo físico iOS e Android | Técnico | 3 dias | Alta |
| Validação recall real em /admin (≥75%) | Produto | 1 dia | Alta |
| Expansão de KB — lacunas de fallback reais | Editorial | 2 semanas | Alta |
| Polimento da tela do Assistente (UI-4 concluído) | Design | Feito | — |
| Export de backup com instrução de restauração | Produto | 1 dia | Média |
| Tela de Conta premium (UI futuro) | Design | 1 semana | Média |

**Critério de saída:** smoke test limpo, termos revisados, 5+ síndicos em beta.

---

### Fase 2 — Backend e Sincronização (3–6 meses)

**Objetivo:** dado seguro, multi-dispositivo, auth real.

| Entregável | Tipo | Esforço | Risco |
|---|---|---|---|
| Auth via Supabase (email + magic link) | Backend | 2 semanas | Médio (UX de login) |
| Sync snapshot-based (last-write-wins) | Backend | 3 semanas | Alto (conflito de dados) |
| RLS por usuário (profiles + app_snapshots) | Backend | 1 semana | Baixo (SQL documentado) |
| Multi-dispositivo (smartphone + tablet) | Produto | 1 semana pós-sync | Baixo |
| Migração transparente de localStorage | Backend | 1 semana | Médio (dados legados) |

**Critério de saída:** síndico pode trocar de celular sem perder dados.

---

### Fase 3 — IA/RAG Controlado (6–12 meses)

**Objetivo:** respostas contextuais com documentos do condomínio.

| Entregável | Tipo | Esforço | Risco |
|---|---|---|---|
| Upload de convenção/regimento (PDF/TXT) | Produto | 2 semanas | Médio (OCR, parse) |
| Embeddings da KB + documentos do condomínio | AI/Backend | 3 semanas | Alto (custo, latência) |
| RAG com contexto do condomínio | AI | 4 semanas | Alto (alucinação, jurídico) |
| Guardrails e disclaimer por fonte | AI/Jurídico | 2 semanas | Médio |
| Revisão jurídica das respostas com RAG | Jurídico | externo | Alto |

**Critério de entrada:** backend seguro, política de privacidade v2, fallback rate real > 25% comprovado.
**Critério de saída:** RAG com taxa de alucinação < 5% em auditoria, guardrails implementados.

---

### Fase 4 — WhatsApp (12–18 meses)

**Objetivo:** interface conversacional onde o síndico já está.

| Entregável | Tipo | Esforço | Risco |
|---|---|---|---|
| WhatsApp Business API (Meta) | Integração | 3 semanas | Médio (aprovação Meta) |
| Bot com motor atual (sem RAG) | Produto | 4 semanas | Médio (gerenciar contexto) |
| Notificações proativas de prazos | Produto | 2 semanas | Baixo |
| Captura de ocorrência via WhatsApp | Produto | 2 semanas | Médio |

---

### Fase 5 — Comercialização Plena (18–24 meses)

**Objetivo:** produto vendável em escala.

| Entregável | Tipo | Esforço | Risco |
|---|---|---|---|
| Billing (Stripe) | Backend | 2 semanas | Baixo |
| Planos e paywall | Produto | 1 semana | Médio (UX de conversão) |
| Multi-condomínio para síndico profissional | Produto | 3 semanas | Médio (arquitetura) |
| Painel de administradora | Produto | 4 semanas | Alto (novo produto) |
| Relatórios por condomínio | Produto | 3 semanas | Médio |
| White label | Produto | 4 semanas | Alto (customização) |

---

## 21. Backlog Priorizado

| # | Item | Tipo | Impacto | Esforço | Risco | Observação |
|---|---|---|---|---|---|---|
| 1 | Revisão jurídica Termos + Privacidade | Jurídico | Crítico | Externo | Alto | Bloqueador para qualquer beta |
| 2 | Smoke test iOS + Android físico | Técnico | Alto | 3 dias | Baixo | Validar PWA real |
| 3 | Canal de feedback (WhatsApp/form) | Produto | Alto | 1 dia | Baixo | Necessário antes do beta |
| 4 | Expansão KB — LGPD (6→15) | Editorial | Alto | 1 semana | Baixo | Tema crescente |
| 5 | Expansão KB — lacunas de fallback | Editorial | Alto | 2 semanas | Baixo | Alimentar com dados reais |
| 6 | Landing page + formulário de interesse | Comercial | Alto | 1 semana | Baixo | Necessário para validar demanda |
| 7 | UI tela Conta (premium visual) | Design | Médio | 1 semana | Baixo | Completar as 5 telas premium |
| 8 | Instrução de backup no onboarding | Produto | Médio | 1 dia | Baixo | Reduz risco de perda de dados |
| 9 | Auth Supabase (email + magic link) | Backend | Alto | 2 semanas | Médio | Fase 2 |
| 10 | Sync snapshot-based | Backend | Alto | 3 semanas | Alto | Fase 2 |
| 11 | Admin insights dashboard | Produto | Médio | 2 semanas | Baixo | Melhora observabilidade |
| 12 | Expansão KB regional (SP/MG trabalhista) | Editorial | Médio | 2 semanas | Médio | Risco CCT regional |
| 13 | Instagram — primeiros 10 posts | Comercial | Médio | 2 semanas | Baixo | Aquecimento de marca |
| 14 | Billing (Stripe) | Backend | Alto | 2 semanas | Baixo | Fase 5 |
| 15 | Multi-condomínio | Produto | Alto | 3 semanas | Médio | Fase 5 |
| 16 | Simulador de multas avançado | Produto | Baixo | 1 semana | Baixo | Congelado até validação |
| 17 | Gerador de circular avançado | Produto | Baixo | 1 semana | Baixo | Congelado até validação |
| 18 | RAG com convenção do condomínio | AI | Muito Alto | 6 semanas | Alto | Fase 3 |
| 19 | WhatsApp Business API | Integração | Alto | 4 semanas | Médio | Fase 4 |
| 20 | Painel de administradora | Produto | Alto | 4 semanas | Alto | Fase 5 |

---

## 22. Indicadores de Sucesso

### KPIs de Produto

| KPI | Definição | Meta Beta | Meta Lançamento |
|---|---|---|---|
| **Ativação** | % usuários que cadastram ≥1 data | > 60% | > 70% |
| **Tempo até primeiro valor** | Tempo entre abertura e primeira query ou data salva | < 5 min | < 3 min |
| **Queries por sessão** | Perguntas ao Assistente / sessão | > 2 | > 3 |
| **Taxa de fallback** | Fallbacks / total de queries | < 25% | < 20% |
| **Pendências criadas** | Pendências criadas / sessão ativa | > 0.5 | > 1 |
| **Taxa de conclusão de pendências** | Concluídas / criadas (30 dias) | > 30% | > 40% |
| **Uso da agenda** | % usuários com ≥1 evento criado | > 30% | > 50% |
| **Retorno D7** | Usuários que voltam em 7 dias | > 20% | > 30% |
| **Retorno D30** | Usuários que voltam em 30 dias | > 10% | > 20% |
| **Revisão semanal concluída** | % usuários com dados que completam revisão | > 20% | > 35% |

### KPIs Comerciais (pós-monetização)

| KPI | Definição | Observação |
|---|---|---|
| **Leads qualificados** | Síndicos que instalam e cadastram dados | Proxy de intenção |
| **Taxa de conversão freemium→pago** | Upgrades / free com dados | Meta: > 5% |
| **CAC** | Custo de aquisição por cliente pagante | Meta: < R$100 via conteúdo orgânico |
| **Ticket médio** | MRR / clientes ativos | Meta inicial: R$29–39 |
| **Churn mensal** | Cancelamentos / base ativa | Meta: < 5%/mês |
| **MRR** | Monthly Recurring Revenue | Marco: R$5.000, R$20.000, R$100.000 |
| **NPS** | Net Promoter Score após 30 dias | Meta: > 40 |
| **Taxa de indicação** | Novos usuários via indicação / total | Meta: > 20% |

### KPIs Editoriais

| KPI | Meta | Observação |
|---|---|---|
| **Recall geral** | ≥ 75% no /admin | Motor cobre as perguntas reais |
| **Taxa de fallback por categoria** | < 15% por categoria | Identifica gaps editoriais |
| **Categorias sem resposta** | < 3 categorias com > 20% fallback | Prioriza expansão da KB |
| **Confidence gap** | < 20% de respostas borderline | Auditoria interna |
| **Entradas desatualizadas** | 0 após revisão semestral | Governança editorial |

---

## 23. Narrativa Comercial

### Pitch de 1 frase

> "O Amigo do Prédio é a central operacional do síndico: prazos monitorados, pendências organizadas, dúvidas respondidas — sem improviso."

### Pitch de 30 segundos

> "Síndico tem responsabilidade enorme mas quase nenhum suporte. Prazos como AVCB e seguro do prédio vencem sem aviso. Dúvidas sobre multas, assembleias e funcionários ficam sem resposta confiável. O Amigo do Prédio resolve isso: um app que avisa os prazos antes de virarem urgência, orienta em situações do dia a dia com base de conhecimento condominial curada, e organiza tudo — agenda, pendências e histórico — em um só lugar. Instalação em 2 minutos, sem cadastro e sem servidor."

### Pitch para síndico

> "Você recebe um problema no condomínio e não sabe o que fazer. Abre o app, digita o problema — 'morador faz barulho toda noite' — e em segundos tem a orientação correta, com o próximo passo e o modelo de comunicado. Além disso, o app monitora os prazos mais importantes do seu prédio e avisa antes que virem emergência. É como ter um consultor de condomínio disponível 24 horas, no seu celular, a um custo de café."

### Pitch para administradora

> "Você sabe quantas ligações recebe de síndicos perguntando 'posso multar?', 'como convocar assembleia?', 'quem paga o vazamento?'? O Amigo do Prédio responde essas perguntas automaticamente, com base curada e disclaimers corretos. Você reduz o suporte básico, o síndico tem mais autonomia, e você oferece um diferencial digital que nenhuma administradora concorrente tem."

### Pitch para investidor/parceiro

> "O mercado condominial brasileiro tem 180.000 condomínios e cresce com a verticalização urbana. O síndico é o profissional mais desassistido da cadeia condominial — ele tem responsabilidade jurídica e operacional mas nenhuma ferramenta digital adequada. O Amigo do Prédio é a primeira central operacional mobile-first especificamente para síndicos: sem o peso de um ERP, sem a imprecisão de um chatbot genérico. Arquitetura PWA de custo zero, base de conhecimento curada com 316 entradas, motor determinístico com 87% de recall. O produto está em lapidação interna — sem beta ainda — mas com telemetria real ativa. O próximo passo é beta privado com 10 síndicos e validação de retenção antes de qualquer investimento em aquisição."

### Promessa central e disclaimers

**Promessa:** "Seu condomínio, sob controle."
**Subpromessa:** "Orientações práticas para o dia a dia do síndico."
**Disclaimer obrigatório em toda comunicação externa:** "O Amigo do Prédio oferece orientações de caráter informativo e educativo. Não substitui assessoria jurídica, administradora ou profissional habilitado."

---

## 24. Análise SWOT

### Forças

- Motor determinístico com 87% de recall e zero alucinação — produto confiável por design
- Base de conhecimento de 316 entradas auditada, com guia editorial documentado
- Arquitetura PWA com zero dependência de SDK externo — bundle < 230 kB, instalação instantânea
- Interface premium mobile-first que transmite confiabilidade
- Foco específico no síndico — não é produto horizontal ou chatbot genérico
- Ciclo operacional completo: dúvida → orientação → ferramenta → pendência → revisão → histórico
- Telemetria real ativa com privacidade garantida (zero PII)
- Fundador como usuário natural do produto (síndico ou próximo do ecossistema)
- 90+ fases documentadas — processo de desenvolvimento maduro e rigoroso
- Velocidade de iteração: de concept a MVP premium em meses, sem equipe

### Fraquezas

- Zero usuários reais até hoje — sem validação de mercado
- Sem login/sync — risco de perda de dados e limitação de adoção multi-dispositivo
- Persistência em localStorage — barreira para escala e confiança corporativa
- Sem billing — produto gratuito sem receita
- Sem equipe — risco de single point of failure no fundador
- KB regional (trabalhista SECOVI-Rio) — não cobre todo o Brasil com precisão
- Termos de uso e política de privacidade ainda em rascunho — barreira para beta
- Sem marca consolidada — nenhum reconhecimento de mercado ainda
- Sem canal de suporte documentado — risco de credibilidade com usuários reais

### Oportunidades

- Mercado de 180.000 condomínios no Brasil com baixíssima penetração de tecnologia mobile-first
- Síndico profissional é um segmento emergente e crescente com disposição a pagar
- Administradoras buscam diferencial tecnológico para fidelizar síndicos clientes
- WhatsApp como canal de distribuição viral — o síndico já está lá
- IA/RAG com convenção do condomínio — proposta de valor única e difícil de copiar
- Conteúdo educativo no Instagram — CAC orgânico baixo para público de síndicos
- Verticalização urbana brasileira — novos condomínios, novos síndicos, todo ano
- Regulamentação crescente (AVCB, LGPD, NR-10) aumenta a necessidade de orientação correta

### Ameaças

- Interpretação da OAB como exercício ilegal da advocacia — risco de embargo
- Administradoras grandes lançando produtos concorrentes com recursos financeiros maiores
- Mudança na legislação condominial que desatualiza a KB rapidamente
- Síndico troca de cargo anualmente — churn estrutural alto
- Plataformas de IA generativa (ChatGPT, Gemini) melhorando a qualidade condominial — pode reduzir a vantagem da base curada no longo prazo
- localStorage perdido por usuários tech-não-savvy — risco de experiência negativa inicial
- Meta mudando os termos do WhatsApp Business — afetaria a Fase 4

---

## 25. Recomendação Estratégica

### O produto está pronto para beta privado?

**Quase.** Faltam dois elementos críticos:

1. **Termos de Uso e Política de Privacidade revisados por advogado** — não é opcional. Sem isso, o fundador está exposto juridicamente ao primeiro síndico que tomar uma decisão incorreta com base na orientação do app.

2. **Smoke test completo em dispositivo físico iOS e Android** — o app foi desenvolvido em desktop; comportamentos de scroll, safe area, PWA e localStorage podem variar em dispositivos reais.

Com esses dois itens resolvidos, o produto está tecnicamente maduro para beta. A interface é premium, a base de conhecimento é sólida, o onboarding funciona, a telemetria está ativa.

### O que falta antes de mostrar para usuários reais

1. Revisão jurídica dos termos (urgente)
2. Smoke test físico (1 semana)
3. Canal de feedback ativo (1 dia)
4. Definição clara de quem convida e com qual instrução (protocolo de beta)

### O que NÃO deve ser feito agora

- Não adicionar IA/RAG antes de ter dados reais de uso e taxa de fallback validada
- Não implementar billing antes de ter retenção comprovada
- Não construir para administradoras antes de validar síndico individual
- Não lançar publicamente antes do beta privado
- Não fazer mídia paga antes de ter prova de conversão orgânica

### O próximo passo mais inteligente

Beta privado com 5–10 síndicos conhecidos, com canal de feedback direto, acompanhamento ativo da telemetria e entrevistas após 2 semanas. O objetivo não é validar o conceito (isso já foi feito internamente) — é identificar os 3 problemas de jornada que precisam ser corrigidos antes do lançamento.

### O maior risco de foco

**Overbuilding.** O produto tem 90+ fases, features completas e motor sofisticado. O risco é continuar iterando em features sem nenhum dado de usuário real. A próxima fase de aprendizado não virá do código — virá dos síndicos.

### A tese mais forte para defender o produto

O Amigo do Prédio não compete com ERPs pesados nem com IA generativa sem foco. Compete com o estado atual do síndico voluntário: **WhatsApp + planilha + improviso**. Qualquer produto que ofereça organização de prazos, orientação confiável e registro de pendências já é melhor que o baseline. O diferencial adicional é a interface premium que transmite confiança e o motor determinístico que não alucina.

A tese é: **o síndico não precisa de IA sofisticada. Ele precisa de organização, orientação correta e lembretes antes de virar urgência.** O Amigo do Prédio resolve exatamente isso.

---

## 26. Conclusão

O Amigo do Prédio chegou a um ponto de inflexão: o produto está tecnicamente completo e visualmente premium, com todas as funcionalidades centrais implementadas, base de conhecimento auditada e telemetria real ativa. O motor determinístico tem 87% de recall e zero falhas críticas em auditoria. A interface alcançou o nível "impressiona no primeiro uso". O onboarding funciona sem instrução.

O que não existe ainda é nenhum usuário real.

Essa é deliberadamente a estratégia correta de fundador solo: lapidar antes de expor. O produto que o primeiro síndico verá será um produto que impressiona — não um MVP bruto que "ainda estamos melhorando".

O potencial de mercado é real: 180.000 condomínios, síndico voluntário desassistido, setor com baixíssima penetração de tecnologia mobile-first. A tese de produto é diferenciada: não é chatbot genérico, não é ERP pesado, não promete consultoria jurídica. É um copiloto operacional honesto sobre o que faz e o que não faz.

Os próximos 90 dias são os mais críticos: termos revisados, smoke test físico, beta privado com 10 síndicos, análise de telemetria real, ajustes de jornada. Só depois de provar retenção começa a fazer sentido investir em backend completo, IA, WhatsApp e billing.

O maior cuidado a ter: não prometer o que ainda não é. O app orienta — não aconselha juridicamente. Ele organiza — não garante compliance. Ele lembra — não responde por decisões. Com essa honestidade como princípio, o produto constrói confiança que escala melhor que qualquer hype.

**Estado atual:** MVP premium completo, pré-beta, sem usuários reais.
**Potencial:** central operacional de referência para síndicos brasileiros.
**Próximo passo:** beta privado.
**Marco de 12 meses:** primeiros R$5.000 de MRR, 150+ condomínios ativos, retenção D30 > 20%.

---

*Amigo do Prédio — Relatório Técnico-Comercial*
*Versão: 2026-05-24 (pós-Fase 90G)*
*Documento interno — não distribuir sem revisão do fundador.*
