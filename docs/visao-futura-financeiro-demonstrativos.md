# Visão Futura — Módulo Financeiro e Demonstrativos

> **Documento estratégico interno — Fase 42**
> Registra o raciocínio por trás da ausência intencional de funcionalidades financeiras no produto atual
> e define critérios para avaliação futura — quando e como entrar nesse território.

---

## Por que financeiro não está no produto atual

O síndico voluntário tem problemas financeiros reais: entender a prestação de contas da administradora,
saber se a cota de condomínio está adequada, calcular o impacto de uma obra no rateio.

Mas o produto atual deliberadamente não entra nesse domínio. Os motivos:

1. **Dados que o produto não tem.** Para qualquer análise financeira útil, o app precisaria do histórico
   de receitas, despesas, inadimplência e saldo do condomínio — dados que vivem no sistema da administradora
   ou em planilhas locais. Sem esses dados, qualquer módulo financeiro seria um formulário vazio.

2. **Complexidade desproporcional ao valor gerado.** Um DRE condominial requer estrutura de dados
   completamente diferente da memória operacional atual. O custo de implementação (estrutura, validação,
   UX de entrada de dados) seria alto para um benefício incerto.

3. **Risco de parecer ERP.** O produto deve ser percebido como copiloto operacional, não como sistema
   de gestão financeira. Funcionalidades de ERP mudam a percepção do produto e aumentam a fricção de adoção.

4. **Dados financeiros exigem cuidado com LGPD.** Qualquer dado financeiro coletado (valores de cota,
   inadimplência por unidade, histórico de despesas) é sensível e exigiria revisão jurídica adicional.

---

## Funcionalidades potencialmente úteis (futuro)

### 1. Leitura do demonstrativo da administradora

**O problema real:** o síndico recebe um PDF ou planilha da administradora todo mês e não sabe
se os números estão certos ou se há algo a questionar.

**O que o produto poderia fazer:**
- Checklist de itens para verificar no demonstrativo mensal ("o fundo de reserva foi reposto?",
  "há despesas acima do orçamento aprovado?", "a inadimplência aumentou?")
- Glossário dos termos financeiros mais comuns na prestação de contas
- Orientação sobre o que questionar na assembleia de aprovação de contas

**O que o produto NÃO faria:**
- Importar ou processar o demonstrativo (OCR, upload de PDF)
- Calcular DRE automaticamente
- Armazenar valores financeiros do condomínio

**Complexidade:** baixa — seria um checklist guiado e glossário contextual, sem dados financeiros locais.
**Quando avaliar:** quando síndicos beta relatarem esse como problema frequente.

---

### 2. Previsão orçamentária simplificada

**O problema real:** o síndico precisa apresentar uma previsão de receitas e despesas para o ano
na AGO, mas não tem referência de como montar isso.

**O que o produto poderia fazer:**
- Checklist das categorias de despesa mais comuns em condomínios (limpeza, manutenção, portaria,
  energia, água, seguro, AVCB, administração, fundo de reserva)
- Orientação sobre quais despesas são obrigatórias e quais são opcionais
- Cálculo de rateio simplificado: total de despesas ÷ número de unidades = cota mínima

**O que o produto NÃO faria:**
- Gerar o documento da previsão orçamentária
- Armazenar o histórico de despesas reais
- Calcular variações ou projeções complexas

**Complexidade:** baixa a média — cálculo simples, sem estado persistido.
**Quando avaliar:** depois de validar retenção com síndicos beta.

---

### 3. Cálculo de reajuste de cota

**O problema real:** a cada ano o síndico precisa decidir se reajusta a cota de condomínio
e em quanto, mas não tem referência de como calcular isso.

**O que o produto poderia fazer:**
- Calculadora simples: cota atual + % de reajuste = nova cota, com total mensal estimado
- Referência de índices de reajuste comuns (INPC, IPCA, IGP-M) — apenas informativos, sem API
- Orientação sobre como apresentar o reajuste em assembleia (quórum, documentação)

**O que o produto NÃO faria:**
- Buscar índices de inflação em tempo real (sem backend)
- Armazenar histórico de reajustes
- Gerar documentos de comunicação de reajuste (isso seria um comunicado — pode ir para ComunicadoPanel)

**Complexidade:** baixa — cálculo simples com inputs manuais.
**Quando avaliar:** quando o SimuladorMulta tiver boa taxa de uso (indica que síndicos valorizam calculadoras).

---

## Critérios para entrar no território financeiro

Antes de implementar qualquer funcionalidade financeira:

1. **Síndicos beta relatam espontaneamente essa dor** — não esperar que surja de pesquisa interna.
2. **A funcionalidade não requer dados externos** — nenhuma API, nenhum upload de arquivo.
3. **A funcionalidade é substituível por orientação textual** — se um bom checklist ou orientação
   no Assistente resolve, não construir a feature.
4. **Bundle e arquitetura suportam** — sem ultrapassar 230 kB na rota principal.
5. **Revisão jurídica se houver dados sensíveis** — qualquer dado financeiro por unidade exige revisão.

---

## O que está disponível hoje

### Simulador de Multa/Juros (Fase 5)
Cobre o território financeiro mais simples:
- Cálculo de multa (porcentagem sobre a cota)
- Cálculo de juros (juros simples mensais)
- Estimativa de correção por meses de atraso

### Simulador de Reajuste de Cota (Fase 42)
Concretiza o item 3 acima. Campos: arrecadação mensal, despesa média, nº de unidades,
inadimplência (%), aumento previsto de despesas (%), reforço de reserva, cota atual (opcional).

Outputs:
- Arrecadação líquida estimada (desconta inadimplência)
- Despesa projetada (aplica crescimento + reforço)
- Balanço projetado (déficit ou superávit)
- % mínimo de reajuste necessário
- Nova cota estimada (quando cota atual informada)

Disclaimers explícitos: não substitui previsão orçamentária oficial, administradora, contador,
extratos reais ou aprovação em assembleia.

Essa é a base. Qualquer expansão financeira deve agregar valor distinto ao que já existe,
não duplicar nem complicar o que funciona.

---

## Posição estratégica

O Amigo do Prédio não é — e não deve virar — um sistema financeiro condominial.
Esses sistemas (Superlógica, Adminstradora digital, etc.) já existem, têm equipes dedicadas
e profundidade de dados que um app de síndico não consegue competir.

O produto compete no gap que esses sistemas deixam: a orientação operacional do dia a dia,
a antecipação de problemas, a documentação para agir com segurança.
Financeiro só entra se resolver esse gap — não se criar um novo sistema.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 42)*
