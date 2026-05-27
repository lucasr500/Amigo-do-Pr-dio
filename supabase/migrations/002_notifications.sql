-- Migração 002 — Tabela de notificações e health snapshots
-- Executar após 001_initial_schema.sql

-- ─────────────────────────────────────────────
-- TABELA: notifications
-- Histórico de notificações enviadas/geradas por usuário
-- ─────────────────────────────────────────────
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  type         text not null,
  severity     text not null default 'info',
  title        text not null,
  body         text not null,
  source_module text,
  action_key   text,
  read         boolean not null default false,
  dismissed    boolean not null default false,
  scheduled_for timestamptz
);

create index if not exists notifications_user_idx
  on notifications(user_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications: leitura própria"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: inserção própria"
  on notifications for insert
  with check (auth.uid() = user_id);

create policy "notifications: atualização própria"
  on notifications for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- TABELA: health_snapshots
-- Histórico do Health Score por usuário e data
-- ─────────────────────────────────────────────
create table if not exists health_snapshots (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  snapshot_date date not null,
  percentage   int not null,
  status_key   text not null,
  factor_count int not null default 0,
  missing_count int not null default 0,
  partial_count int not null default 0
);

create unique index if not exists health_snapshots_user_date_idx
  on health_snapshots(user_id, snapshot_date);

alter table health_snapshots enable row level security;

create policy "health_snapshots: leitura própria"
  on health_snapshots for select
  using (auth.uid() = user_id);

create policy "health_snapshots: inserção própria"
  on health_snapshots for insert
  with check (auth.uid() = user_id);

create policy "health_snapshots: upsert própria"
  on health_snapshots for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- TABELA: audit_log
-- Registro de ações operacionais do usuário
-- ─────────────────────────────────────────────
create table if not exists audit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  category     text not null,
  action       text not null,
  detail       text,
  impact       text
);

create index if not exists audit_log_user_idx
  on audit_log(user_id, created_at desc);

alter table audit_log enable row level security;

create policy "audit_log: leitura própria"
  on audit_log for select
  using (auth.uid() = user_id);

create policy "audit_log: inserção própria"
  on audit_log for insert
  with check (auth.uid() = user_id);

-- Atualiza versão do snapshot para v5
update app_snapshots set version = 5 where version < 5;
