# PROMPT-SPRINT — Realocação de superfícies + Flip da navegação (conclusão do W7)

> **Lane:** Claude Code (Windows), escritor único do repo. Cowork está em estratégia, **não** edita código em paralelo.
> **Origem:** sequência destravada pela rodada de backbones W1–W6 (documents/timeline/today/transparency/resident-home/predio-context — todos commitados e pushados).
> **Natureza:** esta rodada é de **UI aditiva** sobre backbones prontos, até o flip final da barra. Nada de exposição, nada de IA.

---

## 0. Missão

Construir as **superfícies de realocação** que dão casa ao conteúdo hoje pendurado na barra antiga e, **só no final**, trocar a barra para a navegação oficial (opção A). Cada superfície é uma **fatia vertical completa**: tela + consumo do backbone correto + deep-links já reapontados + testes. O app fica **inteiro e reversível ao fim de cada fatia**. O flip da barra é a última fatia e deve ser quase trivial porque todas as casas já existem.

**Navegação-alvo (opção A):** `Início · Memória · [Perguntar] · Comunidade · Ajustes`.
`[Perguntar]` é o seam de IA já existente (`predio-context.ts`), que permanece **desligado** nesta rodada — só o slot na barra, sem acionar IA.

---

## 1. Invariantes inegociáveis (valem em TODA fatia)

1. **Não-Exposição.** Nenhuma flag de exposição/IA é ligada. Todas seguem `false`. `[Perguntar]` é slot inerte.
2. **Sem perda de dado.** Local-first é a fonte de verdade. Nenhuma realocação apaga ou esconde dado de quem tem papel para vê-lo; só muda **onde** a superfície vive.
3. **Blindagem por papel desde a lib.** A UI consome os backbones já filtrados por papel (`transparency.ts`, `today.ts`, etc.). A UI **não** refaz filtragem de papel à mão nem busca direto nos stores crus quando há backbone.
4. **Não quebrar dependentes.** Antes de mover/remover qualquer ponto de navegação ou deep-link, **mapear todos os chamadores por busca** (ex.: `grep` por `onOpenMonthlyReview`, nomes de rota/aba, `financial*`). Os ~18 importadores de `financial*` permanecem intocados.
5. **Nunca pela metade.** É proibido deixar uma superfície parcial entre commits. Se uma fatia não cabe inteira, reduza o escopo da fatia — não a qualidade.
6. **Gate de pré-condição.** O gate de isolamento da rodada anterior precisa estar **verde contra DB real** antes do **primeiro commit** desta rodada. Se ainda estiver skipado/em background, **pare e reporte** — não comece a commitar UI por cima de um gate não confirmado.
7. **Protocolo de commit (por fatia):** `tsc` 0 · `vitest` sem regressão · **se a fatia tocar `lib/supabase`, gate de isolamento verde** · commit **por caminho explícito** · push no `origin`. Produção intocada.

---

## 2. Pré-condições (executar e reportar ANTES de codar)

1. Confirmar `git status` limpo e branch correta; declarar o HEAD atual.
2. Confirmar baseline: `tsc` 0 e `vitest` verde (esperado ~880 + 9 do gate). Reportar o número real.
3. **Confirmar o gate de isolamento verde** (invariante 6). Se não verde, **STOP + report**.
4. **Mapa de realocação (read-only, sem editar):** localizar por busca e listar, com arquivo:linha —
   - o componente da **barra/navegação** atual e como ele monta os itens;
   - todas as seções hoje órfãs no flip: **Revisão detalhada**, **Funcionários**, **Implantação**;
   - **todos** os deep-links que apontam para essas seções (no mínimo `onOpenMonthlyReview`; varrer por handlers `onOpen*`, navegações e rotas) — produzir a **lista completa** dos 7+ deep-links com origem e destino atual.
   - onde "Mais" é montado hoje (vai dissolver em Ajustes).

> Entregue esse mapa como primeiro output do sprint. Ele é a base de aceite das fatias seguintes. **Não invente caminhos** — se algo não for encontrado, diga.

---

## 3. Ordem cravada das fatias

> Sequência inegociável. Uma fatia vertical completa por commit. Não pular para o flip antes das casas existirem.

