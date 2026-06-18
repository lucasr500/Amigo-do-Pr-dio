# Registro de Legítimo Interesse (LIA) — Telemetria do Amigo do Prédio

> **Status: MINUTA v0.1 — pendente de revisão e aprovação do controlador (Lucas Romeiro).**
> Este documento é o *teste de balanceamento* (Legitimate Interest Assessment) que
> fundamenta o tratamento de dados de telemetria sob **legítimo interesse** (Art. 7º, IX,
> e Art. 10 da LGPD). Ele torna verdadeira a afirmação "LIA documentado" já constante na
> Política de Privacidade. Enquanto não aprovado, a Política não deve afirmar que o LIA
> existe em definitivo.
>
> **Fonte de verdade:** o código (`lib/telemetry.ts`, `components/tabs/AssistantTab.tsx`,
> `lib/session.ts`) e a Política de Privacidade (`docs/politica-privacidade.md`). Onde
> houver dúvida factual, o código vence.

---

## 1. Identificação e metadados

| Campo | Valor |
|---|---|
| **Tratamento avaliado** | Telemetria de uso (observabilidade interna) do aplicativo Amigo do Prédio |
| **Controlador** | Lucas Romeiro (pessoa física nesta fase) |
| **Migração prevista** | Titularidade migrará para pessoa jurídica (CNPJ) antes de qualquer exposição externa — atualizar este registro na migração |
| **Operador / sub-processador** | Supabase (banco de dados e hospedagem) |
| **Base legal** | Legítimo interesse do controlador — Art. 7º, IX, c/c Art. 10 da LGPD |
| **Data da avaliação** | 2026-06-14 |
| **Versão** | 0.1 (minuta) |
| **Próxima revisão** | A cada alteração relevante no que é coletado, ou em até 12 meses |

---

## 2. Objeto e contexto

A telemetria é um recurso **interno e opcional** de observabilidade. Seu propósito é medir,
de forma agregada, **se o produto funciona e onde ele falha** — em especial a qualidade do
assistente determinístico (taxa de acerto e de *fallback*), a adoção de fluxos
operacionais e a estabilidade da sessão — para orientar decisões de produto antes de
qualquer exposição externa.

Características estruturais relevantes para esta avaliação (verificadas no código):

