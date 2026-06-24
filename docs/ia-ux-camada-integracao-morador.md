# Arquitetura de Informação & UX — Camada de Integração (morador-facing)

**Autor:** Cowork (lane de produto/UX, em paralelo ao código) · **Data:** 2026-06-18
**Princípio Apple-like:** denso, seguro e estruturado por dentro; limpo, fácil, bonito e quase óbvio por fora.
**Escopo:** como Mural, Canal, Enquetes, Agenda e a assembleia se apresentam ao **morador**. Não é código — é o desenho que guia os sprints relacionais (Mural já em execução; Canal e Enquetes na fila).

---

## 1. A frase que governa tudo

O morador **não quer "um app de condomínio".** Ele quer responder três perguntas, rápido:

1. **O que está acontecendo no meu prédio?** (informar)
2. **O que eu preciso dizer, pedir ou resolver?** (participar)
3. **O que já foi decidido — e o que vem aí?** (memória + futuro)

Toda superfície, card e botão serve a uma dessas três perguntas, **ou é cortado.** É o filtro de simplicidade. Densidade por dentro (RLS, natureza, papéis, relacional) é invisível; por fora, só as três perguntas.

---

## 2. Três perguntas → três jobs → mínimo de superfícies

| Pergunta do morador | Job | Superfície | Verbo |
|---|---|---|---|
| O que está acontecendo? | Informar-se sem esforço | **Início** (digest) + **Mural** | ler |
| O que preciso dizer/resolver? | Levantar uma questão e vê-la andar | **Canal** + **Enquetes** | agir/opinar |
| O que já foi decidido / vem aí? | Confiar e antecipar | **Agenda** (com a assembleia-herói) | acompanhar |

Cinco superfícies, não doze. A navegação do morador (`Início · Mural · [+] · Agenda · Info`) já está perto disso — o `[+]` central deve ser **"Levantar uma questão"** (o Canal), porque é o verbo mais importante do morador.

---

## 3. Início do morador — o digest, não um cockpit

A Home do morador responde "o que importa agora" em **uma rolagem**, em ordem de urgência decrescente:

1. **Evento-herói** (se houver): a próxima assembleia ou evento crítico — card grande, data, "prepare-se / opine antes".
2. **Comunicado oficial fixado** (se houver): selo OFICIAL inconfundível.
3. **A sua questão em andamento**: status da solicitação que *você* abriu (ver §6) — fecha o loop pessoal.
4. **Enquete aberta**: "sua voz antes da assembleia" — 1 toque para votar.
5. **Do mural, o que é novo**: 2–3 itens recentes, com selo de natureza.

Sem números de gestão, sem inadimplência, sem cockpit. Se não há nada urgente, o estado vazio é acolhedor e aponta para "explorar o mural" — nunca uma tela morta.

---

## 4. Sistema visual de natureza (o coração da confiança)

A separação **opinião ≠ comunicado oficial ≠ deliberação** (já em `content-nature.ts`) tem de ser **óbvia no primeiro olhar** — é a blindagem jurídica virada design:

- **Oficial** (gestão): selo sólido, cor institucional (azul petróleo), ícone de "selo/carimbo". Peso visual máximo. "Isto é o condomínio falando."
- **Deliberação** (assembleia): selo de "ata/decisão", visual de registro formal, com data e vínculo à pauta. "Isto está decidido e registrado."
- **Opinião** (morador): visual mais leve, avatar do autor em destaque, **rótulo explícito "opinião de morador"**. "Isto é a voz de um vizinho, não a posição do prédio."

Regra de ouro: o morador **nunca** confunde um desabafo de vizinho com um comunicado oficial. A hierarquia visual carrega a responsabilidade jurídica.

---

## 5. Mural — informar sem ruído

O Mural é leitura, não arena. Design:

- **Topo:** oficial e fixados primeiro (peso visual), depois o fluxo por recência.
- **Cada card:** selo de natureza + título + 2 linhas + autoria. Toque abre o detalhe.
- **Opinião de morador** vive no mural, mas **subordinada** ao oficial — e sujeita à moderação (reativa no geral; prévia em temas sensíveis, conforme a spec de moderação).
- **Anti-padrão a evitar:** virar "feed infinito de reclamação". O mural privilegia o que é do prédio (oficial, eventos, decisões); a catarse individual tem menos palco que a informação útil.

