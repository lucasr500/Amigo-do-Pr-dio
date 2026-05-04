# Amigo do Prédio

Assistente virtual condominial focado em síndicos e conselheiros — MVP web mobile-first construído em Next.js + TypeScript + Tailwind CSS.

## 🚀 Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador. Para a melhor experiência, use o modo responsivo do DevTools em viewport de celular (375–428px).

## 📁 Estrutura

```
amigo-do-predio/
├── app/
│   ├── globals.css        # Estilos base, fontes, scrollbar, grain
│   ├── layout.tsx         # Layout raiz com fontes Fraunces + Inter Tight
│   └── page.tsx           # Página principal (orquestra estado da pergunta)
├── components/
│   ├── Header.tsx         # Logo + nome + indicador "online"
│   ├── Hero.tsx           # Frase principal e subtexto
│   ├── AskInput.tsx       # Input + botão "Perguntar" com loading
│   ├── QuickAccessCards.tsx  # Grid 2x3 de tópicos clicáveis
│   ├── Response.tsx       # Resposta com efeito typewriter + aviso
│   └── Footer.tsx         # Rodapé + CTA WhatsApp
└── lib/
    └── data.ts            # Tópicos, respostas simuladas, função findAnswer()
```

## 🎨 Design

- **Tipografia:** Fraunces (display, com itálico para acentos) + Inter Tight (corpo)
- **Paleta:** navy (confiança), sage (ação positiva), cream (clareza), navy-100 (neutralidade)
- **Tom:** SaaS moderno, mas humano e acessível — evita estética jurídica fria

## 🔌 Integração futura com API/RAG

A função `findAnswer()` em `lib/data.ts` é o ponto único de plug para troca pela chamada real:

```ts
// Em app/page.tsx, substituir:
const result = findAnswer(q);

// Por:
const res = await fetch("/api/ask", {
  method: "POST",
  body: JSON.stringify({ question: q }),
});
const { answer } = await res.json();
```

## ✅ Decisões de produto

- **Aviso jurídico discreto** após cada resposta — reduz risco e mantém a confiança
- **Cards preenchem o input** em vez de responder direto — usuário vê e pode editar a pergunta antes de enviar (educa o uso)
- **Efeito typewriter** simula a IA pensando — percepção de valor sem custo real
- **Limite de 440px** em desktop — mantém a sensação de produto mobile mesmo na web
