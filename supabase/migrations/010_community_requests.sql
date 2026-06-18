-- Migração 010 — Canal de Solicitações relacional por condomínio (superfície nº 2)
-- Executar APÓS migrations 001-009.
-- Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- OBJETIVO: espelhar (dual-write) o Canal de Solicitações (lib/community-requests.ts) para
-- uma tabela relacional por condomínio. Local-first segue como fonte de verdade; esta tabela
-- recebe a cópia (push) quando `requests_remote_enabled` estiver ligado (default off).
--
-- PADRÃO: espelha a 009 (community_posts) — escopo por condominio_id, PK = id do cliente, RLS
-- por papel × visibilidade (reusa canSeeVisibility), GRANTs, rollback, idempotência.
--
-- DIFERENÇAS vs. 009 (o verbo do morador):
--   • `created_by uuid DEFAULT auth.uid()` — o AUTOR da solicitação. O dual-write NÃO envia
--     a coluna (insert → DEFAULT preenche com o usuário autenticado; update → retém). A leitura
--     concede ao autor ver a PRÓPRIA solicitação mesmo quando privada.
--   • `visibility` DEFAULT 'gestao' (privado: só gestão). O morador escolhe tornar pública
--     ('moradores'/'publico') no futuro; o dual-write atual omite a coluna (tudo privado, fiel
--     ao comportamento de hoje, em que só a gestão opera o canal).
--   • ESCRITA: qualquer membro cria a PRÓPRIA (insert com created_by = auth.uid()); apenas a
--     gestão (owner/manager) muda status/responde (update/delete).
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "community_requests: leitura por papel x visibilidade + autor" ON community_requests;
--   DROP POLICY IF EXISTS "community_requests: criação própria por membro"                ON community_requests;
--   DROP POLICY IF EXISTS "community_requests: atualização por gestão"                    ON community_requests;
--   DROP POLICY IF EXISTS "community_requests: exclusão por gestão"                       ON community_requests;
--   DROP TABLE IF EXISTS community_requests;

-- ─────────────────────────────────────────────
-- TABELA: community_requests
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_requests (
  id                    text PRIMARY KEY,                       -- ID estável do cliente
  condominio_id         uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  created_by            uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  unit_number           text,
  author_name           text,
  author_contact        text,
  type                  text NOT NULL DEFAULT 'outro'
                          CHECK (type IN ('reclamacao','solicitacao','sugestao','duvida','ocorrencia',
                            'manutencao','barulho','seguranca','limpeza','garagem','obra','documento',
                            'reserva','aviso_obra','outro')),
  title                 text NOT NULL,
  description           text,
  status                text NOT NULL DEFAULT 'recebido'
                          CHECK (status IN ('recebido','em_analise','encaminhado','respondida',
                            'aguardando_terceiro','resolvido','recusado','arquivado')),
  priority              text NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('baixa','normal','alta','urgente')),
  -- visibilidade por papel (reusa o enum da comunidade). Default 'gestao' = privado.
  visibility            text NOT NULL DEFAULT 'gestao'
                          CHECK (visibility IN ('gestao','conselho','moradores','publico')),
  assigned_to           text,
  due_date              text,
  resolution_note       text,
  management_response   text,
  -- campos específicos de aviso_obra
  work_start_date       text,
  work_end_date         text,
  work_time_window      text,
  work_responsible      text,
  closed_at             timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_requests_condominio_idx         ON community_requests(condominio_id);
CREATE INDEX IF NOT EXISTS community_requests_condominio_status_idx  ON community_requests(condominio_id, status);
CREATE INDEX IF NOT EXISTS community_requests_condominio_type_idx    ON community_requests(condominio_id, type);
CREATE INDEX IF NOT EXISTS community_requests_created_by_idx         ON community_requests(created_by);

CREATE OR REPLACE TRIGGER community_requests_updated_at
  BEFORE UPDATE ON community_requests
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────
-- RLS: community_requests
-- Leitura: PAPEL × VISIBILIDADE (replica canSeeVisibility) OU é o próprio autor (vê a própria,
--   mesmo privada). Em qualquer ramo exige membership ativa → isolamento A×B preservado.
-- Escrita: criação própria por qualquer membro (created_by = auth.uid()); update/delete só gestão.
-- ─────────────────────────────────────────────
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_requests: leitura por papel x visibilidade + autor" ON community_requests;
CREATE POLICY "community_requests: leitura por papel x visibilidade + autor"
  ON community_requests FOR SELECT
  USING (
    CASE visibility
      WHEN 'gestao'    THEN has_condominio_role(condominio_id, ARRAY['owner','manager'])
      WHEN 'conselho'  THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council'])
      WHEN 'moradores' THEN has_condominio_role(condominio_id, ARRAY['owner','manager','council','resident'])
      WHEN 'publico'   THEN is_condominio_member(condominio_id)
      ELSE false
    END
    OR (created_by = auth.uid() AND is_condominio_member(condominio_id))
  );

DROP POLICY IF EXISTS "community_requests: criação própria por membro" ON community_requests;
CREATE POLICY "community_requests: criação própria por membro"
  ON community_requests FOR INSERT
  WITH CHECK (is_condominio_member(condominio_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS "community_requests: atualização por gestão" ON community_requests;
CREATE POLICY "community_requests: atualização por gestão"
  ON community_requests FOR UPDATE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']))
  WITH CHECK (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "community_requests: exclusão por gestão" ON community_requests;
CREATE POLICY "community_requests: exclusão por gestão"
  ON community_requests FOR DELETE
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager']));

-- GRANTs de tabela: a RLS gateia as LINHAS; o GRANT habilita o acesso à TABELA. Idempotente.
GRANT ALL ON TABLE community_requests TO anon, authenticated, service_role;