---

## 6. Canal — o verbo central do morador: levantar uma questão

Esta é a superfície mais importante da integração. O morador **levanta uma questão e a vê andar** — é o que reduz ruído e briga, porque dá um caminho legítimo em vez do grupo de WhatsApp.

Fluxo, com **status visível e honesto** (o "rastreamento de encomenda" da questão):

```
Recebido  →  Em análise (síndico)  →  Virou ordem de serviço  →  Em execução  →  Resolvido
                                   ↘  Respondido / arquivado (com justificativa)
```

- **Abrir é 1 toque + 2 campos** (o quê + onde). Categoria opcional. Anexo de foto, opcional.
- **O status é a alma:** o morador sempre sabe onde sua questão está. "Resolvido" e "arquivado com justificativa" são ambos respeitosos — o pecado é o silêncio.
- **Liga direto ao papel funcionário/zelador:** quando vira ordem, o funcionário executa e comprova; o morador vê "resolvido" com a comprovação. O loop inteiro `morador → síndico → funcionário → morador` fecha numa tela.
- **Privacidade:** solicitação pode ser privada (só gestão vê) ou pública (vizinhos veem) — **padrão privado** (seguro), o morador escolhe tornar pública.

---

## 7. Enquetes — sua voz antes da assembleia

Não é votação vinculante (isso é a assembleia formal). É **consulta consultiva** amarrada a uma pauta futura:

- Card simples: pergunta + opções + "sua voz ajuda a preparar a assembleia de ⟦data⟧".
- Resultado agregado e visível (transparência), **sem expor o voto individual**.
- É o mecanismo que faz a assembleia chegar "mastigada": as pessoas já se posicionaram, o ruído caiu, quem discorda já sabe que discorda **antes** da reunião.

---

## 8. Agenda — calendário compartilhado, assembleia como herói

- **A assembleia é o evento-herói**: maior, destacado, com contagem regressiva e atalhos ("ver pauta", "opinar na enquete", "ler convocação").
- **Eventos do prédio** compartilhados por papel (manutenções, prazos relevantes ao morador) — sem os vencimentos puramente financeiros (território da administradora).
- **Reservas de áreas comuns**: a peça que **só** funciona relacional — o morador reserva o salão, todos veem a disponibilidade. É integração concreta e cotidiana.

---

## 9. Progressive disclosure (adaptativo por maturidade)

Coerente com o objetivo de densidade adaptativa: um prédio recém-chegado vê **pouco e acolhedor**; conforme acumula comunicados, decisões e moradores ativos, a Home revela mais. Nunca despejar doze cards num condomínio que ainda não tem três. O app **cresce com o uso**, não assusta na entrada.

---

## 10. Cold-start: não morrer com a tela vazia

O assassino de rede social de condomínio é o feed vazio. Mitigação por design (e já é a sua estratégia de sequenciamento):

1. **O síndico/memória semeiam primeiro** — quando o morador chega, já há comunicados, decisões e a próxima assembleia. Substância antes da rede.
2. **A primeira experiência do morador é receber valor** (ver o que foi decidido, a data da assembleia), não "poste algo".
3. **O Canal dá um motivo imediato e individual** para voltar: "abri uma questão, quero ver se andou."

---

## 11. Anti-padrões a evitar (a coragem de cortar)

- Cockpit de gestão na cara do morador (números, inadimplência, financeiro). **Não.**
- Feed genérico de catarse sem governança. **Não** — o oficial e o útil têm primazia.
- Doze entradas de menu. **Cinco superfícies, três perguntas.**
- Confundir opinião com oficial. **Nunca** — o sistema de natureza impede.
- Pedir engajamento antes de entregar valor. O morador recebe primeiro, contribui depois.

---

## 12. Decisões que dependem de você
1. O botão central `[+]` da navegação do morador = "Levantar uma questão" (Canal)? (recomendo sim — é o verbo central).
2. Solicitação do Canal nasce **privada** por padrão (recomendo) ou pública?
3. Quanto da Home do morador é "digest automático" vs. "mural puro" — confirmo o digest da §3 como direção?
4. Reservas: entram junto com a Agenda relacional ou como fatia própria?
