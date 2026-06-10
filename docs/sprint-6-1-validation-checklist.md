# Sprint 6.1 — Checklist de Validação Manual

**Branch:** `sprint-6-fundacao-saas-real`
**Pré-requisito antes de mergear na main ou aplicar migrations em produção.**

---

## 0. Preparação do ambiente local

### 0.1 Configurar `.env.local`

Copie `.env.example` como `.env.local` e preencha os valores reais:

```
ADMIN_KEY=<senha forte, mínimo 16 chars>
SUPABASE_SERVICE_ROLE_KEY=<service_role key do Supabase Settings → API>
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid key, opcional>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Verificações:**
- [ ] `.env.local` existe e está preenchido
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está presente (começa com `eyJ...`)
- [ ] `git status` não mostra `.env.local` rastreado
- [ ] `git diff` não contém nenhuma das chaves acima

---

## 1. Aplicar migrations no Supabase SQL Editor

**ORDEM OBRIGATÓRIA:** 004 antes de 005.

### 1.1 Migration 004 — Remover SELECT aberto da tabela events

1. Abrir [Supabase Dashboard](https://supabase.com) → seu projeto → SQL Editor
2. Colar o conteúdo de `supabase/migrations/004_fix_events_policy.sql`
3. Executar
4. Verificar: sem erros. Esperado: `DROP POLICY`

**Confirmar no Supabase:**
- [ ] Authentication → Policies → tabela `events` → policy `read_anon` não existe mais
- [ ] Policy `insert_only` ainda existe em events

### 1.2 Migration 005 — Fundação multi-tenant

1. No SQL Editor, colar o conteúdo de `supabase/migrations/005_multi_tenant_foundation.sql`
2. Executar
3. Verificar: sem erros. Esperado: criação de tabelas, funções e policies

**Confirmar no Supabase:**
- [ ] Table Editor → tabela `condominios` existe com colunas: id, owner_id, nome, slug, created_at, updated_at, archived_at
- [ ] Table Editor → tabela `memberships` existe com colunas: id, user_id, condominio_id, role, status, created_at, updated_at
- [ ] Authentication → Policies → `condominios`: 3 policies (leitura, atualização, inserção)
- [ ] Authentication → Policies → `memberships`: 5 policies
- [ ] Database → Functions: `is_condominio_member` e `has_condominio_role` existem

---

## 2. Validação de autenticação

### 2.1 Magic link login

1. `npm run dev` → abrir http://localhost:3000
2. Clicar em "Entrar" / "Minha conta"
3. Informar um email real
4. Verificar recebimento do magic link
5. Clicar no link → ser redirecionado para o app já logado

**Confirmar:**
- [ ] Sessão criada (ícone de usuário ou e-mail exibido)
- [ ] Console sem erros de autenticação
- [ ] `localStorage.getItem("amigo_active_condominio_id")` tem um UUID (inspecionar via DevTools → Application → Storage)
- [ ] `localStorage.getItem("amigo_feature_flags")` contém `"sync_enabled":true` (se não havia override)

### 2.2 Guest mode

1. Abrir janela anônima (Ctrl+Shift+N) → http://localhost:3000
2. **Não** fazer login

**Confirmar:**
- [ ] App carrega normalmente em modo guest
- [ ] Dados de exemplo/demo visíveis (sem erro de autenticação)
- [ ] Nenhum erro no console relacionado a Supabase ou tenant
- [ ] `localStorage.getItem("amigo_active_condominio_id")` é `null`

### 2.3 Demo mode

1. No guest mode, clicar em "Ver demo" / ativar modo demo

**Confirmar:**
- [ ] Dados demo carregados normalmente
- [ ] Banner de demo visível
- [ ] Sync não foi ativado automaticamente (demo = guest)

---

## 3. Validação do tenant (condomínio ativo)

### 3.1 Criação automática de condomínio após login

Após o login da seção 2.1:

1. Abrir DevTools → Console
2. Executar: `localStorage.getItem("amigo_active_condominio_id")`

**Confirmar:**
- [ ] Retorna um UUID não-null (ex: `"a1b2c3d4-e5f6-..."`)
- [ ] No Supabase → Table Editor → `condominios`: linha criada com `owner_id` = seu user.id
- [ ] No Supabase → Table Editor → `memberships`: linha com `role='owner'`, `status='active'`

### 3.2 Membership ativa controla acesso

1. No Supabase, alterar manualmente `status` da membership para `'suspended'`
2. Recarregar o app
3. Verificar comportamento

**Confirmar:**
- [ ] App não concede acesso a dados protegidos
- [ ] `resolveEffectiveRole` retorna null para membership suspensa

### 3.3 activeCondominioId não permite acesso cross-tenant

1. Pegar o UUID de um condomínio que pertence a outro usuário de teste (se disponível)
2. Executar no console: `localStorage.setItem("amigo_active_condominio_id", "<uuid-alheio>")`
3. Tentar qualquer operação de leitura de condomínio

**Confirmar:**
- [ ] RLS bloqueia a query (erro `PGRST116` ou similar)
- [ ] Nenhum dado do condomínio alheio é retornado

---

## 4. Validação do sync

### 4.1 Sync ativado após login

Após login, verificar no console:

```js
JSON.parse(localStorage.getItem("amigo_feature_flags") || "{}").sync_enabled
```

**Confirmar:**
- [ ] Retorna `true` (caso não havia override explícito)

### 4.2 Override explícito preservado

1. Antes de fazer login, executar: `localStorage.setItem("amigo_feature_flags", JSON.stringify({ sync_enabled: false }))`
2. Fazer login

**Confirmar:**
- [ ] Após login, `sync_enabled` continua `false` (override preservado)

---

## 5. Validação das rotas admin server-side

### 5.1 `/api/admin/events` com rate limiting

```bash
# Sem ADMIN_KEY em dev → deve retornar eventos ou "unavailable"
curl http://localhost:3000/api/admin/events

