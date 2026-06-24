# Especificação — Papel Funcionário/Zelador + Moderação Híbrida

**Autor:** Cowork (lane de produto/jurídico, em paralelo ao sprint de código) · **Data:** 2026-06-18
**Status:** especificação pronta para virar migration + `lib/**` em sprint posterior. **Não** é código; é o desenho que o Claude Code implementará quando o Lucas liberar.
**Fonte:** objetivos 7 (papel funcionário) e 10 (moderação) do *Realinhamento de Objetivos — 2026-06-18* (Notion).
**Invariantes herdadas:** anti-posicionamento (não competir com a administradora), local-first → relacional gated, RLS prova no banco (não na UI), separação jurídica de natureza, defaults seguros.

---

# Parte 1 — Papel Funcionário/Zelador

## 1.1 Princípio
O funcionário quer **saber o que fazer e comprovar que fez** — não folha, férias, contratos ou ponto (isso é da administradora). O papel existe para **fechar o loop operacional da integração**:

> morador reporta um problema (Canal/Solicitações) → síndico converte em **ordem de serviço** → funcionário **executa e comprova** (foto/nota) → vira **registro/linha do tempo** visível a quem tem papel.

Isso conecta a persona Funcionário diretamente à camada social/memória que já existe (`RequestsPanel`, `community-timeline`), sem inventar um módulo de RH.

## 1.2 Lugar no modelo de papéis
`MembershipRole` hoje (`lib/tenant/types.ts`): `owner | manager | council | resident | viewer`.
**Adicionar:** `staff` (rótulo PT-BR: "Funcionário/Zelador").

Posição na hierarquia de privilégio: **abaixo de resident em leitura institucional**, porém **com escrita restrita ao seu escopo operacional** (ordens atribuídas). Não é "gestão": não lê decisões sensíveis, inadimplência, jurídico, financeiro.

| Capacidade | owner/manager | council | resident | **staff** | viewer |
|---|---|---|---|---|---|
| Ler decisões sensíveis (jurídico/inadimplência) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ler/criar ordens de serviço | ✅ (todas) | ✅ (ler) | ❌ | ✅ **(só as atribuídas a si)** | ❌ |
| Marcar ordem como feita + comprovar | ✅ | ❌ | ❌ | ✅ **(suas)** | ❌ |
| Ver mural/comunicados oficiais | ✅ | ✅ | ✅ | ✅ | ✅ |
| Abrir solicitação no Canal | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver dado de unidade/morador | ✅ | parcial | próprio | ❌ | ❌ |

## 1.3 Entidade nova: Ordem de Serviço (`service_orders`)
Local-first primeiro; relacional depois, **pelo mesmo molde** (`docs/molde-migracao-relacional.md`).

Campos (rascunho):

- `id` (text, client id `os_...`)
- `condominio_id` (uuid, FK) — escopo/RLS
- `title`, `description`
- `origin` — `manual | solicitacao` (+ `linked_request_id` quando nasce do Canal)
- `category` — `manutencao | limpeza | seguranca | obra | outro`
- `status` — `aberta | em_andamento | concluida | cancelada`
- `assignee_membership_id` (uuid) — **o staff responsável** (base da RLS de staff)
- `priority` — `baixa | media | alta`
- `due_date` (date, opcional)
- `evidence[]` — comprovação: `{ kind: foto|nota, url|text, created_at }` (fotos via Supabase Storage na fase relacional)
- `created_by`, `created_at`, `updated_at`

## 1.4 RLS (desenho, a provar no gate)
- **SELECT:** gestão (owner/manager/council) lê todas as ordens do condomínio; **staff lê só onde `assignee_membership_id` = sua própria membership.**
- **INSERT/UPDATE de gestão:** owner/manager criam e atribuem.
- **UPDATE de staff:** só na própria ordem e só campos operacionais (`status`, `evidence`) — nunca reatribuir, nunca mudar escopo.
- **DELETE:** só owner/manager.
- Mesma regra de isolamento entre condomínios das migrations 005/006/007 (função `has_condominio_role`), e o **gate de isolamento deve ganhar um teste** cobrindo `service_orders` (staff de B não lê A; staff só vê as suas).

## 1.5 Onboarding do staff
Coerente com o objetivo 5 (onboarding híbrido): **convite do síndico** (o síndico cadastra o funcionário e atribui o papel `staff`). Sem auto-cadastro — funcionário é vínculo de confiança operacional.

## 1.6 Segurança
- Staff é baixo privilégio institucional → **MFA não obrigatório** para staff (o MFA obrigatório do objetivo 9 é para gestão: owner/manager/council). Magic link basta.
- **Comprovação por foto** exige governança de Storage: bucket por condomínio, RLS de objeto, sem URL pública perene. Tratar quando a fase relacional de `service_orders` chegar.

## 1.7 Não-escopo (anti-posicionamento)
Folha, férias, ponto, contrato, eSocial, holerite — **não**. Isso é da administradora. O papel staff é operacional (ordens + comprovação), não RH.

