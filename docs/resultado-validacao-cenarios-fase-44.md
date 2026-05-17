# Resultado da Validação de Cenários — Fase 44

> **Documento interno — Fase 44**
> Validação interna de 20 cenários selecionados do Laboratório de Cenários (Fase 43).
> Avalia o produto contra a tese de tempo até o alívio.

---

## Método

Para cada cenário: avaliar a experiência completa — entrada, reconhecimento, resposta, próximo passo, ferramenta disponível — simulando o síndico em crise.

**Escala por cenário:** 1–5
- 5: alívio completo — síndico sabe o que fazer, tem texto pronto ou ferramenta disponível
- 4: bom — resposta útil, próximo passo presente
- 3: mediano — resposta existe mas sem direção clara
- 2: fraco — resposta existe mas não alivia
- 1: falha — sem resposta ou resposta errada

---

## Cenários Avaliados

### C01 — Barulho recorrente de madrugada
**Entrada disponível:** chip "Barulho após as 22h" → auto-submit
**Resposta KB:** entrada sobre barulho/perturbação do sossego
**Próximo passo:** "Documente a ocorrência por escrito com data, hora e testemunhas antes de notificar." (CAT_TO_NEXTACTION: multas)
**CTA:** Notificação de Infração disponível
**Avaliação:** ✅ **4/5** — chip resolve sem digitação, resposta inclui sequência correta, CTA direto. Ponto fraco: alguns cenários de barulho retornam `multas`, outros podem não ter `dica`, mas a cobertura geral é boa.

---

### C02 — Multa aplicada sem ata
**Entrada:** digitação manual
**Resposta KB:** cobertura presente (multa sem base / competência do síndico)
**Próximo passo:** via CAT_TO_NEXTACTION multas
**CTA:** notificação disponível
**Avaliação:** ✅ **4/5** — resposta distingue multa prevista vs. não prevista. Disclaimer calibrado.

---

### C03 — Morador contumaz (art. 1.337 CC)
**Entrada:** digitação manual ("morador infrator, já teve 3 notificações")
**Resposta KB:** entrada sobre condômino contumaz / art. 1.337
**Próximo passo:** CAT_TO_NEXTACTION multas presente
**CTA:** notificação disponível
**Avaliação:** ✅ **4/5** — menciona art. 1.337, quórum 3/4, não sugere medidas impossíveis.

---

### C04 — Obra estrutural sem ART
**Entrada:** chip "Obra sem aviso" → auto-submit
**Resposta KB:** cobertura presente (ART/RRT, embargo preventivo)
**Próximo passo:** CAT_TO_NEXTACTION obras
**CTA:** comunicado de obra disponível
**Avaliação:** ✅ **4/5** — entrada direta via chip, distingue estética vs. estrutural. Poderia ser 5 se houvesse entrada específica sobre ART/RRT mais prominente.

---

### C05 — Obra em horário proibido (domingo)
**Entrada:** digitação manual ("obra de cerâmica aos domingos")
**Resposta KB:** cobertura presente (horário de obras)
**Próximo passo:** CAT_TO_NEXTACTION obras
**CTA:** comunicado de obra disponível
**Avaliação:** ✅ **4/5** — orienta rito correto (advertência → notificação → multa), não exagera.

---

### C07 — Convocação com prazo curto
**Entrada:** digitação manual ("convoquei com 5 dias")
**Resposta KB:** cobertura presente (prazo convencional vs. legal)
**Próximo passo:** CAT_TO_NEXTACTION assembleias
**CTA:** convocação disponível
**Avaliação:** ✅ **4/5** — não afirma invalidade sem verificar convenção. Checklist de assembleia disponível via CAT_TO_CHECKLIST.

---

### C09 — Empate em votação
**Entrada:** digitação manual ("assembleia empatada 15 a 15")
**Resposta KB:** cobertura presente (voto de Minerva)
**Próximo passo:** CAT_TO_NEXTACTION assembleias
**CTA:** preparar convocação disponível (menos relevante nesse caso)
**Avaliação:** ⚠️ **3/5** — resposta explica voto de Minerva. CTA de convocação não é o mais útil para empate em votação já realizada — mas a orientação é correta.

---

### C10 — Condômino deve 6 meses, quer parcelar
**Entrada:** digitação manual ("morador deve 6 meses, quer pagar em parcelas")
**Resposta KB:** entrada sobre parcelamento de dívida condominial
**Próximo passo:** CAT_TO_NEXTACTION inadimplencia
**CTA:** notificação de cobrança disponível
**Avaliação:** ✅ **4/5** — valida parcelamento, exige formalização, CTA para notificação formal.

