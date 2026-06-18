# IA no Assistente — Amigo do Prédio (fonte única)

> **Fonte canônica de objetivos: Notion.** Este documento é execução.
> **Nada aqui está implementado.** É o mapa de decisão único sobre IA no Assistente.
>
> **Consolida e substitui** (todos marcados SUPERSEDED):
> - `plano-futuro-ia-assistente.md` (Fase 82) — estratégia e guardrails
> - `plano-tecnico-ia-rag-fase-36.md` (Fase 36) — arquitetura de código
> - `plano-ia-rag-futuro.md` (Fase 34) — arquitetura alvo e gatilhos
> - `plano-futuro-ia-rag-contextual.md` (Fase 64) — princípios gerais
> - `preparacao-kb-para-rag.md` (Fase 34) — evolução do schema da KB
>
> Versão: 2026-06-14 — realinhado à direção SaaS multi-tenant.

---

## 0. O que mudou com a nova direção (junho/2026)

A doutrina anterior tratava backend/login como **proibidos**, o que tornava a IA
inviável por falta de lugar seguro para a API key. Com a decisão de avançar para **SaaS
multi-tenant**, o backend (Supabase + API routes Next.js) passa a ser **direção oficial**
e já existe parcialmente (auth via magic link, sync de snapshots, migration 005). Isso
**remove o bloqueador técnico** que adiava a IA.

O que **não** mudou:
- A IA continua sendo **camada posterior** ao motor determinístico, nunca substituta.
- A IA permanece **hipótese futura** até os critérios da seção 11 serem atendidos.
- A IA não autoriza exposição externa: vale a **Regra de Não-Exposição** do
  `roadmap-pre-lancamento.md`. IA experimental roda **interna** até o produto ser
  julgado completo conforme a **Definição de Pronto**.

> ⚠️ **Tensão registrada (não maquiada):** os documentos antigos exigiam "beta com ≥ 10
> síndicos reais" como gatilho de IA. Isso colide com a Regra de Não-Exposição. A
> reconciliação: o sinal de demanda real vem primeiro do **uso recorrente do próprio
> fundador + telemetria**, e só depois de exposição controlada — que só ocorre após a
> Definição de Pronto. O gatilho "10 síndicos" fica suspenso até lá.

---

## 1. Resumo executivo

O Assistente atual é determinístico: responde com base numa KB curada (~398 entradas),
sem IA, sem custo por pergunta, sem latência de rede, sem enviar dados a terceiros. Isso
é uma vantagem, não uma limitação.

**Continua determinístico, independentemente de IA futura:** GuidancePanel e alertas
(AVCB/seguro/mandato), saúde operacional, agenda e datas monitoradas, próximos passos,
timeline, simuladores, backup e histórico.

**A IA poderia melhorar:** respostas para perguntas que a KB não cobre bem (fallback);
composição de temas que cruzam categorias; naturalidade em respostas de baixa confiança.

**A IA nunca substituirá:** a KB curada como fonte de verdade; a orientação do
GuidancePanel; a análise de administradora, advogado ou profissional técnico.

---

## 2. Quando usar IA (e quando não)

**Pode entrar apenas quando:**
1. **Pergunta fora da KB (fallback alto):** motor retorna score abaixo do threshold.
2. **Pergunta composta:** usuário mistura 2+ temas que a KB trata separadamente.
3. **Contexto local consentido:** usuário autorizou uso de metadados do condomínio.

**Condição obrigatória:** o motor determinístico **sempre executa primeiro**. A IA só é
chamada quando o motor falha em produzir resposta de alta confiança. Nunca o contrário.

**Nunca aciona a IA:** score alto no motor (≥ threshold + gap); cálculos numéricos com
índices/salários/valores; legislação específica de estado/município sem fonte na KB;
qualquer questão que exija parecer jurídico.

**Nunca em decisões operacionais críticas:** alertas AVCB/seguro/mandato; simuladores;
saúde/score; backup; timeline; comunicado oficial sem revisão; prazos críticos. Esses
são determinísticos e verificáveis — IA pode errar.

**Nunca como identidade do produto:** a IA não é o "cérebro" do AdP, não substitui a KB,
não promete segurança jurídica, não é advogado virtual, não decide pelo condomínio.

---

## 3. Arquitetura proposta (RAG sobre KB curada)

```
Pergunta do usuário
      │
      ▼
Motor determinístico (lib/data.ts)
      │
      ├── Score alto (≥ 14 + gap ≥ 4) → resposta direta da KB [sem IA]
      │
      ├── Score moderado (8–13) → retrieval top-3 entradas KB
      │         └──> LLM gera resposta ancorada nas entradas
      │              └──> Badge "IA" + "Ver fonte" + disclaimer reforçado
      │
      └── Sem match → fallback contextual [sem IA, como hoje]
```

