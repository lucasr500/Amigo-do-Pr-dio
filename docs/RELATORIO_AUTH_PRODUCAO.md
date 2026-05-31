# Relatório: Ativação de Auth em Produção

**Data do marco:** 2026-05-31
**Commit:** `26aec93`
**Ambiente:** Vercel Production + Supabase

---

## O que foi ativado

- `auth_enabled = true` — autenticação via Supabase Auth ligada em produção
- Magic link configurado como método de login principal
- Redirect URLs configuradas no painel do Supabase para o domínio de produção
- Variáveis de ambiente Supabase corrigidas no Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Rota de callback (`/auth/callback`) funcional

## O que foi testado

| Cenário | Resultado |
|---|---|
| Envio de magic link | Funcionou |
| Callback de retorno ao app | Funcionou |
| Login completo | Funcionou |
| Logout | Funcionou |
| Dados locais após login | Preservados |

## O que ficou pendente

- `sync_enabled = false` — sincronização de dados com Supabase **não ativada**
- Dados do usuário ainda vivem apenas no `localStorage` do browser
- Nenhuma escrita no banco de dados Supabase além da sessão de auth

## Próximos passos recomendados

1. **Definir modelo de dados para sync** — mapear quais tabelas no Supabase receberão os dados locais (itens, despesas, moradores, etc.)
2. **Implementar migração local → remoto** — ao primeiro login de um usuário com dados locais, oferecer opção de subir esses dados para a conta
3. **Ativar `sync_enabled`** — somente após a camada de persistência estar estável e testada
4. **Tratar usuário não autenticado** — decidir se app continua funcionando offline-first ou passa a exigir login
5. **Testes de regressão** — garantir que fluxos existentes (sem auth) continuam funcionando enquanto sync está desligado