- **Opt-in por configuração:** a telemetria só opera se as variáveis
  `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem definidas. Sem
  elas, **todas as chamadas são *no-op* silencioso** (`ENABLED = false` em
  `lib/telemetry.ts`). Não há coleta por padrão.
- **Não é o backend do produto:** a telemetria **não** persiste nem sincroniza dados do
  condomínio, **não** substitui o `localStorage` e, por regra explícita do código, **não
  deve receber PII**.
- **Envio em lote:** eventos são acumulados em fila e enviados via `POST` ao endpoint
  `/rest/v1/events` do Supabase (lote de até 8 eventos ou a cada 7 segundos).

---

## 3. Descrição do tratamento (dados efetivamente tratados)

Cada evento gravado na tabela `events` do Supabase tem a seguinte estrutura:

| Coluna | Conteúdo | Natureza |
|---|---|---|
| `event` | Nome do evento (rótulo fechado de uma lista pré-definida — ex.: `query_submitted`, `session_duration`) | Categórico, não pessoal |
| `properties` | Objeto com campos **estruturais** do evento | Escalares (ver abaixo) |
| `ts` | Timestamp do evento | Metadado técnico |
| `session_id` | Identificador **local efêmero** de sessão | Pseudônimo não identificável (ver §3.2) |

### 3.1 Campos estruturais (`properties`)

A assinatura de `trackEvent` aceita **apenas valores escalares**
(`string | number | boolean | null`) — não há estrutura para anexar objetos livres ou
texto longo. Por convenção e por auditoria editorial (Fase 49), os campos carregam apenas
sinais estruturais. Exemplos reais, extraídos do código:

| Evento | Campos enviados | Observação |
|---|---|---|
| `query_submitted` | `matched_id`, `categoria`, `score`, `query_length` | **Apenas o comprimento** da pergunta, nunca o texto |
| `query_fallback` | `detected_category`, `score`, `blocked_by_domain`, `query_length` | Idem |
| `session_duration` | `seconds` | Duração da sessão em segundos |
| `pendencia_*` | `origem`, `guidance_id`, `priority`, `field`, `type` (conforme o caso) | Rótulos e identificadores internos |
| `agenda_event_*` | `type`, `days_until`, `has_note`, `has_linked_step` | Categorias, contagens e booleanos |
| `weekly_review_*` | `week_key`, contagens, booleanos | Sem texto livre |
| `local_context_notice_shown` | `categoria`, `contextType`, booleano de memória | Sem dado do condomínio |

**O que a telemetria NÃO coleta** (confirmado no código): o **texto** das perguntas
(removido na Fase 49 — só persiste `query_length`); **nomes** de pessoas, condomínios,
unidades ou locais; **valores** financeiros; **datas reais** cadastradas; o conteúdo de
comunicados, ocorrências ou mensagens. As ocorrências de `q:` ainda presentes em
`app/admin/page.tsx` são **casos de teste fixos** (auditoria do motor) e *queries* exibidas
apenas no painel local — **não** integram o payload enviado à telemetria.

### 3.2 Sobre o `session_id`

O identificador de sessão é gerado **no dispositivo** por
`` `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}` `` e guardado no
`localStorage`. Ele **não tem vínculo** com nome, e-mail, CPF ou endereço IP, e serve
apenas para **contar sessões distintas** e agrupar eventos de uma mesma visita. Trata-se,
portanto, de um **pseudônimo de baixa capacidade de reidentificação**.

> ⚠️ **Nota honesta de engenharia:** o aplicativo **não transmite o IP como campo**, mas o
> provedor de hospedagem/rede (Supabase e CDN) pode processar metadados de conexão (como o
> IP de origem) em seus próprios *logs* de infraestrutura, como em qualquer requisição
> HTTP. Isso é tratamento do **operador**, sujeito ao contrato e à política do provedor, e
> não a um campo coletado pela aplicação. Convém mencioná-lo na seção de operadores da
> Política para transparência.

### 3.3 Retenção e destinatários

- **Retenção:** 12 meses, com eliminação ou anonimização ao fim do período (a confirmar e
  formalizar — ver §8, ponto de decisão).
- **Destinatário/Operador:** Supabase. A região de hospedagem **ainda não está confirmada**
  (`[PENDENTE]` na Política, §6); enquanto não confirmada, não se afirma hospedagem
  exclusiva no Brasil. A definição de região afeta a existência de transferência
  internacional e **deve ser resolvida antes de uso externo**.

---

## 4. Teste 1 — Finalidade (o interesse é legítimo, específico e lícito?)

**Interesse perseguido:** avaliar e melhorar a qualidade, a segurança e a estabilidade do
produto — notadamente a acurácia do assistente determinístico (recall e taxa de
*fallback*) e a adoção dos fluxos — usando dados que **não identificam** o titular.

Esse interesse é:

- **Legítimo e lícito:** a melhoria de produto e a observabilidade de qualidade são
  finalidades reconhecidas e não vedadas por lei.
- **Específico e explícito:** restringe-se a sinais estruturais de uso, com lista fechada
  de eventos e de campos; não há finalidade secundária de *profiling*, publicidade,
  enriquecimento ou venda de dados.
- **Concreto e atual** (Art. 10, I): trata-se de uma situação real e presente — decidir o
  que construir e corrigir antes de expor o produto —, não de hipótese futura genérica.

**Conclusão do Teste 1:** há interesse legítimo idôneo a fundamentar o tratamento.

---

## 5. Teste 2 — Necessidade (é necessário? há meio menos invasivo?)

- **Necessidade:** medir acerto/fallback e adoção **exige** registrar a ocorrência dos
  eventos e seus sinais estruturais (categoria, score, comprimento, contagens). Sem isso,
  a avaliação de qualidade seria conjectural.
- **Minimização aplicada (Art. 6º, III):** o desenho já adota a alternativa **menos
  invasiva** disponível:
  - envia o **comprimento** da pergunta (`query_length`), não o **texto**;
  - usa **rótulos e contagens**, não conteúdo livre;
  - emprega **pseudônimo efêmero**, não identificador estável vinculável à pessoa;
  - é **opt-in por configuração** e *no-op* sem chaves.
- **Proporcionalidade do volume:** os dados são suficientes para a finalidade e não
  excedem o necessário.

**Conclusão do Teste 2:** o tratamento é necessário e já incorpora o meio menos invasivo
razoável para a finalidade.

---

## 6. Teste 3 — Balanceamento (interesse do controlador × direitos do titular)

| Dimensão | Avaliação |
|---|---|
| **Natureza dos dados** | Não sensíveis e **não identificáveis** (estruturais + pseudônimo efêmero). Nenhum dado sensível do Art. 11. |
| **Expectativa razoável do titular** | Métricas de uso agregadas e anônimas são amplamente esperadas em software; o titular não é exposto, perfilado ou contatado. A expectativa é compatível. |
| **Impacto sobre o titular** | Baixo: não há decisão automatizada sobre a pessoa, *profiling*, publicidade ou compartilhamento com terceiros para fins próprios. |
| **Risco de reidentificação** | Baixo em tese (sem PII, pseudônimo de baixa capacidade), mas **não nulo** enquanto a leitura da tabela for pública (ver §8). |
| **Salvaguardas** | Ver §7 — minimização, opt-in, RLS, restrição de leitura, retenção limitada. |

**Ponderação:** o interesse do controlador (melhorar e tornar seguro o produto) é
substancial e a intromissão na esfera do titular é **mínima**, dada a ausência de
identificação e de qualquer uso que o atinja individualmente. O balanceamento **pende a
favor do tratamento**, **condicionado** às salvaguardas — em especial ao fechamento da
leitura pública da tabela `events` antes de qualquer uso externo.

**Conclusão do Teste 3:** o legítimo interesse prevalece, desde que mantidas e completadas
as mitigações da §7.

---

## 7. Salvaguardas e medidas de mitigação

1. **Minimização estrutural:** apenas escalares e rótulos; texto da pergunta nunca enviado
   (só `query_length`).
2. **Sem PII por regra:** comentário normativo no próprio `lib/telemetry.ts` e auditoria
   editorial (Fase 49) que removeu a *query* bruta.
3. **Pseudônimo efêmero:** `session_id` local, sem vínculo a identidade ou IP.
4. **Opt-in por configuração:** *no-op* silencioso sem as variáveis de ambiente.
5. **Transmissão segura:** HTTPS.
6. **Retenção limitada:** 12 meses, com eliminação/anonimização ao fim (a formalizar).
7. **Restrição de leitura (PENDENTE — crítica):** hoje a policy `read_anon` permite
   **leitura pública** da tabela `events` com a chave anônima. A leitura deve ser
   **restrita ao painel administrativo (server-side / service role)**, removendo o `SELECT`
   para `anon`. **Esta é a mitigação que sustenta a conclusão favorável do balanceamento** e
   deve ser implementada antes de qualquer uso externo (backlog ADP-22).
8. **Transparência:** a Política de Privacidade descreve a telemetria, a base legal e o
   inventário do que se coleta e do que não se coleta.

---

## 8. Riscos residuais e pontos de decisão do controlador

| # | Item | Situação | Decisão necessária |
|---|---|---|---|
| 1 | Leitura pública de `events` (`read_anon`) | Aberta | Implementar a restrição **antes de uso externo** (ADP-22) |
| 2 | Região do Supabase | Não confirmada | Confirmar/migrar para São Paulo (`sa-east-1`); define transferência internacional |
| 3 | Retenção de 12 meses | Declarada, não automatizada | Confirmar prazo e definir rotina de expurgo/anonimização |
| 4 | Metadados de conexão (IP) no operador | Inerente à hospedagem | Refletir na seção de operadores da Política; verificar contrato/sub-processadores do Supabase |
| 5 | Controlador PF → PJ | PF nesta fase | Atualizar este LIA e a Política na migração |
| 6 | Mecanismo de oposição/opt-out do titular | A definir | Decidir como o titular se opõe à telemetria (ver §9) |

---

## 9. Direitos do titular e oposição (Arts. 18 e 7º, §3º)

Por ser tratamento fundado em legítimo interesse, **não há banner de consentimento** —
opção compatível com dados não identificáveis. Em contrapartida, devem-se assegurar:

- **Informação clara** na Política (já contemplada).
- **Direito de oposição:** definir um caminho para o titular se opor ao tratamento de
  telemetria (ex.: ajuste de preferência no app, ou solicitação ao contato). *Ponto em
  aberto — ver §8, item 6.*
- Os demais direitos (acesso, correção, eliminação) têm alcance limitado pela própria
  natureza não identificável dos dados, o que deve ser explicado ao titular.

---

## 10. Conclusão

O tratamento de telemetria do Amigo do Prédio, tal como implementado, **encontra
fundamento adequado no legítimo interesse** (Art. 7º, IX, c/c Art. 10 da LGPD): a
finalidade é legítima e concreta, o tratamento é necessário e minimizado, e o balanceamento
pende a favor do controlador dado o impacto mínimo sobre o titular.

Essa conclusão é **condicionada** à implementação das salvaguardas pendentes — com
prioridade para **(a)** restringir a leitura pública da tabela `events` e **(b)** confirmar
a região de hospedagem — **antes de qualquer exposição externa do produto**. Cumpridas
essas condições e aprovado este registro pelo controlador, a Política de Privacidade pode
afirmar, com lastro, que a telemetria opera sob legítimo interesse com **teste de
balanceamento (LIA) documentado**.

---

## 11. Controle de versão

| Versão | Data | Autor | Mudança |
|---|---|---|---|
| 0.1 | 2026-06-14 | Minuta gerada para revisão do controlador | Primeira redação, com base no código e na Política vigentes |

> *Documento interno — Amigo do Prédio. Minuta jurídica para revisão de Lucas Romeiro
> (advogado e controlador). Não publicar como definitivo antes da aprovação e do
> cumprimento das condições da §8.*
