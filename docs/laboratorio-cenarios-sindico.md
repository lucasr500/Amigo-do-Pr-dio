# Laboratório de Cenários do Síndico

> **Documento interno — Fase 43**
> 50+ cenários simulados de síndicos reais, organizados por categoria.
> Uso: calibrar respostas do Assistente, priorizar a KB, identificar lacunas de cobertura.

---

## Como usar este laboratório

Cada cenário tem:
- **Situação** — o que o síndico está vivendo
- **Tensão/urgência** — o que torna essa situação crítica
- **Risco principal** — o que pode dar errado sem orientação
- **Resposta esperada** — o que o Assistente deve entregar
- **Ferramenta relacionada** — ponte para Ferramentas quando existe
- **Resposta ruim** — o que NUNCA deve acontecer
- **Critérios de avaliação** — como medir se o produto ajudou

---

## Categoria 1 — Multas e Advertências

### C01 — Barulho recorrente de madrugada
**Situação:** Morador do 5º andar ouve música alta do 3º toda sexta à noite. Já reclamou pessoalmente, sem resultado.
**Tensão:** Outros moradores estão ameaçando processar o condomínio por omissão.
**Risco:** Multar sem base documental pode ser contestada em assembleia; não multar é omissão.
**Resposta esperada:** Explicar sequência correta (advertência → multa), embasamento legal (Lei 4.591/64 + convenção), quórum necessário e prazo de notificação.
**Ferramenta:** ComunicadoPanel — "Gerar notificação de infração".
**Resposta ruim:** "Você pode proibir música." (afirmação absoluta sem base na convenção).
**Critérios:** Resposta inclui sequência clara, menciona necessidade de documentação prévia, não promete resultado judicial.

---

### C02 — Multa aplicada sem ata de autorização
**Situação:** Síndico aplicou multa diretamente sem assembléia prévia. Morador multado questionou a legalidade.
**Tensão:** Morador ameaça contestar em juízo.
**Risco:** Multa pode ser nula se a convenção exige autorização assemblear.
**Resposta esperada:** Explicar que multa por infração do regimento geralmente é competência do síndico; multa por condutas não previstas exige assembleia. Orientar a verificar o que a convenção diz.
**Ferramenta:** Nenhuma direta — orientação jurídica.
**Resposta ruim:** "A multa é ilegal." (sem verificar o que diz a convenção do caso concreto).
**Critérios:** Resposta distingue multa por infração prevista versus não prevista. Recomenda verificar convenção.

---

### C03 — Morador infrator habitual (contumaz)
**Situação:** Mesma família já recebeu 3 notificações por perturbação. Qual é o teto de multa?
**Tensão:** Outros moradores exigem atitude mais dura.
**Risco:** Aplicar multa acima do limite legal invalida o procedimento.
**Resposta esperada:** Art. 1.337 CC — condômino contumaz pode ser multado em até 10x a contribuição. Explica que depende de deliberação de 3/4 dos condôminos.
**Ferramenta:** ComunicadoPanel — notificação com histórico de ocorrências.
**Resposta ruim:** "Pode expulsar o morador." (impossível juridicamente).
**Critérios:** Menciona art. 1.337, cita quórum de 3/4, não sugere medidas impossíveis.

---

## Categoria 2 — Obras em Unidades

### C04 — Reforma sem ART/RRT
**Situação:** Morador está fazendo obra estrutural no apartamento. Não apresentou ART do engenheiro.
**Tensão:** Síndico viu obra envolvendo pilar. Estrutura pode estar comprometida.
**Risco:** Dano estrutural ao prédio, responsabilidade civil do síndico por omissão.
**Resposta esperada:** Síndico pode e deve exigir ART/RRT para obras estruturais. Pode embargar a obra até a documentação ser apresentada. Base: convenção + Código de Obras municipal.
**Ferramenta:** ComunicadoPanel — comunicado de embargo preventivo.
**Resposta ruim:** "Não interfira, é propriedade privada dele." (ignora responsabilidade coletiva).
**Critérios:** Menciona ART/RRT, embargo preventivo, diferencia reforma estética de estrutural.

---

### C05 — Obra em horário proibido (domingo de manhã)
**Situação:** Vizinho faz obra de cerâmica aos domingos às 8h. Convenção proíbe obras aos domingos.
**Tensão:** Reunião de família no apartamento ao lado, reclamações no grupo do WhatsApp.
**Risco:** Aplicar multa sem seguir rito (advertência → notificação → multa) pode ser contestada.
**Resposta esperada:** Confirmar que a convenção prevalece sobre preferência pessoal. Orientar advertência formal com base no horário proibido. Registrar data, hora e testemunhas.
**Ferramenta:** ComunicadoPanel — notificação de infração por horário.
**Resposta ruim:** "Ligue para a polícia." (medida desproporcional para o primeiro episódio).
**Critérios:** Orienta rito correto, menciona documentação do ocorrido, não exagera nas medidas iniciais.

