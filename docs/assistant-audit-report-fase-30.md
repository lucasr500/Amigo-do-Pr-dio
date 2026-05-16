# Relatório de Auditoria do Assistente — Fase 30

> **Como gerar a versão ao vivo:** Abrir `/admin`, autenticar e clicar em "Rodar auditoria".
> O painel calcula o resultado real das 84 perguntas contra o motor atual.
> Este documento registra a análise analítica pré-execução e serve como referência estratégica.

---

## 1. Resumo Executivo

A Fase 30 introduziu auditoria sistemática do Assistente: 84 perguntas padronizadas em 10 categorias,
classificadas em Tipo A (deve encontrar resposta direta), Tipo B (deve cair em fallback contextual)
e Tipo C (deve ser bloqueado por fora de escopo).

**Melhorias implementadas nesta fase:**
- Confidence gap: respostas ambíguas (score borderline + candidato próximo) agora preferem fallback contextual honesto
- 25+ novos sinônimos de linguagem real de WhatsApp
- Correção do sinônimo `aviso` (não expande mais para "rescisao", prevenindo falso positivo em assembleias)
- 12 novos termos em DOMAIN_ANCHOR_WORDS
- 7 novos termos em STRONG_INTENT_WORDS (barulho, camera, vazamento, procuracao, gravacao, inadimplencia, rescisao)
- Script de auditoria ao vivo no painel `/admin`

---

## 2. Análise por Categoria

### Multas e Advertências (8 perguntas)

**Cobertura esperada: 4 Tipo A, 4 Tipo B**

| Tipo | Previsão | Raciocínio |
|---|---|---|
| "Posso aplicar multa sem assembleia?" | A ✓ | Match exato de pergunta → score ~29 |
| "Quantas advertências antes de multar?" | A ✓ | "advertencia" + "multa" → score moderado-alto |
| "Morador fez barulho de madrugada" | A ✓ | "barulho" agora em STRONG_INTENT_WORDS |
| "Morador reincidente pode ter multa mais alta?" | A ✓ | "reincidente" em DOMAIN_ANCHOR_WORDS |
| "O que acontece se eu multar sem base legal?" | B ✓ | Poucos tokens específicos da KB |
| "Vizinho colocou grade na varanda" | B ✓ | "grade" não está na KB; "varanda" expande para convencao |
| "Morador briga muito com os vizinhos" | B ✓ | "briga" → multa/responsabilidade; múltiplos candidatos próximos |
| "Como documentar uma infração" | B ✓ | "documentar" não está em KB; "infracao" → multa |

**Risco:** "Quantas advertências antes de multar?" pode não atingir score suficiente se a KB não tiver
entrada específica sobre número de advertências. Verificar durante auditoria.

### Obras e Reformas (8 perguntas)

**Cobertura esperada: 4 Tipo A, 4 Tipo B**

| Tipo | Previsão | Raciocínio |
|---|---|---|
| "Morador precisa avisar antes de fazer obra?" | A ✓ | Pergunta quase idêntica na KB |
| "Em quais horários é permitido fazer reforma?" | A ✓ | "horario" + "obra" → horario-obras |
| "Obra no fim de semana — pode?" | A ✓ | "domingo"/"feriado" via sinonimos |
| "Quem paga se obra do vizinho danificou..." | A ✓ | "dano" + "obra" → responsabilidade + obras |
| "Morador trocou o piso da sacada" | B ✓ | "piso" → obra/reforma; "sacada" → varanda/convencao |
| "Posso exigir ART do profissional" | B → A? | "art" em DOMAIN_ANCHOR_WORDS; pode acionar autorizacao-obras |
| "Morador quebrou a parede entre dois cômodos" | B ✓ | "parede" → obra; "comodos" sem match específico |
| "Como regularizar uma obra já feita" | B ✓ | "regularizar" novo sinônimo → regularizacao/obra |

**Risco:** "Posso exigir ART do profissional que fez a obra?" pode retornar match da entrada
`autorizacao-obras` (que menciona ART) com score suficiente. Avaliar se a resposta faz sentido.

### Inadimplência (9 perguntas)

**Cobertura esperada: 5 Tipo A, 4 Tipo B**

| Tipo | Previsão | Raciocínio |
|---|---|---|
| "Como cobrar moradores inadimplentes?" | A ✓ | Pergunta quase idêntica na KB |
| "Posso cortar a água de quem não paga?" | A ✓ | "cortar" + "agua" → corte-agua-inadimplente |
| "Posso negativar o condômino inadimplente?" | A ✓ | "negativar" → negativacao; pergunta similar na KB |
| "Qual o prazo para prescrição da dívida?" | A ✓ | "prescricao" em STRONG_INTENT_WORDS |
| "Posso cobrar juros de mora?" | A ✓ | "juros" + "mora" → juros-atraso |
| "Morador deve 4 meses — posso proibir piscina?" | B ✓ | "piscina" + "inadimplente" → múltiplas categorias |
| "Inquilino não paga — dono da unidade responde?" | B ✓ | "locacao" + "inadimplente" → cruzamento de categorias |
| "Morador parcelou a dívida mas não cumpre" | B ✓ | "parcelamento" específico; "cumprir" sem match |
| "A cota condominial venceu ontem — juros?" | B ✓ | "cota" + "venceu" → prazo de juros; pode match em juros-atraso |

### Assembleias (8 perguntas)

**Cobertura esperada: 5 Tipo A, 3 Tipo B**

