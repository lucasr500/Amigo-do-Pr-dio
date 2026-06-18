-- Migração 011 — Enquetes consultivas relacionais por condomínio (superfície nº 3)
-- Executar APÓS migrations 001-010.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: espelhar (dual-write) as Enquetes (lib/community-polls.ts) — DUAS tabelas:
-- `community_polls` (a enquete + opções embutidas) e `poll_votes` (os votos). Local-first
-- segue como fonte de verdade; cópia recebida quando `polls_remote_enabled` (default off).
--
-- PADRÃO: community_polls espelha a 009 (papel × visibilidade, escrita = gestão).
-- poll_votes denormaliza condominio_id (como a 007 fez com agenda_items) p/ a RLS não
-- precisar de JOIN.
--
-- PRIVACIDADE DO VOTO (inegociável): a RLS de poll_votes NÃO deixa um morador ler o voto
-- individual de OUTRO. Cada um lê o PRÓPRIO voto (voted_by = auth.uid()); a gestão lê todos
-- para apuração. Resultado é agregado a partir dos votos que a gestão (ou o futuro RPC de
-- agregação) enxerga — o voto individual não vaza entre pares.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "poll_votes: leitura própria ou gestão (apuração)" ON poll_votes;
--   DROP POLICY IF EXISTS "poll_votes: voto próprio por membro"              ON poll_votes;
--   DROP POLICY IF EXISTS "poll_votes: atualização própria ou gestão"       ON poll_votes;
--   DROP POLICY IF EXISTS "poll_votes: exclusão própria ou gestão"          ON poll_votes;
--   DROP TABLE IF EXISTS poll_votes;
--   DROP POLICY IF EXISTS "community_polls: leitura por papel x visibilidade" ON community_polls;
--   DROP POLICY IF EXISTS "community_polls: escrita por gestão (ins)"         ON community_polls;
--   DROP POLICY IF EXISTS "community_polls: escrita por gestão (upd)"         ON community_polls;
--   DROP POLICY IF EXISTS "community_polls: escrita por gestão (del)"         ON community_polls;
--   DROP TABLE IF EXISTS community_polls;

-- ─────────────────────────────────────────────
-- TABELA: community_polls
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_polls (
  id             text PRIMARY KEY,                       -- ID estável do cliente
  condominio_id  uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  options        jsonb NOT NULL DEFAULT '[]'::jsonb,     -- PollOption[] embutido ({id,label})
  visibility     text NOT NULL DEFAULT 'moradores'
                   CHECK (visibility IN ('gestao','conselho','moradores','publico')),
  status         text NOT NULL DEFAULT 'rascunho'
                   CHECK (status IN ('rascunho','ativa','encerrada')),
  starts_at      text,
  ends_at        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_polls_condominio_idx        ON community_polls(condominio_id);
CREATE INDEX IF NOT EXISTS community_polls_condominio_status_idx ON community_polls(condominio_id, status);

CREATE OR REPLACE TRIGGER community_polls_updated_at
  BEFORE UPDATE ON community_polls
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- TABELA: poll_votes (condominio_id denormalizado p/ RLS sem JOIN)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_votes (
  id             text PRIMARY KEY,                       -- ID estável do cliente
  poll_id        text NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  condominio_id  uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  voted_by       uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  option_id      text NOT NULL,
  voter_label    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS poll_votes_poll_idx       ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_condominio_idx ON poll_votes(condominio_id);

-- ─────────────────────────────────────────────
-- RLS: community_polls (papel × visibilidade; escrita = gestão)
-- ─────────────────────────────────────────────
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_polls: leitura por papel x visibilidade" ON community_polls;
CREATE POLICY "community_polls: leitura por papel x visibilidade"
  ON community_polls FOR SELECT
  USING (
    CASE visibility
      WHEN 'gestao'    THEN has_condominio_role(condominio_id, ARRAY['owner','manager'])
      WHEN 'conselho'  THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
      WHEN 'moradores' THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council','resident'])
      WHEN 'publico'   THEN is_condominio_member(condominio_id)
      ELSE false
    END
  );

DROP POLICY IF EXISTS "community_polls: escrita por gestão (ins)" ON community_polls;
CREATE POLICY "community_polls: escrita por gestão (ins)"
  ON community_polls FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_polls: escrita por gestão (upd)" ON community_polls;
CREATE POLICY "community_polls: escrita por gestão (upd)"
  ON community_polls FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_polls: escrita por gestão (del)" ON community_polls;
CREATE POLICY "community_polls: escrita por gestão (del)"
  ON community_polls FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- ─────────────────────────────────────────────
-- RLS: poll_votes (PRIVACIDADE DO VOTO)
-- Leitura: o PRÓPRIO voto (voted_by = auth.uid()) OU gestão (apuração). Entre pares NÃO vaza.
-- Voto: qualquer membro registra o PRÓPRIO (voted_by = auth.uid()).
-- Update/Delete: o próprio (re-voto) OU gestão.
-- ─────────────────────────────────────────────
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poll_votes: leitura própria ou gestão (apuração)" ON poll_votes;
CREATE POLICY "poll_votes: leitura própria ou gestão (apuração)"
  ON poll_votes FOR SELECT
  USING (
    (voted_by = auth.uid() AND is_condominio_member(condominio_id))
    OR has_condominio_role(condominio_id, ARRAY['owner', 'manager'])
  );

DROP POLICY IF EXISTS "poll_votes: voto próprio por membro" ON poll_votes;
CREATE POLICY "poll_votes: voto próprio por membro"
  ON poll_votes FOR INSERT
  WITH CHECK (is_condominio_member(condominio_id) AND voted_by = auth.uid());

DROP POLICY IF EXISTS "poll_votes: atualização própria ou gestão" ON poll_votes;
CREATE POLICY "poll_votes: atualização própria ou gestão"
  ON poll_votes FOR UPDATE
  USING (voted_by = auth.uid() OR has_condominio_role(condominio_id, ARRAY['owner', 'manager']))
  WITH CHECK (voted_by = auth.uid() OR has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "poll_votes: exclusão própria ou gestão" ON poll_votes;
CREATE POLICY "poll_votes: exclusão própria ou gestão"
  ON poll_votes FOR DELETE
  USING (voted_by = auth.uid() OR has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- GRANTs de tabela: a RLS gateia as LINHAS; o GRANT habilita o acesso à TABELA. Idempotente.
GRANT ALL ON TABLE community_polls TO anon, authenticated, service_role;
GRANT ALL ON TABLE poll_votes      TO anon, authenticated, service_role;