---

### C06 — Morador quer instalar ar-condicionado na fachada
**Situação:** Morador quer instalar split externo visível na fachada. Pede autorização por escrito.
**Tensão:** Outros moradores fizeram isso anos atrás sem pedir. Agora há inconsistência visual.
**Risco:** Negar sem base pode gerar ação judicial. Permitir pode criar precedente difícil de reverter.
**Resposta esperada:** Fachada é área comum. Alteração exige autorização do condomínio (assembléia ou síndico, depende da convenção). Solução: padronizar localização e cor para todos.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Pode instalar onde quiser, é apartamento dele." (fachada é área comum).
**Critérios:** Resposta distingue interior da unidade (privado) versus fachada (área comum). Sugere padronização.

---

## Categoria 3 — Assembleias

### C07 — Convocação com prazo curto demais
**Situação:** Síndico convocou assembleia com apenas 5 dias de antecedência. Morador quer contestar a validade.
**Tensão:** Deliberação aprovada na assembleia pode ser anulada.
**Risco:** Anulação de assembleia, retrabalho, desgaste político.
**Resposta esperada:** Verificar o que a convenção diz. Se ela exige mais dias, a assembleia pode ser impugnada. Se não há prazo na convenção, o Código Civil não define prazo mínimo específico — recomenda-se ao menos 10 dias.
**Ferramenta:** ChecklistPanel — checklist de assembleia.
**Resposta ruim:** "Assembleia é inválida." (sem verificar o que a convenção diz).
**Critérios:** Diferencia prazo legal de prazo convencional. Recomenda verificar a convenção. Não afirma invalidade sem mais informações.

---

### C08 — Votação em assembleia via WhatsApp
**Situação:** Assembleia foi feita por WhatsApp durante a pandemia. Morador questiona se foi válida.
**Tensão:** Decisão importante (aprovação de obra cara) foi tomada virtualmente.
**Risco:** Decisão pode ser contestada se não houver base legal ou convencional para votação remota.
**Resposta esperada:** Lei 14.010/2020 (RJET) permitiu assembleias virtuais durante a pandemia. Fora desse contexto, validade depende de previsão na convenção. Recomendar ratificação presencial se houver dúvida.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Toda assembleia virtual é inválida." (ignora a legislação pandêmica e avanços recentes).
**Critérios:** Menciona contexto da pandemia, diferencia período excepcional do atual, recomenda verificar convenção.

---

### C09 — Empate em votação
**Situação:** Obra de reforma do salão ficou empatada 15 a 15 na assembleia. Síndico não sabe o que fazer.
**Tensão:** Moradores pró-obra estão pressionando o síndico a decidir sozinho.
**Risco:** Decisão unilateral do síndico pode ser contestada.
**Resposta esperada:** Verificar o que a convenção diz sobre empate. Na ausência de previsão, o presidente da assembleia (geralmente o síndico) tem o voto de Minerva. Recomendar registrar em ata o critério usado.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "O síndico decide sozinho." (sem mencionar que depende da convenção).
**Critérios:** Menciona voto de Minerva, diferencia previsão convencional de ausência dela, orienta sobre registro em ata.

---

## Categoria 4 — Inadimplência

### C10 — Condômino deve 6 meses, quer parcelar informalmente
**Situação:** Morador deve 6 meses de condomínio. Propôs pagar em parcelas por fora, sem acordo formal.
**Tensão:** Síndico quer resolver sem processo judicial. Caixa do condomínio está apertado.
**Risco:** Acordo informal sem ata ou instrumento escrito não tem força jurídica; abre precedente.
**Resposta esperada:** Acordo de parcelamento é permitido, mas deve ser formalizado em ata de assembleia ou instrumento escrito assinado (promissória, confissão de dívida). Síndico não pode quitar dívida sem respaldo.
**Ferramenta:** ComunicadoPanel — notificação de cobrança.
**Resposta ruim:** "Não aceite parcelas. Só judicial." (extremo desnecessário para primeiro acordo).
**Critérios:** Valida parcelamento, exige formalização, menciona necessidade de aprovação (dependendo da convenção).

---

