# Status Supabase e Telemetria — Fase 39
## Amigo do Prédio

> **Data:** 2026-05-16
> **Fase:** 39

---

## 1. Estado atual da telemetria

### Código (lib/telemetry.ts)

O código de telemetria está **100% implementado e funcional**. Sem Supabase configurado, opera em modo silencioso (no-op). Com Supabase configurado, ativa automaticamente.

| Item | Estado |
|------|--------|
| `trackEvent()` implementado | ✓ 35 tipos de evento |
| Batching (8 eventos ou 7s) | ✓ implementado |
| `flush()` no visibilitychange | ✓ implementado |
| Fallback silencioso sem env vars | ✓ `ENABLED = Boolean(URL && KEY)` |
| `fetchRecentEvents()` para /admin | ✓ implementado |
| Nenhum dado sensível coletado | ✓ confirmado por análise de código |
| `console.log` em produção | ✗ zero (nenhum log de eventos) |

### Variáveis de ambiente

| Variável | Estado | Impacto se ausente |
|----------|--------|--------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Não configurada | Telemetria desabilitada (no-op) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Não configurada | Idem |
| `NEXT_PUBLIC_ADMIN_KEY` | Não configurada | /admin bloqueado em prod, auto-login em dev |
| `NEXT_PUBLIC_APP_URL` | Não configurada | Compartilhamento WhatsApp funciona sem link |

---

## 2. Supabase: não configurado nesta fase

Supabase **não foi configurado** nesta sessão — nenhuma credencial de projeto real foi fornecida. O código está pronto; a ativação requer criação de projeto no supabase.com.

**Motivo:** configuração de Supabase requer acesso ao painel web e credenciais geradas lá. Não é possível fazer isso autonomamente sem as credenciais do fundador.

---

## 3. Tabelas necessárias

SQL completo para criar as tabelas quando Supabase for configurado (ver `docs/setup-supabase-telemetria.md`):

```sql
CREATE TABLE events (
  id         bigserial primary key,
  event      text not null,
  properties jsonb default '{}',
  ts         timestamptz default now(),
  session_id text
);

CREATE INDEX idx_events_ts ON events (ts DESC);
CREATE INDEX idx_events_event ON events (event);
CREATE INDEX idx_events_session ON events (session_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_only"
  ON events FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "read_admin"
  ON events FOR SELECT TO authenticated USING (true);
```

---

## 4. Env vars necessárias (após criar projeto Supabase)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-do-projeto>
NEXT_PUBLIC_ADMIN_KEY=<senha-forte-para-o-painel>
NEXT_PUBLIC_APP_URL=https://<url-do-app-no-vercel>.vercel.app
```

Adicionar em: **Vercel → Project → Settings → Environment Variables → Production**.

---

## 5. Queries de validação (após setup)

```sql
-- Confirmar que eventos chegam
SELECT * FROM events ORDER BY ts DESC LIMIT 5;

-- Contar eventos por tipo (últimas 24h)
SELECT event, count(*) FROM events
WHERE ts > now() - interval '24 hours'
GROUP BY 1 ORDER BY 2 DESC;

-- Sessões únicas hoje
SELECT count(distinct session_id)
FROM events WHERE event = 'session_open'
  AND ts::date = current_date;
```

---

## 6. Como verificar eventos no /admin

Após configurar Supabase e adicionar as env vars ao Vercel:

1. Abrir o app em produção → usar normalmente por 2 minutos
2. Acessar `/admin` → inserir `NEXT_PUBLIC_ADMIN_KEY`
3. Seção "Telemetria" → deve mostrar **"Fonte: Supabase (dados reais)"**
4. Verificar métricas: total de sessões, queries, fallback rate
5. Se ainda mostrar "localStorage (dispositivo atual)": confirmar que env vars foram salvas e deploy foi feito após adicioná-las

---

## 7. Dados coletados vs. não coletados

### Coletados (sem dados pessoais)

| Evento | Dado coletado | Tipo |
|--------|---------------|------|
| `session_open` | `days_since_last` | número |
| `query_submitted` | `q` (máx 80 chars), `categoria` | string truncada, string |
| `query_fallback` | `q` (máx 80 chars) | string truncada |
| `comunicado_copiado` | `tipo_comunicado`, `campos_preenchidos` | string, número |
| `simulador_calculado` | `meses`, `usou_valores_padrao` | número, boolean |
| `session_duration` | `seconds` | número |
| Outros eventos | nenhuma propriedade ou flags booleanas | — |

### Nunca coletados

- Nome do condomínio
- Conteúdo integral das perguntas (apenas 80 primeiros caracteres)
- Texto de comunicados gerados
- Valores financeiros reais (cota, débito)
- Número de unidade
- Nome de condômino ou funcionário
- Documentos ou arquivos
- Endereço IP (não configurado — Supabase pode logar automaticamente; verificar)
- Localização geográfica
- Informações do dispositivo (apenas session_id anônimo)

---

## 8. Checklist de setup para o fundador

```
[ ] 1. Criar conta em supabase.com
[ ] 2. Criar projeto "amigo-do-predio" (região: São Paulo)
[ ] 3. SQL Editor → executar SQL da seção 3 acima
[ ] 4. Settings → API → copiar Project URL e anon key
[ ] 5. Vercel → Settings → Environment Variables → adicionar 4 vars (seção 4)
[ ] 6. Vercel → fazer novo deploy
[ ] 7. Abrir app em produção → fazer uma pergunta
[ ] 8. Supabase → SQL Editor → SELECT * FROM events LIMIT 5 → confirmar evento
[ ] 9. /admin em produção → confirmar "Fonte: Supabase"
[ ] 10. Verificar que /admin pede senha (ADMIN_KEY configurada)
```

---

## 9. Fallback local (sem Supabase)

O painel `/admin` continua funcionando sem Supabase. Nesse caso, usa dados do `localStorage` do dispositivo atual (apenas dados da sessão local do fundador). O indicador de fonte muda para:

> "Fonte: localStorage (dispositivo atual)"

Isso é adequado para desenvolvimento e testes internos. Para beta, é obrigatório ter Supabase configurado.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 39)*
