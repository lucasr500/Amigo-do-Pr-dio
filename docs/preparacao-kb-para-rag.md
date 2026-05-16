# Preparação da KB para RAG Futuro

> **Documento estratégico interno.**
> Descreve como a base de conhecimento deve evoluir para ser usada por IA/RAG.
> Não implementa nada — registra as decisões arquiteturais a tomar antes da implementação.

---

## 1. Como a KB atual funciona

A KB é um array de objetos JSON em `lib/knowledge.json`. O motor determinístico (`lib/data.ts`) a usa assim:

1. Normaliza e tokeniza a pergunta do usuário
2. Expande tokens com sinônimos mapeados manualmente
3. Verifica se algum token está em `DOMAIN_ANCHOR_WORDS` (se não, bloqueia)
4. Pontua cada entrada da KB pelo score de sobreposição de tokens vs. keywords
5. Se o score do melhor match ≥ 14 e o gap para o segundo ≥ 4: retorna a resposta
6. Caso contrário: fallback contextual baseado em categoria detectada

**Velocidade:** < 50ms, zero dependências externas, funciona offline.  
**Limitação central:** sem semântica — "cobrar vizinho por dano" e "cobrar inadimplente" parecem iguais para o motor.

---

## 2. Limitações do formato atual para RAG

| Limitação | Impacto para RAG |
|-----------|-----------------|
| Sem campo de fonte/base legal | RAG não sabe qual artigo citar com confiança |
| Sem campo de data de atualização | RAG não sabe se a entrada está desatualizada |
| Sem nível de confiança editorial | RAG não sabe ponderar entradas revisadas vs. antigas |
| Sem campo de risco | RAG não sabe quando ser mais cauteloso |
| Sem relação entre entradas | RAG não sabe recuperar entradas complementares |
| Keywords são para matching determinístico | Para embeddings, o texto completo é mais relevante que keywords |
| IDs não têm versão | Difícil rastrear mudanças de conteúdo |

---

## 3. Campos que a IA futura precisará considerar

Para que um sistema RAG funcione bem sobre esta KB, os campos mais importantes são:

### 3.1 Campos atuais já úteis para RAG

| Campo | Uso para RAG |
|-------|-------------|
| `id` | Referência estável para citar a fonte da resposta |
| `categoria` | Filtro por contexto antes de recuperar; fallback por categoria |
| `pergunta` | Embedding de query — mais próximo do que o usuário pergunta |
| `resposta` | Conteúdo principal para geração de resposta |
| `contexto` | Contexto adicional para o LLM — base legal, nuances |
| `dica` | Pode ser incluída no output como "próximo passo" |

### 3.2 Campos ausentes importantes para RAG

| Campo | Finalidade | Nota |
|-------|-----------|------|
| `fonte` | Referência legal verificável | "CC art. 1.336" ou "STJ Tema 1.079" |
| `baseLegal` | Array estruturado de normas aplicáveis | Diferente de `contexto` livre |
| `risco` | Nível de risco da orientação: `baixo`, `medio`, `alto` | Temas trabalhistas têm risco alto |
| `atualizadoEm` | Data da última revisão editorial | Crítico para saúde da KB a longo prazo |
| `tipoResposta` | `procedimento`, `regra`, `limite`, `orientacao` | Ajuda LLM a formatar melhor |
| `exigeAssembleia` | Boolean: a ação descrita exige aprovação assemblear? | Importante para síndico |
| `exigeProfissional` | Boolean: exige advogado, engenheiro, contador? | Cautela editorial |
| `confiancaEditorial` | `alta`, `media`, `baixa` | Controla quanto o LLM pode "confiar" na entrada |
| `relatedIds` | Array de IDs de entradas complementares | Permite RAG recuperar entradas relacionadas |
| `tags` | Tags semânticas além da categoria | Ex: `["urgencia", "documentacao", "stj"]` |

---

## 4. Importância de `id` estável

O `id` é a referência que o sistema RAG usará para citar a fonte de uma resposta.

**Regras obrigatórias:**

- Uma vez criado e em uso, o `id` não pode ser renomeado sem migração
- Se uma entrada for substituída por uma melhor, manter o id antigo com `deprecated: true`
- IDs devem ser descritivos e permanentes: `multa-sem-base-legal-consequencias` é melhor que `multa-023`

**Por que isso importa para RAG:** O sistema pode dizer "Baseado em `multa-sem-base-legal-consequencias`..." — o usuário e o desenvolvedor conseguem localizar e validar a fonte.

---

## 5. Importância de categoria consistente

A categoria é o principal filtro que o RAG usará antes de buscar entradas.

**Problemas atuais a corrigir antes de implementar RAG:**

- Algumas entradas estão em categorias debatíveis (`cobranca` vs. `inadimplencia`)
- A categoria `juridico` é genérica demais — pode precisar ser subdividida
- `gestao` tem 48 entradas (a maior) — pode ser dividida em `gestao-financeira` e `gestao-operacional`

**Meta antes de RAG:** cada entrada deve ter uma categoria que um síndico reconheceria como "ah, esse assunto é de X".

---

## 6. Importância de resposta/contexto/dica separados

Para RAG, a separação de campos permite:

- **`resposta`** → o LLM usa como base da resposta gerada
- **`contexto`** → o LLM usa quando precisa justificar ou aprofundar
- **`dica`** → o LLM inclui como "próximo passo" ou "ação prática"

Se esses campos forem misturados em um campo único `texto`, o LLM não consegue modular o que incluir na resposta de acordo com o tipo de pergunta.

**Manter a separação atual é uma decisão correta para RAG.**

---

## 7. Como lidar com fontes jurídicas futuras

