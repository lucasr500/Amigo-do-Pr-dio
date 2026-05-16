# Checklist Release Candidate Interno — Amigo do Prédio

> **Documento de prontidão pré-beta.**
> Executar integralmente antes de qualquer teste com síndicos externos.
> Beta com usuários reais só ocorre futuramente, aproximadamente uma semana antes do lançamento.

---

## Como usar este checklist

Cada item tem três possíveis estados:
- `[x]` — verificado e ok
- `[ ]` — pendente
- `[!]` — crítico / bloqueador

Execute do início ao fim em um dispositivo real (Android preferencialmente) com localStorage zerado.

---

## 1. Build e TypeScript

- [ ] `npx tsc --noEmit` retorna zero erros
- [ ] `npx next build` conclui sem erros (warnings não críticos são aceitáveis)
- [ ] Rota `/` compila sem warnings de chunk
- [ ] Rota `/admin` compila sem warnings de chunk
- [ ] Nenhum `any` não intencional nos arquivos críticos (`lib/data.ts`, `lib/session.ts`)

---

## 2. Bundle abaixo do limite

- [ ] First Load JS da rota `/` ≤ 230 kB
- [ ] First Load JS da rota `/admin` ≤ 220 kB
- [ ] Nenhum chunk individual > 100 kB sem justificativa de dynamic import
- [ ] Componentes de abas não-iniciais estão em dynamic import (`ssr: false`)

---

## 3. PWA e installability

