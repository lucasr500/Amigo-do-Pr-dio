# Prompt para o Claude Code — Sprint: Integração Relacional (Agenda + pré-assembleia)

> **Cole isto inteiro no Claude Code.** Autossuficiente. O que não está aqui, não faça nesta janela. Reusa o molde já documentado em `docs/molde-migracao-relacional.md`.

---

## 0. O que você vai entregar

Levar **Agenda** e **Assembleia** ao mesmo patamar relacional que Decisões já alcançou: completar o **read-cutover (pull)** das duas — elas já têm push + merge + flag; falta o `*Sync.ts` (pull) e o wiring — reusando exatamente o padrão de `decisionsSync.ts` + `app/page.tsx`. Tudo **gated-off**, **sem migration nova**, com as **quatro provas** por entidade (gates, paridade, reversibilidade, leitura por papel via gate já verde).

---

## 1. Por que isto, e por que agora (visão do Lucas — leia)

O foco do Amigo do Prédio **não** é "rodar a assembleia dentro do app". É **integração**: fazer todos levantarem suas questões da melhor forma possível, **antes** do evento. Quando o que importa já é discutido na pré-assembleia, a assembleia real chega com **menos ruído e menos briga**, e as pessoas chegam mais prontas para defender seus interesses. Daí esta fatia:

- **Agenda relacional** → os eventos-chave do condomínio (com a **assembleia como evento de destaque**, talvez o mais importante) passam a ser **compartilhados por condomínio** e visíveis às personas certas. É o "lugar" onde a assembleia aparece como marco.
- **Assembleia relacional (pauta + discussão pré-evento)** → o loop de **pré-assembleia** (deliberação, enquete consultiva, discussão por pauta) deixa de ser blob single-user e vira dado compartilhado — a base técnica da integração que reduz o atrito. **Não** é "fazer a assembleia no app"; é dar substrato relacional à discussão que a antecede.

Ambas são **read-cutovers sem tabela nova** (migrations 006/007 já existem e o gate de isolamento já as cobre) — logo, **desbloqueadas** e de baixo risco.

---

## 2. Invariantes inegociáveis (todo commit)

1. **Não-Exposição:** `agenda_remote_enabled` e `assemblies_remote_enabled` permanecem `false`. Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** a UI continua lendo os stores locais. O pull só faz `merge → save` no local. Flag off ⇒ comportamento byte-a-byte idêntico ao de hoje.
3. **Sem perda de dado:** falha de rede/SDK = no-op silencioso; o local nunca regride.
4. **Best-effort + pull reconcilia** (decisão de arquitetura desta fase): o push continua best-effort (`void mirror...`); a entrega não é garantida no instante da escrita, e o pull no próximo sync reconcilia. **Não** construir outbox/fila de reenvio agora.
5. **Sem migration nova** nesta janela → o gate de isolamento não precisa rodar contra Postgres real; basta permanecer verde (suas mudanças tocam `lib/tenant/*Sync.ts` + `app/page.tsx` + testes, não RLS/migration). Ainda assim: tocar `lib/**` exige `tsc` 0 + `vitest` verde antes de cada commit.
6. **Commit por caminho explícito**; branch dedicada; um escritor por arquivo (se o Cowork estiver em paralelo, ele está em `docs/**`, não em código — confirme antes).

---

## 3. Estado verificado — o que existe e o que falta

| Entidade | Push / List (existe) | Merge (existe) | Flag | Pull `*Sync.ts` | Wiring em `app/page.tsx` |
|---|---|---|---|---|---|
| **Agenda** | `agendaRemote.ts`: `mirrorUpsert`, `mirrorDelete`, `listRemoteAgenda` | `agendaMerge.ts`: `mergeAgendaEvents` | `agenda_remote_enabled` | ❌ **criar `agendaSync.ts`** | ❌ **fiar** |
| **Assembleia** | `assembliesRemote.ts`: `mirrorUpsertAssembly/mirrorDeleteAssembly/listRemoteAssemblies` **+ itens** `mirrorUpsertItem/mirrorDeleteItem/listRemoteItems` | `assembliesMerge.ts`: `mergeAssemblies`, `mergeAgendaItems` | `assemblies_remote_enabled` | ❌ **criar `assembliesSync.ts`** | ❌ **fiar** |

**Template a copiar:** `lib/tenant/decisionsSync.ts` (pull no-op-quando-off) + `app/page.tsx` linhas ~136-137 (`void pullRemoteDecisions()` no boot autenticado + no listener `online`).

