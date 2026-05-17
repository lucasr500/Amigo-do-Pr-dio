# Manual Interno do Fundador — Amigo do Prédio

> **Guia operacional para continuar o produto de forma autônoma.**
> Escrito para ser lido no início de qualquer nova sessão de trabalho.
> Assume que você sabe programar e quer saber *o que fazer*, não *como fazer*.

---

## Estado atual do produto (2026-05-17 — Fase 44)

### Bundle
- Rota principal (`/`): ≤ 221 kB First Load JS (margem ≥ 9 kB — confirmado Fase 44)
- Admin (`/admin`): 203 kB First Load JS
- TypeScript: zero erros
- Build: Compiled successfully

### Entregues na Fase 44
- **Validação interna:** 20 cenários do laboratório (Fase 43) avaliados — média 3.85/5. Zero falhas críticas. Resultado documentado em `docs/resultado-validacao-cenarios-fase-44.md`.
- **Matriz de maturidade aplicada:** 13 fluxos reavaliados. Resultado em `docs/resultado-matriz-maturidade-fase-44.md`.
- **Hero chips refinados:** chip 3 "Nome no grupo" → "Querem expor inadimplente" (label mais preciso). Chip 5 "Convocar assembleia" → "Vazamento entre apts." (crise > procedimento, score +0.5).
- **TOPICS lgpd:** examplePrompt mudou de duplicata do chip 3 para "Câmera no corredor: precisa de autorização?" — elimina redundância e cobre cenário C21.
- **TOPICS financeiro:** examplePrompt mudou de abstrato → "Como calcular o reajuste necessário da cota condominial?" — mais acionável, conecta ao SimuladorReajusteCota.
- **CAT_TO_NEXTACTION expandido:** +5 categorias — `cobranca`, `trabalhista`, `financeiro`, `areas-comuns`, `manutencao`. Total: 15 categorias com próximo passo.
- **CAT_TO_COMUNICADO expandido:** +`manutencao` (comunicado de serviço) e +`financeiro` (simular reajuste). Total: 9 categorias com bridge Assistente → Ferramentas.

### Entregues na Fase 43
- **Hero reposicionado:** "Recebeu um problema no condomínio?" — chips situacionais (5 situações clicáveis → Assistente + auto-submit). "Ativar monitoramento" passou para link secundário. `onSuggestionSelect` prop adicionado.
- **AskInput situacional:** placeholder mudou para "Morador fez obra sem avisar. O que faço?" — ativa modo mental correto.
- **QuickAccessCards situacionais:** cards agora mostram `examplePrompt` (pergunta real) como texto principal e `title` como label secundário.
- **"Próximo passo" nas respostas:** `CAT_TO_NEXTACTION` em `Response.tsx` — 10 categorias cobertas, renderizado quando `!entry.dica`.
- **CAT_TO_COMUNICADO expandido:** adicionadas categorias `responsabilidade` (registrar ocorrência) e `gestao` (comunicado interno).
- **TOPICS atualizados:** 9 examplePrompts reescritos para linguagem situacional real de síndico.
- **Docs criados:** `laboratorio-cenarios-sindico.md` (50+ cenários), `matriz-maturidade-fluxos.md` (11 fluxos × 7 critérios), `tese-tempo-ate-alivio.md`.

### Entregues na Fase 42
- **SimuladorReajusteCota:** `components/SimuladorReajusteCota.tsx` — calculadora de reajuste de cota condominial. 7 campos, cálculo de arrecadação líquida, despesa projetada, balanço e % mínimo de reajuste. `ssr: false`, disclaimers, telemetria `simulador_reajuste_calculado`.
- **ProximasDatas:** subtitle adicionado — "Vencimentos e manutenções antes que virem urgência."
- **Telemetria:** `simulador_reajuste_calculado` adicionado ao `TelemetryEvent`.
- **Docs:** `visao-futura-financeiro-demonstrativos.md` atualizado (seção SimuladorReajusteCota); RC checklist com grupo 9b.

