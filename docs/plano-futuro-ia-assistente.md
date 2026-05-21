# Plano Futuro — IA no Assistente do Amigo do Prédio

> **Documento técnico e estratégico interno.**
> Registra quando, como e sob quais limites a IA poderia entrar no Assistente.
> **Nada aqui está implementado.** Este é um mapa de decisão para uso futuro.
>
> Versão: 2026-05-21 — Fase 82
> Documentos anteriores relacionados:
> - `docs/plano-futuro-ia-rag-contextual.md` — princípios gerais (Fase 64)
> - `docs/plano-ia-rag-futuro.md` — arquitetura alvo e gatilhos (Fase 34–36)
> - `docs/plano-tecnico-ia-rag-fase-36.md` — implementação técnica detalhada (Fase 36)

---

## 1. Resumo executivo

O Assistente atual é determinístico: responde com base em uma KB curada de ~316 entradas, sem IA, sem backend, sem custo por pergunta, sem latência de rede e sem envio de dados para terceiros. Isso é uma vantagem, não uma limitação.

A IA pode melhorar o Assistente — mas não é necessária para o core operacional atual.

**O que continua determinístico, independentemente de IA futura:**
- GuidancePanel e alertas de AVCB/seguro/mandato
- Saúde operacional e Score
- Agenda do Prédio e datas monitoradas
- Próximos Passos e Timeline
- Simuladores
- Backup e histórico

**O que a IA poderia melhorar futuramente:**
- Respostas para perguntas que a KB não cobre bem (fallback)
- Composição de temas que cruzam múltiplas categorias
- Naturalidade da linguagem em respostas de baixa confiança

**O que a IA nunca substituirá:**
- A KB curada como fonte de verdade
- A orientação do GuidancePanel
- A análise da administradora, advogado ou profissional técnico

---

## 2. Quando usar IA

A IA poderia entrar apenas em situações específicas, bem delimitadas:

1. **Pergunta fora da KB (fallback alto):** quando o motor determinístico retorna score abaixo do threshold de confiança e não encontra entrada relevante.
2. **Pergunta composta:** quando o usuário mistura 2 ou mais temas que a KB trata separadamente e uma síntese natural seria útil.
3. **Contexto local suficiente e consentido:** quando o usuário autorizou explicitamente o uso de metadados do condomínio para enriquecer a resposta.

**Condição obrigatória em todos os casos:** o motor determinístico sempre executa primeiro. A IA é chamada apenas quando o motor falha em produzir resposta de alta confiança. Nunca o contrário.

**O que nunca aciona a IA:**
- Perguntas com score alto no motor determinístico (≥ threshold + gap de confiança)
- Cálculos numéricos com índices, salários ou valores atuais
- Perguntas sobre legislação específica de estado/município sem fonte na KB
- Qualquer questão que exija parecer jurídico

---

## 3. Quando não usar IA

### Nunca em decisões operacionais críticas

| Situação | Por quê |
|---|---|
| Alertas de AVCB / seguro / mandato | Datas são locais, determinísticas e verificáveis — IA pode errar |
| Cálculo de simuladores (multa, reajuste) | Requer precisão numérica que LLM não garante |
| Saúde operacional / score | Lógica determinística baseada em dados locais — sem margem para alucinação |
| Backup e exportação de dados | Processo de integridade, não de linguagem |
| Timeline e histórico | Reprodução fiel de eventos registrados — sem interpretação |
| Mensagens oficiais sem revisão | Comunicado gerado por IA pode ter erros jurídicos ou de tom |
| Prazos críticos de qualquer natureza | IA não tem acesso a calendário real nem dados externos em tempo real |

### Nunca como identidade do produto

A IA não deve:
- Ser apresentada como o "cérebro" do Amigo do Prédio
- Substituir a KB curada como fonte de verdade
- Prometer segurança jurídica ("você pode fazer X com segurança")
- Funcionar como advogado virtual
- Substituir o GuidancePanel como motor de alertas operacionais
- Tomar decisões autônomas sobre o condomínio

---

## 4. Arquitetura proposta

### Fluxo com IA (futuro)

```
Pergunta do usuário
      │
      ▼
Motor determinístico (lib/data.ts)
      │
      ├── Score alto (≥ threshold + gap) → resposta direta da KB [sem IA]
      │
      ├── Score moderado → retrieval top-3 entradas KB
      │         └──> IA gera resposta ancorada nas entradas
      │              └──> Badge "IA" + "Ver fonte" + disclaimer reforçado
      │
      └── Sem match → fallback contextual [sem IA, como hoje]
```

