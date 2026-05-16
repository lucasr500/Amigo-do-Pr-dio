# Lacunas da Base de Conhecimento — Fase 34

> Auditoria editorial realizada em 2026-05-13.
> Continuação das lacunas documentadas nas fases 32 e 33.

---

## Lacunas resolvidas nesta fase

| ID | Tema | Tipo | Status |
|---|---|---|---|
| `obra-emergencial-sem-assembleia` | Obra urgente: síndico pode contratar sem assembleia + procedimento | Nova entrada | ✅ Adicionado |
| `subsindico-poderes-limites` | Poderes e limites do subsíndico | Nova entrada | ✅ Adicionado |
| `multa-sem-base-legal-consequencias` | Consequências de multar sem previsão na convenção | Nova entrada | ✅ Adicionado |
| `dano-vizinho-procedimento` | Vizinho causou dano — procedimento e papel do condomínio | Nova entrada | ✅ Adicionado |
| `animal-locatario-convencao` | Locatário com animal vs. convenção proibitiva | Nova entrada | ✅ Adicionado |

### Melhorias editoriais em entradas existentes

| ID | Melhoria | Impacto |
|---|---|---|
| `justa-causa-funcionario` | Keywords fraseais → tokens individuais; +celular, +porteiro | Motor agora encontra para queries naturais |
| `juros-atraso` | +venceu, +cobrar, +calcular, +cota, +automatico | Resolve match errado "venceu ontem" → prescricao |
| `obra-emergencial-condominios` | Keywords fraseais → tokens individuais | Melhora encontrabilidade para emergências |
| `jornada-horas-extras-condominio` | +faxineiro, +faxineira, +calcular, +adicional | Resolve match errado "faxineiro hora extra" → rateio-despesas |
| `obras-necessarias-sindico` | +emergencia, +contratar, +encanamento, +bomba | Complementa nova entrada de emergência |
| `contratacao-emergencial` | Keywords fraseais → tokens individuais | Melhora encontrabilidade |

---

## Lacunas da Fase 33 — estado após Fase 34

| # | ID sugerido | Prioridade original | Status |
|---|-------------|--------------------|----|
| 1 | `multa-sem-base-legal-consequencias` | Alta | ✅ Resolvida |
| 2 | `jornada-hora-extra-calculo` | Alta | ✅ Resolvida via melhoria keywords de `jornada-horas-extras-condominio` |
| 3 | `dano-vizinho-procedimento` | Alta | ✅ Resolvida |
| 4 | `despejo-inquilino-procedimento` | Média | ⏳ Pendente — ver justificativa abaixo |
| 5 | `iptu-condominio` | Média | ⏳ Pendente — ver justificativa abaixo |
| 6 | `animal-estimacao-convencao` | Média | ✅ Resolvida via `animal-locatario-convencao` |
| 7 | `art-obra-profissional` | Média | ⏳ Pendente — ver justificativa abaixo |
| 8 | `juros-mora-calculo-inicio` | Baixa | ✅ Resolvida via melhoria keywords de `juros-atraso` |
| 9 | `rescisao-justa-causa-procedimento` | Baixa | ✅ Resolvida via melhoria keywords de `justa-causa-funcionario` |
| 10 | `placa-solar-apartamento` | Baixa | ⏳ Pendente — ver justificativa abaixo |
| 11 | `marquise-responsabilidade-manutencao` | Baixa | ⏳ Pendente — ver justificativa abaixo |

### Justificativas para lacunas pendentes (da Fase 33)

**`despejo-inquilino-procedimento`** — Procedimento judicial complexo (Lei 8.245/91, prazos de ação, liminar). Requer pesquisa jurídica aprofundada para não orientar errado. Aguardar revisão jurídica ou RAG com base legal estruturada.

**`iptu-condominio`** — Varia significativamente por município, tipo de unidade, e convenção. Uma entrada genérica pode confundir mais do que orientar. Aguardar RAG com capacidade de responder por contexto local.

