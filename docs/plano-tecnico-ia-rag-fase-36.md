# Plano Técnico IA/RAG — Fase 36

> **Documento de preparação técnica.**
> A Fase 36 não implementa IA. Este documento registra as decisões arquiteturais e o estado atual
> para que a próxima fase de IA/RAG possa começar com clareza e sem surpresas.

---

## 1. Estado atual da KB (pós-Fase 36)

| Métrica | Valor |
|---------|-------|
| Total de entradas | 316 |
| Categorias | 16 |
| Recall A (resposta direta) | 100% (33/33 perguntas diretas) |
| Bloqueio C (fora de escopo) | 100% (4/4 perguntas bloqueadas) |
| AUDIT_CASES cobertos | 83 perguntas |
| Recall geral projetado | ~87% (verificar ao vivo em /admin) |
| Meta pré-RAG | ≥ 400 entradas de alta qualidade |
| Guia editorial | docs/guia-qualidade-editorial-kb.md |
| Preparação schema | docs/preparacao-kb-para-rag.md |

**A KB está bem organizada, mas ainda abaixo do volume mínimo para RAG.** O foco editorial antes de implementar IA deve ser chegar a 400+ entradas de alta qualidade.

---

## 2. Estado atual do motor determinístico

O motor em `lib/data.ts` executa as seguintes etapas:

```
Pergunta do usuário
  ↓
normalize() — remove acentos, lowercase, tokeniza
  ↓
expandWithSynonyms() — ~170 mapeamentos manuais
  ↓  
domainGate() — rejeita se nenhum token é DOMAIN_ANCHOR_WORD
  ↓
score() — pontuação por overlap de tokens vs. keywords de cada entrada KB
  ↓
confidenceGap() — MIN_CLEAR_WIN_SCORE=14, MIN_CONFIDENCE_GAP=4
  ↓
findAnswer() — 4 branches: resposta direta | score moderado | sem match | bloqueado
  ↓
Resposta + fallback contextual (16 categorias) se sem match
```

**Latência:** < 50ms  
**Dependências externas:** zero  
**Funciona offline:** sim  
**Privacidade:** nenhum dado sai do dispositivo

---

## 3. Onde a IA entraria no fluxo

A arquitetura alvo (documentada em `docs/plano-ia-rag-futuro.md`) prevê três inserções:

### Inserção 1: score moderado (8–13) → RAG
```
findAnswer() retorna score 8–13
  ↓
Não tem confiança para resposta direta
  ↓  (atual: fallback contextual)
  ↓  (futuro: retrieval das top-3 entradas mais relevantes)
  ↓
LLM recebe: pergunta + top-3 entradas como contexto
  ↓
LLM gera resposta natural ancorada na KB
  ↓
Badge "IA" + "baseado em: [id da entrada]"
```

### Inserção 2: perguntas compostas (score < 8 mas multi-categoria)
```
Motor não identifica tema único
  ↓  (atual: fallback genérico)
  ↓  (futuro: cross-category retrieval)
  ↓
LLM com contexto do condomínio (perfil + memória)
  ↓
Resposta personalizada com consentimento explícito
```

### Inserção 3: nunca substituir score alto (≥ 14 + gap ≥ 4)
```
findAnswer() retorna score ≥ 14 com gap ≥ 4
  ↓
SEMPRE resposta direta da KB (sem LLM)
  ↓
Mais confiável, mais barato, mais rápido
```

---

## 4. Arquivos afetados futuramente

### Modificação obrigatória

| Arquivo | Mudança futura |
|---------|----------------|
| `lib/data.ts` | Exportar `findTopK(query, k)` para retrieval RAG |
| `lib/data.ts` | Novo branch em `findAnswer()` para score 8–13 com retrieval |
| `app/page.tsx` | Chamar endpoint RAG quando motor retorna score moderado |
| `components/Response.tsx` | Renderizar badge "IA", link para fonte, indicador de geração |

### Criação obrigatória (quando IA for implementada)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `app/api/ask/route.ts` | API route que chama Claude Haiku com contexto KB |
| `lib/ragContext.ts` | Monta o system prompt com entradas KB relevantes |
| `.env.local` | `ANTHROPIC_API_KEY` (não commitar) |

### Não deve ser modificado pela IA

| Arquivo | Motivo |
|---------|--------|
| `lib/session.ts` | Dados pessoais nunca vão para LLM |
| `lib/knowledge.json` | KB é read-only para o LLM; editor humano controla o conteúdo |
| `components/BottomNav.tsx` | Arquitetura de abas permanece intacta |

---

## 5. Como preservar fallback determinístico como camada de segurança

O motor determinístico nunca deve ser removido. Mesmo com IA, ele permanece como:

1. **Camada primária (score alto):** resposta rápida, sem custo, sem latência de rede
2. **Camada de fallback (IA indisponível):** se a API do LLM falhar ou timeout (> 3s), degradar para fallback contextual atual
3. **Camada de auditoria:** as entradas usadas pelo RAG são as mesmas auditadas manualmente

