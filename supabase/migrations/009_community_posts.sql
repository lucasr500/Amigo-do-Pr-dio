-- Migração 009 — Mural/Comunicados relacional por condomínio (1ª entidade da fronteira social)
-- Executar APÓS migrations 001-008.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: espelhar (write-through, dual-write) o Mural Oficial (lib/community-posts.ts) para
-- uma tabela relacional por condomínio. Local-first segue como fonte de verdade; esta tabela
-- recebe a cópia (push) quando `mural_remote_enabled` estiver ligado (default off).
--
-- PADRÃO: espelha a 008 (decisions) — escopo por condominio_id, PK = id do cliente (chave de
-- upsert), RLS via as funções SECURITY DEFINER da 005, GRANTs aos roles, rollback no cabeçalho.
--
-- DIFERENÇA DELIBERADA vs. 008 (o ponto desta fatia): a LEITURA é por PAPEL × VISIBILIDADE —
-- a RLS de SELECT replica `canSeeVisibility` (lib/community-permissions.ts) no banco, não só na
-- UI. O morador lê posts cuja `visibility` o papel dele alcança; NÃO lê `gestao`/`conselho`.
-- A ESCRITA é da gestão (owner/manager) — comunicado oficial. Opinião de morador é fase social
-- posterior (escrita por morador NÃO é concedida aqui). `nature` (opiniao|comunicado|deliberacao)
-- é DERIVADA de `origin` (natureOfPost) e gravada denormalizada — a separação de natureza vira
-- fato de banco, não rótulo escolhido pelo autor.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "community_posts: leitura por papel x visibilidade" ON community_posts;
--   DROP POLICY IF EXISTS "community_posts: escrita por gestao (ins)"          ON community_posts;
--   DROP POLICY IF EXISTS "community_posts: escrita por gestao (upd)"          ON community_posts;
--   DROP POLICY IF EXISTS "community_posts: escrita por gestao (del)"          ON community_posts;
--   DROP TABLE IF EXISTS community_posts;

-- ─────────────────────────────────────────────
-- TABELA: community_posts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id                    text PRIMARY KEY,                       -- ID estável do cliente
  condominio_id         uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  body                  text,
  category              text NOT NULL DEFAULT 'outro'
                          CHECK (category IN ('aviso','obra','manutencao','prestacao_de_contas',
                            'seguranca','assembleia','documento','urgencia','novidade','regra',
                            'sugestao','outro')),
  -- origem do post: 'oficial'/'sistema' = canal institucional; 'morador' = participação.
  origin                text CHECK (origin IN ('oficial','morador','sistema')),  -- nullable = oficial
  -- natureza DERIVADA de origin (natureOfPost). Denormalizada p/ a separação ser fato de banco.
  -- Para posts, na prática só 'opiniao'|'comunicado'; CHECK admite 'deliberacao' p/ forward-compat.
  nature                text NOT NULL DEFAULT 'comunicado'
                          CHECK (nature IN ('opiniao','comunicado','deliberacao')),
  -- visibilidade por papel (reusa o enum da comunidade). A RLS de SELECT abaixo a respeita.
  visibility            text NOT NULL DEFAULT 'moradores'
                          CHECK (visibility IN ('gestao','conselho','moradores','publico')),
  allow_comments        boolean NOT NULL DEFAULT false,
  pinned                boolean NOT NULL DEFAULT false,
  archived              boolean NOT NULL DEFAULT false,
  link_url              text,
  -- anexos leves (metadado/link) e vínculos a documentos: JSON sem FK — os alvos ainda são
  -- local-first. Adicionar FK só quando Documentos for relacional (ordem do Lucas).
  attachments           jsonb,
  related_document_ids  jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_condominio_idx           ON community_posts(condominio_id);
CREATE INDEX IF NOT EXISTS community_posts_condominio_archived_idx  ON community_posts(condominio_id, archived);
CREATE INDEX IF NOT EXISTS community_posts_condominio_category_idx  ON community_posts(condominio_id, category);
CREATE INDEX IF NOT EXISTS community_posts_condominio_visibility_idx ON community_posts(condominio_id, visibility);

CREATE OR REPLACE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS: community_posts
-- Leitura: PAPEL × VISIBILIDADE (replica canSeeVisibility no banco).
--   gestao    → owner/manager                          (manager clearance 0)
--   conselho  → owner/manager/council                  (council clearance 1)
--   moradores → owner/manager/council/resident         (resident clearance 2; viewer NÃO)
--   publico   → qualquer membro ativo (inclui viewer)  (viewer clearance 3)
-- Em qualquer caso, exige membership ativa NO condomínio → isolamento A×B preservado.
-- Escrita (ins/upd/del): owner/manager (gestão). Council NÃO publica no mural (canCreatePost=false).
-- ─────────────────────────────────────────────
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts: leitura por papel x visibilidade" ON community_posts;
CREATE POLICY "community_posts: leitura por papel x visibilidade"
  ON community_posts FOR SELECT
  USING (
    CASE visibility
      WHEN 'gestao'    THEN has_condominio_role(condominio_id, ARRAY['owner','manager'])
      WHEN 'conselho'  THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
      WHEN 'moradores' THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council','resident'])
      WHEN 'publico'   THEN is_condominio_member(condominio_id)
      ELSE false
    END
  );

DROP POLICY IF EXISTS "community_posts: escrita por gestao (ins)" ON community_posts;
CREATE POLICY "community_posts: escrita por gestao (ins)"
  ON community_posts FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_posts: escrita por gestao (upd)" ON community_posts;
CREATE POLICY "community_posts: escrita por gestao (upd)"
  ON community_posts FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_posts: escrita por gestao (del)" ON community_posts;
CREATE POLICY "community_posts: escrita por gestao (del)"
  ON community_posts FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- GRANTs de tabela: a RLS gateia as LINHAS; o GRANT habilita o acesso à TABELA. Idempotente.
GRANT ALL ON TABLE community_posts TO anon, authenticated, service_role;