### Entregues na Fase 41
- **"Próximas datas":** `components/ProximasDatas.tsx` — lista de vencimentos e rotinas calculadas, ordenada por urgência, integrada na aba Início (apenas quando hasCondominioData). Toque em item → Assistente com pergunta contextual.
- **Insight de mandato:** `lib/insights.ts` — cobre janela 90–180 dias de antecipação do fim de mandato (GuidancePanel já cobre ≤ 90 dias)
- **"Perguntar sobre":** `components/PainelOperacional.tsx` — label "Explorar mais" renomeado para eliminar confusão entre ferramenta e atalho de Assistente
- **Visão futura financeiro:** `docs/visao-futura-financeiro-demonstrativos.md` — raciocínio documentado sobre demonstrativo da administradora, previsão orçamentária, reajuste de cota

### Entregues na Fase 40
- **Tese de produto:** `docs/tese-produto-copiloto-operacional.md` — posicionamento, 5 dores campeões, sequência problema→ação, limites jurídicos
- **Campo de mandato do síndico:** `lib/session.ts` (`fimMandatoSindico`), `lib/guidance.ts` (5 níveis de alerta), `components/MemoriaPanel.tsx`, `components/CondominioStatusHeader.tsx`
- **Reposicionamento de copy:** Hero ("Entenda, responda e organize"), Ferramentas ("Ação prática"), Assistente ("Qual é a situação?"), aba Condomínio ("Ativar monitoramento")
- **Integração Assistente → Ferramentas:** `CAT_TO_COMUNICADO` em `components/Response.tsx` — CTAs de comunicado para multas, obras, assembleias, inadimplência/cobrança
- **Onboarding aprimorado:** bridge menciona mandato do síndico; collapsed state orientado a ativação
- **Compatibilidade retroativa:** `fimMandatoSindico` é opcional — backups antigos sem o campo continuam funcionando

### Entregues na Fase 38
- **Admin hardening:** `app/admin/page.tsx` — produção sem `NEXT_PUBLIC_ADMIN_KEY` → bloqueio automático (antes: auto-login)
- **CCT copy fix:** `components/Response.tsx` — aviso regional mais claro sobre limitação CCT SECOVI-Rio
- **Setup Supabase:** `docs/setup-supabase-telemetria.md` — SQL, env vars, queries de acompanhamento
- **Rascunho jurídico:** `docs/rascunho-termos-de-uso.md` e `docs/rascunho-politica-privacidade.md` (LGPD)
- **PWA report:** `docs/resultado-teste-pwa-fase-38.md` — estado técnico + checklist por plataforma
- **Checklist RC atualizado:** tabela de histórico + status por grupo
- **Relatório RC:** `docs/relatorio-rc-interno-fase-38.md`

### Pendências remanescentes pré-beta
- **Teste PWA em dispositivo físico** — Android (Chrome) e iOS (Safari)
- **Configurar Supabase** — 15 min, ver `docs/setup-supabase-telemetria.md`
- **Revisão jurídica** dos rascunhos legais
- **Auditoria /admin ao vivo** — clicar "Rodar auditoria" e confirmar recall ≥ 75%
- **Canal de feedback** antes de convidar síndicos

### Funcionalidades ativas
- 4 abas com navegação Apple-like (BottomNav fixo)
- Aba Início: monitoramento de datas, guidance operacional, dica do dia
- Aba Assistente: 316 entradas KB, motor determinístico, fallback contextual em 16 categorias
- Aba Ferramentas: Gerador de Comunicados (4 modelos), Simulador de Multa/Juros, Checklists (4)
- Aba Condomínio: perfil (editável), memória operacional, timeline, revisão mensal, backup JSON
- Admin (`/admin`): telemetria, auditoria de 83 perguntas (Fase 33), exportação de dados

