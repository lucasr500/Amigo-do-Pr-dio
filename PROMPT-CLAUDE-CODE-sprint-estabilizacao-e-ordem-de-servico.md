# Sprint — Estabilização de Lane + Reverificação da Base, depois Ordem de Serviço + papel `staff` (gated-off)

> Lane: **Claude Code** (executor de código, Windows). Cowork fica em estratégia.
> Regra de ouro: **nunca duas lanes escrevendo código ao mesmo tempo** na pasta OneDrive.
> Este sprint tem **duas fases sequenciais**. A Fase 1 SÓ começa com a Fase 0 verde. Se a Fase 0 não fechar verde, **PARE e reporte** — não avance.

---

## 1. Contexto do projeto
Amigo do Prédio — PWA mobile-first (Next.js 15.5, React 18, TypeScript 5.5, Tailwind 3.4), **local-first** (`localStorage` é a fonte de verdade), com migração incremental para backend relacional multi-tenant no Supabase, **tudo gated-off** (nenhuma flag `*_remote_enabled` ligada). Autorização real vive no **banco via RLS** (status×papel), não na UI. Anti-posicionamento permanente: **não competir com a administradora** (boleto, folha, financeiro, ponto, RH).

Estado de Git: `main = origin/main = 1ca1816` (merge do sprint Comentários+Moderação, **gate de CI verde**). Migrations 001→016. `MembershipRole` atual: `owner | manager | council | resident | viewer`.

## 2. Diagnóstico resumido (validado em 2026-06-18)
- **O commit está limpo e gate-verde. A árvore de trabalho local (pasta OneDrive) está CORROMPIDA.** O OneDrive converteu LF→CRLF **e truncou arquivos no meio do conteúdo**: **71 arquivos `.ts/.tsx` cortados** (sem EOF, string aberta). `git diff` acusa 421 arquivos "modificados" sem edição humana.
- Efeito: `npx tsc --noEmit` **falha** com `Unterminated string literal` / `'}' expected` em `lib/today.ts`, `lib/timeline.ts`, `lib/transparency.ts`, `lib/tenant/*` etc. **Não é defeito de código** — é mutilação de sincronização. O código bom está no `HEAD`/GitHub.
- Logo, "tsc 0 · 984 testes" é crível no nível do commit/CI, mas **não reverificável neste disco**. Precisa de árvore limpa.
- `app/api/admin/events/route.ts` referencia `service_role` (chave que ignora RLS) — confirmar proteção por auth admin.
- Bloqueio externo: **PF→PJ** trava o rollout (ligar flags), não o código gated-off.

## 3. Decisões tomadas (a partir das respostas do Lucas)
1. **Consolidar antes de expandir** e **sem demo** (sem qualquer trabalho de vitrine/UI de demonstração — uso interno apenas).
2. **Prioridade #1 = enviar UMA feature essencial**, mas só depois da base reverificada verde, e só a fatia menor e **já especificada**.
3. Feature escolhida: **Ordem de Serviço + papel `staff`** (`docs/espec-papel-funcionario-e-moderacao.md`, Parte 1). **Reservas fica FORA** deste sprint.
4. Manter todas as invariantes: não-exposição, soft-delete, RLS no banco, sem perda de dado, produção intocada.

## 4. Objetivo central
Deixar a **base reverificada de verdade** e a **lane à prova de OneDrive**, e então fechar o **loop operacional** (morador reporta → síndico vira ordem → funcionário executa e comprova → vira registro na linha do tempo) com **Ordem de Serviço + papel `staff`**, gated-off, RLS-provado, sem tocar produção.

---

## 5. Escopo INCLUÍDO

