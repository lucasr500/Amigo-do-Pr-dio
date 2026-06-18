-- Migração 013 — Supabase Storage para arquivos de Documentos (subsistema novo)
-- Executar APÓS migrations 001-012.
-- Idempotente: ON CONFLICT no bucket; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: dar corpo aos Documentos — o ARQUIVO, não só o metadado. Um bucket PRIVADO
-- compartilhado, com objetos escopados por condomínio via PREFIXO de caminho:
--   "<condominio_id>/documents/<doc_id>/<arquivo>"
-- Sem URL pública perene: download só por signed URL (expira), gerada pela aplicação.
--
-- RLS DE OBJETO (storage.objects) — a prova nova mais importante:
--   • ISOLAMENTO: o 1º segmento do caminho é o condominio_id; só membro daquele condomínio
--     acessa. Um membro de B não lê nem escreve arquivo de A.
--   • VISIBILIDADE: a leitura reusa canSeeVisibility ATRAVÉS do documento — o objeto herda a
--     visibility do community_documents cujo id é o 3º segmento do caminho. Morador não baixa
--     arquivo de documento 'gestao'.
--   • ESCRITA (ins/upd/del): só gestão (owner/manager) do condomínio do caminho.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "docs storage: leitura por papel x visibilidade" ON storage.objects;
--   DROP POLICY IF EXISTS "docs storage: escrita por gestão (ins)"         ON storage.objects;
--   DROP POLICY IF EXISTS "docs storage: escrita por gestão (upd)"         ON storage.objects;
--   DROP POLICY IF EXISTS "docs storage: escrita por gestão (del)"         ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'condominio-docs';

-- ─────────────────────────────────────────────
-- BUCKET privado (sem URL pública)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('condominio-docs', 'condominio-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- Helper local: o documento do caminho alcança o papel do usuário?
-- name = "<condominio_id>/documents/<doc_id>/<arquivo>"
--   foldername(name) = {condominio_id, documents, doc_id}  → [1] e [3]
-- SECURITY DEFINER + search_path fixo (mesmo padrão das funções da 005).
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION can_access_document_object(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_documents d
    WHERE d.id = (storage.foldername(object_name))[3]
      AND d.condominio_id = ((storage.foldername(object_name))[1])::uuid
      AND CASE d.visibility
        WHEN 'gestao'    THEN has_condominio_role(d.condominio_id, ARRAY['owner','manager'])
        WHEN 'conselho'  THEN has_condominio_role(d.condominio_id, ARRAY['owner','manager','council'])
        WHEN 'moradores' THEN has_condominio_role(d.condominio_id, ARRAY['owner','manager','council','resident'])
        WHEN 'publico'   THEN is_condominio_member(d.condominio_id)
        ELSE false
      END
  );
$$;

-- O usuário é gestão do condomínio cujo id é o 1º segmento do caminho?
CREATE OR REPLACE FUNCTION is_document_object_manager(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_condominio_role(((storage.foldername(object_name))[1])::uuid, ARRAY['owner','manager']);
$$;

-- ─────────────────────────────────────────────
-- POLICIES em storage.objects (bucket 'condominio-docs')
-- storage.objects já tem RLS habilitada pelo Supabase; adicionamos as policies do bucket.
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "docs storage: leitura por papel x visibilidade" ON storage.objects;
CREATE POLICY "docs storage: leitura por papel x visibilidade"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'condominio-docs' AND can_access_document_object(name));

DROP POLICY IF EXISTS "docs storage: escrita por gestão (ins)" ON storage.objects;
CREATE POLICY "docs storage: escrita por gestão (ins)"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'condominio-docs' AND is_document_object_manager(name));

DROP POLICY IF EXISTS "docs storage: escrita por gestão (upd)" ON storage.objects;
CREATE POLICY "docs storage: escrita por gestão (upd)"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'condominio-docs' AND is_document_object_manager(name))
  WITH CHECK (bucket_id = 'condominio-docs' AND is_document_object_manager(name));

DROP POLICY IF EXISTS "docs storage: escrita por gestão (del)" ON storage.objects;
CREATE POLICY "docs storage: escrita por gestão (del)"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'condominio-docs' AND is_document_object_manager(name));