### Entregues na Fase 37
- **Favicon criado:** `app/favicon.ico` — 32×32 PNG-in-ICO, 177 bytes, sem dependências externas
- **NaN corrigido em MemoriaPanel:** `salvar()` valida `isNaN(dt.getTime())` antes de calcular dias de validade
- **urgencyVencimento() defensivo:** `lib/urgency.ts` retorna `"ausente"` para datas inválidas (antes: `"em-dia"`)
- **AUDIT_CASES atualizados:** 5 casos reclassificados B→A — refletem expansão da KB nas Fases 33–34
- **Auditoria offline confirmada:** `scripts/audit.js` — Recall A 100% (64/64), Bloqueio C 100% (4/4), 72/83 PASS (87%)
- **Guia de teste PWA:** `docs/teste-pwa-dispositivo-real.md` — DevTools, Android, iOS, checklists
- **Relatório RC:** `docs/relatorio-rc-interno-fase-37.md` — 20 grupos, estado por grupo

### Entregues na Fase 36
- **PWA instalável:** ícones criados via script Node.js puro (`scripts/generate-icons.js`)
  → `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`
- **Manifest corrigido:** `app/manifest.ts` com 4 entradas de ícone (192 any, 192 maskable, 512 any, 512 maskable)
- **Layout atualizado:** `app/layout.tsx` referencia apple-touch-icon para iOS
- **Checklist RC:** `docs/checklist-release-candidate-interno.md` — 20 grupos de verificação pré-beta
- **Plano técnico IA/RAG:** `docs/plano-tecnico-ia-rag-fase-36.md` — arquitetura, riscos, critérios de início

### Qualidade da KB e motor
- Entradas KB: 316 (+5 da Fase 34)
- Motor determinístico: Recall A 100%, Bloqueio C 100% — confirmado offline Fase 37
- Guia editorial: `docs/guia-qualidade-editorial-kb.md`
- Preparação RAG: `docs/preparacao-kb-para-rag.md`
- Princípio: não mexer no motor sem bug documentado; foco na qualidade da KB

### Pendências remanescentes pré-beta
- **Teste em dispositivo físico:** verificar PWA em Android (Chrome) e iOS (Safari) — guia: `docs/teste-pwa-dispositivo-real.md`
- **Verificação manual grupos 4–16:** fluxo zero dados, onboarding, assistente, ferramentas, backup (relatório RC, seções 4–16)
- **Auditoria ao vivo em /admin:** clicar "Rodar auditoria" e confirmar recall ≥ 75% — esperado 87%
- **Beta com síndicos reais:** apenas futuramente, aproximadamente uma semana antes do lançamento

---

## Como fazer alterações com segurança

### Antes de alterar qualquer coisa
1. `npx tsc --noEmit` — confirmar zero erros como ponto de partida
2. Identificar o arquivo exato que precisa mudar (não adivinhar)
3. Ler o arquivo inteiro antes de editar (contexto importa)

### Após alteração
1. `npx tsc --noEmit` — zero erros é obrigatório
2. `npx next build` — build limpo, sem warnings críticos
3. Testar a funcionalidade manualmente no browser

### Fluxo de dados
```
localStorage
  └─ lib/session.ts (todas as leituras/escritas passam por aqui)
       ├─ getProfile() / saveProfile()
       ├─ getMemoriaOperacional() / saveMemoriaOperacional()
       ├─ getChecklistStorage() / saveChecklistProgress()
       └─ exportUserData() / importUserData()
```

**Nunca ler localStorage diretamente nos componentes.** Sempre via `lib/session.ts`.

---

## Arquivos críticos e o que cada um faz

