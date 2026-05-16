# Resultado da Auditoria /admin — Fase 39
## Amigo do Prédio

> **Data:** 2026-05-16
> **Fase:** 39

---

## 1. Status da auditoria ao vivo

**A auditoria ao vivo em `/admin` NÃO foi executada nesta fase.**

Motivo: a auditoria requer interação com navegador em ambiente de desenvolvimento rodando (`npm run dev` ou URL de produção). O ambiente desta sessão não tem acesso a navegador.

---

## 2. Como rodar a auditoria (instrução para o fundador)

1. Rodar `npm run dev` ou acessar URL de produção
2. Navegar para `/admin`
3. Em dev: painel abre diretamente (sem senha se `NEXT_PUBLIC_ADMIN_KEY` não configurada)
4. Em prod: inserir o valor de `NEXT_PUBLIC_ADMIN_KEY`
5. Rolar até a seção **"Auditoria do Assistente"**
6. Clicar em **"Rodar auditoria"**
7. Aguardar resultado (< 1 segundo)
8. Registrar números na tabela abaixo e atualizar este documento

---

## 3. Resultados projetados (referência — auditoria offline Fase 37)

| Métrica | Resultado offline Fase 37 | Meta | Status |
|---------|---------------------------|------|--------|
| Total de casos | 83 | — | — |
| PASS | 72 | ≥ 63 (75%) | projetado ok |
| REVIEW | 11 | — | — |
| FAIL | 0 | 0 | projetado ok |
| Recall A (resposta direta) | 64/64 (100%) | 100% | projetado ok |
| Recall B (fallback aceitável) | 8/15 (53%) | — | informativo |
| Bloqueio C | 4/4 (100%) | 100% | projetado ok |
| Taxa de acerto geral | 87% (72/83) | ≥ 75% | projetado ok |

---

## 4. Tabela para preenchimento após auditoria ao vivo

> Preencher após rodar em /admin:

| Métrica | Resultado ao vivo | Meta | Status |
|---------|-------------------|------|--------|
| Total de casos | — | — | — |
| PASS | — | ≥ 63 (75%) | — |
| REVIEW | — | — | — |
| FAIL | — | 0 | — |
| Recall A | — | 100% | — |
| Bloqueio C | — | 100% | — |
| Taxa geral | — | ≥ 75% | — |

---

## 5. O que fazer se o resultado for diferente do projetado

### Se Recall A < 100%

Indica regressão. Verificar:
1. Qual pergunta do tipo A retornou fallback
2. Rodar manualmente no app para confirmar
3. Verificar se algum sinônimo ou keyword foi removido
4. **Não reescrever o motor** — apenas adicionar keyword/sinônimo se necessário

### Se Bloqueio C < 100%

Crítico. Indica que o motor está retornando resposta para pergunta fora-do-escopo. Verificar:
1. Qual pergunta C passou como A
2. Verificar DOMAIN_ANCHOR_WORDS em lib/data.ts
3. Abrir issue e documentar antes de corrigir

### Se taxa geral < 75%

Analisar quais casos novos estão em REVIEW. Classificar se:
- O motor retornou a resposta certa (classificação B está errada → corrigir AUDIT_CASE para A)
- O motor retornou resposta errada (bug real → documentar para próxima fase)

### Se taxa geral ≥ 75% (esperado)

Confirmar que está tudo ok. Atualizar tabela acima com os resultados.

---

## 6. Pendência para próxima sessão

- [ ] Rodar auditoria ao vivo em /admin
- [ ] Preencher tabela da seção 4
- [ ] Se houver regressão: documentar e abrir issue
- [ ] Se estiver ok: marcar grupo 17 do checklist RC como verde

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 39) — pendente execução manual*
