# Setup Supabase — Telemetria Amigo do Prédio

> **Guia completo para ativar telemetria real.**
> Executar uma única vez antes de qualquer exposição externa.
> Tempo estimado: 15–20 minutos.

---

## Por que ativar a telemetria

Sem telemetria, o produto funciona normalmente — todas as chamadas em `lib/telemetry.ts` são no-op silenciosos quando as variáveis de ambiente não estão configuradas.

Com telemetria ativa, você passa a enxergar:
- Quantos síndicos abriram o app por dia (`session_open`)
- Taxa de sucesso do Assistente: queries respondidas vs fallback
- Adoção do monitoramento (`onboarding_completed`, `memoria_saved`)
- Ferramentas mais usadas (`comunicado_copiado`, `simulador_calculado`)
- Pendências criadas e concluídas (`pendencia_created_*`, `pendencia_completed`)

## Escopo e privacidade

Nesta fase, Supabase é apenas telemetria interna opcional. Ele não é backend de persistência do produto, não sincroniza dados do condomínio e não substitui o `localStorage`.

Não enviar ao Supabase:
- pergunta bruta;
- título de pendência;
- descrição de ocorrência;
- unidade/local de ocorrência;
- texto de mensagem administrativa gerada;
- nome do condomínio;
- datas reais;
- dados do perfil, da memória operacional ou qualquer PII.

A telemetria serve para observabilidade de fallback, guidance, pendências, ocorrências agregadas, mensagens administrativas, revisão mensal, sessão e CTA/fluxos. Os dados operacionais do condomínio continuam no dispositivo e no backup local exportável pelo usuário.

---

## Passo 1 — Criar projeto no Supabase

1. Acessar https://supabase.com e criar conta (gratuita para o volume esperado no uso inicial)
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

-- Anon pode ler — necessário para o painel /admin que usa a anon key
CREATE POLICY "read_anon"
  ON events FOR SELECT
  TO anon
  USING (true);
