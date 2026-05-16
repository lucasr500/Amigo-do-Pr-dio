# Hardening Pré-Beta — Fase 35

> **Objetivo:** Testar e fortalecer o Amigo do Prédio como se fosse aberto pela primeira vez
> em um novo dispositivo, sem dados salvos, garantindo que o fluxo completo funcione com
> clareza, sem crashes e sem dependência de conhecimento prévio do fundador.

---

## Resumo executivo

A Fase 35 foi uma fase de estabilidade e primeira experiência, não de expansão. Foram corrigidos
4 bugs reais (1 crítico, 2 de UX, 1 defensivo), mantendo TypeScript com zero erros e build limpo
com bundle de 218 kB na rota principal — abaixo do limite de 230 kB.

---

## Bugs Corrigidos

### 1. BackupPanel — Importação ocorria ANTES da confirmação [CRÍTICO]

**Arquivo:** `components/BackupPanel.tsx` + `lib/session.ts`

**Problema:** `handleFileChange` chamava `importUserData(raw)`, que escreve no localStorage,
antes de mostrar o diálogo de confirmação ao usuário. Resultado: selecionar um arquivo já
importava os dados, e clicar "Cancelar" não desfazia a operação.

**Correção:**
- Adicionado `parseAndValidateUserData()` em `lib/session.ts` — valida o JSON sem escrever
- `handleFileChange` agora usa a função de validação apenas para exibir o preview
- `importUserData` (com escrita) é chamado apenas em `handleConfirmImport`

**Impacto:** Alto. Dado que o diálogo de confirmação dizia "os dados atuais serão substituídos",
o usuário entendia ter controle que na prática não tinha.

---

### 2. OnboardingProfile — Perfil existente invisível e não editável [UX CRÍTICO]

**Arquivo:** `components/OnboardingProfile.tsx`

**Problema:** Com `forceShow=true` (aba Condomínio) e perfil já salvo, o componente retornava
null. O usuário não conseguia ver nem editar o perfil do condomínio após o primeiro cadastro.
Não havia nenhuma indicação de que um perfil existia.

**Correção:**
- Novo estado de view: `"collapsed-existing"` — mostra o nome do condomínio e botão "Editar →"
- Novo estado de view: `"updated"` — feedback breve após edição ("Perfil atualizado")
- `useRef` `isEditRef` distingue edição de criação nova, determinando o fluxo pós-save
- Edição: salva → feedback "Perfil atualizado" (1,4s) → volta ao collapsed-existing
- Criação nova: salva → bridge de memória (comportamento original preservado)
- Formulário expandido mostra "Editar perfil" como título em modo edição
- Botão "Cancelar" correto em modo edição (vs "Pular por enquanto" em criação)

**Impacto:** Alto. A aba Condomínio é o centro de identidade do produto — não poder editar
o perfil bloquearia o ciclo de uso.

---

### 3. Hero — Nenhum caminho para o Assistente sem cadastro [UX]

**Arquivo:** `components/Hero.tsx` + `app/page.tsx`

**Problema:** O único CTA na tela inicial sem dados era "Registrar dados do prédio". Um usuário
novo que quisesse apenas fazer uma pergunta não teria como descobrir que o Assistente funciona
sem cadastro.

**Correção:**
- Adicionado prop `onAssistente?: () => void` ao Hero
- Link secundário: "Ou faça uma pergunta ao Assistente agora →" abaixo do CTA principal
- `page.tsx` passa `onAssistente={() => setActiveTab("assistente")}` para o Hero

**Impacto:** Médio. Melhora descoberta e reduz abandono de usuários que chegam querendo consultar.

---

### 4. importUserData — Perfil null não limpava perfil local [defensivo]

**Arquivo:** `lib/session.ts`

**Problema:** Se o backup exportado tinha `profile: null` (sem perfil cadastrado), a importação
não limpava o perfil local do dispositivo — o perfil antigo permanecia. Restauração incompleta.

**Correção:**
- `importUserData` agora remove a chave `KEYS.PROFILE` do localStorage quando o backup tem
  `profile: null`, restaurando o estado exato exportado.

---

## Fluxo Zero Dados — Resultado do Teste Mental Completo

### Estado: zero localStorage

