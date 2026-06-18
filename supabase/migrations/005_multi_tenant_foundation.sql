-- Migração 005 — Fundação Multi-tenant: condominios + memberships
-- Executar APÓS migrations 001-004.
-- Idempotente: usa IF NOT EXISTS / OR REPLACE em tudo.
--
-- OBJETIVO: Criar as entidades centrais do modelo SaaS real.
-- Os dados dos módulos (documentos, agenda, financeiro, etc.) ainda ficam
-- em localStorage/app_snapshots nesta sprint. Apenas a fundação é criada aqui.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS memberships;
--   DROP TABLE IF EXISTS condominios;
--   DROP FUNCTION IF EXISTS is_condominio_member;
--   DROP FUNCTION IF EXISTS has_condominio_role;

-- ─────────────────────────────────────────────
-- TABELA: condominios
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS condominios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  nome         text NOT NULL DEFAULT 'Meu Condomínio',
  slug         text UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  archived_at  timestamptz
);

CREATE INDEX IF NOT EXISTS condominios_owner_idx ON condominios(owner_id);

-- Garante que updated_at é atualizado automaticamente
-- (reutiliza update_updated_at_column criada na migration 001)
CREATE OR REPLACE TRIGGER condominios_updated_at
  BEFORE UPDATE ON condominios
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- TABELA: memberships
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id  uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  role           text NOT NULL CHECK (role IN ('owner','manager','council','resident','viewer')),
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended','removed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, condominio_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_idx         ON memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_condominio_idx   ON memberships(condominio_id);
CREATE INDEX IF NOT EXISTS memberships_user_cond_idx    ON memberships(user_id, condominio_id);

CREATE OR REPLACE TRIGGER memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- FUNÇÕES AUXILIARES PARA RLS
-- Usar funções evita recursão em policies que precisam checar memberships.
-- SECURITY DEFINER + search_path fixo evita ataques de path injection.
-- ─────────────────────────────────────────────

-- Retorna true se o usuário autenticado tem membership ativa no condomínio.
CREATE OR REPLACE FUNCTION is_condominio_member(condominio_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND condominio_id = condominio_uuid
      AND status = 'active'
  );
$$;

-- Retorna true se o usuário autenticado tem um dos roles listados no condomínio.
CREATE OR REPLACE FUNCTION has_condominio_role(condominio_uuid uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND condominio_id = condominio_uuid
      AND status = 'active'
      AND role = ANY(allowed_roles)
  );
$$;

-- ─────────────────────────────────────────────
-- RLS: condominios
-- ─────────────────────────────────────────────
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;

-- Membro ativo pode ver o condomínio.
CREATE POLICY "condominios: leitura por membro"
  ON condominios FOR SELECT
  USING (is_condominio_member(id));

-- Owner/manager pode atualizar dados básicos (nome, slug).
CREATE POLICY "condominios: atualização por owner/manager"
  ON condominios FOR UPDATE
  USING (has_condominio_role(id, ARRAY['owner', 'manager']))
  WITH CHECK (has_condominio_role(id, ARRAY['owner', 'manager']));

-- Apenas usuário autenticado pode criar condomínio (ele mesmo como owner_id).
CREATE POLICY "condominios: inserção própria"
  ON condominios FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owner pode arquivar (soft delete — não apagamos dados reais).
-- DELETE não é permitido via RLS; usar archived_at para marcar como inativo.

-- ─────────────────────────────────────────────
-- RLS: memberships
-- ─────────────────────────────────────────────
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Membro ativo pode ver todos os membros do mesmo condomínio.
CREATE POLICY "memberships: leitura por membro ativo"
  ON memberships FOR SELECT
  USING (is_condominio_member(condominio_id));

-- Próprio usuário pode ver sua membership, mesmo sem is_condominio_member
-- (útil para onboarding: ver o próprio convite pendente).
CREATE POLICY "memberships: leitura própria"
  ON memberships FOR SELECT
  USING (user_id = auth.uid());

-- Owner/manager pode adicionar memberships ao próprio condomínio.
CREATE POLICY "memberships: inserção por owner/manager"
  ON memberships FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- Owner/manager pode atualizar status de memberships (ex: suspender, remover).
CREATE POLICY "memberships: atualização por owner/manager"
  ON memberships FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- CASO ESPECIAL: criação de membership inicial quando o usuário cria o condomínio.
-- O owner_id acabou de inserir o condomínio; precisa inserir sua própria membership
-- antes de ter is_condominio_member = true. Usamos uma policy auxiliar:
CREATE POLICY "memberships: inserção própria como owner"
  ON memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id = condominio_id
        AND c.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- GRANTs de tabela (roles do Supabase)
-- A RLS gateia as LINHAS; o GRANT habilita o acesso à TABELA. Tabelas criadas por
-- migration SQL não herdam os grants padrão do dashboard, então concedemos
-- explicitamente. Idempotente. service_role continua com BYPASSRLS.
-- ─────────────────────────────────────────────
GRANT ALL ON TABLE condominios TO anon, authenticated, service_role;
GRANT ALL ON TABLE memberships TO anon, authenticated, service_role;