---

### C11 — Devedor quer votar em assembleia
**Entrada:** digitação manual ("inadimplente quer votar")
**Resposta KB:** entrada sobre art. 1.335 III
**Próximo passo:** CAT_TO_NEXTACTION inadimplencia
**CTA:** notificação disponível (menos relevante aqui)
**Avaliação:** ⚠️ **3/5** — resposta cita art. 1.335, diferencia participação de votação. CTA não é ideal para esse cenário específico.

---

### C13 — Porteiro faltou sem atestado
**Entrada:** digitação manual ("porteiro faltou sem avisar")
**Resposta KB:** cobertura presente (falta + atestado + CCT)
**Próximo passo:** CAT_TO_NEXTACTION funcionarios
**CTA:** nenhum (adequado — não há ferramenta para esse caso)
**Avaliação:** ✅ **4/5** — menciona CCT, diferencia falta com/sem atestado, não recomenda justa causa imediata.

---

### C14 — Zelador quer trabalhar como PJ
**Entrada:** digitação manual ("zelador quer ser PJ")
**Resposta KB:** entrada sobre pejotização / vínculo empregatício
**Próximo passo:** CAT_TO_NEXTACTION trabalhista ← **NOVO** adicionado na Fase 44
**CTA:** nenhum (adequado)
**Avaliação:** ✅ **4/5** — alerta sobre risco trabalhista, explica 4 elementos do vínculo. Próximo passo novo agora disponível.

---

### C20 — Lista de inadimplentes no mural
**Entrada:** chip "Querem expor inadimplente" → auto-submit (chip novo da Fase 44)
**Resposta KB:** entrada sobre LGPD e divulgação de inadimplentes
**Próximo passo:** CAT_TO_NEXTACTION lgpd
**CTA:** nenhum (adequado — sem ferramenta para LGPD)
**Avaliação:** ✅ **4/5** — chip novo mais claro que "Nome no grupo". Resposta menciona LGPD, dano moral, alternativa segura.

---

### C21 — Câmera privada no corredor
**Entrada:** digitação manual (ou QuickAccessCards lgpd: "Câmera no corredor: precisa de autorização?" — novo)
**Resposta KB:** entrada sobre câmeras em área comum
**Próximo passo:** CAT_TO_NEXTACTION lgpd
**CTA:** nenhum (adequado)
**Avaliação:** ✅ **4/5** — examplePrompt do TOPICS lgpd agora cobre esse cenário (antes duplicava o chip 3).

---

### C22 — Vazamento do apartamento de cima
**Entrada:** chip "Vazamento entre apts." → auto-submit ← **NOVO** substituiu "Convocar assembleia"
**Resposta KB:** entrada sobre infiltração / responsabilidade
**Próximo passo:** CAT_TO_NEXTACTION responsabilidade
**CTA:** registrar ocorrência formal disponível
**Avaliação:** ✅ **4/5** — chip de entrada direta para um dos cenários mais frequentes. Orientação de vistoria + documentação presente.

---

### C23 — Morador escorregou em área molhada
**Entrada:** digitação manual ("morador caiu na área da piscina")
**Resposta KB:** entrada sobre responsabilidade objetiva / seguro
**Próximo passo:** CAT_TO_NEXTACTION responsabilidade
**CTA:** registrar ocorrência formal disponível
**Avaliação:** ✅ **4/5** — menciona responsabilidade objetiva, orientação de acionar seguro.

---

### C27 — Condômino quer pagar menos por não usar elevador
**Entrada:** digitação manual ("morador do 1º andar não quer pagar elevador")
**Resposta KB:** entrada sobre rateio por fração ideal / art. 1.336
**Próximo passo:** CAT_TO_NEXTACTION financeiro ← **NOVO** adicionado na Fase 44
**CTA:** simular reajuste de cota ← **NOVO** bridge para financeiro
**Avaliação:** ✅ **4/5** — resposta cita art. 1.336, cobre o argumento do não-uso. Próximo passo e CTA agora disponíveis.

---

### C28 — Taxa extra urgente sem assembleia (caixa d'água estourou)
**Entrada:** digitação manual ("preciso cobrar taxa extra urgente sem assembleia")
**Resposta KB:** entrada sobre obra urgente / art. 1.341 II
**Próximo passo:** CAT_TO_NEXTACTION financeiro ← **NOVO**
**CTA:** simular reajuste / simulador de multa (parcialmente útil)
**Avaliação:** ⚠️ **3/5** — resposta existe, próximo passo agora disponível. CTA de reajuste não é 100% adequado para obra emergencial. Sem bug — apenas cobertura parcial de ferramenta.

---

