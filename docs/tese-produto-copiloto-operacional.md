# Tese de Produto — Amigo do Prédio como Copiloto Operacional do Síndico

> **Documento estratégico interno — Fase 40**
> Consolida o posicionamento do produto, limites de escopo e critérios para evolução futura.

---

## O que o Amigo do Prédio é

**Frase central:**
> "Recebeu um problema no condomínio? O Amigo do Prédio te ajuda a entender, responder, documentar e agir com segurança."

O Amigo do Prédio é uma **central de apoio operacional ao síndico**: um app que combina orientações práticas, geração de documentos, checklists operacionais, simulações e monitoramento de vencimentos em uma experiência integrada.

O produto resolve o problema real do síndico voluntário: **ele não sabe o que fazer, não tem com quem perguntar sem custo e não sabe como documentar corretamente antes de agir**.

---

## O que o Amigo do Prédio não é

- **Não é um chatbot genérico de condomínio.** Não responde a qualquer coisa que o usuário digitar. O escopo é deliberadamente condominial.
- **Não é consultoria jurídica.** Não emite pareceres, não garante resultados, não substitui advogado.
- **Não é um ERP condominial.** Não gerencia contratos, não emite boletos, não controla inadimplência em sistema.
- **Não é IA generativa.** O motor é determinístico, baseado em regras editoriais, sem geração de texto por LLM (na fase atual).
- **Não é uma plataforma de votação ou eleição.** Não gera atas, não coleta votos, não gerencia candidatos.

---

## Por que não é só chat

Um chatbot responde quando o síndico pergunta.
Um copiloto operacional **avisa antes de virar problema**.

Exemplos da diferença:
- **Chatbot:** o síndico pergunta "quando vence meu AVCB?" → recebe a informação
- **Copiloto:** o app sabe a data do AVCB e avisa 90 dias antes, 60 dias antes, 30 dias antes — com orientação de próximo passo
- **Chatbot:** o síndico pergunta sobre multa por barulho e recebe uma resposta genérica
- **Copiloto:** a resposta sobre multa inclui CTA para gerar a notificação de infração no mesmo momento

O campo de vencimento do mandato do síndico é o exemplo perfeito: um chat só responderia quando o síndico perguntasse. O copiloto avisa antes de virar urgência — com orientação para convocar a assembleia.

---

## Os 5 casos de dor campeões

São as situações que fazem o síndico "suar frio" e que o produto deve resolver com clareza:

1. **Multa / advertência** — como aplicar, quando é válida, como documentar, como notificar
2. **Barulho / perturbação** — o que o síndico pode fazer, como registrar, como notificar, quando é infração
3. **Obra em unidade** — o que precisa de autorização, horários, responsabilidade, como comunicar
4. **Inadimplência / cobrança** — o que o síndico pode e não pode fazer, como cobrar, quando vai a judicial
5. **Assembleia / convocação / ata** — como convocar, prazo, quórum, eleição de síndico, aprovação de contas

Toda feature nova deve ser avaliada em relação a: **ela resolve um desses 5 casos melhor?**

---

## A sequência problema → orientação → documentação → ação

O produto deve guiar o síndico por esta sequência:

```
PROBLEMA
  ↓
ORIENTAÇÃO (Assistente: entenda o que acontece, o que pode fazer)
  ↓
DOCUMENTAÇÃO (Ferramentas: gere o comunicado, checklist ou cálculo)
  ↓
AÇÃO (próximo passo claro, com segurança)
```

Cada etapa deve estar acessível sem fricção:
- O Assistente mostra o próximo passo e oferece CTA para a ferramenta relevante
- As Ferramentas são alcançáveis a partir da resposta do Assistente (com 1 toque)
- O monitoramento (aba Início) antecipa problemas antes do síndico perceber

---

## O papel do vencimento do mandato do síndico

O mandato do síndico é o exemplo mais nítido da filosofia de copiloto operacional.

**Problema real:** síndicos frequentemente não monitoram o próprio fim de mandato e chegam perto da data sem ter convocado a assembleia. Isso pode gerar:
- questionamentos sobre a validade de atos praticados após o vencimento
- mandato informal sem renovação em ata
- confusão sobre representação do condomínio em contratos e decisões formais

