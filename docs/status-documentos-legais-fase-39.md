# Status dos Documentos Legais — Fase 39
## Amigo do Prédio

> **Data:** 2026-05-16
> **Fase:** 39

---

## 1. O que existe

| Documento | Arquivo | Status |
|-----------|---------|--------|
| Termos de Uso | `docs/rascunho-termos-de-uso.md` | Rascunho pré-jurídico |
| Política de Privacidade (LGPD) | `docs/rascunho-politica-privacidade.md` | Rascunho pré-jurídico |

**Não existem:** páginas públicas de termos ou privacidade no app. Estes são apenas documentos internos para revisão.

---

## 2. O que cada rascunho cobre

### Termos de Uso (`docs/rascunho-termos-de-uso.md`)

| Seção | Conteúdo | Observação |
|-------|----------|------------|
| 1. Sobre o serviço | Escopo do app | Ok para base |
| 2. Natureza informativa | Não é assessoria jurídica | **Seção mais crítica — protege de reclamações** |
| 3. Simulações financeiras | Estimativas, não valores reais | Ok |
| 4. CCT regional | Limitação SECOVI-Rio | Ok |
| 5. Uso aceito | Síndicos e profissionais | Ok |
| 6. Disponibilidade | Best effort | Ok |
| 7. Propriedade intelectual | Conteúdo do app | Ok |
| 8. Alterações | 30 dias de aviso | Ok |
| 9. Contato | [a preencher] | Falta e-mail |

### Política de Privacidade (`docs/rascunho-politica-privacidade.md`)

| Seção | Conteúdo | Observação |
|-------|----------|------------|
| 1. Controlador | [a definir] | **Falta CPF/CNPJ** |
| 2. Dados coletados | Local vs. telemetria | Bem mapeado |
| 3. Base legal LGPD | Legítimo interesse | Verificar com advogado |
| 4. Compartilhamento | Supabase como subprocessador | Verificar transferência internacional |
| 5. Retenção | [a definir período] | Falta prazo concreto |
| 6. Direitos do titular | Art. 18 LGPD listado | Ok |
| 7. Segurança | HTTPS, RLS, LocalStorage | Ok |
| 8. Cookies | Não usa cookies de rastreamento | Ok |
| 9. Menores | Não destinado a menores | Ok |
| 10. Alterações | 30 dias de aviso | Ok |
| 11. DPO | [a definir] | Verificar se obrigatório |

---

## 3. Pontos sensíveis para revisão jurídica

### Prioridade alta (bloqueadores antes de qualquer publicação)

1. **Identificação do controlador** — é pessoa física (CPF) ou jurídica (CNPJ)? A LGPD exige identificação clara. Se pessoa física, verificar implicações para DPO e responsabilidade.

2. **Base legal da telemetria** — "legítimo interesse" para coleta de eventos de uso. Verificar se é adequado ou se precisa de consentimento explícito. Para dados de comportamento de uso agregado sem identificação pessoal, legítimo interesse geralmente é adequado, mas a ANPD ainda não consolidou jurisprudência clara.

3. **Transferência internacional de dados** — Supabase tem servidores nos EUA. O Brasil ainda não reconheceu os EUA como país adequado (art. 33 LGPD). Verificar se é necessário cláusula contratual padrão ou se o volume/tipo de dados dispensa isso.

4. **Limitação de responsabilidade** — verificar se o texto da seção 2 dos Termos de Uso é suficientemente robusto. Pode ser necessário cláusula mais explícita sobre teto de responsabilidade.

5. **Foro de eleição** — não está nos rascunhos. Definir foro para resolução de disputas.

### Prioridade média (antes do lançamento público)

6. **Aceite formal dos termos** — como o usuário aceita? Checkbox na primeira abertura? Tela de boas-vindas? "Ao usar o serviço"? Cada opção tem implicações diferentes.

7. **Notificação de incidente de segurança** — preparar procedimento interno para notificação à ANPD em caso de vazamento (art. 48 LGPD).

8. **Registro de atividades de tratamento** — art. 37 LGPD recomenda registro interno. Não é obrigação para todos os controladores, mas boa prática.

### Prioridade baixa (pode vir depois)

9. **App Store** — se o app for à App Store (iOS) ou Play Store (Android), os termos precisam estar publicados na URL pública antes do envio.

10. **Cookies** — se o Supabase ou outro serviço adicionado futuramente usar cookies, revisitar.

---

## 4. O que falta antes da beta

**Mínimo para convidar síndicos (mesmo que 5):**

- [ ] Identificação do controlador definida (nome/CPF ou CNPJ)
- [ ] E-mail de contato para privacidade e termos definido
- [ ] Revisão mínima por advogado das seções 2 e 3 dos Termos (natureza informativa + CCT)
- [ ] Definir como o usuário aceita os termos (sem implementação técnica ainda)

**Não é necessário para a beta:**
- Publicar página pública com os documentos (a beta é fechada, convites individuais)
- DPO formal (para operação de pequeno porte)
- Mecanismo técnico de aceite (pode ser informado por WhatsApp no convite)

---

## 5. O que falta antes do lançamento público

- [ ] Todos os pontos da seção 3 (prioridade alta e média) resolvidos
- [ ] Páginas `/termos` e `/privacidade` criadas no app com o texto aprovado
- [ ] Link para esses documentos em algum lugar acessível no app
- [ ] Aceite formal implementado na UI (checkbox ou equivalente)
- [ ] Mecanismo de revogação (como o usuário pede para ter seus dados removidos)
- [ ] Registro de atividades de tratamento preparado internamente

---

## 6. Próximo passo concreto

**Contratar ou consultar um advogado** com experiência em:
- LGPD e proteção de dados
- Direito digital e responsabilidade de plataformas
- Aplicativos SaaS B2B (síndicos = profissionais, não consumidores finais)

**Alternativa de custo baixo:** OAB-Digital ou advogados freelance especializados em LGPD para startups. Revisão de dois documentos curtos costuma ficar entre R$ 500-1.500.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 39)*
