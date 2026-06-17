-- Migração 007 — Assembleia Inteligente (módulo-âncora do wedge social)
-- Executar APÓS migrations 001-006.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: criar a entidade ASSEMBLEIA — hoje inexistente (só havia rótulo/categoria/
-- evento de timeline). É o centro do loop informar→discutir→organizar→decidir→lembrar:
-- a assembleia (informar) tem itens de pauta (organizar) que ancoram discussão e enquete,
-- e cujos resultados viram decisão registrada (decidir) e evento de timeline (lembrar).
--
-- PADRÃO: espelha integralmente a migration 006 (agenda_events) —
-- escopo por condominio_id, RLS por papel via as funções SECURITY DEFINER da 005
-- (is_condominio_member / has_condominio_role). Escrita = papéis com manage_agenda
-- (owner, manager, council); leitura = qualquer membro ativo.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "assembly_agenda_items: leitura por membro"        ON assembly_agenda_items;
--   DROP POLICY IF EXISTS "assembly_agenda_items: escrita por gestor (ins)"  ON assembly_agenda_items;
--   DROP POLICY IF EXISTS "assembly_agenda_items: escrita por gestor (upd)"  ON assembly_agenda_items;
--   DROP POLICY IF EXISTS "assembly_agenda_items: escrita por gestor (del)"  ON assembly_agenda_items;
--   DROP TABLE IF EXISTS assembly_agenda_items;
--   DROP POLICY IF EXISTS "assemblies: leitura por membro"        ON assemblies;
--   DROP POLICY IF EXISTS "assemblies: escrita por gestor (ins)"  ON assemblies;
--   DROP POLICY IF EXISTS "assemblies: escrita por gestor (upd)"  ON assemblies;
--   DROP POLICY IF EXISTS "assemblies: escrita por gestor (del)"  ON assemblies;
--   DROP TABLE IF EXISTS assemblies;

-- ─────────────────────────────────────────────
-- TABELA: assemblies
-- id gerado no cliente (string estável) p/ permitir dual-write com onConflict: "id",
-- seguindo a convenção da migration 006.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assemblies (
  id               text PRIMARY KEY,
  condominio_id    uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  titulo           text NOT NULL,
  tipo             text NOT NULL DEFAULT 'ago' CHECK (tipo IN ('ago','age','outra')),
  data             date,
  local            text,
  status           text NOT NULL DEFAULT 'rascunho'
                     CHECK (status IN ('rascunho','convocada','realizada','encerrada')),
  quorum_min       integer,
  quorum_atingido  integer,
  ata_document_id  text,
  convocada_em     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assemblies_condominio_idx      ON assemblies(condominio_id);
CREATE INDEX IF NOT EXISTS assemblies_condominio_data_idx ON assemblies(condominio_id, data);

CREATE OR REPLACE TRIGGER assemblies_updated_at
  BEFORE UPDATE ON assemblies
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- TABELA: assembly_agenda_items (pauta)
-- condominio_id é denormalizado na linha (como em 006) para a RLS não precisar
-- de JOIN com assemblies — mantém as policies simples e sem recursão.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assembly_agenda_items (
  id             text PRIMARY KEY,
  assembly_id    text NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
  condominio_id  uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  ordem          integer NOT NULL DEFAULT 0,
  titulo         text NOT NULL,
  descricao      text,
  tipo           text NOT NULL DEFAULT 'deliberacao'
                   CHECK (tipo IN ('informe','deliberacao','eleicao')),
  resultado      text,
  decidido_em    timestamptz,
  -- vínculos opcionais p/ fechar o loop (decisão/timeline são módulos existentes)
  linked_decision_id  text,
  linked_poll_id      text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agenda_items_assembly_idx     ON assembly_agenda_items(assembly_id);
CREATE INDEX IF NOT EXISTS agenda_items_condominio_idx   ON assembly_agenda_items(condominio_id);

CREATE OR REPLACE TRIGGER agenda_items_updated_at
  BEFORE UPDATE ON assembly_agenda_items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS: assemblies
-- ─────────────────────────────────────────────
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assemblies: leitura por membro" ON assemblies;
CREATE POLICY "assemblies: leitura por membro"
  ON assemblies FOR SELECT
  USING (is_condominio_member(condominio_id));

DROP POLICY IF EXISTS "assemblies: escrita por gestor (ins)" ON assemblies;
CREATE POLICY "assemblies: escrita por gestor (ins)"
  ON assemblies FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "assemblies: escrita por gestor (upd)" ON assemblies;
CREATE POLICY "assemblies: escrita por gestor (upd)"
  ON assemblies FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "assemblies: escrita por gestor (del)" ON assemblies;
CREATE POLICY "assemblies: escrita por gestor (del)"
  ON assemblies FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

-- ─────────────────────────────────────────────
-- RLS: assembly_agenda_items (mesma política da assembleia-mãe)
-- ─────────────────────────────────────────────
ALTER TABLE assembly_agenda_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assembly_agenda_items: leitura por membro" ON assembly_agenda_items;
CREATE POLICY "assembly_agenda_items: leitura por membro"
  ON assembly_agenda_items FOR SELECT
  USING (is_condominio_member(condominio_id));

DROP POLICY IF EXISTS "assembly_agenda_items: escrita por gestor (ins)" ON assembly_agenda_items;
CREATE POLICY "assembly_agenda_items: escrita por gestor (ins)"
  ON assembly_agenda_items FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "assembly_agenda_items: escrita por gestor (upd)" ON assembly_agenda_items;
CREATE POLICY "assembly_agenda_items: escrita por gestor (upd)"
  ON assembly_agenda_items FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "assembly_agenda_items: escrita por gestor (del)" ON assembly_agenda_items;
CREATE POLICY "assembly_agenda_items: escrita por gestor (del)"
  ON assembly_agenda_items FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));
