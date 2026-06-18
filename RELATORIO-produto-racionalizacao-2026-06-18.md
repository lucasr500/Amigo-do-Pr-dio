# Relatório de Produto — O que temos, e o que manter / adaptar / remover / incluir

**Data:** 2026-06-18 · **Base:** inventário real do código (abas, navegação, painéis) × objetivos canônicos do Notion (Direção Oficial junho/2026 + Tese consolidada 2026-06-17). Onde código e Notion divergem de OBJETIVO, o Notion manda; para "o que existe", o código manda.

---

## 1. Veredito (leia primeiro)

O Amigo do Prédio hoje são **dois produtos fundidos numa mesma casca**:

- **(A) Um cockpit operacional do síndico** — financeiro (caixa/contas/inadimplência), funcionários, agenda/vencimentos, simuladores, checklists, revisão mensal (×3 painéis), command center, health score, relatório AGO. Denso, completo, e em boa parte **território da administradora**.
- **(B) O segundo cérebro + rede social do condomínio** — Memória (assembleias, decisões, linha do tempo, documentos, fornecedores, continuidade), Comunicação (mural, canal, enquetes, reservas, documentos públicos), separação jurídica de natureza. **É esta a direção canônica.**

A Tese é explícita: *"não competimos com a administradora (boleto, folha, financeiro). Somos a camada acima — integração, memória, governança e inteligência."* E o loop que filtra tudo é **informar → discutir → organizar → decidir → lembrar**.

**Conclusão:** o problema de "muita informação" não é estético — é **estrutural**. O app acumulou um cockpit operacional inteiro **e** duplicou metade dele dentro da aba "Mais". A racionalização não é cortar por cortar: é **promover B à espinha do produto, podar o que de A compete com a administradora ou só duplica, e adaptar o resto para servir memória/governança/comunicação.** Isso ataca diretamente os dois eixos mais fracos do seu placar — Apple-like (densidade/duplicação) e Personas — sem tocar a migração relacional que já corre por baixo.

**Sobre o financeiro (sua pergunta direta):** não, gestão financeira completa **não** é mais coerente com a visão. Mas **transparência / prestação de contas é** (é um pilar seu). Recomendação = **adaptar, não apagar**: trocar o módulo de *gestão* financeira por uma camada leve de *transparência* (publicar balancete/prestação no documento + visível ao morador), e fundir os simuladores no assistente. Detalhe na §5.

---

## 2. Inventário real — o que o app mostra hoje

### Síndico (navegação: Início · Memória · Perguntar · Pendências · Mais)

| Superfície | O que contém hoje |
|---|---|
| **Início** (HomeTab) | Cockpit: ManagerCockpitHero, Briefing do dia, Atividade recente, **Card de Assembleia (wedge)**, Ações recomendadas (Guidance), Plano mensal, Marcos, Card de revisão mensal, Card de memória institucional, Revisão semanal, Setup progressivo. Sub-telas: Saúde (health score), Pendências. |
| **Memória** (MemoriaTab) — *"segundo cérebro"* | Visão geral + Assembleias · Linha do tempo · Decisões · Documentos · Fornecedores · Continuidade (passagem de gestão) + copiar relatório institucional. |
| **Perguntar** (AssistantTab) | "Assistente condominial / Orientação do síndico": matcher determinístico sobre direito condominial genérico + cards e perguntas contextuais + histórico/favoritos. (IA externa gated off.) |
| **Pendências** | Lista de pendências/tarefas. |
| **Mais** (CondominioTab) | **Nove seções:** Meu prédio (perfil+memória) · Comunicação/Central Digital (Hub, Mural, Canal, Reservas, Enquetes, Documentos, Linha do tempo, Relatório + seletor de papel) · Hoje e revisão (revisão mensal ×3) · **Memória institucional (Unidade, Fornecedores, Decisões, Continuidade)** · **Financeiro (gráfico, painel, inteligência, relatório AGO)** · **Documentos** · Gestão (Funcionários, timeline operacional) · Implantação · Backup e confiança (conta, integridade, backup, notificações, tendência de saúde) · Sobre. |
| **Agenda** (AgendaTab) | Agenda (stats, grade do mês, mensal, agenda do prédio) · Vencimentos · Reservas. |
| **Ferramentas** (ToolsTab) — *"Central de ações"* | Rotina (registro rápido, agenda, command center) · Comunicados · **"Financeiro rápido" (simulador de multa + reajuste de cota)** · Checklists · Inteligência (painel operacional + guia de decisões do síndico). |

### Morador (navegação: Início · Mural · Canal · Agenda · Info)
Home do morador (post em destaque + selo de natureza), Mural/Comunicação em modo morador, Canal de solicitações, Agenda, Assistente ("Info").

---