**`art-obra-profissional`** — Envolve regulamentação do CREA/CAU, que muda por estado e categoria de obra. Uma resposta incorreta pode expor o condomínio. Aguardar revisão com especialista ou RAG com fonte estruturada.

**`placa-solar-apartamento`** — Envolve Marco Legal da Microgeração (Lei 14.300/2022), NBR 16690, aprovação da distribuidora e possivelmente da prefeitura. Alta complexidade técnica e regulatória. Deixar para fase editorial futura com pesquisa específica.

**`marquise-responsabilidade-manutencao`** — Envolve AVCB, laudo de fachada, responsabilidade civil/criminal e regulamentação municipal variada. Risco alto de orientação incorreta. Deixar para RAG ou entrada validada com advogado.

---

## Lacunas da Fase 32 — estado após Fase 34

| Lacuna Fase 32 | Status |
|---|---|
| Câmeras de segurança / LGPD (`cameras-lgpd-aviso`) | ✅ Coberta pela melhoria de `cameras-lgpd-condominio` nas fases anteriores |
| Obras emergenciais sem aprovação assemblear | ✅ Resolvida: `obra-emergencial-sem-assembleia` |
| Subsíndico: poderes e limites | ✅ Resolvida: `subsindico-poderes-limites` |
| Mudança de horário de silêncio | ⏳ Pendente (ver abaixo) |
| Funcionário CLT que mora no prédio — demissão | ✅ Coberta por `moradia-funcional-zelador` (entrada existente) |

**`horario-silencio-alteracao`** — Pendente. A pergunta é recorrente e a resposta é relativamente simples (regimento pode ser alterado por assembleia, convenção exige quórum maior). Candidata para próxima fase editorial.

---

## Lacunas remanescentes — prioridade atualizada

### Alta prioridade (próxima fase editorial)

| ID sugerido | Pergunta típica | Por que importa |
|---|---|---|
| `horario-silencio-alteracao` | "Posso mudar o horário de silêncio em assembleia?" | Frequente, resposta clara, segura |
| `sindico-pj-possibilidade` | "Posso ser síndico pela minha empresa?" | Cada vez mais comum, síndico profissional |
| `balancete-prazo-disponibilidade` | "Em quantos dias devo enviar o balancete?" | Dúvida comum, resposta determinada por lei |
| `fundo-obras-constituicao` | "Como criar e manter o fundo de obras?" | Gestão financeira — alta relevância operacional |

### Média prioridade

| ID sugerido | Pergunta típica | Categoria |
|---|---|---|
| `garagem-vaga-visitante-permanente` | "Posso usar vaga de visitante de forma permanente?" | areas-comuns |
| `alteracao-fachada-janela` | "Morador quer trocar janela — precisa de aprovação?" | obras |
| `taxa-mudanca-cobranca` | "Pode cobrar taxa por mudança? Qual o limite?" | areas-comuns |
| `rescisao-acordo-homologacao` | "Preciso homologar rescisão em algum lugar?" | trabalhista |

### Baixa prioridade / aguardar RAG

| ID sugerido | Razão para aguardar |
|---|---|
| `despejo-inquilino-procedimento` | Procedimento judicial — alto risco se simplificado |
| `iptu-condominio` | Varia por município — sem resposta genérica útil |
| `art-obra-profissional` | Regulamentação CREA/CAU por estado — requer especialista |
| `placa-solar-apartamento` | Marco legal recente, técnico, complexo |
| `marquise-responsabilidade-manutencao` | AVCB + estrutural + municipal — alto risco editorial |

---

## Recomendações para próxima fase editorial (Fase 35+)

1. Focar nas 4 lacunas de alta prioridade listadas acima
2. Considerar melhorar a categoria `gestao` (48 entradas) — pode ser subdividida
3. Revisar entradas com keywords fraseais que ainda existam na KB (usar `grep` no JSON)
4. Adicionar campo `atualizadoEm` gradualmente nas entradas revisadas (prepara para RAG)
5. Não ultrapassar 350 entradas antes de auditar qualidade das existentes (risco de dilução)

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-13 (Fase 34)*