```

> **Nota de segurança:** Ambas as policies usam `TO anon` porque o painel `/admin` autentica
> via senha local (`NEXT_PUBLIC_ADMIN_KEY`) e chama `fetchRecentEvents()` com a anon key.
> Os eventos não contêm dados pessoais — apenas métricas de uso agregável.
> Para produção com escala, adicionar rate limiting via Supabase Edge Functions.

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
> - Sem ela configurada, o painel `/admin` é bloqueado automaticamente em produção
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

1. Acessar `/admin` — vai pedir senha (`NEXT_PUBLIC_ADMIN_KEY`)
2. Na seção "Telemetria (Supabase)", deve aparecer dados reais
3. Se Supabase não responder, o painel cai silenciosamente para dados locais

---

## Checklist de ativação

Execute cada passo em ordem e marque ao concluir:

- [ ] Projeto criado no Supabase (Passo 1)
- [ ] Tabela `events` criada com as duas policies `anon` (Passo 2)
- [ ] URL e anon key copiadas (Passo 3)
- [ ] `.env.local` criado na raiz do projeto (Passo 4)
- [ ] Servidor de dev reiniciado após criar `.env.local`
- [ ] Evento `query_submitted` aparece no Supabase após teste local (Passo 6)
- [ ] Variáveis adicionadas no Vercel (Passo 5)
- [ ] Deploy realizado no Vercel
- [ ] `/admin` abre com senha e mostra dados do Supabase em produção

---

## Eventos esperados no uso inicial

| Evento | Quando dispara | Propriedades úteis |
|--------|----------------|--------------------|
| `session_open` | Ao abrir o app | `is_returning` |
| `session_duration` | Ao fechar/minimizar | `seconds` |
| `query_submitted` | Pergunta respondida | `score`, `categoria` |
| `query_fallback` | Pergunta sem resposta | `detected_category`, `score`, `blocked_by_domain`, `query_length` |
| `onboarding_completed` | Perfil salvo pela 1ª vez | — |
| `memoria_saved` | Datas operacionais salvas | — |
| `comunicado_copiado` | Comunicado copiado | `tipo_comunicado`, `campos_preenchidos` |
| `simulador_calculado` | Cálculo de multa executado | `meses`, `usou_valores_padrao` |
| `guidance_resolved` | Item de guidance marcado ok | — |
| `backup_exported` | Backup baixado | — |
| `backup_imported` | Backup restaurado | — |
| `pendencia_created_manual` | Próximo passo criado manualmente | — |
| `pendencia_created_from_response` | Próximo passo criado via resposta | `categoria` |
| `pendencia_created_from_guidance` | Próximo passo criado via alerta | `guidance_id`, `priority` |
| `pendencia_created_from_memoria` | Lembrar depois (campo vazio) | `field` |
| `pendencia_completed` | Próximo passo marcado como feito | `categoria`, `origem`, `matched_id` |
| `ocorrencia_created` | Registro rápido salvo | `tipo`, `has_next_step`, `has_unit_or_location`, `source`, `month_key` |
| `admin_message_generated` | Modelo administrativo gerado | `tipo`, `source` |
| `admin_message_copied` | Modelo administrativo copiado | `tipo`, `source` |
| `weekly_review_viewed` | Revisão semanal exibida | `week_key`, `occurrence_count`, `open_steps_count`, `stale_steps_count`, `has_guidance`, `has_monthly_review` |
| `weekly_review_completed` | Revisão semanal concluída | `week_key`, `occurrence_count`, `open_steps_count`, `stale_steps_count`, `has_guidance`, `has_monthly_review` |

---

## Limites do plano gratuito Supabase

| Recurso | Limite gratuito | Estimativa de uso inicial |
|---------|-----------------|---------------------------------------|
| Rows | 500.000 | ~500/dia → ok por meses |
| Storage | 1 GB | N/A (só tabela de eventos) |
| Bandwidth | 5 GB/mês | N/A (eventos são pequenos) |
| Edge requests | 500k/mês | N/A |

Para uso inicial com baixo volume, o plano gratuito é mais que suficiente.

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
    nullif(count(*) filter (where event IN ('query_submitted', 'query_fallback')), 0), 1) as taxa_fallback
FROM events
WHERE event IN ('query_submitted', 'query_fallback')
  AND ts > now() - interval '7 days';

-- Categorias com mais fallback (onde expandir a KB)
SELECT properties->>'categoria' as categoria, count(*) as fallbacks
FROM events
WHERE event = 'query_fallback'
  AND ts > now() - interval '30 days'
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- Adoção do monitoramento
SELECT count(distinct session_id) as ativaram_monitoramento
FROM events WHERE event = 'memoria_saved';

-- Pendências criadas por origem
SELECT
  properties->>'origem' as origem,
  count(*) as criadas
FROM events
WHERE event LIKE 'pendencia_created%'
  AND ts > now() - interval '30 days'
GROUP BY 1 ORDER BY 2 DESC;

-- Taxa de conclusão de pendências
SELECT
  count(*) filter (where event LIKE 'pendencia_created%') as criadas,
  count(*) filter (where event = 'pendencia_completed') as concluidas
FROM events
WHERE ts > now() - interval '30 days';

-- Ocorrências por tipo, sem texto livre
SELECT
  properties->>'tipo' as tipo,
  count(*) as registros
FROM events
WHERE event = 'ocorrencia_created'
  AND ts > now() - interval '30 days'
GROUP BY 1 ORDER BY 2 DESC;

-- Mensagens administrativas geradas e copiadas
SELECT
  event,
  properties->>'tipo' as tipo,
  count(*) as total
FROM events
WHERE event IN ('admin_message_generated', 'admin_message_copied')
  AND ts > now() - interval '30 days'
GROUP BY 1, 2 ORDER BY 3 DESC;

-- Revisões semanais concluídas
SELECT
  properties->>'week_key' as semana,
  count(*) as concluidas
FROM events
WHERE event = 'weekly_review_completed'
  AND ts > now() - interval '60 days'
GROUP BY 1 ORDER BY 1 DESC;
```

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-20 (Fase 71)*
*Executar Passo 5 (Vercel) antes de qualquer uso externo.*