| Tipo | Previsão | Raciocínio |
|---|---|---|
| "Como convocar assembleia extraordinária?" | A ✓ | Pergunta idêntica na KB |
| "Com quantos dias de antecedência convocar a AGO?" | A ✓ | "convocacao" + "ago" |
| "Inquilino pode votar em assembleia?" | A ✓ | Match em locacao-inquilino-voto |
| "Qual o quórum para mudar a convenção?" | A ✓ | "quorum" em STRONG_INTENT_WORDS |
| "Posso fazer assembleia virtual?" | A ✓ | "virtual" + "assembleia" → provavelmente coberto |
| "Como registrar a ata da assembleia?" | B ✓ | "registrar" + "ata" → pode match ata-assembleia |
| "Um condômino com procuração pode votar?" | B → A? | "procuracao" agora em STRONG_INTENT_WORDS |
| "A votação foi empatada — síndico tem voto?" | B ✓ | "empate" não coberto na KB |

**Risco:** "Um condômino com procuração pode votar por outro?" agora tem "procuracao" em
STRONG_INTENT_WORDS. Se a entrada `procuracao-assembleia` existir na KB, pode retornar
resposta direta (tipo A) — o que na verdade seria positivo.

### Funcionários / Trabalhista (9 perguntas)

**Cobertura esperada: 2 Tipo A, 7 Tipo B**

Esta é a categoria com mais entradas na KB (23+47 = 70 entradas). Alta taxa de resposta direta esperada.

| Tipo | Previsão |
|---|---|
| "Qual a jornada correta do porteiro?" | A ✓ |
| "Posso contratar zelador como PJ?" | A ✓ |
| "O porteiro faltou — posso descontar?" | B ✓ |
| "Porteiro grávida pode ser dispensada?" | A → B? |
| "Como calcular o aviso prévio do zelador?" | B ✓ (fix do `aviso` previne FP) |
| Outros 4 | B ✓ |

**Melhoria crítica da Fase 30:** O fix do sinônimo `aviso` elimina o risco de "Como calcular
o aviso prévio" ser redirecionado incorretamente para entradas de assembleia/notificação.

### LGPD (8 perguntas)

**Cobertura esperada: 3 Tipo A, 5 Tipo B**

"camera" agora em STRONG_INTENT_WORDS — entradas LGPD com câmera serão discriminadas melhor.

### Responsabilidade (8 perguntas)

**Cobertura esperada: 2 Tipo A, 6 Tipo B**

"vazamento" agora em STRONG_INTENT_WORDS — entradas de responsabilidade/vazamento serão priorizadas.

### Locação (7 perguntas)

**Cobertura esperada: 2 Tipo A, 5 Tipo B**

### Finanças/Gestão (9 perguntas)

**Cobertura esperada: 5 Tipo A, 4 Tipo B**

### Fora do Escopo (9 perguntas)

**Cobertura esperada: 4 Tipo C (bloqueados), 5 Tipo B (fora de escopo mas próximos)**

- "Receita de bolo" → C ✓ (zero domain anchors)
- "Renovar CNH" → C ✓ (zero domain anchors)
- "Presidente do Brasil" → C ✓ (zero domain anchors)
- "Imposto de renda" → C ✓ (zero domain anchors)
- "Herança de imóvel" → B (próximo ao domínio; "imóvel" pode ter sinonimos)
- "Condomínio edilício vs loteamento" → B ✓ (condominio como anchor)
- "Placa solar" → B ✓ (obra + autorizacao → domain anchor passa)
- "Registrar condomínio em cartório" → B ✓ (cartorio→convencao)
- "IPTU" → B? → C? (IPTU não é anchor condominial direto; pode bloquear)

---

## 3. Métricas Esperadas (pré-execução analítica)

| Métrica | Estimativa |
|---|---|
| Recall (A → resposta direta) | 75–85% |
| Fallback contextual correto (B) | 80–90% |
| Bloqueio correto (C) | 85–100% |
| Falso positivo (C → resposta) | 0% |
| Respostas ambíguas redirecionadas pelo confidence gap | ~5–10% das respostas |

---

## 4. Perguntas com Maior Risco de Falso Positivo

1. **"Posso exigir ART do profissional que fez a obra?"** — "art" expande e pode acionar `autorizacao-obras`. A resposta pode ser parcialmente correta.
2. **"Quantas advertências antes de multar?"** — se não houver entrada específica, pode fazer match ruim.
3. **"A cota condominial venceu ontem — já posso cobrar juros?"** — "cota" + "venceu" pode fazer match em múltiplas entradas de inadimplência.

---

## 5. Perguntas com Maior Risco de Falso Negativo

1. **"A votação foi empatada — o síndico tem voto de desempate?"** — "empate" não existe na KB. Fallback correto esperado.
2. **"O síndico pode contratar empresa da família?"** — "empresa da familia" não tem cobertura específica.
3. **"Posso proibir o aluguel por temporada no condomínio?"** — "temporada" não está mapeado. Pode bloquear ou fallback genérico.

---

## 6. Recomendações de Ajuste Pós-Auditoria

Após rodar o relatório no `/admin`, priorizar:

1. **Alta prioridade:** Entradas com score borderline (8–11) que retornaram tipo A → verificar se a resposta é realmente relevante.
2. **Alta prioridade:** Tipo B esperado que retornou tipo A → possível falso positivo → aumentar threshold ou remover keyword ambígua.
3. **Média prioridade:** Tipo A esperado que retornou tipo B → possível lacuna de KB ou sinônimo faltando.
4. **Baixa prioridade:** Tipo C que retornou tipo B → o domínio é próximo; fallback contextual não é um erro grave.

---

*Documento interno — Fase 30 — Amigo do Prédio*
*Versão: 2026-05-12*
