# Cenários Internos de Simulação — Fase 28

> **Uso exclusivo interno.** Este documento serve para o fundador testar o produto
> com mentalidade de síndico real, cobrindo diferentes perfis de condomínio.
> Não é um roteiro para entrega a síndicos externos neste momento.

---

## Como usar este documento

1. Abra o app em modo privado (ou limpe o localStorage via DevTools)
2. Escolha um cenário abaixo
3. Preencha os dados sugeridos no fluxo de onboarding
4. Observe o comportamento nas abas indicadas
5. Faça as perguntas sugeridas ao Assistente
6. Registre o que funcionou bem e o que ficou confuso

Para limpar todos os dados entre cenários:
```
DevTools → Application → Local Storage → Selecionar tudo → Deletar
```

---

## Cenário 1 — Condomínio Organizado

**Perfil:** síndico profissional, prédio médio com elevador, boa gestão.

**Dados para preencher:**

| Campo | Valor sugerido |
|---|---|
| Nome | Residencial das Palmeiras |
| Elevador | Sim |
| Piscina | Não |
| Funcionários | Sim |
| Tipo de síndico | Profissional |
| AVCB — vencimento | 1 ano à frente (ex: 2027-05-12) |
| Seguro — vencimento | 8 meses à frente (ex: 2027-01-12) |
| AGO — última | 2 meses atrás (ex: 2026-03-12) |
| Dedetização — última | 3 meses atrás (ex: 2026-02-12) |
| Caixa d'água — última | 2 meses atrás (ex: 2026-03-12) |
| Manutenção elevador | 2 semanas atrás (ex: 2026-04-28) |
| Extintores — última | 5 meses atrás (ex: 2025-12-12) |

**O que observar:**

- **Aba Início:** badge "Tudo em ordem" (verde). Nenhum item crítico no GuidancePanel. Se algum item aparece, verificar se o threshold está correto.
- **CondominioStatusHeader:** nome do condomínio exibido. Summary: "Tudo em ordem por aqui."
- **Aba Condomínio:** todos os campos aparecem preenchidos.

**Perguntas para o Assistente:**
- "O que o síndico precisa fazer na AGO?"
- "Como é feita a prestação de contas?"
- "Quando é necessário renovar o AVCB?"

**Sinais de que funcionou:**
- App transmite calma. Sem alertas desnecessários.
- Badge verde bem visível.
- Assistente responde com conteúdo relevante.

**Sinais de que ficou confuso:**
- Itens aparecendo como "atenção" mesmo estando em dia.
- Interface parece vazia ou sem sentido quando tudo está ok.

---

## Cenário 2 — Condomínio com Urgência Real

**Perfil:** síndico morador, prédio antigo, algumas pendências acumuladas.

**Dados para preencher:**

| Campo | Valor sugerido |
|---|---|
| Nome | Edifício São Paulo |
| Elevador | Sim |
| Piscina | Não |
| Funcionários | Não / terceirizado |
| Tipo de síndico | Morador |
| AVCB — vencimento | 15 dias atrás (VENCIDO — ex: 2026-04-27) |
| Seguro — vencimento | 10 dias à frente (ex: 2026-05-22) |
| AGO — última | 16 meses atrás (ex: 2025-01-12) |
| Dedetização — última | 200 dias atrás (ex: 2025-10-24) |
| Caixa d'água — última | deixar em branco |
| Manutenção elevador | 60 dias atrás (ex: 2026-03-13) |
| Extintores — última | deixar em branco |

**O que observar:**

- **Aba Início:** badge "Atenção urgente" (âmbar escuro). GuidancePanel com pelo menos 2 itens críticos (AVCB vencido + AGO + elevador). Verificar se o texto é informativo mas não alarmista.
- **CondominioStatusHeader:** summary deve mencionar as pendências sem tom de catástrofe.
- **GuidancePanel:** testar o botão "Ver todos" se houver mais de 3 itens.
- **Fluxo de resolução:** marcar AVCB como renovado. Verificar se o item desaparece na próxima leitura.

**Perguntas para o Assistente:**
- "Como renovar o AVCB do condomínio?"
- "O síndico pode ser responsabilizado por AVCB vencido?"
- "Como convocar uma assembleia?"

**Sinais de que funcionou:**
- App prioriza o urgente sem criar pânico.
- Linguagem clara, sem juridiquês.
- Botão "Registrar nova data do AVCB" funciona e atualiza o estado.

