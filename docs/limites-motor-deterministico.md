# Limites do Motor Determinístico — Amigo do Prédio

> **Documento estratégico interno.**
> Serve para o fundador entender onde o motor atual é sólido, onde é frágil,
> e quando o momento certo de introduzir LLM/RAG chegará.

---

## O que é o motor atual

O Amigo do Prédio usa um motor de matching determinístico:

1. **Normalização:** Remove acentos, caixa, pontuação
2. **Tokenização:** Divide em palavras com ≥ 3 caracteres
3. **Expansão de sinônimos:** ~170 mapeamentos de linguagem real → vocabulário da KB
4. **Domain gate:** Se nenhum token condominial for encontrado → fallback imediato
5. **Scoring:** Cada token é comparado contra pergunta (peso 5/2), keywords (peso 4/1) e suporte (peso 1) de cada entrada
6. **Confidence gap:** Scores borderline (< 14) com segundo candidato próximo (< 4 pts de diferença) → fallback
7. **Limiar:** Score ≥ 8 com vantagem clara → resposta direta
8. **Fallback contextual:** Detecta categoria provável (16 categorias) mesmo sem match → mensagem contextual + sugestões

A base tem **307 entradas** em 16 categorias.

---

## O que o motor faz bem

### 1. Perguntas diretas que espelham a KB
Quando o usuário pergunta algo próximo ao texto da pergunta da base, o match exato (+20 pontos)
garante resposta altamente precisa. Exemplos:
- "Posso aplicar multa sem assembleia?" → score ~29
- "Como cobrar moradores inadimplentes?" → score ~24

### 2. Sinônimos de linguagem real
Com ~170 mapeamentos, o motor entende:
- "devedor" → inadimplente
- "briga de vizinho" → multa/responsabilidade
- "câmera na escada" → LGPD/camera
- "grupo de WhatsApp" → LGPD/privacidade
- "barulho de madrugada" → multa-barulho

### 3. Domain gate confiável
Perguntas completamente fora do escopo (receitas, política, saúde) são bloqueadas corretamente
antes de chegar ao scoring. Falso positivo para perguntas fora de domínio é próximo de zero.

### 4. Fallback contextual honesto
Quando não há match suficiente, o motor identifica o tema provável e oferece:
- Mensagem contextual ("sua dúvida parece envolver multa...")
- Sugestões da mesma categoria (até 5 itens)
- Chip "Tema provável" na UI

### 5. Discriminação por categoria
16 categorias com vocabulário específico. A detecção funciona mesmo sem match exato.

---

## O que o motor ainda não faz bem

### 1. Perguntas de raciocínio composto
O motor compara tokens individualmente, não raciocina. Não consegue:
- "Se X, então Y — qual a consequência de Z?" → múltiplas condições encadeadas
- "Dado que o síndico já fez A e B, precisa ainda fazer C?" → contexto sequencial
- "Compare o que acontece no Rio vs São Paulo" → conhecimento regional

### 2. Perguntas muito curtas ou vagas
Com menos de 2 tokens não-fracos, o motor tem pouco sinal para trabalhar:
- "E o seguro?" → "seguro" pode ser qualquer uma de 3 entradas
- "Posso?" → bloqueado (sem âncora condominial relevante)
- "É obrigatório?" → sem contexto, não sabe "o quê"

### 3. Perguntas com negação
O motor não entende negação: "Como NÃO fazer uma assembleia" → trata "não" como token fraco
e pode responder "Como fazer uma assembleia" como se fossem equivalentes.

### 4. Perguntas com contexto de unidade/andar/bloco
"A unidade 503 fez barulho — o que faço?" vs "A unidade 503 está inadimplente — o que faço?"
→ ambas retornam respostas corretas, mas o motor ignora "503" como dado. Não há personalização
com base em dados específicos do condomínio do usuário.

### 5. Perguntas sobre legislação específica ou regional
"Qual a lei municipal do silêncio em São Paulo?" → o motor sabe sobre regras gerais,
mas não tem dados regionais. Resposta pode ser imprecisa.

### 6. Perguntas comparativas
"Qual a diferença entre convenção e regimento?" → pode retornar uma entrada sobre convenção
ou uma sobre regimento, não uma resposta que explique a diferença entre os dois.

### 7. Perguntas de valores atualizados
"Qual o salário mínimo atual do porteiro?" → a KB tem dados de época de criação.
Valores defasam com o tempo. O motor não sabe que dados podem estar desatualizados.

### 8. Perguntas em série ou encadeadas
O motor não tem memória de conversa. Cada pergunta é processada de forma isolada.
"Já perguntei sobre multa — e quanto ao prazo?" → não sabe a que "multa" se refere.

