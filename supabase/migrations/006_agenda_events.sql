-- Migração 006 — Agenda relacional por condomínio (Fatia 2a — dual-write PUSH)
-- Executar APÓS migrations 001-005.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: Espelhar (write-through) os eventos de Agenda do app para uma tabela
-- relacional por condomínio. A LEITURA-com-merge é a Fatia 2b. Nesta fatia, o app
-- continua tratando localStorage como fonte de verdade; esta tabela recebe apenas a
-- cópia (push) das escritas quando o flag `agenda_remote_enabled` estiver ligado.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "agenda_events: leitura por membro"        ON agenda_events;
--   DROP POLICY IF EXISTS "agenda_events: escrita por gestor (ins)"  ON agenda_events;
--   DROP POLICY IF EXISTS "agenda_events: escrita por gestor (upd)"  ON agenda_events;
--   DROP POLICY IF EXISTS "agenda_events: escrita por gestor (del)"  ON agenda_events;
--   DROP TABLE IF EXISTS agenda_events;

-- ─────────────────────────────────────────────
-- TABELA: agenda_events
-- id é gerado no cliente (string estável) e é a chave do upsert (onConflict: "id").
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda_events (
  id                  text PRIMARY KEY,
  condominio_id       uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  title               text,
  date                date,
  type                text,
  note                text,
  responsavel         text,
  prioridade          text,
  recurrence          text,
  template_id         text,
  source              text,
  linked_pendencia_id text,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agenda_events_condominio_idx       ON agenda_events(condominio_id);
CREATE INDEX IF NOT EXISTS agenda_events_condominio_date_idx  ON agenda_events(condominio_id, date);

-- updated_at automático (reutiliza update_updated_at_column criada na migration 001)
CREATE OR REPLACE TRIGGER agenda_events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS: agenda_events
-- Leitura: qualquer membro ativo do condomínio.
-- Escrita (insert/update/delete): papéis com manage_agenda — owner, manager, council
-- (ver lib/tenant/effectiveRole.ts). Usa as funções SECURITY DEFINER da migration 005.
-- ─────────────────────────────────────────────
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_events: leitura por membro" ON agenda_events;
CREATE POLICY "agenda_events: leitura por membro"
  ON agenda_events FOR SELECT
  USING (is_condominio_member(condominio_id));

DROP POLICY IF EXISTS "agenda_events: escrita por gestor (ins)" ON agenda_events;
CREATE POLICY "agenda_events: escrita por gestor (ins)"
  ON agenda_events FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "agenda_events: escrita por gestor (upd)" ON agenda_events;
CREATE POLICY "agenda_events: escrita por gestor (upd)"
  ON agenda_events FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "agenda_events: escrita por gestor (del)" ON agenda_events;
CREATE POLICY "agenda_events: escrita por gestor (del)"
  ON agenda_events FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

-- GRANT de tabela: RLS gateia linhas; GRANT habilita acesso à tabela. Idempotente.
GRANT ALL ON TABLE agenda_events TO anon, authenticated, service_role;