# Com ADMIN_KEY configurado
curl -H "Authorization: Bearer <seu-ADMIN_KEY>" http://localhost:3000/api/admin/events
```

**Confirmar:**
- [ ] Sem header Authorization com ADMIN_KEY configurado → 401
- [ ] Com header correto → 200 com `{ events: [...], source: "remote" }` ou `source: "unavailable"`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca aparece no response body
- [ ] Após 60 requests rápidos → 429 com `Retry-After` header

### 5.2 `/api/admin/auth`

```bash
curl -X POST http://localhost:3000/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password": "senha-errada"}'
```

**Confirmar:**
- [ ] Senha errada → 401
- [ ] Senha correta → `{"ok": true}`
- [ ] Após 10 tentativas rápidas → 429

---

## 6. Dados operacionais NÃO migrados (invariante Sprint 6.1)

Verificar que dados do condomínio ainda estão em localStorage, não em Supabase:

1. DevTools → Application → Local Storage
2. Verificar chaves `amigo_pendencias`, `amigo_agenda`, `amigo_documentos`, `amigo_ocorrencias`

**Confirmar:**
- [ ] Esses dados ainda existem em localStorage (não foram movidos)
- [ ] No Supabase → Table Editor → NÃO existe tabela `condominio_documents`, `condominio_announcements` ou `condominio_agenda_events`
- [ ] Sprint 7.0 ainda não foi executada

---

## 7. Headers de segurança

```bash
curl -I http://localhost:3000
```

**Confirmar:**
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Content-Security-Policy: base-uri 'self'; object-src 'none'`

---

## 8. Checks técnicos finais

```bash
npx tsc --noEmit       # deve ser: 0 erros
npx eslint .           # deve ser: 0 warnings
npx vitest run         # deve ser: 792/792 passing
npx next build         # deve ser: sem erros
```

**Confirmar:**
- [ ] TypeScript: 0 erros
- [ ] ESLint: 0 warnings
- [ ] Vitest: 792/792
- [ ] Build: limpo

---

## 9. Critério de decisão para merge na main

Marque o status:

| Critério | Status |
|---|---|
| `.env.local` configurado com todas as variáveis | ⬜ |
| Migration 004 aplicada com sucesso | ⬜ |
| Migration 005 aplicada com sucesso | ⬜ |
| Login funciona e cria condomínio/membership | ⬜ |
| Guest mode não quebra | ⬜ |
| Demo mode não quebra | ⬜ |
| Sync ativa após login (sem override) | ⬜ |
| `/api/admin/events` retorna dados com auth correta | ⬜ |
| Rate limiting bloqueia abuso | ⬜ |
| Dados operacionais ainda em localStorage (Sprint 7 não rodada) | ⬜ |
| TypeScript, ESLint, testes e build passando | ⬜ |

**Se todos marcados: APTO para merge na main.**

### Comando de merge:

```bash
git checkout main
git pull origin main
git merge sprint-6-fundacao-saas-real
npx tsc --noEmit && npx eslint && npx vitest run && npx next build
git push origin main
```

Após push: Vercel deploy automático em ~2 minutos.

### Variáveis a adicionar no Vercel antes do push:
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → Environment Variables)
- `ADMIN_KEY` (se ainda não configurada)

---

## 10. Rollback de emergência

Se algo der errado em produção após o merge:

```bash
# Reverter main para o commit anterior
git revert HEAD --no-edit
git push origin main
```

Para rollback das migrations no Supabase (SQL Editor):
```sql
-- Reverter 005
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS condominios;
DROP FUNCTION IF EXISTS is_condominio_member;
DROP FUNCTION IF EXISTS has_condominio_role;

-- Reverter 004 (restaurar policy SELECT para anon)
CREATE POLICY "read_anon" ON events FOR SELECT TO anon USING (true);
```
