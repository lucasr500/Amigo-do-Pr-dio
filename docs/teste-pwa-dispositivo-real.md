# Teste de PWA em Dispositivo Real — Amigo do Prédio

> **Guia de instalação e verificação do PWA.**
> Execute este roteiro ao testar em dispositivo físico antes da futura beta.

---

## Pré-requisito

O app deve estar rodando em HTTPS (produção no Vercel) ou via `npm run dev` em localhost.
Localhost também funciona como PWA para testes — Chrome trata `127.0.0.1` como secure origin.

---

## 1. Verificação via DevTools (Chrome ou Edge — desktop)

### Passo a passo

1. Abrir o app no navegador (`localhost:3000` ou URL de produção)
2. Abrir DevTools: `F12` (Windows) ou `Cmd+Option+I` (Mac)
3. Clicar na aba **Application**
4. No menu lateral, clicar em **Manifest**

### O que verificar

```
✓ App name:         Amigo do Prédio
✓ Short name:       Amigo do Prédio
✓ Start URL:        /
✓ Display:          standalone
✓ Background color: #f9f5ef
✓ Theme color:      #1f3147
✓ Icons:            4 entradas (192 any, 192 maskable, 512 any, 512 maskable)
```

Todos os ícones devem aparecer como thumbnails sem erro 404.

5. No menu lateral, clicar em **Service Workers**
   - "No service worker found" é esperado — o app não tem SW nesta fase. Isso é ok.

6. Verificar **Installability** (pode estar em Manifest ou como chip separado):
   - Deve mostrar "Page is installable" OU listar razões específicas por que não é
   - Razão aceitável: "No service worker found" (funcional mas sem offline)
   - Razão bloqueante: "No icons of sufficient size found" → indica que os ícones têm problema

### Resultado esperado

| Item | Esperado |
|------|----------|
| Manifest sem erros de parsing | ✓ |
| Ícone 192×192 sem 404 | ✓ |
| Ícone 512×512 sem 404 | ✓ |
| App name "Amigo do Prédio" | ✓ |
| display: standalone | ✓ |
| Installability: "installable" ou "OK exceto SW" | ✓ |

---

## 2. Chrome no Android

### Instalação

1. Abrir a URL do app no Chrome para Android
2. Aguardar 30 segundos de uso (Chrome leva um tempo antes de mostrar o banner)
3. Deve aparecer banner na parte inferior: **"Adicionar Amigo do Prédio à tela inicial"**
4. Tocar em **Adicionar** → confirmar
5. Procurar o ícone na tela inicial

### O que verificar

- [ ] Ícone aparece na tela inicial (não o ícone genérico do Chrome)
- [ ] Nome abaixo do ícone: "Amigo do Prédio" (não URL)
- [ ] Tocar no ícone abre o app em **modo standalone** (sem barra de endereço do Chrome)
- [ ] Status bar do Android tem cor navy (#1f3147)
- [ ] App abre diretamente na aba Início (start_url: "/")
- [ ] Navegar entre as 4 abas funciona normalmente

### Se o banner não aparecer

No Chrome para Android, ir em:
- Menu (3 pontos) → **Adicionar à tela inicial**
- Confirmar nome "Amigo do Prédio"

### Ícone maskable

No Android ≥ 8, ícones são exibidos dentro de formas (círculo, squircle) definidas pela launcher.
O ícone maskable garante que o conteúdo importante não seja cortado.

**Safe zone:** o prédio ocupa o centro do ícone — mesmo se cortado 20% nas bordas, o símbolo principal fica visível.

---

## 3. Safari no iOS (iPhone)

### Adicionando à tela inicial

1. Abrir o app no Safari
2. Tocar no botão **Compartilhar** (ícone de seta para cima)
3. Rolar e tocar em **Adicionar à Tela de Início**
4. Verificar o nome sugerido: "Amigo do Prédio"
5. Confirmar tocando em **Adicionar**

### O que verificar

- [ ] Ícone aparece na tela inicial (apple-touch-icon 180×180)
- [ ] Ícone tem aparência nítida no Retina display
- [ ] Nome: "Amigo do Prédio"
- [ ] Tocar no ícone abre em **modo standalone** (sem barra de endereço do Safari)
- [ ] Viewport correto — sem scroll horizontal
- [ ] Safe area insets respeitados (conteúdo não fica atrás do notch ou home indicator)
- [ ] Status bar do iOS tem cor adequada (default)
- [ ] Navegar entre 4 abas funciona normalmente

### Limitações do iOS/Safari (esperadas)

- iOS Safari não suporta Web Push Notifications em modo standalone (não é problema nesta fase)
- iOS Safari não exibe o banner de instalação automático — instalação sempre é manual via compartilhar
- Se fechar o app e reabrir, o estado (aba ativa) pode ser resetado (comportamento do iOS)

---

## 4. Checklist de resultado por plataforma

Preencher após os testes:

### Chrome/Edge Desktop

| Item | Status | Observação |
|------|--------|------------|
| Manifest sem erros | ☐ | |
| Ícones aparecem no DevTools | ☐ | |
| Installability ok | ☐ | |

### Android (Chrome)

| Item | Status | Observação |
|------|--------|------------|
| Banner de instalação aparece | ☐ | |
| Ícone na tela inicial ok | ☐ | |
| Abre em standalone | ☐ | |
| Status bar navy | ☐ | |
| Navegação entre abas ok | ☐ | |

### iOS (Safari)

| Item | Status | Observação |
|------|--------|------------|
| apple-touch-icon ok | ☐ | |
| Abre em standalone | ☐ | |
| Viewport sem overflow | ☐ | |
| Navegação entre abas ok | ☐ | |

---

## 5. Problemas conhecidos e soluções

### Ícone não aparece (404)

Verificar que os arquivos existem:
```
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/apple-touch-icon.png
```

Para regenerar: `node scripts/generate-icons.js`

### Ícone aparece mas é diferente do esperado

O design atual (gerado pelo script) mostra um prédio estilizado cream sobre fundo navy.
Para alterar o design: editar a função `generateIcon()` em `scripts/generate-icons.js` e rodar novamente.

### App não abre em standalone no Android

Verificar no DevTools que `display: "standalone"` está no manifest.
Se o app foi instalado antes da correção do manifest, desinstalar e reinstalar.

### App tem scroll horizontal no iOS

Verificar se algum componente tem `width > 100vw` ou `overflow-x: visible` sem intenção.

---

## 6. Notas para futura melhoria (pós-beta)

- **Service Worker:** Adicionar um SW básico permitiria acesso offline (ver Next.js `next-pwa` ou implementação manual). Não obrigatório para beta, mas melhora a experiência instalada.
- **Splash screen (iOS):** iOS pode mostrar uma splash screen baseada no apple-touch-icon e background-color do manifest. Não é configurável de forma elegante — deixar por padrão.
- **Notificações push:** Requer SW + permissão do usuário + backend. Fora do escopo desta fase.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 37)*
*Atualizar a tabela de resultado após cada rodada de testes em dispositivo físico.*
