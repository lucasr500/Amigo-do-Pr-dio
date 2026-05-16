# Guia de Qualidade Editorial da Base de Conhecimento

> **Uso interno.** Referência para criação e revisão de entradas na KB do Amigo do Prédio.
> Aplica-se tanto para expansão humana quanto para futura alimentação assistida por IA.

---

## 1. Objetivo da KB

A base de conhecimento não é uma enciclopédia jurídica. É um braço direito prático do síndico.

Cada entrada deve ajudar um síndico real a dar **o próximo passo com segurança** em uma situação concreta da rotina condominial. Não substituir advogado, administradora ou assembleia — mas orientar com clareza o que fazer antes de precisar deles.

A KB é a fonte de verdade do produto. Uma entrada ruim prejudica mais do que ausência de resposta.

---

## 2. Tom de voz

| O que ser | O que evitar |
|-----------|--------------|
| Direto e objetivo | Juridiquês excessivo |
| Calmo e seguro | Tom alarmista ("você pode ser processado!") |
| Prático e acionável | Respostas filosóficas ou genéricas demais |
| Honesto sobre limitações | Falsas certezas absolutas |
| Profissional, não formal demais | Linguagem de parecer jurídico |
| Cuidadoso com o coletivo | Incentivar exposição de condôminos |

**Teste de tom:** imagine um síndico de condomínio médio, sem experiência jurídica, que digitou a pergunta no WhatsApp. A resposta faria sentido para ele? Ele saberia o que fazer a seguir?

---

## 3. Estrutura ideal de uma entrada

```json
{
  "id": "kebab-case-descritivo",
  "categoria": "categoria-existente",
  "pergunta": "Como o síndico realmente perguntaria?",
  "resposta": "Orientação objetiva — o que pode fazer, o que não pode, o que recomenda.",
  "contexto": "Por que isso é assim — base legal, razão prática, nuances importantes.",
  "dica": "Ação concreta que o síndico pode tomar agora.",
  "keywords": ["token1", "token2", "token3"]
}
```

### Função de cada campo

**`id`** — Identificador estável. Escolha algo descritivo e permanente. Uma vez em uso, não renomear sem migração.

**`categoria`** — Determina o fallback contextual e o agrupamento visual. Usar categorias existentes; criar nova categoria só se não houver encaixe razoável.

**`pergunta`** — Escrita como o síndico perguntaria no WhatsApp ou buscaria no app. Linguagem natural. Pode incluir contexto ("Morador fez barulho de madrugada — o que faço?"). Não precisa ser pergunta formal.

**`resposta`** — O coração da entrada. Deve ser legível em 30 segundos. Evitar mais de 5 linhas densas. Pode usar lista numerada para procedimentos. Ver seção 4.

**`contexto`** — Explica o "porquê" — base legal relevante, nuances, condições. O síndico pode pular este campo; ele é para quem quer entender melhor. Não é obrigatório ter artigo de lei — pode ser prático ("A lei diferencia obras necessárias de voluptuárias").

**`dica`** — Ação concreta e imediata. Uma frase, no máximo três. Algo que o síndico pode fazer hoje. Não repete o que está na resposta.

**`keywords`** — Ver seção 7.

---

## 4. O que uma boa resposta deve conter

- **Posicionamento claro:** pode / não pode / depende (com condição) / exige cuidado
- **Procedimento básico** quando houver: 1) faça X, 2) depois Y, 3) guarde Z
- **Condição relevante:** "desde que previsto na convenção", "salvo se a CCT prever diferente"
- **Aviso de especialista** quando o tema exige: "consulte a administradora", "oriente o morador a buscar advogado"
- **Limite claro:** o que o condomínio pode e não pode fazer

Uma resposta não precisa cobrir todos os casos possíveis. Deve cobrir o caso mais provável com segurança.

---

## 5. O que evitar

### 5.1 Juridicamente

- ❌ Números sem base segura: "a multa é de R$ 500" (não, é proporcional à convenção)
- ❌ "sempre" e "nunca" sem exceção: "o inquilino nunca pode votar" (pode, se autorizado)
- ❌ Legislação municipal sem especificar que varia por cidade
- ❌ Citar artigo de lei de forma errada ou desatualizada
- ❌ Orientar exposição pública de condôminos ou inadimplentes

### 5.2 Operacionalmente

- ❌ Dar mais confiança do que a situação permite: "pode cobrar e vai ganhar na justiça"
- ❌ Prometer resultado: "se fizer X, o morador vai ter que sair"
- ❌ Substituir administradora, advogado ou assembleia quando são necessários
- ❌ Orientar conduta que exige decreto municipal ou laudo técnico sem mencionar isso

### 5.3 Editorialmente

- ❌ Duplicar conteúdo de entrada existente sem diferenciação clara
- ❌ Frases como keywords (o motor tokeniza individualmente)
- ❌ Keywords genéricas demais: "problema", "ajuda", "coisa", "pode", "fazer"
- ❌ Resposta mais longa do que 6 linhas sem necessidade
- ❌ Tom alarmista ou que gere ansiedade desnecessária no síndico