**Atenção (Assembleia tem DUAS sub-entidades):** o pull de Assembleia precisa reconciliar **assembleias E itens de pauta** (`mergeAssemblies` + `mergeAgendaItems`), salvando ambos nos respectivos stores locais. Não esqueça os itens.

---

## 4. Workstreams (ordem)

### A — Agenda pull-cutover · novo `lib/tenant/agendaSync.ts`
- Espelhar `decisionsSync.ts`: `pullRemoteAgenda(): Promise<PullResult>` — no-op total se `agenda_remote_enabled` off / anônimo / sem condomínio / remoto vazio; senão `mergeAgendaEvents(local, remote) → save` no store local. Best-effort, nunca lança.
- Wiring em `app/page.tsx`: `void pullRemoteAgenda()` no mesmo gatilho do pull de Decisões (boot autenticado + listener online). Não criar 2º caminho de leitura — a UI segue lendo o store local.

### B — Assembleia pull-cutover · novo `lib/tenant/assembliesSync.ts`
- `pullRemoteAssemblies(): Promise<PullResult>` — puxa `listRemoteAssemblies` **e** `listRemoteItems`, faz `mergeAssemblies` e `mergeAgendaItems`, salva ambos localmente. Mesmo gating no-op-quando-off, best-effort.
- Wiring em `app/page.tsx` no mesmo gatilho, gated por `assemblies_remote_enabled`.

### C — Provas por entidade · novos arquivos de teste (reusar o molde)
Para **cada** entidade (Agenda, Assembleia), seguindo `docs/molde-migracao-relacional.md` e os testes de Decisões (`decisions-paridade.test.ts`, `decisions-reversibilidade.test.ts`):
- **Paridade:** remoto == local nos campos de negócio após CRUD; round-trip idempotente. **Serializar os mirrors com `await`** (a corrida de dois `void mirror` concorrentes sob o `import()` mockado do Vitest já está documentada no molde — não repita o muro).
- **Reversibilidade:** flag off ⇒ zero rede (espião no `getSupabaseClient`), store local byte-a-byte idêntico ao fluxo puramente local, ciclo on→off sem perda.
- **Pull no-op:** espelhar `decisions-sync.test.ts` (flag off e flag-on-sem-condomínio → no-op).
- Mocks em memória de `@/lib/supabase/client` e `@/lib/tenant/tenantClient`; `condominio_id` único por teste (imuniza contra push vazado entre testes).

### D — Gates verdes (transversal)
- A cada commit: `tsc --noEmit` 0 · `vitest run` verde (a contagem deve subir a partir dos 892 atuais) · gate de isolamento permanece verde (sem tocar migration/RLS).

---

## 5. Definição de Pronto (TODAS verdadeiras)

- [ ] `agendaSync.ts` + `assembliesSync.ts` criados e **fiados** em `app/page.tsx`, gated.
- [ ] Assembleia reconcilia **assembleias E itens** no pull.
- [ ] **Paridade** e **reversibilidade** provadas para **cada** entidade; **pull no-op** provado.
- [ ] Leitura por papel: mantida pelo gate de isolamento (já cobre `agenda_events` e `assemblies`), verde.
- [ ] `agenda_remote_enabled` e `assemblies_remote_enabled` seguem `false`; produção intocada; sem perda de dado.
- [ ] **Relatório de sprint** (`docs/relatorio-sprint-integracao-agenda-assembleia-2026-06-XX.md`): o que foi fiado, provas + commits, gates, próxima fatia recomendada.

---

## 6. Anti-escopo (NÃO nesta janela)

- Nenhuma migration nova / nenhuma entidade sem tabela (Documentos/Timeline/Fornecedores ficam para quando o processo de validação de migration for decidido).
- Não ligar flags de exposição/IA. Não construir outbox/entrega garantida (best-effort + pull é a decisão desta fase).
- Não tocar `lib/financial*` nem refatorar `session.ts`/`Response.tsx`.
- Não implementar papel funcionário, moderação, MFA ou onboarding de morador — o Cowork está especificando isso em paralelo (`docs/`), virará código em sprint posterior.

---

## 7. Primeiro passo concreto

1. Branch da fatia. 2. `tsc`/`vitest` para fotografar o baseline verde (892). 3. Abrir `decisionsSync.ts` + `app/page.tsx` (wiring de Decisões) como referência. 4. Implementar A (Agenda) inteiro — pull + wiring + provas — e **commitar verde** antes de iniciar B (Assembleia). Trabalhe fatiado, gates verdes sempre.
