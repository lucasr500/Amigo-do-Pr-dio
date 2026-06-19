-- Migração 015 — Pré-moderação de conteúdo sensível (defaults seguros)
-- Executar APÓS migrations 001-014.
-- Idempotente: CREATE OR REPLACE FUNCTION; CREATE OR REPLACE TRIGGER.
--
-- (Nota de numeração: a spec rascunhou "015 = moderation_log"; como a ordem de execução é
--  pré-moderação → log, este é o 015 e o moderation_log é o 016. Sequencial e limpo.)
--
-- OBJETIVO (objetivo 8/10 — fechado por padrão): conteúdo SENSÍVEL nasce `pendente` (invisível
-- até aprovação). A decisão é NO SERVIDOR — o cliente NÃO pode forçar `publicado` num conteúdo
-- sensível. Um trigger BEFORE INSERT reclassifica: detectou sensível → `sensitive := true` e
-- `status := 'pendente'`, ignorando o que o cliente mandou. Conteúdo comum segue reativo.
--
-- HEURÍSTICA (lista condominial inicial — o Lucas refina; espelha lib/content-moderation.ts):
--   inadimplência/devedor/calote/ladrão/corrupção/roubo/desvio/processo/"deve"/"não paga".
-- Em dúvida, FECHA (pendente), não abre.
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS community_comments_premoderate ON community_comments;
--   DROP FUNCTION IF EXISTS premoderate_comment();

CREATE OR REPLACE FUNCTION premoderate_comment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Gatilho determinístico: flag declarada OU heurística de termos (case-insensitive, acentos).
  IF NEW.sensitive = true
     OR NEW.body ~* '\m(inadimpl|devedor|calote|ladr[ãa]o|corrup|roubo|roubou|desvi|processar|processo|deve\M|n[ãa]o paga)'
  THEN
    NEW.sensitive := true;
    NEW.status := 'pendente';   -- fecha: o cliente não publica sensível direto
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER community_comments_premoderate
  BEFORE INSERT ON community_comments
  FOR EACH ROW EXECUTE PROCEDURE premoderate_comment();
