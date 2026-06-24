# Prompt para o Claude Code — Sprint: Agenda + Documentos + Supabase Storage + Transparência

> **Cole isto inteiro no Claude Code.** Autossuficiente. Reusa o processo provado (migration → gate de CI → wiring → provas) e o molde. **É o maior lote até aqui e introduz um subsistema NOVO (Storage)** — por isso é fatiado em blocos com commit verde entre cada um, e **disciplina de parar-e-reportar** se um bloco inchar. Não fie nada antes do gate verde do respectivo bloco.

---

## 0. O que você vai entregar (em blocos, nesta ordem)

1. **Agenda** relacional (read-cutover, sem migration) — gated.
2. **Documentos** relacional (metadados, migration nova) — RLS papel×visibilidade, **incluindo a categoria de Transparência/Prestação de contas** visível ao morador.
3. **Supabase Storage** (subsistema novo) — arquivos dos documentos em bucket por condomínio, **RLS de objeto** + signed URLs, com isolamento provado no gate.

Tudo **gated-off**. Cada bloco fecha **verde e commitado** antes do próximo. Se o Storage (Bloco 3) inchar, **pare, commite os Blocos 1–2 verdes e reporte** — ele pode virar sprint próprio.

---

## 1. Por que isto (objetivos do Lucas)
- **Agenda** = calendário compartilhado por prédio (assembleia como evento-herói), a base da "todos na mesma página".
- **Documentos + Transparência** = atas, convenção, contratos e **prestação de contas** compartilhados por papel. É um pilar: o morador vê o balancete publicado **sem** o app virar ERP. Transparência aqui = um documento publicado com visibilidade por papel, não um módulo financeiro.
- **Storage** = sem ele, "documento" é só metadado. É o que falta para a memória institucional ser real (o arquivo, não só o título).

---

## 2. Invariantes inegociáveis (todo commit)
1. **Não-Exposição:** flags novas `agenda_remote_enabled` já existe (manter false), `documents_remote_enabled=false` (nova). Nenhuma flag de exposição/IA ligada. Produção intocada.
2. **Local-first é a verdade:** UI lê stores locais; pull faz `merge → save` local. Flag off ⇒ byte-a-byte idêntico.
3. **Sem perda de dado:** falha de rede/SDK = no-op; local nunca regride.
4. **Best-effort + pull reconcilia** (sem outbox), inclusive para upload de arquivo.
5. **RLS no banco** (papel×visibilidade) para metadados **e** RLS de objeto no Storage — provados contra Postgres real no gate, não só na UI.
6. **migration/Storage → gate de CI verde → wiring.** Não fiar antes do gate.
7. **Commit por bloco**; **manifesto de donos de arquivo** (§8); parar-e-reportar se inchar.

---

## 3. Estado verificado
| Bloco | Store local | Tipos | Criar |
|---|---|---|---|
| **Agenda** | `lib/session-agenda.ts` (`AgendaEvent`) · remote já existe: `agendaRemote.ts` (`mirrorUpsert/mirrorDelete/listRemoteAgenda`), `agendaMerge.ts` (`mergeAgendaEvents`) | `AgendaEvent`, `AgendaEventType` | **só** `lib/tenant/agendaSync.ts` + wiring (sem migration; tabela `agenda_events` é da 006) |
| **Documentos** | `lib/community-documents.ts` (`PublicDocument`: `addPublicDocument/updatePublicDocument/removePublicDocument`) · leitura unificada em `documents.ts` | `PublicDocument`, `PublicDocumentCategory`, `Visibility` | migration `012_community_documents.sql` · `communityDocumentsRemote/Merge/Sync.ts` · flag `documents_remote_enabled` · wiring |
| **Storage** | — (greenfield; nenhuma referência hoje) | — | bucket + `storage.objects` policies (migration `013` ou no `012`) · helper de upload/signed-URL · ligação ao espelho de documentos |

**Templates:** `009_community_posts.sql` + `communityPosts*.ts` (RLS papel×visibilidade) e `decisionsSync.ts`/wiring em `app/page.tsx`.

---

## 4. Blocos

### Bloco 1 — Agenda (read-cutover, sem migration)
- Criar `lib/tenant/agendaSync.ts`: `pullRemoteAgenda()` no-op-quando-off (espelha `decisionsSync.ts`), `mergeAgendaEvents(local, remote) → save`. Wiring em `app/page.tsx` no gatilho canônico, gated por `agenda_remote_enabled`.
- Fiar push em `session-agenda.ts` se ainda não estiver (best-effort, após salvar).
- **Provas:** paridade (mirrors serializados), reversibilidade, pull no-op. **Commit verde.**