## 3. O diagnóstico que ninguém vê de dentro: duplicação

O mesmo conteúdo aparece em três, às vezes quatro caminhos. É a causa raiz da sobrecarga:

| Conteúdo | Aparece em |
|---|---|
| **Decisões** | Memória → Decisões · "Mais" → Memória institucional → Decisões · Ferramentas → Inteligência → "Decisões do síndico" (guia Q&A, nome colidente) |
| **Documentos** | Memória → Documentos · "Mais" → Documentos · "Mais" → Comunicação → Documentos públicos (dois sistemas distintos: essenciais × públicos) |
| **Linha do tempo** | Memória → Linha do tempo · "Mais" → Comunicação → Linha do tempo · "Mais" → Gestão → timeline operacional (institucional × operacional) |
| **Memória institucional inteira** | aba **Memória** dedicada **e** seção dentro de "Mais" |
| **Revisão mensal** | cards no Início · três painéis em "Mais" |
| **Agenda do prédio** | aba **Agenda** · dentro de Ferramentas → Rotina |

A aba **"Mais" virou um segundo aplicativo inteiro** — e duplica o que já tem casa própria. É aqui que "parece pronto, mas pesado" mora.

---

## 4. Matriz: manter / adaptar / remover-fundir / incluir

### ✅ MANTER (é a espinha — alinhado à Tese)
- **Memória (segundo cérebro):** Assembleias, Decisões, Linha do tempo institucional, Documentos, Fornecedores, Continuidade/Passagem, Histórico por unidade.
- **Comunicação (rede social):** Mural, Canal (solicitações), Enquetes, Reservas, Documentos públicos, Relatório da comunidade, seletor de papel.
- **Separação jurídica de natureza** (content-nature + selo) — já transversal.
- **Assembleia como wedge** (card no Início + hub na Memória).
- **Pendências** e um **Início enxuto** que responda "o que faço agora?".

### 🔁 ADAPTAR (manter o valor, mudar o enquadramento)
- **Financeiro → Transparência / Prestação de contas.** Remover gestão de caixa/contas/inadimplência como *gestão*; manter uma camada leve de *transparência* (publicar balancete/prestação como documento, visível por papel). Ver §5.
- **Funcionários → Registro de tarefas/ordens + comprovação.** A persona Funcionário quer "saber o que fazer e comprovar que fez" — não folha/férias/contratos (administradora). Adaptar para diretório leve + ordens de serviço com registro. Liga direto à camada social.
- **Simuladores (multa, reajuste)** → mover para dentro do **Assistente** como ações ("Pergunte ao Prédio" → simular). São leves e refletem seu DNA jurídico; não merecem uma categoria "Financeiro rápido" própria.
- **Agenda/Vencimentos** → manter prazos de governança/memória (AVCB, seguro, contratos, manutenção); podar vencimentos puramente financeiros (boletos).
- **"Hoje" (Briefing + Guidance + Revisão mensal + Plano + Command Center + Revisão semanal)** → **um só motor** de "o que fazer agora". Hoje são 5–6 engines sobrepostos.

### ✂️ REMOVER ou FUNDIR (duplicação e território da administradora)
- **Dissolver a aba "Mais"** como segundo app. Redistribuir: Comunicação vira destino de primeira classe; Memória institucional sai de "Mais" (já é a aba Memória); Backup/Conta/Notificações viram um **Ajustes** pequeno. O resto, cortar.
- **Remover a seção Financeiro de gestão** de "Mais" (vira Transparência, §5).
- **Unificar Documentos** num único sistema com visibilidade (essenciais + públicos = um só).
- **Unificar as duas Linhas do tempo** (institucional + operacional) numa só.
- **Remover o "Decisões do síndico" (guia Q&A)** de Ferramentas, ou fundir no Assistente — o nome colide com Decisões reais e confunde.
- **Colapsar os múltiplos cartões de revisão** num único fluxo.

### ➕ INCLUIR (lacunas vs. a visão)
- **"Pergunte ao Prédio" de verdade (maior oportunidade da Tese, gap nº 1):** o assistente hoje responde sobre direito condominial genérico, não sobre *os dados deste prédio*. Incluir o assistente contextual sobre os dados relacionais — **depois** da migração relacional (já em curso). Alta prioridade estratégica, sequenciada.
- **Profundidade da rede social:** onboarding e engajamento do morador, notificações da comunidade, o loop da assembleia exposto ao morador (pós-gate).
- **Transparência financeira** como feature de primeira classe (o "adaptar" do financeiro).
- **Persona Funcionário** como superfície real (ordens + comprovação).
- **Multi-persona real** (hoje o seletor *simula* papéis; o real depende do backend relacional — sequenciado).

---

## 5. A decisão do Financeiro (sua pergunta, respondida a fundo)

