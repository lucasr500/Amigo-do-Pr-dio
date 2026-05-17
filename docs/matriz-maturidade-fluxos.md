# Matriz de Maturidade dos Fluxos — Amigo do Prédio

> **Documento interno — Fase 43**
> Avaliação estruturada de cada fluxo do produto em 7 critérios (escala 0–5).
> Uso: identificar onde o produto está fraco, priorizar melhorias, medir evolução entre fases.

---

## Metodologia

Cada fluxo é avaliado de 0 a 5 em 7 critérios:

| Critério | O que mede |
|----------|------------|
| **Clareza** | O usuário sabe exatamente o que fazer sem instrução |
| **Ação** | O fluxo termina em um passo concreto executável |
| **Segurança** | O fluxo não expõe o usuário a risco jurídico ou operacional |
| **Simplicidade** | A quantidade de passos é mínima e proporcional ao valor |
| **Diferenciação** | O fluxo entrega algo que o usuário não consegue no Google ou ChatGPT facilmente |
| **Antifadiga** | O fluxo não exige esforço cognitivo excessivo para completar |
| **Valor premium** | O fluxo justifica o pagamento futuro de uma assinatura |

**Score total** = média dos 7 critérios. 
- 4.5–5.0: Excelente — não alterar
- 3.5–4.4: Bom — melhorias marginais
- 2.5–3.4: Mediano — melhorar antes do lançamento
- 1.5–2.4: Fraco — prioridade alta
- 0–1.4: Crítico — repensar o fluxo

---

## Fluxos Avaliados

### Fluxo 1 — Primeira experiência (usuário novo, sem dados)

**Descrição:** Usuário abre o app pela primeira vez. Não tem perfil nem memória configurados.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 3 | Hero reformulado (Fase 43) é mais direto, mas chips de situação ainda são novidade — usuário precisa de uma leitura para entender |
| Ação | 4 | Chips levam ao Assistente com pergunta pré-submetida — caminho direto |
| Segurança | 5 | Sem dados, sem risco de erro |
| Simplicidade | 4 | 1 clique num chip → resposta. Muito direto |
| Diferenciação | 3 | Hero com chips situacionais é melhor que ChatGPT genérico, mas não comunica bem a diferença |
| Antifadiga | 4 | Não exige nenhum cadastro antes de ver valor |
| Valor premium | 2 | Usuário pode usar tudo sem sentir necessidade de configurar — baixa percepção de profundidade |

**Score: 3.6** — Bom. Melhorado pela Fase 43. Oportunidade: comunicar o que o usuário "perde" ao não configurar o monitoramento.

---

### Fluxo 2 — Onboarding: cadastro de perfil do condomínio

**Descrição:** Usuário cadastra nome, tipo e quantidade de unidades do condomínio.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 4 | Formulário simples e bem rotulado |
| Ação | 4 | Salvar → bridge explica próximo passo (configurar monitoramento) |
| Segurança | 5 | Dados são locais, sem risco |
| Simplicidade | 4 | 3 campos principais, sem complexidade |
| Diferenciação | 2 | Cadastrar dados do condomínio não é diferenciado por si só |
| Antifadiga | 3 | Bridge "agora vamos configurar" adiciona um passo mental — usuário pode não ver valor ainda |
| Valor premium | 3 | Ativa as features de contexto, mas o valor não é imediato |

**Score: 3.6** — Bom. Ponto fraco: a bridge está bem feita, mas o usuário ainda não sentiu o valor do produto antes de ser convidado a configurar.

---

### Fluxo 3 — Onboarding: configuração de datas (MemoriaPanel)

**Descrição:** Usuário registra datas operacionais: AVCB, seguro, AGO, etc.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 3 | Labels são claros, mas o conjunto de 10+ campos pode parecer um formulário burocrático |
| Ação | 5 | Salvar → GuidancePanel + ProximasDatas ativam imediatamente |
| Segurança | 5 | Dados são locais |
| Simplicidade | 2 | Muitos campos de uma vez. Usuário pode abandonar sem preencher nenhum |
| Diferenciação | 5 | Ativação do monitoramento inteligente é o coração diferenciado do produto |
| Antifadiga | 2 | Formulário longo sem indicação de progresso |
| Valor premium | 5 | Quando preenchido, a experiência é premium e única |

**Score: 3.9** — Bom, mas com picos. Ponto crítico: abandonamento antes de completar o formulário. Melhoria futura: dividir em "datas essenciais" (3–4 campos) e "mais datas" (expansível).