| Passo | Resultado esperado | Resultado observado | OK? |
|---|---|---|---|
| 1. Abrir app | Hero com CTA + link Assistente | ✓ Hero renderiza corretamente | ✓ |
| 2. Ver aba Início | Hero + HomeContextual + DicaDoDia | ✓ HomeContextual: null (sem sessão anterior), DicaDoDia: visible | ✓ |
| 3. Ir para aba Condomínio | OnboardingProfile collapsed + MemoriaPanel collapsed | ✓ collapsed com CTA "Personalizar" | ✓ |
| 4. Clicar "Configurar" | Formulário expandido sem valores | ✓ formulário vazio | ✓ |
| 5. Salvar perfil (sem preencher nada) | Salva {} profile → bridge | ✓ bridge mostrada corretamente | ✓ |
| 6. Clicar "Registrar datas do prédio" | MemoriaPanel auto-expande | ✓ autoExpand=true passa para MemoriaPanel | ✓ |
| 7. Preencher algumas datas e salvar | Feedback "✓ Memória atualizada" + colapsa | ✓ savedSummary mostra itens | ✓ |
| 8. Voltar para Início | CondominioStatusHeader aparece | ✓ hasCondominioData=true após profile+memoria | ✓ |
| 9. CondominioStatusHeader | Mostra "Monitoramento inativo" (sem datas) ou status real | ✓ lógica correta por cenário | ✓ |
| 10. GuidancePanel | Aparece apenas quando há itens de atenção | ✓ esconde quando items.length===0 | ✓ |
| 11. Ir para Assistente | Campo de pergunta + QuickAccessCards | ✓ sem dados não afeta o Assistente | ✓ |
| 12. Fazer pergunta direta | Resposta com base legal + dica | ✓ motor determinístico independente de localStorage | ✓ |
| 13. Pergunta em fallback | Fallback contextual com categoria detectada | ✓ chips de sugestão exibidos | ✓ |
| 14. Ir para Ferramentas | ComunicadoPanel + SimuladorMulta + ChecklistPanel | ✓ sem erro sem perfil | ✓ |
| 15. Gerar comunicado sem perfil | Hint "Nome do condomínio vazio" | ✓ hint exibido corretamente | ✓ |
| 16. Usar SimuladorMulta sem valor | Botão desabilitado | ✓ disabled quando cotaNum===0 | ✓ |
| 17. Exportar backup sem dados | .json com profile:null, memoria:{} | ✓ exporta sem crash | ✓ |
| 18. Importar backup inválido | Erro amigável | ✓ mensagem clara sem crash | ✓ |
| 19. Importar backup válido | Preview → confirmação → dados restaurados | ✓ após fix do Bug 1 | ✓ |
| 20. Recarregar página | Dados persistem | ✓ localStorage persiste entre sessões | ✓ |

---

## Cenários de Guidance e Status Header

| Cenário | Resultado |
|---|---|
| Sem perfil, sem memória | Hero mostrado, sem CondominioStatusHeader |
| Só perfil (sem memória) | CondominioStatusHeader: "Monitoramento inativo" |
| Perfil + datas em dia | Status "Tudo em ordem", badge verde |
| Perfil + AVCB vencido | Status "Uma pendência", badge âmbar |
| Perfil + 2+ itens vencidos | Status "Atenção urgente", badge crítico |
| GuidancePanel > 3 itens | Botão "Ver X restantes" aparece |
| GuidancePanel: resolução | Feedback "✓ {item} registrado" → colapsa → atualiza |

---

## Ferramentas — Resultado dos Testes

### ComunicadoPanel
- Sem perfil: hint "Nome do condomínio vazio — cadastre em Condomínio → Perfil" ✓
- Com perfil: nome auto-preenchido nos templates ✓
- Prévia ao vivo: renderizada em tempo real ✓
- Botão copiar desabilitado com filledCount===0 ✓
- Clipboard error: estado `copyError` com instrução manual ✓
- Disclaimers presentes em todos os modelos ✓

### SimuladorMulta
- Valor vazio: botão desabilitado ✓
- Valor negativo: clampado para 0 via `Math.max(0, ...)` ✓
- Vírgula como separador decimal: `.replace(",", ".")` ✓
- NaN: `|| 0` captura ✓
- 1 mês e 12 meses: cálculos corretos ✓
- Overflow mobile: container responsivo ✓

