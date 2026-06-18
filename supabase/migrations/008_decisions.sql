-- Migração 008 — Decisões relacionais por condomínio (primeiro módulo de memória)
-- Executar APÓS migrations 001-007.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: espelhar (write-through, dual-write) o registro de Decisões do síndico para uma
-- tabela relacional por condomínio. Local-first segue como fonte de verdade; esta tabela
-- recebe a cópia (push) quando `decisions_remote_enabled` estiver ligado (default off).
--
-- PADRÃO: espelha a migration 007 (assemblies) — escopo por condominio_id, PK = id do cliente
-- (chave de upsert), RLS por papel via as funções SECURITY DEFINER da 005, GRANTs aos roles.
--
-- DIFERENÇA DELIBERADA vs. 007 (decisão do Lucas): a LEITURA é restrita a gestão + conselho
-- (não a qualquer membro). Decisões carregam dados sensíveis (juridico/trabalhista/financeiro/
-- morador). A coluna `visibility` deixa o schema pronto para o futuro (DEFAULT 'gestao'), mas
-- a RLS desta fase NÃO concede leitura a residente/viewer — exposição a morador é Completo-Pleno.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "decisions: leitura por gestao/conselho" ON decisions;
--   DROP POLICY IF EXISTS "decisions: escrita por gestor (ins)"    ON decisions;
--   DROP POLICY IF EXISTS "decisions: escrita por gestor (upd)"    ON decisions;
--   DROP POLICY IF EXISTS "decisions: escrita por gestor (del)"    ON decisions;
--   DROP TABLE IF EXISTS decisions;

-- ─────────────────────────────────────────────
-- TABELA: decisions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
  id                   text PRIMARY KEY,                       -- ID estável do cliente (dec_...)
  condominio_id        uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  title                text NOT NULL,
  date                 date,
  category             text NOT NULL DEFAULT 'outro'
                         CHECK (category IN ('financeiro','obras','juridico','trabalhista',
                           'assembleia','manutencao','regimento','fornecedor','seguranca',
                           'morador','outro')),
  context              text,
  rationale            text,
  outcome              text,
  status               text NOT NULL DEFAULT 'registrada'
                         CHECK (status IN ('registrada','em_execucao','concluida','suspensa')),
  -- visibilidade (decisão do Lucas): reusa o enum da comunidade. DEFAULT 'gestao' (seguro).
  -- A RLS de SELECT desta fase só libera gestão+conselho; a coluna prepara o futuro.
  visibility           text NOT NULL DEFAULT 'gestao'
                         CHECK (visibility IN ('gestao','conselho','moradores','publico')),
  risk_level           text CHECK (risk_level IN ('baixo','medio','alto')),  -- nullable
  risk_notes           text,
  next_step            text,
  -- vínculos: TEXT sem FK — os alvos (documentos/fornecedores/pendências/unidade) ainda são
  -- local-first. Adicionar FK só quando essas entidades forem relacionais.
  linked_unit          text,
  linked_document_id   text,
  linked_supplier_id   text,
  linked_pendencia_id  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decisions_condominio_idx          ON decisions(condominio_id);
CREATE INDEX IF NOT EXISTS decisions_condominio_date_idx     ON decisions(condominio_id, date);
CREATE INDEX IF NOT EXISTS decisions_condominio_category_idx ON decisions(condominio_id, category);

CREATE OR REPLACE TRIGGER decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS: decisions
-- Leitura: SÓ gestão + conselho (difere do 007 de propósito — dado sensível).
-- Escrita (ins/upd/del): owner/manager/council.
-- ─────────────────────────────────────────────
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decisions: leitura por gestao/conselho" ON decisions;
CREATE POLICY "decisions: leitura por gestao/conselho"
  ON decisions FOR SELECT
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "decisions: escrita por gestor (ins)" ON decisions;
CREATE POLICY "decisions: escrita por gestor (ins)"
  ON decisions FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "decisions: escrita por gestor (upd)" ON decisions;
CREATE POLICY "decisions: escrita por gestor (upd)"
  ON decisions FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "decisions: escrita por gestor (del)" ON decisions;
CREATE POLICY "decisions: escrita por gestor (del)"
  ON decisions FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

-- GRANTs de tabela: a RLS gateia as LINHAS; o GRANT habilita o acesso à TABELA. Idempotente.
GRANT ALL ON TABLE decisions TO anon, authenticated, service_role;
