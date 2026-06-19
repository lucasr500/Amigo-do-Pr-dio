-- Migração 017 — Ordem de Serviço (service_orders) + papel staff
-- Executar APÓS migrations 001-016.
-- Idempotente: DROP CONSTRAINT/POLICY IF EXISTS; IF NOT EXISTS na tabela/índices.
--
-- OBJETIVO (objetivo 7 / spec Parte 1): fechar o loop operacional —
--   morador reporta (Canal) → síndico vira ORDEM → funcionário executa e COMPROVA (foto/nota)
--   → registro na linha do tempo. NÃO é RH (folha/ponto/contrato é da administradora).
--
-- PAPEL: adiciona 'staff' ao enum de memberships (aditivo — não altera papéis existentes).
--
-- RLS (status × papel):
--   SELECT: owner/manager/council leem TODAS; staff lê SÓ as atribuídas a si; resident/viewer NÃO acessam.
--   INSERT: só owner/manager (criam e atribuem); created_by = auth.uid().
--   UPDATE: owner/manager (tudo); staff só na PRÓPRIA ordem (assignee = sua membership) e só campos
--           operacionais (status, evidence) — um trigger reverte qualquer alteração de escopo.
--   DELETE: SEM policy/grant → soft-only (cancelamento é status 'cancelada'), nunca hard-delete.
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS service_orders_protect_columns ON service_orders;
--   DROP TRIGGER IF EXISTS service_orders_updated_at ON service_orders;
--   DROP FUNCTION IF EXISTS protect_service_order_columns();
--   DROP FUNCTION IF EXISTS is_assigned_staff(uuid, uuid);
--   DROP POLICY IF EXISTS "service_orders: leitura gestão/conselho ou staff atribuída" ON service_orders;
--   DROP POLICY IF EXISTS "service_orders: criação por gestão" ON service_orders;
--   DROP POLICY IF EXISTS "service_orders: update por gestão" ON service_orders;
--   DROP POLICY IF EXISTS "service_orders: update por staff atribuída" ON service_orders;
--   DROP TABLE IF EXISTS service_orders;
--   -- reverter o enum (só se nenhuma membership 'staff' existir):
--   ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
--   ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
--     CHECK (role IN ('owner','manager','council','resident','viewer'));

-- ─────────────────────────────────────────────
-- PAPEL: adicionar 'staff' ao CHECK de memberships (aditivo)
-- ─────────────────────────────────────────────
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('owner','manager','council','resident','viewer','staff'));

-- ─────────────────────────────────────────────
-- TABELA: service_orders
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_orders (
  id                     text PRIMARY KEY,                       -- ID estável do cliente (os_...)
  condominio_id          uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  created_by             uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  title                  text NOT NULL,
  description            text,
  origin                 text NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','solicitacao')),
  linked_request_id      text,                                   -- quando nasce do Canal
  category               text NOT NULL DEFAULT 'outro'
                           CHECK (category IN ('manutencao','limpeza','seguranca','obra','outro')),
  status                 text NOT NULL DEFAULT 'aberta'
                           CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
  -- o staff responsável (base da RLS de staff). Nulo = não atribuída.
  assignee_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  priority               text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa','media','alta')),
  due_date               date,
  evidence               jsonb NOT NULL DEFAULT '[]'::jsonb,     -- [{ kind:'foto'|'nota', url|text, created_at }]
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_orders_condominio_idx        ON service_orders(condominio_id);
CREATE INDEX IF NOT EXISTS service_orders_condominio_status_idx ON service_orders(condominio_id, status);
CREATE INDEX IF NOT EXISTS service_orders_assignee_idx          ON service_orders(assignee_membership_id);

CREATE OR REPLACE TRIGGER service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- Helper: a ordem está atribuída ao staff autenticado (membership ativa de papel 'staff')?
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_assigned_staff(condo uuid, membership uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT membership IS NOT NULL AND EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.id = membership
      AND m.user_id = auth.uid()
      AND m.condominio_id = condo
      AND m.role = 'staff'
      AND m.status = 'active'
  );
$$;

-- ─────────────────────────────────────────────
-- Trigger: o staff só altera campos OPERACIONAIS (status, evidence). Qualquer mudança de escopo
-- (título, categoria, prioridade, atribuição, vínculo, condomínio, autoria) volta ao valor antigo.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION protect_service_order_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_condominio_role(OLD.condominio_id, ARRAY['owner','manager']) THEN
    NEW.title                  := OLD.title;
    NEW.description            := OLD.description;
    NEW.category               := OLD.category;
    NEW.priority               := OLD.priority;
    NEW.origin                 := OLD.origin;
    NEW.linked_request_id      := OLD.linked_request_id;
    NEW.due_date               := OLD.due_date;
    NEW.assignee_membership_id := OLD.assignee_membership_id;  -- nunca reatribui
    NEW.created_by             := OLD.created_by;
    NEW.condominio_id          := OLD.condominio_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER service_orders_protect_columns
  BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE PROCEDURE protect_service_order_columns();

-- ─────────────────────────────────────────────
-- RLS: service_orders
-- ─────────────────────────────────────────────
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_orders: leitura gestão/conselho ou staff atribuída" ON service_orders;
CREATE POLICY "service_orders: leitura gestão/conselho ou staff atribuída"
  ON service_orders FOR SELECT
  USING (
    has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
    OR is_assigned_staff(condominio_id, assignee_membership_id)
  );

DROP POLICY IF EXISTS "service_orders: criação por gestão" ON service_orders;
CREATE POLICY "service_orders: criação por gestão"
  ON service_orders FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner','manager']) AND created_by = auth.uid());

DROP POLICY IF EXISTS "service_orders: update por gestão" ON service_orders;
CREATE POLICY "service_orders: update por gestão"
  ON service_orders FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner','manager']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner','manager']));

DROP POLICY IF EXISTS "service_orders: update por staff atribuída" ON service_orders;
CREATE POLICY "service_orders: update por staff atribuída"
  ON service_orders FOR UPDATE
  USING (is_assigned_staff(condominio_id, assignee_membership_id))
  WITH CHECK (is_assigned_staff(condominio_id, assignee_membership_id));

-- GRANTs: app só lê/insere/atualiza — sem DELETE (soft-only). service_role tem tudo (limpeza/teste).
GRANT SELECT, INSERT, UPDATE ON TABLE service_orders TO anon, authenticated;
GRANT ALL ON TABLE service_orders TO service_role;