### Fatia R1 — UI de Transparência (em Comunidade)
- **Objetivo:** tela de prestação de contas agregada consumindo **`transparency.ts`**.
- **Regras de conteúdo:** agregado puro — **sem inadimplência por unidade, sem dado individualizado**. Respeitar a visibilidade por papel já entregue pela lib.
- **Deep-links:** reapontar para a nova casa os links que hoje levam à visão financeira/revisão que migra para Transparência (cruzar com o mapa da §2). `onOpenMonthlyReview` → ver R2 (Revisão vive no "Hoje"); aqui tratar só os que pertencem a Transparência.
- **Pronto quando:** tela renderiza só pelo backbone; nenhum acesso cru a `financial*` na UI nova; deep-links de Transparência funcionando; `tsc` 0 · vitest sem regressão · commit explícito · push.

### Fatia R2 — Casa de Funcionários/Implantação (em Ajustes) + Revisão detalhada (no "Hoje")
- **Objetivo:** dar casa às 3 seções órfãs.
  - **Funcionários** e **Implantação** ganham seção em **Ajustes** (visíveis por papel).
  - **Revisão detalhada** passa a ser alcançada pelo motor **"Hoje"** (`today.ts`); **`onOpenMonthlyReview` reaponta para o novo destino** e continua funcionando ponta a ponta.
- **Regras:** nenhum conteúdo some; só muda de casa. Mapear chamadores antes de mover (invariante 4).
- **Pronto quando:** as 3 seções acessíveis nas novas casas; `onOpenMonthlyReview` e demais deep-links dessas seções verdes; `tsc` 0 · vitest sem regressão · commit explícito · push.

### Fatia R3 — CommunidadeTab + AjustesTab + redirecionamento dos deep-links
- **Objetivo:** materializar as duas abas de 1ª classe da opção A (**Comunidade** e **Ajustes**) como contêineres reais, agregando o que R1/R2 construíram; **dissolver "Mais" em Ajustes**.
- **Deep-links:** redirecionar **todos** os 7+ deep-links do mapa para os destinos finais. Zero link morto.
- **Pronto quando:** Comunidade e Ajustes completas como destinos; "Mais" não existe mais como item solto; varredura de deep-links = 100% resolvidos; `tsc` 0 · vitest sem regressão · commit explícito · push.

### Fatia R4 — Flip da barra (W7, por último)
- **Objetivo:** trocar a barra para **`Início · Memória · [Perguntar] · Comunidade · Ajustes`**.
- **Pré-condição dura:** R1–R3 verdes e **nenhuma seção órfã** e **nenhum deep-link morto** (re-rodar a varredura da §2 e provar zero pendência antes de tocar a barra).
- **`[Perguntar]`:** slot presente, **IA off** (sem acionar `predio-context.ts` em runtime de exposição).
- **Pronto quando:** barra nova ativa; navegação completa sem rota órfã; `tsc` 0 · vitest sem regressão · commit explícito · push.

---

## 4. Definição de pronto global (aceite do sprint)

- As 4 fatias commitadas e pushadas, cada uma com commit por caminho explícito.
- `tsc` 0; `vitest` sem regressão (reportar contagem final).
- Gate de isolamento verde (a rodada é aditiva e não deve tocar RLS; se tocar `lib/supabase`, gate verde obrigatório).
- **Zero seção órfã, zero deep-link morto** — provado por varredura, não por afirmação.
- Todas as flags de exposição/IA `false`. Produção intocada.

---

## 5. O que NÃO fazer

- Não ligar nenhuma flag de exposição ou IA.
- Não remover/alterar `financial*` nem seus ~18 importadores.
- Não refazer filtragem de papel na UI quando o backbone já filtra.
- Não tocar a barra (R4) antes de R1–R3 verdes.
- Não deixar fatia parcial entre commits.
- Não inventar nomes de arquivos/rotas: localizar por busca; se não achar, reportar.

---

## 6. Relatório final esperado (para o Cowork validar)

Tabela por fatia: `Fatia | Superfície | Backbone consumido | Deep-links reapontados | Commit`. Mais: baseline final (`tsc`, contagem de testes, estado do gate), confirmação de zero órfão/zero link morto (com evidência da varredura), e estado das flags. Sinalizar qualquer divergência encontrada entre o esperado e o código real.