---

## 6. Como escolher a categoria

Use a categoria que melhor descreve **o problema do síndico**, não o aspecto jurídico.

| Categoria | Quando usar |
|-----------|-------------|
| `multas` | Aplicar, contestar, graduar multas por infração |
| `obras` | Obras, reformas, ART, aprovação, horários |
| `inadimplencia` | Cobrança, negativação, prescrição, parcelamento |
| `assembleias` | Convocação, quórum, votação, ata, procuração |
| `trabalhista` | Jornada, hora extra, férias, rescisão, CCT |
| `funcionarios` | Contratação, demissão, funções, dia a dia |
| `responsabilidade` | Danos, vazamentos, acidentes, sinistros |
| `lgpd` | Câmeras, dados, WhatsApp, privacidade |
| `locacao` | Inquilinos, aluguel, temporada, despejo |
| `gestao` | Síndico, administradora, cotações, prestação de contas |
| `financeiro` | Fundo de reserva, rateio, balancete, reajuste |
| `manutencao` | Equipamentos, vistoria, AVCB, elevador, piscina |
| `areas-comuns` | Garagem, salão, academia, uso coletivo |
| `convencao` | Convenção, regimento, alteração, registro |
| `juridico` | Temas gerais de direito condominial |
| `cobranca` | Procedimentos específicos de cobrança judicial |

**Quando há dúvida:** prefira a categoria que a pessoa escolheria ao procurar ajuda, não a categoria técnica da lei.

---

## 7. Como criar keywords boas

### Regras básicas

1. **Um token por keyword** — não use frases: ✅ `"justa"`, `"causa"` / ❌ `"justa causa"`
2. **Sem acento** — o motor normaliza: ✅ `"rescisao"` / ❌ `"rescisão"`
3. **Sem pontuação** — só letras e números
4. **Mínimo 3 caracteres** — o tokenizador ignora tokens menores
5. **Termos reais** — como o síndico falaria no WhatsApp

### O que incluir

- Palavras-chave do problema: `multa`, `obra`, `assembleia`, `jornada`
- Sinônimos naturais que o síndico usaria: `demissao`, `demitir`, `dispensar`
- Substantivos específicos do tema: `porteiro`, `zelador`, `faxineiro`
- Verbos de ação do contexto: `calcular`, `cobrar`, `notificar`, `demitir`
- Termos técnicos que podem aparecer: `rescisao`, `fgts`, `clt`, `cct`

### O que não incluir

- Preposições e artigos: `de`, `por`, `com`, `que`, `para`
- Verbos genéricos sem contexto: `fazer`, `mudar`, `alterar`, `poder`
- Palavras que estão em WEAK_KEYWORDS (já recebem tratamento diferenciado)
- Palavras tão genéricas que aparecem em metade da KB: `condominio`, `sindico`, `morador`
  (já são WEAK — não adianta duplicar)

### Quantidade ideal

10 a 20 tokens discriminantes. Mais de 25 começa a diluir o sinal. Menos de 8 pode ser difícil de encontrar.

---

## 8. Como lidar com temas jurídicos sensíveis

### Princípio geral

Orientar o caminho, não dar o parecer. A entrada deve ajudar o síndico a entender o que é o problema e qual é o próximo passo — não substituir o advogado.

### Quando mencionar base legal

- Quando o artigo é bem estabelecido e improvável de mudar (CC art. 1.336, CLT arts. principais)
- Quando o síndico provavelmente vai pesquisar ou ouvir falar: "o STJ decidiu (Tema 1.079)"
- Não precisar mencionar artigo para toda resposta — muitas respostas são sobre procedimento

### Quando não mencionar base legal

- Quando a lei varia por município (postura municipal, lei de silêncio)
- Quando a legislação é recente e pode ser questionada
- Quando o ponto central é procedimental, não legal

### Fórmulas seguras

- "desde que previsto na convenção"
- "conforme o regimento interno"
- "dependendo da CCT da sua categoria"
- "consulte a administradora antes de agir"
- "oriente o morador a buscar um advogado"
- "o condomínio pode ajudar com documentação, mas não responde diretamente por isso"

---

## 9. Como lidar com temas operacionais

Para temas de rotina (horários, escalas, contratos, cotações):

- Dê o caminho completo em passos numerados quando houver procedimento claro
- Mencione o que o síndico precisa documentar
- Mencione quando é necessária aprovação assemblear
- Use linguagem de gestão: "documente", "registre", "comunique", "ratifique"

---

## 10. Como lidar com LGPD, imagens, WhatsApp, câmeras

Esses temas têm **alto risco de orientar conduta irregular** se simplificados demais.

### Boas práticas

- Sempre mencionar que imagens de câmeras são dados pessoais sensíveis
- Não orientar publicação de imagens ou listas com dados de condôminos
- Mencionar aviso ao condomínio quando instalar novas câmeras
- Informar prazo recomendado de retenção (30 dias)
- Para WhatsApp: distinguir comunicação coletiva (OK com cuidado) de exposição de dados (não OK)

