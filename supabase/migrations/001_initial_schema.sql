-- Migração 001 — Schema inicial do Amigo do Prédio
-- Supabase / PostgreSQL
-- Executar no SQL Editor do projeto Supabase ou via CLI

-- ─────────────────────────────────────────────
-- TABELA: profiles
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  display_name text
);

-- Atualiza updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

-- RLS: cada usuário só acessa o próprio perfil
alter table profiles enable row level security;

create policy "profiles: leitura própria"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: inserção própria"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: atualização própria"
  on profiles for update
  using (auth.uid() = id);


-- ─────────────────────────────────────────────
-- TABELA: app_snapshots
-- ─────────────────────────────────────────────
create table if not exists app_snapshots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  payload     jsonb not null,
  version     int not null default 4,
  device_hint text
);

-- Um snapshot por usuário (upsert substitui)
create unique index if not exists app_snapshots_user_idx
  on app_snapshots(user_id);

create trigger app_snapshots_updated_at
  before update on app_snapshots
  for each row execute procedure update_updated_at_column();

-- RLS: cada usuário só acessa o próprio snapshot
alter table app_snapshots enable row level security;

create policy "snapshots: leitura própria"
  on app_snapshots for select
  using (auth.uid() = user_id);

create policy "snapshots: inserção própria"
  on app_snapshots for insert
  with check (auth.uid() = user_id);

create policy "snapshots: atualização própria"
  on app_snapshots for update
  using (auth.uid() = user_id);