**Sinais de que ficou confuso:**
- Tom muito alarmista para o contexto.
- Interface parece sobrecarregada de problemas.
- Resolver um item não atualiza a tela.

---

## Cenário 3 — Condomínio Parcialmente Cadastrado

**Perfil:** síndico morador, prédio pequeno, pouco tempo disponível.

**Dados para preencher:**

| Campo | Valor sugerido |
|---|---|
| Nome | Condomínio Monteiro |
| Elevador | Não |
| Piscina | Não |
| Funcionários | Não / terceirizado |
| Tipo de síndico | Morador |
| AVCB — vencimento | 45 dias à frente (ex: 2026-06-26) |
| Seguro — vencimento | deixar em branco |
| AGO — última | deixar em branco |
| Demais campos | deixar em branco |

**O que observar:**

- **CondominioStatusHeader:** deve mostrar o AVCB como "atencao" (45 dias).
- **GuidancePanel:** aparece com o item de AVCB em "planejamento".
- **Aba Condomínio:** MemoriaPanel mostra campos em branco com convite para completar.
- **Aba Início:** deve incentivar completar dados, sem parecer vazio ou quebrado.

**Perguntas para o Assistente:**
- "O que é AVCB?"
- "Quais são as principais obrigações do síndico?"

**Sinais de que funcionou:**
- App parece útil mesmo com poucos dados.
- Incentivo para completar dados sem irritar.
- Sem erros ou estados vazios confusos.

**Sinais de que ficou confuso:**
- App parece incompleto ou sem propósito.
- Nenhum alerta visível mesmo com AVCB a 45 dias.

---

## Cenário 4 — Condomínio Pequeno e Simples

**Perfil:** prédio de 8 unidades, sem elevador, sem piscina, condomínio horizontal.

**Dados para preencher:**

| Campo | Valor sugerido |
|---|---|
| Nome | Residencial Araucária |
| Elevador | Não |
| Piscina | Não |
| Funcionários | Não / terceirizado |
| Tipo de síndico | Morador |
| AVCB — vencimento | 4 meses à frente (ex: 2026-09-12) |
| Seguro — vencimento | 6 meses à frente (ex: 2026-11-12) |
| AGO — última | 3 meses atrás (ex: 2026-02-12) |
| Dedetização — última | 4 meses atrás (ex: 2026-01-12) |

**O que observar:**

- **GuidancePanel:** sem item de elevador (corretamente filtrado).
- **CondominioStatusHeader:** sem linha de elevador.
- **Aba Início:** estado sereno, nada em urgência real.
- **MemoriaPanel:** campos de elevador não aparecem (porque hasElevador = false).

**Perguntas para o Assistente:**
- "Condomínio pequeno precisa de AVCB?"
- "Síndico de condomínio horizontal tem as mesmas obrigações?"

**Sinais de que funcionou:**
- Nenhum alerta irrelevante sobre elevador.
- App parece calibrado para o porte do prédio.

**Sinais de que ficou confuso:**
- Alertas de elevador aparecem mesmo sem elevador cadastrado.
- Interface parece feita apenas para prédios grandes.

---

## Cenário 5 — Condomínio Grande e Complexo

**Perfil:** prédio de 120 unidades, elevador, piscina, portaria 24h, funcionários próprios.

**Dados para preencher:**

| Campo | Valor sugerido |
|---|---|
| Nome | Condomínio Torres do Vale |
| Elevador | Sim |
| Piscina | Sim |
| Funcionários | Sim |
| Tipo de síndico | Profissional |
| AVCB — vencimento | 20 dias à frente (ex: 2026-06-01) |
| Seguro — vencimento | 70 dias à frente (ex: 2026-07-21) |
| AGO — última | 9 meses atrás (ex: 2025-08-12) |
| Dedetização — última | 160 dias atrás (ex: 2025-11-03) |
| Caixa d'água — última | 170 dias atrás (ex: 2025-10-24) |
| Manutenção elevador | 20 dias atrás (ex: 2026-04-22) |
| Extintores — última | 5 meses atrás (ex: 2025-12-12) |
| Administradora | Exemplo Administradora Ltda |
| Empresa elevador | TechElevadores |

**O que observar:**

- **GuidancePanel:** múltiplos itens aparecem. Verificar o botão "Ver todos" quando houver mais de 3.
- **Agrupamento:** itens críticos aparecem antes dos de atenção.
- **CondominioStatusHeader:** badge "Em observação" ou "Uma pendência".
- **Aba Condomínio:** administradora e empresa do elevador aparecem preenchidos.

