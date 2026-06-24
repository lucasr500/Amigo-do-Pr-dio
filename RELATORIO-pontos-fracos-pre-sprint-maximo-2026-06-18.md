# Relatório de Pontos Fracos — Pré-Sprint de Aprimoramento Máximo

**Data:** 2026-06-18 (fim do dia) · **Autor:** Cowork (parceiro de estratégia/produto/jurídico)
**Base:** auditoria do código real (710 arquivos, ~62,7k linhas TS/TSX, 880 testes) × fontes canônicas do Notion (Tese consolidada 2026-06-17; Direção Oficial junho/2026; "Definir sprint atual") × docs internos do repo.
**Regra de leitura:** onde código e Notion divergem de OBJETIVO, o Notion manda; para "o que existe", o código manda.

---

## 0. Estado-base verificado (para não diagnosticar no escuro)

Antes de apontar fraqueza, o que de fato está **forte** hoje — porque o sprint máximo deve atacar o que falta, não refazer o que já está pronto:

- **Navegação Opção A no ar:** `Início · Memória · [Perguntar] · Comunidade · Ajustes`. "Mais" dissolvido sem orfanar nada (14 commits, `8896882`). A racionalização W1.1→W7 está **concluída**.
- **Gate de isolamento VERDE** contra Postgres real (run #6, `1789653`): membro do condomínio B não lê nem escreve dados de A (RLS 005/006/007 provada). Esse era o gate inegociável da exposição — e passou.
- **Baseline de engenharia sólida:** `tsc` 0 · ~880 testes verdes · build conclui · `/` em ~183 kB · todas as flags de exposição/IA `false` · produção intocada · `financial*` + 18 importadores intactos.
- **Wedge da Assembleia construído** (migration 007; loop deliberação→decisão→timeline + enquete + discussão moderada por pauta), local-first e gated.

**Maturidade (auditoria Opus 4.8, 2026-06-17):** núcleo técnico **8/10** · clareza de produto **5/10** · prontidão para venda **3/10** · escala **2/10**.

> **A verdade que organiza tudo abaixo:** o app está no ponto onde *"parece pronto"* (UX impecável, núcleo testado) e *"está pronto"* (dado compartilhado, isolado e auditado no servidor, validado por gente real) são duas coisas distintas — e a distância entre elas tem nome: **a migração relacional multi-tenant que ainda está dormente, e a ausência de qualquer validação externa.** Quase toda fraqueza relevante é um sintoma desses dois fatos.

---

## 1. Veredito (leia primeiro)

O Amigo do Prédio venceu sua fase mais difícil de *arrumação interna*. O que o segura agora **não é mais densidade nem duplicação** (isso foi podado) — são **três fraquezas estruturais**, em ordem de gravidade:

1. **A fundação real ainda é um blob single-user.** O modelo multi-tenant relacional existe, está testado e provado isolado — mas **dormente**. A verdade dos dados continua sendo o `localStorage` + `app_snapshots` por `user_id`. Enquanto a memória, os documentos e a agenda não escreverem no modelo relacional, o produto **não é multi-persona de verdade** — o seletor de papel apenas *simula*. Esse é o teto que impede tudo: rede social, "Pergunte ao Prédio", colaboração, venda.

2. **Zero contato com a realidade.** Nenhum síndico, nenhum morador, nenhum condomínio real tocou no produto. A Regra de Não-Exposição protegeu a qualidade, mas o preço acumulado é **construir 100% sobre hipótese do fundador.** Clareza de produto está em 5/10 não por falta de visão, mas por falta de *evidência*. O wedge da assembleia — a aposta central — nunca foi testado com 5 moradores reais, que é exatamente onde a Tese diz que ele prova (ou refuta) seu valor.

3. **A promessa-assinatura do produto não existe em código.** "Pergunte ao Prédio" — responder sobre *os dados deste prédio* — é o gap nº 1 da Tese e a maior oportunidade. O assistente atual é um matcher determinístico sobre direito condominial **genérico** (307 entradas). É competente no que faz, mas não é a promessa. A camada inteligente é 100% futura.

Tudo o mais (acoplamento de `financial*`, tamanho de `session.ts`, admin com senha única, cobertura de teste de UI) é **dívida tática real, porém secundária** — não move os ponteiros de produto/venda/escala.

---

## 2. Placar de fraquezas (priorizado por alavancagem × risco)

| # | Eixo | Fraqueza-núcleo | Gravidade | Bloqueia qual objetivo |
|---|---|---|---|---|
| 1 | **Dados/Arquitetura** | Fonte de verdade ainda é blob local; multi-tenant relacional dormente | 🔴 Crítica | Multi-persona, rede social, venda, escala |
| 2 | **Validação/Produto** | Nenhum usuário real; tudo é hipótese; wedge não testado | 🔴 Crítica | Clareza de produto, GTM, prioridade correta |
| 3 | **IA/Assistente** | "Pergunte ao Prédio" (a promessa) não existe; motor é genérico | 🟠 Alta | Diferenciação, camada inteligente da Tese |
| 4 | **Jurídico/Social** | Camada social eleva risco (difamação, inadimplência exposta); moderação/auditoria precisam ser estruturais antes de expor | 🟠 Alta | Exposição segura, blindagem, LGPD |
| 5 | **GTM/Monetização** | Modelo de cobrança indefinido (síndico vs condomínio); PF→PJ trava rollout | 🟡 Média | Receita, exposição comercial |
| 6 | **UX "Apple-like"** | "Hoje" pode ter motores coexistindo pós-unificação; onboarding do morador ausente; densidade ainda não validada como "simples por fora" | 🟡 Média | Experiência premium, ativação |
| 7 | **Engenharia/Qualidade** | Cobertura forte em `lib/` mas fraca em UI/E2E/a11y; arquivos-monólito (`session.ts` 1751, `Response.tsx` 1136); 18 acoplamentos a `financial*` agora aposentado | 🟢 Baixa-Média | Manutenção, velocidade futura, confiabilidade |
| 8 | **Segurança operacional** | Admin com senha única (`ADMIN_KEY`), sem MFA/rotação; sync por snapshot inteiro (conflito grosso, não granular) | 🟢 Baixa | Robustez na escala |

---

## 3. As fraquezas em profundidade

### 🔴 3.1 — A fundação real ainda é local (a mãe de todas)
**O que é frágil.** `lib/storage/local-storage-adapter.ts` + `app_snapshots` (blob por `user_id`) são a fonte de verdade. A camada `lib/tenant/` (migration 005, RLS provada) existe, mas só **Assembleias e Decisões** escrevem nela — via *dual-write gated* (`assemblies_remote_enabled=false`, `decisions_remote_enabled=false`). Memória, Documentos, Agenda, Fornecedores, Comunidade: **tudo local.**

**Por que importa vs objetivo.** A Tese é categórica: *"Integração exige dados compartilhados por condomínio. Não há meio-termo. O blob single-user está morto para esta visão."* Sem a migração, três objetivos centrais ficam **arquiteturalmente impossíveis**, não apenas inacabados: (a) multi-persona real (morador e síndico vendo o mesmo dado com permissões distintas); (b) rede social (precisa de dado compartilhado por prédio); (c) "Pergunte ao Prédio" (precisa de dados relacionais estruturados para responder).

**Risco se ignorado.** Cada feature nova construída sobre o blob é **dívida que terá de ser migrada depois** — você acumula trabalho de retrabalho. Além disso: `localStorage` tem teto de quota (~5 MB), morre se o usuário limpa o navegador, não tem multi-device real, e o backup é JSON manual. É frágil para *guardar a memória institucional de um condomínio* — que é literalmente a promessa do produto.

### 🔴 3.2 — Construção 100% sobre hipótese (zero validação externa)
**O que é frágil.** A Regra de Não-Exposição (correta para proteger qualidade) significa que **nenhuma decisão de produto foi testada contra um humano real.** O wedge da assembleia — a aposta que, segundo a própria Tese, "tem valor com 5 participantes" — é uma hipótese não-verificada. O onboarding do morador, a separação de natureza jurídica, o motor "Hoje": tudo é o modelo mental do fundador, possivelmente certo, mas **sem evidência.**

**Por que importa vs objetivo.** Prontidão para venda 3/10 e clareza de produto 5/10 não sobem escrevendo mais código — sobem com **sinal de mercado.** Há um risco real de polir indefinidamente a coisa errada. "Completo em 14 dias" a Tese já marcou como armadilha; o reverso — "perfeito antes de expor a qualquer um" — é a **mesma armadilha em espelho.**

**Risco se ignorado.** Você pode chegar a um produto tecnicamente impecável que ninguém pediu daquele jeito. O custo do erro cresce com cada sprint construído no escuro.

### 🟠 3.3 — "Pergunte ao Prédio" não existe (a promessa ausente)
**O que é frágil.** O assistente (`lib/contextual-assistant.ts`, KB de 307 entradas, ~170 sinônimos, 16 categorias) é um bom motor determinístico de **direito condominial genérico** — e os próprios docs (`limites-motor-deterministico.md`) reconhecem o teto: ele não responde sobre *os dados deste prédio*. `ai_layer_enabled=false`. Não há RAG, não há LLM, não há seam de IA ativa (existe só `predio-context.ts`, o seam role-aware, com IA off).

**Por que importa vs objetivo.** O posicionamento é "a rede social **inteligente** do condomínio". A inteligência é o adjetivo que diferencia de um WhatsApp + Google Drive. Hoje ela é uma promessa de marketing sem lastro técnico.

**Risco se ignorado.** Sequenciamento correto (a Tese manda construir IA por último, sobre dados relacionais) — mas se a fundação relacional (3.1) não andar, a IA **nunca destrava**, e o produto fica para sempre "rede social" sem o "inteligente".

### 🟠 3.4 — A camada social eleva o risco jurídico estruturalmente
**O que é frágil.** `content-nature.ts` + selo de natureza separam opinião/oficial/deliberação na UI. Mas a Tese (seção "fala ao advogado") é dura: conteúdo de morador = difamação, calúnia, injúria, exposição de inadimplência. **Moderação, trilha de auditoria e separação inegociável não são polimento — são estruturais desde o dia 1.** Há `RequestsPanel`, moderação por pauta na assembleia — mas a profundidade de moderação/auditoria do feed social aberto, e a governança LGPD do dado de morador, ainda não estão à altura de uma exposição.

**Por que importa vs objetivo.** Aqui sua formação jurídica é vantagem competitiva *e* blindagem — mas só se virar arquitetura, não intenção. "Visibilidade só na UI = vazamento" (a Tese). O gate de RLS verde cobre o isolamento entre prédios; falta a governança *dentro* do prédio (quem vê inadimplência? o que é moderável? o que fica registrado para auditoria?).

**Risco se ignorado.** Um único vazamento de inadimplência ou uma difamação não-moderada entre vizinhos é dano reputacional e jurídico real no exato momento em que você expõe.

### 🟡 3.5 — Monetização e PF→PJ travam o rollout, não o código
**O que é frágil.** A decisão de cobrança (vender ao síndico profissional vs. assinatura do condomínio inteiro) está aberta — a Tese diz que isso *pode* esperar ~2 semanas, pois a fundação serve aos dois. Mas o **PF→PJ** trava o *rollout* (ligar remoto/exposição), e arrasta Termos/Privacidade (região Supabase `sa-east-1` confirmada — isso simplifica). Billing não existe.

**Por que importa vs objetivo.** Não bloqueia arquitetura nem o sprint de produto. **Bloqueia receita e exposição comercial.** É decisão sua, não de engenharia.

### 🟡 3.6 — "Apple-like" ainda não foi provado como simples por fora
**O que é frágil.** A racionalização criou `today.ts` (motor "Hoje" único) e podou duplicação — mas é preciso confirmar que os **motores antigos** (Briefing, Guidance, Revisão mensal ×3, Plano, Command Center, Revisão semanal) não *coexistem* na UI pós-flip (meia-migração é o risco clássico). Onboarding do morador é gated/ausente. E a tese "simples por fora" só é verdadeira **quando um leigo navega sem se perder** — algo que (ver 3.2) ninguém testou.

**Por que importa vs objetivo.** O eixo Apple-like é seu valor de marca. "Profundo por dentro, simples por fora" é hipótese até um usuário não-técnico confirmar.

### 🟢 3.7 — Dívida de engenharia (real, mas secundária)
- **Monólitos:** `session.ts` (1751 linhas) e `Response.tsx` (1136) concentram risco de manutenção e atrito de evolução. Candidatos a fatiamento quando tocados — não antes (não refatorar por refatorar).
- **Cobertura assimétrica:** 880 testes fortes em `lib/` (lógica de domínio), mas pouca cobertura de **UI/integração E2E** e **zero de acessibilidade**. Para um produto que se vende por UX, a11y não-auditada é um furo silencioso.
- **18 consumidores de `financial*`:** as libs foram preservadas após aposentar o financeiro de gestão (decisão correta para não quebrar). Mas agora é **peso morto acoplado** — precisa de um plano de desmonte controlado, ou vira fonte de confusão futura ("por que isso ainda existe?").
- **Sync por snapshot inteiro:** conflito resolvido no blob todo, não granular por entidade. Aceitável hoje (single-user); insuficiente para colaboração multi-device real.

### 🟢 3.8 — Segurança operacional
- **Admin:** `app/api/admin/auth` usa senha única (`ADMIN_KEY`, server-side, rate-limited 10/min) — bom para painel interno, frágil para escala (sem MFA, sem rotação, sem usuários múltiplos). Não urgente enquanto admin for só você.
- **Sem observabilidade de erro em produção** aparente (telemetria é privacy-safe e opcional, mas é métrica de uso, não monitoramento de falha). Quando expuser, vai querer Sentry-like.

---

## 4. A bifurcação do sprint máximo (você agora tem Claude Max 5x)

Com Max 5x, a restrição deixa de ser "quanto o agente aguenta" e passa a ser **"em qual direção apontar a potência"**. As fraquezas acima organizam-se em **quatro temas candidatos** de sprint. Eles não são todos compatíveis na mesma janela — daí as perguntas de alinhamento.

| Tema | Ataca | Alavancagem | Risco | Pré-requisito |
|---|---|---|---|---|
| **A. Fundação relacional viva** — migrar Memória/Documentos/Agenda do blob para o modelo multi-tenant (dual-write → leitura relacional), gated | Fraqueza #1 (a mãe) | 🔥 Máxima (destrava tudo) | Alto (toca dados, `lib/supabase`, dispara o gate) | Gate verde ✅ (já temos) |
| **B. Validação real / piloto controlado** — preparar exposição segura a 1 condomínio real (moderação+auditoria+LGPD à altura, onboarding morador, flip de 1 flag) | Fraquezas #2 e #4 | 🔥 Alta (gera o sinal de mercado ausente) | Alto (exposição = sai da Não-Exposição; exige decisão PF→PJ) | Decisão sua + 3.4 resolvido |
| **C. Consolidação Apple-like** — provar o "Hoje" único sem motores coexistindo, finalizar dedupe, onboarding do morador, auditoria de a11y/UX | Fraquezas #6 e #7 | Média-Alta (sobe clareza de produto sem risco de dado) | Baixo (só app/components, reversível) | Nenhum |
| **D. Seam de "Pergunte ao Prédio"** — preparar a arquitetura de IA/RAG sobre os dados relacionais (ainda com IA off), pronta para ligar | Fraqueza #3 | Média (estratégica, sequenciada) | Médio | Depende de A (dados relacionais) |

**Leitura estratégica honesta:** a Tese sequencia **A → (memória/loop) → B/D**. O caminho de maior alavancagem-com-risco-controlado para um *único* sprride máximo é **A (fundação relacional viva)** — é o que move escala de 2/10 e destrava todo o resto. **C** é o "sprint seguro de alta clareza" se você quiser ganho garantido sem tocar dado. **B** é o salto de maior aprendizado, mas exige você resolver PF→PJ e a governança jurídica antes. **D** depende de A.

---

## 5. O que preciso que você decida (vira as perguntas de alinhamento)

Para eu montar o **prompt de sprint perfeito** (denso, operacional, autossuficiente, sob as invariantes de sempre), preciso travar com você:

1. **Foco do sprride máximo** — A (fundação relacional), B (piloto real), C (consolidação Apple-like) ou D (seam de IA)? Ou uma combinação sequenciada?
2. **Apetite de risco / Não-Exposição** — o sprint permanece 100% gated-off (nada exposto), ou prepara um piloto controlado com 1 condomínio real?
3. **Disciplina de lanes** — mantém Cowork=estratégia / Claude Code=código (um escritor por vez), ou com Max 5x você quer rodar lanes paralelas (e como evitar colisão de git/sync)?
4. **Profundidade vs largura** — um único workstream fundo e impecável (a "fatia vertical" da Tese), ou várias frentes médias na mesma janela?

Respondidas essas quatro, eu entrego o prompt de sprint pronto para o Claude Code executar.