### Bloco 2 — Documentos metadados (migration 012)
- `012_community_documents.sql`: tabela `community_documents` (campos de `PublicDocument`: título, `category` incl. **prestação de contas/transparência**, `visibility`, referência ao arquivo no Storage `storage_path` nullable, autoria, timestamps), índices, trigger, RLS, GRANTs, rollback, idempotente.
- **RLS papel×visibilidade** (reusar a variante do Mural): morador lê documentos cuja `visibility` alcança (público/moradores), inclusive a **prestação de contas** publicada; não lê `gestao`. Escrita = gestão.
- `communityDocumentsRemote/Merge/Sync.ts` + push fiado em `community-documents.ts` + pull em `app/page.tsx`, gated por `documents_remote_enabled`.
- **Push → gate de CI verde** (isolamento + papel/visibilidade dos metadados) antes do wiring. **Provas** (paridade/reversibilidade/pull no-op). **Commit verde.**

### Bloco 3 — Supabase Storage (subsistema novo; pare-e-reporte se inchar)
- **Bucket por condomínio por caminho:** objetos sob o prefixo `condominio_id/...`. Bucket privado (sem URL pública).
- **RLS de objeto (`storage.objects`):** SELECT/INSERT/UPDATE/DELETE checam o prefixo de caminho contra `has_condominio_role` — um membro de B não lê nem escreve arquivo de A; a `visibility` do documento (do Bloco 2) gateia também o objeto (morador não baixa arquivo `gestao`).
- **Download por signed URL** (expira), nunca URL pública perene. Helper em `lib/tenant/storage*.ts`, gated, best-effort.
- **Ligação:** o espelho de documentos referencia `storage_path`; upload do arquivo é best-effort, gated por `documents_remote_enabled`.
- **Gate estendido (a prova nova mais importante):** isolamento de **objeto** entre condomínios + respeito à visibilidade. Push → **gate de CI verde** antes de fiar o upload.
- **Provas** + **commit verde**.
- ⚠️ Se a superfície do Storage (policies, signed URL, governança) crescer além do previsto, **pare, commite Blocos 1–2, e reporte** — o Storage vira sprint dedicado.

### Transversal — Gates verdes
- A cada commit: `tsc` 0 · `vitest` verde (sobe a partir de 937) · gate de CI verde cobrindo `community_documents` **e** o isolamento de objeto do Storage.

---

## 5. Definição de Pronto (TODAS verdadeiras)
- [ ] Agenda: `agendaSync.ts` + wiring, gated; provas verdes.
- [ ] Documentos: migration `012`, molde fiado, **transparência/prestação de contas como categoria visível ao morador**, gated; gate de CI verde (papel×visibilidade); provas.
- [ ] Storage: bucket por condomínio + RLS de objeto + signed URLs; **gate prova isolamento de objeto** entre condomínios e respeito à visibilidade; provas.
- [ ] `tsc` 0 · `vitest` verde · flags off · produção intocada · sem perda de dado.
- [ ] **Relatório** (`docs/relatorio-sprint-agenda-documentos-storage-2026-06-XX.md`): migrations + URLs dos runs do gate, a **variante de Storage** descrita (para o Cowork incorporar ao molde), provas + commits.

---

## 6. Anti-escopo (NÃO nesta janela)
- **Reservas** (`community-reservas.ts`) — é a **próxima** fatia (entidade + migration próprios). Não nesta.
- Comentários, moderação, ordens de serviço, papel staff — pacotes posteriores.
- Não ligar flags de exposição/IA. Não construir outbox. Não virar ERP financeiro (transparência = documento publicado, não gestão de caixa).
- Não tocar `financial*`, `session.ts`, `Response.tsx`.

---

## 7. Stretch (só se Blocos 1–3 verdes e sobrar janela)
Iniciar **Reservas** relacional (migration própria) pelo molde — push apenas, gated, sem pull/UI. Qualquer dúvida de risco/tempo: **pare e reporte**.

---

## 8. Manifesto de donos de arquivo
- **Claude Code:** `supabase/**`, `lib/**`, `components/**`, `app/**`, `lib/__tests__/**`, relatório do sprint.
- **Cowork:** `docs/**` (incl. molde), jurídico, Notion, Drive — zero código.
- Nenhum arquivo nas duas lanes ao mesmo tempo. Arquivo de código mexido sem ser por você → pare, revalide com o gate, commite só o snapshot verde.

---

## 9. Primeiro passo concreto
1. Branch a partir de `main` (`2430846`). 2. `tsc`/`vitest` baseline (937). 3. **Bloco 1 (Agenda)** inteiro → commit verde. 4. **Bloco 2 (Documentos)**: migration `012` + gate, **push e esperar o gate de CI verde** antes do wiring; reportar o gate. 5. **Bloco 3 (Storage)**: bucket + RLS de objeto + gate de objeto verde antes do upload. Reportar o gate de Storage antes de fiar. Um bloco verde antes do próximo.
