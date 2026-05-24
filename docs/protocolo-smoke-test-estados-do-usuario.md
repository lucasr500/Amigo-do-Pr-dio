# Protocolo de Smoke Test — Estados do Usuário

**Versão:** 2026-05-24  
**Contexto:** Criado após smoke test de 5 personas (Fase PB-1) identificar que o teste foi conduzido com localStorage preenchido de sessões anteriores, causando interpretações incorretas como "Rosa Cunha é dado indevido" (era na verdade um condomínio real salvo em testes anteriores).

---

## O Problema Metodológico

Um smoke test realizado **sem limpar o localStorage** simula um **usuário recorrente com dados**, não um usuário novo. Sem essa distinção, é impossível separar:

- Bugs reais (dados incorretos, crashes)
- Comportamento esperado para o estado testado
- Dados de sessões anteriores do fundador

---

## Estados do Usuário

### Estado 1 — Usuário Novo (primeiro acesso)
**O que é:** `localStorage` completamente vazio, nunca abriu o app.

**Como preparar:**
1. Abrir DevTools → Application → Storage → Clear site data
2. Ou usar uma **aba anônima/janela privativa** no Chrome/Safari
3. Ou deslogar do PWA instalado e reinstalar

**O que testar:**
- Aparece Hero/CTA de primeiro uso?
- OnboardingProfile surge após alguma interação?
- Score de saúde mostra estado neutro ("Configure seu prédio"), não vermelho?
- Nenhum nome de condomínio aleatório aparece no header?
- Bottom nav e tabs funcionam sem dados?

---

### Estado 2 — Usuário com Dados Mínimos
**O que é:** Tem perfil (`nomeCondominio` preenchido) mas poucas datas operacionais (< 1 essencial).

**Como preparar:**
1. Usar Estado 1 como base
2. Configurar apenas o nome do condomínio no OnboardingProfile
3. Não preencher AVCB, seguro ou mandato

**O que testar:**
- Score de saúde continua neutro/aguardando?
- Header mostra o nome do condomínio corretamente?
- GuidancePanel sugere ações relevantes?
- Empty states nos cards são orientados?

---

### Estado 3 — Usuário com Dados Robustos
**O que é:** Tem perfil completo + datas essenciais (AVCB, seguro, mandato) + pelo menos 2 manutenções.

**Como preparar:**
1. Preencher via Conta → Meu Condomínio
2. Registrar via Assistente → Registrar datas, ou via Ferramentas
3. Adicionar ao menos 1 pendência e 1 evento de agenda

**O que testar:**
- Score de saúde aparece com cor e percentual reais?
- HomeSaudeCard exibe status esperado (não neutro)?
- SaudeScreen mostra áreas monitoradas e registros?
- GuidancePanel mostra alertas ou "tudo em ordem"?

---

### Estado 4 — Usuário Recorrente (localStorage preservado)
**O que é:** Dados de sessões anteriores intactos no localStorage.

**Como identificar:** Header mostra `nomeCondominio` de uma sessão anterior. **Este é o estado esperado para um usuário real que volta ao app.**

**Como preparar:**
- Não limpar o localStorage
- Usar o navegador normalmente

**O que testar:**
- App continua funcionando com dados antigos?
- Nenhuma tela está quebrada?
- Score de saúde reflete os dados salvos?

> **Nota:** "Rosa Cunha" aparecendo no header durante testes indica Estado 4 (dados de sessão anterior do fundador), NÃO um bug de dados indevidos.

---

### Estado 5 — Usuário com Dados Corrompidos ou Parciais
**O que é:** localStorage com chave `amigo_*` mas conteúdo inválido/incompleto.

**Como preparar (avançado):**
1. DevTools → Application → Local Storage
2. Editar manualmente o valor de `amigo_perfil` para JSON inválido

**O que testar:**
- App não crasha ao tentar ler dados corrompidos?
- Exibe fallback gracioso?
- Backup → Restaurar funciona após erro?

---

## Checklist Rápido por Smoke Test

Antes de cada smoke test, documentar:

```
Data: ___________
Ambiente: [ ] Vercel prod  [ ] localhost:3000  [ ] PWA instalado
Browser: [ ] Chrome  [ ] Safari  [ ] Firefox  [ ] Mobile
Estado do usuário: [ ] Novo  [ ] Dados mínimos  [ ] Dados robustos  [ ] Recorrente
localStorage: [ ] Limpo  [ ] Preservado  [ ] Parcialmente limpo
Versão/commit: ___________
```

---

## Comandos Úteis no Console

```js
// Ver todos os dados salvos
Object.entries(localStorage).filter(([k]) => k.startsWith("amigo_"))

// Ver tamanho aproximado
JSON.stringify(Object.entries(localStorage).filter(([k]) => k.startsWith("amigo_"))).length

// Simular usuário novo (apaga apenas dados do app)
Object.keys(localStorage).filter(k => k.startsWith("amigo_")).forEach(k => localStorage.removeItem(k))
```

---

## Convenção de Nomenclatura em Relatórios

Ao reportar um issue encontrado em smoke test, sempre incluir o **Estado do Usuário**:

> "Bug encontrado no Estado 1 (usuário novo, localStorage limpo): score de saúde exibe vermelho."

vs.

> "Comportamento observado no Estado 4 (dados recorrentes do fundador): header exibe 'Rosa Cunha' — esperado."

Isso evita false positives e economiza tempo de triagem.
