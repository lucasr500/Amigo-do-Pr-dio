# Roadmap Pré-Lançamento — Amigo do Prédio

> **Critérios claros de "pronto para beta".**
> O produto está em fase de lapidação silenciosa. Este documento define o que
> precisa estar sólido antes de convidar os primeiros usuários externos.

---

## Critérios de beta

### Motor de respostas
- [x] Recall A (resposta direta): 100% — sem falso negativo nas perguntas diretas (Fase 33)
- [x] Sem falso positivo em categorias de alto risco (Fase 33: CNH bloqueada, LGPD, trabalhista ok)
- [x] Base de conhecimento: lacunas 1–4 preenchidas (Fase 32): advertência, desempate, documentação, Airbnb
- [x] Bloqueio de fora-do-escopo: 100% (4/4 casos de teste) — Fase 33
- [x] KB com guia de qualidade editorial (Fase 34): `docs/guia-qualidade-editorial-kb.md`
- [x] 5 novas lacunas editoriais resolvidas (Fase 34): emergência, subsíndico, multa inválida, dano vizinho, animal locatário
- [x] KB preparada para RAG futuro — documentação estrutural pronta (Fase 34)
- [ ] Recall geral ≥ 75% no painel /admin (projetado ~87% com AUDIT_CASES Fase 33 — verificar ao vivo)
- [ ] Confidence gap calibrado: < 20% de respostas borderline na auditoria

### Produto / experiência
- [x] Fluxo de onboarding completo funciona sem instrução: novo usuário → ativa monitoramento em < 3 min (Fase 35)
- [x] 4 abas navegáveis sem travamento ou estado inconsistente (Fase 35)
- [x] Backup exporta e importa sem perda de dados — bug crítico corrigido (Fase 35)
- [x] ComunicadoPanel gera e copia todos os 4 modelos sem erro (Fase 31)
- [x] ComunicadoPanel exibe hint quando perfil não tem nome do condomínio (Fase 32)
- [x] SimuladorMulta calcula corretamente para 1 e 12 meses (Fase 31)
- [x] SimuladorMulta não aceita cota negativa — clampado para 0 (Fase 32)
- [x] GuidancePanel mostra prioridades corretas com dados reais (Fase 35 — verificado)
- [x] CondominioStatusHeader reflete datas reais cadastradas (Fase 35 — verificado)
- [x] OnboardingProfile: perfil existente editável na aba Condomínio (Fase 35)
- [x] Hero: caminho para Assistente sem precisar cadastrar (Fase 35)

### Técnico
- [x] TypeScript: zero erros (`npx tsc --noEmit`) — confirmado Fase 35
- [x] Build: Compiled successfully sem warnings críticos — confirmado Fase 35
- [x] Sem crash ao navegar entre abas sem dados cadastrados (Fase 35 — verificado)
- [x] Sem crash ao importar backup inválido (Fase 35 — verificado)
- [ ] localStorage não excede limites típicos (< 200 KB de dados por usuário)
- [x] PWA instalável no Android e iOS — ícones criados (Fase 36): icon-192, icon-512, apple-touch-icon — verificar em dispositivo real

### Conteúdo legal
- [ ] Disclaimer jurídico visível e claro em toda resposta do Assistente
- [ ] Sem resposta que afirme "pode fazer X" sem mencionar que depende da convenção
- [ ] Dados sensíveis (LGPD, trabalhista, financeiro) com aviso de "consulte especialista"

---

## Fases de lançamento

### Fase Alpha (onde estamos)
- Fundador testa todas as funcionalidades
- Identifica bugs e inconsistências antes de qualquer usuário externo
- Sem pressão de feedback, sem compromisso de suporte
- Dura: até critérios de beta acima estarem todos verdes

### Fase Beta Fechada (próximo passo)
- 5–15 síndicos convidados manualmente
- Perfil: síndico voluntário, prédio residencial, São Paulo ou grande cidade
- Modo: uso real, sem roteiro, sem orientação (teste de naturalidade)
- Coleta: telemetria + entrevistas curtas após 2 semanas
- Critério de sucesso: pelo menos 3 síndicos voltam sem ser lembrados
- Duração: 4–6 semanas

### Fase Beta Aberta
- Landing page pública com formulário "quero testar"
- Lista de espera, convites em lotes
- Foco: volume de feedback, não viral
- Monitora: taxa de ativação (cadastra dados do prédio?), retenção D7, categorias de pergunta mais comuns
- Critério de sucesso: NPS > 40, retenção D7 > 25%

### Lançamento público
- Apenas quando produto for estável e monetização definida
- Foco inicial: síndicos voluntários (não administradoras)
- Canal: comunidades de síndicos no WhatsApp, grupos no Facebook, LinkedIn

---

## O que NÃO fazer antes do beta

- Não investir em marketing/SEO antes de ter produto sólido
- Não construir backend/login antes de validar retenção
- Não implementar LLM antes de atingir critérios do plano-ia-rag-futuro.md
- Não monetizar antes de ter ≥ 50 usuários ativos regulares
- Não publicar na App Store antes de ter feedback beta
- Não construir para administradoras antes de validar para síndicos individuais

---

## Sequência de trabalho recomendada (próximas semanas)

### Semana 1–2 (agora)
1. Rodar auditoria em /admin — identificar recall real
2. Preencher lacunas de alta prioridade (5 entradas na KB)
3. Testar fluxo completo sem dados: novo dispositivo → onboarding → consulta
4. Testar backup export/import

### Semana 3–4
1. Refinamento de copy e microcopy
2. Identificar e convidar 5 primeiros beta testers
3. Criar canal de feedback (WhatsApp direto ou Notion form)

### Semana 5–6
1. Coletar feedback dos primeiros 5 usuários
2. Ajustar com base no feedback real
3. Expandir para 15 usuários se os primeiros 5 forem positivos

---

## Métricas de acompanhamento (pós-beta)

| Métrica | Alvo beta | Alvo lançamento |
|---|---|---|
| Ativação (onboarding completo) | > 60% | > 75% |
| Retenção D3 | > 30% | > 40% |
| Retenção D7 | > 20% | > 30% |
| Recall do assistente | > 75% | > 85% |
| Fallback rate | < 40% | < 25% |
| NPS | > 30 | > 50 |

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 36)*
*Atualizar conforme marcos forem atingidos.*
