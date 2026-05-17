# Tese: Tempo até o Alívio

> **Documento interno — Fase 43**
> Define "tempo até o alívio" como a métrica emocional central do Amigo do Prédio,
> explica por que velocidade pura não é suficiente, e descreve como reduzir o tempo real de resolução.

---

## O que é "tempo até o alívio"

Síndicos não abrem o Amigo do Prédio por curiosidade. Eles abrem porque algo aconteceu.

Um morador ligou furioso. Uma infiltração apareceu no forro. O funcionário não veio. A assembleia está marcada e ninguém sabe o quórum.

O estado emocional do síndico quando abre o app não é de curiosidade — é de **tensão**.

**Tempo até o alívio** é o intervalo entre:
- `t₀` — o síndico abre o app com um problema
- `t₁` — o síndico fecha o app sabendo o que fazer e se sentindo seguro para agir

Não é o tempo até ver uma resposta. É o tempo até sentir que pode agir com segurança.

---

## Por que velocidade pura não é suficiente

Um assistente que responde em 0,1 segundos com uma resposta vaga não alivia.
Um assistente que responde em 3 segundos com orientação precisa + próximo passo concreto + texto pronto alivia.

A equação correta não é:

> `tempo de resposta` = velocidade de exibição do texto

É:

> `tempo até alívio` = (tempo de acesso) + (tempo de leitura) + (tempo de entendimento) + (tempo até ação) + (fricção de dúvida residual)

Cada componente tem um responsável no produto:

| Componente | Responsável no produto |
|-----------|------------------------|
| Tempo de acesso | PWA (sem store, abre em 1 clique), chips situacionais (sem digitar) |
| Tempo de leitura | Texto conciso, hierarquia visual clara |
| Tempo de entendimento | Base legal explícita, não presumida |
| Tempo até ação | "Próximo passo" explícito, CTA de comunicado/checklist |
| Fricção de dúvida residual | Disclaimer calibrado (não excessivo, não omisso) |

---

## O problema do alívio falso

Existe um risco simétrico ao "não ajudou": o alívio falso.

Um assistente que responde "pode fazer isso" com afirmação absoluta alivia momentaneamente — mas expõe o síndico a risco real se a afirmação estava errada ou dependia da convenção específica.

**Alívio falso é pior que nenhum alívio.** O síndico age, se expõe, e quando a situação vai para assembleia ou juízo, descobre que a orientação estava incompleta.

Por isso o Amigo do Prédio tem três camadas de calibração:

1. **Resposta principal** — direta, honesta sobre o que a lei diz em geral
2. **Base legal** — mostra de onde vem a orientação (não inventada)
3. **Disclaimer calibrado** — "situações específicas podem exigir análise da convenção ou assessoria"

O disclaimer não é burocracia. É o que diferencia uma orientação responsável de uma afirmação imprudente.

---

## As 5 intervenções que mais reduzem o tempo até o alívio

### 1. Chips situacionais no ponto de entrada

Antes da Fase 43, o síndico em crise chegava ao app e via "Ativar monitoramento do prédio" como ação principal. Isso exigia:
- Ignorar o CTA principal
- Encontrar o AskInput
- Formular a pergunta do zero
- Digitar

Com os chips situacionais no Hero (Fase 43):
- Ver um chip que descreve a situação vivida
- Um clique → resposta

Redução estimada: 30–60 segundos de acesso + formulação.

### 2. Placeholder do AskInput no modo situacional

"Ex: Posso aplicar multa sem assembleia?" — abstrato.
"Ex: Morador fez obra sem avisar. O que faço?" — situacional.

O placeholder situacional ativa o modo mental correto: "esse app entende meu problema como síndico, não apenas como tema jurídico abstrato."

### 3. "Próximo passo" explícito na resposta

Antes: resposta → base legal → dica (quando existia) → botões de ação
Depois: resposta → base legal → dica → **próximo passo** (quando sem dica) → botões de ação

O "próximo passo" é diferente da dica. Ele responde a uma pergunta diferente:
- Dica: "o que sei que ajuda nessa situação?"
- Próximo passo: "o que faço agora, hoje, com esse problema?"