### Frases de cautela obrigatórias neste tema

- "respeite o prazo de guarda e o propósito da coleta"
- "não compartilhe imagens com terceiros sem necessidade"
- "consulte a administradora sobre a política de dados"

---

## 11. Como decidir quando criar nova entrada

Criar nova entrada quando:

- A pergunta tem ângulo **claramente diferente** de entradas existentes
- A consulta resultaria em fallback ou match errado sem a nova entrada
- O tema é **recorrente** na rotina do síndico
- A resposta pode ser dada com **segurança** sem pesquisa jurídica aprofundada
- O tema **não muda** frequentemente com legislação ou CCT

Não criar nova entrada quando:

- Já existe uma entrada que cobre o tema com keywords adequadas — melhore as keywords
- O tema exige pesquisa jurídica que você não confirmou
- O tema depende fortemente de convenção local (não há resposta genérica útil)
- Criaria duplicidade com diferença mínima

---

## 12. Como decidir quando melhorar entrada existente

Melhorar entrada existente quando:

- As keywords são frases multi-palavra (não tokenizadas) — **corrija sempre**
- A query-alvo não está encontrando a entrada mas o conteúdo está correto
- A resposta está desatualizada ou confusa
- A dica é vaga ou irrelevante
- A categoria está claramente errada

Não mexer quando:

- A entrada é encontrada corretamente e responde bem
- A melhoria seria só cosmética sem impacto na encontrabilidade

---

## 13. Como evitar duplicidades

Antes de criar uma nova entrada:

1. Buscar na KB por `id` com termos do tema
2. Verificar entradas da mesma `categoria`
3. Verificar se existe entrada com ângulo diferente que poderia ser complementada
4. Se existir entrada próxima, avalie: o ângulo novo é suficientemente diferente para merecer entrada própria?

**Ângulos que justificam entrada separada:**
- Locatário vs. proprietário (ambos têm dúvidas sobre o mesmo tema)
- Procedimento vs. consequências (o que posso fazer vs. o que acontece se não fizer)
- Urgência vs. planejado (emergência vs. obra programada)

---

## 14. Checklist antes de adicionar uma entrada

Antes de fazer push de nova entrada:

- [ ] O `id` é único na KB?
- [ ] A `categoria` existe na lista de categorias?
- [ ] A `pergunta` usa linguagem natural, como o síndico perguntaria?
- [ ] A `resposta` é legível em 30 segundos?
- [ ] A `resposta` diz claramente: pode / não pode / depende?
- [ ] A `resposta` menciona convenção ou CCT quando necessário?
- [ ] O `contexto` explica o "porquê" sem ser um tratado jurídico?
- [ ] A `dica` é acionável agora?
- [ ] As `keywords` são tokens individuais (sem frases)?
- [ ] As `keywords` cobrem como o síndico formularia a pergunta?
- [ ] Não há duplicidade com outra entrada?
- [ ] `npx tsc --noEmit` passa sem erros?
- [ ] Bundle rota `/` permanece abaixo de 230 kB?

---

## 15. Exemplos: entrada boa vs. entrada ruim

### Tema: Multa por barulho

**RUIM:**
```json
{
  "id": "barulho-condominio",
  "resposta": "O síndico pode tomar providências contra moradores que fazem barulho no condomínio conforme a legislação aplicável e as regras do condomínio.",
  "keywords": ["barulho", "condominio", "morador", "problema", "fazer"]
}
```
Problemas: resposta vaga, não orienta ação, keywords genéricas, sem procedimento.

**BOA:**
```json
{
  "id": "multa-barulho",
  "resposta": "Para multar por barulho: 1) Verifique se a infração viola o regimento (horário de silêncio); 2) Registre com data, hora e testemunhas; 3) Notifique por escrito com prazo de defesa; 4) Aplique a multa prevista na convenção.",
  "dica": "Registros com horário preciso e pelo menos uma testemunha fortalecem muito o processo punitivo.",
  "keywords": ["barulho", "ruido", "sossego", "silencio", "perturbacao", "multa", "horario", "vizinho", "reclamacao"]
}
```
Por que é boa: resposta em passos, mensura o que fazer, keywords discriminantes, dica acionável.

---

### Tema: Justa causa

**RUIM:**
```json
{
  "keywords": ["justa causa", "demissao por falta", "abandono emprego"]
}
```
Problemas: frases multi-palavra — o motor tokeniza "justa causa" como dois tokens separados, mas a keyword é armazenada como uma string. O matching não funciona como esperado.

**BOA:**
```json
{
  "keywords": ["justa", "causa", "demissao", "falta", "abandono", "emprego", "desidia", "grave", "celular", "porteiro"]
}
```
Por que é boa: cada token é individual, cobre variações de formulação do síndico.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-13 (Fase 34)*
*Revisar quando o padrão editorial mudar ou quando a KB atingir 500+ entradas.*
