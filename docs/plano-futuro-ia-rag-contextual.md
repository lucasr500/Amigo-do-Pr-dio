> ⚠️ **SUPERSEDED (2026-06-14).** Consolidado em **`docs/ia-assistente.md`** (fonte única sobre IA no Assistente). Mantido apenas como histórico — não reflete mais a direção atual.

# Plano Futuro — IA/RAG Contextual

Documento de preparação. A Fase 64 não implementa IA, RAG, API externa, backend, login ou novo armazenamento remoto.

## Princípio

O objetivo agora é tornar o produto essencial sem IA; a IA futura ampliará profundidade, não substituirá o produto.

## O que a IA não substitui

- **GuidancePanel:** continua sendo a camada operacional de prazos, vencimentos e cuidados recorrentes do prédio.
- **MemoriaOperacional:** continua sendo a fonte local de datas e contexto do condomínio.
- **Próximos Passos:** continuam sendo a camada de acompanhamento do que precisa ser feito e do que foi resolvido.
- **Base determinística:** continua sendo o núcleo confiável para respostas cobertas pela KB.

## Onde a IA entraria

A primeira entrada aceitável seria como fallback melhorado quando o motor determinístico não encontra resposta suficiente.

Esse fallback deve:

- responder ancorado na KB;
- indicar quando a base não cobre o caso;
- usar dados locais do prédio com cuidado e apenas quando forem relevantes;
- respeitar os disclaimers jurídicos já existentes;
- preservar a distinção entre orientação operacional e análise jurídica específica.

## Limites obrigatórios

A IA não deve:

- inventar jurisprudência;
- inventar valores de CCT, convenção ou regimento;
- afirmar regras municipais ou estaduais específicas sem fonte;
- usar texto livre do usuário em telemetria;
- expor dados do condomínio;
- substituir decisões que dependem de administradora, contador, engenheiro, assessoria jurídica ou profissional responsável.

## Critérios para ativação futura

Antes de qualquer ativação de IA/RAG, estes pontos precisam estar resolvidos:

1. Supabase ativo e validado.
2. Dados reais de fallback suficientes para justificar a camada.
3. Fallback relevante acima de um patamar definido internamente.
4. Backend seguro para proteger API key e aplicar limites de uso.
5. Política de privacidade revisada para uso de IA.
6. Custo mensal estimado compatível com a operação.

## Direção técnica esperada

- IA como camada posterior ao match determinístico.
- RAG restrito à KB curada e documentos internos aprovados.
- Contexto local reduzido a metadados necessários, sem envio amplo de memória operacional.
- Logs estruturais e privacy-safe, sem pergunta bruta quando houver telemetria remota.
- Resposta final sempre com linguagem de orientação, não de decisão jurídica definitiva.