---

### Fluxo 4 — Consulta ao Assistente (pergunta → resposta)

**Descrição:** Usuário digita uma pergunta e recebe orientação.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 4 | Resultado imediato. Badge de confiança comunica bem a qualidade |
| Ação | 3 | Resposta tem "Próximo passo" (Fase 43) em 10 categorias. Mas para entradas sem essa cobertura, o usuário fica sem ação clara |
| Segurança | 4 | Disclaimer jurídico está presente. Mas algumas respostas ainda são muito afirmativas sem nuance |
| Simplicidade | 5 | 1 campo, 1 botão, 1 resposta |
| Diferenciação | 4 | KB especializada + contexto condominial supera respostas genéricas de ChatGPT para muitos casos |
| Antifadiga | 5 | Fluxo mínimo — nenhuma fricção desnecessária |
| Valor premium | 4 | Resposta com base legal + dica + próximo passo é claramente superior ao genérico |

**Score: 4.1** — Bom. Melhoria principal: aumentar cobertura de "Próximo passo" para mais categorias.

---

### Fluxo 5 — Fallback contextual (pergunta fora da KB)

**Descrição:** Usuário pergunta algo que a KB não cobre exatamente. App mostra fallback contextual.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 3 | "Não encontrei uma orientação exata" é honesto, mas pode parecer insatisfatório |
| Ação | 2 | Usuário vê chips de categoria e sugestões, mas ainda sem resposta para o problema real |
| Segurança | 5 | Fallback não inventa resposta — correto |
| Simplicidade | 3 | Cards de sugestão ajudam, mas exigem nova navegação |
| Diferenciação | 2 | ChatGPT sempre dá uma resposta (mesmo que imprecisa) — esse produto não dá. Percebido como limitação |
| Antifadiga | 3 | Usuário foi atrás de resposta e saiu sem ela — frustração real |
| Valor premium | 2 | Fallback não agrega valor premium |

**Score: 2.9** — Mediano. Maior ponto de atrito do produto. Oportunidade: melhorar a experiência de fallback — talvez indicar que "esse tema está sendo expandido" ou direcionar mais ativamente para o Assistente com uma pergunta reformulada.

---

### Fluxo 6 — Geração de comunicado (ComunicadoPanel)

**Descrição:** Usuário seleciona modelo, preenche campos, copia o texto gerado.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 4 | Cards de modelo bem distintos, preview em tempo real |
| Ação | 5 | Copiar → imediatamente pronto para envio no WhatsApp ou impressão |
| Segurança | 4 | Disclaimer por modelo está presente. Usuário ciente que precisa adaptar |
| Simplicidade | 4 | 2–3 campos para gerar um documento funcional |
| Diferenciação | 5 | Gerar um comunicado condominial formatado e juridicamente responsável em 30 segundos é único |
| Antifadiga | 5 | Feedback "copiado" é imediato. Zero fricção |
| Valor premium | 5 | Usuário volta para usar toda vez que precisa de comunicado |

**Score: 4.6** — Excelente. Fluxo mais maduro do produto.

---

### Fluxo 7 — SimuladorMulta

**Descrição:** Usuário insere cota, percentuais e meses para calcular multa/juros.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 4 | Labels claros, valores padrão razoáveis |
| Ação | 4 | Resultado numérico imediato é acionável |
| Segurança | 4 | Disclaimer estimativo visível |
| Simplicidade | 4 | Campos bem dimensionados para a tarefa |
| Diferenciação | 4 | Calculadora especializada em condomínio supera calculadora genérica |
| Antifadiga | 4 | Sem passos desnecessários |
| Valor premium | 3 | Útil, mas menos "wow" que ComunicadoPanel |

**Score: 3.9** — Bom. Fluxo sólido.

---

### Fluxo 8 — SimuladorReajusteCota

**Descrição:** Usuário informa arrecadação, despesas, unidades, inadimplência e obtém recomendação de reajuste.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 3 | Campos são muitos para um síndico sem formação financeira — risco de abandono |
| Ação | 5 | Resultado direto com % de reajuste mínimo |
| Segurança | 4 | Disclaimers explícitos presentes |
| Simplicidade | 3 | 7 campos é o limite aceitável — qualquer adicional seria demais |
| Diferenciação | 5 | Nenhum app de síndico oferece isso de forma simples |
| Antifadiga | 3 | Usuário precisa ter os números à mão — barreia de entrada real |
| Valor premium | 5 | Alta percepção de valor para gestão financeira responsável |