**Como o produto resolve:**
- O síndico registra a data de fim de mandato no MemoriaPanel
- O app monitora com 4 níveis de alerta: 90 dias (acompanhar), 60 dias (planejar), 30 dias (urgente), vencido (crítico)
- Cada alerta orienta o próximo passo: convocar a assembleia, observar o prazo da convenção, preparar a documentação
- O CTA de "Preparar convocação" está a um toque de distância no Assistente

**Limites jurídicos importantes (linguagem prudente obrigatória):**
- Não afirmar que todos os atos do síndico são automaticamente inválidos após o vencimento
- Não afirmar que o síndico perde poderes em qualquer caso sem análise da convenção e situação concreta
- Usar sempre linguagem como: "pode gerar questionamentos", "deve ser regularizado", "verifique a convenção", "organize a eleição ou recondução", "formalize em ata"
- O produto orienta — a decisão final depende da convenção, do contexto e eventualmente de assessoria jurídica

---

## Limites jurídicos e posição frente à OAB

O produto **não fornece consultoria jurídica** e não deve jamais ser percebido como tal.

Regras de linguagem a seguir em toda resposta:
- Informativo, não prescritivo: "a legislação prevê" em vez de "você pode"
- Condicional quando necessário: "geralmente exige", "conforme a convenção"
- Disclaimer presente em toda resposta: "Esta orientação tem caráter informativo. Situações específicas podem exigir análise da administradora, assessoria jurídica ou profissional responsável."
- Nunca: "consultoria jurídica", "advogado virtual", "parecer automático", "garantia legal", "solução definitiva"

O posicionamento correto:
> O Amigo do Prédio é um recurso de orientação operacional, como um manual prático bem escrito. Ele não substitui advogado nem administradora — ele ajuda o síndico a entender a situação antes de acionar qualquer deles.

---

## Riscos de parecer IA genérica

O produto deve ser percebido como **específico para gestão condominial**, não como um assistente geral com prompt sobre condomínio.

Sinais de alerta de deriva para "IA genérica":
- Responder perguntas fora do escopo condominial sem bloquear
- Copy centrada em "pergunte qualquer coisa" em vez de "resolva o problema"
- Ausência de ferramentas e monitoramento — só chat
- Nenhum estado vazio que mostre o que o app monitora automaticamente
- Fallback genérico sem direcionamento para o tema correto

Antídotos implementados:
- Motor determinístico com CATEGORY_ANCHORS (bloqueio de fora-do-escopo)
- 4 abas separando função: orientação, ferramentas, dados, início
- GuidancePanel que avisa proativamente
- CTAs de comunicado e checklist integrados à resposta
- Copy que nomeia as dores (multa, barulho, obra, inadimplência, assembleia)

---

## Como a UI deve comunicar valor

### Copy que funciona
- "Do problema ao comunicado: orientações práticas, checklists, cálculos e monitoramento de vencimentos críticos."
- "Cada data registrada é um alerta antes de virar urgência."
- "Qual é a situação? Descreva o problema — o app orienta o próximo passo."
- "Transforme orientações em documentos: comunicados, cálculos e checklists para o dia a dia do síndico."

### Copy a evitar
- "Pergunte qualquer coisa"
- "IA condominial"
- "Assistente inteligente" (sem contexto de gestão)
- "Consultoria jurídica"
- Superlativos vazios ("completo", "definitivo", "tudo")

### Estados vazios devem mostrar valor
O estado sem dados deve mostrar o que o app monitora (AVCB, Seguro, Mandato, AGO, etc.), não apenas pedir para cadastrar. A lista de itens monitorados é uma promessa de valor, não um formulário.

---

## Como futuras features devem ser avaliadas

Antes de implementar qualquer feature nova, responder:

1. **Ela resolve um dos 5 casos de dor campeões diretamente?**
   Se não, pode esperar.

2. **Ela reforça a sequência problema → orientação → documentação → ação?**
   Features que quebram essa sequência ou adicionam desvios devem ser questionadas.

3. **Ela introduz risco jurídico (OAB) ou risco de LGPD?**
   Se sim, precisa de revisão jurídica antes de ir ao ar.

4. **Ela mantém o produto focado em síndicos, não em administradoras?**
   Funcionalidades para administradoras têm complexidade diferente e público diferente.