### Princípios arquiteturais inegociáveis

1. **KB determinística primeiro.** O motor sempre executa. A IA só entra se score insuficiente.
2. **Contexto local sanitizado.** Apenas metadados necessários, nunca texto livre, nomes ou dados pessoais.
3. **Backend obrigatório.** A chave da API nunca é exposta no cliente.
4. **Fallback gracioso.** Se a API de IA falhar ou timeout (> 3s), o produto degrada para o fallback determinístico atual — sem mensagem de erro visível ao usuário.
5. **Resposta com disclaimer.** Toda resposta gerada por IA exibe badge "Gerado com IA" e link para as entradas KB que embasaram a resposta.
6. **Desligamento rápido.** A IA pode ser desativada com uma variável de ambiente, sem alterar o código de produto.

### Arquivos que seriam criados (somente quando implementado)

| Arquivo | Responsabilidade |
|---|---|
| `app/api/ask/route.ts` | API route server-side que chama o LLM com contexto KB |
| `lib/ragContext.ts` | Monta o system prompt com entradas relevantes da KB |
| `.env.local` | `ANTHROPIC_API_KEY` (nunca commitado) |

### Arquivos que seriam modificados (somente quando implementado)

| Arquivo | Mudança necessária |
|---|---|
| `lib/data.ts` | Exportar `findTopK(query, k)` para retrieval |
| `app/page.tsx` | Chamar API route quando motor retorna score moderado |
| `components/Response.tsx` | Renderizar badge "IA", link para fonte, disclaimer reforçado |

### Arquivos que nunca devem ser alterados pela IA

| Arquivo | Motivo |
|---|---|
| `lib/session.ts` | Dados pessoais nunca vão para o LLM |
| `lib/knowledge.json` | KB é read-only para o LLM; editor humano controla o conteúdo |
| `lib/guidance.ts` | GuidancePanel permanece 100% determinístico |
| `lib/health-score.ts` | Score operacional permanece 100% determinístico |

---

## 5. Backend necessário

A IA **exige** um endpoint server-side antes de qualquer implementação. Não há caminho seguro sem backend.

### Requisitos mínimos do backend

| Requisito | Detalhe |
|---|---|
| **Endpoint server-side** | `app/api/ask/route.ts` no Next.js — chama Anthropic via SDK |
| **Chave da API protegida** | `ANTHROPIC_API_KEY` em variável de ambiente server-side; nunca no cliente |
| **Rate limit** | Máx. N perguntas por sessão/dia; fallback determinístico quando limite atingido |
| **Sanitização de input** | Remover dados pessoais antes de enviar à API; aplicar domain gate |
| **Timeout** | Máx. 3s de espera; degradar para fallback determinístico se exceder |
| **Logging mínimo** | Registrar: categoria, score do motor, sucesso/erro — sem texto livre da pergunta |
| **Fallback automático** | Se API falhar por qualquer motivo, produto funciona normalmente sem IA |

### O que o backend não deve fazer

- Armazenar a pergunta bruta do usuário
- Armazenar a resposta gerada
- Passar dados de `lib/session.ts` para a API sem consentimento explícito
- Expor a API key em logs

---

## 6. Guardrails

### O que a IA nunca deve fazer

- Emitir parecer jurídico ("o síndico pode processar o morador")
- Prometer segurança jurídica ("você pode fazer X com certeza")
- Inventar artigo de lei, portaria, decreto ou jurisprudência
- Citar CCT, índice ou valor financeiro que não esteja na KB
- Afirmar regras específicas de estado ou município sem fonte
- Gerar comunicação oficial sem revisão humana
- Usar dados pessoais sem consentimento explícito
- Substituir administradora, advogado, engenheiro ou profissional técnico
- Transformar o Amigo do Prédio em "advogado virtual"

### Proteções técnicas obrigatórias

1. **Contexto ancorado:** o LLM recebe apenas entradas da KB curada, não acesso à internet ou dados externos.
2. **Instrução hard-coded no system prompt:** "Use SOMENTE as entradas fornecidas. Não invente legislação."
3. **Badge obrigatório:** toda resposta de IA exibe "Gerado com IA · Baseado em [entrada KB]".
4. **Botão "Ver fonte":** usuário acessa a entrada original da KB usada como contexto.
5. **Domain gate preservado:** se o motor bloqueia a pergunta por estar fora do escopo, a IA não é chamada.
6. **Disclaimer reforçado:** respostas de IA têm disclaimer mais proeminente que respostas determinísticas.

