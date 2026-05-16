# Setup Supabase — Telemetria Amigo do Prédio

> **Guia completo para ativar telemetria real.**
> Executar uma única vez antes da beta pública.
> Tempo estimado: 15–20 minutos.

---

## Por que ativar a telemetria

Sem telemetria, o produto funciona normalmente — todas as chamadas em `lib/telemetry.ts` são no-op silenciosos quando as variáveis de ambiente não estão configuradas.

Com telemetria ativa, você passa a enxergar:
- Quantos síndicos abriram o app por dia (`session_open`)
- Taxa de sucesso do Assistente: queries respondidas vs fallback
- Quais perguntas geram fallback (para priorizar expansão da KB)
- Adoção do monitoramento (`onboarding_completed`, `memoria_saved`)
- Ferramentas mais usadas (`comunicado_copiado`, `simulador_calculado`)

---

## Passo 1 — Criar projeto no Supabase

1. Acessar https://supabase.com e criar conta (gratuita para o volume esperado na beta)
2. Criar novo projeto:
   - **Name:** amigo-do-predio
   - **Database Password:** gerar senha forte e salvar em local seguro
   - **Region:** South America (São Paulo) — menor latência para usuários BR
3. Aguardar a criação do projeto (~2 minutos)

---

## Passo 2 — Criar a tabela `events`

No painel do projeto Supabase, ir em **SQL Editor** e executar:

```sql
-- Tabela principal de eventos de telemetria
CREATE TABLE events (
  id         bigserial primary key,
  event      text not null,
  properties jsonb default '{}',
  ts         timestamptz default now(),
  session_id text
);

-- Índices para queries do painel admin
CREATE INDEX idx_events_ts ON events (ts DESC);
CREATE INDEX idx_events_event ON events (event);
CREATE INDEX idx_events_session ON events (session_id);

-- Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (clientes enviando eventos)
CREATE POLICY "insert_only"
  ON events FOR INSERT
  TO anon
  WITH CHECK (true);

-- Usuários autenticados podem ler (painel admin via Supabase Auth)
CREATE POLICY "read_admin"
  ON events FOR SELECT
  TO authenticated
  USING (true);
```

> **Nota de segurança:** A policy `insert_only` permite que qualquer pessoa com a anon key insira eventos. Isso é intencional — os eventos não contêm dados pessoais. A leitura é restrita a usuários autenticados, mas o painel `/admin` usa a anon key diretamente. Para beta inicial com volume baixo, isso é aceitável. Em produção com escala, adicionar rate limiting no Supabase Edge Functions.

---

## Passo 3 — Obter as credenciais

No painel do projeto Supabase, ir em **Settings → API**:

| Campo | Onde encontrar | Exemplo |
|-------|----------------|---------|
| Project URL | "Project URL" | `https://abcdefgh.supabase.co` |
| anon key | "Project API keys → anon public" | `eyJhbGciOiJIUzI1NiIs...` |

---

## Passo 4 — Configurar variáveis de ambiente

Criar arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
NEXT_PUBLIC_ADMIN_KEY=<senha-para-o-painel-admin>
```

> **IMPORTANTE — segurança do `NEXT_PUBLIC_ADMIN_KEY`:**
> - Esta senha protege o painel `/admin` em produção
> - Sem ela configurada, o painel `/admin` é bloqueado automaticamente em produção (Fase 38)
> - Em desenvolvimento local, sem a variável, o painel abre sem senha (modo dev)
> - Usar senha forte e não compartilhar publicamente
> - Não commitar `.env.local` no git (já está no `.gitignore`)

---

## Passo 5 — Configurar no Vercel (deploy)

Se o app está hospedado no Vercel:

1. Ir em **Project → Settings → Environment Variables**
2. Adicionar as 3 variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_KEY`
3. Marcar scope: **Production** (e opcionalmente Preview)
4. Fazer um novo deploy para aplicar

---

## Passo 6 — Verificar funcionamento

### Local (`npm run dev`)

1. Após salvar `.env.local`, reiniciar o servidor de dev
2. Abrir o app, fazer uma pergunta no Assistente
3. Ir em **SQL Editor** no Supabase e executar:
   ```sql
   SELECT * FROM events ORDER BY ts DESC LIMIT 10;
   ```
4. Deve aparecer o evento `query_submitted` com `session_id` e `ts`

### Painel `/admin`

1. Acessar `/admin` — agora vai pedir senha (ADMIN_KEY configurada)
2. Na seção "Telemetria (Supabase)", deve aparecer dados reais
3. Se Supabase não responder, o painel cai silenciosamente para dados locais

---

## Eventos esperados na beta

| Evento | Quando dispara | Propriedades úteis |
|--------|----------------|--------------------|
| `session_open` | Ao abrir o app | `is_returning` |
| `query_submitted` | Pergunta respondida | `q` (80 chars), `score`, `categoria` |
| `query_fallback` | Pergunta sem resposta | `q` (80 chars) |
| `onboarding_completed` | Perfil salvo pela 1ª vez | — |
| `memoria_saved` | Datas operacionais salvas | — |
| `comunicado_copiado` | Comunicado copiado | `tipo_comunicado`, `campos_preenchidos` |
| `simulador_calculado` | Cálculo de multa executado | `meses`, `usou_valores_padrao` |
| `guidance_resolved` | Item de guidance marcado ok | — |
| `backup_exported` | Backup baixado | — |

---

## Limites do plano gratuito Supabase

| Recurso | Limite gratuito | Estimativa de uso (beta 10 síndicos) |
|---------|-----------------|---------------------------------------|
| Rows | 500.000 | ~500/dia → ok por meses |
| Storage | 1 GB | N/A (só tabela de eventos) |
| Bandwidth | 5 GB/mês | N/A (eventos são pequenos) |
| Edge requests | 500k/mês | N/A |

Para a beta inicial, o plano gratuito é mais que suficiente.

---

## Queries úteis para acompanhar

```sql
-- Sessões únicas por dia (últimos 7 dias)
SELECT date_trunc('day', ts) as dia, count(distinct session_id) as sessoes
FROM events
WHERE event = 'session_open'
  AND ts > now() - interval '7 days'
GROUP BY 1 ORDER BY 1 DESC;

-- Taxa de fallback
SELECT
  count(*) filter (where event = 'query_submitted') as total,
  count(*) filter (where event = 'query_fallback') as fallback,
  round(100.0 * count(*) filter (where event = 'query_fallback') /
    nullif(count(*), 0), 1) as taxa_fallback
FROM events
WHERE event IN ('query_submitted', 'query_fallback')
  AND ts > now() - interval '7 days';

-- Top 10 perguntas sem resposta
SELECT properties->>'q' as pergunta, count(*) as vezes
FROM events
WHERE event = 'query_fallback'
  AND ts > now() - interval '7 days'
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- Adoção do monitoramento
SELECT count(distinct session_id) as ativaram_monitoramento
FROM events WHERE event = 'memoria_saved';
```

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 38)*
*Executar Passo 5 (Vercel) antes do convite para beta.*