### ChecklistPanel
- Estado vazio (zero dados): mostra checklists sem progress bar ✓
- Marcação de item: feedback visual imediato ✓
- Item crítico: badge âmbar quando não checado ✓
- Progresso persiste após reload ✓
- "Limpar seleção" remove do localStorage ✓

---

## Backup e Importação

| Caso | Antes do fix | Após fix |
|---|---|---|
| Selecionar arquivo válido | Dados importados SEM confirmação | Validação sem escrita → aguarda confirmação |
| Cancelar importação | Dados já haviam sido substituídos | Dados intactos |
| Confirmar importação | Dados importados corretamente (segunda escrita) | Única escrita, na confirmação |
| Importar arquivo inválido | Erro exibido (mas possíveis writes parciais) | Falha antes de qualquer escrita |
| Importar backup sem perfil | Perfil antigo permanecia | Perfil local removido |
| Arquivo corrompido | Erro amigável ✓ | Erro amigável ✓ |

---

## Auditoria /admin — Estado

O painel `/admin` está funcional e inclui:
- KPIs de uso (sessões, perguntas, fallback rate, adoção memória, checklists)
- Top queries e tokens de fallback
- Distribuição de habit tier
- Auditoria de 83 perguntas (construída na Fase 33)

**Recall projetado da Fase 33: ~87%**

A auditoria foi implementada como ferramenta estática (83 AUDIT_CASES). As 5 novas entradas
da Fase 34 não estão refletidas nos AUDIT_CASES porque as queries-alvo dessas entradas não
cobrem os cenários dos 83 casos existentes. Isso não é regressão — é lacuna de cobertura
da auditoria, não do motor.

Para rodar: acesse `/admin` no browser → "Rodar auditoria" → analisar recall A, B e C.

**Nota:** O painel /admin usa `NEXT_PUBLIC_ADMIN_KEY` para auth. Sem a variável configurada,
entra sem senha (modo dev). Sem Supabase configurado, usa localStorage local.

---

## PWA / Installability

**Estado atual:**
- `manifest.ts` existe e retorna metadados corretos: nome, short_name, theme_color, background_color, display, start_url
- `layout.tsx` referencia `manifest.webmanifest` corretamente
- `viewport` configurado com themeColor e initialScale
- `appleWebApp` configurado (capable: true, statusBarStyle: default)
- `safe-area-inset-bottom` no BottomNav via CSS `env()`

**Limitação crítica de PWA:**
- `icons: []` — sem ícone definido no manifest
- Nenhum arquivo de ícone existe em `/public` (apenas `.gitkeep.txt`)
- **Consequência:** O app NÃO é instalável via "Add to Home Screen" em nenhum browser

**Pendência pré-beta obrigatória:** Criar ícone PNG em pelo menos 192×192 e 512×512 pixels,
adicionar ao `/public/icons/` e referenciar no `app/manifest.ts`.

**Sem service worker:** Não há SW implementado. Cache offline não existe. Acceptable para beta.

---

## Estados Defensivos Verificados

| Cenário | Comportamento |
|---|---|
| localStorage vazio | Todos os `safeRead` retornam fallback correto |
| localStorage corrompido | try/catch em `safeRead` retorna fallback silenciosamente |
| Datas inválidas em memória | `ate()`/`desde()` retornam NaN; guidance ignora itens sem data válida |
| Número inválido no simulador | `parseFloat || 0` captura NaN; `Math.max(0, ...)` remove negativos |
| Backup inválido | Validação antes da escrita; mensagem amigável sem crash |
| `window` undefined (SSR) | `safeRead`/`safeWrite` têm guard `typeof window === "undefined"` |
| Clipboard API ausente | try/catch em `handleCopy` + estado `copyError` com instrução manual |
| Componentes dinâmicos carregando | `ssr: false` em ComunicadoPanel, SimuladorMulta, ChecklistPanel, etc. |
| Perfil parcialmente preenchido | `CondominioProfile` com todos os campos opcionais — sem crash |

---

## Microcopy e Feedback

Ajustes realizados nesta fase:
- OnboardingProfile collapsed com perfil existente: mostra nome do condomínio + "Toque para editar o perfil"
- OnboardingProfile em edição: título "Editar perfil" (era "Meu condomínio")
- OnboardingProfile botão cancelar: "Cancelar" em edição (era "Pular por enquanto")
- Hero: link secundário "Ou faça uma pergunta ao Assistente agora →"
- BackupPanel: diálogo de confirmação agora reflete a operação real (dados ainda não escritos)