### C11 — Devedor quer votar em assembleia
**Situação:** Morador inadimplente quer participar da votação da assembleia ordinária.
**Tensão:** Voto dele pode ser decisivo na deliberação sobre taxas.
**Risco:** Deixar inadimplente votar pode dar base para contestação do resultado.
**Resposta esperada:** Art. 1.335, III do CC — condômino inadimplente não tem direito a voto. Pode participar como ouvinte. Síndico deve registrar em ata que o morador estava inadimplente e não votou.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Deixe ele votar para não criar problema." (contraria o Código Civil).
**Critérios:** Cita art. 1.335, diferencia participação de votação, orienta registro em ata.

---

### C12 — Negativação no SPC/Serasa
**Situação:** Síndico quer negativar condômino que deve há 1 ano. Administradora disse que não pode.
**Tensão:** Caixa comprometido, outros condôminos cobram atitude.
**Risco:** Negativar sem respaldo pode gerar ação por danos morais.
**Resposta esperada:** Negativação de condomínio no SPC/Serasa é tecnicamente possível em alguns estados, mas exige análise jurídica local. Caminho mais seguro: protesto em cartório ou execução judicial. Recomendar consultar a assessoria jurídica do condomínio.
**Ferramenta:** ComunicadoPanel — notificação formal como passo anterior ao protesto.
**Resposta ruim:** "Pode negativar diretamente." (sem ressalvar complexidade jurídica).
**Critérios:** Não afirma que negativação é garantida, menciona protesto como alternativa, recomenda assessoria jurídica.

---

## Categoria 5 — Funcionários

### C13 — Porteiro faltou sem avisar e não apresentou atestado
**Situação:** Porteiro não apareceu segunda-feira, não avisou. Apareceu terça dizendo que estava doente, mas sem atestado médico.
**Tensão:** Condomínio ficou sem portaria. Síndico precisa decidir se desconta o dia.
**Risco:** Desconto indevido pode gerar reclamação trabalhista.
**Resposta esperada:** Falta sem justificativa pode ser descontada do salário e registrada na ficha. Atestado médico até 2 dias geralmente é aceito sem desconto (verificar CCT). Falta injustificada repetida pode gerar justa causa após procedimento adequado.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Demita por justa causa." (sem verificar histórico e procedimento adequado).
**Critérios:** Menciona CCT, diferencia falta com/sem atestado, não recomenda justa causa imediata.

---

### C14 — Zelador pede para trabalhar como PJ
**Situação:** Zelador propõe trabalhar como "prestador de serviço" (PJ) para economizar encargos.
**Tensão:** Condomínio veria redução imediata de custos.
**Risco:** Pejotização de vínculo real configura fraude trabalhista — risco de ação judicial pesado.
**Resposta esperada:** Se há pessoalidade, continuidade, subordinação e onerosidade, há vínculo empregatício independente do contrato. Pejotização pode gerar multas e passivo trabalhista alto. Não recomendado.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Pode contratar como PJ tranquilamente." (omite risco trabalhista sério).
**Critérios:** Explica os 4 elementos do vínculo (pessoalidade, não-eventualidade, subordinação, onerosidade). Alerta sobre risco.

---

### C15 — Funcionário de empresa terceirizada causou dano
**Situação:** Funcionário da empresa de limpeza quebrou vidro de porta de apartamento durante o serviço.
**Tensão:** Morador cobra o condomínio. Empresa terceirizada nega responsabilidade.
**Risco:** Condomínio pode ser responsabilizado solidariamente se não acionar a empresa corretamente.
**Tensão:** Conflito entre condomínio, empresa e morador.
**Resposta esperada:** Responsabilidade primária é da empresa terceirizada (empregador do funcionário). Condomínio pode ter responsabilidade subsidiária. Acionar formalmente a empresa por escrito, registrar o incidente. Verificar contrato de prestação de serviços.
**Ferramenta:** ComunicadoPanel — comunicado interno para registro.
**Resposta ruim:** "O condomínio não tem nada a ver." (omite possibilidade de responsabilidade subsidiária).
**Critérios:** Diferencia responsabilidade principal e subsidiária, orienta notificação formal da empresa.

---

## Categoria 6 — Convenção e Regimento