**Por que RAG, não LLM puro:** RAG combina a confiabilidade da base curada (não alucina
legislação, auditável) com a naturalidade do LLM. LLM puro alucina e não é auditável.

**Princípios inegociáveis:**
1. KB determinística primeiro — a IA só entra se score insuficiente.
2. Contexto local sanitizado — só metadados necessários, nunca texto livre, nomes ou PII.
3. Backend obrigatório — a API key nunca é exposta no cliente (hoje viável via API route).
4. Fallback gracioso — se a API falhar/timeout (> 3s), degrada para o fallback atual sem erro visível.
5. Resposta com disclaimer — badge "Gerado com IA" + link para as entradas KB usadas.
6. Desligamento rápido — IA desativável por variável de ambiente, sem alterar código de produto.

**Pseudocódigo do fluxo futuro:**
```typescript
if (result.score >= MIN_CLEAR_WIN_SCORE && gap >= MIN_CONFIDENCE_GAP) {
  return result; // determinístico, sem LLM
}
if (result.score >= 8) {
  const topK = findTopK(query, 3);
  try {
    const llmResponse = await callLLM(query, topK, { timeout: 3000 });
    return { ...llmResponse, source: "rag", entries: topK };
  } catch {
    return buildContextualFallback(result); // degradação graciosa
  }
}
return buildContextualFallback(result); // fallback atual
```

**Arquivos a criar (quando implementado):** `app/api/ask/route.ts` (API route que chama o
LLM com contexto KB), `lib/ragContext.ts` (monta o system prompt), `.env.local`
(`ANTHROPIC_API_KEY`, nunca commitado).

**Arquivos a modificar:** `lib/data.ts` (exportar `findTopK(query, k)` + branch para score
8–13), `app/page.tsx` (chamar API route no score moderado), `components/Response.tsx`
(badge "IA", link para fonte, disclaimer reforçado).

**Arquivos que a IA nunca altera:** `lib/session.ts` (PII nunca vai ao LLM),
`lib/knowledge.json` (KB read-only para o LLM), `lib/guidance.ts` e `lib/health-score.ts`
(permanecem 100% determinísticos).

---

## 4. Backend necessário

A IA **exige** endpoint server-side. Requisitos mínimos:

| Requisito | Detalhe |
|---|---|
| Endpoint server-side | `app/api/ask/route.ts` — chama Anthropic via SDK |
| API key protegida | `ANTHROPIC_API_KEY` server-side; nunca no cliente |
| Rate limit | Máx. N perguntas por sessão/dia; fallback quando atingido |
| Sanitização | Remover PII antes de enviar; aplicar domain gate |
| Timeout | Máx. 3s; degrada para fallback determinístico |
| Logging mínimo | Categoria, score, sucesso/erro — sem texto livre |
| Fallback automático | Se a API falhar, o produto funciona sem IA |

**O backend não deve:** armazenar a pergunta bruta, armazenar a resposta gerada, passar
dados de `lib/session.ts` sem consentimento, expor a API key em logs.

> Nota multi-tenant: com a fundação SaaS, o rate limit e os logs podem usar a identidade
> autenticada (`memberships`) em vez de só `session_id` anônimo. Mantém-se a regra de não
> registrar texto livre.

---

## 5. Guardrails

**A IA nunca deve:** emitir parecer jurídico; prometer segurança jurídica; inventar
artigo de lei/portaria/jurisprudência; citar CCT/índice/valor fora da KB; afirmar regras
estaduais/municipais sem fonte; gerar comunicação oficial sem revisão; usar PII sem
consentimento; substituir advogado/engenheiro/contador; virar "advogado virtual".

**Proteções técnicas obrigatórias:** contexto ancorado só na KB curada; instrução
hard-coded ("use SOMENTE as entradas fornecidas; não invente legislação"); badge
obrigatório "Gerado com IA · Baseado em [entrada KB]"; botão "Ver fonte"; domain gate
preservado (se o motor bloqueia, a IA não é chamada); disclaimer mais proeminente que em
respostas determinísticas.

**Categorias que nunca vão à IA:** valores numéricos atualizados (salário mínimo, INSS,
FGTS, índices); questões trabalhistas com valores específicos; processo judicial em
andamento; validação de documentos reais do condomínio.

### Risco jurídico específico (OAB)
O maior risco é o usuário tratar respostas como parecer jurídico — gerando decisões
equivocadas, responsabilidade civil e conflito com o Estatuto da OAB. A barreira:
**linguagem de orientação administrativa, nunca de decisão jurídica.**

---

## 6. Prompt base (modelo para estudo — não usar antes da seção 11)