```typescript
// Pseudocódigo do fluxo futuro em findAnswer() ou na API route:
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

---

## 6. Como a IA deve usar a KB como fonte de verdade

**Regra absoluta:** o LLM redige, a KB conteúdo. Nunca o contrário.

O system prompt para o LLM deve:

```
Você é um assistente especializado em gestão condominial.
Responda SOMENTE com base nas entradas fornecidas.
NÃO invente legislação, artigos ou decisões judiciais.
Se as entradas não responderem a pergunta, diga explicitamente que não tem informação.
Use linguagem clara e direta, como falaria com um síndico voluntário.

Entradas relevantes:
[ENTRADA 1: id, categoria, pergunta, resposta, contexto]
[ENTRADA 2: ...]
[ENTRADA 3: ...]
```

O LLM **não deve**:
- Citar artigos de lei que não estejam nas entradas
- Inventar valores numéricos (salário mínimo, INCC, índices)
- Fazer afirmações de certeza jurídica absoluta
- Personalizar com dados do condomínio sem consentimento explícito

---

## 7. Como evitar alucinação jurídica

O domínio jurídico é o maior risco de um LLM: ele pode inventar artigos de lei, valores ou decisões judiciais com aparência de verdade.

### Proteções arquiteturais

1. **Contexto ancorado:** LLM só recebe entradas da KB curada como contexto
2. **Instrução hard-coded:** "Use SOMENTE as entradas fornecidas"
3. **Badge obrigatório:** toda resposta gerada por LLM deve exibir "Gerado com IA · Baseado em [id]"
4. **Botão "Ver fonte":** usuário pode ver a entrada original da KB usada
5. **Proibição de valores numéricos:** perguntas sobre índices, percentuais legais, salários → sempre motor determinístico ou aviso "consulte CCT/legislação vigente"
6. **Disclaimer automático:** toda resposta com `source: "rag"` inclui "Consulte um advogado para decisões de alto impacto"

### Perguntas que nunca devem ir para LLM

- Cálculos com valores atualizados (salário mínimo, INSS, FGTS %)
- Consulta sobre legislação específica de estado/município (varia por local)
- Questões trabalhistas com valores financeiros específicos
- Qualquer pergunta sobre processo judicial em andamento

---

## 8. Como limitar escopo condominial

O domainGate atual é a principal barreira. Para o RAG, adicionar verificação adicional no API route:

```typescript
// No app/api/ask/route.ts (futuro):
const domainResult = quickDomainCheck(query); // wrapper do domainGate atual
if (!domainResult.isCondominial) {
  return NextResponse.json({
    response: "Esse tema está fora do escopo do Amigo do Prédio.",
    isDefault: true,
    blocked: true,
  });
}
// Só chega aqui se for condominial
const topK = findTopK(query, 3);
// ... chama LLM
```

**Princípio:** o domainGate nunca é relaxado para viabilizar a IA. Se o motor bloqueia, a IA não é chamada.

---

## 9. Como tratar perguntas fora de escopo

Hierarquia de respostas para perguntas fora de escopo:

1. **Domaingate bloqueia → resposta de bloqueio** ("Esse tema não é de gestão condominial. Posso ajudar com...")
2. **É condominial mas KB não tem → fallback contextual** (tema detectado + 3 sugestões relacionadas)
3. **É condominial, score moderado → RAG** (somente após implementação da IA)
4. **Nunca:** inventar resposta para tema fora da KB

---

## 10. Como registrar disclaimers

### Implementação atual (manter)

Em `components/Response.tsx`, toda resposta não-fallback exibe:

```tsx
<p className="text-[11px] text-navy-400">
  As orientações do Amigo do Prédio são baseadas na legislação condominial
  brasileira. Para decisões de alto impacto, consulte um advogado especializado.