---

# Parte 2 — Moderação Híbrida

## 2.1 O modelo que você escolheu (objetivo 10)
**Reativa simples no geral + moderação prévia em temas sensíveis.** Em uma frase:

> Conteúdo comum publica direto e pode ser denunciado/removido (reativo); conteúdo **sensível** (inadimplência, acusações nominais a vizinho/síndico) entra numa **fila de aprovação** antes de aparecer.

Isso equilibra fluidez (a rede não pode ter fricção em tudo) com blindagem onde o risco jurídico é real.

## 2.2 Separação inegociável (já começada em `content-nature.ts`)
Estrutural, visível, não-configurável:

- **Opinião de morador** ≠ **Comunicado oficial** (síndico) ≠ **Deliberação de assembleia**.
- Cada peça carrega seu selo de natureza. Moderação e responsabilidade jurídica **dependem da natureza**: opinião de morador é o terreno de difamação/injúria; comunicado oficial responsabiliza a gestão; deliberação é registro formal.

## 2.3 Estados de moderação
Adicionar a posts/comentários da camada social um campo `moderation_status`:

- `publicado` — visível (default para conteúdo **não-sensível**).
- `pendente` — criado, **invisível** à comunidade, aguardando aprovação (default para conteúdo **sensível**).
- `aprovado` — sensível liberado por moderador (vira visível).
- `removido` — retirado após denúncia/decisão (invisível, **mas preservado** para auditoria — nunca hard-delete).
- `rejeitado` — sensível barrado na fila (nunca foi público).

## 2.4 O que dispara a fila de pré-moderação ("sensível")
Determinístico, com defaults seguros (objetivo 8 — **fechado por padrão**):

1. **Categoria declarada** sensível pelo autor (ex.: tópico marcado "financeiro/inadimplência").
2. **Heurística de termos** (lista condominial): "inadimplente", "deve", "caloteiro", nomes/unidades + acusação, etc. → marca como sensível mesmo se o autor não declarou.
3. **Alvo nominal**: menção a uma unidade/pessoa específica em contexto negativo.

Qualquer gatilho ⇒ `pendente` (não publica até aprovação). Em dúvida, o sistema **fecha** (seguro por padrão), não abre.

## 2.5 Papéis de moderação
- Fila de pré-moderação e remoções: **síndico (owner/manager) + conselho**.
- Denúncia: **qualquer membro** (resident/staff inclusive) via botão "denunciar".
- SLA sugerido para a fila (a definir com o Lucas): ex. 48h; expirado sem ação → permanece `pendente` (nunca publica sozinho).

## 2.6 Trilha de auditoria (LGPD + defesa jurídica)
Tabela `moderation_log` (append-only, imutável):

- `id`, `condominio_id`, `target_type` (post|comment), `target_id`
- `action` — `criado | marcado_sensivel | aprovado | rejeitado | denunciado | removido | restaurado`
- `actor_membership_id`, `reason` (texto), `created_at`
- snapshot do conteúdo no momento da ação (para provar o que existia).

**Por que importa (seu DNA jurídico):** difamação/injúria entre vizinhos e exposição de inadimplência são o risco estrutural da camada social. A trilha imutável + a separação de natureza + a remoção reativa rápida compõem a **postura de porto seguro** da plataforma: registra-se quem disse o quê, quando, e quando foi retirado. "Visibilidade só na UI = vazamento" — o estado de moderação tem de ser **gateado por RLS no banco**, não só escondido no front.

## 2.7 Defaults seguros (resolve a tensão do objetivo 8/10)
- Visibilidade de dado sensível é **configurável pela gestão**, mas **nasce fechada**: inadimplência individual nunca aparece ao morador por padrão; agregado é o máximo default. Abrir é ação explícita, logada.
- Pré-moderação de temas sensíveis vem **ligada** por padrão; desligar é decisão explícita do síndico, registrada (assume o risco conscientemente).

## 2.8 Sequenciamento de implementação (quando liberar)
1. `moderation_status` + heurística de sensível (sem fila ainda) — barra o pior caso cedo.
2. Fila de pré-moderação + UI de aprovação para gestão/conselho.
3. `moderation_log` imutável + RLS.
4. Denúncia + remoção reativa com SLA.
5. Storage governado para evidências/anexos.

---

# Decisões que dependem só do Lucas
1. Nome final do papel staff: "Funcionário", "Zelador" ou "Funcionário/Zelador" no rótulo.
2. SLA da fila de pré-moderação (sugerido 48h).
3. Lista inicial de termos sensíveis (eu posso rascunhar a partir do vocabulário condominial já em `lib/` — base do assistente).
4. Ordem vs. as fatias relacionais: este pacote (staff + moderação) exige **migrations novas** → entra **depois** de decidido o processo de validação de migration (gate de CI vs. Supabase local), conforme você marcou "decidir quando chegar a hora".