```
Você é o Assistente do Amigo do Prédio — um copiloto operacional para síndicos.
Seu papel é orientar, não decidir.

REGRAS ABSOLUTAS:
- Responda SOMENTE com base nas entradas KB fornecidas abaixo.
- NÃO invente artigos de lei, portarias ou jurisprudência.
- NÃO cite valores numéricos (salários, índices, percentuais) fora das entradas.
- Se as entradas não responderem, diga claramente que não tem informação suficiente.
- NÃO dê garantia jurídica. Use "em geral", "conforme a convenção", "consulte a administradora".
- NÃO sugira decisão jurídica sem assessoria especializada.

TOM: direto e prático, como com um síndico voluntário sem formação jurídica; sem jargão; sem falsa segurança.

ENTRADAS DA BASE DE CONHECIMENTO:
[ENTRADA 1 — id: {id}, categoria: {categoria}] Pergunta/Resposta/Contexto
[ENTRADA 2 — ...]  [ENTRADA 3 — ...]

PERGUNTA DO USUÁRIO: {query}
```

Notas: as entradas vêm do `findTopK()` (nunca texto livre); `{query}` é sanitizada; o
contexto do condomínio só entra com consentimento explícito; o prompt deve ser revisado
por alguém com conhecimento jurídico condominial antes de qualquer ativação.

**Modelo recomendado:** um modelo eficiente da família Claude (ex.: Haiku) — baixo custo,
latência aceitável, suporta KB longa como contexto.

---

## 7. Dados permitidos e proibidos no contexto da IA

**Permitidos (só com consentimento explícito) — metadados, nunca texto livre:** status de
AVCB/seguro/mandato (genérico: cadastrado/vencido/próximo); categorias de pendências
abertas; existência de agenda futura (booleano); tipo genérico de ocorrência (ex.:
"barulho").

**Nunca enviados, em nenhuma circunstância:** nome do condomínio, endereço, nome do
síndico/moradores, unidade específica, datas exatas de vencimento, notas livres de
ocorrências, títulos de eventos da agenda, histórico de perguntas, textos de comunicados
gerados, qualquer texto livre digitado em campos abertos.