| Arquivo | Responsabilidade |
|---|---|
| `lib/data.ts` | Motor de respostas: SYNONYMS, KB, findAnswer(), scoring, fallback |
| `lib/session.ts` | Persistência: todos os acessos ao localStorage |
| `lib/guidance.ts` | Lógica de prioridades operacionais (GuidancePanel) |
| `lib/urgency.ts` | Cálculo de urgência de datas (vencido, urgente, breve, ok) |
| `lib/telemetry.ts` | Eventos de analytics (Supabase, silencioso se não configurado) |
| `lib/checklists.ts` | Definição estática dos 4 checklists |
| `lib/comunicados.ts` | Modelos de comunicados: tipos, campos, função de geração, disclaimers |
| `app/page.tsx` | Orquestrador principal: estado, handlers, renderização por aba |
| `components/BottomNav.tsx` | Navegação inferior fixa |
| `components/ComunicadoPanel.tsx` | Gerador de comunicados — usa lib/comunicados.ts para os templates |
| `components/SimuladorMulta.tsx` | Calculadora de multa e juros (local, estimativa) |
| `components/GuidancePanel.tsx` | Painel de prioridades da aba Início |
| `components/CondominioStatusHeader.tsx` | Header de status da aba Início |
| `components/MemoriaPanel.tsx` | Formulário de datas operacionais (aba Condomínio) |

---

## Como expandir a base de conhecimento (KB)

A KB está em `lib/data.ts` como array `KNOWLEDGE_BASE`. Cada entrada tem:

```typescript
{
  id: "id-unico",
  pergunta: "Como fazer X?",
  resposta: "...",
  keywords: ["palavra", "chave"],
  categoria: "multas",
  suporte: "opcional — texto extra para scoring",
  dica: "opcional — texto após a resposta",
}
```

**Para adicionar uma entrada:**
1. Escolher `id` único (kebab-case, descritivo)
2. Escolher `categoria` existente (ver `CATEGORY_ANCHORS` em data.ts)
3. Escrever `pergunta` como o síndico escreveria (linguagem natural)
4. Escrever `resposta` objetiva: o que pode fazer, o que não pode, o que recomenda
5. Listar `keywords` específicas (o que a pergunta precisa ter para chegar aqui)
6. Rodar `npx tsc --noEmit` para confirmar

**Para testar uma entrada:**
- Abrir `/admin` → seção Auditoria → rodar com a pergunta nova
- Ver se o score é ≥ 14 e se a resposta retornada é a certa

---

## Como adicionar um sinônimo

Em `lib/data.ts`, array `SYNONYMS`:

```typescript
{
  novaPalavra: ["sinonimo1", "sinonimo2"],
}
```

As palavras são normalizadas (sem acento, minúsculas) automaticamente antes do matching.
Sempre rodar `npx tsc --noEmit` após adicionar — TypeScript vai pegar duplicate keys.

---

## Como adicionar um novo comunicado

Em `lib/comunicados.ts`, array `COMUNICADO_TEMPLATES`:

```typescript
{
  id: "meu-modelo" as ComunicadoId, // adicionar ao tipo ComunicadoId também
  icon: "📄",
  title: "Título do modelo",
  description: "Descrição curta para o card seletor",
  disclaimer: "Texto de cautela — aparece abaixo do botão copiar.",
  fields: [
    { id: "campo1", label: "Nome do campo", type: "text", placeholder: "Exemplo" },
  ],
  generate: (v, condoName) => {
    const campo = v.campo1 || "_____";
    return `TÍTULO DO COMUNICADO${condoName ? `\n${condoName}` : ""}

Prezados condôminos,

${campo}

Atenciosamente,
A Administração`;
  },
},
```

Passos:
1. Adicionar o novo `id` ao tipo `ComunicadoId` no topo do arquivo
2. Adicionar o objeto ao array `COMUNICADO_TEMPLATES`
3. `ComunicadoPanel.tsx` renderiza automaticamente todos os modelos do array
4. Rodar `npx tsc --noEmit` para confirmar zero erros

**Limite de modelos no seletor:** o grid é 2×2. Mais de 4 modelos muda o layout para uma lista; ajustar o CSS em ComunicadoPanel se necessário.

---

## Como adicionar um checklist

Em `lib/checklists.ts`, array `CHECKLISTS`:
```typescript
{
  id: "novo-checklist",
  title: "Título",
  icon: "🔧",
  description: "Descrição curta",
  items: [
    { id: "item-1", text: "Primeiro item", critical: true },
    { id: "item-2", text: "Segundo item" },
  ],
  recurrenceDays: 365, // opcional
  recurrenceLabel: "Anual", // opcional
}
```
O ChecklistPanel renderiza automaticamente todos os checklists do array.