### C16 — Proibição de pets na convenção antiga
**Situação:** Convenção de 1990 proíbe animais no condomínio. Morador trouxe cachorro pequeno.
**Tensão:** Outros moradores cobram que a regra seja aplicada. Alguns são a favor dos pets.
**Risco:** Convenção antiga pode colidir com entendimento jurídico recente.
**Resposta esperada:** STJ tem entendimento de que proibição absoluta de animais (especialmente de pequeno porte, inofensivos e que não perturbam) pode ser desproporcional. Síndico deve aplicar com cautela, verificar se há perturbação real e considerar atualizar a convenção.
**Ferramenta:** ChecklistPanel — processo de atualização de convenção.
**Resposta ruim:** "A convenção é absoluta, pode expulsar o animal." (ignora jurisprudência recente do STJ).
**Critérios:** Menciona entendimento do STJ sobre pets, sugere atualização da convenção, não recomenda aplicação mecânica da regra antiga.

---

### C17 — Morador quer modificar área de uso exclusivo (terraço)
**Situação:** Cobertura tem terraço de uso exclusivo do último andar. Morador quer fechar e incorporar ao apartamento.
**Tensão:** Área de uso exclusivo versus propriedade do condomínio.
**Risco:** Incorporação de área comum (ainda que de uso exclusivo) sem autorização é irregular.
**Resposta esperada:** Área de uso exclusivo pertence ao condomínio (é área comum de uso privativo). Qualquer fechamento ou incorporação permanente exige aprovação em assembleia com quórum qualificado e pode exigir alteração de convenção. Além disso, pode precisar de aprovação municipal.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "É a cobertura dele, pode fazer o que quiser." (confunde uso exclusivo com propriedade privada).
**Critérios:** Distingue uso exclusivo de propriedade, menciona quórum qualificado, cita necessidade de aprovação municipal.

---

## Categoria 7 — Locação e Inquilinos

### C18 — Inquilino faz barulho, proprietário some
**Situação:** Inquilino do 4º andar perturba vizinhos toda semana. Síndico não consegue falar com o proprietário.
**Tensão:** Moradores reclamam que o síndico não faz nada.
**Risco:** Multar o inquilino (e não o proprietário) pode ser tecnicamente incorreto.
**Resposta esperada:** A multa condominial recai sobre o condômino (proprietário), mesmo que o infrator seja o inquilino. O proprietário é responsável pelos atos do locatário perante o condomínio. Notificar o proprietário formalmente, documentando as ocorrências.
**Ferramenta:** ComunicadoPanel — notificação ao condômino (proprietário).
**Resposta ruim:** "Notifique diretamente o inquilino." (sem orientar sobre quem é o responsável legal).
**Critérios:** Diferencia obrigação do proprietário versus ato do inquilino, orienta notificação ao proprietário.

---

### C19 — Aluguel por temporada (Airbnb) no condomínio
**Situação:** Morador aluga seu apartamento pelo Airbnb todo fim de semana. Outros moradores reclamam de estranhos.
**Tensão:** Proprietário argumenta que é sua propriedade e pode fazer o que quiser.
**Risco:** Decisão sem base pode gerar ação judicial em qualquer direção.
**Resposta esperada:** STJ (REsp 1.819.075) entendeu que condomínio pode proibir locação por temporada via convenção ou regulamento. Se não há proibição expressa, pode haver dificuldade de coibir. Recomendar deliberação em assembleia para incluir regra na convenção.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Proíba imediatamente, é crime." (sem base legal específica).
**Critérios:** Menciona jurisprudência do STJ, diferencia convenção que proíbe de convenção omissa, sugere assembleia.

---

## Categoria 8 — LGPD e Privacidade

### C20 — Lista de inadimplentes no mural
**Situação:** Síndico quer colocar lista de inadimplentes no mural do hall para pressionar os pagamentos.
**Tensão:** Outros condôminos exigem transparência.
**Risco:** Publicação de dados pessoais sem base legal adequada viola a LGPD.
**Resposta esperada:** Publicação nominal de devedores em área visível a todos pode configurar exposição indevida de dados pessoais e causar dano moral. LGPD exige base legal (consentimento, legítimo interesse ou obrigação legal). Divulgar apenas em assembleia, para os próprios condôminos, é mais seguro.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Pode publicar, é transparência." (omite risco LGPD e dano moral).
**Critérios:** Menciona LGPD, distingue divulgação em assembleia versus mural público, alerta sobre risco de ação por dano moral.

---

### C21 — Câmeras no corredor do andar
**Situação:** Morador instalou câmera de segurança no corredor do seu andar, filmando a porta dos vizinhos.
**Tensão:** Vizinhos se sentem monitorados.
**Risco:** Filmagem em área comum sem autorização pode violar privacidade e LGPD.
**Resposta esperada:** Corredor é área comum. Instalação de câmera privada em área comum exige autorização do condomínio (geralmente via assembleia). Câmera voltada para porta de outros moradores é especialmente sensível — possível invasão de privacidade. Síndico deve notificar o morador e deliberar em assembleia.
**Ferramenta:** ComunicadoPanel — comunicado para regularização.
**Resposta ruim:** "Cada um faz o que quer no corredor." (ignora que corredor é área comum).
**Critérios:** Confirma que corredor é área comum, menciona necessidade de autorização, alerta sobre privacidade de terceiros.

