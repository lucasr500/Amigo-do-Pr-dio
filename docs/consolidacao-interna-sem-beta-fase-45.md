# Consolidação Interna — Sem Beta — Fase 46

> **Registro de premissa estratégica. Não alterar.**
> Documento criado em 2026-05-18 durante a sessão de maturação interna.

---

## Premissa fundamental

**NÃO serão feitos testes com síndicos por enquanto.**

Este documento registra formalmente que a fase atual de desenvolvimento segue uma estratégia de **lapidação interna silenciosa**. Nenhuma ação de exposição externa está autorizada, incluindo:

- Não convidar síndicos para testar
- Não fazer beta (fechado ou aberto)
- Não sugerir "validação externa"
- Não "colocar na mão de usuários reais"
- Não lançar para grupo pequeno
- Não mostrar para cliente
- Não fazer rodada beta

## Motivação

O produto ainda está em estágio de refinamento interno. Expor a síndicos antes de a experiência estar sólida gera:
- Impressão errada do produto
- Feedback sobre aspectos que já estamos corrigindo
- Comprometimento de relações que deveriam ser preservadas para o lançamento real

A maturidade interna é uma vantagem competitiva — o produto deve impressionar desde o primeiro uso real, sem iterações de "ainda estamos melhorando".

## O que foi feito nesta fase (Fase 46)

### MemoriaPanel — onboarding progressivo
- Seção "Essenciais" com 3 campos prioritários (AVCB, Seguro, Mandato)
- Indicador de progresso visual (dots preenchidos + contador "X/3")
- Collapsed state com subtítulos contextuais por nível de preenchimento (0 → 1-2 → 3 essenciais)
- Seção "Manutenções e rotinas" renomeada e colapsável
- Texto de introdução focado nas datas essenciais (não no formulário genérico)
- Abertura inteligente: ao clicar collapsed, foca nos essenciais se incompletos; abre manutenções se essenciais prontos

### Response — ação antes de explicação
- "Próximo passo" movido para o topo do card de contexto (antes da base legal)
- "Próximo passo" agora aparece sempre quando disponível para a categoria (removida a condição `!entry.dica`)
- Maior destaque visual: `border-navy-500` e `bg-navy-100/40` (antes: `border-navy-300`, `bg-navy-50/50`)
- Ordem final: Próximo passo → Base legal → Dica prática → Veja também → CTAs → Disclaimer

## O que NÃO foi implementado (deliberadamente)

- IA / RAG / embeddings / backend / login / billing / WhatsApp
- PDF / upload / OCR / leitura de demonstrativo
- Nova ferramenta financeira / módulo financeiro / ERP / calendário complexo / nova aba
- Expansão em massa da KB ou reescrita do motor
- Mudanças de schema destrutivas
- Novas dependências externas

## Critérios de congelamento financeiro

As ferramentas SimuladorReajusteCota e SimuladorMulta estão congeladas:
- Nenhuma funcionalidade nova
- Disclaimers existentes são suficientes
- Qualquer expansão financeira aguarda validação real de uso

## Estado técnico após esta fase

- TypeScript: zero erros (verificado via `npx tsc --noEmit`)
- Build: Compiled successfully
- Bundle: ≤ 230 kB (margem mantida — nenhuma dependência adicionada)
- Nenhuma quebra de compatibilidade com localStorage ou backup existente

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-18 (Fase 46)*