### Categorias que nunca devem ir para a IA

- Perguntas com valores numéricos atualizados (salário mínimo, INSS, FGTS, índices)
- Questões trabalhistas com valores financeiros específicos
- Consultas sobre processo judicial em andamento
- Qualquer pergunta que exija validação de documentos reais do condomínio

---

## 7. Prompt base futuro

> ⚠️ Este é um modelo para estudo e planejamento. Não está em uso e não deve ser implementado antes dos critérios da seção 12 estarem atendidos.

```
Você é o Assistente do Amigo do Prédio — um copiloto operacional para síndicos.
Seu papel é orientar, não decidir.

REGRAS ABSOLUTAS:
- Responda SOMENTE com base nas entradas KB fornecidas abaixo.
- NÃO invente artigos de lei, portarias ou jurisprudência.
- NÃO cite valores numéricos (salários, índices, percentuais) que não estejam nas entradas.
- Se as entradas não responderem a pergunta, diga claramente que não tem informação suficiente.
- NÃO dê garantia jurídica. Use linguagem de orientação: "em geral", "conforme a convenção", "consulte a administradora".
- NÃO sugira que o condomínio pode tomar decisão jurídica sem assessoria especializada.

TOM:
- Direto e prático, como falaria com um síndico voluntário sem formação jurídica.
- Sem jargão técnico desnecessário.
- Sem falsa segurança.

ENTRADAS DA BASE DE CONHECIMENTO:
[ENTRADA 1 — id: {id}, categoria: {categoria}]
Pergunta: {pergunta}
Resposta: {resposta}
Contexto: {contexto}

[ENTRADA 2 — ...]

[ENTRADA 3 — ...]

PERGUNTA DO USUÁRIO:
{query}
```

### Notas sobre o prompt

- As entradas KB são fornecidas pelo `findTopK()` do motor atual — nunca texto livre do usuário.
- O campo `{query}` recebe a pergunta sanitizada (sem dados pessoais).
- O campo de contexto do condomínio (perfil, datas, agenda) só é incluído com consentimento explícito do usuário.
- O prompt deve ser revisado por alguém com conhecimento jurídico condominial antes de qualquer ativação.

---

## 8. Dados permitidos no contexto da IA

Quando o usuário consentir explicitamente, os seguintes metadados podem enriquecer o contexto enviado à API:

| Dado | Formato permitido | Exemplo |
|---|---|---|
| Status de AVCB | booleano ou estado genérico | "AVCB cadastrado / vencido / não cadastrado" |
| Status de seguro | idem | "Seguro cadastrado / próximo do vencimento" |
| Status de mandato | idem | "Mandato cadastrado / próximo do fim" |
| Categorias de pendências abertas | lista de categorias | ["gestao", "manutencao"] |
| Existência de agenda futura | booleano | true/false |
| Tipo de ocorrência (quando relevante) | tipo genérico | "barulho" |

### O que nunca é enviado

- Textos livres de notas, observações ou ocorrências
- Títulos de eventos da agenda
- Datas exatas de qualquer campo
- Dados identificáveis do condomínio

---

## 9. Dados proibidos

Os dados abaixo nunca são enviados à API de IA, em nenhuma circunstância:

| Dado | Localização no app | Motivo |
|---|---|---|
| Nome do condomínio | `KEYS.PROFILE` | Identificador do prédio |
| Endereço | `KEYS.PROFILE` | Dado localizável |
| Nome do síndico | `KEYS.PROFILE` | Dado pessoal |
| Nome de moradores | ocorrências, notas | Dado pessoal |
| Unidade específica | ocorrências, notas | Dado pessoal |
| Datas exatas de vencimento | `KEYS.MEMORIA` | Dado financeiro identificável |
| Notas livres de ocorrências | `KEYS.OCORRENCIAS` | Conteúdo sensível não estruturado |
| Títulos de eventos da agenda | `KEYS.AGENDA` | Conteúdo livre do usuário |
| Histórico de perguntas | `KEYS.HISTORY` | Padrão de comportamento |
| Textos de comunicados gerados | memória local | Conteúdo jurídico sensível |
| Qualquer texto livre digitado pelo usuário em campos abertos | múltiplos campos | PII e dados sensíveis |