### FASE 0 — Estabilização & Reverificação (P0, BLOQUEANTE)
1. **Diagnosticar a árvore:** `git status`, `git diff --stat`. Confirmar se as "modificações" são CRLF/truncamento (não edição real).
2. **Restaurar limpo, sem commitar lixo:** descartar as mudanças espúrias de CRLF/truncamento (`git restore .` ou checkout limpo). **PROIBIDO commitar qualquer arquivo truncado.** Recomendação forte: trabalhar num **clone fora do OneDrive** e só sincronizar via Git.
3. **Blindar contra recorrência:** adicionar `.gitattributes` com `* text=auto eol=lf` (e `*.sql text eol=lf`), depois `git add --renormalize .`. Documentar no relatório.
4. **Reverificar de verdade e reportar números reais:** `npm ci` → `npm run typecheck` (tsc 0?) → `npm run test` (quantos passam/skipped?) → `npm run build` (conclui? bundle de `/` em kB?). 
5. **Gate de isolamento/CI verde** (se tocar `lib/`/`supabase/`).
6. **Confirmar `service_role`:** auditar `app/api/admin/events/route.ts` — provar que só roda server-side e exige auth admin. Documentar.

> **Portão:** Fase 0 só está pronta com tsc 0 real, testes verdes reais, build concluído, bundle reportado, lane normalizada e `service_role` confirmado. **Se algo não fechar, PARE e reporte. Não inicie a Fase 1.**

### FASE 1 — Ordem de Serviço + papel `staff` (P1/P2, só após Fase 0 verde)
Seguir `docs/espec-papel-funcionario-e-moderacao.md` (Parte 1) e `docs/molde-migracao-relacional.md`.
1. **Papel (P1):** adicionar `staff` ao enum `MembershipRole` em `lib/tenant/types.ts` — **aditivo**, sem alterar os papéis existentes nem RLS já provado. Rótulo PT-BR "Funcionário/Zelador".
2. **Migration 017 `service_orders` (P1):** tabela local-first-espelhada + RLS status×papel:
   - `staff` lê e atualiza **somente as ordens atribuídas a si**; `manager/owner` criam e veem todas; `council` lê; `resident` não acessa.
   - Marcar como feita + comprovar (foto/nota) **só** pela staff dona da ordem.
   - **Soft-only:** sem policy/grant de DELETE. Defaults seguros. Idempotente com seção de rollback.
3. **Molde relacional gated (P1):** `lib/service-orders.ts` (local-first) + `lib/tenant/serviceOrdersRemote/Merge/Sync.ts`, atrás de **nova flag** `service_orders_remote_enabled = false` em `lib/feature-flags.ts`.
4. **Loop (P2):** ligação mínima solicitação → ordem → execução comprovada → `community-timeline`. Sem UI de vitrine; o mínimo atrás de papel.
5. **Gate de CI (P1):** casos contra Postgres real provando staff×papel.

---

## 6. Escopo EXCLUÍDO (não fazer)
Reservas · denúncia com SLA · IA / "Pergunte ao Prédio" · ligar qualquer flag de exposição/remoto · RH/folha/ponto/contrato · qualquer demo, polish visual ou UI de vitrine · flip de navegação · refatorar `lib/financial*` (≈18 dependentes) · qualquer mudança em produção · NLP de "alvo nominal".

## 7. Prioridades
- **P0:** Fase 0 inteira (estabilização + reverificação real + `.gitattributes` + service_role).
- **P1:** enum `staff` aditivo · migration 017 + RLS · molde gated + flag off · gate de CI staff×papel.
- **P2:** wiring mínimo do loop até a timeline · documentação do service_role.

## 8. Instruções técnicas
- Commit **por caminho explícito**; antes de cada commit: `tsc` + `vitest` (+ gate se tocar `lib/`/`supabase/`) **verdes**.
- Migrations **idempotentes com rollback**; `supabase db reset` aplica 001→017 limpo.
- **Não** alterar `MembershipRole` existente — só **adicionar** `staff`. Não tocar RLS já provado (009–016) exceto o necessário para 017.
- Preservar bundle: `/` < 230 kB; sem libs novas.
- Não tocar `lib/financial*`.

## 9. Instruções de produto
`staff` = "saber o que fazer e comprovar que fez", **não** RH. A entidade existe para fechar o loop social/memória já existente (`RequestsPanel`, `community-timeline`), sem inventar módulo de pessoal. Anti-posicionamento mantido.