---

## Categoria 9 — Responsabilidade Civil

### C22 — Vazamento do apartamento de cima
**Situação:** Teto do apartamento do 3º andar está infiltrado. Morador do 4º nega responsabilidade.
**Tensão:** Dano visível aumentando. Morador do 3º exige que o condomínio resolva.
**Risco:** Se o condomínio resolver sem identificar a origem, pode assumir custo indevido.
**Resposta esperada:** O condomínio deve solicitar vistoria técnica para identificar a origem. Se o problema está dentro da unidade do 4º andar, a responsabilidade é do condômino. Se está na estrutura ou tubulação comum, é do condomínio. Documentar tudo antes de qualquer reparação.
**Ferramenta:** ComunicadoPanel — registro formal do incidente.
**Resposta ruim:** "O condomínio paga porque é problema do prédio." (sem verificar a origem).
**Critérios:** Recomenda vistoria técnica, distingue tubulação interna de área comum, orienta documentação.

---

### C23 — Morador escorregou na área comum molhada
**Situação:** Morador caiu na piscina após o chão ficar escorregadio sem sinalização. Está ameaçando processar.
**Tensão:** Seguro do condomínio pode não cobrir se houver negligência.
**Risco:** Responsabilidade civil objetiva do condomínio por falta de manutenção preventiva.
**Resposta esperada:** Condomínio tem responsabilidade objetiva pela segurança das áreas comuns. Ausência de sinalização de piso molhado pode configurar negligência. Recomendado: acionar o seguro condominial imediatamente, registrar o ocorrido formalmente, verificar se há câmeras que registraram o incidente.
**Ferramenta:** Nenhuma direta (orientação de gestão de crise).
**Resposta ruim:** "Culpa do morador por não tomar cuidado." (ignora responsabilidade objetiva do condomínio).
**Critérios:** Menciona responsabilidade objetiva, orienta acionamento de seguro e documentação.

---

## Categoria 10 — Gestão Condominial

### C24 — Síndico contratou empresa sem cotação
**Situação:** Síndico contratou empresa de manutenção do cunhado sem fazer cotação. Morador questionou em assembleia.
**Tensão:** Conflito de interesses óbvio. Confiança no síndico abalada.
**Risco:** Contratação sem cotação pode configurar irregularidade, dependendo do que diz a convenção.
**Resposta esperada:** Boa prática de gestão exige no mínimo 3 cotações para obras e serviços de maior valor. Contratação de parente sem cotação configura aparente conflito de interesses. Condôminos podem pedir prestação de contas em assembleia. Se houver prejuízo, podem destituir o síndico e solicitar ressarcimento.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Não tem problema, desde que o serviço foi bom." (ignora dever de transparência e conflito de interesses).
**Critérios:** Menciona conflito de interesses, cotação como boa prática, possibilidade de prestação de contas.

---

### C25 — Síndico quer destituir o vice-síndico
**Situação:** Síndico e vice-síndico tiveram desentendimento grave. Síndico quer afastar o vice.
**Tensão:** Vice foi eleito pela assembleia. Síndico sozinho não pode destituí-lo.
**Risco:** Ato unilateral do síndico pode ser contestado.
**Resposta esperada:** Vice-síndico, assim como o síndico, é eleito pela assembleia. Sua destituição exige convocação de assembleia específica para deliberação, com quórum previsto na convenção. Síndico não tem poder unilateral para afastar o vice.
**Ferramenta:** ChecklistPanel — processo de assembleia.
**Resposta ruim:** "O síndico pode demitir o vice quando quiser." (ignora que vice é eleito).
**Critérios:** Diferencia nomeação de eleição, orienta convocação de assembleia, menciona quórum convencional.

---

### C26 — Prestação de contas atrasada
**Situação:** Síndico novo assumiu e descobriu que a gestão anterior não fez prestação de contas há 18 meses.
**Tensão:** Condôminos querem saber o que aconteceu com o dinheiro.
**Risco:** Síndico novo pode ser responsabilizado por não exigir a prestação do antigo.
**Resposta esperada:** Art. 1.348, VIII CC — síndico é obrigado a prestar contas anualmente (no mínimo). Síndico novo deve exigir da gestão anterior toda a documentação contábil. Se documentação não for entregue, pode ser acionado judicialmente. Registrar a situação em ata imediatamente.
**Ferramenta:** Nenhuma direta.
**Resposta ruim:** "Responsabilidade do síndico anterior, não se preocupe." (ignora que novo síndico tem obrigação de exigir a regularização).
**Critérios:** Cita art. 1.348 VIII, distingue responsabilidade do novo e do anterior, orienta registro formal.

