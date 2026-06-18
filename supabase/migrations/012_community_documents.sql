-- Migração 012 — Documentos públicos relacionais por condomínio (metadados)
-- Executar APÓS migrations 001-011.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: espelhar (dual-write) a biblioteca de Documentos (lib/community-documents.ts) para
-- uma tabela relacional por condomínio — METADADOS do documento (título, categoria, visibilidade,
-- versão, referência ao arquivo no Storage). Local-first segue como fonte de verdade; cópia
-- recebida quando `documents_remote_enabled` (default off). O ARQUIVO em si é o Bloco 3 (Storage):
-- `storage_path` referencia o objeto no bucket; nulo enquanto não houver arquivo.
--
-- PADRÃO: espelha a 009 (papel × visibilidade, escrita = gestão) + `created_by` (autoria, 010).
--
-- TRANSPARÊNCIA / PRESTAÇÃO DE CONTAS: é apenas um documento de categoria 'prestacao_de_contas'
-- PUBLICADO com `visibility` que alcança o morador ('moradores'/'publico'). A RLS por papel ×
-- visibilidade já garante que o morador lê o balancete publicado, sem o app virar ERP.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "community_documents: leitura por papel x visibilidade" ON community_documents;
--   DROP POLICY IF EXISTS "community_documents: escrita por gestão (ins)"         ON community_documents;
--   DROP POLICY IF EXISTS "community_documents: escrita por gestão (upd)"         ON community_documents;
--   DROP POLICY IF EXISTS "community_documents: escrita por gestão (del)"         ON community_documents;
--   DROP TABLE IF EXISTS community_documents;

-- ─────────────────────────────────────────────
-- TABELA: community_documents
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_documents (
  id                     text PRIMARY KEY,                       -- ID estável do cliente
  condominio_id          uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  created_by             uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  title                  text NOT NULL,
  category               text NOT NULL DEFAULT 'outro'
                           CHECK (category IN ('convencao','regimento_interno','ata','aviso',
                             'contrato_publico','seguro','avcb','manual','prestacao_de_contas',
                             'assembleia','outro')),
  description            text,
  visibility             text NOT NULL DEFAULT 'moradores'
                           CHECK (visibility IN ('gestao','conselho','moradores','publico')),
  url                    text,                                   -- link externo opcional
  -- referência ao arquivo no Supabase Storage (Bloco 3): "<condominio_id>/documents/<id>/<arquivo>".
  -- Nulo enquanto o documento for só metadado/link. O objeto é gateado pela RLS de storage.objects.
  storage_path           text,
  version                text,
  valid_until            text,
  published_at           timestamptz NOT NULL DEFAULT now(),
  linked_internal_doc_id text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_documents_condominio_idx            ON community_documents(condominio_id);
CREATE INDEX IF NOT EXISTS community_documents_condominio_category_idx   ON community_documents(condominio_id, category);
CREATE INDEX IF NOT EXISTS community_documents_condominio_visibility_idx ON community_documents(condominio_id, visibility);

CREATE OR REPLACE TRIGGER community_documents_updated_at
  BEFORE UPDATE ON community_documents
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS: community_documents (papel × visibilidade; escrita = gestão)
-- ─────────────────────────────────────────────
ALTER TABLE community_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_documents: leitura por papel x visibilidade" ON community_documents;
CREATE POLICY "community_documents: leitura por papel x visibilidade"
  ON community_documents FOR SELECT
  USING (
    CASE visibility
      WHEN 'gestao'    THEN has_condominio_role(condominio_id, ARRAY['owner','manager'])
      WHEN 'conselho'  THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
      WHEN 'moradores' THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council','resident'])
      WHEN 'publico'   THEN is_condominio_member(condominio_id)
      ELSE false
    END
  );

DROP POLICY IF EXISTS "community_documents: escrita por gestão (ins)" ON community_documents;
CREATE POLICY "community_documents: escrita por gestão (ins)"
  ON community_documents FOR INSERT
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_documents: escrita por gestão (upd)" ON community_documents;
CREATE POLICY "community_documents: escrita por gestão (upd)"
  ON community_documents FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_documents: escrita por gestão (del)" ON community_documents;
CREATE POLICY "community_documents: escrita por gestão (del)"
  ON community_documents FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- GRANTs de tabela: a RLS gateia as LINHAS; o GRANT habilita o acesso à TABELA. Idempotente.
GRANT ALL ON TABLE community_documents TO anon, authenticated, service_role;
