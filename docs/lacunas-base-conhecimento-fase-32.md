# Lacunas da Base de Conhecimento — Fase 32

> Auditoria de conteúdo realizada em 2026-05-13.
> Prioridade: Alta = impacta diretamente a confiança do síndico. Média = melhora precisão. Baixa = edge case raro.

---

## Lacunas resolvidas nesta fase

| ID | Tema | Status |
|---|---|---|
| `advertencia-antes-multar` | Quantas advertências antes de multar | ✅ Adicionado |
| `voto-desempate-sindico` | Voto de desempate do síndico em empate | ✅ Adicionado |
| `registro-infracao-procedimento` | Como documentar formalmente uma infração | ✅ Adicionado |
| `locacao-temporada-airbnb` | Proibição de Airbnb / locação por temporada | ✅ Adicionado |

### Correções de keywords

- `conflito-interesses-sindico`: keywords eram frases → corrigido para tokens individuais
- `multa-antissocial-reiteracao`: idem

---

## Lacunas pendentes — Alta prioridade

### 1. Uso de câmeras de segurança / LGPD
**Pergunta típica:** "Posso instalar câmera na garagem sem avisar os moradores?"
**Por que importa:** LGPD obriga aviso. Síndicos instalam câmeras sem comunicar e ficam expostos.
**Entrada sugerida:** `cameras-lgpd-aviso` — categoria: `seguranca`

### 2. Obras emergenciais sem aprovação em assembleia
**Pergunta típica:** "Preciso de obra urgente no encanamento. Posso contratar sem assembleia?"
**Por que importa:** Síndicos têm medo de agir e deixam problemas piorarem.
**Entrada sugerida:** `obra-emergencial-sem-assembleia` — categoria: `obras`

### 3. Subsíndico: poderes e limites
**Pergunta típica:** "O subsíndico pode assinar contratos se o síndico estiver viajando?"
**Por que importa:** Ausência de clareza gera conflito entre subsíndico e conselho.
**Entrada sugerida:** `subsindico-poderes-limites` — categoria: `administracao`

### 4. Mudança de horário de silêncio sem alterar convenção
**Pergunta típica:** "Posso mudar o horário de silêncio por deliberação em assembleia ou preciso alterar a convenção?"
**Por que importa:** Pergunta frequente; confusão entre regimento e convenção.
**Entrada sugerida:** `horario-silencio-alteracao` — categoria: `convivencia`

### 5. Funcionário CLT que mora no prédio — obrigações e conflitos
**Pergunta típica:** "O zelador mora no prédio. E se eu precisar demiti-lo? Ele tem que sair do apartamento?"
**Por que importa:** Alta frequência de dúvida; consequências trabalhistas e habitacionais simultâneas.
**Entrada sugerida:** `funcionario-mora-no-predio-demissao` — categoria: `trabalhista`

---

## Lacunas pendentes — Média prioridade

| Tema | Pergunta típica | Categoria |
|---|---|---|
| Garagem: vaga de visitante cedida para morador | "Posso usar a vaga de visitante de forma permanente?" | `areas-comuns` |
| Fundo de obras: como constituir | "Quanto guardar no fundo de obras?" | `financas` |
| Sindico pessoa jurídica | "Posso ser síndico pela minha empresa?" | `administracao` |
| Alteração fachada: regras | "Morador quer trocar janela — precisa de aprovação?" | `obras` |
| Taxa de mudança: como cobrar | "Pode cobrar taxa por mudança? Qual o limite legal?" | `areas-comuns` |

---

## Observações sobre o motor

- Entradas com **frases como keywords** (ex: "contratar empresa familiar") precisam ser tokenizadas para funcionar corretamente — o motor faz `keywords.join(" ")` antes de normalizar.
- Categorias `locacao` e `assembleias` precisavam de âncoras adicionais (adicionadas na Fase 32 em `CATEGORY_ANCHORS`).
- `DOMAIN_ANCHOR_WORDS` expandido com: airbnb, temporada, hospedagem, desempate, empate, infracao, documentar, registrar.

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-13 (Fase 32)*
