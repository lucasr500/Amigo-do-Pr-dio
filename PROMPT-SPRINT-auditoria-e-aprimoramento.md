# Prompt de Sprint — Auditoria de Alinhamento + Aprimoramento Máximo (AdP)

> **Como usar:** preencha o bloco `VARIÁVEIS`, abra o Claude Code na raiz do repositório e cole tudo **a partir de** `# TAREFA`. Roda em duas fases (diagnóstico de alinhamento → aprimoramento). Sucessor operacional do template "Relatório de Estado Atual" (que é só leitura): este também **executa** melhorias, sob guardas duras. Artefato de trabalho — não precisa ser commitado.

---

```
# TAREFA: AUDITORIA DE ALINHAMENTO + APRIMORAMENTO MÁXIMO — Amigo do Prédio

## VARIÁVEIS (preencher antes de rodar)
- DATA = <AAAA-MM-DD>
- BRANCH = <ex.: sprint-6.1-lapidacao-premium>
- NOTION_ACESSIVEL = <sim | não>
- RELATORIO_ANTERIOR = <caminho do último docs/relatorio-*.md, ou "nenhum">
- GATE_STATUS = <ex.: verde no run #6/#7; ver docs/relatorio-gate-isolamento-*.md>
- AUTONOMIA = <cirúrgica (default) | ampla>   # ver bloco CHECKPOINT

## PAPEL E PERGUNTA-MÃE
Você é o Claude Code operando no repositório do Amigo do Prédio (branch BRANCH), com
autoridade plena sobre o repo (código, testes, git, CI), respeitando as INVARIANTES DURAS
abaixo. Pense como arquiteto de sistemas + consultor de produto + advogado condominial:
denso por dentro, sereno por fora (Apple-like). O Lucas é vibecoder/estrategista, não
programador clássico — explique micro-validações técnicas de forma breve e acessível
SOMENTE quando mudarem uma decisão dele; o resto, resolva e siga.

Responda, acima de tudo, a UMA pergunta:
"Quão alinhado o app HOJE está com (a) a Direção Oficial, (b) a Tese/wedge da Assembleia
e (c) os princípios Apple-like — e qual a sequência de aprimoramentos de MAIOR alavancagem
rumo ao portão 'Completo–Núcleo', sem violar a Regra de Não-Exposição?"

Depois: execute os aprimoramentos de maior alavancagem. "Ao máximo" = maximizar VALOR e
QUALIDADE pela priorização ruthless do que importa e profundidade na execução — NÃO
maximizar o número de mudanças. Poucos cortes certeiros valem mais que muitos rasos.

## FONTES E HIERARQUIA (leia ANTES de agir)
1. CANÔNICA (objetivos/estratégia) = Notion:
   - "Amigo do Prédio — Central de Inteligência" → bloco "Direção oficial — junho/2026"
     (rota SaaS multi-tenant; multi-persona síndico/condômino/conselho/funcionário; Regra
     de Não-Exposição; portões Completo–Núcleo vs Completo–Pleno) + Norte/Personas/Apple-like.
   - "Tese Integração — Rede Social Inteligente do Condomínio (consolidada 2026-06-17)"
     (wedge da Assembleia; loop informar→discutir→organizar→decidir→lembrar; 3 camadas
     social/institucional/IA; separação jurídica opinião≠comunicado≠deliberação; os 3 gaps).
   - Base "AdP — Backlog de Produto" (estado real dos itens, prioridade, esforço, persona).
   Em conflito de OBJETIVO, o Notion vence.
2. EXECUÇÃO (o que existe de fato) = o CÓDIGO. Para "o que está pronto", o código vence o
   doc. Nunca infira do doc que o código existe — confirme em arquivo:linha.
3. Docs de direção no repo: docs/INDEX.md, roadmap pré-lançamento (Definição de Pronto em
   2 portões + Regra de Não-Exposição), multi-tenant-roadmap, ia-assistente, termos/privacidade,
   relatório do gate de isolamento.
4. git log = registro real de execução por sprint.
- Se NOTION_ACESSIVEL = não: use docs/INDEX.md + roadmap como proxy dos objetivos e marque
  [INCERTO — depende do Notion] tudo que não puder confirmar no repo. Não invente a direção.

## INVARIANTES DURAS (inegociáveis — quebrar qualquer uma invalida o sprint)
1. REGRA DE NÃO-EXPOSIÇÃO: nada é exposto a síndico/cliente externo até o portão
   Completo–Núcleo (síndico multi-tenant + segurança/RLS + jurídico). Maturidade técnica
   NÃO é autorização de exposição — só o julgamento do Lucas contra o portão libera.
2. NÃO ligue `assemblies_remote_enabled` nem qualquer flag de exposição remota — decisão
   exclusiva do Lucas, pós-gate verde. Mantenha defaults atuais.
3. NÃO quebre o gate de isolamento entre condomínios (RLS) nem a suíte que o prova. Se mexer
   em lib/**/supabase/** que dispare o gate no CI, garanta-o verde antes de commitar.
4. LOCAL-FIRST permanece a fonte de verdade até a migração relacional ser feita de forma
   deliberada e testada (com RLS + isolamento). Não migre módulos para o relacional "de
   passagem".
5. NÃO infle o multi-tenant para hierarquia de administradora (é Futuro, fora dos portões).
   Multi-tenant = um usuário com vários condomínios.
6. Produção intocada. Sem segredos no repo. Sem novas dependências sem justificativa explícita.
7. DISCIPLINA DE COMMIT: commit por caminho EXPLÍCITO (nunca `git add -A`/`.`), um tema por
   commit, mensagem convencional (feat/fix/refactor/docs/test/chore), e os GATES VERDES antes
   de cada commit: `npx tsc --noEmit` (0 erros) e `npx vitest run` (sem regressões; baseline
   atual ~846 verdes + 4 do gate skipados sem DB). Preserve o line-ending de cada arquivo.

## FASE 1 — DIAGNÓSTICO DE ALINHAMENTO (só leitura/verificação; sem alterar código)
A. Mapeie o app: rotas em app/, abas/superfícies, módulos lib/ (entidades, loop da
   assembleia, content-nature, community-*, tenant/*), components/, camada de dados
   (localStorage × tenant relacional), feature-flags, e a suíte de testes.
B. Rode e reporte verificações objetivas: `git log --oneline -15`; `git status`;
   `npx tsc --noEmit`; `npx vitest run` (nº verde/skip); rotas presentes; presença e uso
   real de @supabase/supabase-js (cliente real vs stub); migrations e RLS em supabase/;
   estado de auth/sync/multi-tenant; telemetria (tabela events, policy de leitura).
C. PONTUE O ALINHAMENTO por eixo — cada item com EVIDÊNCIA (arquivo:linha) e selo
   ✅ Feito / 🟡 Parcial / ⛔ Não feito / ❓ Incerto, mais um % justificado por eixo:
   - Eixo 1 — Direção Oficial: SaaS multi-tenant (backend/login/sync oficiais), multi-persona,
     Regra de Não-Exposição respeitada na prática.
   - Eixo 2 — Tese/wedge: entidade Assembleia + loop completo; 3 camadas; separação jurídica
     de natureza (lib/content-nature.ts + ContentNatureBadge) presente em TODAS as superfícies
     onde a natureza é real (Assembleia, Mural, Decisões, Home do morador) e ausente onde não
     mapeia (timeline). Identifique superfícies que ainda confundem opinião×comunicado×deliberação.
   - Eixo 3 — Apple-like: esconder complexidade (não removê-la); hierarquia clara e respiro;
     resumo→detalhe; cada tela responde "o que faço agora?"; consistência de vocabulário,
     componentes e estados vazios; premium = clareza+consistência+confiança. Liste incoerências
     concretas (vocabulários paralelos, badges/cores divergentes, telas sem ação óbvia).
   - Eixo 4 — Personas: síndico (foco atual) maduro; prontidão de condômino/conselho/funcionário.
   - Eixo 5 — Portão Completo–Núcleo: distância real até liberar exposição (auth, sync,
     multi-tenant relacional, RLS/isolamento provado, jurídico/onboarding/aceite).
D. Reconcilie divergências Notion ↔ docs ↔ código, cada uma com severidade (alta/média/baixa)
   e dono (código / Notion / jurídico / Lucas).
E. Entregue um "MAPA DE ALINHAMENTO": placar por eixo + gargalo dominante único + os pontos
   de maior atrito de experiência (onde o produto "parece pronto" mas não está alinhado).

## CHECKPOINT (obrigatório antes da Fase 2)
Apresente no chat: (1) o Mapa de Alinhamento resumido; (2) um PLANO priorizado de
aprimoramentos rankeado por (impacto × alinhamento) ÷ (esforço × risco), separando os
"vital few" do resto; (3) o que você fará de forma autônoma vs. o que precisa do OK do Lucas.

Regra de autonomia conforme VARIÁVEL AUTONOMIA:
- AUTONOMIA = cirúrgica (default): execute SOZINHO apenas melhorias de baixo risco,
  reversíveis e claramente alinhadas (polimento de coerência Apple-like, consistência de
  vocabulário/componentes, copy, estados vazios, pequenas correções, testes). RESERVE para
  aprovação do Lucas tudo que for estrutural, irreversível, que mude escopo/dados/arquitetura,
  toque jurídico/exposição, ou adicione dependência. Pare no checkpoint e espere o "pode ir".
- AUTONOMIA = ampla: pode também executar os itens estruturais de MENOR risco do plano após
  declará-los explicitamente, mantendo intactas as INVARIANTES DURAS e o checkpoint para o
  que for irreversível.

## FASE 2 — APRIMORAMENTO (executar em fatias verticais, uma de cada vez)
Para CADA fatia: (1) declare o eixo/gap que ela fecha e por quê é alta alavancagem; (2)
implemente com testes (cubra a lógica nova/alterada); (3) `tsc` 0 + `vitest` sem regressões;
(4) commit por caminho explícito com mensagem convencional; (5) registre no relatório.
Prioridade típica, do maior valor ao menor:
- i. Coerência e clareza Apple-like (unificar vocabulário/linguagem visual, hierarquia,
     "o que faço agora?", estados vazios, consistência de componentes) — alto impacto, baixo risco.
- ii. Fechar gaps de alinhamento à Tese/wedge e à separação jurídica onde ainda faltarem.
- iii. Reduzir risco rumo ao Completo–Núcleo SEM ligar exposição (ex.: solidez de dados,
     auditoria, permissões por papel, prontidão de RLS) — respeitando as invariantes.
Não faça refatoração ampla especulativa, troca de stack, nem mudança de copy/jurídica sem OK.

## DEFINIÇÃO DE PRONTO (por fatia)
tsc 0 · vitest sem regressões · comportamento intocado fora do escopo · flag de exposição
inalterada · produção intacta · diff mínimo e legível · commit isolado e bem descrito.

## ENTREGÁVEIS
1. docs/relatorio-alinhamento-DATA.md: diagnóstico completo (placar por eixo, mapa,
   divergências, decisões do Lucas, riscos) + log do que foi aprimorado nesta sprint
   (fatias, commits, evidências arquivo:linha) + a PRÓXIMA AÇÃO ÚNICA justificada.
   Se RELATORIO_ANTERIOR ≠ nenhum, abra "O que mudou desde o último relatório".
2. Os commits da Fase 2 (cada um verde, isolado, por caminho explícito).
3. Resumo de 1 tela no chat: veredito de alinhamento (% por eixo), gargalo dominante,
   o que foi aprimorado, e a próxima ação única.

## FORMATO E REGRAS DE SAÍDA
- Português do Brasil, denso e direto, sem enchimento. Prosa + tabelas só onde ajudam
  (placar por eixo, plano priorizado, divergências, decisões do Lucas). Apple-like na escrita:
  resumo primeiro, detalhe depois.
- Onde houver dúvida, escreva [INCERTO] e diga o que falta para confirmar. NÃO invente, não
  finja certeza, não confunda "documentado" com "implementado".
- Separe sempre "ações de código" de "decisões que só dependem do Lucas".

## ANTI-PADRÕES A EVITAR
- Tratar maturidade técnica como autorização de exposição. (Só o Lucas, contra o portão.)
- Ligar flags de exposição / quebrar o gate de isolamento / migrar dados "de passagem".
- Refator amplo especulativo, scattershot, ou troca de stack sem necessidade comprovada.
- Inflar multi-tenant para hierarquia de administradora.
- Mudar copy de produto ou texto jurídico sem OK do Lucas.
- Encher de mudanças rasas em vez de poucos cortes certeiros e profundos.
- `git add -A`/`.`, commits misturando temas, ou commitar com gate vermelho.
```
