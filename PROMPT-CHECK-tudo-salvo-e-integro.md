# Prompt de Checagem — "Está tudo OK e salvo?" (AdP) · versão definitiva

> **Como usar:** na máquina real (não num mount sincronizado/virtualizado — senão arquivos podem aparecer truncados), abra o Claude Code na raiz do repositório e cole tudo **a partir de** `# TAREFA`. É só leitura: nada de alterar fontes, commitar, pushar ou deployar. Quase tudo é autodetectado — você só confirma a branch de produção. Termina num veredito GO / NO-GO numa linha.

---

```
# TAREFA: CHECAGEM DE INTEGRIDADE E PERSISTÊNCIA — Amigo do Prédio (READ-ONLY)

## ÚNICA VARIÁVEL
- BRANCH_PRODUCAO = main        # a branch que a Vercel publica em produção (ajuste se outra)
Todo o resto (owner/repo, branch atual, HEAD, nº de testes) você AUTODETECTA dos comandos.

## CONTRATO
Você é o Claude Code no repositório do AdP. Esta tarefa é SÓ LEITURA e SÓ VERIFICA. PROIBIDO:
editar fontes, git add/commit/push/stash, vercel deploy, ligar qualquer flag. (Artefatos de
build em .next/ são tolerados — não são fontes.) Responda, com PROVA, a uma pergunta:
"O Lucas pode pausar agora sem perder nada — tudo salvo, versionado no origin, e verde local
e no CI?" Honestidade acima de otimismo: o que não puder confirmar vira [NÃO CONFIRMADO] + o
passo que confirma. Separe sempre "verde local" de "verde no CI" — são coisas diferentes.

## CHECAGENS — rode, e para cada uma diga PASS / FALHA / [NÃO CONFIRMADO] + a saída-chave

1. ÁRVORE LIMPA E NADA POR PUBLICAR
   git status -sb
   git log @{u}..HEAD --oneline      # PASS se VAZIO (nada commitado sem push)
   git log HEAD..@{u} --oneline      # PASS se VAZIO (nada atrás do origin)
   git stash list                    # PASS se vazio
   git ls-files --others --exclude-standard   # untracked; identifique se há algo de valor fora do git
   PASS = working tree limpa + HEAD == origin + sem stash. Liste qualquer arquivo de valor
   não versionado (ex.: prompts .md) e diga que é decisão do Lucas commitar ou não.

2. HISTÓRICO COERENTE
   git log --oneline -8
   PASS = os últimos commits descrevem o trabalho real recente (paridade visibility, desenhos,
   wedge/selo). Aponte qualquer commit órfão, "WIP", ou mensagem que destoe.

3. VERDE LOCAL (FS real)
   npx tsc --noEmit                  # PASS = 0 erro
   npx vitest run                    # PASS = sem regressão; reporte o nº exato (verdes + skipados)
   npm run build                     # PASS = build de produção Next conclui — melhor proxy da Vercel
   (npm run lint, se existir — reporte só erros, ignore warnings)

4. VERDE NO CI (gate de isolamento)
   Descubra owner/repo: git remote get-url origin
   Com gh CLI:  gh run list --branch <branch_atual> --limit 3   →   gh run view <run_id>
   Sem gh:      curl -s "https://api.github.com/repos/<owner>/<repo>/actions/runs" e filtre por
                head_sha == HEAD
   PASS = run sobre o HEAD com conclusion "success", passos do GATE e da regressão OK, zero
   annotation de falha. Se in_progress: declare e dê a expectativa (verde — lógica local pura
   não toca RLS). NÃO afirme verde sem o run fechar.

5. PRODUÇÃO INTOCADA (Vercel)
   git branch --show-current         # PASS = branch atual != BRANCH_PRODUCAO
   Com Vercel CLI linkada: vercel whoami; vercel ls; vercel inspect <último deploy da branch>
   Sem CLI: [NÃO CONFIRMADO via CLI] + instrua o Lucas a olhar o painel e confirmar:
     (a) último deploy da branch = Ready e é PREVIEW; (b) BRANCH_PRODUCAO sem deploy novo.
   PASS = produção não recebeu deploy; preview (se houver) verde.

6. INVARIANTES DE SEGURANÇA
   grep -nE "remote_enabled|sync_enabled|_enabled" lib/feature-flags.ts
   PASS = assemblies_remote_enabled e flags de exposição/sync seguem false/default (Não-Exposição).

## SAÍDA (exatamente nesta ordem)
- Linha 1 — VEREDITO: GO  (tudo salvo e íntegro, pode pausar)  |  VEREDITO: NO-GO — faltam: <itens>
- Tabela: bloco 1..6 com ✅ / ⛔ / ❓ e uma evidência curta por bloco.
- Se NO-GO ou ❓: lista numerada do que falta e o passo exato que resolve cada item.
- PT-BR, denso, sem enchimento. Cite a saída-chave real como prova; nada de suposição.
```