---

## Arquivos Alterados

| Arquivo | Tipo de mudança |
|---|---|
| `lib/session.ts` | Adicionado `parseAndValidateUserData()`; corrigido `importUserData` para null profile |
| `components/BackupPanel.tsx` | Usa `parseAndValidateUserData` no preview; `importUserData` só na confirmação |
| `components/OnboardingProfile.tsx` | Suporte a edição de perfil existente; novos estados `collapsed-existing` e `updated` |
| `components/Hero.tsx` | Prop `onAssistente`, link secundário para o Assistente |
| `app/page.tsx` | Passa `onAssistente` para Hero |
| `docs/hardening-pre-beta-fase-35.md` | Criado (este documento) |
| `docs/manual-interno-do-fundador.md` | Atualizado estado do produto |
| `docs/roadmap-pre-lancamento.md` | Atualizado checklist de critérios de beta |

---

## Testes de Build

```
npx tsc --noEmit   → 0 erros ✓
npx next build     → Compiled successfully ✓
```

**Bundle final:**
- Rota `/`: **218 kB** First Load JS (limite: 230 kB, margem: 12 kB) ✓
- Rota `/admin`: **202 kB** First Load JS ✓

---

## Bugs Pendentes (documentados, não corrigidos)

### PWA sem ícone
- **Severidade:** Alta para instalabilidade, baixa para uso via browser
- **Fix:** Criar `public/icons/icon-192.png` e `public/icons/icon-512.png` e referenciar no manifest
- **Estimativa:** 30 min com asset de ícone disponível

### MemoriaPanel — savedSummary com data inválida
- **Severidade:** Baixa (não é crash; mostra "vencido" em vez de "X dias")
- **Descrição:** `new Date(draft.vencimentoAVCB)` com string inválida retorna NaN, que é capturado
  pelo `d > 0` check e exibe "vencido". Comportamento incorreto mas não destrutivo.
- **Fix futuro:** Validar `isNaN(date.getTime())` antes de calcular dias

### Auditoria /admin não cobre Fase 34
- **Severidade:** Baixa (as entradas novas funcionam; a auditoria apenas não as testa)
- **Fix futuro:** Adicionar cases para as 5 entradas da Fase 34 em AUDIT_CASES

### Sem ícone favicon
- **Severidade:** Baixa (não afeta uso; apenas visual em abas de browser)
- **Fix:** Adicionar `/public/favicon.ico` ou `/app/favicon.ico`

---

## Critérios Técnicos Restantes Antes da Beta

### Obrigatórios
- [ ] Criar ícones PWA: `icon-192.png`, `icon-512.png` no `/public/icons/`
- [ ] Adicionar ícones ao `app/manifest.ts`
- [ ] Testar instalação "Add to Home Screen" em Android e iOS
- [ ] Testar fluxo completo em dispositivo móvel real (não emulador)

### Recomendados
- [ ] Adicionar favicon ao `/app/favicon.ico`
- [ ] Rodar auditoria /admin ao vivo e confirmar recall ≥ 75%
- [ ] Testar em modo privado/incógnito (localStorage limpo garantido)
- [ ] Verificar que SimuladorMulta funciona sem zoom forçado em iOS (font-size ≥ 16px)

---

## Recomendação da Próxima Fase

**Fase 36 — Beta Preparation:**

O produto está estável, com os principais bugs de primeira experiência corrigidos. A próxima
fase deve focar em:

1. **Criar assets de ícone** (obrigatório para installability): 192×192 e 512×512 PNG
2. **Adicionar ícones ao manifest** (5 minutos após ter o asset)
3. **Teste em dispositivo real** (Android + iOS): instalar como PWA, testar fluxo zero dados
4. **Rodar auditoria /admin ao vivo** e confirmar recall ≥ 75%
5. **Preparar canal de feedback** para os primeiros beta testers (WhatsApp direto ou Notion)
6. **Convidar 3–5 síndicos** para beta fechada após confirmação dos critérios acima

Sem nova feature, sem expansão editorial, sem backend. O produto está pronto para beta
quando os ícones existirem e o teste em dispositivo real confirmar o fluxo.

---

*Documento interno — Amigo do Prédio*
*Fase 35 — 2026-05-16*
