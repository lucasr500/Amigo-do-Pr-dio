# Pergunte ao Prédio — Visão & Requisitos (esboço)

**Autor:** Cowork (lane de produto) · **Data:** 2026-06-18 · **Status:** esboço leve de visão/requisitos — **não** arquitetura técnica ainda (decisão do Lucas). Serve para sabermos o que estamos construindo quando a hora chegar.
**Sequência:** depende da camada relacional (dados estruturados por condomínio). Corretamente **adiado** até Mural/Canal/Enquetes/Agenda/Documentos estarem relacionais. O seam role-aware já existe em `predio-context.ts` (IA off).

---

## 1. Em uma frase
Perguntar, em linguagem natural, **sobre os dados deste prédio** — e receber uma resposta **com a fonte**. Não é um chatbot jurídico genérico (isso o motor determinístico atual já faz); é a inteligência sobre a memória, as decisões e a vida do **seu** condomínio.

## 2. Por que é o gap nº1
É o adjetivo que separa "rede social do condomínio" de "rede social **inteligente** do condomínio". Hoje é promessa sem lastro: o assistente responde direito condominial genérico, não sabe nada *deste* prédio. É a maior oportunidade da Tese — e só vira real sobre dados relacionais.

## 3. O que deve responder (por persona)
- **Síndico:** "Quando foi a última dedetização?" · "O que já decidimos sobre Airbnb?" · "Quais contratos vencem nos próximos 60 dias?" · "Resuma a última assembleia."
- **Conselho:** "Quais decisões de risco alto este ano?" · "Como está a prestação de contas vs. o combinado?"
- **Morador:** "Posso reservar o salão dia 20?" · "Qual a regra de barulho?" · "O que foi decidido sobre a fachada?"

## 4. Fontes (os dados relacionais que estamos construindo)
Decisões · Mural/Comunicados · Assembleias e pautas · Agenda/eventos · Documentos · Solicitações (Canal) · Enquetes. Quanto mais entidades relacionais, mais a IA tem o que responder — por isso a fundação vem primeiro.

## 5. Princípios inegociáveis
1. **Sempre citar a fonte.** Toda resposta aponta o documento/decisão/post de onde veio. Sem fonte, não responde.
2. **Nunca inventar.** Se não está nos dados do prédio, a resposta é "não há registro disso" — não um palpite. Anti-alucinação é requisito, não enfeite.
3. **Respeitar papel × visibilidade na RECUPERAÇÃO.** A IA não pode responder ao morador o que a RLS esconderia dele. A busca roda **sob o papel do usuário** — não basta filtrar no prompt; o dado sensível nem entra no contexto. (É a mesma regra que provamos no banco; a IA herda, não burla.)
4. **Separar fato do prédio de aconselhamento jurídico.** Dado factual ("a decisão X foi tomada em DD/MM") ≠ orientação jurídica genérica (mantém o disclaimer atual).

## 6. Requisitos técnicos de alto nível (sem fechar arquitetura)
- **RAG sobre os dados relacionais por condomínio**: recuperar os trechos relevantes e deixar o LLM redigir a resposta com citação.
- **Recuperação gateada por RLS/papel**: o índice/busca respeita o `condominio_id` e a visibilidade do papel do usuário.
- **LLM externo** atrás da flag `ai_layer_enabled` (hoje off). Custo e latência controlados.
- **Storage**: documentos/anexos precisam estar acessíveis e indexáveis (decisão de Storage pendente).

## 7. Limites e riscos a vigiar
- **Vazamento por papel** (o pior): se a recuperação não herdar a RLS, a IA vira um buraco que expõe o que a UI esconde. Mitigação: busca sob o papel, não filtro pós-hoc.
- **Alucinação**: mitigada por "só responde com fonte".
- **Custo/latência**: LLM externo por consulta — definir orçamento e cache.
- **Expectativa**: prometer menos e acertar. Começar com perguntas factuais sobre dados, não "conselhos".

## 8. Métrica de sucesso (quando construir)
% de perguntas respondidas com a fonte correta · **zero vazamento de papel** (inegociável) · tempo até resposta · satisfação por persona.

## 9. Decisão do Lucas
Este é o esboço de visão/requisitos que você pediu. Quando a camada relacional amadurecer, eu evoluo isto para o desenho técnico do seam (RAG + recuperação gateada), em coordenação com o Claude Code.