**O que existe:** `FinancialPanel` (caixa, contas, inadimplência), `FinancialIntelligencePanel`, `FinancialMonthlyChart`, `AgoReportPanel`, e os simuladores em Ferramentas.

**Tensão com a visão:** a Tese fixa, como anti-posicionamento *permanente*, não competir em "boleto, folha, financeiro". Gestão financeira é exatamente o forte da administradora e dos ERPs (uCondo, Superlógica). Manter um módulo de gestão financeira: (a) compete onde você decidiu **não** competir; (b) adiciona densidade pesada; (c) não serve o loop nem o wedge; (d) cria expectativa de exatidão contábil que você não quer sustentar.

**Mas** "transparência" é um pilar seu, e o morador *quer* saber para onde vai o dinheiro. A ponte é **transparência, não gestão**.

**Recomendação:**
1. **Aposentar** a gestão financeira (caixa/contas/inadimplência/inteligência) como módulo de *gestão*.
2. **Criar "Prestação de contas / Transparência"** na camada de Documentos+Comunicação: o síndico publica o balancete/relatório (documento ou resumo simples), com **visibilidade por papel** (a mesma régua de `visibility` que você acabou de aprovar para Decisões). O morador vê transparência; você não vira ERP.
3. **AGO/relatório** → folde na preparação da Assembleia (documento da pauta), não num motor financeiro.
4. **Simuladores** (multa = infração; reajuste = cota) → migram para o Assistente como ações. São baratos e jurídicos — o oposto de gestão financeira; **valem manter** nesse novo lugar.

Resultado: você honra transparência, corta a competição com a administradora, e tira uma das seções mais densas do app.

---

## 6. Proposta de arquitetura de informação (mais simples por fora)

A navegação atual já é boa ("segundo cérebro"); o problema é o que está **atrás** de "Mais". Proposta:

- **Início** — enxuto: "o que faço agora" (um motor), card da Assembleia, atalho de memória, pendências.
- **Memória** — o segundo cérebro (como está, é o ativo central).
- **Comunidade** — promover a Comunicação a destino de primeira classe (mural, canal, enquetes, reservas, transparência, documentos públicos). É metade da nova visão e hoje está enterrada.
- **Perguntar** — o Assistente (rumo ao "Pergunte ao Prédio" real).
- **Ajustes** — o que sobra de "Mais": conta, backup, integridade, notificações. Pequeno.

"Mais" deixa de ser um segundo app; vira Ajustes. Tudo que tem casa (Memória, Comunidade) sai de lá.

---

## 7. Contra-argumento e riscos (para você decidir com os dois lados)

- **Não esvazie o valor do síndico cedo demais.** A própria Tese diz que *o segundo cérebro conquista o direito à rede social* — o síndico/memória entram primeiro, monetizam já, com zero efeito de rede. Então: corte o que é território da administradora e o que é duplicação, mas **mantenha forte** o valor de governança/memória do síndico. Não é "virar só rede social"; é tirar o peso errado.
- **Financeiro como transparência pode ser um diferencial** (confiança do morador) — por isso *adaptar*, não deletar em bloco.
- **Sequenciamento:** os cortes de coerência/densidade (§3, §4-remover) são reversíveis e de alta alavancagem **agora**. As inclusões profundas (IA real, multi-persona) dependem da migração relacional **já em curso** — não bloqueie uma na outra.
- **Risco de remoção:** alguns síndicos gostam de um lugar único para anotações de caixa. Mitigação: a camada de transparência leve cobre o essencial sem virar gestão.

---

## 8. Próximos passos priorizados (alavancagem × risco)

1. **Matar a duplicação** (alto impacto, baixo risco, reversível): unificar Documentos, unificar Linhas do tempo, remover a Memória institucional duplicada de "Mais", colapsar os cartões de revisão. Pura coerência Apple-like.
2. **Dissolver "Mais" em Ajustes** e promover **Comunidade** a destino de primeira classe.
3. **Adaptar o Financeiro** para Transparência + mover simuladores ao Assistente.
4. **Adaptar Funcionários** para ordens+comprovação (persona Funcionário).
5. **Incluir** (sequenciado pós-relacional): "Pergunte ao Prédio" real, profundidade social do morador, multi-persona real.

Itens 1–4 são, em sua maioria, lib/** + components/** (reversíveis, testáveis) — cabem nas suas lanes atuais sem tocar o backend. O item 5 acompanha a migração relacional que você já autorizou.

**Decisões que dependem só de você:** (a) aposentar gestão financeira → transparência (sim/não); (b) promover Comunidade a aba de primeira classe (muda a navegação); (c) profundidade da persona Funcionário agora ou depois. O resto eu/Claude Code executa sob as invariantes de sempre (gated, testado, produção intocada).