---

## Categoria 11 — Finanças e Rateio

### C27 — Condômino quer pagar menos por não usar elevador
**Situação:** Morador do 1º andar argumenta que não usa o elevador e não deveria pagar pela manutenção.
**Tensão:** Parece justo para ele. Outros condôminos podem levantar questões similares sobre piscina, academia etc.
**Risco:** Aceitar o argumento cria precedente que inviabiliza o rateio equitativo.
**Resposta esperada:** Art. 1.336, I CC — despesas são rateadas por fração ideal, salvo disposição em contrário na convenção. O não-uso de área comum não isenta do pagamento. Elevador é equipamento coletivo que beneficia o prédio como um todo (inclusive valorização do imóvel do 1º andar).
**Ferramenta:** SimuladorReajusteCota (cálculo de rateio).
**Resposta ruim:** "Faz sentido, pode negociar uma redução." (contraria o Código Civil sem previsão na convenção).
**Critérios:** Cita art. 1.336 I, menciona fração ideal, diferencia uso de obrigação de custeio.

---

### C28 — Taxa extra para obra urgente sem assembleia
**Situação:** Caixa d'água estourou, precisa de reparo urgente de R$ 8.000. Não tem dinheiro em caixa. Pode cobrar taxa extra sem assembleia?
**Tensão:** Urgência real. Assembleia demora. Prédio pode ficar sem água.
**Risco:** Cobrança sem base legal pode ser contestada.
**Resposta esperada:** Para obras urgentes que coloquem em risco a segurança ou incolumidade dos moradores, o síndico pode agir sem assembleia prévia (art. 1.341, II CC). No entanto, deve convocar assembleia para ratificação. Cobrar taxa extra sem assembleia prévia é arriscado — melhor ratificar o gasto e a cobrança em assembleia posterior.
**Ferramenta:** SimuladorReajusteCota — cálculo de impacto por unidade.
**Resposta ruim:** "Não pode cobrar nada sem assembleia." (ignora urgência e art. 1.341 II).
**Critérios:** Distingue obras urgentes de obras planejadas, cita art. 1.341 II, orienta sobre ratificação posterior.

---

## Categoria 12 — Segurança e Manutenção

### C29 — AVCB vencido há 2 anos
**Situação:** Síndico descobriu que o Auto de Vistoria do Corpo de Bombeiros está vencido há 2 anos. Descobriu na hora de renovar o seguro.
**Tensão:** Seguro pode não ser renovado sem AVCB válido. Prédio pode estar em situação irregular.
**Risco:** Em caso de sinistro, seguro pode negar cobertura. Responsabilidade civil do síndico por omissão.
**Resposta esperada:** AVCB é obrigatório e sua renovação é responsabilidade do síndico. Contatar o Corpo de Bombeiros do estado para entender o processo de regularização. A renovação do seguro pode ser negociada com a seguradora mediante protocolo da solicitação junto aos bombeiros.
**Ferramenta:** MemoriaPanel (registrar data de vencimento para monitoramento futuro).
**Resposta ruim:** "Não é tão urgente." (AVCB vencido é violação de lei e risco de seguro).
**Critérios:** Menciona obrigatoriedade, orienta sobre regularização junto aos bombeiros, alerta sobre impacto no seguro.

---

### C30 — Caixa d'água sem limpeza há mais de 2 anos
**Situação:** Novo síndico encontrou nos registros que a última limpeza da caixa d'água foi há 2 anos e 3 meses.
**Tensão:** Portaria MS 888/2021 exige limpeza semestral.
**Risco:** Irregularidade sanitária, possível responsabilidade do síndico.
**Resposta esperada:** Portaria MS 888/2021 exige limpeza e higienização semestral das caixas d'água. Agendar a limpeza com empresa habilitada imediatamente, guardar o laudo bacteriológico. Registrar no MemoriaPanel para controle futuro.
**Ferramenta:** MemoriaPanel — cadastrar data de última limpeza.
**Resposta ruim:** "Não tem urgência se a água está com gosto normal." (gosto e aparência não garantem ausência de contaminação).
**Critérios:** Cita Portaria MS 888, menciona frequência semestral, orienta laudo bacteriológico.