---

## Onde falso positivo é mais perigoso

| Situação | Risco | Impacto |
|---|---|---|
| Resposta trabalhista com números errados | Síndico toma decisão errada sobre rescisão | Alto — pode gerar passivo trabalhista |
| Resposta sobre corte de água quando pergunta é outra | Síndico age como se pudesse cortar água | Alto — ilegal |
| Resposta sobre LGPD com escopo errado | Síndico acredita que pode publicar dados | Alto — risco de processo |
| Resposta financeira com percentual desatualizado | Síndico calcula multa errada | Médio |
| Resposta de assembleia com quórum errado | Deliberação inválida | Médio |

**O confidence gap adicionado na Fase 30 reduz esse risco** ao preferir fallback contextual
quando dois candidatos têm pontuação similar.

---

## Por que não implementar LLM ainda

1. **Confiança antes de velocidade:** O produto está em fase pré-beta. Uma resposta errada
   de LLM é mais difícil de auditar e corrigir do que um falso positivo determinístico.

2. **Custo operacional:** LLM via API tem custo por query. Com poucos usuários, o gasto
   seria desproporcional ao valor gerado.

3. **Latência:** LLM adiciona 1–3 segundos de latência. O motor atual responde em < 50ms.
   A experiência "instantânea" é um diferencial de qualidade.

4. **Privacidade dos dados:** O produto não envia dados para APIs externas. Com LLM,
   as perguntas do síndico (potencialmente sensíveis) seriam enviadas a terceiros.

5. **Sem infraestrutura de backend:** LLM requer API key, rate limiting, error handling
   para falhas externas, e potencialmente cache. Complexidade prematura para o estágio atual.

6. **O motor determinístico tem vantagens reais:**
   - Auditável: sabemos exatamente por que retornou cada resposta
   - Previsível: não alucina, não inventa legislação
   - Controlável: melhorias são precisas e reversíveis
   - Rápido: resposta instantânea
   - Offline: funciona sem internet

---

## Quando implementar LLM/RAG

Considerar introduzir LLM/RAG quando **todos** os critérios abaixo estiverem satisfeitos:

### Critérios de produto
- [ ] Motor determinístico atingiu recall ≥ 80% nas 84 perguntas de auditoria
- [ ] Base de conhecimento tem ≥ 500 entradas curadas
- [ ] Fallback contextual não frustra mais de 30% das consultas reais (via telemetria)
- [ ] Usuários reais voltam ao app por conta própria (retenção ≥ D3)
- [ ] Pelo menos 3 beta testers completaram o onboarding e fizeram consultas reais

### Critérios técnicos
- [ ] Backend com auth implementado (para proteger API key)
- [ ] Rate limiting por usuário implementado
- [ ] Cache de respostas LLM implementado (reduz custo)
- [ ] Fallback para motor determinístico quando LLM falha

### Critérios de negócio
- [ ] Modelo de monetização definido (LLM tem custo recorrente)
- [ ] Privacidade dos dados: política clara sobre o que é enviado para a API
- [ ] Validação jurídica: disclaimers adequados para respostas geradas por IA

### Abordagem recomendada
**RAG (Retrieval-Augmented Generation):** Usar o motor determinístico para recuperar as 3–5
entradas mais relevantes e enviar como contexto para o LLM gerar uma resposta mais natural.
Isso preserva a auditabilidade da base e reduz alucinações.

**NÃO usar LLM puro** sem base de conhecimento curada — o risco de resposta incorreta sobre
legislação condominial é alto demais sem retrieval controlado.

---

## Tipos de pergunta que funcionam melhor

1. Perguntas que espelham títulos da KB ("Como cobrar...", "Posso fazer...", "Quais são...")
2. Perguntas com 2+ termos específicos do domínio condominial
3. Perguntas sobre processos com etapas claras (assembleia, notificação, demissão)
4. Perguntas sobre direitos e deveres com respostas objetivas (sim/não + explicação)

## Tipos de pergunta que tendem ao fallback

1. Perguntas muito curtas (< 4 palavras)
2. Perguntas com negação ("e se não...")
3. Perguntas com "e se" hipotético
4. Perguntas que cruzam 3+ categorias ao mesmo tempo
5. Perguntas sobre valores numéricos específicos atuais
6. Perguntas com contexto regional específico
7. Perguntas sobre situações únicas e incomuns

---

*Documento interno — Fase 30 — Amigo do Prédio*
*Versão: 2026-05-12*
*Atualizar quando motor mudar significativamente ou LLM for introduzido.*
