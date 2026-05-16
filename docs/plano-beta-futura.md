# Plano de Beta Futura — Amigo do Prédio

> **Status:** documentação interna preparatória. A beta com síndicos reais
> ainda NÃO está ativada. Este documento registra o planejamento para quando
> o momento chegar — aproximadamente uma semana antes do lançamento público.

---

## Quando a beta deverá acontecer

A beta com síndicos reais deve ocorrer **uma semana antes do lançamento público**.

Critérios mínimos que devem estar satisfeitos antes de ativar a beta:
- Onboarding fluido, sem estados vazios ou confusos
- Memória operacional compreensível por síndico leigo
- Alertas temporais proporcionais e não alarmistas
- Backup/exportação funcionando sem erros
- Assistente com fallback menos frustrante (idealmente com sugestões relevantes)
- Disclaimers claros e padronizados
- Nenhum erro de build ou TypeScript
- Nenhum bug evidente em mobile (iOS Safari e Chrome Android)
- Produto transmite maturidade e confiança

---

## Perfil ideal dos participantes da beta

Selecionar **3 a 5 síndicos** com os seguintes critérios:

**Diversidade de perfil:**
- Ao menos 1 síndico profissional (gere múltiplos condomínios)
- Ao menos 1 síndico morador leigo (eleito recentemente)
- Ao menos 1 prédio com elevador e ao menos 1 sem
- Mistura de idades (incluir alguém 50+ se possível)

**Critérios de confiança:**
- Pessoas conhecidas do fundador ou da rede próxima
- Dispostos a dar feedback honesto (não só elogios)
- Sem pressão comercial — a beta é para aprendizado, não para vender

**O que NÃO fazer:**
- Não selecionar beta testers por simpatia sem critério técnico
- Não escolher pessoas que hesitariam em apontar problemas
- Não incluir pessoas sem experiência real de gestão condominial

---

## Como apresentar o produto de forma honesta

**Antes de entregar o app:**

Comunicar explicitamente:
> "Este é um produto em fase de testes. Algumas funcionalidades ainda estão sendo refinadas. Seu feedback é o que vai moldar o produto final."

**O que o app faz:**
- Ajuda a organizar informações operacionais do condomínio
- Alerta sobre vencimentos e manutenções próximas
- Responde perguntas comuns sobre gestão condominial
- Mantém dados salvos localmente no dispositivo

**O que o app NÃO faz (ser explícito):**
- Não é uma consultoria jurídica
- Não substitui a administradora
- Não garante conformidade legal automática
- Não sincroniza dados entre dispositivos ainda
- Não tem integração com boletos ou financeiro

---

## Tarefas a pedir para os beta testers

Dar tarefas abertas, não roteiros fechados. Observar onde param espontaneamente.

**Tarefa 1 — Primeiro contato:**
> "Abra o app e configure seu condomínio. Depois me conte o que achou."

**Tarefa 2 — Cadastro de datas:**
> "Registre as principais datas do seu prédio — aquelas que você já sabe de cabeça."

**Tarefa 3 — Consulta ao assistente:**
> "Faça 3 perguntas que você costuma ter como síndico."

**Tarefa 4 — Revisão do estado geral:**
> "Depois de 3 dias usando, abra o app e me diga: o que está aparecendo na tela inicial? Faz sentido para você?"

**Tarefa 5 — Backup:**
> "Exporte um backup dos seus dados."

---

## Perguntas para fazer depois

Após 3 a 7 dias de uso:

**Sobre utilidade:**
- "Você abriu o app mais de uma vez por conta própria?"
- "Algum alerta ou orientação foi diretamente útil para você?"
- "Você deixou algum campo em branco? Por quê?"

**Sobre clareza:**
- "Teve algum texto que você não entendeu de primeira?"
- "Alguma sigla ficou sem explicação?"
- "O que o app comunicou que você achou impreciso ou exagerado?"

**Sobre confiança:**
- "Você confiaria nas informações do app para tomar uma decisão no condomínio?"
- "Você recomendaria para outro síndico? Por quê?"

**Sobre o que está faltando:**
- "O que você mais sentiu falta?"
- "Tem alguma funcionalidade que você esperava encontrar e não encontrou?"

---

## Métricas qualitativas a observar

Sem analytics externo nesta fase. Observação qualitativa:

| Métrica | O que observar |
|---|---|
| Onboarding completion | O usuário completou o perfil e registrou ao menos 2 datas? |
| Retorno espontâneo | Abriu o app por conta própria após o primeiro dia? |
| Uso do Assistente | Fez perguntas reais, não apenas de teste? |
| Compreensão dos alertas | Entendeu o que cada alerta significa sem explicação? |
| Confiança declarada | Recomendaria para outro síndico? |
| Pontos de confusão | Onde travou sem pedir ajuda? |

---

## Critérios mínimos para liberar a beta

- [ ] Build limpo sem erros de TypeScript
- [ ] Onboarding testado nos 7 cenários internos (docs/cenarios-internos-fase-28.md)
- [ ] Nenhum bug visual em iOS Safari (320px e 390px)
- [ ] Nenhum bug visual em Chrome Android (360px)
- [ ] Disclaimer padronizado em todas as respostas do Assistente
- [ ] Backup export/import funcionando end-to-end
- [ ] GuidancePanel com no máximo 3 itens visíveis inicialmente
- [ ] CondominioStatusHeader com estado correto para todos os cenários
- [ ] Textos sem siglas não explicadas no fluxo principal

---

## Critérios mínimos para lançamento público

Além dos critérios da beta, também verificar:

- [ ] Pelo menos 3 beta testers completaram o onboarding sem assistência
- [ ] Pelo menos 2 beta testers voltaram ao app espontaneamente após 3 dias
- [ ] Nenhum beta tester reportou confusão grave na leitura de alertas
- [ ] Disclaimers validados: nenhum beta tester interpretou o app como substituto de advogado
- [ ] Fundador está confortável para defender publicamente a qualidade do produto

---

## O que NÃO fazer antes de estar pronto

- Não criar link público antes de satisfazer os critérios de beta
- Não criar formulário de inscrição antes da data planejada
- Não prometer funcionalidades não implementadas para convencer beta testers
- Não lançar sem testar em dispositivo iOS físico
- Não ignorar feedback negativo de beta testers por medo de retrabalho

---

*Documento interno — Preparação para beta futura*
*Versão: 2026-05-12*
*Ativar apenas quando todos os critérios mínimos de beta estiverem satisfeitos.*