---

## 10. Logs e privacidade

### O que registrar (apenas estrutural, sem PII)

| Campo de log | Tipo | Exemplo |
|---|---|---|
| `rag_triggered` | booleano | true |
| `motor_score_range` | faixa | "moderado (8–13)" |
| `categoria_detectada` | string | "manutencao" |
| `num_entradas_usadas` | número | 3 |
| `latencia_ms` | número | 1240 |
| `api_sucesso` | booleano | true |
| `fallback_determinístico` | booleano | false |
| `disclaimer_exibido` | booleano | true |

### O que nunca registrar

- Texto da pergunta do usuário
- Texto da resposta gerada
- Dados do perfil ou memória operacional
- Identificadores de usuário além do `session_id` anônimo já existente

### Política de retenção futura

- Logs de IA: reter por no máximo 30 dias para diagnóstico de qualidade
- Nenhum log de IA deve ser exportado ou cruzado com dados do condomínio
- A política deve ser revisada e documentada antes de qualquer ativação

---

## 11. Estimativa de custo

> Os valores abaixo são hipotéticos e usam custo aproximado de um modelo eficiente (ex: Claude Haiku ou equivalente). O custo real depende do provedor, modelo, época e taxa de cache.

### Fórmula

```
custo mensal estimado = perguntas com IA por mês × custo médio por pergunta
```

Custo médio estimado por pergunta com RAG: **~0,001 USD** (~700 tokens de input + ~200 tokens de output).

### Tabela hipotética

| Perguntas com IA/mês | Custo estimado/mês | Contexto |
|---|---|---|
| 100 | ~0,10 USD | Uso interno (fundador + testes) |
| 1.000 | ~1,00 USD | Beta com ~50 síndicos ativos |
| 10.000 | ~10,00 USD | ~500 síndicos com 20 perguntas/mês |
| 50.000 | ~50,00 USD | Escala inicial de produto comercial |

### Observações

- Nem toda pergunta aciona a IA — apenas as com score moderado no motor determinístico.
- Se o motor tiver recall ≥ 80%, a maioria das perguntas é respondida sem custo de IA.
- Cache de respostas frequentes pode reduzir o custo em até 40%.
- O custo cresce linearmente: previsível e controlável com rate limit por sessão.
- O custo de IA deve estar coberto pelo modelo de monetização antes de qualquer ativação.

---

## 12. Critérios antes de implementar

**Todos os itens abaixo devem estar atendidos antes de qualquer linha de código de IA ser escrita:**

### Produto e demanda real

- [ ] Telemetria ativa e validada (Supabase ou equivalente com dados reais)
- [ ] Taxa de fallback real > 30% das consultas (usuários chegando a perguntas fora da KB)
- [ ] Evidência de usuários reais frustrados com respostas insuficientes (não apenas projetado)
- [ ] KB com ≥ 400 entradas curadas e validadas
- [ ] Recall A ≥ 80% confirmado em auditoria ao vivo (não apenas offline)
- [ ] Retenção D3 ≥ 25% (usuários retornam por conta própria)

### Técnico

- [ ] Backend mínimo seguro com API route server-side
- [ ] Chave da API nunca exposta no cliente
- [ ] Rate limit implementado e testado
- [ ] Timeout e fallback determinístico testados
- [ ] `findTopK()` exportada e validada em ambiente de teste
- [ ] Domain gate preservado (bloqueia fora-do-escopo antes de chamar IA)
- [ ] Plano de rollback documentado (desativar IA sem alterar código de produto)

### Privacidade e jurídico

- [ ] Termos de uso publicados e revisados
- [ ] Política de privacidade atualizada para mencionar envio de perguntas à API de IA
- [ ] Consentimento explícito do usuário antes da primeira chamada de IA
- [ ] Disclaimers jurídicos revisados para respostas geradas por IA
- [ ] Revisão por advogado ou consultor condominial do prompt base e dos guardrails

### Negócio

- [ ] Modelo de monetização definido (IA tem custo recorrente)
- [ ] Limite de custo mensal estabelecido
- [ ] Mecanismo de desligamento rápido se custo ou risco ultrapassar limites

---

## 13. Estratégia de rollout