---

## Performance e bundle

### Estratégia de carregamento (Fase 31)
Components de abas não-iniciais são carregados sob demanda via `next/dynamic` com `ssr: false`.
Isso reduz o First Load JS da rota principal sem afetar a experiência do usuário.

**Componentes com dynamic import em page.tsx:**
- Aba Ferramentas: ComunicadoPanel, SimuladorMulta, ChecklistPanel, PainelOperacional
- Aba Condomínio: TimelineOperacional, RevisaoMensal, BackupPanel

**Componentes carregados no boot (aba Início):**
- Header, Hero, DicaDoDia, HomeContextual, CondominioStatusHeader, GuidancePanel, ContextualInsight
- OnboardingProfile, MemoriaPanel (necessários para o fluxo de ativação inicial)

### Quando o bundle crescer
Se o First Load JS da rota `/` ultrapassar 230 kB, investigar:
1. `npx next build` — ver qual chunk cresceu
2. Verificar imports novos em componentes de aba Início
3. Verificar se um componente grande foi importado estaticamente em page.tsx
4. Avaliar mover para dynamic import

### Não fazer
- Não usar dynamic import para componentes da aba Início (carregam imediatamente)
- Não usar SSR para componentes que leem localStorage (sempre `ssr: false`)

---

## Telemetria — o que acompanhar

Sem Supabase configurado: todos os eventos são silenciosos (no-op).

Para ativar, criar `.env.local` com:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_ADMIN_KEY=<senha-do-painel>
```

Eventos mais importantes para acompanhar:
- `session_open`: quantos usuários abrem o app por dia
- `query_submitted` vs `query_fallback`: taxa de sucesso do assistente
- `onboarding_completed`: quantos ativam o monitoramento
- `comunicado_copiado`: uso real das ferramentas (tipo + campos preenchidos)
- `simulador_calculado`: uso do simulador de multa
- `guidance_resolved`: usuários resolvendo pendências reais

### Propriedades seguras coletadas (sem dados pessoais)
- `tipo_comunicado`: qual modelo foi usado ("assembleia", "obra", etc.)
- `campos_preenchidos`: contagem de campos preenchidos (número, não conteúdo)
- `meses`: meses de atraso no simulador (número)
- `usou_valores_padrao`: true se taxas padrão 1% juros / 2% multa foram usadas
- `source`: origem do evento ("ferramentas")

---

## Debugging comum

### "TypeScript error em data.ts" ao adicionar sinônimo
Causa: duplicate key no objeto SYNONYMS.
Fix: procurar a key existente com `grep` e remover o duplicado.

### "Componente não re-renderiza após salvar perfil"
Causa: `refreshKey` não foi incrementado após a ação.
Fix: verificar se o callback `onSaved` ou `onProfileSaved` chama `setRefreshKey(k => k + 1)` em page.tsx.

### "GuidancePanel não mostra nada"
Causa: `hasMemoriaOperacional()` retorna false.
Fix: verificar se há dados em MemoriaPanel. Sem data de vencimento cadastrada, nada aparece.

### "Build falha com chunk too large"
Causa: algum import pesado foi adicionado.
Fix: verificar se o novo componente tem dependências desnecessárias. Remover ou usar dynamic import.

---

## Próximas tarefas prioritárias (Fase 42)

1. **Teste PWA em dispositivo físico** — Android (Chrome) e iOS (Safari)
2. **Configurar Supabase** — 15 min — ver `docs/setup-supabase-telemetria.md`
3. **Rodar auditoria em /admin** — meta recall ≥ 75%
4. **Testar "Próximas datas" manualmente** — registrar vencimentos futuros e passados, verificar ordenação e cores
5. **Revisão jurídica** dos rascunhos legais
6. **Canal de feedback** e convite para primeiros 5 síndicos beta
7. **Beta com síndicos reais** — apenas após itens 1–6 concluídos

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 41 concluída)*
*Atualizar a seção "Estado atual" a cada sprint.*