**Perguntas para o Assistente:**
- "Como convocar uma assembleia?"
- "Qual a frequência de dedetização obrigatória?"
- "O síndico pode ser responsabilizado por acidente no elevador?"

**Sinais de que funcionou:**
- GuidancePanel organiza prioridades de forma clara.
- "Ver todos" funciona e exibe os itens extras.
- App não parece sobrecarregado mesmo com múltiplos alertas.

**Sinais de que ficou confuso:**
- Mais de 5 itens na tela sem hierarquia clara.
- Difícil saber por onde começar.

---

## Cenário 6 — Síndico Leigo / Primeira Experiência

**Perfil:** síndico morador recém-eleito, nunca usou app de gestão, pouca familiaridade com siglas.

**Dados para preencher:**

| Campo | Valor sugerido |
|---|---|
| Nome | deixar em branco |
| Elevador | Sim |
| Piscina | Não |
| Funcionários | Não |
| Tipo de síndico | Morador |
| AVCB — vencimento | 3 meses atrás (VENCIDO — ex: 2026-02-12) |
| Seguro — vencimento | 2 meses à frente (ex: 2026-07-12) |
| Demais campos | deixar em branco |

**O que observar:**

- **Sublabels no MemoriaPanel:** "Auto de Vistoria do Corpo de Bombeiros", "Seguro condominial obrigatório por lei" — verificar se aparecem corretamente.
- **GuidancePanel:** texto do AVCB vencido deve ser compreensível sem conhecimento técnico prévio.
- **Disclaimer no Assistente:** verificar se é claro e não amedronta.
- **Onboarding:** bridge entre perfil e memória deve ser compreensível para alguém leigo.

**Perguntas para o Assistente:**
- "O que é AVCB?"
- "Por que o seguro do condomínio é obrigatório?"
- "O que acontece se o AVCB estiver vencido?"

**Sinais de que funcionou:**
- Usuário entende o que fazer sem precisar de explicação externa.
- Siglas estão explicadas contextualmente.
- Tom calmo e acolhedor.

**Sinais de que ficou confuso:**
- Siglas sem explicação (AVCB, AGO, SPDA).
- Tom técnico ou intimidador.
- Usuário não sabe por onde começar.

---

## Cenário 7 — Síndico Profissional / Exigente

**Perfil:** síndico que gerencia 5 condomínios, quer eficiência, não precisa de explicações básicas.

**Dados para preencher:**

Igual ao Cenário 5 (complexo), mas com foco na avaliação qualitativa da UX, não no conteúdo.

**O que observar:**

- **Velocidade de leitura:** o app transmite informação útil rápido?
- **Densidade informacional:** é possível entender o estado do condomínio em menos de 10 segundos?
- **GuidancePanel:** os contextos são objetivos e não infantilizam?
- **Disclaimers:** não poluem desnecessariamente o fluxo?
- **Assistente:** as respostas são precisas e bem estruturadas?

**Perguntas para o Assistente:**
- "Quais são os prazos legais de convocação de assembleia?"
- "O síndico responde solidariamente com o condomínio?"
- "Qual a frequência de inspeção de SPDA?"

**Sinais de que funcionou:**
- App parece confiável, técnico e bem estruturado.
- Informações apresentadas de forma objetiva.
- Sem redundâncias ou explicações óbvias desnecessárias.

**Sinais de que ficou confuso:**
- Tom excessivamente didático para quem já sabe.
- Muitos cliques para chegar à informação relevante.
- Respostas do Assistente muito superficiais.

---

## Checklist de Qualidade por Cenário

Após cada cenário, responder:

- [ ] O estado da aba Início fez sentido para o perfil?
- [ ] Os alertas do GuidancePanel eram proporcionais à situação?
- [ ] O texto do CondominioStatusHeader foi claro e não alarmista?
- [ ] Os disclaimers no Assistente foram adequados sem poluir?
- [ ] Alguma sigla ficou sem explicação no momento errado?
- [ ] O fluxo de resolução de um item funcionou sem bugs?
- [ ] A experiência mobile pareceu natural e confortável?
- [ ] Algum texto ficou pequeno demais para ler com conforto?
- [ ] O app transmitiu confiança e maturidade?

---

*Documento interno — Fase 28 — Amigo do Prédio*
*Versão: 2026-05-12*