### Etapa 0 — Pré-IA (hoje)
- Assistente determinístico com contexto local (Fase 81)
- Fallback mais honesto com sugestões discretas
- KB curada, sem IA, sem backend

### Etapa 1 — Retrieval sem LLM (próxima melhoria possível)
- Quando score moderado, exibir "Orientações relacionadas" (top-3 entradas KB)
- Custo: zero. Sem IA. Sem backend. Mede se usuário prefere sugestões a reformular.
- Implementável sem os critérios completos da seção 12.

### Etapa 2 — IA experimental (interna)
- Apenas fundador testando internamente
- Feature flag desligada em produção
- Validar qualidade, custo, latência e guardrails
- Nenhum usuário externo exposto

### Etapa 3 — Beta fechado com IA (futuro distante)
- Grupo pequeno de síndicos (≥ 10, opt-in explícito)
- Consentimento documentado
- Monitoramento diário de qualidade e custo
- Desligamento imediato se alucinação jurídica for detectada

### Etapa 4 — Rollout gradual (muito futuro)
- Expansão controlada com métricas de qualidade
- Limite de perguntas com IA por conta/sessão
- Feedback explícito por resposta de IA
- Revisão humana periódica de amostras

---

## 14. Riscos

| Risco | Severidade | Probabilidade | Mitigação |
|---|---|---|---|
| **Alucinação jurídica** | Alta | Alta sem guardrails | System prompt restritivo + KB como única fonte + badge "IA" |
| **API key exposta no cliente** | Alta | Alta sem backend | Backend obrigatório; nunca chamar Anthropic do browser |
| **Vazamento de dados pessoais** | Alta | Média | Nunca enviar `lib/session.ts` para a API; sanitização obrigatória |
| **Risco OAB** | Alta | Média | Jamais prometer parecer ou "você pode fazer X com certeza" |
| **Custo imprevisível** | Média | Baixa com rate limit | Limite por sessão + fallback determinístico |
| **Usuário confiar demais na IA** | Média | Alta | Disclaimer proeminente em toda resposta de IA |
| **Latência degradando UX** | Média | Média | Timeout 3s; loading state explícito |
| **Resposta irrelevante** | Baixa | Baixa com RAG | Fallback determinístico se score RAG baixo |
| **Suporte maior** | Média | Alta | Usuários com respostas de IA erradas reclamarão mais |
| **LGPD — dados de terceiros** | Alta | Baixa | Perguntas nunca incluem dados de moradores sem consentimento |

### Risco jurídico específico

O maior risco do produto ao adicionar IA é que o usuário passe a tratar as respostas como parecer jurídico. Isso pode gerar:
- Decisões equivocadas com base em alucinação
- Responsabilidade civil do produto por orientação incorreta
- Conflito com o Estatuto da OAB (exercício da advocacia sem registro)

A barreira de segurança é: **linguagem de orientação administrativa, nunca de decisão jurídica**. O disclaimer deve ser mais proeminente em respostas de IA do que em respostas determinísticas.

---

## 15. Decisão atual

**A IA não será implementada nesta fase.**

### Razões

1. **Demanda não comprovada:** sem usuários reais, sem telemetria ativa, não há evidência de que as perguntas fora da KB são o principal bloqueador de valor.
2. **Backend inexistente:** implementar IA sem backend seguro exporia a API key no cliente — inaceitável.
3. **Custo sem cobertura:** sem modelo de monetização definido, o custo do LLM não tem origem.
4. **Privacidade não resolvida:** sem política de privacidade publicada, não há base legal para enviar perguntas a terceiros.
5. **KB ainda em maturação:** o motor determinístico cobre bem o escopo atual; a lacuna real de resposta não foi medida ao vivo.

### O que continuar fazendo

- Aprimorar a KB curada com novas entradas de qualidade
- Melhorar o contexto determinístico local (como feito na Fase 81)
- Ativar telemetria (Supabase) para medir o fallback real em produção
- Acompanhar a taxa de fallback quando houver usuários reais

### O que reavaliar

Reavaliar a implementação de IA apenas quando:
- Telemetria ativa mostrar taxa de fallback real > 30%
- Houver ≥ 10 usuários reais ativos com reclamações de respostas insuficientes
- Backend seguro, política de privacidade e revisão jurídica estiverem prontos

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-21 — Fase 82*
*Revisar quando os critérios da seção 12 forem atingidos.*
