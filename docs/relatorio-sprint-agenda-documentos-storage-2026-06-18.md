# Relatório — Sprint Agenda + Documentos + Supabase Storage + Transparência
**Data:** 2026-06-18 · **Branch:** `sprint-agenda-documentos-storage` (a partir de `main` `2430846`) · **Flags:** `agenda_remote_enabled` / `documents_remote_enabled` = `false`

> Maior lote até aqui, com um subsistema NOVO (Storage). Fatiado em 3 blocos, gate-verde entre
> cada um, disciplina de parar-e-reportar se inchasse. Tudo gated-off.

---

## 1. O que foi entregue (por bloco)

### Bloco 1 — Agenda (read-cutover, sem migration)
`agendaSync.pullRemoteAgenda` (no-op com `agenda_remote_enabled` off) + `saveAgendaEvents`; pull
fiado em `app/page.tsx`. Push já existia (`session-agenda.ts`). Tabela `agenda_events` é da 006.
Provas: paridade, reversibilidade, pull no-op. **Commit `787a39a`.**

### Bloco 2 — Documentos (metadados, migration 012)
`012_community_documents.sql`: RLS papel×visibilidade (escrita=gestão), `created_by`, `storage_path`
nullable (reservado p/ Bloco 3). **Transparência = `prestacao_de_contas` publicada com `visibility`
que alcança o morador.** Molde completo (`communityDocumentsRemote/Merge/Sync` + push/pull). Provas.
**Commits `75b64c7` (migration+gate), `94e0feb` (molde), `8c616bd` (provas).**

### Bloco 3 — Supabase Storage (subsistema novo, migration 013)
`013_documents_storage.sql`: bucket privado `condominio-docs`, objetos sob
`"<condominio_id>/documents/<doc_id>/<arquivo>"`. **RLS de `storage.objects`** via funções
`SECURITY DEFINER`: leitura reusa `canSeeVisibility` **através do documento** (o objeto herda a
visibility do `community_documents` do caminho); escrita = gestão do condomínio do prefixo. Download
só por **signed URL** (sem URL pública). Helper `documentStorage.ts` (upload + signed URL, gated,
best-effort). **Commits `efd234e` (migration+gate), `8bb8bfa` (helper).**

**Não inchou:** o object-RLS com subquery de visibilidade passou no gate **na primeira tentativa**.

---

## 2. Gate de CI — saída (Postgres real, `supabase db reset` aplica 001→013)

| Run | SHA | Cobre | Conclusão |
|---|---|---|---|
| [27788668580](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27788668580) | `787a39a` | Bloco 1 (Agenda) + regressão | ✅ success |
| [27788942483](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27788942483) | `75b64c7` | migration 012 + gate (papel×visibilidade + transparência) | ✅ success |
| [27789346316](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27789346316) | `8c616bd` | Documentos molde + provas + regressão | ✅ success |
| [27789735536](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27789735536) | `efd234e` | migration 013 Storage + **gate de objeto** | ✅ success |
| [27790005627](https://github.com/lucasr500/Amigo-do-Pr-dio/actions/runs/27790005627) | `8bb8bfa` | helper de Storage + regressão (964 testes) | ✅ success |

**Novos casos do gate (contra DB real):**
- **community_documents:** isolamento A×B; **transparência** — residente LÊ o balancete publicado
  (`moradores`), NÃO lê o documento interno (`gestao`); residente não publica; B não insere.
- **storage.objects (a prova nova mais importante):** gestor de A baixa o arquivo; **B não baixa nem
  sobe arquivo de A** (isolamento de objeto); **residente baixa o `moradores` e NÃO baixa o `gestao`**
  (a visibilidade gateia o arquivo, não só o metadado); residente não faz upload.

**Suíte local:** tsc 0 · **964 passando · 45 skipped** (gate auto-skipa sem DB) · 0 falhando.

---

## 3. Variante de Storage — para o Cowork incorporar ao molde

Peça nova reutilizável (próximas entidades com arquivo: contratos, atas digitalizadas, fotos de OS):

1. **Bucket privado compartilhado**, escopo por **prefixo de caminho** `"<condominio_id>/<entidade>/<id>/<arquivo>"`. Sem URL pública.
2. **RLS de `storage.objects`** com duas funções `SECURITY DEFINER`:
   - `is_<entidade>_object_manager(name)` → `has_condominio_role((foldername(name))[1]::uuid, ['owner','manager'])` para INSERT/UPDATE/DELETE.
   - `can_access_<entidade>_object(name)` → `EXISTS` no metadado (id = `(foldername(name))[N]`) reusando o `CASE visibility` de `canSeeVisibility` para SELECT.
3. **Helper gated best-effort**: `build…Path` (sanitiza o nome), `upload…File` (sobe + grava
   `storage_path` no metadado), `get…SignedUrl` (expira). Mesmo gating em camadas dos `*Remote`.
4. **storage_path** nullable no metadado, **não enviado pelo push de metadado** (para o upload não
   ser sobrescrito por uma atualização de metadado).
5. **Gate**: upload via service_role no setup; provar isolamento de objeto (B↔A) + visibilidade
   (papel não-autorizado não baixa) com `download`/`upload` reais no CI.

---

## 4. Invariantes confirmadas
- **Não-Exposição:** `agenda_remote_enabled` / `documents_remote_enabled` = `false`. Bucket privado.
  Produção intocada.
- **Local-first:** UI nos stores locais; pull só faz `merge → save`; flag off = no-op total (provado).
- **Sem perda de dado:** flag off = zero rede (espião); byte-a-byte idêntico; on→off sem perda.
- **RLS no banco e no objeto:** papel×visibilidade dos metadados E do arquivo, gate-provados.

---

## 5. Stretch (§7 — Reservas) NÃO executado
Reservas é "a próxima fatia" (§6) e o stretch é explicitamente condicional a tempo/risco. Sessão
longa, três blocos novos (incl. subsistema de Storage) já entregues e verdes; iniciar outra entidade
+ migration agora adiciona risco sem necessidade. **Parado e reportado**, conforme a regra. Reservas
fica como próximo sprint dedicado.

---

## 6. Commits desta sessão (branch `sprint-agenda-documentos-storage`)
```
8bb8bfa  feat(storage): helper de upload + signed URL (gated-off)
efd234e  feat(storage): migration 013 bucket + RLS de objeto (isolamento + visibilidade)
8c616bd  test(documentos): provas merge/pull/paridade/reversibilidade (012)
94e0feb  feat(documentos): molde completo dos Documentos (gated-off)
75b64c7  feat(documentos): migration 012 community_documents + gate (papel×visibilidade + transparência)
787a39a  feat(agenda): read-cutover relacional (pullRemoteAgenda) + provas (gated-off)
```

**Definição de Pronto:** ✅ Agenda (sync+wiring+provas) · Documentos (012, molde, transparência,
gate papel×visibilidade, provas) · Storage (bucket + RLS de objeto + signed URLs; gate prova
isolamento de objeto + visibilidade; provas) · tsc 0 · vitest verde · flags off · produção intocada ·
sem perda de dado · relatório escrito.