- [x] `app/manifest.ts` tem `icons` com 4 entradas (192 any, 192 maskable, 512 any, 512 maskable) — **Fase 36**
- [x] `public/icons/icon-192.png` existe — **Fase 36**
- [x] `public/icons/icon-512.png` existe — **Fase 36**
- [x] `public/icons/apple-touch-icon.png` existe — **Fase 36**
- [x] `app/layout.tsx` referencia apple-touch-icon — **Fase 36**
- [ ] DevTools → Application → Manifest → sem erros de ícone
- [ ] DevTools → Application → Manifest → "Installability: installable"
- [ ] Chrome no Android: ícone aparece corretamente na tela inicial após instalação
- [ ] Safari no iOS: ícone aparece corretamente via "Add to Home Screen"
- [ ] App instalado abre em modo standalone (sem barra do navegador)
- [ ] `theme_color` (#1f3147 navy) aparece na status bar quando instalado

---

## 4. Fluxo zero dados (usuário novo)

Testar em janela privada ou localStorage limpo:

- [ ] App abre sem erro de JavaScript
- [ ] Aba Início mostra Hero com CTA "Configurar monitoramento"
- [ ] Hero mostra link secundário "Ou faça uma pergunta ao Assistente agora →"
- [ ] Clicar no link secundário navega para aba Assistente
- [ ] Aba Assistente abre sem erro (sem histórico, sem favoritos)
- [ ] Aba Ferramentas abre sem erro
- [ ] Aba Condomínio mostra formulário de onboarding (sem perfil pré-preenchido)
- [ ] Navegar entre as 4 abas múltiplas vezes sem crash ou flash

---

## 5. Onboarding: perfil → memória → guidance

- [ ] Aba Condomínio → formulário aparece no estado `collapsed` (CTA "Cadastrar meu condomínio")
- [ ] Expandir e preencher nome, tipo, unidades → salvar
- [ ] Estado muda para bridge "Agora vamos configurar o monitoramento"
- [ ] Clicar "Configurar monitoramento" → MemoriaPanel expande automaticamente
- [ ] Preencher pelo menos 2 datas (ex: vencimento seguro, próxima assembleia)
- [ ] Salvar → aba Início agora mostra CondominioStatusHeader (não mais Hero)
- [ ] GuidancePanel mostra pelo menos 1 item de prioridade baseado nas datas cadastradas
- [ ] CondominioStatusHeader mostra o status correto (crítico / atenção / ok)

---

## 6. Perfil existente editável

- [ ] Com perfil já cadastrado, acessar aba Condomínio
- [ ] OnboardingProfile mostra estado `collapsed-existing` com nome do condomínio
- [ ] Clicar "Editar →" abre formulário com dados pré-preenchidos
- [ ] Editar um campo e salvar → estado volta para `collapsed-existing` com dados atualizados
- [ ] "Cancelar" fecha sem salvar

---

## 7. Assistente: resposta direta e fallback contextual

- [ ] Perguntar "como aplicar multa por barulho" → resposta direta (não fallback)
- [ ] Perguntar "quorum assembleia ordinária" → resposta direta
- [ ] Perguntar "previsão orçamentária condomínio" → resposta direta
- [ ] Perguntar algo fora de escopo ("como fazer imposto de renda") → bloqueio correto
- [ ] Perguntar algo vago mas condominial → fallback contextual com tema detectado e sugestões
- [ ] Favoritar uma resposta → reaparece em FavoritesPanel
- [ ] Histórico de consultas aparece em HistoryPanel
- [ ] Botão "Nova pergunta" limpa a resposta

---

## 8. Ferramentas: ComunicadoPanel

- [ ] Aba Ferramentas → 4 cards de modelo visíveis (2×2)
- [ ] Selecionar "Assembleia" → campos aparecem
- [ ] Preencher data e pauta → preview atualiza em tempo real
- [ ] Copiar → feedback "Comunicado copiado" aparece brevemente
- [ ] Sem nenhum campo preenchido → botão "Copiar" está desabilitado
- [ ] Disclaimer por modelo aparece abaixo do botão
- [ ] Hint de condomínio aparece quando perfil não tem nome do condomínio

---

## 9. Ferramentas: SimuladorMulta

- [ ] Slider de meses vai de 1 a 12
- [ ] Labels "1" e "12" nas extremidades do slider
- [ ] Com valores padrão (1% juros, 2% multa) → cálculo correto
- [ ] Cota negativa → clampada para 0 (nunca mostra valor negativo)
- [ ] Resultado não mostra NaN em nenhum campo
- [ ] Alterar qualquer campo limpa o resultado anterior (forçando novo cálculo)

---

## 10. Ferramentas: ChecklistPanel

- [ ] 4 checklists aparecem
- [ ] Marcar item → persiste após navegar para outra aba e voltar
- [ ] Reset de checklist funciona (desmarca todos os itens)
- [ ] Contador dinâmico mostra o número correto de fluxos

---

## 11. Backup export/import válido

- [ ] Aba Condomínio → BackupPanel visível
- [ ] Exportar → baixa arquivo JSON
- [ ] Arquivo JSON contém: `version`, `app`, `profile`, `memoria`, `favorites`, `checklists`
- [ ] Importar o arquivo exportado → mostra resumo antes de confirmar (nome, contagem de datas, favoritos)
- [ ] Confirmar → dados restaurados corretamente
- [ ] Aba Início reflete os dados importados

---

## 12. Backup inválido sem crash

- [ ] Importar arquivo de texto aleatório → erro claro, sem crash
- [ ] Importar JSON de outro app → erro claro "formato inválido"
- [ ] Importar JSON do produto mas com `version` diferente → erro claro ou import parcial documentado
- [ ] Cancelar após preview → nenhum dado é importado

---

## 13. localStorage corrompido

- [ ] Corromper manualmente `amigo_profile` no DevTools → app abre sem crash
- [ ] Corromper `amigo_memoria` → app abre, mostra Hero (sem guidance errôneo)
- [ ] Corromper `amigo_history` → histórico simplesmente não aparece
- [ ] Nenhuma tela branca em caso de JSON inválido no localStorage

---

## 14. Mobile sem overflow

- [ ] Testado em viewport 375×667 (iPhone SE) e 390×844 (iPhone 14)
- [ ] Nenhum scroll horizontal indesejado
- [ ] BottomNav fixo não oculta conteúdo em nenhuma aba
- [ ] Texto não está cortado ou overflow em cards
- [ ] Preview do ComunicadoPanel tem scroll quando muito longo (max-h + overflow-y)
- [ ] SimuladorMulta não quebra layout em telas estreitas

---

## 15. Disclaimers visíveis

- [ ] Toda resposta do Assistente tem texto de disclaimer jurídico visível
- [ ] SimuladorMulta tem disclaimer "estimativa" visível
- [ ] ComunicadoPanel tem disclaimer por modelo visível após copiar
- [ ] Nenhuma resposta afirma certeza legal absoluta sem ressalva

---

## 16. Telemetria sem coleta sensível

- [ ] Nenhum evento coleta texto da pergunta completo (apenas `q.slice(0, 80)`)
- [ ] Nenhum evento coleta conteúdo de campos de formulário (apenas contagens)
- [ ] Nenhum evento coleta valores financeiros (apenas flags `usou_valores_padrao`)
- [ ] Sem Supabase configurado → todos os eventos são silenciosos (no-op)
- [ ] `lib/telemetry.ts` não loga dados pessoais no console em produção

---

## 17. Painel /admin acessível para auditoria

- [ ] Rota `/admin` abre sem erro
- [ ] Seção Auditoria exibe 83 perguntas de teste
- [ ] Clicar "Rodar auditoria" executa e mostra resumo (pass / review / fail)
- [ ] Recall A ≥ 75% (meta: projetado ~87%)
- [ ] Bloqueio C = 100% (4/4 perguntas fora-de-escopo bloqueadas)
- [ ] Painel de telemetria exibe dados de sessão

---

## 18. PWA com ícones corretos (verificação técnica)

- [ ] `GET /icons/icon-192.png` → status 200, Content-Type: image/png
- [ ] `GET /icons/icon-512.png` → status 200, Content-Type: image/png
- [ ] `GET /icons/apple-touch-icon.png` → status 200, Content-Type: image/png
- [ ] `GET /manifest.webmanifest` → JSON com array `icons` não-vazio
- [ ] DevTools → Network → manifest → verificar que ícones carregam sem 404

---

## 19. Critérios para NÃO liberar beta

Não liberar para síndicos externos se qualquer um dos seguintes ocorrer:

- [ ] Build falha ou tem erro TypeScript
- [ ] Bundle da rota `/` > 230 kB
- [ ] App crasha ao navegar entre abas sem dados
- [ ] Backup importa dados antes da confirmação do usuário
- [ ] Resposta do Assistente mostra legislação inventada sem fonte KB
- [ ] LocalStorage corrompe ao usar o produto normalmente
- [ ] Qualquer tela branca (unhandled error) em fluxo normal
- [ ] PWA instalado abre em modo browser (não standalone)
- [ ] Nenhum disclaimer jurídico visível nas respostas

---

## 20. Critérios mínimos para beta futura

Beta com síndicos reais exige **todos** os seguintes:

### Produto
- [ ] Todos os 19 grupos acima passaram (ou pendências documentadas com justificativa)
- [ ] Recall A ≥ 75% confirmado em /admin (não apenas projetado)
- [ ] Fluxo completo (zero dados → onboarding → consulta) em dispositivo real sem assistência

### Técnico
- [ ] PWA instalável no Android (Chrome) e iOS (Safari)
- [ ] Build limpo confirmado no dia do convite
- [ ] Nenhum bug crítico aberto sem data de correção

### Conteúdo
- [ ] Disclaimer jurídico claro em toda resposta do Assistente
- [ ] Sem resposta afirmando "pode fazer X" sem mencionar que depende da convenção
- [ ] Dados sensíveis (trabalhista, financeiro) com caveat "consulte especialista"

### Processo
- [ ] Canal de feedback definido (WhatsApp direto, Notion form ou similar)
- [ ] Fundador disponível para acompanhar os primeiros 5 usuários
- [ ] Data de início da beta confirmada internamente

---

## Histórico de verificações

| Data | Versão | Verificador | Resultado | Pendências |
|------|--------|-------------|-----------|------------|
| 2026-05-16 | Fase 38 | Fundador (análise de código) | Build limpo, TS zero erros | Teste físico PWA pendente; auditoria /admin ao vivo pendente |
| — | Fase 36 | — | Em preparação | Ver seções acima |

---

## Atualizações — Fase 38

### 1. Build e TypeScript — VERIFICADO

- [x] `npx tsc --noEmit` retorna zero erros — **Fase 38**
- [x] `npx next build` conclui sem erros — **Fase 38** (ver relatorio-rc-interno-fase-38.md)
- [ ] Rota `/` compila sem warnings de chunk — pendente (verificar no próximo build)
- [ ] Rota `/admin` compila sem warnings de chunk — pendente

### 3. PWA — PARCIALMENTE VERIFICADO

- [x] `app/manifest.ts` tem `icons` com 4 entradas — **Fase 36**
- [x] `public/icons/icon-192.png` existe — **Fase 36**
- [x] `public/icons/icon-512.png` existe — **Fase 36**
- [x] `public/icons/apple-touch-icon.png` existe — **Fase 36**
- [x] `app/layout.tsx` referencia apple-touch-icon — **Fase 36**
- [ ] DevTools → Manifest sem erros — pendente (físico)
- [ ] Chrome Android: instalação ok — pendente (físico)
- [ ] Safari iOS: instalação ok — pendente (físico)

### 17. Painel /admin — HARDENING APLICADO

- [x] Hardening: produção sem `NEXT_PUBLIC_ADMIN_KEY` → bloqueio automático — **Fase 38**
- [ ] Auditoria ao vivo: Recall A ≥ 75% — pendente (rodar em /admin)

### Itens novos — Fase 38

- [x] Aviso CCT SECOVI-Rio com copy melhorado (mais claro quanto à limitação regional) — **Fase 38**
- [x] `docs/setup-supabase-telemetria.md` criado com SQL, env vars, queries — **Fase 38**
- [x] `docs/rascunho-termos-de-uso.md` criado — **Fase 38** (revisão jurídica pendente)
- [x] `docs/rascunho-politica-privacidade.md` criado (LGPD) — **Fase 38** (revisão jurídica pendente)
- [x] `docs/resultado-teste-pwa-fase-38.md` criado — **Fase 38**

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 38)*
*Atualizar a tabela de histórico a cada verificação completa.*
