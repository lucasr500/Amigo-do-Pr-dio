# Sprint — Racionalização + Evolução Real (AdP) · escopo MÁXIMO

> **Como usar:** preencha DATA, abra o Claude Code na **máquina real** (não em mount sincronizado), na raiz do repo, e cole tudo **a partir de** `# TAREFA`. Este sprint reestrutura a arquitetura de informação e introduz features novas, sob invariantes duras e um checkpoint obrigatório antes da mudança de navegação. Decisões de produto já estão cravadas pelo Lucas (ver bloco DECISÕES).

---

```
# TAREFA: SPRINT DE RACIONALIZAÇÃO + EVOLUÇÃO REAL — Amigo do Prédio (escopo MÁXIMO)

## VARIÁVEIS
- DATA = <AAAA-MM-DD>
- BRANCH = sprint-6.1-lapidacao-premium   # ou a branch de trabalho atual
- BRANCH_PRODUCAO = main
- RELATORIO_PRODUTO = RELATORIO-produto-racionalizacao-2026-06-18.md   # diagnóstico-base

## PAPEL E MISSÃO
Você é o Claude Code no repositório do Amigo do Prédio (branch BRANCH), com autoridade plena
(código, testes, git, CI), sob as INVARIANTES DURAS abaixo. Pense como arquiteto de produto +
arquiteto de sistemas + advogado condominial: denso por dentro, sereno por fora (Apple-like).
O Lucas é vibecoder/estrategista — explique micro-validações técnicas só quando mudarem uma
decisão; o resto, resolva e siga.

Missão deste sprint: TRANSFORMAR o app de "dois produtos fundidos e densos" em UM produto
coerente — o segundo cérebro + rede social do condomínio — cortando duplicação, simplificando
a arquitetura de informação, adaptando o financeiro para transparência, promovendo a rede
social, e aprofundando a persona Morador. "Evolução real e visível", com segurança máxima.
Tudo guiado pelo loop informar→discutir→organizar→decidir→lembrar e pelo anti-posicionamento
da Tese ("não competimos com a administradora: boleto, folha, financeiro").

## DECISÕES DO LUCAS (cravadas — NÃO reabrir; são o norte deste sprint)
1. FINANCEIRO → adaptar para TRANSPARÊNCIA. Aposentar a gestão financeira (caixa/contas/
   inadimplência/inteligência/AGO como gestão); criar "Prestação de contas / Transparência"
   leve (publicar balancete/relatório como documento, visível por papel via a régua `visibility`).
   Simuladores (multa, reajuste) migram para o Assistente como ações.
2. NAVEGAÇÃO → promover a COMUNIDADE (rede social) a destino de 1ª classe na barra; dissolver
   "Mais" (CondominioTab) em um "Ajustes" enxuto. (Layout exato definido no CHECKPOINT.)
3. TEMA Nº1 → Racionalização + coerência (matar duplicação é a prioridade que sustenta o resto).
4. ESCOPO → MÁXIMO: reestruturação de IA + features novas, COM checkpoints fortes.
5. MOTOR "HOJE" → consolidar os vários motores (Briefing, Guidance, Revisão mensal ×3, Plano,
   Command Center, Revisão semanal) num ÚNICO motor de "o que faço agora?" no Início.
6. DOCUMENTOS → unificar os dois sistemas (essenciais + públicos) num só, com visibilidade por
   papel (gestao/conselho/moradores/publico — a mesma régua de Decisões).
7. "PERGUNTE AO PRÉDIO" (IA sobre os dados do prédio) → só APÓS o relacional. Neste sprint,
   apenas PREPARAR o terreno (seam de contexto), sem IA externa (ai_layer_enabled segue off).
8. PERSONA → aprofundar o MORADOR na camada social (além do síndico).

## CONTEXTO (confirmar no código — código vence doc)
- Inventário e diagnóstico completos em RELATORIO_PRODUTO. Pontos-chave a confirmar:
  • Duplicação: Decisões em 3 lugares (Memória, "Mais"/Seção 4, Ferramentas/"Decisões do síndico"
    = guia Q&A com nome colidente); Documentos em 3 (Memória, "Mais"/Seção 6, Comunicação/públicos);
    Linha do tempo em 3 (Memória, Comunicação, "Mais"/operacional); Revisão mensal em cards (Início)
    + 3 painéis ("Mais").
  • "Mais" (components/tabs/CondominioTab.tsx) = 9 seções, várias duplicando abas dedicadas.
  • Financeiro: components/FinancialPanel, FinancialIntelligencePanel, financial/FinancialMonthlyChart,
    AgoReportPanel (em "Mais"/Seção 5) + simuladores em ToolsTab ("Financeiro rápido").
  • Régua de visibilidade já existe (lib/community-types Visibility) e foi aplicada a Decisões.
- Migração relacional de DECISÕES está EM CURSO em paralelo (D1–D5: 008_decisions.sql,
  decisionsRemote/Merge/Sync, flag decisions_remote_enabled=false). NÃO conflite com ela.
- Baseline de saúde (re-verificar): tsc 0; vitest ~855 verdes + 4 do gate skipados; build conclui;
  gate de isolamento verde; flags de exposição todas false.

## INVARIANTES DURAS (quebrar qualquer uma aborta o sprint)
1. NÃO-EXPOSIÇÃO: nada exposto a síndico/cliente externo. Toda "rede social/morador" deste sprint
   é UI/estrutura local e por papel (view mode), não multi-usuário real (isso é pós-relacional).
2. NÃO ligue NENHUMA flag de exposição/remoto/IA (assemblies_remote_enabled, decisions_remote_enabled,
   sync de exposição, ai_layer_enabled…). Tudo nasce gated-off no default atual.
3. SEM PERDA DE DADOS: toda unificação de modelo local (Documentos, Linha do tempo) exige
   normalizador idempotente que MIGRA os dados existentes em localStorage sem perda, com teste de
   migração de dados antigos. Nada de apagar chaves de storage sem migração.
4. SEM QUEBRAR DEPENDENTES: antes de aposentar/remover qualquer módulo, mapeie TODOS os importadores
   (grep). Se outra parte consome a lib (ex.: health-score, condominio-overview, command-center podem
   ler financeiro), ESVAZIE a superfície de UI e preserve/adapte a lib — não quebre o tsc nem cálculos.
5. Local-first continua a fonte de verdade; não toque na migração relacional em curso a não ser para
   não conflitar. Não infle multi-tenant para administradora. Produção intocada. Sem segredos.
6. NÃO mude texto jurídico (termos/privacidade) sem sinalizar. Copy de produto pode evoluir para
   coerência de vocabulário (faz parte da racionalização), mas registre as mudanças de copy no relatório.
7. DISCIPLINA: commit por caminho EXPLÍCITO (nunca git add -A/.), um tema por commit, mensagem
   convencional; ANTES de cada commit: tsc 0 + vitest sem regressão + (se tocar lib/**/supabase/**)
   gate verde. Preserve o line-ending de cada arquivo. Diff mínimo e legível.

## FASE 0 — PLANO (read-only, rápido)
- Rode: git log --oneline -10; git status; tsc --noEmit; vitest run (nº); npm run build (conclui?).
- Confirme o inventário/duplicações do RELATORIO_PRODUTO no código (arquivo:linha).
- Para cada módulo a tocar, liste os IMPORTADORES (grep) — mapa de dependências antes de mexer.
- Publique no chat o plano de fatias (abaixo) com ordem e pontos de checkpoint. Então execute.

## WORKSTREAMS (executar em fatias verticais; cada fatia: testes + tsc 0 + vitest + commit explícito)

### W1 — Matar a duplicação (PRIMEIRO; reversível, alto impacto de coerência)
- W1.1 Documentos: unificar "essenciais" + "públicos" num ÚNICO sistema com `visibility` por papel.
  Normalizador que migra os dados antigos dos dois stores para o unificado, sem perda (+ teste de
  migração). Uma única superfície de leitura/edição, filtrada por papel.
- W1.2 Linha do tempo: unificar institucional + operacional num só fluxo (uma fonte, filtros por tipo).
- W1.3 Decisões: fonte única (Memória). Remover a duplicata em "Mais"/Seção 4. Renomear/mover o guia
  Q&A "Decisões do síndico" (DecisoesSindicoPanel) para um nome não colidente, ou fundi-lo no Assistente.
- W1.4 Remover de "Mais" tudo que já tem casa dedicada (Memória institucional, Documentos).
Cada item: parity de comportamento, sem perda de dado, testes, commit isolado.

### W2 — Consolidar o motor "Hoje" (Início enxuto)
- Fundir Briefing + Guidance + Revisão mensal (×3) + Plano + Command Center + Revisão semanal num
  ÚNICO motor "Hoje / o que faço agora?", priorizado. Preservar o AssemblyHomeCard (wedge) e o acesso a
  Pendências/Saúde. Reaproveitar a lógica existente (guidance-engine, monthly-*, command-center) por
  baixo; cortar a redundância de UI. Testes da lógica consolidada.

### W3 — Financeiro → Transparência
- W3.1 Mapear importadores de lib/financial* (health-score, overview, command-center…). Preservar/
  adaptar a lib onde for consumida; remover apenas a SUPERFÍCIE de gestão (FinancialPanel,
  FinancialIntelligencePanel, FinancialMonthlyChart, AgoReportPanel) da navegação.
- W3.2 Criar "Prestação de contas / Transparência": publicar balancete/resumo como DOCUMENTO no
  sistema unificado de Documentos (W1.1), com visibilidade por papel (morador vê transparência).
  Sem ledger, sem inadimplência por unidade exposta.
- W3.3 Mover simuladores (multa, reajuste) para o Assistente como ações; remover a categoria
  "Financeiro rápido" de Ferramentas.

### W4 — Reestruturação da NAVEGAÇÃO (★ CHECKPOINT OBRIGATÓRIO antes de commitar)
- Promover COMUNIDADE a aba de 1ª classe; dissolver "Mais" em "Ajustes" enxuto (conta, backup,
  integridade, notificações). Redistribuir o conteúdo de "Mais": Comunicação→Comunidade;
  Memória institucional→aba Memória (já feito em W1); Dados/Conta→Ajustes; resto→cortar.
- ★ ANTES de mexer em lib/app-navigation.ts + BottomNav + app/page.tsx: APRESENTE ao Lucas 2–3
  layouts de barra (5 slots) com o mapa de redistribuição e sua recomendação. Ex.:
  (a) Início · Memória · [Perguntar] · Comunidade · Ajustes
  (b) Início · Memória · Comunidade · [Perguntar] · Pendências (Ajustes no header/Início)
  Espere o "pode ir" do Lucas. Só então implemente o seam de navegação, preservando deep-links.

### W5 — Profundidade do MORADOR (camada social)
- Elevar as superfícies do morador (home, mural, canal, transparência, participação consultiva na
  assembleia) à mesma qualidade Apple-like. Onboarding do morador, coerência de vocabulário/selo,
  notificações da comunidade (locais). Tudo por VIEW MODE/role (local), sem multi-usuário real
  (que é pós-relacional). Respeitar Não-Exposição.

### W6 — Preparar o terreno do "Pergunte ao Prédio" (sem IA externa)
- Organizar o seam de contexto do assistente (lib/contextual-assistant) para que, pós-relacional, a
  IA contextual sobre os dados do prédio plugue sem refator. Documentar o ponto de entrada. ai_layer
  segue off. Nada de IA externa neste sprint.

## REGRA DE AUTONOMIA (máximo com segurança)
- Execute SOZINHO W1, W2, W3, W5, W6 — são reversíveis, cobertos por testes e sem exposição.
- PARE no CHECKPOINT de W4 (navegação) e em qualquer: ação irreversível, mudança de texto jurídico,
  ligar flag, nova dependência pesada, ou decisão de produto não coberta pelas DECISÕES acima.
  Ao parar: contexto + opções + recomendação, sem travar em trivialidades.

## DEFINIÇÃO DE PRONTO (por fatia)
tsc 0 · vitest sem regressão · (se lib/**/supabase/**) gate verde · sem perda de dado (migração
testada) · dependentes intactos · flags inalteradas · produção intocada · diff mínimo · commit isolado
e bem descrito · relatório atualizado.

## ENTREGÁVEIS
1. docs/relatorio-sprint-racionalizacao-DATA.md: o que mudou por workstream (fatias, commits,
   evidência arquivo:linha), antes/depois da arquitetura de informação, e o placar de alinhamento
   atualizado (esp. Eixos 2/3/4).
2. Commits por caminho explícito, cada um verde.
3. Resumo de 1 tela no chat: evolução visível entregue + próxima ação única.

## FORMATO E REGRAS DE SAÍDA
- PT-BR, denso e direto; resumo primeiro, detalhe depois (Apple-like na escrita). Tabelas só onde ajudam.
- Evidência em arquivo:linha. [INCERTO] onde faltar confirmação. Não invente, não confunda
  "documentado" com "implementado". Separe "ações de código" de "decisões do Lucas".

## ANTI-PADRÕES A EVITAR
- Apagar dado/chave de storage sem migração; remover módulo sem mapear importadores (quebrar tsc/cálculos).
- Reabrir as DECISÕES cravadas; mexer na navegação sem o checkpoint; ligar qualquer flag.
- Recriar duplicação ("resolver" movendo sem unificar a fonte); refator amplo especulativo sem teste.
- Tratar a camada social como multi-usuário real (é pós-relacional); inflar multi-tenant p/ administradora.
- Encher de mudanças rasas; commitar com gate vermelho; git add -A.
```
