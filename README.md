# Amigo do Prédio

PWA mobile-first para síndicos acompanharem a rotina operacional do condomínio: orientações práticas, próximos passos, vencimentos, checklists, comunicados, simuladores, memória do prédio, revisão mensal e backup local.

O projeto está em maturação. **Direção oficial:** evoluir para SaaS multi-tenant com integração multi-persona (síndico, condômino, conselho, funcionário). O produto **não** será exposto a clientes externos enquanto não for julgado completo (ver `docs/roadmap-pre-lancamento.md` → Definição de Pronto). Fonte canônica de objetivos: **Notion**.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Persistência local em `localStorage` (fonte de verdade atual dos dados do condomínio)
- Login opcional (magic link via Supabase Auth) e sync de snapshots — já no código
- Fundação multi-tenant (`condominios` + `memberships`, migration 005)
- PWA instalável com manifest e ícones próprios
- Telemetria opcional via Supabase REST

O app continua offline-first: sem variáveis do Supabase, login, sync e telemetria operam em no-op silencioso. Billing ainda não construído.

## Como Rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. A experiência principal é desenhada para viewport mobile, especialmente entre 375px e 428px.

Comandos de verificação usados no projeto:

```bash
npx tsc --noEmit
npx next build
```

## Produto Atual

- Aba Início: status do condomínio, guidance operacional, próximas datas, próximos passos, revisão mensal e dicas contextuais.
- Aba Assistente: motor determinístico com base de conhecimento local, fallback contextual e respostas com aviso jurídico.
- Aba Ferramentas: comunicados, simuladores e checklists operacionais.
- Aba Condomínio: perfil, memória operacional, timeline, revisão mensal e backup JSON.
- Admin `/admin`: leitura de telemetria local/remota e auditoria interna do assistente.

## Dados E Privacidade

Os dados operacionais do usuário ficam no dispositivo via `localStorage`. O backup exporta um JSON para migração ou proteção local dos dados.

A telemetria remota é opcional e privacy-safe:

- não envia query bruta;
- não envia título de pendência;
- não envia dados livres digitados pelo usuário;
- usa campos estruturais como categoria, score, origem, matched id e duração de sessão;
- depende de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

O guia de ativação manual fica em `docs/setup-supabase-telemetria.md`.

## Identidade Visual

- Azul petróleo `#234B63` como cor primária.
- Marfim `#F7F1E8` como base clara.
- Terracota `#C97852` para ação, urgência e estados que pedem atenção.
- Layout limitado a 440px no desktop para preservar a experiência mobile.

## Limites Operacionais

- Rota principal `/` deve permanecer abaixo de 230 kB de First Load JS.
- Estado atual registrado: 223 kB, com margem de 7 kB.
- Evitar novas bibliotecas e imports pesados.
- Preferir componentes sob demanda quando a funcionalidade pertence a uma aba específica.

## Estrutura Principal

```text
app/
  page.tsx          # Shell principal com as 4 abas
  admin/page.tsx    # Painel interno de telemetria e auditoria
components/         # UI e fluxos operacionais
lib/
  data.ts           # Motor determinístico do assistente
  session.ts        # Persistência local e backup
  guidance.ts       # Regras operacionais de monitoramento
  telemetry.ts      # Telemetria opcional via Supabase REST
docs/               # Manuais, roadmap interno e guias operacionais
```

## Decisões De Produto

- Offline-first: o app deve continuar funcionando sem Supabase, mesmo com SaaS ativo.
- Guidance e assistente usam regras determinísticas hoje; IA é evolução planejada (ver `docs/ia-assistente.md`).
- Ações recorrentes ficam em "Próximos passos" e na revisão mensal.
- Conteúdo jurídico é orientativo, com avisos específicos para temas sensíveis.
- Direção atual: migrar dados para o modelo relacional multi-tenant (Sprints 7–10) e completar os fluxos das 4 personas, preservando o bundle e a experiência Apple-like.
