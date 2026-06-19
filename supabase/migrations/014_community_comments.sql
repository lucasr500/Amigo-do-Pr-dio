-- Migração 014 — Comentários do Mural relacionais (discussão), com moderação por RLS
-- Executar APÓS migrations 001-013.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: dar DISCUSSÃO aos posts (Comment, lib/community-posts.ts) de forma relacional e
-- gated. O estado de moderação é GATEADO POR RLS NO BANCO (não só na UI) — "visibilidade só na
-- UI = vazamento". Conteúdo de morador é o terreno de difamação/injúria/exposição de
-- inadimplência: a separação de natureza + estados de moderação + remoção SOFT compõem o porto
-- seguro jurídico. Cópia recebida quando `comments_remote_enabled` (default off).
--
-- ESTADOS (preserva o CommentStatus existente): publicado | pendente | oculto | removido.
--   publicado → visível à comunidade conforme a VISIBILIDADE DO POST-PAI (Variante A).
--   pendente/oculto → invisível à comunidade; o AUTOR vê o próprio; gestão/conselho veem (fila).
--   removido → invisível a todos EXCETO gestão/conselho (auditoria). NUNCA é hard-delete.
--
-- ESCRITA: morador cria o PRÓPRIO comentário (created_by = auth.uid()); só gestão/conselho mudam
-- status (aprovar/ocultar/remover). NÃO há policy de DELETE → hard-delete é impossível (remoção
-- é status 'removido', preservado). `sensitive` prepara a pré-moderação (Bloco 2 / trigger).
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "community_comments: leitura por status x papel" ON community_comments;
--   DROP POLICY IF EXISTS "community_comments: criação própria por membro"  ON community_comments;
--   DROP POLICY IF EXISTS "community_comments: moderação por gestão/conselho" ON community_comments;
--   DROP FUNCTION IF EXISTS can_read_published_comment(uuid, text);
--   DROP TABLE IF EXISTS community_comments;

-- ─────────────────────────────────────────────
-- TABELA: community_comments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_comments (
  id             text PRIMARY KEY,                       -- ID estável do cliente
  condominio_id  uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  post_id        text NOT NULL,                          -- post-pai (community_posts.id); sem FK rígida
  created_by     uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name    text,
  author_role    text NOT NULL DEFAULT 'resident'
                   CHECK (author_role IN ('manager','council','resident','viewer')),
  body           text NOT NULL,
  -- estado de moderação. Default 'pendente' = fechado por padrão (seguro).
  status         text NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('publicado','pendente','oculto','removido')),
  sensitive      boolean NOT NULL DEFAULT false,         -- marcado pela pré-moderação (Bloco 2)
  moderated_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_comments_condominio_idx      ON community_comments(condominio_id);
CREATE INDEX IF NOT EXISTS community_comments_condominio_post_idx ON community_comments(condominio_id, post_id);
CREATE INDEX IF NOT EXISTS community_comments_condominio_status_idx ON community_comments(condominio_id, status);

CREATE OR REPLACE TRIGGER community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- Helper: a comunidade pode ler um comentário PUBLICADO (herda a visibilidade do post-pai)?
-- Se o post não estiver espelhado, retorna false → comentário fica fechado (seguro por padrão).
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION can_read_published_comment(cond uuid, post text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_posts p
    WHERE p.id = post AND p.condominio_id = cond
      AND CASE p.visibility
        WHEN 'gestao'    THEN has_condominio_role(cond, ARRAY['owner','manager'])
        WHEN 'conselho'  THEN has_condominio_role(cond, ARRAY['owner','manager','council'])
        WHEN 'moradores' THEN has_condominio_role(cond, ARRAY['owner','manager','council','resident'])
        WHEN 'publico'   THEN is_condominio_member(cond)
        ELSE false
      END
  );
$$;

-- ─────────────────────────────────────────────
-- RLS: community_comments (status × papel)
-- ─────────────────────────────────────────────
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_comments: leitura por status x papel" ON community_comments;
CREATE POLICY "community_comments: leitura por status x papel"
  ON community_comments FOR SELECT
  USING (
    -- gestão/conselho veem TUDO (fila de moderação + auditoria de removidos)
    has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
    -- o autor vê o PRÓPRIO comentário, em qualquer status menos 'removido'
    OR (created_by = auth.uid() AND is_condominio_member(condominio_id) AND status <> 'removido')
    -- a comunidade vê os PUBLICADOS cujo post-pai a visibilidade alcança
    OR (status = 'publicado' AND can_read_published_comment(condominio_id, post_id))
  );

DROP POLICY IF EXISTS "community_comments: criação própria por membro" ON community_comments;
CREATE POLICY "community_comments: criação própria por membro"
  ON community_comments FOR INSERT
  WITH CHECK (is_condominio_member(condominio_id) AND created_by = auth.uid());

-- Só gestão/conselho mudam status (aprovar/ocultar/remover). Sem policy de DELETE → hard-delete
-- impossível: remoção é status 'removido', preservado para auditoria.
DROP POLICY IF EXISTS "community_comments: moderação por gestão/conselho" ON community_comments;
CREATE POLICY "community_comments: moderação por gestão/conselho"
  ON community_comments FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

-- GRANTs: a RLS gateia as LINHAS. App (anon/authenticated) NÃO recebe DELETE — reforça a
-- não-remoção física (remoção é status 'removido'). service_role (backend/limpeza) tem tudo.
GRANT SELECT, INSERT, UPDATE ON TABLE community_comments TO anon, authenticated;
GRANT ALL ON TABLE community_comments TO service_role;
