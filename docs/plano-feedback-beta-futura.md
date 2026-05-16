# Plano de Feedback — Beta Futura
## Amigo do Prédio

> **Documento de planejamento interno.**
> A beta com síndicos reais NÃO começa nesta fase.
> Este documento prepara o processo antes de o produto estar pronto.
> Data de elaboração: 2026-05-16 (Fase 39)

---

## 1. Premissas

- A beta começa apenas quando todos os critérios do `docs/roadmap-pre-lancamento.md` estiverem verdes
- Os primeiros 5 síndicos são convidados manualmente, um a um
- Não há formulário público, landing page, nem divulgação antes da beta fechada
- O fundador acompanha os primeiros 5 usuários pessoalmente

---

## 2. Canal de feedback recomendado

**Opção principal: WhatsApp direto com o fundador**

| Critério | WhatsApp direto |
|----------|----------------|
| Friction para o usuário | Mínima (já usa WhatsApp) |
| Velocidade de resposta | Imediata |
| Estrutura | Baixa (conversa livre) |
| Capacidade | 5–15 usuários (beta fechada) |
| Custo | Zero |
| Requer conta/login | Não |

Para beta fechada com até 15 síndicos, WhatsApp direto é superior a formulários porque:
- Síndicos são pessoas ocupadas — menor atrito = mais feedback
- Permite follow-up imediato ("você pode me mostrar como aconteceu?")
- Naturalidade da conversa revela mais do que respostas de formulário

**Opção secundária (caso fundador prefira estrutura):** Google Forms com link privado compartilhado individualmente.

---

## 3. Perguntas qualitativas para entrevista após 7 dias de uso

Fazer por WhatsApp ou chamada de 10 minutos. Máximo 5 perguntas.

### Perguntas abertas

1. **"Você usou o assistente alguma vez? Me conta o que aconteceu."**
   → objetivo: entender o fluxo real de uso, não o fluxo imaginado

2. **"Teve alguma situação em que você queria uma resposta e o app não ajudou?"**
   → objetivo: identificar lacunas da KB e categorias de fallback real

3. **"Teve alguma coisa que te pareceu confusa ou fora do lugar?"**
   → objetivo: friction points de UX/copy

4. **"Você configurou as datas do condomínio? (AVCB, seguro, assembleia)**"
   → objetivo: medir ativação do monitoramento

5. **"Você indicaria para outro síndico que você conhece? Por quê sim ou por quê não?"**
   → objetivo: NPS qualitativo e posicionamento percebido

### O que NÃO perguntar

- "O que você acha do design?" — muito abstrato, não gera dado acionável
- "O que você gostaria que tivesse no app?" — vai gerar wish list, não prioridade real
- "Você usaria todos os dias?" — pergunta hipotética, resposta não confiável

---

## 4. Métricas mínimas para a beta fechada

Acompanhar via painel `/admin` + Supabase telemetria:

| Métrica | Como medir | Meta |
|---------|-----------|------|
| Ativação | Evento `onboarding_completed` | > 60% dos convidados |
| Retenção D7 | Session_open 7 dias após primeiro acesso | > 20% |
| Uso do assistente | Eventos `query_submitted` por usuário | > 3 por semana |
| Fallback rate | `query_fallback` / total queries | < 40% |
| Adoção do monitoramento | Evento `memoria_saved` | > 40% |
| NPS qualitativo | Pergunta 5 da entrevista | > 60% indicariam |

---

## 5. Como coletar bug report pelo WhatsApp

Quando um usuário relatar um problema:

1. **Perguntar:** "Você pode me descrever o que aconteceu, passo a passo?"
2. **Perguntar:** "Você estava em qual tela quando isso aconteceu?"
3. **Perguntar:** "O que você esperava que acontecesse versus o que aconteceu?"
4. **Pedir screenshot** se o problema for visual
5. **Perguntar:** "Aconteceu uma vez ou toda vez?"

Registrar em documento interno por categoria:

| Categoria | Descrição | Ação |
|-----------|-----------|------|
| Bug | Comportamento incorreto ou crash | Corrigir na próxima fase |
| Fricção | Algo que funciona mas confunde | Avaliar copy/UX na próxima fase |
| Feature request | Algo que não existe | Registrar; não prometer implementação |
| Dúvida de uso | Usuário não entende como usar | Avaliar onboarding/copy |

---

## 6. Como separar os tipos de feedback

```
Bug:            "O app travou quando eu cliquei em X"
Fricção:        "Eu não sabia que tinha que clicar em Y"
Feature request: "Seria legal se tivesse Z"
Dúvida de uso:  "Não entendi onde fica W"
```

**Regra de ouro:** registrar tudo, priorizar bugs e fricção, adiar feature requests.

---

## 7. Como não prometer correção imediata

Quando um usuário relatar algo problemático:

✓ Adequado: "Entendi, obrigado por reportar. Vou analisar isso."
✓ Adequado: "Esse é um ponto importante. Estou anotando para melhorar."
✗ Evitar: "Vou corrigir isso hoje."
✗ Evitar: "Sim, vou adicionar isso na próxima semana."

Prometer datas cria expectativa que pode frustrar o usuário se não cumprir.

---

## 8. Como encerrar uma rodada de beta

A rodada beta fechada com 5–15 síndicos deve durar **4–6 semanas**. Encerrar quando:

1. Pelo menos 3 dos primeiros 5 voltaram sem ser lembrados (retenção orgânica)
2. Fallback rate estabilizou (não está mais caindo — KB atingiu cobertura suficiente)
3. Todos os bugs reportados foram documentados
4. Entrevistas de encerramento com os 5 primeiros usuários concluídas

### Encerramento formal

1. Agradecer cada usuário individualmente pelo WhatsApp
2. Compartilhar o que foi melhorado com base no feedback deles
3. Perguntar se podem indicar 1-2 colegas síndicos para a próxima rodada

---

## 9. Reforço: beta ainda não começa agora

**Critérios não cumpridos ainda (2026-05-16):**

- [ ] Teste PWA físico (Android + iOS) — pendente
- [ ] Supabase configurado — pendente
- [ ] Auditoria /admin ao vivo com recall ≥ 75% — pendente
- [ ] Revisão jurídica dos documentos legais — pendente externo
- [ ] Canal de feedback definido — este documento define; implementar quando os anteriores estiverem ok

**Próxima ação:** executar os 4 itens acima antes de convidar qualquer síndico.

---

## 10. Mensagem de convite sugerida (rascunho)

> Oi [Nome], tudo bem?
>
> Estou desenvolvendo um app para síndicos — o Amigo do Prédio — e estaria feliz se você pudesse dar uma olhada antes do lançamento. É um assistente para dúvidas do dia a dia de gestão condominial: multas, obras, assembleias, funcionários, inadimplência.
>
> Sem nenhum compromisso — só quero saber se é útil para quem realmente gerencia um condomínio. Posso te mandar o link?

Adaptar conforme o síndico. Não descrever como "beta" — usar "testar antes do lançamento".

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 39)*
*Revisar e atualizar antes de enviar o primeiro convite.*
