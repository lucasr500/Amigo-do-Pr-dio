# PROMPT — Salvar tudo + Deploy de STAGING PRIVADO seguro no Vercel

> **Lane:** Claude Code (Windows), escritor único. Rodar autônomo enquanto o Lucas dorme.
> **Natureza:** salvar/durabilizar o estado + publicar um **staging privado** que só o Lucas acessa. **NÃO é lançamento público.**

---

## 0. PRINCÍPIO SUPREMO — Não-Exposição (lei desta tarefa)

Este deploy é **staging privado**, não exposição pública. O objetivo é o Lucas conseguir abrir o app online, logado, de qualquer lugar — **sem que nenhum dado vaze e sem ligar nada de remoto/IA**.

**Premissa de segurança CRAVADA (não desviar):**
1. **Deploy SEM as variáveis do Supabase.** Não configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` nem `ADMIN_KEY` no ambiente do Vercel. Motivo (confirmado no `.env.example`): sem essas vars o app fica **local-first** — sem login, sem sync para a nuvem, telemetria no-op, painel `/admin` bloqueado em produção. Com elas, liga auth+sync e manda dados de terceiros para a nuvem = exatamente o que o bloqueio **PF→PJ** proíbe agora.
2. **Deploy PROTEGIDO.** A URL não pode ser pública. Usar Deployment Protection / Vercel Authentication (preview é protegido por padrão). Só o Lucas, logado na conta Vercel dele, abre.
3. **Não-indexável.** Garantir `X-Robots-Tag: noindex` / robots para o staging não cair em buscador.
4. **Nenhuma flag de exposição/IA ligada.** Tudo `false`, como está.
5. **Produção intocada.** Não tocar projeto/branch/deploy de produção, se existir. Este é um alvo de **staging** separado (preview).

**CONDIÇÃO DE PARADA DURA:** é proibido encerrar a tarefa com uma URL **pública e acessível sem login** servindo o app. Se não for possível garantir proteção, **não deixe o deploy no ar** (remova-o) e relate. Prova obrigatória: abrir a URL **sem autenticação** deve retornar bloqueio (HTTP 401/403 ou tela de login do Vercel). Comprove com `curl -I` antes de declarar sucesso.

---

## FASE 1 — Salvar tudo (durabilidade e ponto de restauração)

1. `git status` — confirmar working tree limpo. Se houver algo não commitado, commitar **por caminho explícito**, com mensagem clara.
2. Rodar os gates: `npm run typecheck` (tsc 0) · `npm run test` (vitest verde, esperado ~883) · `npm run build` (conclui). Se algo falhar, **PARE e relate** — não prossiga para deploy.
3. `git push` no `origin`. Confirmar que o HEAD local == HEAD remoto (imprimir o hash).
4. Criar **tag anotada** como ponto de restauração, ex.: `git tag -a opcao-a-2026-06-18 -m "Opção A completa (W1.1→W7) + leak de papel corrigido"` e `git push origin --tags`. Imprimir a tag.
5. Confirmar que `.next/`, `node_modules/`, `*.tsbuildinfo`, `.env*.local` seguem ignorados (já estão no `.gitignore`) — nenhum artefato de build ou segredo entra no commit.

---

## FASE 2 — Pré-condições de deploy (read-only; pular para FASE 4 se faltar)

1. **Vercel CLI autenticado?** Rodar `npx vercel whoami`.
   - Se **autenticado**: seguir para FASE 3.
   - Se **NÃO autenticado**: **NÃO** tentar login interativo (Lucas dormindo). Pular direto para **FASE 4**.
2. Inspecionar config existente sem alterar: `vercel.json` (já tem headers de segurança — preservar), `next.config.js`, `package.json` (`build`/`start`). Não inventar config nova além do necessário para proteção/noindex.
3. Identificar o projeto Vercel: usar/!criar um projeto/escopo de **staging** (ex.: `amigo-do-predio-staging`). **Nunca** publicar no projeto de produção.

---

## FASE 3 — Deploy de staging protegido (só se FASE 2 passou)

1. Garantir que **nenhuma** env var do Supabase/Admin está setada no ambiente do deploy (ver Princípio Supremo §1). Se o projeto Vercel já tiver essas vars de algum teste anterior, **removê-las/não herdá-las** neste ambiente de staging.
2. Garantir o header de não-indexação para o staging (ex.: adicionar `X-Robots-Tag: noindex` via `vercel.json` headers **apenas para este alvo**, sem afetar produção; ou via config equivalente). Preservar os headers de segurança já existentes.
3. **Deploy como PREVIEW** (NÃO `--prod`): `npx vercel deploy` (sem `--prod`). Preview é protegido por Vercel Authentication por padrão.
4. **PROVAR a proteção (obrigatório):** após obter a URL, rodar `curl -I <url>` **sem credenciais** e confirmar 401/403 ou redirect para login do Vercel. Se vier 200 com o app, a proteção está OFF → **remover o deploy** e ir para FASE 4 relatando que a proteção precisa ser ativada manualmente.
5. Sanidade adicional: confirmar que o build do deploy não embute nenhuma URL de Supabase (grep no output/bundle por `supabase.co` deve dar vazio, já que as vars não foram setadas).
6. Registrar a URL protegida no relatório.

---

## FASE 4 — Fallback (se não deu para deployar autônomo)

Se a FASE 2 falhou (CLI não logado) ou a FASE 3 não conseguiu garantir proteção:
1. Confirmar que a FASE 1 está 100% feita (tudo salvo, pushado, tagueado) — esse é o essencial e não depende do Vercel.
2. Deixar no relatório o **passo a passo manual exato** para o Lucas executar ao acordar:
   - conectar a extensão Claude in Chrome e logar no Vercel;
   - comando/cliques para o deploy de **preview** no projeto de **staging**;
   - onde ativar **Deployment Protection / Vercel Authentication** (Settings → Deployment Protection);
   - lembrete: **não** adicionar vars do Supabase;
   - como confirmar a proteção (`curl -I` sem login → 401).
3. Não forçar nada que exija exposição ou login interativo.

---

## Proibições absolutas (repetir antes de cada passo)

- ❌ Configurar qualquer var do Supabase/`ADMIN_KEY` no Vercel.
- ❌ Ligar qualquer flag de exposição/IA (todas seguem `false`).
- ❌ Deploy `--prod` / tocar produção.
- ❌ Encerrar com URL pública acessível sem login.
- ❌ Resolver as 3 decisões de produto pendentes (ver abaixo) — não improvisar papel/UX.
- ❌ Tocar texto jurídico (termos/privacidade).

## NÃO decidir (decisões do Lucas, não bloqueiam o deploy)

1. Morador sem aba Ajustes (lacuna de UX).
2. `[Perguntar]` = assistente de KB funcional (sem IA externa) vs. virar slot "em breve" até o RAG.
3. Conselho/Funcionário como persona de login real (hoje só simulação).

O staging vai ao ar com o estado atual; essas lacunas são aceitáveis em ambiente privado e ficam para quando ele acordar.

---

## Relatório final esperado

- **Salvamento:** working tree limpo? hash do HEAD remoto, nome da tag criada.
- **Gates:** tsc, contagem de testes, build (ok/erro).
- **Deploy:** feito autônomo (FASE 3) ou fallback (FASE 4)? Se feito: URL do staging + **prova de proteção** (`curl -I` → código retornado) + confirmação de "sem var Supabase" (grep vazio por `supabase.co`).
- **Segurança:** flags todas false? produção intocada? noindex aplicado?
- **Pendências para o Lucas:** se fallback, o passo a passo manual; sempre, as 3 decisões em aberto.
