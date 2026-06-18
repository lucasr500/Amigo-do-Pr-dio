# Checklist de QA — Coerência da opção A por persona

> **Objetivo:** validar que a nova arquitetura (barra opção A, abas Comunidade/Ajustes, realocações, deep-links, copy) está coerente e segura **para cada papel** antes de empilhar feature nova.
> **Foco crítico:** visibilidade por papel — o que cada persona vê e, sobretudo, **o que NÃO pode ver**. Vazamento de dado de gestão para morador é falha de invariante, não bug menor.
> **Como pontuar:** cada item é **GO** (ok) ou **NO-GO** (anota o quê + persona + aba). Qualquer NO-GO de vazamento por papel bloqueia o aceite.
> **Como testar:** entrar/alternar como cada papel (morador, síndico, conselho, funcionário) e percorrer as 5 abas. Onde não der para logar como o papel, marcar "não testável agora" e mandar o Claude Code cobrir por teste.

---

## A. Transversal (vale para todos os papéis)

- [ ] A barra mostra exatamente **5 itens, nesta ordem**: `Início · Memória · [Perguntar] · Comunidade · Ajustes`.
- [ ] **"Mais" não existe** em lugar nenhum (nem item de barra, nem atalho).
- [ ] **Nenhuma tela em branco / 404 / "rota não encontrada"** ao abrir qualquer aba ou seguir qualquer atalho.
- [ ] Copy nova aplicada: **"Ajustes"** (não "Mais"), **"Comunidade"** (aba nova), **"Guia de situações"** (não "Decisões do síndico" / "Biblioteca de decisões").
- [ ] **[Perguntar] é slot inerte:** abrir não aciona IA, não chama rede de IA, não gera resposta. Mostra apenas o estado "em breva/desligado" previsto. Nada de IA ligado.
- [ ] Nenhuma flag de exposição/IA visível como ligada na experiência.

---

## B. Matriz por persona — o que CADA aba deve (e não deve) mostrar

> Marque GO/NO-GO por célula. A coluna **🚫 Não pode aparecer** é a mais importante.

### B.1 Morador (condômino) — persona prioritária
- [ ] **Início ("Hoje"):** vê o resumo do dia filtrado para morador (avisos, eventos, o que lhe diz respeito). 🚫 Não pode aparecer: tarefas de gestão, painel de síndico, pendências administrativas.
- [ ] **Memória:** vê documentos e linha do tempo **na visão de morador** (só o que tem permissão). 🚫 Não pode aparecer: documentos restritos a gestão/conselho.
- [ ] **Comunidade → Transparência:** vê **apenas o agregado** (prestação de contas consolidada). 🚫 Não pode aparecer: **inadimplência por unidade**, dado individualizado, revisão detalhada de gestão.
- [ ] **Comunidade → Comunicação:** vê mural/comunicados conforme papel.
- [ ] **Ajustes:** vê **só** conta, perfil, notificações, backup/integridade. 🚫 Não pode aparecer: **Funcionários, Implantação**, configurações de gestão.

### B.2 Síndico
- [ ] **Início ("Hoje"):** vê o painel operacional do síndico (pendências, decisões, alertas de gestão).
- [ ] **Memória:** vê documentos/timeline em visão de gestão (escopo ampliado).
- [ ] **Comunidade → Transparência:** vê o agregado **+ a camada de gestão (Revisão detalhada)** — o detalhe completo da prestação de contas.
- [ ] **Ajustes:** vê conta/perfil **+ Funcionários + Implantação**. 🚫 Confirmar que essas seções **não** vazam para morador (cruzar com B.1).
- [ ] **Guia de situações:** acessível e com o novo nome.

### B.3 Conselho
- [ ] **Comunidade → Transparência:** vê a camada de gestão/detalhe (fiscalização). 🚫 Definir e verificar o limite: o que conselho vê vs. síndico (ex.: edita vs. só lê).
- [ ] **Memória:** escopo de conselho (documentos de fiscalização/atas). 🚫 Não pode aparecer o que for exclusivo do síndico, se houver essa distinção.
- [ ] **Ajustes:** confirmar se conselho vê Funcionários/Implantação ou não (decisão de papel — **se não estiver definido, sinalizar**).

### B.4 Funcionário
- [ ] **Início ("Hoje"):** vê só o escopo operacional dele. 🚫 Não pode aparecer: transparência financeira, gestão de funcionários, dados de moradores além do necessário.
- [ ] **Comunidade → Transparência:** 🚫 confirmar que funcionário **não** vê prestação de contas/financeiro (a menos que decidido o contrário — se indefinido, sinalizar).
- [ ] **Ajustes:** só conta/perfil próprios. 🚫 Não pode aparecer: Funcionários, Implantação.

---

## C. Deep-links reapontados — origem → destino esperado

> Acionar cada um e confirmar que leva ao destino certo, **sem órfão e respeitando o papel**.

- [ ] `memoria-institucional` → **Memória** (ok, sem 404).
- [ ] `central-digital` → **Comunidade** (ok, sem 404).
- [ ] `dados` → **Ajustes** (ok, sem 404).
- [ ] `onOpenMonthlyReview` → **Transparência em Comunidade, camada de gestão** (NÃO "Hoje", NÃO Memória). Confirmar que, para morador, esse atalho não expõe o detalhe de gestão.
- [ ] Qualquer outro atalho remanescente do mapa original (varrer os 7+): cada um resolve para destino válido.

---

## D. Bloco para o Claude Code — smoke tests de navegação a automatizar

> Travar regressão: transformar o acima em testes que rodam no `vitest`/CI.

- [ ] Teste: a barra renderiza os 5 itens da opção A na ordem certa, e **não** renderiza "Mais".
- [ ] Teste: para cada papel (morador/síndico/conselho/funcionário), montar cada aba **não lança** e **não** renderiza seções proibidas àquele papel (asserts de ausência).
- [ ] Teste: morador na Transparência **não** vê dado por unidade/inadimplência (assert de ausência do componente de detalhe).
- [ ] Teste: cada deep-link da seção C resolve para a rota esperada (assert de destino), e nenhuma rota órfã existe.
- [ ] Teste: [Perguntar] monta em estado inerte e **não** dispara chamada de IA (mock/spy: zero chamada).
- [ ] Manter o `tsc` como guarda de "zero link morto" (já comprovado no flip).

---

## E. Aceite

- [ ] **GO global** somente se: zero NO-GO de vazamento por papel (seção B), zero deep-link órfão (C), [Perguntar] inerte (A), copy nova aplicada (A).
- [ ] Itens "não testável agora" viram tarefa explícita para o Claude Code cobrir por teste (seção D).
- [ ] Pontos de papel **indefinidos** encontrados (ex.: limites de conselho/funcionário na Transparência) → trazer para decisão do Lucas, não improvisar no código.

---

### Observação honesta
Este checklist foi montado a partir da **arquitetura conhecida** (opção A + realocações + deep-links + invariantes de papel), não de uma leitura do código tela a tela. Onde os limites de papel de **conselho** e **funcionário** não estiverem cravados, o item correto é **sinalizar para decisão** — não assumir. Esses dois papéis são o ponto mais provável de achar uma indefinição.