### 4. Cards situacionais no QuickAccessCards

Antes: "Multas e advertências" (categoria abstrata)
Depois: "Morador faz barulho toda noite. Posso multar?" (situação real)

O usuário reconhece a situação, não apenas o tema. Reconhecimento → clique imediato. Sem reconhecimento → hesitação → abandono.

### 5. CTAs de Ferramentas integrados na resposta

Quando a resposta sugere uma ação que o produto suporta (gerar comunicado, usar checklist), o CTA aparece inline na resposta. Sem ele, o usuário precisaria:
- Lembrar que existe uma aba Ferramentas
- Navegar até lá
- Encontrar o modelo certo
- Preencher os campos

Com o CTA inline, o caminho é direto da orientação para a ação.

---

## O que é diferente do ChatGPT

ChatGPT responde mais perguntas. O Amigo do Prédio resolve mais situações.

A diferença não é o tamanho da base de conhecimento — é a estrutura da resposta.

| Dimensão | ChatGPT | Amigo do Prédio |
|----------|---------|-----------------|
| Escopo | Qualquer assunto | Gestão condominial |
| Resposta | Texto livre | Orientação + base legal + próximo passo |
| Contexto | Nenhum | Perfil do condomínio + datas cadastradas |
| Alívio | Informativo | Operacional |
| Ação | O usuário precisa traduzir | Próximo passo explícito + texto pronto |
| Antecipação | Nenhuma | GuidancePanel monitora vencimentos |
| Tom | Assistente geral | Copiloto do síndico |

O Amigo do Prédio não é "ChatGPT para condomínio." É a diferença entre um médico que explica a doença e um enfermeiro que lhe diz o que tomar e quando voltar.

---

## Métricas operacionais do tempo até o alívio

Sem telemetria de comportamento em tempo real (Supabase ainda em modo silencioso), as métricas são proxies:

| Proxy | O que mede | Alvo |
|-------|-----------|------|
| Clique em chip situacional (Hero ou QuickAccessCards) | Usuário reconheceu a situação sem digitar | > 30% das sessões com resposta |
| Resposta favorita | Usuário considerou a resposta útil o suficiente para salvar | > 15% das respostas |
| CTA de comunicado clicado | Usuário foi da orientação à ação | > 20% nas categorias cobertas |
| Sessões com pergunta única (sem reformulação) | Usuário não precisou reformular | > 60% das sessões |
| Sessões que terminam em fallback | Usuário não encontrou resposta | < 20% |

---

## O que ainda aumenta o tempo até o alívio (problemas não resolvidos)

1. **Fallback sem resposta** — maior ponto de atrito do produto. Usuário foi atrás de alívio e não encontrou. Parcialmente mitigado pelos chips de sugestão contextual, mas ainda não resolvido.

2. **Onboarding longo antes do valor** — usuário com crise ativa não vai preencher 10 campos antes de ver valor. Os chips situacionais no Hero resolvem parcialmente — mas o GuidancePanel (o recurso mais valioso) só aparece após o onboarding.

3. **Resposta muito longa para leitura rápida** — quando a resposta tem muitos parágrafos, o síndico em crise não lê tudo. O "Próximo passo" ajuda, mas a posição ainda é depois de base legal e dica. Oportunidade futura: mover o "próximo passo" para logo após a resposta principal (antes da base legal).

4. **Sem contexto da convenção** — a base de conhecimento orienta pela lei, mas a resposta correta frequentemente depende do que diz a convenção específica do condomínio. Sem isso, o disclaimer "verifique na convenção" é necessário mas aumenta a dúvida residual.

---

## Conclusão: a tese

O Amigo do Prédio compete no tempo entre o problema e a ação segura.

Não compete no tamanho da base de conhecimento.
Não compete no número de features.
Não compete no preço.

Compete na capacidade de transformar a tensão do síndico em direção clara em menos de 90 segundos.

Cada decisão de produto deve ser avaliada contra essa pergunta: **isso reduz o tempo até o alívio?**

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 43)*
