# Fase 88 — Plano técnico Supabase / Backend mínimo

> 🔄 **Parcialmente superado (2026-06-14).** Este documento descreve o backend mínimo
> single-user (snapshot por usuário). A **direção oficial agora é SaaS multi-tenant** —
> o roadmap técnico canônico é **`docs/multi-tenant-roadmap.md`** (Sprints 7–10). Itens
> deste plano marcados como "não objetivo" (Realtime, multi-device) **passaram a ser
> direção**. Correções factuais: o SDK `@supabase/supabase-js` **já está instalado** e
> `lib/supabase/client.ts`, `lib/auth/authClient.ts`, `lib/sync/syncEngine.ts` **já são
> implementações reais** (não stubs). Mantido como base histórica do modelo snapshot.

**Data de elaboração:** 2026-05-23  
**Escopo:** Documento de arquitetura e decisão. Não implica código funcional neste ciclo.

---

## 1. Visão geral

O Amigo do Prédio é hoje 100% local — dados vivem no `localStorage` do dispositivo. Este documento define o caminho mínimo para adicionar backend persistente via Supabase, preservando o funcionamento offline-first e sem forçar cadastro de usuário.

A estratégia é **snapshot-based**: em vez de sincronizar linha a linha, o app serializa e sobe o estado completo (`UserBackup` v4) como um único blob JSON. Isso elimina conflitos de merge, simplifica o RLS e mantém o código cliente simples.

---

## 2. Objetivos deste ciclo (quando implementado)

- Permitir que o usuário faça login com e-mail/senha via Supabase Auth
- Subir um snapshot do estado local para a nuvem após login
- Baixar o snapshot na abertura do app (se há sessão ativa)
- Exibir CTA neutro de sincronização no onboarding e em Conta

## 3. Não objetivos (explicitamente fora do escopo)

- Sync em tempo real (Realtime)
- Multi-dispositivo com resolução de conflito
- Conta obrigatória para usar o app
- Integração com provedores OAuth (Google, Apple) — fase futura
- Cobrança / paywall neste ciclo

---

## 4. Schema do banco de dados

### Tabela `profiles`

Armazena metadados do usuário, separados do snapshot principal.

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  display_name text
);
```

### Tabela `app_snapshots`

Um snapshot por usuário. `upsert` substitui o anterior.

```sql
create table app_snapshots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  payload     jsonb not null,
  version     int not null default 4,
  device_hint text
);

create unique index app_snapshots_user_idx on app_snapshots(user_id);
```

O campo `payload` contém o objeto `UserBackup` v4 completo (profile, memoria, favorites, checklists, pendencias, ocorrencias, agenda).

---

## 5. Row Level Security (RLS)

Cada usuário só lê e escreve os próprios registros.

```sql
-- profiles
alter table profiles enable row level security;

create policy "profiles: leitura própria"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: escrita própria"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles: atualização própria"
  on profiles for update using (auth.uid() = id);

-- app_snapshots
alter table app_snapshots enable row level security;

create policy "snapshots: leitura própria"
  on app_snapshots for select
  using (auth.uid() = user_id);

create policy "snapshots: inserção própria"
  on app_snapshots for insert with check (auth.uid() = user_id);

create policy "snapshots: atualização própria"
  on app_snapshots for update using (auth.uid() = user_id);
```

---

## 6. Estratégia de autenticação

- **Método:** e-mail + senha (Supabase Auth nativo)
- **SDK:** `@supabase/supabase-js` — importado APENAS em módulos lazy-loaded para não inflar o bundle `/`
- **Sessão:** armazenada via `localStorage` pelo SDK; detectada no boot via `getSession()`
- **Onboarding:** login aparece como CTA neutro; o app funciona 100% sem conta

### Fluxo de login

```
Usuário → signInWithPassword() → sessão ativa
  → downloadSnapshot() → importUserData() → setRefreshKey()
```

### Fluxo de upload

```
Ação do usuário → exportUserData() → buildSnapshot() → uploadSnapshot()
```

---

## 7. Estratégia de sincronização

### Upload

Disparado manualmente pelo usuário (botão "Sincronizar agora" em Conta) ou automaticamente no `beforeunload`.

```
exportUserData()   →  payload: UserBackup
buildSnapshot()    →  { user_id, payload, version: 4, device_hint }
upsert app_snapshots where user_id = auth.uid()
```

### Download

Disparado na abertura do app se há sessão ativa.

```
getSession()  →  se autenticado:
  select * from app_snapshots where user_id = auth.uid() limit 1
  →  importUserData(row.payload)
  →  setRefreshKey()
```

### Política de conflito

Last-write-wins com `updated_at`. Não há merge. O usuário escolhe qual versão prevalece se perceber divergência (UI: "Dados locais são mais recentes — deseja sobrescrever a nuvem?").

---

## 8. Privacidade e LGPD

- Dados são criptografados em trânsito (HTTPS Supabase)
- Dados em repouso: Supabase gerencia criptografia de disco
- Conta é opcional; usuário sem conta não tem dados na nuvem
- Exclusão de conta → `on delete cascade` remove perfil e snapshot automaticamente
- A política de privacidade (a ser redigida antes do lançamento público) deve explicitar retenção de dados

---

## 9. Variáveis de ambiente necessárias

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Já presente em `.env.example`. O app funciona normalmente sem essas variáveis (modo local).

---

## 10. Integração com bundle

O SDK `@supabase/supabase-js` (~80 kB gzip) **não deve ser importado no chunk inicial** de `/`.

Estratégia:
- `lib/supabase/client.ts` importa o SDK com `import()` dinâmico ou é usado apenas dentro de componentes `dynamic()`
- `lib/auth/authClient.ts` e `lib/sync/syncEngine.ts` são importados somente em componentes de UI lazy-loaded (ex.: painel de conta/login)
- Limite de bundle: rota `/` deve permanecer ≤ 230 kB First Load JS

---

## 11. Checklist de produção (pré-lançamento)

- [ ] Criar projeto Supabase (produção)
- [ ] Executar `supabase/migrations/001_initial_schema.sql`
- [ ] Habilitar RLS em ambas as tabelas
- [ ] Configurar variáveis no ambiente de deploy (Vercel / Railway)
- [x] Instalar `@supabase/supabase-js` (feito) — `lib/supabase/client.ts` já usa o SDK real (lazy)
- [x] Implementar `authClient.ts` com SDK real (feito — magic link via `signInWithOtp`)
- [x] Implementar `syncEngine.ts` com SDK real (feito — upload/download de snapshots)
- [ ] Testar login / logout / upload / download
- [ ] Testar exclusão de conta e cascade
- [ ] Verificar bundle ≤ 230 kB após instalação do SDK
- [ ] Redigir Política de Privacidade e Termos de Uso
- [ ] Adicionar link para Política de Privacidade na tela de login

---

## 12. Rollback

Se o backend causar problemas:

1. Remover import do SDK (já isolado em `lib/supabase/`)
2. Remover CTA de login do onboarding e Conta
3. O app retorna ao modo 100% local sem quebra de dados