</p>
```

### Para respostas geradas por IA (futuro)

Adicionar badge distinto:

```tsx
{answerResult.source === "rag" && (
  <div className="flex items-center gap-1.5">
    <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-600">
      Gerado com IA
    </span>
    <button onClick={() => setShowSource(true)} className="text-[10px] text-navy-400 underline">
      Ver fonte
    </button>
  </div>
)}
```

O disclaimer deve ser **mais proeminente** em respostas geradas por IA do que em respostas determinísticas.

---

## 11. Como preservar privacidade

### Dados que NUNCA vão para a API de LLM

| Dado | Localização | Motivo |
|------|-------------|--------|
| Nome do condomínio | `lib/session.ts` → KEYS.PROFILE | Identificador do prédio |
| Endereço | KEYS.PROFILE | Localizável |
| Nome do síndico | KEYS.PROFILE | Dado pessoal |
| Datas de vencimento | KEYS.MEMORIA | Dados financeiros indiretos |
| Histórico de consultas | KEYS.HISTORY | Padrão de comportamento |
| Favoritos | KEYS.FAVORITES | Padrão de comportamento |

### O que pode ir para a API (apenas quando usuário consentir)

- O texto da pergunta (anonimizado, sem dados pessoais)
- As entradas KB selecionadas como contexto (conteúdo genérico, já público)

### Consentimento

Antes da primeira consulta que envolva IA, exibir modal claro:
> "Esta pergunta será processada com IA. Nenhum dado pessoal do seu condomínio será enviado. Apenas a sua pergunta é compartilhada com o provedor de IA (Anthropic)."

O usuário deve aceitar explicitamente. A preferência deve ser salva em localStorage.

---

## 12. Como medir qualidade após IA

### Métricas novas a adicionar quando IA for implementada

| Evento | O que mede |
|--------|------------|
| `rag_used` | Quantas perguntas usaram RAG vs. motor |
| `rag_source_viewed` | Usuário clicou em "Ver fonte" (confia na resposta?) |
| `rag_fallback_triggered` | API do LLM falhou, degradou para determinístico |
| `rag_score_range` | Score do motor quando RAG foi acionado (calibração) |
| `rag_disclaimer_visible` | Confirmação que disclaimer foi exibido |

### Critério de qualidade mínimo para manter IA ativa

- Fallback rate do RAG < 20% (API caindo muito → revisar provider)
- Taxa de `rag_source_viewed` > 5% (usuário não ignora a fonte)
- Nenhum report de "resposta inventou lei" → monitorar via canal de feedback

---

## 13. Arquitetura mínima recomendada para Fase IA Experimental

```
Frontend (atual, inalterado)
  └── app/page.tsx — detecta score moderado, chama API route
  └── components/Response.tsx — renderiza badge IA, fonte, disclaimer

API Route (novo — requer Next.js API routes, já disponível)
  └── app/api/ask/route.ts
      ├── Recebe: { query, topKEntries }
      ├── Monta system prompt com entradas KB
      ├── Chama Anthropic SDK (Claude Haiku 4.5)
      ├── Retorna: { response, source: "rag", entryIds }
      └── Timeout: 3s → fallback determinístico

Lib (pequena adição a lib/data.ts)
  └── findTopK(query: string, k: number): KnowledgeEntry[]
      — retorna top-k entradas por score sem threshold mínimo

Config
  └── .env.local: ANTHROPIC_API_KEY (não commitar)
  └── Sem Supabase adicional necessário inicialmente
```

**Custo estimado:** ~0.001 USD por query RAG (Claude Haiku 4.5, ~700 tokens por round-trip)

---

## 14. Riscos antes de implementar

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Alucinação jurídica | Alta | System prompt restritivo + KB como única fonte |
| Vazamento de dados pessoais | Alta | Nunca enviar localStorage para a API |
| Custo imprevisível | Média | Rate limit por sessão; fallback para determinístico |
| Latência de rede | Média | Timeout 3s; UX com loading state |
| API key exposta no client | Alta | Sempre API route server-side, nunca chamar Anthropic do browser |
| Resposta irrelevante | Baixa | Fallback determinístico se score RAG baixo |
| LGPD — dados de menores | Baixa | Síndicos são adultos; perguntas não têm dados sensíveis |

---

## 15. Critérios para iniciar Fase IA Experimental

**Todos os itens abaixo devem estar concluídos:**

### Produto
- [ ] Recall A ≥ 80% em auditoria ao vivo (não apenas projetado)
- [ ] KB com ≥ 400 entradas curadas
- [ ] Beta com ≥ 10 síndicos reais ativos (dados reais de telemetria)
- [ ] Fallback rate real > 30% (usuários frustrados com falta de resposta — justifica o custo da IA)
- [ ] Retenção D3 ≥ 25% confirmada

### Técnico
- [ ] API route server-side implementada e testada (sem expor API key no client)
- [ ] Rate limiting por sessão (ex: max 50 queries RAG por usuário/dia)
- [ ] Timeout e fallback implementados
- [ ] `findTopK()` exportada e testada em /admin

### Negócio
- [ ] Modelo de monetização definido (para cobrir custo do LLM)
- [ ] Política de privacidade publicada (menciona envio de perguntas à Anthropic)
- [ ] Disclaimer jurídico validado por advogado ou consultor condominial

### Processo
- [ ] Implementação Fase IA Experimental em branch separado
- [ ] A/B test ou feature flag para ativar RAG apenas para subset de usuários

---

## Diferença entre Fase 36 e Fase IA Experimental

| Aspecto | Fase 36 (atual) | Fase IA Experimental (futura) |
|---------|----------------|-------------------------------|
| Código de IA | Nenhum | API route + Anthropic SDK |
| KB | 316 entradas | ≥ 400 entradas |
| Usuários reais | Interno | Beta com ≥ 10 síndicos |
| Custo LLM | Zero | ~1–10 USD/mês |
| Backend | Nenhum | Apenas API route (serverless) |
| Privacidade | Local-only | Query enviada à Anthropic (com consentimento) |
| Objetivo | Release candidate interno | Validar se RAG melhora o produto |

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 36)*
*Revisar quando os critérios da seção 15 forem atingidos.*