## 10. Instruções de UX
Sem feature visual obrigatória e **sem demo**. Se expor algo, mínimo e atrás de papel; respeitar 440px e o orçamento de bundle. Estética Apple-like: nada novo que não seja simples e óbvio.

## 11. Instruções de segurança
RLS no banco prova que `staff` não vê o que não é seu (não a UI). Sem grant de DELETE (soft). Defaults fechados. Não-Exposição (todas as flags off). `service_role` só server-side, atrás de auth admin.

## 12. Instruções de testes
Gate contra Postgres real: staff vê só as próprias ordens; **não** vê de outra unidade/condomínio (isolamento); manager vê todas; resident barrado; forja de `created_by`/atribuição barrada; **sem hard-delete** (ordem persiste). Regressão completa verde + os novos casos.

## 13. Critérios de aceite
- **Fase 0:** tsc 0 real · testes verdes reais (reportar número) · build conclui · bundle de `/` reportado · `.gitattributes` aplicado e renormalizado · `service_role` auditado e documentado · nenhum arquivo truncado commitado.
- **Fase 1:** 017 idempotente + rollback · RLS staff×papel **gate-verde** contra DB real · `service_orders_remote_enabled=false` · produção intocada · sem perda de dado · relatório escrito.

## 14. Comandos sugeridos
```bash
git status && git diff --stat
git restore .                  # descartar CRLF/truncamento (NÃO commitar truncados)
printf '* text=auto eol=lf\n*.sql text eol=lf\n' > .gitattributes
git add --renormalize . && git status
npm ci
npm run typecheck && npm run test && npm run build
# Fase 1:
supabase db reset              # aplica 001→017
# rodar o workflow de gate de isolamento
```

## 15. Arquivos prováveis a revisar/tocar
`lib/tenant/types.ts` (enum `staff`) · `lib/feature-flags.ts` (flag nova) · `supabase/migrations/017_service_orders.sql` (novo) · `lib/service-orders.ts` (novo) · `lib/tenant/serviceOrders{Remote,Merge,Sync}.ts` (novos) · `docs/espec-papel-funcionario-e-moderacao.md` (spec-fonte) · `docs/molde-migracao-relacional.md` (molde) · `.github/workflows/gate-isolamento.yml` (gate) · `app/api/admin/events/route.ts` (auditoria service_role) · `lib/community-timeline.ts` (loop).

## 16. Riscos e mitigação
- **Commitar arquivo truncado** → Fase 0 bloqueante + `.gitattributes` + clone fora do OneDrive.
- **Quebrar dependentes de `financial`** → não tocar.
- **Inflar bundle** → medir antes/depois; sem libs novas.
- **Enum de papel afetar RLS existente** → mudança aditiva; gate prova que 009–016 seguem verdes.
- **Duas lanes ao mesmo tempo** → confirmar que o Cowork não está escrevendo código.

## 17. Plano de rollback
Cada migration idempotente com seção de rollback explícita. Feature inteira atrás de flag `false`. Se a Fase 0 não fechar verde, **reverter para `1ca1816` limpo e reportar** — não prosseguir. Nenhum passo pode tocar produção.

## 18. Checklist final
- [ ] Árvore limpa e normalizada (`.gitattributes`, sem truncados)
- [ ] tsc 0 real · testes verdes reais (número) · build ok · bundle reportado
- [ ] `service_role` auditado e documentado
- [ ] enum `staff` aditivo, sem regressão em 009–016
- [ ] 017 idempotente + rollback, RLS staff×papel gate-verde
- [ ] flag `service_orders_remote_enabled=false` · produção intocada · sem perda de dado
- [ ] relatório escrito

## 19. Relatório final exigido
Gerar `docs/relatorio-sprint-estabilizacao-ordem-servico-2026-06-XX.md` com: números **reais** (tsc, testes passados/skipped, bundle de `/`), o que a Fase 0 encontrou e corrigiu na lane, tabela "regra como ficou × spec" para a Ordem de Serviço, lista de commits por caminho, invariantes confirmadas, e **o que ficou incerto + como confirmar**. Honestidade sobre desvios é obrigatória.
