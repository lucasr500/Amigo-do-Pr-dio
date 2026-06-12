# Sprint 6.2 — Ligar a Fundação · Checklist de Validação Manual

Objetivo: confirmar que login real aciona o tenant bootstrap (condomínio padrão +
membership owner/active), que o estado aparece honestamente na UI e que guest/demo
continuam sem tocar no Supabase.

> **Nota sobre rate limit de e-mail:** se o Supabase Auth retornar
> `email rate limit exceeded` ao pedir o magic link, **não é bug do app**.
> Aguarde a janela do limite (geralmente 1 hora no plano free) ou configure um
> SMTP próprio em Authentication → Emails → SMTP Settings no painel do Supabase.

## Preparação

- [ ] 1. Se houver build antiga estranha: `rm -rf .next`
- [ ] 2. Conferir `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 3. `npm run dev` e abrir http://localhost:3000

## Login real (magic link)

- [ ] 4. Entrar como Síndico/Gestor → Condomínio → Conta → informar e-mail → "Enviar link de acesso"
- [ ] 5. Se `email rate limit exceeded`: ver nota acima (não é bug). Aguardar ou usar SMTP próprio
- [ ] 6. Abrir o link do e-mail **no mesmo navegador** que pediu o link
- [ ] 7. Confirmar que volta para o app já logado (sem code visível na URL após a troca)
- [ ] 8. Header (aba Início): durante o carregamento aparece "Preparando seu condomínio…";
       em seguida "Conta conectada · Meu Condomínio" (chip verde)

## Verificação no Supabase (Table Editor)

- [ ] 9. Tabela `condominios`: existe **1 linha** com `owner_id` = id do usuário, nome "Meu Condomínio"
- [ ] 10. Tabela `memberships`: existe **1 linha** com `role=owner`, `status=active` para o mesmo usuário
- [ ] 11. Recarregar o app (F5) 2–3 vezes → **continua 1 condomínio e 1 membership** (idempotência;
        também cobre o Strict Mode em dev, que monta efeitos duas vezes)
- [ ] 12. DevTools → Application → Local Storage: chave `amigo_active_condominio_id` com o uuid do condomínio

## Magic link expirado

- [ ] 13. Pedir um novo magic link e **esperar expirar** (ou abrir um link já usado).
        Alternativa rápida: acessar manualmente
        `http://localhost:3000/auth/callback?error=access_denied&error_code=otp_expired`
- [ ] 14. Confirmar redirect para a home com aviso: "Seu link de acesso expirou. Peça um novo link na área de conta."
- [ ] 15. Confirmar que o aviso some ao clicar "Fechar" e não volta após F5 (URL limpa)

## Logout

- [ ] 16. Conta → Sair → app volta para modo local (guest)
- [ ] 17. `amigo_active_condominio_id` removido do localStorage
- [ ] 18. Chip "Conta conectada" desaparece do Header

## Guest mode

- [ ] 19. Em aba anônima (sem login): usar o app normalmente
- [ ] 20. Confirmar que **nenhuma** linha nova aparece em `condominios`/`memberships`
- [ ] 21. Header não mostra "Conta conectada" nem "Preparando seu condomínio…"

## Demo mode

- [ ] 22. Ativar modo demonstração → usar → sair do demo
- [ ] 23. Dados reais restaurados ao sair (comportamento pré-existente preservado)
- [ ] 24. Nenhuma linha nova em `condominios`/`memberships` criada pelo demo
- [ ] 25. Durante o demo, o chip "Conta conectada" não aparece

## Regressão local-first

- [ ] 26. Backup/exportar/importar na aba Condomínio funcionam como antes
- [ ] 27. Pendências, agenda e documentos locais intactos após login/logout

## Pós-merge (produção)

- [ ] 28. Configurar envs na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
        `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`
- [ ] 29. No Supabase: Authentication → URL Configuration → adicionar a URL de produção
        em Site URL / Redirect URLs (`https://<dominio>/auth/callback`)
- [ ] 30. Repetir passos 4–12 em produção
- [ ] 31. **Futuro (pré-Sprint 7):** testar com **dois usuários reais** — usuário B não pode ver o
        condomínio do usuário A (validação RLS cross-tenant)
