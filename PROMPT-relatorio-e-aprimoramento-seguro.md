# Prompt — Relatório + Aprimoramento Máximo e Seguro (AdP)

> **Como usar:** preencha as VARIÁVEIS, abra o Claude Code na **máquina real** (não em mount sincronizado), na raiz do repo, e cole tudo **a partir de** `# TAREFA`. Roda em duas fases encadeadas: relatório de estado/alinhamento → execução autônoma dos aprimoramentos já aprovados, gated-off, com gate verde a cada passo.

---

```
# TAREFA: RELATÓRIO + APRIMORAMENTO MÁXIMO E SEGURO — Amigo do Prédio

## VARIÁVEIS
- DATA = <AAAA-MM-DD>
- BRANCH = sprint-6.1-lapidacao-premium
- BRANCH_PRODUCAO = main
- RELATORIO_ANTERIOR = docs/relatorio-alinhamento-2026-06-18.md   # ou o mais recente

## PAPEL E MANDATO DUPLO
Você é o Claude Code no repositório do Amigo do Prédio (branch BRANCH), com autoridade plena
(código, testes, git, CI), operando sob as INVARIANTES DURAS abaixo. Pense como arquiteto de
sistemas + consultor de produto + advogado condominial: denso por dentro, sereno por fora
(Apple-like). O Lucas é vibecoder/estrategista — explique micro-validações técnicas de forma
breve e acessível só quando mudarem uma decisão dele; o resto, resolva e siga.

Mandato duplo, nesta ordem, sem parar entre as fases:
(1) RELATÓRIO: produza o estado atual verificado e o alinhamento aos objetivos.
(2) APRIMORAMENTO: imediatamente após, EXECUTE os aprimoramentos de maior alavancagem, "ao
    máximo" e "da forma mais segura possível". "Ao máximo" = maximizar VALOR e QUALIDADE pela
    priorização ruthless e profundidade — não o número de mudanças. "Mais segura" = gated-off,
    reversível, coberto por testes e pelo gate, sem nunca expor nada.

Pergunta-mãe que tudo serve: "Qual a sequência de aprimoramentos que mais aproxima o app dos
objetivos do Lucas (Direção Oficial + Tese/wedge + Apple-like) rumo ao portão Completo–Núcleo,
sem violar a Regra de Não-Exposição — e execute-a com segurança máxima?"

## CONTEXTO JÁ ESTABELECIDO (NÃO re-derivar nem contradizer; CONFIRMAR no código)
Trate isto como verdade de partida, mas valide cada ponto em arquivo:linha (código vence doc):
- Objetivos canônicos (Notion): SaaS multi-tenant; multi-persona (síndico/condômino/conselho/
  funcionário); Regra de Não-Exposição até o portão Completo–Núcleo (síndico multi-tenant +
  segurança/RLS + jurídico); Completo–Pleno (4 personas) NÃO bloqueia exposição. Wedge da
  Assembleia + loop informar→discutir→organizar→decidir→lembrar; 3 camadas (social/
  institucional/IA); separação jurídica opinião≠comunicado≠deliberação.
- Já entregue e verde: separação de natureza (lib/content-nature.ts + components/
  ContentNatureBadge) presente em Assembleia, Mural (ORIGIN_BADGE removido), Decisões e Home do
  morador; timeline SEM selo de propósito. Card do wedge no Início do síndico (lib/assembly-home.ts).
  Paridade local Decision.visibility? (default 'gestao' em normalizeDecision; aditiva e inerte).
- Baseline de saúde (re-verifique): tsc 0; ~855 testes verdes + 4 do gate skipados sem DB;
  npm run build conclui; gate de isolamento verde nos runs recentes (#6–#9). Flags de exposição
  todas false (assemblies_remote_enabled, agenda_remote_enabled, sync_enabled, multi_device_enabled,
  ai_layer_enabled).
- GARGALO DOMINANTE (confirmado): o plano de dados é local-first; o multi-tenant relacional está
  construído e provado isolado (gate verde), mas NENHUM módulo o consome em runtime. Tudo
  "compartilhado/multi-persona" é demo até a migração relacional deliberada.
- DECISÕES DO LUCAS JÁ TOMADAS (NÃO reabrir):
  • A migração relacional começa por DECISÕES (não Timeline — Timeline é derivada).
  • Coluna `visibility` (enum gestao|conselho|moradores|publico, default gestao, CHECK); RLS de
    LEITURA só gestão+conselho NESTA fase (residente/viewer NÃO leem decisão — isso é Pleno).
  • Região do Supabase = sa-east-1/São Paulo (RESOLVIDO; sem transferência internacional).
  • "Sync segue a autenticação" é política formalizada.
  • PF→PJ é o ÚNICO bloqueio remanescente e trava apenas o ROLLOUT (ligar remoto, D6), não o
    código gated-off (D1–D5).
  • Desenho canônico aprovado (rev.2): docs/desenho-migracao-relacional-decisoes-2026-06-18.md.
  • Padrão a espelhar (já provado): supabase/migrations/007_assemblies.sql + lib/tenant/
    assembliesRemote.ts + assembliesMerge.ts + o teste de isolamento do gate.

## FONTES E HIERARQUIA
1. CANÔNICA (objetivos) = Notion: "Amigo do Prédio — Central de Inteligência" (Direção oficial),
   "Tese Integração (consolidada 2026-06-17)", base "AdP — Backlog de Produto". Em conflito de
   OBJETIVO, o Notion vence. Se o Notion não abrir, use docs/INDEX.md + roadmap e marque [INCERTO].
2. EXECUÇÃO (o que existe) = o CÓDIGO. Para "está pronto", confirme em arquivo:linha.
3. Desenho/roadmap no repo: o desenho rev.2 acima, docs/roadmap-pre-lancamento, multi-tenant-roadmap,
   relatório do gate, RELATORIO_ANTERIOR. 4. git log = execução real.

## INVARIANTES DURAS (o núcleo de segurança — quebrar qualquer uma aborta o trabalho)
1. REGRA DE NÃO-EXPOSIÇÃO: nada exposto a síndico/cliente externo. Maturidade técnica não é
   autorização — só o Lucas, contra o portão, libera.
2. NÃO ligue NENHUMA flag de exposição/remoto/sync (assemblies_remote_enabled,
   decisions_remote_enabled, sync_enabled, etc.). Tudo que você escrever nasce gated-off, default false.
3. Toda tabela/coluna nova em supabase/ exige RLS + teste de isolamento entre condomínios VERDE
   antes do commit. Visibilidade só na UI = vazamento, proibido.
4. LOCAL-FIRST continua a fonte de verdade. Cutover de leitura é DELIBERADO e reversível (flag
   off → comportamento idêntico ao de hoje). NÃO migre dados "de passagem", sem backfill silencioso.
5. NÃO infle multi-tenant para hierarquia de administradora (Futuro). NÃO toque em PF→PJ nem em
   texto jurídico/copy de produto sem OK do Lucas. Sem novas dependências sem justificativa.
6. Produção intocada (BRANCH ≠ BRANCH_PRODUCAO). Sem segredos no repo.
7. DISCIPLINA DE COMMIT: caminho EXPLÍCITO (nunca git add -A/.), um tema por commit, mensagem
   convencional; e ANTES de cada commit: npx tsc --noEmit (0) + npx vitest run (sem regressão) +,
   se tocar lib/**/supabase/**, gate de isolamento verde. Preserve o line-ending de cada arquivo.

## FASE 1 — RELATÓRIO (read-only; rápido porque a direção já está decidida)
Não altere código nesta fase. Rode e reporte com evidência:
- git log --oneline -15; git status; npx tsc --noEmit; npx vitest run (nº verde/skip);
  npm run build (conclui?); estado do gate (último run sobre HEAD).
- Confirme o CONTEXTO JÁ ESTABELECIDO contra o código (cada item: ✅ confirmado / 🟡 parcial /
  ⛔ divergente / ❓ incerto, com arquivo:linha). Aponte QUALQUER divergência entre o desenho
  rev.2 e o código real, com severidade e dono.
- Placar de alinhamento por eixo (com evidência e % justificado): 1 Direção Oficial · 2 Tese/wedge ·
  3 Apple-like · 4 Personas · 5 Completo–Núcleo. Use o RELATORIO_ANTERIOR como base e abra "O que
  mudou desde então".
- Reafirme o gargalo dominante e as decisões que só dependem do Lucas (com destaque: PF→PJ).
Saída da fase: salve docs/relatorio-alinhamento-DATA.md (denso, tabelas onde ajudam) e um resumo
de 1 tela no chat (placar por eixo + gargalo + plano da Fase 2). EM SEGUIDA, prossiga
automaticamente para a Fase 2 — sem esperar, pois a direção já foi aprovada pelo Lucas.

## FASE 2 — APRIMORAMENTO MÁXIMO E SEGURO (executar em fatias verticais, uma por vez)
### Trilha A (PRIORIDADE) — migração relacional de DECISÕES, gated-off, fiel ao desenho rev.2
Espelhe assemblies (007 / assembliesRemote / assembliesMerge / teste do gate). Sequência:
- D1: supabase/migrations/<n>_decisions.sql — tabela `decisions` (PK = id do cliente; condominio_id
  + ON DELETE CASCADE; colunas espelhando Decision com CHECK em category/status/risk; coluna
  `visibility` enum default 'gestao' com CHECK; linked_* TEXT sem FK; índices; trigger updated_at;
  GRANTs). RLS: leitura = membro gestão/conselho; escrita = owner/manager/council. + Teste de
  isolamento entre condomínios para `decisions`, incluindo o caso do residente (não lê / não escreve).
  Gate verde obrigatório.
- D2: lib/tenant/decisionsRemote.ts (mirrorUpsert/mirrorDelete, best-effort, anon+RLS) + flag
  `decisions_remote_enabled` (default FALSE). Dual-write PUSH no CRUD local, no-op com flag off.
- D3: lib/tenant/decisionsMerge.ts (last-write-wins por updatedAt; sem tombstones) + testes.
- D4: cutover de LEITURA — pullRemoteDecisions() no fluxo de sync/auth (NÃO dentro de getDecisions),
  merge→store local, preservando local-first como fallback. Com flag off / anônimo: comportamento
  byte-a-byte idêntico ao atual. Testes de paridade.
- D5: testes de integração/paridade local↔remoto + atualizar o desenho/relatório com o status real.
- D6 (NÃO EXECUTAR): ligar o remoto em produção — bloqueado por PF→PJ + decisão de rollout do Lucas.
Cada fatia D1–D5: tests cobrindo a lógica nova, tsc 0, vitest sem regressão, gate verde, commit por
caminho explícito, mensagem convencional, registro no relatório.

### Trilha B (oportunística, só se barata, isolada e não conflitar com A) — coerência Apple-like
Polimentos de alto valor e baixo risco (vocabulário/selo consistentes, estados vazios, "o que faço
agora?", hierarquia). Sem refator amplo, sem troca de copy de produto/jurídica.

### REGRA DE AUTONOMIA (a forma "mais segura" de ir ao máximo)
Proceda SOZINHO no que for, cumulativamente: (a) já aprovado no desenho rev.2 ou neste prompt,
(b) gated-off/reversível, (c) coberto por testes + gate verde. PARE e pergunte ao Lucas apenas
para: decisão estrutural NOVA não coberta pelo desenho; qualquer ligar de flag/exposição; PF→PJ;
mudança de copy de produto ou texto jurídico; nova dependência; ou qualquer ação irreversível.
Ao parar, apresente o porquê, as opções e sua recomendação — não fique bloqueado em trivialidades.

## DEFINIÇÃO DE PRONTO (por fatia)
tsc 0 · vitest sem regressão · (se lib/**/supabase/**) gate verde · flags de exposição inalteradas ·
local-first intacto com flag off · produção intocada · diff mínimo e legível · commit isolado e
bem descrito · relatório atualizado.

## ENTREGÁVEIS
1. docs/relatorio-alinhamento-DATA.md (Fase 1) + atualizações de status da migração (Fase 2).
2. Os commits das fatias (cada um verde, isolado, por caminho explícito).
3. Resumo final de 1 tela: o que avançou (fatias + commits + evidência), placar de alinhamento
   atualizado, e a PRÓXIMA AÇÃO ÚNICA (provavelmente: decisão de rollout / PF→PJ, ou a próxima trilha).

## FORMATO E REGRAS DE SAÍDA
- PT-BR, denso e direto, sem enchimento; resumo primeiro, detalhe depois (Apple-like na escrita).
- Evidência sempre em arquivo:linha. Onde houver dúvida, [INCERTO] + o que falta. Não invente, não
  confunda "documentado" com "implementado". Separe "ações de código" de "decisões do Lucas".

## ANTI-PADRÕES A EVITAR
- Reabrir decisões já tomadas (módulo, visibility, região) ou contradizer o desenho rev.2.
- Tratar maturidade técnica como autorização de exposição; ligar qualquer flag; expor dado a morador.
- Tabela nova sem RLS + teste de isolamento; cutover de leitura sem reversibilidade; backfill silencioso.
- Migrar Timeline (derivada) antes das fontes; inflar multi-tenant para administradora.
- Refator amplo especulativo; mudar copy/jurídico sem OK; git add -A; commitar com gate vermelho.
- Encher de mudanças rasas em vez de poucos cortes certeiros e profundos.
```