---

## Cenários Complementares (resumidos)

### C31 — Morador quer usar salão de festas para evento comercial
**Situação:** Morador quer alugar o salão do condomínio para dar uma festa de aniversário com cobrança de ingresso de convidados externos.
**Resposta esperada:** Uso do salão para fins comerciais por um condômino geralmente não é permitido sem previsão na convenção. Síndico deve verificar a convenção. Se há previsão, pode cobrar taxa; se não há, é necessário deliberação.

### C32 — Animal com laudo de suporte emocional em prédio que proíbe pets
**Situação:** Morador apresentou laudo médico de "animal de suporte emocional" para burlar a proibição de pets.
**Resposta esperada:** Animal de suporte emocional tem status diferente de animal de serviço (guia para cegos). O entendimento jurídico varia. Recomendado: verificar jurisprudência recente do STJ e consultar assessoria jurídica antes de decidir.

### C33 — Barulho de obra de apartamento na unidade do síndico
**Situação:** Síndico está reformando o próprio apartamento. Vizinhos reclamam de barulho.
**Resposta esperada:** Síndico não tem privilégios — as mesmas regras se aplicam a ele. Vice-síndico ou outro representante deve fiscalizar o cumprimento das normas.

### C34 — Morador quer instalar placa solar no telhado do prédio
**Situação:** Morador quer instalar painel solar no telhado (área comum), pagando ele mesmo o custo.
**Resposta esperada:** Telhado é área comum. Instalação exige autorização do condomínio via assembleia. Se aprovado, é necessário definir as condições (quem paga, quem usa a energia, o que acontece na venda do apartamento).

### C35 — Síndico recebeu propina de fornecedor
**Situação:** Condômino denunciou que um fornecedor teria dado presente ao síndico após ser contratado.
**Resposta esperada:** Conduta pode configurar conflito de interesses e potencialmente ilícito. Condôminos podem convocar assembleia para destituir o síndico e solicitar prestação de contas. Se houver prejuízo comprovado, pode haver ação de ressarcimento.

### C36 — Furto na garagem. Quem paga?
**Situação:** Carro foi furtado na garagem do condomínio. Morador exige que o condomínio pague.
**Resposta esperada:** Depende do que diz a convenção e o contrato de uso das vagas. Se houver câmeras e portaria 24h, o condomínio pode ter responsabilidade. Se a convenção isentar o condomínio de responsabilidade por furtos em garagem, essa isenção pode ser válida. Acionar o seguro do veículo como primeira medida.

### C37 — Esgoto entupindo e voltando para apartamentos do térreo
**Situação:** Cano de esgoto entupiu e voltou para o banheiro de dois apartamentos no térreo. Moradores exigem indenização.
**Resposta esperada:** Se o entupimento ocorreu na tubulação coletora (área comum), a responsabilidade é do condomínio. Providenciar desentupimento urgente, registrar o incidente, verificar o seguro e indenizar os danos comprovados.

### C38 — Votação sobre destituição do síndico
**Situação:** Grupo de condôminos quer destituir o síndico atual. Precisam de quantos votos?
**Resposta esperada:** Art. 1.349 CC — assembleia especialmente convocada, por maioria absoluta de condôminos. O síndico destituído pode se candidatar na mesma assembleia para nova eleição.

### C39 — Gato na área comum
**Situação:** Gatos de rua estão na garagem. Moradora começou a alimentá-los regularmente. Outros reclamam.
**Resposta esperada:** Alimentação de animais em área comum pode ser regulada pelo condomínio. Não é questão de LGPD nem de Código Civil diretamente — é matéria de regulamento interno. Deliberar em assembleia sobre política de animais na área comum.

### C40 — Obra na madrugada por morador noturno
**Situação:** Morador que trabalha de noite quer fazer obra entre 22h e 6h. Convenção proíbe obras nesse horário.
**Resposta esperada:** A convenção prevalece sobre a preferência do morador, mesmo com justificativa pessoal. Advertência formal e, se necessário, multa. Não há exceção prevista em lei para esse caso.

### C41 — Câmera do condomínio com imagem salva em nuvem particular do síndico
**Situação:** Síndico instalou câmera de segurança e o gravador está conectado ao servidor pessoal dele.
**Resposta esperada:** Imagens de câmeras de área comum são dados pessoais sob a LGPD. O controlador deve ser o condomínio, não o síndico pessoalmente. Recomendado: migrar para servidor do condomínio com acesso controlado e política de retenção de imagens.