5. **O bundle da rota principal se mantém abaixo de 230 kB?**
   Se não, avaliar dynamic import ou adiar a feature.

6. **A feature pode ser substituída por melhor copy ou melhor CTA?**
   Frequentemente uma boa orientação resolve o problema sem nova feature.

---

## Critérios para aceitar ou rejeitar novas ferramentas

| Critério | Aceitar | Rejeitar |
|---|---|---|
| Resolve dor dos 5 campeões | Sim | Não diretamente |
| Custo de implementação | Baixo (1 sprint) | Alto (arquitetura nova) |
| Risco jurídico | Baixo | Alto sem revisão |
| Bundle | Mantém < 230 kB | Aumenta significativamente |
| Público | Síndico voluntário | Administradora / jurídico |
| Substituível por copy | Não | Sim |

---

## Sinais de morte do produto

Monitorar estes sinais com atenção:
- Retenção D7 < 15% após beta real
- Fallback rate > 50% (motor não cobre o que usuários perguntam)
- Síndicos não cadastram dados do prédio (ativação zero)
- Ninguém usa as ferramentas além do chat
- Feedback recorrente de "isso não me ajuda a agir"
- NPS < 20 após 4 semanas de uso

---

## O que a Fase 41 entregou

A Fase 41 completou o painel operacional da aba Início com:

- **"Próximas datas"** (`components/ProximasDatas.tsx`): lista unificada de vencimentos e rotinas do prédio,
  ordenada por urgência. Vencimentos diretos (AVCB, Seguro, Mandato) e rotinas calculadas (AGO, dedetização,
  caixa d'água, elevador, extintores, SPDA, elétrica). Toque em qualquer item → Assistente com pergunta contextual.
- **Insight de mandato** (`lib/insights.ts`): cobre a janela 90–180 dias de antecipação do fim de mandato,
  complementando o GuidancePanel (que já cobre ≤ 90 dias).
- **"Perguntar sobre"** (`components/PainelOperacional.tsx`): categoria de atalho renomeada de "Explorar mais"
  para deixar claro que o clique abre o Assistente, não uma ferramenta.
- **Visão futura financeiro** (`docs/visao-futura-financeiro-demonstrativos.md`): raciocínio documentado sobre
  quando e como entrar no território financeiro — demonstrativo da administradora, previsão orçamentária, reajuste.

---

## O que a Fase 43 entregou — Tempo até o alívio

A Fase 43 reposicionou a primeira experiência e melhorou o fluxo de resolução de problemas:

- **Hero problema-primeiro**: "Recebeu um problema no condomínio?" com chips situacionais (5 situações reais, clicáveis → Assistente + auto-submit). "Ativar monitoramento" rebaixado para link secundário. O produto agora acolhe o síndico em crise antes de pedir configuração.
- **AskInput situacional**: placeholder "Morador fez obra sem avisar. O que faço?" — ativa o modo mental correto.
- **QuickAccessCards situacionais**: cards exibem a pergunta real como texto principal, não a categoria abstrata.
- **"Próximo passo" explícito**: `CAT_TO_NEXTACTION` em `Response.tsx` — quando uma entrada KB não tem dica específica, o Assistente exibe uma ação concreta para o síndico tomar imediatamente (10 categorias cobertas).
- **CAT_TO_COMUNICADO expandido**: responsabilidade civil e gestão condominial agora têm CTA de comunicado direto na resposta.
- **Documentação estratégica**: `tese-tempo-ate-alivio.md` (define a métrica central do produto), `laboratorio-cenarios-sindico.md` (50+ cenários para calibração e priorização), `matriz-maturidade-fluxos.md` (11 fluxos × 7 critérios, score 0–5).

---

## Próxima fase recomendada

Com o produto orientado ao alívio, o próximo passo é **validação com síndicos reais** em modo beta fechado.

Antes de convidar os primeiros testadores:
1. Confirmar recall ≥ 75% no painel /admin
2. Testar PWA em dispositivo físico (Android + iOS)
3. Configurar Supabase para telemetria real
4. Preparar canal de feedback (WhatsApp direto ou formulário)
5. Montar roteiro de observação: onboarding, primeira consulta, retorno D3

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 43)*