Hoje: `contexto` contém referências legais em texto livre.  
Futuro: `baseLegal` como array estruturado.

**Proposta de estrutura futura (não implementar agora):**

```json
"baseLegal": [
  { "norma": "Código Civil", "artigo": "1.336" },
  { "norma": "STJ", "referencia": "Tema 1.079" }
]
```

**Por que esperar:** é trabalho editorial intenso e a estrutura exata depende de como o RAG vai usar essa informação. Melhor definir quando o sistema estiver pronto.

**O que fazer agora:** garantir que as referências legais mais importantes estejam no campo `contexto` de forma legível, mesmo que não estruturada.

---

## 8. Como lidar com convenção/regimento/atas no futuro

No futuro, o Amigo do Prédio pode permitir que o síndico faça upload da convenção do seu condomínio. Quando isso acontecer, o RAG precisará:

1. **Diferenciar** resposta da KB (genérica) de resposta da convenção (específica do condomínio)
2. **Priorizar** a convenção quando houver dados específicos ("sua convenção prevê multa de R$ X")
3. **Sinalizar** ao usuário quando a convenção tem lacunas ("sua convenção não trata desse tema")

**Implicação para a KB atual:** as entradas devem continuar usando linguagem genérica ("conforme a convenção") e nunca assumir um valor ou regra específica que possa contradizer a convenção real de um condomínio.

---

## 9. Como evitar alucinação

O maior risco com LLMs em domínio jurídico é inventar legislação, artigos ou decisões.

**Proteções da arquitetura RAG planejada:**

1. O LLM **só redige** — a KB é a fonte do conteúdo, não o LLM
2. Para cada resposta gerada, as entradas usadas como contexto são exibidas ("baseado em...")
3. O LLM recebe instrução explícita: "Use somente as entradas fornecidas. Se não houver resposta adequada, diga que não tem."
4. Respostas com score de confiança editorial `baixo` são sinalizadas com caveat automático
5. Perguntas sobre valores numéricos (salário mínimo, índices) nunca vão para o LLM — o motor determinístico responde ou diz "veja a tabela da CCT"

---

## 10. Como a IA deve citar ou mencionar a base interna

O sistema deve implementar transparência de fonte:

```
Resposta: "O síndico pode contratar a obra urgente sem assembleia..."

Baseado em: [obra-emergencial-sem-assembleia] — Obras
```

O usuário deve poder clicar/expandir para ver a entrada original. Isso constrói confiança e permite correção manual quando a entrada estiver desatualizada.

**Regra:** nunca apresentar resposta gerada por IA sem indicar que é gerada por IA e sem mostrar a fonte KB usada.

---

## 11. Como distinguir orientação geral de caso específico

A KB atual responde orientações gerais: "O síndico pode fazer X quando..."

Com RAG e contexto do condomínio:
- **Orientação geral (KB):** "A jornada máxima é 44 horas semanais"
- **Orientação específica (RAG + contexto):** "Seu porteiro trabalha escala 12x36, então a CCT da sua categoria prevê adicional de X%"

**Implicação para a KB:** as entradas devem ser escritas para o caso geral. Nunca para um caso específico. A personalização é responsabilidade da camada RAG, não da KB.

---

## 12. Sugestão de campos futuros (não implementar agora)

Documentado para decisão futura:

```json
{
  "id": "obra-emergencial-sem-assembleia",
  "categoria": "obras",
  "pergunta": "...",
  "resposta": "...",
  "contexto": "...",
  "dica": "...",
  "keywords": [],

  // Campos futuros — não implementar ainda:
  "fonte": "CC art. 1.341",
  "baseLegal": [{ "norma": "Código Civil", "artigo": "1.341" }],
  "risco": "baixo",
  "tipoResposta": "procedimento",
  "exigeAssembleia": false,
  "exigeProfissional": false,
  "confiancaEditorial": "alta",
  "atualizadoEm": "2026-05-13",
  "relatedIds": ["obras-necessarias-sindico", "contratacao-emergencial"],
  "tags": ["urgencia", "contratacao", "sem-assembleia"]
}
```

### Quando migrar o schema

Migrar o schema SOMENTE quando:
- [ ] O sistema RAG (Etapa 1 ou 2 do plano-ia-rag-futuro.md) estiver sendo implementado
- [ ] A estrutura final dos campos estiver validada com o engenheiro de RAG
- [ ] Houver script de migração automática que não quebre o motor determinístico atual
- [ ] O build continuar funcionando após a migração

**Não migrar o schema para "se preparar" antes do RAG estar pronto.**  
A documentação acima já é suficiente para que o trabalho editorial de hoje seja compatível com o RAG futuro.

---

## 13. Roteiro de migração para RAG (resumo)

```
Fase atual (34)
  └── KB curada, organizada, com boas keywords

Fase editorial (35+)
  └── Alcançar 400+ entradas de alta qualidade
  └── Resolver lacunas de alta prioridade
  └── Adicionar campo 'fonte' nos campos 'contexto' de forma sistemática

Fase de retrieval sem LLM (etapa 1)
  └── Motor retorna top-3 para score moderado (8–13)
  └── Exibe como "orientações relacionadas"
  └── Valida se usuários clicam nas sugestões

Fase de RAG com LLM (etapa 2 — requer backend + auth)
  └── LLM usa top-3 entradas como contexto
  └── Resposta gerada com badge "IA" e link para fonte
  └── Migrar schema com campos adicionais

Ver docs/plano-ia-rag-futuro.md para critérios de quando implementar.
```

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-13 (Fase 34)*
*Revisar quando Etapa 1 do plano RAG for iniciada.*