### C42 — Síndico novo não encontra documentos da gestão anterior
**Situação:** Síndico antigo se recusa a entregar documentos (atas, contratos, comprovantes).
**Resposta esperada:** Síndico é obrigado a passar documentos ao sucessor (art. 1.348 CC). Se negar, é possível notificar formalmente por escrito e, em seguida, acionar judicialmente. Registrar a negativa em ata da assembleia que elegeu o novo síndico.

### C43 — Morador quer ver as câmeras de segurança do prédio
**Situação:** Morador diz que tem direito de ver as gravações porque tem suspeita de furto.
**Resposta esperada:** Acesso às gravações é do condomínio, não direito individual de qualquer morador. Síndico pode fornecer imagens relevantes ao caso, preservando privacidade de outros moradores. Para fins de boletim de ocorrência, a polícia pode requisitar formalmente.

### C44 — Inadimplência sistêmica: 30% dos condôminos em atraso
**Situação:** Um terço do condomínio está inadimplente. Caixa não cobre despesas básicas.
**Resposta esperada:** Situação grave exige convocação urgente de assembleia para deliberar sobre: fundo emergencial, taxa extra temporária, e estratégia de cobrança (administrativa antes de judicial). Contratar assessoria jurídica para accelerar cobranças.

### C45 — Morador quer instalar cobertura de policarbonato na varanda
**Situação:** Morador quer instalar proteção de policarbonato na varanda. Assembléia nunca deliberou sobre isso.
**Resposta esperada:** Fechamento de varanda altera a fachada (área comum). Exige autorização do condomínio. O ideal é criar um padrão e deliberar em assembleia, para que todos possam instalar o mesmo modelo.

### C46 — Taxa de condomínio aumentou 40% em um ano
**Situação:** Novo síndico propõe aumento de 40% na taxa para cobrir déficit acumulado.
**Resposta esperada:** Aumento da taxa exige aprovação em assembleia (quórum da maioria simples geralmente). Síndico deve apresentar a previsão orçamentária detalhada. Aumento de 40% exige justificativa transparente — sem ela, pode gerar destituição.

### C47 — Funcionário foi demitido e quer reintegração
**Situação:** Condomínio demitiu porteiro que alega ter direito à estabilidade (em tratamento médico).
**Resposta esperada:** Funcionário em tratamento de saúde com afastamento pelo INSS pode ter estabilidade provisória. Demissão nesse período pode ser ilegal. Recomendar consulta urgente à assessoria trabalhista antes de qualquer pagamento de rescisão.

### C48 — Morador quer colocar placa comercial na janela
**Situação:** Arquiteto mora no condomínio e quer colocar placa da sua empresa na janela.
**Resposta esperada:** Fachada é área comum — uso para fins comerciais individuais geralmente proibido. Verificar a convenção. Se proibido, notificar e solicitar remoção.

### C49 — Chuva entrou pelo telhado e danificou apartamento do último andar
**Situação:** Telhado tem goteira. Chuva danificou móveis do apartamento da cobertura.
**Resposta esperada:** Telhado é área comum — manutenção é responsabilidade do condomínio. Se houve negligência (telhado sem manutenção documentada), condomínio pode ser responsável pelos danos. Acionar seguro condominial e realizar o reparo urgente.

### C50 — Assembleia aprovada sem quórum (membros do conselho ausentes)
**Situação:** Assembleia ocorreu com apenas 8 condôminos de 30. Aprovaram obra cara. Outros querem anular.
**Resposta esperada:** Verificar na convenção qual o quórum exigido para aquela deliberação. Se o quórum não foi atingido, a deliberação é nula. Para obras de grande monta, Código Civil pode exigir maioria qualificada. Registrar a impugnação formalmente.

---

## Resumo de Cobertura

| Categoria | Cenários | Cobertura na KB atual |
|-----------|----------|-----------------------|
| Multas e advertências | C01–C03 | Alta |
| Obras em unidades | C04–C06 | Média |
| Assembleias | C07–C09 | Alta |
| Inadimplência | C10–C12 | Alta |
| Funcionários | C13–C15 | Média |
| Convenção e regimento | C16–C17 | Média |
| Locação e inquilinos | C18–C19 | Média |
| LGPD e privacidade | C20–C21 | Alta |
| Responsabilidade civil | C22–C23 | Alta |
| Gestão condominial | C24–C26 | Média |
| Finanças e rateio | C27–C28 | Média |
| Segurança e manutenção | C29–C30 | Alta |
| Cenários complementares | C31–C50 | Baixa a média |

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-17 (Fase 43)*