**Consentimento:** antes da primeira consulta com IA, modal claro ("Nenhum dado pessoal
do seu condomínio será enviado. Apenas a sua pergunta é compartilhada com o provedor de
IA"). Preferência salva localmente.

---

## 8. Logs e privacidade

**Registrar (apenas estrutural, sem PII):** `rag_triggered`, faixa de score do motor,
categoria detectada, nº de entradas usadas, latência, sucesso da API, se houve fallback,
se o disclaimer foi exibido.

**Nunca registrar:** texto da pergunta, texto da resposta, dados de perfil/memória,
identificadores além do `session_id`/membership já existentes.

**Retenção:** logs de IA por no máx. 30 dias para diagnóstico; nunca exportados nem
cruzados com dados do condomínio; política revisada antes de qualquer ativação.

---

## 9. Estimativa de custo

Custo médio por pergunta com RAG: **~0,001 USD** (~700 tokens round-trip, modelo
eficiente). Hipotético:

| Perguntas com IA/mês | Custo estimado/mês | Contexto |
|---|---|---|
| 100 | ~0,10 USD | Uso interno (fundador + testes) |
| 1.000 | ~1,00 USD | ~50 condomínios ativos |
| 10.000 | ~10,00 USD | ~500 condomínios com 20 perguntas/mês |
| 50.000 | ~50,00 USD | Escala inicial comercial |

Nem toda pergunta aciona a IA — só as de score moderado. Com recall ≥ 80%, a maioria é
respondida sem custo. Cache pode reduzir até 40%. O custo deve estar coberto pela
monetização antes de qualquer ativação.

---

## 10. Evolução do schema da KB para RAG

A KB é um array JSON em `lib/knowledge.json`. Limitação central: sem semântica
("cobrar vizinho por dano" e "cobrar inadimplente" parecem iguais para o motor).

**Campos atuais já úteis para RAG:** `id` (referência estável da fonte), `categoria`
(filtro), `pergunta` (embedding de query), `resposta` (conteúdo), `contexto`
(base legal/nuances), `dica` ("próximo passo").

**Campos ausentes a considerar (não implementar agora):** `fonte`/`baseLegal`
(estruturado), `risco`, `atualizadoEm`, `tipoResposta`, `exigeAssembleia`,
`exigeProfissional`, `confiancaEditorial`, `relatedIds`, `tags`.

**Regras de `id` estável:** uma vez em uso, não renomear sem migração; entrada substituída
mantém o id antigo com `deprecated: true`; ids descritivos e permanentes.

**Quando migrar o schema:** somente quando o RAG estiver sendo implementado, com estrutura
validada, script de migração que não quebre o motor determinístico e build verde.
**Não migrar "para se preparar".** O trabalho editorial atual (manter referências legais
legíveis no `contexto`, categorias consistentes) já é suficiente para compatibilidade
futura.

**Convenção/regimento do condomínio (futuro):** quando houver upload da convenção, o RAG
deve diferenciar resposta genérica da KB vs. específica da convenção, priorizar a
convenção quando houver dado específico, e sinalizar lacunas. Por isso a KB deve sempre
usar linguagem genérica ("conforme a convenção"), nunca assumir valor/regra específicos.

---

## 11. Critérios antes de implementar

**Todos devem estar atendidos antes de qualquer linha de código de IA:**

**Produto e demanda real:**
- [ ] Telemetria ativa e validada (dados reais).
- [ ] Taxa de fallback real > 30% das consultas.
- [ ] Evidência de frustração real com respostas insuficientes (não projetada).
- [ ] KB com ≥ 400 entradas curadas e validadas. *(hoje: 398)*
- [ ] Recall A ≥ 80% confirmado em auditoria ao vivo.
- [ ] Retenção D3 ≥ 25% (retorno espontâneo).

**Técnico:**
- [ ] API route server-side segura; API key nunca no cliente.
- [ ] Rate limit implementado e testado.
- [ ] Timeout e fallback determinístico testados.
- [ ] `findTopK()` exportada e validada.
- [ ] Domain gate preservado; plano de rollback documentado.

**Privacidade e jurídico:**
- [ ] Termos de uso publicados e revisados.
- [ ] Política de privacidade menciona envio de perguntas à API de IA.
- [ ] Consentimento explícito antes da primeira chamada.
- [ ] Disclaimers e prompt base revisados por advogado/consultor condominial.

**Negócio:**
- [ ] Modelo de monetização definido (IA tem custo recorrente).
- [ ] Limite de custo mensal e mecanismo de desligamento rápido.

---

## 12. Estratégia de rollout

- **Etapa 0 — Pré-IA (hoje):** Assistente determinístico + contexto local + fallback honesto. Sem IA.
- **Etapa 1 — Retrieval sem LLM:** no score moderado (8–13), exibir "Orientações relacionadas" (top-3 KB). Custo zero, sem IA, sem backend. Mede se o usuário prefere sugestões a reformular. **Implementável sem os critérios completos da seção 11.**
- **Etapa 2 — IA experimental (interna):** só o fundador testando; flag desligada em produção; valida qualidade, custo, latência, guardrails. Nenhum usuário externo (respeita a Regra de Não-Exposição).
- **Etapa 3 — IA com exposição controlada (só após a Definição de Pronto):** grupo pequeno opt-in, consentimento documentado, monitoramento diário, desligamento imediato se houver alucinação jurídica.
- **Etapa 4 — Rollout gradual:** expansão com métricas de qualidade, limite por conta, feedback por resposta, revisão humana de amostras.

---

## 13. Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Alucinação jurídica | Alta | System prompt restritivo + KB como única fonte + badge "IA" |
| API key exposta no cliente | Alta | Backend obrigatório; nunca chamar a API do browser |
| Vazamento de PII | Alta | Nunca enviar `lib/session.ts`; sanitização obrigatória |
| Risco OAB | Alta | Jamais prometer parecer ou "você pode fazer X com certeza" |
| Custo imprevisível | Média | Rate limit por sessão + fallback determinístico |
| Excesso de confiança na IA | Média | Disclaimer proeminente em toda resposta de IA |
| Latência degradando UX | Média | Timeout 3s; loading state explícito |
| Suporte maior | Média | Respostas erradas geram mais reclamação — monitorar |

---

## 14. Métricas de qualidade após IA

Eventos a adicionar: `rag_used`, `rag_source_viewed`, `rag_fallback_triggered`,
`rag_score_range`, `rag_disclaimer_visible`. Critérios mínimos para manter a IA ativa:
fallback do RAG < 20%; `rag_source_viewed` > 5%; zero report de "inventou lei".

---

## 15. Decisão atual

**A IA não será implementada nesta fase.** O bloqueador técnico (backend) está sendo
resolvido pela direção SaaS, mas os demais critérios (demanda real medida, KB ≥ 400
validada, jurídico, monetização) ainda não estão atendidos, e a Regra de Não-Exposição
mantém qualquer teste **interno**.

**Continuar fazendo:** aprimorar a KB curada; melhorar o contexto determinístico local;
ativar telemetria para medir fallback real; acompanhar a taxa de fallback no uso próprio.

**Próximo passo de menor risco:** Etapa 1 (retrieval sem LLM) — melhora o fallback sem
custo, sem IA e sem depender dos critérios completos.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-06-14 — consolida 5 documentos de IA/RAG. Fonte canônica: Notion.*
*Revisar quando os critérios da seção 11 forem atingidos.*