### C29 — AVCB vencido há 2 anos
**Entrada:** digitação manual ("AVCB vencido")
**Resposta KB:** entrada sobre AVCB e renovação
**Próximo passo:** CAT_TO_NEXTACTION manutencao ← **NOVO** adicionado na Fase 44
**CTA:** comunicado de serviço ← **NOVO** bridge para manutencao
**GuidancePanel:** se data cadastrada, aparece proativamente (diferencial)
**Avaliação:** ✅ **5/5** — com dados cadastrados, o GuidancePanel já alerta antes de o síndico perguntar. Para quem pergunta manualmente, resposta + próximo passo + comunicado de serviço completa o ciclo.

---

### C38 — Votação para destituir o síndico
**Entrada:** digitação manual ("querem destituir o síndico")
**Resposta KB:** entrada sobre art. 1.349 CC / assembleia de destituição
**Próximo passo:** CAT_TO_NEXTACTION assembleias
**CTA:** preparar convocação disponível
**Avaliação:** ✅ **4/5** — resposta menciona maioria absoluta, orientação de convocar assembleia, CTA de convocação adequado.

---

### C44 — Inadimplência sistêmica (30% dos condôminos)
**Entrada:** digitação manual ("30% dos moradores em atraso")
**Resposta KB:** cobertura de inadimplência / cobrança
**Próximo passo:** CAT_TO_NEXTACTION inadimplencia ou cobranca (novo)
**CTA:** notificação de cobrança disponível
**Avaliação:** ⚠️ **3/5** — resposta existe mas o cenário de inadimplência sistêmica (30%) é mais grave que uma cobrança individual. Não há entrada específica para esse nível de crise. Parcialmente coberto.

---

## Resumo dos 20 Cenários

| Nota | Cenários | % |
|------|----------|---|
| 5 — Alívio completo | C29 | 5% |
| 4 — Bom | C01, C02, C03, C04, C05, C07, C10, C13, C14, C20, C21, C22, C23, C27, C38 | 75% |
| 3 — Mediano | C09, C11, C28, C44 | 20% |
| 2 — Fraco | — | 0% |
| 1 — Falha | — | 0% |

**Média geral: 3.85/5**

---

## Falhas e Fricções Encontradas

### Críticas (impactam alívio)
1. **C09 (empate em votação)** — CTA de convocação não é útil após empate já ocorrido. Sem ferramenta específica. Resposta existe, mas o síndico não tem próxima ação clara de documentação.
2. **C44 (inadimplência sistêmica)** — não há entrada KB específica para cenário de crise financeira coletiva. Respondido via cobrança individual, insuficiente para a gravidade.

### Moderadas (reduzem valor mas não bloqueiam)
3. **C11 (devedor em assembleia)** — CTA de notificação de cobrança não é relevante para o cenário de votação. Sem CTA ideal.
4. **C28 (taxa extra emergencial)** — SimuladorReajusteCota sugere planejamento, não emergência. Gap na ponte Assistente → Ferramentas para esse caso específico.

### Menores (impacto baixo)
5. **Chip 5 anterior ("Convocar assembleia")** — substituído por "Vazamento entre apts." — ajuste executado nesta fase.
6. **TOPICS lgpd duplicado** — examplePrompt idêntico ao chip 3 — corrigido nesta fase.

---

## Ajustes Executados na Fase 44

1. ✅ Hero chip 3: "Nome no grupo" → "Querem expor inadimplente" (label mais claro)
2. ✅ Hero chip 5: "Convocar assembleia" → "Vazamento entre apts." (crise vs. procedimento)
3. ✅ TOPICS lgpd examplePrompt: removida duplicata → câmera no corredor
4. ✅ TOPICS financeiro examplePrompt: pergunta abstrata → reajuste de cota
5. ✅ CAT_TO_NEXTACTION: +5 categorias (cobranca, trabalhista, financeiro, areas-comuns, manutencao)
6. ✅ CAT_TO_COMUNICADO: +2 bridges (manutencao → comunicado de serviço, financeiro → simular reajuste)

---

## Pendências e Prioridades Futuras

| Prioridade | Cenário | Ajuste necessário |
|------------|---------|------------------|
| Alta | C44 (inadimplência sistêmica) | Entrada KB específica para crise financeira coletiva |
| Média | C09 (empate) | Melhorar CTA — link para checklist de ata em vez de convocação |
| Média | C28 (taxa extra emergencial) | Possível entrada KB sobre urgência + SimuladorMulta como ferramenta |
| Baixa | C11 (devedor em assembleia) | Avaliar se CTA de comunicado de cobrança faz sentido para o contexto |

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 44)*
