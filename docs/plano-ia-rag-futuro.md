# Plano de IA/RAG — Amigo do Prédio

> **Documento estratégico interno.**
> Descreve o caminho de evolução do motor de respostas em direção a IA com retrieval,
> preservando as garantias de qualidade e confiança do produto.

---

## Estado atual (motor determinístico)

O motor atual combina:
- ~170 mapeamentos de sinônimos
- 307+ entradas em 16 categorias
- Domain gate, confidence gap, fallback contextual
- Resposta em < 50ms, zero dependências externas, funciona offline

**O motor determinístico permanece como base.** IA é uma camada sobre ele, não substituta.

---

## Arquitetura alvo: RAG sobre base curada

```
Pergunta do usuário
      │
      ▼
Motor determinístico
      │
      ├── Score alto (≥ 14 + gap ≥ 4) → resposta direta [atual]
      │
      ├── Score moderado (8–13) → RAG: recupera top-3 entradas
      │         └──> LLM gera resposta natural usando as entradas como contexto
      │
      └── Sem match → fallback contextual [atual]
```

### Por que RAG, não LLM puro

| Característica | LLM puro | RAG | Determinístico |
|---|---|---|---|
| Alucina legislação | sim | raramente | nunca |
| Auditável | não | parcialmente | sim |
| Custo por query | alto | médio | zero |
| Latência | 1–3s | 1–2s | < 50ms |
| Funciona offline | não | não | sim |
| Privacidade | envia para API | envia para API | local |

RAG combina a confiabilidade da base curada com a naturalidade do LLM.

---

## Gatilhos para implementar

Implementar RAG **somente quando todos** os itens estiverem satisfeitos:

### Produto
- [ ] Motor determinístico: recall ≥ 80% nas 84 perguntas de auditoria
- [ ] Base de conhecimento: ≥ 500 entradas curadas e validadas
- [ ] Telemetria mostra: fallback > 30% das consultas reais (usuários reais frustrados)
- [ ] Retenção D3 ≥ 30% (usuários voltam por conta própria)
- [ ] Beta com ≥ 10 usuários reais ativos

### Técnico
- [ ] Backend com autenticação (para proteger API key do LLM)
- [ ] Rate limiting por usuário
- [ ] Fallback para motor determinístico quando LLM falha ou timeout
- [ ] Cache de respostas (reduz custo para perguntas repetidas)

### Negócio
- [ ] Modelo de monetização definido (LLM tem custo recorrente)
- [ ] Política de privacidade publicada (informa que perguntas são enviadas a terceiros)
- [ ] Disclaimers jurídicos validados para respostas geradas por IA

---

## Implementação em 3 etapas

### Etapa 1 — Hybrid retrieval (sem LLM)
Quando motor retorna score moderado (8–13), em vez de fallback imediato:
- Recuperar top-3 entradas mais relevantes
- Exibir como "Orientações relacionadas" em cards
- Mede: usuário clica nas sugestões em vez de reformular?

Custo: zero. Benefício: melhor fallback sem LLM.

### Etapa 2 — LLM para sintetizar respostas moderadas
Quando top-3 entradas são recuperadas (Etapa 1 implementada):
- Enviar pergunta + top-3 entradas como contexto para LLM
- LLM gera resposta natural, mas ancorada na base curada
- Mostrar badge "Gerado com IA a partir da base legal"
- Botão "Ver fonte" abre as entradas originais

API: Claude Haiku (mais barato, latência aceitável para síndico paciente)

### Etapa 3 — LLM para perguntas compostas
Perguntas que cruzam 3+ categorias, ou envolvem raciocínio sequencial.
Motor ainda tenta score. Se não atingir threshold mesmo alto (≥ 20):
- LLM com contexto completo do condomínio (perfil + memória)
- Resposta personalizada: "No seu caso, com funcionários CLT e sem piscina..."
- Requer consentimento explícito do usuário sobre envio de dados

---

## Modelo de LLM recomendado

**Claude Haiku 4.5** como primeira escolha:
- Mais barato da família Claude
- Latência aceitável (< 1s para consultas simples)
- Suporta contexto longo (base de conhecimento como system prompt)
- API Anthropic tem política clara de dados

Sistema de estimativa de custo:
- Custo médio por query RAG: ~0.001 USD (input ~500 tokens + output ~200 tokens)
- 1.000 queries/mês = ~1 USD
- 10.000 queries/mês = ~10 USD
- Sustentável com qualquer plano de monetização razoável

---

## O que nunca fazer

- **Nunca enviar dados pessoais do condomínio para LLM sem consentimento.** Perfil, datas de vencimento, nomes de funcionários — não vão para a API.
- **Nunca substituir o motor determinístico completamente.** Ele continua como camada de validação.
- **Nunca usar LLM para perguntas sobre valores numéricos atuais** (salário mínimo, índices de correção) — o LLM não tem dados em tempo real.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-13 (atualizado na Fase 34)*
*Revisar quando os gatilhos de produto forem atingidos.*

---

## Adendos da Fase 34

A Fase 34 criou dois documentos estruturais que preparam a KB para RAG sem implementar nada:

- `docs/preparacao-kb-para-rag.md` — como o schema atual deve evoluir, campos futuros, roteiro de migração
- `docs/guia-qualidade-editorial-kb.md` — padrões editoriais para manter a KB de alta qualidade como fonte de verdade

**Status atual dos gatilhos de produto:**
- Motor determinístico: recall A = 100% ✓ (meta ≥ 80% atingida)
- Base de conhecimento: 316 entradas (meta ≥ 500 — ~60% do caminho)
- Telemetria real: pendente (sem usuários ainda)
- Retenção D3: pendente
- Beta: pendente

**Próximo passo antes da Etapa 1 (retrieval sem LLM):**
Alcançar 400+ entradas de qualidade comprovada. A partir daí, implementar "orientações relacionadas" quando o motor retorna score moderado (8–13).

## Adendos da Fase 36

A Fase 36 criou o plano técnico detalhado de implementação:

- `docs/plano-tecnico-ia-rag-fase-36.md` — arquitetura de código, arquivos afetados, riscos, critérios de início da Fase IA Experimental

**Status atual dos gatilhos de produto (Fase 36):**
- Motor determinístico: recall A = 100% ✓ (meta ≥ 80% atingida)
- Base de conhecimento: 316 entradas (meta ≥ 400 — ~79% do caminho)
- Telemetria real: pendente (sem usuários ainda)
- Retenção D3: pendente
- Beta: pendente — prevista futuramente, ~1 semana antes do lançamento
