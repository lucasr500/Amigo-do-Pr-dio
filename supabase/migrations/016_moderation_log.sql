-- Migração 016 — Trilha de auditoria de moderação (append-only, IMUTÁVEL)
-- Executar APÓS migrations 001-015.
-- Idempotente: IF NOT EXISTS na tabela/índices; DROP POLICY IF EXISTS antes de cada policy.
--
-- (Numeração: a spec rascunhou "015 = moderation_log"; como o 015 ficou com a pré-moderação,
--  este é o 016. O conteúdo é o moderation_log da spec, Parte 2.6.)
--
-- OBJETIVO (DNA jurídico — porto seguro): registrar QUEM fez O QUÊ, QUANDO, com SNAPSHOT do
-- conteúdo no momento. Difamação/injúria entre vizinhos e exposição de inadimplência são o risco
-- estrutural da camada social; a trilha imutável + separação de natureza + remoção reativa compõem
-- a defesa. "Visibilidade só na UI = vazamento": o log é gateado por RLS.
--
-- IMUTABILIDADE: append-only. NÃO há policy de UPDATE nem de DELETE, e o GRANT a anon/authenticated
-- é só SELECT/INSERT → ninguém edita nem apaga o histórico. service_role (backend) limpa em teste.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "moderation_log: leitura por gestão/conselho" ON moderation_log;
--   DROP POLICY IF EXISTS "moderation_log: inserção por quem age"       ON moderation_log;
--   DROP TABLE IF EXISTS moderation_log;

CREATE TABLE IF NOT EXISTS moderation_log (
  id             text PRIMARY KEY,                       -- ID estável do cliente
  condominio_id  uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  target_type    text NOT NULL DEFAULT 'comment' CHECK (target_type IN ('comment','post')),
  target_id      text NOT NULL,
  action         text NOT NULL
                   CHECK (action IN ('criado','marcado_sensivel','aprovado','ocultado',
                     'removido','restaurado','denunciado')),
  -- quem agiu (forge-proof: DEFAULT auth.uid(); a membership é derivável de user+condomínio).
  actor_id       uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  reason         text,
  snapshot       jsonb,                                  -- conteúdo no momento da ação
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_log_condominio_idx        ON moderation_log(condominio_id);
CREATE INDEX IF NOT EXISTS moderation_log_condominio_target_idx ON moderation_log(condominio_id, target_id);

-- ─────────────────────────────────────────────
-- RLS: append-only. INSERT por quem age (membro, actor = auth.uid()); SELECT só gestão/conselho.
-- SEM policy de UPDATE/DELETE → imutável.
-- ─────────────────────────────────────────────
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_log: leitura por gestão/conselho" ON moderation_log;
CREATE POLICY "moderation_log: leitura por gestão/conselho"
  ON moderation_log FOR SELECT
  USING (has_condominio_role(condominio_id, ARRAY['owner', 'manager', 'council']));

DROP POLICY IF EXISTS "moderation_log: inserção por quem age" ON moderation_log;
CREATE POLICY "moderation_log: inserção por quem age"
  ON moderation_log FOR INSERT
  WITH CHECK (is_condominio_member(condominio_id) AND actor_id = auth.uid());

-- GRANTs: app só lê e insere — sem UPDATE/DELETE (reforça a imutabilidade no nível de tabela).
GRANT SELECT, INSERT ON TABLE moderation_log TO anon, authenticated;
GRANT ALL ON TABLE moderation_log TO service_role;
