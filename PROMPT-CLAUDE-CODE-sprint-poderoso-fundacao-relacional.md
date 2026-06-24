# Prompt para o Claude Code — Sprint Poderoso: Fundação Relacional Viva (fatia Decisões)

> **Cole isto inteiro no Claude Code.** É autossuficiente. Não improvise escopo: o que não está aqui, não faça nesta janela. Trabalhe denso, mas sob as invariantes — qualidade impecável de uma fatia vale mais que largura.

---

## 0. Quem você é nesta sessão e o que vai entregar

Você é o executor de código do **Amigo do Prédio** (Next.js 15 + TS + Supabase, local-first, PWA). Sua missão neste sprint: **tornar o módulo Decisões a primeira entidade de memória 100% relacional do produto** — escrita espelhada no servidor, leitura relacional fiada, com **quatro provas automatizadas** (gates, paridade, leitura por papel, reversibilidade) — e **extrair dessa fatia um molde reutilizável** para migrar as próximas entidades depois. Tudo **gated-off**: nada acende para usuário nenhum.

Esta fatia é a chave que destrava a visão inteira (multi-persona real, rede social, "Pergunte ao Prédio"). Por isso ela tem de ficar impecável: ela vira o padrão que todas as outras entidades vão copiar.

---

## 1. Por que isto importa (contexto de produto — não ignore)

Objetivos canônicos atualizados (Notion → "Realinhamento de Objetivos — 2026-06-18"):

- **Visão:** o Amigo do Prédio é a **rede social inteligente + segundo cérebro** do condomínio — integração, memória, governança e inteligência. **Anti-posicionamento permanente:** não competir com a administradora (boleto, folha, financeiro); somos a camada acima, parceira dela.
- **Persona:** síndico **e** morador precisam ser encantados; monetização = assinatura do condomínio inteiro.
- **A trava real:** hoje a fonte de verdade é um blob `localStorage` single-user. O multi-tenant relacional existe e está provado isolado, mas **dormente**. Multi-persona real, social e IA são **arquiteturalmente impossíveis** enquanto os dados não forem relacionais. Esta fatia começa a virar essa chave — pela entidade de **menor risco e maior reuso**: Decisões.
- **Dado sensível:** Decisões carregam jurídico/trabalhista/inadimplência → leitura **só gestão/conselho** nesta fase (a RLS já garante). Exposição a morador é fase futura (Completo-Pleno) — **não** nesta janela.

---

## 2. Invariantes inegociáveis (valem em TODO commit)

1. **Não-Exposição:** `decisions_remote_enabled` permanece `false`. Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** a UI continua lendo `getDecisions()`. O servidor é cópia. Com a flag off, comportamento **byte-a-byte idêntico** ao de hoje.
3. **Sem perda de dado:** nenhuma operação remota regride, sobrescreve ou apaga o store local. Falha de rede/SDK = no-op silencioso, local preservado.
4. **Best-effort defensivo:** toda função remota **nunca lança** e **nunca bloqueia a UI** (padrão de `assembliesRemote.ts`/`agendaRemote.ts`).
5. **Gate obrigatório:** tocar `lib/**`, `supabase/**` ou `package*.json` exige o **gate de isolamento verde** antes do commit. Tocar `supabase/migrations/**` exige rodar o gate contra Postgres real.
6. **Commit por caminho explícito** (nunca `git add .`), com `tsc --noEmit` 0 + `vitest run` verde antes de cada commit. Branch dedicada à fatia.
7. **Um escritor por arquivo:** se o Cowork estiver codificando em paralelo, dividir por arquivo/workstream antes de começar; nunca dois no mesmo arquivo (evita truncamento no sync do OneDrive).

---

## 3. Estado atual verificado — NÃO refazer o que já existe

Confira antes de codar; muito já está pronto:

| Item | Onde | Status |
|---|---|---|
| Tabela `decisions` + RLS por papel (leitura/escrita: owner/manager/council) + GRANTs + rollback | `supabase/migrations/008_decisions.sql` | ✅ idempotente |
| Push (dual-write) | `lib/tenant/decisionsRemote.ts` → `mirrorUpsertDecision`, `mirrorDeleteDecision`, `listRemoteDecisions` | ✅ gated, best-effort |
| Merge puro local↔remoto (last-write-wins por `id`) | `lib/tenant/decisionsMerge.ts` → `mergeDecisions` | ✅ |
| Cutover de leitura (pull) | `lib/tenant/decisionsSync.ts` → `pullRemoteDecisions` | ⚠️ **definido, NÃO fiado** |
| Import do push no domínio | `lib/decisions.ts` (linha 8) importa `mirrorUpsertDecision`/`mirrorDeleteDecision` | ⚠️ **confirmar se está chamado** em add/update/delete |
| Gate cobrindo Decisões (isolamento A×B + residente não lê/escreve) | `lib/__tests__/tenant-isolation.integration.test.ts` | ✅ verde |

**Tradução:** a leitura por papel **no nível do banco** já está provada. Faltam: fiar o push (se órfão), fiar o pull, extrair o molde, e as provas de **paridade** e **reversibilidade** no nível da aplicação.

---

## 4. Workstreams (ordem de execução)

### D1 — Confirmar/fiar o PUSH · arquivo `lib/decisions.ts`
- Verificar se `addDecision`, `updateDecision`, `deleteDecision` realmente chamam `mirrorUpsertDecision`/`mirrorDeleteDecision` **após** `saveDecisions` (local primeiro, sempre). O import existe (linha 8); confirmar que não é órfão.
- Se órfão: fiar em modo best-effort (`void mirror...()`, sem await bloqueante, nunca propagar erro). Com flag off, `mirror*` já é no-op interno — fiar é seguro mesmo desligado.

