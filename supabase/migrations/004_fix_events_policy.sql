-- Migração 004 — Restringir leitura da tabela events (telemetria)
-- PROBLEMA: A policy "read_anon" permite que qualquer pessoa com a anon key leia
-- TODOS os eventos de TODOS os usuários via REST API direta.
-- A anon key é pública (NEXT_PUBLIC_), portanto qualquer visitante do app pode
-- extraí-la e consultar a tabela events diretamente.
--
-- SOLUÇÃO: Remover a policy SELECT aberta para anon. A leitura de eventos
-- passa a ser feita exclusivamente via server-side (API Route /api/admin/events)
-- que já exige ADMIN_KEY. INSERT continua funcionando para envio de telemetria.
--
-- IMPACTO: O painel /admin deixará de usar fetchRecentEvents() com a anon key.
-- Será necessário criar uma API Route server-side que use a service role key
-- (nunca exposta no frontend) para ler os eventos.
--
-- EXECUTAR no SQL Editor do Supabase antes de deploy em produção.
-- ROLLBACK: recriar a policy "read_anon" se necessário (ver comentário abaixo).

-- Remove a policy de leitura aberta para anon.
-- Guarda de existência: aplica-se apenas se a tabela events já existir.
-- Em produção a tabela existe (criada manualmente) e a policy é removida normalmente;
-- num banco novo/CI onde events ainda não foi criada, este passo é um no-op seguro —
-- evita "relation events does not exist" e mantém a cadeia de migrations aplicável do zero.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'events'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "read_anon" ON public.events';
  END IF;
END
$$;

-- Mantém apenas o INSERT para anon (telemetria continua funcionando)
-- INSERT policy existente: "insert_only" ON events FOR INSERT TO anon WITH CHECK (true)
-- Sem alterações necessárias.

-- ROLLBACK (se precisar reverter):
-- CREATE POLICY "read_anon" ON events FOR SELECT TO anon USING (true);
--
-- PRÓXIMO PASSO: Criar API Route server-side /api/admin/events que usa
-- process.env.SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC_) para ler eventos.
-- Essa rota deve ser protegida pelo mesmo middleware de ADMIN_KEY de /api/admin/auth.
