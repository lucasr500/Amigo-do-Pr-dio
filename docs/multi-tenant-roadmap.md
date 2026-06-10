# Multi-Tenant Roadmap — Amigo do Prédio

**Última atualização:** 2026-06-09  
**Status atual:** Fundação criada (Sprint 6.0). Dados do condomínio ainda em localStorage.

---

## Estado atual (pós Sprint 6.0)

O app é **local-first single-device**. Toda a lógica de condomínio (moradores, documentos, financeiro, agenda) vive em localStorage. O Supabase é usado para:
- Autenticação (magic link)
- Backup/sync de snapshots (app_snapshots)
- Telemetria anônima (events)

A Sprint 6.0 criou a **fundação** do modelo multi-tenant:
- Tabelas `condominios` + `memberships` no Supabase
- RLS via funções SECURITY DEFINER (`is_condominio_member`, `has_condominio_role`)
- Camada de código: `lib/tenant/` com `tenantClient.ts`, `effectiveRole.ts`
- `ensureDefaultCondominioForUser()` — cria condomínio automático no primeiro login
- `sync_enabled` ativado automaticamente para usuários autenticados
- Rate limiting em rotas de admin

---

## O que NÃO foi migrado (e está fora de escopo desta sprint)

| Dado | Onde vive | Migração planejada |
|------|-----------|---------------------|
| Dados de moradores/unidades | localStorage | Sprint 7+ |
| Documentos | localStorage | Sprint 7+ |
| Financeiro (despesas, receitas) | localStorage | Sprint 8+ |
| Agenda (eventos) | localStorage | Sprint 7+ |
| Ocorrências | localStorage | Sprint 8+ |
| Pendências | localStorage | Sprint 8+ |
| Posts/mural comunitário | localStorage | Sprint 9+ |
| Fornecedores | localStorage | Sprint 9+ |

---

## Roadmap de evolução

### Sprint 7 — Primeiro módulo relacional real

**Objetivo:** Migrar um módulo de médio risco para Supabase relacional, mantendo localStorage como cache/fallback.

**Candidato recomendado:** Agenda (eventos). Motivos:
- Volume baixo de dados por condomínio
- Schema simples (sem relacionamentos complexos)
- Facilidade de merge local↔remoto (eventos têm timestamp natural)

**Passos:**
1. Migration `006_agenda.sql` — tabela `agenda_items` com `condominio_id` (FK para condominios)
2. RLS: membro ativo pode ler; owner/manager pode escrever
3. Adaptar `lib/session-agenda.ts` para dual-write (localStorage + Supabase)
4. Sync bidirecional com resolução de conflito por `updated_at`
5. Indicador visual de sincronização no módulo

### Sprint 8 — Módulo financeiro relacional

**Objetivo:** Migrar despesas/receitas para Supabase com suporte a multi-device.

**Passos:**
1. Migrations `007_financeiro.sql` — tabela `lancamentos` com `condominio_id`
2. RLS: owner/manager/council podem escrever; resident/viewer podem ler
3. Dual-write com resolução de conflito
4. Relatórios cross-device

### Sprint 9 — Multi-device real

**Objetivo:** O mesmo condomínio funciona em dois dispositivos ao mesmo tempo.

**Passos:**
1. Eliminar dependência do localStorage como fonte de verdade para dados relacionais
2. Real-time sync via Supabase Realtime (Postgres CDC) ou polling
3. UI de resolução de conflito para usuário
4. Teste de carga com dados reais

### Sprint 10 — Multi-tenant completo

**Objetivo:** Usuário pode ser membro de múltiplos condomínios; condomínio tem múltiplos membros reais.

**Passos:**
1. UI de troca de condomínio ativo (dropdown no header)
2. Convites por email (fluxo de onboarding)
3. UI de gestão de memberships (roles, status)
4. Notificações cross-member
5. Isolamento de dados garantido por RLS (auditoria)

---

## Decisões de arquitetura

### Por que não migrar tudo agora?

O app tem ~15 módulos com dados em localStorage. Migrar todos de uma vez:
1. Risco alto de regressão (44 componentes dependem de session.ts)
2. Difícil de testar em isolamento
3. Pode quebrar o fluxo guest/demo que funciona sem Supabase
4. Sem dados reais de usuários para validar o schema

**Estratégia correta:** migrar um módulo por sprint, com dual-write e fallback localStorage.

### Por que SECURITY DEFINER nas funções RLS?

Políticas RLS que checam `memberships` para determinar acesso a `condominios` criariam recursão infinita (Postgres não tem CTEs em RLS). Funções SECURITY DEFINER quebram a recursão ao executar com privilégios de dono da função, não do usuário chamador.

### Por que `sync_enabled` é ativado automaticamente?

O padrão de UX correto é: usuário que se autentica espera que seus dados sincronizem. Manter `sync_enabled: false` para autenticados seria confuso. A implementação é segura porque:
- Só ativa se o usuário não tomou decisão explícita (sem override no localStorage)
- Guest continua sem sync
- Demo mode tem guard no syncEngine

---

## Pendências de infra (não código)

1. **Aplicar migration 004** — Remove SELECT policy aberta na tabela `events` (telemetria)
2. **Aplicar migration 005** — Cria `condominios` + `memberships` no Supabase
3. **Configurar `SUPABASE_SERVICE_ROLE_KEY`** — em `.env.local` e na Vercel (para `/api/admin/events`)
4. **Rate limiting distribuído** — O rate limiting atual é em memória (reseta por cold start). Para produção, usar Vercel Rate Limiting ou Upstash Redis.
5. **HSTS / HTTPS** — Configurado pela Vercel automaticamente em produção