### D2 — Fiar o PULL · ponto de sync/auth (não criar 2º caminho de leitura)
- Chamar `pullRemoteDecisions()` a partir do fluxo canônico de sync/auth — o mesmo gatilho do sync de snapshot ao autenticar/voltar online (ver `lib/sync/autoSync.ts` → `flushPendingSync`/`startOnlineListener`, e o boot em `app/page.tsx`).
- `pullRemoteDecisions` já é no-op total com flag off/anônimo/sem condomínio. A UI continua em `getDecisions()`; o pull só faz `merge → saveDecisions` no store local.

### D3 — Extrair o MOLDE reutilizável · novo `lib/tenant/relationalMirror.ts` (ou doc curto)
- Documentar e, onde fizer sentido sem over-engineering, **generalizar** o padrão Decisões em 5 peças reutilizáveis: (1) migration por entidade espelhando 008; (2) `*Remote.ts` push/list gated best-effort; (3) `*Merge.ts` puro; (4) `*Sync.ts` pull no-op-quando-off; (5) wiring push-no-save + pull-no-sync.
- Objetivo: a **próxima** entidade (ex.: linha do tempo, fornecedores) sair em horas, não dias. **Não** migrar outra entidade agora — só deixar o molde explícito (código compartilhável e/ou `docs/molde-migracao-relacional.md`).

### D4 — PROVA de paridade · novo arquivo de teste
- Provar: após `add → update → delete` com a flag **ligada em ambiente de teste**, as linhas remotas (`listRemoteDecisions`) refletem exatamente o store local (`getDecisions`) — sem item perdido, duplicado ou dessincronizado.
- Cobrir idempotência do round-trip via `mergeDecisions` (merge estável). Seguir o padrão de teste já usado para assembleias.

### D5 — PROVA de reversibilidade · novo arquivo de teste
- Provar: com `decisions_remote_enabled=false`, `mirrorUpsertDecision`/`mirrorDeleteDecision`/`pullRemoteDecisions` são **no-op total** — zero rede, store local intocado, saída byte-a-byte idêntica ao fluxo puramente local.
- Provar: ligar→desligar a flag retorna ao estado 100% local sem perda.

### D6 — Manter os gates verdes (transversal)
- A cada commit: `tsc --noEmit` 0 · `vitest run` verde · se tocou `lib/**`/`supabase/**`, gate de isolamento verde. O gate já cobre Decisões; se D1–D5 não tocarem RLS nem migration, basta permanecer verde.

---

## 5. Definição de Pronto (TODAS verdadeiras)

- [ ] **Gates verdes:** `tsc` 0 + vitest verde + gate de isolamento verde contra Postgres real.
- [ ] **Push fiado e confirmado** (D1) e **pull fiado** (D2), gated.
- [ ] **Molde reutilizável** extraído e documentado (D3).
- [ ] **Paridade provada** (D4) e **reversibilidade provada** (D5).
- [ ] `decisions_remote_enabled` permanece `false`; produção intocada; nenhum dado perdido.
- [ ] **Relatório de sprint** escrito (§7).

---

## 6. Stretch (somente se TODA a Definição de Pronto estiver verde e sobrar janela)

Aplicar **apenas o PUSH** (dual-write, gated, sem pull, sem migration de leitura nova) à **próxima entidade de menor risco** usando o molde de D3 — para provar que o molde funciona. Critérios: nova flag `*_remote_enabled=false`; migration idempotente com rollback; gate verde; mesmas invariantes. **Se houver qualquer dúvida de risco, NÃO fazer o stretch** — parar e reportar. A fatia Decisões impecável é o sucesso; o stretch é bônus.

---

## 7. Entregável final

Escrever `docs/relatorio-sprint-decisoes-relacional-2026-06-XX.md` com:
- O que foi fiado (D1/D2), o molde extraído (D3), o que foi provado (D4/D5) — com hashes de commit.
- Saída dos gates: `tsc`, contagem de testes, run do gate de isolamento (URL/sha).
- Confirmação das invariantes: flag off, produção intocada, sem perda de dado.
- **Próxima fatia recomendada** (qual entidade migrar a seguir com o molde) + qualquer descoberta que mude a estratégia — para o Lucas decidir.

---

## 8. Anti-escopo (NÃO fazer nesta janela)

- Não ligar flags de exposição/IA. Não expor Decisões a morador (RLS desta fase nem concede).
- Não migrar Memória/Documentos/Agenda inteiras — só Decisões (+ stretch de push, se couber).
- Não adicionar FKs aos vínculos (`linked_*` seguem TEXT enquanto os alvos forem local-first).
- Não tocar `financial*` nem seus 18 importadores. Não refatorar `session.ts`/`Response.tsx`.
- Não implementar MFA, papel "funcionário", onboarding de morador ou moderação — são objetivos de sprints **posteriores**, registrados no Notion, fora desta fatia.

---

## 9. Primeiro passo concreto

1. Criar/checar a branch da fatia. 2. Rodar `tsc --noEmit` e `vitest run` para fotografar o baseline verde. 3. Abrir `lib/decisions.ts` e confirmar D1 (push órfão ou fiado?). 4. Reportar o achado de D1 antes de seguir para D2. Trabalhe fatiado, commit por commit, gates verdes sempre.