**Score: 4.0** — Bom, com pico de valor. Melhoria: adicionar tooltips explicando cada campo para síndicos sem formação financeira.

---

### Fluxo 9 — ChecklistPanel

**Descrição:** Usuário marca itens de checklists operacionais (assembleia, admissão, manutenção).

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 5 | Cada item é uma ação concreta |
| Ação | 5 | Marcar = feito. Direto |
| Segurança | 4 | Checklists baseados em normas reais |
| Simplicidade | 5 | Toque para marcar, persistência automática |
| Diferenciação | 3 | Checklists existem em vários apps. A especialização condominial diferencia, mas pouco |
| Antifadiga | 5 | Zero fricção |
| Valor premium | 3 | Útil mas pouco "wow" isoladamente |

**Score: 4.3** — Bom. Maior oportunidade: conectar checklist à resposta do Assistente de forma mais proeminente.

---

### Fluxo 10 — GuidancePanel (alertas de atenção/prioridade)

**Descrição:** Usuário vê cards de prioridade baseados nas datas cadastradas.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 4 | Cards com ação clara ("Ver orientação") |
| Ação | 4 | Botão navega para Assistente com pergunta pré-formulada |
| Segurança | 5 | Só aparece com dados reais cadastrados |
| Simplicidade | 4 | Máximo 3 itens inicialmente, expansível |
| Diferenciação | 5 | Antecipação proativa de problemas é o diferencial mais forte do produto |
| Antifadiga | 4 | Não sobrecarrega — limita o número de alertas visíveis |
| Valor premium | 5 | "Você não sabia que precisava disso" — experiência premium |

**Score: 4.6** — Excelente. Junto com ComunicadoPanel, é o ponto mais alto do produto.

---

### Fluxo 11 — Backup export/import

**Descrição:** Usuário exporta seus dados para JSON e pode reimportar.

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Clareza | 4 | Preview antes de confirmar é muito bom |
| Ação | 5 | Export e import funcionam perfeitamente |
| Segurança | 5 | Confirmação prévia antes de sobrescrever dados |
| Simplicidade | 4 | 2 passos para exportar, 2 para importar |
| Diferenciação | 3 | Funcionalidade esperada, não diferenciadora |
| Antifadiga | 4 | Só aparece quando necessário |
| Valor premium | 3 | Necessário, mas não constrói percepção de premium |

**Score: 4.0** — Bom. Fluxo de infraestrutura sólido.

---

## Ranking de Maturidade

| Ranking | Fluxo | Score | Status |
|---------|-------|-------|--------|
| 1 | Geração de comunicado | 4.6 | Excelente |
| 1 | GuidancePanel | 4.6 | Excelente |
| 3 | ChecklistPanel | 4.3 | Bom |
| 4 | Consulta ao Assistente | 4.1 | Bom |
| 5 | Backup export/import | 4.0 | Bom |
| 5 | SimuladorReajusteCota | 4.0 | Bom |
| 7 | Onboarding: datas | 3.9 | Bom |
| 7 | SimuladorMulta | 3.9 | Bom |
| 9 | Onboarding: perfil | 3.6 | Bom |
| 9 | Primeira experiência | 3.6 | Bom |
| 11 | Fallback contextual | 2.9 | Mediano |

---

## Prioridades de Melhoria

### Alta prioridade (antes do lançamento)
1. **Fallback contextual (2.9)** — maior ponto de atrito. Usuário foi atrás de resposta e saiu sem ela.
2. **Primeira experiência (3.6)** — Fase 43 melhorou, mas ainda há oportunidade de comunicar o diferencial no primeiro contato.
3. **Onboarding de datas (3.9/simplicity: 2)** — formulário longo com risco de abandono. Dividir em essencial vs. expandido.

### Média prioridade (pós-lançamento)
4. **SimuladorReajusteCota (clareza: 3)** — tooltips nos campos complexos melhorariam muito.
5. **ChecklistPanel (diferenciação: 3)** — integração mais forte com o Assistente.

### Baixa prioridade (iteração contínua)
6. **GuidancePanel** — já excelente, apenas expansão de cobertura de datas.
7. **ComunicadoPanel** — excelente, adição de novos modelos conforme demanda beta.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 43)*
