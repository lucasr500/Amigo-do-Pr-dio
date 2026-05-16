# Resultado do Teste PWA — Fase 39
## Amigo do Prédio

> **Data:** 2026-05-16
> **Fase:** 39

---

## 1. Status do teste físico

**Teste em dispositivo físico NÃO foi realizado nesta fase.**

Este é um **bloqueador técnico confirmado** antes do convite para beta com síndicos reais.

---

## 2. Pré-condições técnicas (verificadas por código — Fases 36-37-38)

Todas as pré-condições técnicas para PWA estão em ordem:

| Item | Estado | Fase |
|------|--------|------|
| `app/manifest.ts` — 4 ícones | ✓ | Fase 36 |
| `public/icons/icon-192.png` | ✓ | Fase 36 |
| `public/icons/icon-512.png` | ✓ | Fase 36 |
| `public/icons/apple-touch-icon.png` | ✓ | Fase 36 |
| `app/layout.tsx` referencia apple-touch-icon | ✓ | Fase 36 |
| `app/favicon.ico` | ✓ | Fase 37 |
| `display: "standalone"` no manifest | ✓ | — |
| `theme_color: "#1f3147"` | ✓ | — |
| `background_color: "#f9f5ef"` | ✓ | — |
| `orientation: "portrait"` | ✓ | — |
| Service Worker | ✗ ausente (documentado, não bloqueador técnico) |

---

## 3. Checklist para execução pelo fundador

Use este checklist ao testar em dispositivo físico. Marcar `[x]` após confirmar.

### 3.1 Chrome/Edge Desktop (DevTools)

```
[ ] Abrir o app (localhost:3000 ou URL de produção)
[ ] DevTools (F12) → Application → Manifest
[ ] App name: "Amigo do Prédio"
[ ] Start URL: "/"
[ ] Display: standalone
[ ] Background color: #f9f5ef
[ ] Theme color: #1f3147
[ ] Icons: 4 entradas visíveis como thumbnails (sem 404)
[ ] Application → Installability → "installable" ou "OK exceto SW"
```

**Resultado esperado:** todos os itens ok. O aviso "No service worker" é aceitável.

### 3.2 Android — Chrome (dispositivo real)

```
[ ] Abrir URL de produção no Chrome para Android
[ ] Aguardar 30 segundos de uso (ou: menu ⋮ → Adicionar à tela inicial)
[ ] Confirmar nome "Amigo do Prédio" no diálogo de instalação
[ ] Ícone aparece na tela inicial (prédio cream sobre navy — não ícone genérico)
[ ] Nome abaixo do ícone: "Amigo do Prédio"
[ ] Tocar no ícone → abre em modo STANDALONE (sem barra de endereço do Chrome)
[ ] Status bar do Android: cor navy (#1f3147)
[ ] App abre na aba Início
[ ] Navegar entre as 4 abas: sem crash
[ ] LocalStorage funciona (fazer uma pergunta, fechar, reabrir → histórico aparece)
```

### 3.3 iOS — Safari (dispositivo real)

```
[ ] Abrir URL de produção no Safari
[ ] Botão Compartilhar (seta para cima) → "Adicionar à Tela de Início"
[ ] Verificar nome sugerido: "Amigo do Prédio"
[ ] Confirmar → ícone aparece na tela inicial
[ ] Ícone nítido no Retina display (usar apple-touch-icon 180×180)
[ ] Tocar no ícone → abre em modo STANDALONE (sem barra do Safari)
[ ] Viewport sem scroll horizontal
[ ] Safe area respeitada (conteúdo não atrás do notch ou home indicator)
[ ] Navegar entre as 4 abas: sem crash
```

---

## 4. Tabela de resultados (preencher após teste)

### Chrome/Edge Desktop

| Item | Status | Observação |
|------|--------|------------|
| Manifest sem erros | ☐ | |
| Ícones aparecem (sem 404) | ☐ | |
| Installability ok | ☐ | |

### Android (Chrome)

| Item | Status | Observação |
|------|--------|------------|
| Instalação ok | ☐ | |
| Ícone na tela inicial | ☐ | |
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

### Ícone 404 no DevTools

```bash
# Confirmar que os arquivos existem:
ls public/icons/
# Esperado: apple-touch-icon.png  icon-192.png  icon-512.png

# Se precisar regenerar:
node scripts/generate-icons.js
```

### Ícone genérico do Chrome (não o ícone do app)

Desinstalar o app, limpar cache do Chrome, reinstalar.

### App não abre em standalone no Android

Verificar no DevTools que `display: "standalone"` está no manifest.

### Scroll horizontal no iOS

Verificar se algum componente usa `width > 100vw`. Testar em viewport 375px.

### Banner de instalação não aparece no Chrome Android

Ir em: menu ⋮ → "Adicionar à tela inicial" (não esperar pelo banner automático).

---

## 6. Pendência confirmada

- [ ] Executar checklist 3.1, 3.2, 3.3 acima
- [ ] Preencher tabela da seção 4
- [ ] Se encontrar problema: documentar aqui e abrir correção
- [ ] Quando tudo verde: marcar como desbloqueado no checklist RC grupos 3 e 18

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 39) — pendente execução física*
