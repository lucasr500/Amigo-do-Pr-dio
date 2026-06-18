# Sprint DEFINITIVO — Trabalho Máximo, Profundo e Completo (AdP)

> **Como usar:** chat NOVO, Claude Code na **máquina real** (não em mount sincronizado), raiz do repo. Cole tudo **a partir de** `# TAREFA`. Este prompt é autossuficiente: carrega o contexto, o plano já decidido e a ordem. O objetivo é um sprint LONGO e AUTÔNOMO — executar o plano inteiro, fatia após fatia, com profundidade e segurança, SEM parar cedo.

---

```
# TAREFA: SPRINT COMPLETO DE RACIONALIZAÇÃO + EVOLUÇÃO — Amigo do Prédio

## VARIÁVEIS
- DATA = <AAAA-MM-DD>
- BRANCH = sprint-6.1-lapidacao-premium
- BRANCH_PRODUCAO = main

## CONTRATO DE EXECUÇÃO (leia primeiro — é o que torna este sprint "de verdade")
Você é o Claude Code no repositório do Amigo do Prédio, com autoridade plena (código, testes,
git, CI). Este é um sprint LONGO, AUTÔNOMO e DE ALTA INTENSIDADE. Regras de condução:
- EXECUTE O PLANO INTEIRO nesta sessão — todas as fatias (W1.1 → W1.2 → W2 → W3 → W5 → W6 →
  flip da navegação), uma após a outra. Não pare após uma fatia.
- Profundidade E completude. Cada fatia feita a fundo (com testes e migração quando houver) E
  todas as fatias entregues. Não escolha entre as duas: faça as duas.
- LOOP de trabalho: implemente a fatia → escreva/atualize testes → tsc 0 → vitest sem regressão →
  (se tocar lib/**/supabase/**) gate verde → commit por caminho explícito → push → PRÓXIMA fatia.
  Repita até o plano acabar. Não devolva o turno entre fatias.
- "Segurança máxima" é COMO cada fatia é feita (migração testada, importadores mapeados,
  reversível), NÃO um motivo para parar antes de terminar. "Turno longo", "profundidade vs
  quantidade" e "melhor em passes focados" NÃO são motivos válidos para encerrar: o passo focado
  é cada fatia; o sprint é todos eles. Use o orçamento de tempo/tokens em trabalho real.
- SÓ PARE se: (a) o plano inteiro terminou; (b) bater num bloqueio VERDADEIRO — ligar flag de
  exposição, operação destrutiva sem migração possível, ou uma decisão de produto que NÃO esteja
  já cravada abaixo. Nesses casos, registre o porquê + opções + recomendação e siga no que for
  possível em paralelo. Nunca pare só para perguntar "posso continuar?".
- Espera-se MÚLTIPLOS workstreams e MÚLTIPLOS commits nesta sessão — não um.

## MISSÃO E OBJETIVOS CANÔNICOS
Transformar o app de "dois produtos densos fundidos" em UM produto coerente: o segundo cérebro +
rede social do condomínio. Tudo serve ao loop informar→discutir→organizar→decidir→lembrar e ao
anti-posicionamento da Tese ("não competimos com a administradora: boleto, folha, financeiro;
somos a camada acima — integração, memória, governança, inteligência"). Personas: síndico (foco
atual, monetiza já), morador (ativa a rede social), conselho, funcionário. Estética Apple-like:
profundo por dentro, simples e óbvio por fora; resumo primeiro, detalhe depois; cada tela
responde "o que faço agora?". Se tiver acesso ao Notion, releia "Central de Inteligência →
Direção oficial" + "Tese consolidada 2026-06-17" antes de começar; senão, use este contexto.

## ESTADO ATUAL (confirme no código — código vence doc)
- Baseline: tsc 0; ~862 testes verdes + os do gate de isolamento skipados sem DB; build conclui;
  gate verde; flags de exposição todas false (assemblies/decisions/agenda remote, sync de
  exposição, ai_layer — off). NÃO ligue nenhuma.
- Migração relacional de DECISÕES em curso em paralelo (008_decisions.sql, decisionsRemote/Merge/
  Sync, flag decisions_remote_enabled=false). NÃO conflite com ela.
- Já feito no início desta racionalização: mapa de dependências (lib/financial* é consumido por
  ~18 módulos → preservar libs, esvaziar só UI; "memória institucional" tem 7+ deep-links → tratar
  na realocação/nav); W1.3 concluído (o guia Q&A "DecisoesSindicoPanel" virou "Guia de situações",
  resolvendo a colisão com Decisões; referência em Response.tsx corrigida); navegação DECIDIDA.
- Pode haver commits locais não pushados desta racionalização — comece confirmando git status e
  pushe o que estiver verde e pendente (por caminho explícito) antes de seguir.

## DECISÕES DO LUCAS (cravadas — NÃO reabrir)
1. FINANCEIRO → adaptar para TRANSPARÊNCIA: aposentar a gestão financeira da navegação (caixa/
   contas/inadimplência/inteligência/AGO); criar "Prestação de contas / Transparência" leve
   (publicar balancete/resumo como DOCUMENTO, visível por papel via a régua `visibility`).
   Simuladores (multa, reajuste) migram para o Assistente como ações.
2. NAVEGAÇÃO (layout escolhido = opção A): Início · Memória · [Perguntar] · Comunidade · Ajustes.
   Promover Comunidade a 1ª classe; dissolver "Mais" (CondominioTab) em "Ajustes" enxuto.
3. ORDEM (cravada por segurança — a barra é trocada POR ÚLTIMO, senão orfana conteúdo):
   W1.1 → W1.2 → W2 → W3 → W5 → W6 → (por fim) flip da navegação para a opção A.
4. MOTOR "HOJE": consolidar Briefing + Guidance + Revisão mensal (×3) + Plano + Command Center +
   Revisão semanal num ÚNICO motor "o que faço agora?", reaproveitando a lógica existente.
5. DOCUMENTOS: unificar "essenciais" + "públicos" num só modelo, com visibilidade por papel.
6. "PERGUNTE AO PRÉDIO" (IA sobre dados do prédio): só PREPARAR o seam de contexto agora; IA
   externa fica para depois do relacional (ai_layer_enabled off).
7. PERSONA: aprofundar o MORADOR na camada social (por view mode/role, local).

## INVARIANTES DURAS (quebrar qualquer uma aborta o sprint)
1. SEM PERDA DE DADOS: toda unificação de modelo local (Documentos, Linha do tempo) exige
   normalizador idempotente que MIGRA os stores existentes em localStorage sem perda, com TESTE de
   migração de dados antigos (estado pré-unificação → estado novo). Nunca apague chave de storage
   sem migração comprovada.
2. SEM QUEBRAR DEPENDENTES: antes de aposentar/remover qualquer módulo, mapeie TODOS os importadores
   (grep). Onde a lib é consumida (financial* por ~18 módulos; health-score, overview, command-center
   etc.), ESVAZIE só a superfície de UI e preserve/adapte a lib — não quebre tsc nem cálculos.
3. NÃO-EXPOSIÇÃO: nada exposto a externo. "Rede social/morador" deste sprint é UI/estrutura por
   papel (view mode), local — não multi-usuário real (isso é pós-relacional). NÃO ligue flags.
4. Local-first é a fonte de verdade; não conflite com a migração relacional em curso. Não infle
   multi-tenant para administradora. Produção intocada. Sem segredos. Sem novas dependências pesadas.
5. NÃO altere texto jurídico (termos/privacidade) sem sinalizar. Copy de produto pode evoluir para
   coerência de vocabulário; registre mudanças de copy no relatório.
6. DISCIPLINA: commit por caminho EXPLÍCITO (nunca git add -A/.), um tema por commit, mensagem
   convencional; ANTES de cada commit: tsc 0 + vitest sem regressão + (se lib/**/supabase/**) gate
   verde. Preserve o line-ending de cada arquivo. Diff mínimo e legível. Push autorizado por caminho
   explícito ao concluir cada fatia (mantém o trabalho salvo no origin).

## PLANO — execute na ORDEM, fatia a fatia, sem parar entre elas
### W1.1 — Documentos unificados (KEYSTONE)
Um único modelo de Documentos (essenciais + públicos) com `visibility` por papel (gestao|conselho|
moradores|publico). Normalizador idempotente que migra os DOIS stores locais sem perda + teste de
migração de dados antigos. Uma superfície de leitura/edição filtrada por papel. Destrava Documentos
na Memória, a Transparência (W3) e a régua de papel do Morador (W5).

### W1.2 — Linha do tempo unificada
Fundir institucional + operacional numa só fonte, com filtros por tipo. Migração sem perda + teste.
Remover as superfícies duplicadas.

### W2 — Motor "Hoje" único
Fundir Briefing + Guidance + Revisão mensal (×3) + Plano + Command Center + Revisão semanal num
único motor priorizado de "o que faço agora?" no Início. Preservar o card da Assembleia (wedge) e o
acesso a Pendências/Saúde. Reaproveitar a lógica (guidance-engine, monthly-*, command-center) por
baixo; cortar a redundância de UI. Testes da lógica consolidada.

### W3 — Financeiro → Transparência
Mapear importadores de lib/financial* (preservar/adaptar onde consumido). Remover da navegação a
SUPERFÍCIE de gestão (FinancialPanel, FinancialIntelligencePanel, FinancialMonthlyChart,
AgoReportPanel). Criar "Prestação de contas / Transparência": publicar balancete/resumo como
documento no sistema unificado (W1.1), visível por papel; sem ledger, sem inadimplência por unidade
exposta. Mover simuladores (multa, reajuste) para o Assistente; remover a categoria "Financeiro
rápido" de Ferramentas.

### W5 — Profundidade do Morador
Elevar as superfícies do morador (home, mural, canal, transparência, participação consultiva na
assembleia) à qualidade Apple-like, por view mode/role (local). Onboarding do morador, coerência de
vocabulário/selo, notificações da comunidade (locais). Respeitar Não-Exposição.

### W6 — Seam do "Pergunte ao Prédio"
Organizar o ponto de contexto (lib/contextual-assistant) para que, pós-relacional, a IA contextual
sobre os dados do prédio plugue sem refator. Documentar o seam. ai_layer off; nada de IA externa.

### W7 (POR ÚLTIMO) — Flip da navegação para a opção A
Só depois de W1.1–W6 realocarem o conteúdo. Implementar Início · Memória · [Perguntar] · Comunidade
· Ajustes em lib/app-navigation.ts + BottomNav + app/page.tsx, dissolvendo "Mais" em "Ajustes"
(conta, backup, integridade, notificações). Preservar TODOS os deep-links (os 7+ da memória
institucional e demais), redirecionando-os para os novos destinos. Teste os deep-links.

## ALÉM DO PLANO (se sobrar orçamento, sem scope-creep)
Depois do plano, varra o app por melhorias de ALTA alavancagem e baixo risco alinhadas aos objetivos:
incoerências de vocabulário/selo remanescentes, estados vazios fracos, telas sem "o que faço agora?",
pequenas duplicações restantes. Cada uma como fatia testada e commitada. NÃO faça refator amplo
especulativo nem features fora das DECISÕES.

## DEFINIÇÃO DE PRONTO (do SPRINT, não só de uma fatia)
Todos os workstreams W1.1–W7 entregues; tsc 0; vitest completo verde (sem regressão, com os novos
testes de migração e de lógica consolidada); gate verde; build conclui; sem perda de dado; dependentes
intactos; flags inalteradas; produção intocada; tudo commitado por caminho explícito e pushado;
docs/relatorio-sprint-DATA.md atualizado.

## ENTREGÁVEIS
1. docs/relatorio-sprint-DATA.md atualizado AO LONGO do sprint (não só no fim): por workstream, o que
   mudou (fatias, commits, evidência arquivo:linha), antes/depois da arquitetura de informação,
   migrações feitas, e o placar de alinhamento atualizado (Eixos 2/3/4 sobem).
2. Commits por caminho explícito, cada um verde, pushados.
3. Resumo final de 1 tela: tudo que evoluiu nesta sessão + placar + próxima ação única.

## FORMATO E REGRAS DE SAÍDA
PT-BR, denso e direto; resumo primeiro, detalhe depois. Evidência em arquivo:linha. [INCERTO] onde
faltar confirmação; não invente, não confunda "documentado" com "implementado". Separe "ações de
código" de "decisões do Lucas". Relate progresso de forma compacta entre fatias, mas NÃO pare por isso.

## ANTI-PADRÕES (não faça)
- Parar cedo / devolver o turno após uma fatia / pedir "posso continuar?" — continue até o fim do plano.
- Usar "segurança", "profundidade>quantidade" ou "turno longo" como desculpa para encerrar.
- Apagar dado/chave de storage sem migração testada; remover módulo sem mapear importadores.
- Reabrir as DECISÕES cravadas; trocar a barra antes da hora (orfana conteúdo); ligar qualquer flag.
- "Resolver" duplicação movendo sem unificar a fonte; refator amplo especulativo sem teste.
- Tratar a camada social como multi-usuário real (é pós-relacional); inflar multi-tenant p/ administradora.
- git add -A; commit misturando temas; commitar com gate vermelho; amontoar fatias sem testes no fim.
```
