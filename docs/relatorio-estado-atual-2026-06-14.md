# Relatório de Estado Atual — Amigo do Prédio

**Data:** 2026-06-14 · **Branch:** `sprint-6.1-lapidacao-premium` · **Sprint de execução:** 6.2
**Método:** leitura de código + verificações objetivas (tsc, vitest, build, migrations). Cada
"pronto" abaixo é ancorado em evidência `arquivo:linha`. Onde falta evidência, o item é
classificado como ❓ Incerto ou ⛔ Não feito. **Documentado ≠ implementado.**

Legenda: ✅ Feito (com evidência) · 🟡 Parcial · ⛔ Não feito · ❓ Incerto.

---

## 1. Sumário executivo

O AdP é um **PWA maduro e estável** no núcleo do síndico: TypeScript zero-erro, build limpo,
**790 testes passando**, cockpit operacional completo e onboarding fluido. A **fundação SaaS
existe de verdade no código** — o SDK Supabase está instalado, e auth (magic link), sync de
snapshots e a camada multi-tenant **são implementações reais, não stubs** (a nota "Fase 89A:
stubs sem SDK" no roadmap está desatualizada). Porém o **dado operacional ainda vive 100% em
`localStorage`**: nenhum módulo migrou para o modelo relacional por condomínio, e a camada
`lib/tenant/` — embora real e testada — está **dormente** (zero call sites em `app/` ou
`components/`). A distância real até a exposição (Portão 1) é grande e concentrada num único
ponto: **a migração `localStorage` → relacional com RLS auditada (Bloco B) ainda está em ~0%
de execução** — é o gargalo dominante. Em segundo plano, há **dívida jurídica concreta**: as
páginas legais publicadas (`/termos`, `/privacidade`) estão **defasadas** (v1.0, 25/05/2026,
descrevem o app antigo "sem login/sem sync, servidores nos EUA"), **não há aceite no
onboarding**, **não existe arquivo de LIA** apesar de a Política afirmar "LIA documentado", e a
**região do Supabase não está confirmada**. Veredito: núcleo pronto; **SaaS apenas fundação**;
exposição bloqueada com razão.

---

## 2. Direção vigente confirmada

A direção oficial (decisões do Lucas, jun/2026) é **SaaS multi-tenant + multi-persona**
(síndico, condômino, conselho, funcionário), com backend/login/sync como caminho oficial e
**Regra de Não-Exposição permanente** até a Definição de Pronto (dois portões). Fonte canônica:
Notion; execução: `docs/roadmap-pre-lancamento.md:7-21`, `docs/INDEX.md`, `docs/multi-tenant-roadmap.md`.

**Notion ↔ repo batem na direção?** Sim, no rumo estratégico (multi-tenant, dois portões,
não-exposição). Divergem no **estado de execução**: os documentos descrevem com frequência
intenções e planos como se fossem práticas correntes (ver §7). A memória do projeto
(`project_diretriz_estrategica.md`) está alinhada.

---

## 3. Estado técnico real

**Stack:** Next.js 15.5.18 · React 18.3 · TypeScript 5.5 · Tailwind 3.4 · Vitest 4.1 ·
`@supabase/supabase-js ^2.106.2`. Evidência: `package.json:14-36`.

**Verificações objetivas (rodadas nesta data):**
| Checagem | Resultado | Evidência |
|---|---|---|
| `tsc --noEmit` | ✅ 0 erros | exit 0 |
| `vitest run` | ✅ 790 testes / 42 arquivos | "Tests 790 passed (790)" |
| `next build` | ✅ Compiled successfully, sem warnings | exit 0 |
| Bundle `/` (First Load JS) | ✅ 185 kB (limite interno 230 kB) | saída do build |
| Rotas em `app/` | 8 + not-found | build (ver abaixo) |
| `git status` | limpo | working tree clean |

Rotas: `/`, `/admin`, `/api/admin/auth`, `/api/admin/events`, `/auth/callback`,
`/manifest.webmanifest`, `/privacidade`, `/termos`.

| Capacidade | Veredito | Evidência |
|---|---|---|
| **Auth (magic link)** | ✅ **Real** (não stub); ativo por flag | `lib/auth/authClient.ts:22-39` usa `sb.auth.signInWithOtp`; `auth_enabled: true` em `lib/feature-flags.ts:14`; `app/auth/callback/route.ts` existe; gated pela presença de env Supabase (`lib/supabase/env.ts:10-31`) |
| **Cliente Supabase** | ✅ Real, lazy-loaded | `lib/supabase/client.ts:15-35` importa SDK dinamicamente |
| **Sync (snapshots)** | ✅ **Real** | `lib/sync/syncEngine.ts:55-140` (`uploadSnapshot`/`downloadSnapshot`/`checkRemoteSnapshot` contra `app_snapshots`) |
| **"Sync segue a autenticação"** | ✅ **Implementado de fato** | `syncFollowsAuth` em `lib/feature-flags.ts:85-93`; **wired** no `AuthContext` (`lib/auth/AuthContext.tsx:57,77,89`); precedência de `setSyncPreference` testada em `lib/__tests__/feature-flags-sync.test.ts:65-78` |
| **Multi-tenant (runtime)** | ⛔ **Dormente** | `lib/tenant/tenantClient.ts` tem queries reais a `condominios`/`memberships`, mas **nenhum import em `app/` ou `components/`** (grep sem matches). Não é exercido em runtime |
| **localStorage como fonte de verdade** | ✅ (é o estado real) | Todo dado operacional em `localStorage`; `docs/multi-tenant-roadmap.md:29-41` lista 8 módulos não migrados |
| **Telemetria** | 🟡 Pronta no código, infra manual pendente | tabela `events` definida em `docs/setup-supabase-telemetria.md:55`; `read_anon` removida via `supabase/migrations/004_fix_events_policy.sql:19` (SQL a aplicar manualmente) |
| **PWA** | 🟡 Instalável; validação em device físico não comprovada | manifest/ícones ok; roadmap marca "verificar em dispositivo real" (`roadmap-pre-lancamento.md:57,183`) |

**Conclusão técnica:** auth e sync são **código completo e correto**, porém **inertes até** o
projeto Supabase estar configurado (env + migrations 004/005 aplicadas — infra pendente,
`multi-tenant-roadmap.md:122-128`). Multi-tenant é **fundação de schema + biblioteca não
conectada**.

---

## 4. Portão 1 — Completo–Núcleo, item a item

Referência: `docs/roadmap-pre-lancamento.md:162-189`. Nenhuma caixa está marcada no roadmap;
abaixo, o veredito por evidência de código.

### Bloco A — Síndico (núcleo)
| Caixa | Veredito | Evidência |
|---|---|---|
| Cockpit completo (monitoramento, próximos passos, assistente, comunicados, revisão, agenda) | ✅ | Componentes/abas existentes, 790 testes; histórico Fases 50–86 (`roadmap-pre-lancamento.md:85-135`) |
| Funciona autenticado **com dados no modelo relacional** (não só localStorage) | ⛔ | Dados 100% em localStorage; sync é snapshot único (`app_snapshots`), não relacional |

### Bloco B — Segurança / Multi-tenant  ← **gargalo**
| Caixa | Veredito | Evidência |
|---|---|---|
| Dados do condomínio em Supabase relacional (saída do localStorage) | ⛔ | Nenhum módulo migrado; `multi-tenant-roadmap.md:29-41` |
| RLS auditada; **isolamento entre condomínios testado** | ⛔/❓ | RLS escrita em `migrations/005:100-161`; **não há teste de integração de isolamento** contra DB real (só `tenant-client-local.test.ts`, lógica local) |
| Sync multi-device sem perda; resolução de conflito clara | ⛔ | `multi_device_enabled: false` (`feature-flags.ts:15`); Sprint 9 não iniciada |
| Escopo = um usuário com vários condomínios | 🟡 (schema permite) | `memberships UNIQUE(user_id, condominio_id)` em `005:47`; sem UI de troca de condomínio |

### Bloco C — Jurídico
| Caixa | Veredito | Evidência |
|---|---|---|
| Política e Termos **revisados** (saindo de rascunho) | 🟡 | Minutas "cravadas" em `docs/termos-de-uso.md` / `docs/politica-privacidade.md` (2026-06-14), mas ainda com `[PENDENTE]`/`[Lucas confirma]` e "sujeita à revisão jurídica final"; **páginas publicadas defasadas** (§6) |
| Disclaimers em categorias sensíveis | ✅ | `SENSITIVE_CATEGORY_NOTICE` (Fase 53, `roadmap:131`) |

### Bloco D — Performance / Técnico
| Caixa | Veredito | Evidência |
|---|---|---|
| Bundle dentro do limite; TS zero-erro; build limpo | ✅ | 185 kB / tsc 0 / build ok (§3) |
| PWA validado em device físico (Android + iOS) | 🟡/❓ | Não comprovado nesta verificação |

### Bloco E — Experiência (Apple-like)
| Caixa | Veredito | Evidência |
|---|---|---|
| Cada tela responde "o que faço agora?" | ✅ | GuidancePanel, hubs, próximos passos |
| Onboarding do síndico < 3 min | ✅ | `components/onboarding/OnboardingFlow.tsx` (4 etapas, campos opcionais, "pular") |

### % de avanço estimado do Portão 1
Estimativa ponderada por esforço restante, com peso maior em B (núcleo da definição):

| Bloco | Peso | Avanço | Contribuição |
|---|---|---|---|
| A | 25% | 50% | 12,5% |
| B | 35% | ~15% | 5,3% |
| C | 15% | 40% | 6,0% |
| D | 15% | 80% | 12,0% |
| E | 10% | 90% | 9,0% |

**Portão 1 ≈ 45%.** Justificativa: A/D/E estão maduros, mas o **coração do portão (Bloco B —
relacional + RLS auditada + multi-device) está em ~15%** (só schema e biblioteca dormente). C
avançou em minuta, mas a entrega real (páginas vigentes, aceite, LIA, região) não está no
produto. **O portão não passa de ~50% enquanto a migração relacional não começar.**

**Caixas com evidência de conclusão não marcadas no roadmap:** D (bundle/tsc/build ✅), E
(ambas ✅) e o disclaimer de C (✅) já têm evidência e poderiam ser marcadas. **Atenção:** a
regra "sync segue a autenticação" (citada na sequência de trabalho, `roadmap:220`) **já está
implementada e testada** — pode ser marcada como concluída.

---

## 5. Portão 2 — panorama (multi-persona)

Referência `roadmap:191-203`. Maturidade atual:
- **Condômino** — 🟡 existe Central Digital (mural, solicitações, documentos, enquetes,
  reservas) com flags `community_portal_enabled`/`resident_access_enabled` true
  (`feature-flags.ts:20-23`), porém como **modo de visualização single-user local**, não
  multi-usuário real (depende do Bloco B).
- **Conselho** — 🟡 modelado como papel (`council` em `memberships.role`, `005:43`;
  `council_access_enabled: true`), mas sem governança multi-usuário real.
- **Funcionário** — ⛔ mínimo/inexistente como persona ativa (papel `resident/viewer` no
  schema; sem fluxo de tarefa+comprovação).

Portão 2 **não bloqueia** a exposição, mas hoje vive em modo local/visualização — sua
realização plena também depende da saída do localStorage.

---

## 6. Pendências jurídicas e de privacidade

| Item | Status real | O que destrava |
|---|---|---|
| **Páginas legais vigentes** | ⛔ **Defasadas** | `app/termos/page.tsx:44` e `app/privacidade/page.tsx:42` datam **25/05/2026**, dizem "não há login/sync, dados só no dispositivo" (`termos:122-131`) e **"servidores nos EUA"** (`privacidade:137`). As minutas canônicas (`docs/*.md`, 2026-06-14) já descrevem magic link, sync, controlador, operador, São Paulo-PENDENTE. **Publicar a v2 das páginas a partir das minutas.** |
| **Região Supabase** | ⛔ **Não confirmada** | `.env.local:1` = `https://cmnysqhkfjzcysssmjih.supabase.co` — a URL **não revela região**. PENDENTE correto em `politica-privacidade.md:130`. Confirmar/migrar para `sa-east-1` antes de ativar sync em produção. |
| **Controlador PF → PJ** | 🟡 declarado, não resolvido | Hoje PF (Lucas Romeiro); migrar titularidade para CNPJ antes de exposição (`politica-privacidade.md:31-36`, `termos:106-110`). |
| **CCT-RJ** | 🟡 marcador aberto | `[Lucas confirma o instrumento exato]` em `termos-de-uso.md:88`. Páginas citam "SECOVI-Rio" (`termos page:115`). |
| **LIA (telemetria)** | ⛔ **Inconsistência doc↔artefato** | `politica-privacidade.md:112,149` afirma "LIA documentado", mas **não existe arquivo de LIA em `docs/`** (grep só retorna a própria Política). Criar o registro do LIA ou corrigir a afirmação. |
| **Aceite no onboarding** | ⛔ **Inexistente** | `OnboardingFlow.tsx` **não tem caixa de aceite nem link a /termos /privacidade**; contradiz `termos-de-uso.md:154-156` ("caixa de aceite explícita na primeira execução"). Páginas linkadas só de `components/tabs/CondominioTab.tsx`. |
| **Auto-exclusão de conta/dados** | ⛔ "em construção" | `termos:139-141` e `politica-privacidade.md:163-166` dizem "botão em construção"; sem código. `on delete cascade` existe no schema (`001:9,49`; `005:41-42`). |
| **Restrição de leitura de `events`** | 🟡 SQL pronto, não aplicado | `migrations/004` remove `read_anon`; é infra manual pendente (`multi-tenant-roadmap.md:124`). |

---

## 7. Divergências e inconsistências (Notion ↔ docs ↔ código)

1. **"Stubs sem SDK" (FALSO hoje).** `roadmap-pre-lancamento.md:105` (Fase 89A) diz que
   `client.ts`/`authClient.ts`/`syncEngine.ts` são stubs e "@supabase/supabase-js não
   instalado". **Código contradiz:** SDK instalado (`package.json:15`) e os três são
   implementações reais. *Documento desatualizado.*
2. **Páginas legais vs minutas.** Páginas publicadas (maio, modelo antigo) ⟂ minutas (junho,
   modelo SaaS). §6.
3. **"LIA documentado" sem artefato.** §6.
4. **"Aceite no onboarding" afirmado, ausente no código.** §6.
5. **Multi-tenant "já existe no código" (parcial).** `INDEX.md:99-104` e `roadmap:69-71`
   sugerem multi-tenant operante; na prática a camada está **dormente** (sem call sites). É
   fundação de schema + lib, não runtime.
6. **Bundle "225 kB" nos docs vs 185 kB First Load** medido agora — métrica antiga; sem
   impacto, mas convém atualizar.

---

## 8. Riscos

- **Reputacional (o mais relevante).** A Regra de Não-Exposição (`roadmap:139-151`) existe
  justamente porque o Lucas atua no mesmo mercado. Expor com **páginas legais erradas**, **sem
  aceite** e **multi-tenant dormente** queimaria reputação. Risco controlado *enquanto a regra
  for respeitada* — e ela está sendo.
- **Jurídico/LGPD.** Ativar sync **antes** de confirmar a região e publicar a Política correta
  cria exposição de transferência internacional não declarada (Arts. 33–36). "LIA documentado"
  afirmado sem artefato é passivo de prova. Auto-exclusão prometida e ausente é risco de
  direito do titular (Art. 18).
- **Técnico.** O risco central é a **migração localStorage → relacional**: 44+ componentes
  dependem de `session.ts` (`multi-tenant-roadmap.md:99-104`); migração big-bang regrediria o
  produto. A estratégia de dual-write por módulo (Sprint 7+) é a mitigação correta — mas ainda
  não começou.
- **Dívida técnica.** Camada `lib/tenant/` real, testada e **não usada** tende a divergir do
  schema com o tempo. Migrations 004/005 **não comprovadamente aplicadas** ao projeto.
  Documentos de direção afirmam estados não verificáveis no código (erodem a confiança na
  própria documentação).

---

## 9. Backlog priorizado (impacto × esforço) — próximas 3–5 ações

1. **Publicar a v2 das páginas legais a partir das minutas + aceite no onboarding.**
   Impacto **alto**, esforço **baixo**. Reescreve `app/termos` e `app/privacidade` com o texto
   de `docs/*.md` (2026-06-14) e adiciona caixa de aceite (data + versão) no `OnboardingFlow`.
   Fecha grande parte do Bloco C e remove o risco jurídico mais barato de eliminar.
2. **Resolver os PENDENTEs jurídicos sem código.** Impacto **alto**, esforço **baixo**:
   confirmar região Supabase (`sa-east-1`?), criar o **arquivo de LIA** em `docs/`, fixar o
   instrumento da CCT-RJ. Destrava a ativação segura do sync.
3. **Sprint 7 — primeiro módulo relacional (Agenda) com dual-write.** Impacto **alto**,
   esforço **médio/alto**. É o início real do Bloco B e o único caminho para tirar o Portão 1
   de ~45%. Inclui `migration 006_agenda.sql` + RLS + teste de isolamento entre condomínios.
4. **Aplicar e validar as migrations 004/005 no projeto Supabase** e **ligar a camada
   `lib/tenant`** (`ensureDefaultCondominioForUser` no `AuthContext`). Impacto **médio**,
   esforço **baixo/médio**. Tira o multi-tenant da dormência e habilita o teste de RLS real.
5. **Botão de auto-exclusão de conta/dados.** Impacto **médio** (LGPD), esforço **médio**.
   Cumpre o que os Termos já prometem.

---

## 10. Recomendação

**Sequência:** primeiro feche o **barato e de alto risco** (ações 1 e 2 — jurídico/páginas/
LIA/região), porque são esforço baixo e removem o risco reputacional/legal mais imediato sem
tocar a arquitetura. Em paralelo/em seguida, ataque o **gargalo dominante** com a **ação 4**
(aplicar migrations + ligar `lib/tenant`) como pré-requisito barato da **ação 3** (Sprint 7,
Agenda relacional com dual-write e teste de isolamento), que é o que efetivamente move o
Portão 1.

**PRÓXIMA AÇÃO ÚNICA:** **Publicar a v2 de `/termos` e `/privacidade` a partir das minutas de
2026-06-14 e adicionar o aceite (data + versão) no onboarding.** Justificativa: é a maior
redução de risco por unidade de esforço — as páginas vigentes hoje *afirmam* coisas falsas
sobre o produto ("sem login/sync", "servidores nos EUA"), o que é o pior tipo de passivo a
carregar; é trabalho de baixo risco que não toca a arquitetura; e fecha a parte entregável do
Bloco C enquanto o Bloco B (longo) é planejado. **Não ativar o sync em produção antes de
concluir as ações 1–2.**

---

## 11. Apêndice

### Comandos rodados (2026-06-14)
- `git log --oneline -15` · `git status` (limpo) · `git branch --show-current` →
  `sprint-6.1-lapidacao-premium`
- `npx tsc --noEmit` → **exit 0** (zero erros)
- `npx vitest run` → **790 passed / 42 files** (2.71s)
- `npx next build` → **Compiled successfully**, 12 páginas, `/` = 185 kB First Load JS

### Evidências-chave (arquivo:linha)
- SDK instalado: `package.json:15`
- Auth real: `lib/auth/authClient.ts:22-39`; flag `lib/feature-flags.ts:14`; `app/auth/callback/route.ts`
- Env gating + região não revelada: `lib/supabase/env.ts:10-31`; `.env.local:1`
- Sync real: `lib/sync/syncEngine.ts:55-140`
- Sync segue auth (wired): `lib/auth/AuthContext.tsx:57,77,89`; `lib/feature-flags.ts:85-93`; teste `lib/__tests__/feature-flags-sync.test.ts:65-78`
- Multi-tenant schema/RLS/funções: `supabase/migrations/005_multi_tenant_foundation.sql:18-161`
- Multi-tenant dormente: `lib/tenant/tenantClient.ts:182-267` (real) vs **zero** import em `app/`/`components/` (grep)
- localStorage como verdade: `docs/multi-tenant-roadmap.md:29-41`
- `events`/`read_anon`: `docs/setup-supabase-telemetria.md:55,78`; `supabase/migrations/004_fix_events_policy.sql:19`
- Páginas legais defasadas: `app/termos/page.tsx:44,122-131`; `app/privacidade/page.tsx:42,137`
- Minutas canônicas: `docs/termos-de-uso.md:1-9,154-156`; `docs/politica-privacidade.md:1-9,127-139`
- Marcadores abertos: `docs/politica-privacidade.md:130` (região); `docs/termos-de-uso.md:88` (CCT)
- LIA sem artefato: afirmação em `docs/politica-privacidade.md:112,149`; nenhum arquivo LIA em `docs/`
- Onboarding sem aceite: `components/onboarding/OnboardingFlow.tsx` (sem checkbox/links legais)

*Relatório interno — Amigo do Prédio · 2026-06-14 · somente leitura/verificação; nenhum código
ou caixa de roadmap foi alterado.*
