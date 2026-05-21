# Smoke Test Interno — Amigo do Prédio

Este checklist não substitui teste com síndicos. Ele é apenas validação interna do fundador.
O produto segue em pré-beta interno, sem venda, tráfego pago ou uso externo nesta etapa.

## 1. Estado zerado

- [ ] Limpar `localStorage`.
- [ ] Abrir a Home.
- [ ] Confirmar Hero, GuidancePreview e DicaDoDia oculta.

## 2. Cadastro essencial

- [ ] Cadastrar AVCB, Seguro e Mandato.
- [ ] Salvar.
- [ ] Voltar à Home.
- [ ] Confirmar StatusHeader (slim: nome + badge + itens em dia), Hub de Saúde Operacional, GuidancePanel e ProximasDatas.
- [ ] Confirmar que o Hub de Saúde Operacional aparece ANTES do GuidancePanel.
- [ ] Confirmar que o Hub não repete as linhas de AVCB/Seguro/Mandato do GuidancePanel.

## 3. GuidancePanel

- [ ] Testar AVCB vencido.
- [ ] Testar seguro próximo.
- [ ] Testar apenas rotinas atrasadas.
- [ ] Testar cenário misto.

## 4. Próximos Passos

- [ ] Criar manual.
- [ ] Criar via Assistente.
- [ ] Criar via GuidancePanel.
- [ ] Criar via “não sei agora”.
- [ ] Criar via Registro rápido de ocorrência.
- [ ] Criar 6+ itens e verificar overflow.
- [ ] Concluir item e verificar Timeline.

## 5. Registro rápido (Ferramentas → Rotina do síndico, via link da Home)

- [ ] Confirmar que na Home aparece atalho discreto “+ Registrar ocorrência” (não o formulário completo).
- [ ] Clicar no atalho e confirmar que navega para Ferramentas abrindo diretamente o grupo “Rotina do síndico”.
- [ ] Confirmar que RegistroRapido está visível após a navegação (não o menu de categorias).
- [ ] Registrar ocorrência de barulho com descrição curta.
- [ ] Confirmar que não há linguagem de livro oficial, denúncia ou protocolo.
- [ ] Marcar criação de próximo passo e confirmar chip “Ocorrência”.
- [ ] Confirmar ocorrência no Histórico operacional sem descrição livre.
- [ ] Gerar mensagem administrativa copiável.
- [ ] Copiar mensagem e confirmar que o texto é editável antes da cópia.
- [ ] Confirmar que a mensagem não expõe unidade, nome ou descrição da ocorrência.

## 5b. Hub Saúde Operacional

- [ ] Confirmar status “Em evolução” quando apenas perfil cadastrado, sem datas essenciais.
- [ ] Confirmar status “Crítico” quando AVCB/Seguro/Mandato vencidos.
- [ ] Confirmar status “Atenção” quando há alertas de atenção ou passos parados há +14 dias.
- [ ] Confirmar status “Bem acompanhado” quando essenciais completos e sem alertas, mas com pendências.
- [ ] Confirmar status “Tudo em ordem” quando essenciais completos, sem alertas e sem pendências.
- [ ] Confirmar que o hub NÃO usa porcentagem, score numérico, “regular juridicamente”, “compliance” ou “saúde jurídica”.
- [ ] Confirmar que os chips de indicadores mostram no máximo 5 itens.

## 6. Revisão semanal

- [ ] Com memória operacional ativa, confirmar card “Revisão rápida da semana” quando houver algo útil para revisar.
- [ ] Confirmar que o card não aparece no estado zerado sem memória operacional.
- [ ] Confirmar no máximo 3–5 indicadores.
- [ ] Concluir revisão semanal.
- [ ] Confirmar feedback discreto de semana revisada.
- [ ] Confirmar “Revisão semanal concluída” no Histórico operacional.
- [ ] Confirmar que não há descrição de ocorrência, unidade/local, texto livre ou dado sensível na Timeline.
- [ ] Confirmar que o estado semanal é efêmero e não exige backup v4.

## 7. Assistente

- [ ] Perguntar sobre barulho.
- [ ] Perguntar sobre inadimplência.
- [ ] Perguntar sobre assembleia.
- [ ] Perguntar sobre obra.
- [ ] Perguntar sobre funcionário.
- [ ] Fazer pergunta fora do escopo.
- [ ] Testar botão Voltar.

## 8. Ferramentas — Central de Ações por Categorias (Fase 78)

- [ ] Ao abrir a aba Ferramentas, confirmar que aparece o menu de categorias (não todos os componentes abertos).
- [ ] Confirmar subtítulo do menu: "Registre ocorrências, gere comunicados, faça simulações e consulte checklists."
- [ ] Confirmar que o menu exibe exatamente 5 cards: Rotina do síndico / Comunicados / Simuladores / Checklists / Explorar por tema.
- [ ] Confirmar que cada card tem ícone, título, descrição curta e chevron.
- [ ] Clicar em "Rotina do síndico" → confirmar que RegistroRapido aparece e demais componentes estão ocultos.
- [ ] Confirmar botão "← Voltar para ferramentas" discreto e funcional dentro de cada grupo.
- [ ] Clicar em "Comunicados" → confirmar que apenas ComunicadoPanel aparece, sem duplicidade de cabeçalho.
- [ ] Gerar e copiar um comunicado dentro do grupo Comunicados.
- [ ] Clicar em "Simuladores" → confirmar que Simulador de Multa e Simulador de Reajuste aparecem juntos.
- [ ] Confirmar que lógica dos simuladores está inalterada (cálculos corretos).
- [ ] Clicar em "Checklists" → confirmar que ChecklistPanel aparece com nota orientativa.
- [ ] Confirmar nota: "Checklists orientativos. Ajuste conforme a convenção, o regimento e a realidade do condomínio."
- [ ] Clicar em "Explorar por tema" → confirmar PainelOperacional visível.
- [ ] Confirmar que ao clicar Voltar o menu de categorias reaparece corretamente.
- [ ] Confirmar que ao trocar de aba e voltar para Ferramentas, o menu aparece (não a última view interna).

## 9. Backup

- [ ] Exportar.
- [ ] Limpar `localStorage`.
- [ ] Importar.
- [ ] Verificar dados restaurados.
- [ ] Confirmar que backup v3 restaura ocorrências.
- [ ] Confirmar que backup v1/v2 antigo continua sendo aceito.
- [ ] Confirmar que a revisão semanal não criou backup v4.

## 10. PWA

- [ ] Instalar no iPhone/Android quando possível.
- [ ] Verificar safe-area.
- [ ] Verificar bottom nav.
- [ ] Verificar scroll.
- [ ] Verificar input de data.

## 11. /admin

- [ ] Rodar auditoria.
- [ ] Registrar recall.
- [ ] Registrar categorias problemáticas.
- [ ] Confirmar eventos de ocorrência sem descrição, unidade/local, texto de mensagem ou data exata.
- [ ] Confirmar eventos `weekly_review_viewed` e `weekly_review_completed` sem PII nem texto livre.

## 13. Hubs da Home — HomeCondominioHub e HomeAcaoHub

- [ ] Confirmar que HomeCondominioHub aparece no Início com dados cadastrados.
- [ ] Confirmar que HomeCondominioHub NÃO aparece sem dados (exibe Hero).
- [ ] Confirmar que HomeCondominioHub exibe: "Seu condomínio", nome (ou "Condomínio em acompanhamento"), porcentagem, badge de status, barra visual, frase diagnóstica, microcopy "Índice operacional baseado nos dados cadastrados no app."
- [ ] Confirmar que HomeCondominioHub exibe no máximo 3 sinais (fatores missing/partial).
- [ ] Confirmar que HomeCondominioHub NÃO exibe lista completa de fatores nem sugestões.
- [ ] Confirmar que HomeAcaoHub aparece no Início com dados cadastrados.
- [ ] Confirmar que HomeAcaoHub exibe seção de revisão semanal com "Revisar agora" quando pendente.
- [ ] Confirmar que HomeAcaoHub marca revisão como concluída ao clicar "Revisar agora".
- [ ] Confirmar que HomeAcaoHub exibe lista de próximos passos (até 3) com conclusão.
- [ ] Confirmar que HomeAcaoHub exibe próxima data mais urgente.
- [ ] Confirmar que HomeAcaoHub exibe "+ Registrar ocorrência →" navegando para Ferramentas.
- [ ] Confirmar que CondominioStatusHeader NÃO aparece mais na Home.
- [ ] Confirmar que RevisaoSemanalCard, PendenciasCard e ProximasDatas NÃO aparecem como cards separados na Home.
- [ ] Confirmar que SaudeOperacionalPanel NÃO aparece na aba Condomínio.
- [ ] Confirmar ordem: HomeCondominioHub → GuidancePanel → HomeAcaoHub → Contextual/Dica.
- [ ] Confirmar que aba Condomínio mantém: OnboardingProfile, MemoriaPanel, TimelineOperacional, RevisaoMensal, BackupPanel.

## 14. Saúde Operacional — Início (compact) e Condomínio (full) [REFERÊNCIA HISTÓRICA — Fase 76]

- [ ] Confirmar que SaudeOperacionalPanel compact aparece no Início quando há dados cadastrados.
- [ ] Confirmar que SaudeOperacionalPanel compact NÃO aparece no Início sem dados cadastrados.
- [ ] Confirmar que a versão compact exibe: "Saúde operacional", porcentagem, barra, frase diagnóstica.
- [ ] Confirmar que a versão compact exibe no máximo 3 sinais (fatores missing/partial).
- [ ] Confirmar microcopy "Baseado nos dados cadastrados no app." na versão compact.
- [ ] Confirmar que a versão compact NÃO exibe lista de fatores completa, sugestões ou disclaimer longo.
- [ ] Confirmar que HomeResumoPredio NÃO aparece mais no Início.
- [ ] Confirmar que NÃO há dois blocos de "Saúde operacional" simultaneamente no Início.
- [ ] Confirmar que a versão full permanece intacta na aba Condomínio (fatores, sugestões, disclaimer).
- [ ] Confirmar ordem no Início: CondominioStatusHeader → compact → GuidancePanel → RevisaoSemanalCard → PendenciasCard.

## 15. Índice de Saúde Operacional — aba Condomínio [REFERÊNCIA HISTÓRICA — Fase 75]

- [ ] Confirmar que o painel NÃO aparece na aba Condomínio com localStorage zerado (sem dados cadastrados).
- [ ] Cadastrar AVCB, Seguro e Mandato e confirmar que o painel aparece antes de OnboardingProfile.
- [ ] Confirmar exibição de percentual (0–100%), badge de status e barra de progresso.
- [ ] Confirmar que a faixa "Crítico" aparece quando AVCB/Seguro/Mandato estão vencidos.
- [ ] Confirmar que a faixa "Atenção" aparece com alertas de atenção ou próximos passos parados há +14 dias.
- [ ] Confirmar que a faixa "Em evolução" aparece com dados parciais e sem alertas críticos.
- [ ] Confirmar que a faixa "Bem acompanhado" aparece com essenciais completos, sem alertas e poucas pendências.
- [ ] Confirmar que a faixa "Tudo em ordem" é atingível com revisão semanal concluída, sem alertas e sem pendências paradas.
- [ ] Confirmar que os fatores mostram no máximo 5 itens.
- [ ] Confirmar que as sugestões mostram no máximo 3 itens.
- [ ] Confirmar que o disclaimer "Este índice é apenas operacional e depende dos dados cadastrados no app." está visível.
- [ ] Confirmar que o painel NÃO exibe as palavras: "regular", "regularizado", "compliance", "conformidade", "saúde jurídica", "garantia", "segurança jurídica", "sem risco".
- [ ] Confirmar que o índice NÃO aparece na aba Início (Home).

## 16. Reset seguro e feedback de backup [Fase 77]

- [ ] Confirmar que "Novo condomínio / limpar dados" aparece discretamente abaixo de Exportar/Restaurar no BackupPanel.
- [ ] Confirmar que clicar abre aviso com texto: "Isso apagará os dados deste dispositivo. Exporte um backup antes se quiser guardar as informações."
- [ ] Confirmar que o botão "Apagar dados" está desabilitado enquanto o campo não contém exatamente "APAGAR".
- [ ] Confirmar que ao digitar "APAGAR" e confirmar, os dados são limpos e o app retorna ao estado zerado.
- [ ] Confirmar feedback: "Dados apagados. Você pode começar um novo condomínio."
- [ ] Confirmar que nenhum dado é apagado sem confirmação explícita.
- [ ] Confirmar que cancelar na tela de confirmação volta ao estado idle sem apagar nada.
- [ ] Confirmar feedback de exportação: após clicar em "Exportar dados", aparece mensagem com nome do arquivo (ex: "Backup exportado: amigo-do-predio-backup-YYYY-MM-DD.json").
- [ ] Confirmar que o feedback de exportação desaparece após ~4 segundos.
- [ ] Confirmar que backup v1/v2/v3 não foi alterado (importar arquivo exportado antes do reset deve funcionar).

## 17. Assistente — Roteiro das 5 perguntas [Fase 77]

Para cada pergunta abaixo, verificar:
- resposta direta ou fallback honesto;
- resposta completa visível sem truncamento;
- tom administrativo/informativo (não advogado);
- próximo passo claro quando disponível;
- disclaimer/limite adequado;
- possibilidade de salvar como próximo passo, se aplicável.

- [ ] "Posso multar morador por barulho depois das 22h?"
  - [ ] Resposta direta da base (não fallback)
  - [ ] Menciona convenção/regimento como pré-requisito
  - [ ] Próximo passo: documentar ocorrência
  - [ ] Não afirma que pode aplicar multa sem verificar a convenção
  - [ ] Botão "Salvar nos próximos passos" disponível

- [ ] "Posso expor inadimplente no grupo do condomínio?"
  - [ ] Resposta direta da base
  - [ ] Menciona LGPD e riscos de exposição pública
  - [ ] Não instrui a expor nome publicamente
  - [ ] Disclaimer de categoria sensível visível (LGPD)

- [ ] "Morador pode fazer obra sem avisar?"
  - [ ] Resposta direta da base
  - [ ] Menciona obrigação de comunicar ao síndico/administradora
  - [ ] Próximo passo: solicitar documentação/cronograma
  - [ ] Botão "Salvar nos próximos passos" disponível

- [ ] "O inquilino pode votar na assembleia?"
  - [ ] Resposta direta ou fallback contextual
  - [ ] Menciona distinção entre locatário e condômino
  - [ ] Tom informativo, não afirmativo absoluto

- [ ] "O que faço se o AVCB está vencido?"
  - [ ] Resposta direta da base
  - [ ] Menciona urgência de regularização
  - [ ] Contexto do prédio aparece se AVCB cadastrado no app
  - [ ] Próximo passo claro
  - [ ] Texto completo visível sem truncamento — sem max-height ou overflow escondido

- [ ] Confirmar fallback honesto em pergunta fora do escopo (ex: "Qual o melhor investimento para o fundo de reserva?")
- [ ] Confirmar botão "Voltar ←" funcional após resposta
- [ ] Confirmar que o Assistente não parece advogado virtual nem consultoria jurídica

## 12. Maturidade comercial percebida

- [ ] Confirmar que a Home comunica acompanhamento operacional, não apenas chat.
- [ ] Confirmar que Hub de Saúde Operacional responde "Como está meu prédio agora?" de forma interpretativa.
- [ ] Confirmar que Ferramentas responde "O que posso fazer agora?" com menu de categorias limpo e navegável.
- [ ] Confirmar que aba Condomínio ("Dados do prédio") responde "Quais dados sustentam o acompanhamento?".
- [ ] Confirmar que Próximos Passos deixa claro o ciclo dúvida → ação → acompanhamento.
- [ ] Confirmar que Revisão Mensal e Timeline explicam por que voltar ao app.
- [ ] Confirmar que Backup informa dados locais e proteção sem login.
- [ ] Confirmar que o Assistente não parece advogado virtual, consultoria jurídica ou substituto da administradora.

## 20. Conta & Dados — Fase 80

### Estado sem dados cadastrados

- [ ] Abrir aba Condomínio sem dados cadastrados.
- [ ] Confirmar título: "Ativar monitoramento" (não "Conta & Dados").
- [ ] Confirmar que rótulos de seção NÃO aparecem ("Dados do prédio", "Vencimentos e rotinas" etc.).
- [ ] Confirmar que blocos "Suporte e termos" e "Preferências futuras" aparecem ao fim.
- [ ] Confirmar que BottomNav exibe "Condomínio" (não alterado).

### Estado com dados cadastrados

- [ ] Cadastrar AVCB, Seguro e Mandato e voltar à aba Condomínio.
- [ ] Confirmar título interno: "Conta & Dados".
- [ ] Confirmar subtitle: "Dados do prédio, histórico, backup e preferências do app."
- [ ] Confirmar rótulo "Dados do prédio" acima de OnboardingProfile.
- [ ] Confirmar rótulo "Vencimentos e rotinas" acima de MemoriaPanel.
- [ ] Confirmar rótulo "Histórico operacional" acima de TimelineOperacional.
- [ ] Confirmar rótulo "Backup e segurança" acima de BackupPanel.
- [ ] Confirmar que os rótulos são discretos (uppercase, texto pequeno, sem caixa, sem borda).

### Blocos estáticos

- [ ] Confirmar bloco "Suporte e termos" com texto: "Antes de qualquer versão comercial, esta área reunirá suporte, termos de uso e política de privacidade. Por enquanto, o app segue em pré-beta interno."
- [ ] Confirmar bloco "Preferências futuras" com texto: "No futuro, esta área poderá reunir conta, cor do app, notificações e opções de assinatura."
- [ ] Confirmar que nenhum bloco tem formulário, botão de ação, e-mail clicável ou integração externa.
- [ ] Confirmar que nenhum bloco sugere que existe conta ativa ou suporte disponível imediatamente.

### Regressões

- [ ] Confirmar que link de RevisaoMensal da Home ainda abre aba Condomínio e rola até a seção correta.
- [ ] Confirmar que OnboardingProfile, MemoriaPanel, TimelineOperacional, RevisaoMensal e BackupPanel funcionam normalmente.
- [ ] Confirmar que exportar backup e importar backup continuam funcionando.
- [ ] Confirmar que "Novo condomínio / limpar dados" continua funcionando no BackupPanel.

## 19. Agenda do Prédio — Fase 79

- [ ] Acessar Ferramentas → Rotina do síndico e confirmar que AgendaPredio aparece abaixo de RegistroRapido.
- [ ] Confirmar seção com título "Agenda do prédio", subtítulo "Eventos e compromissos operacionais" e botão "+ Novo evento".
- [ ] Criar evento: preencher título, data futura, tipo "Assembleia" e nota. Confirmar que "Salvar evento" fica habilitado somente quando título e data estão preenchidos.
- [ ] Confirmar que evento aparece na lista de pendentes com ícone, tipo, data formatada e urgência por cor.
- [ ] Criar evento sem nota — confirmar que salva normalmente.
- [ ] Criar evento com "Criar próximo passo vinculado" marcado — confirmar pendência criada em Próximos Passos com origem "agenda".
- [ ] Concluir evento — confirmar que desaparece da lista pendente.
- [ ] Confirmar que evento concluído aparece na lista colapsável "Ver N concluídos".
- [ ] Excluir evento pendente — confirmar que pede confirmação antes de excluir.
- [ ] Confirmar que evento concluído aparece na TimelineOperacional como "Item da agenda concluído" (📅) sem título, nota ou data exata exposta.
- [ ] Com evento pendente próximo, confirmar que HomeAcaoHub mostra "Próximo na agenda" em vez de "Próxima data".
- [ ] Com evento pendente e datas monitoradas, confirmar que a data mais urgente vence (seja da agenda ou da memória).
- [ ] Confirmar CTA "Ver agenda →" no HomeAcaoHub navega para Ferramentas → Rotina do síndico com AgendaPredio visível.
- [ ] Exportar backup — confirmar que arquivo gerado tem version "4" e campo agenda.
- [ ] Limpar dados e importar backup v4 — confirmar que eventos da agenda são restaurados.
- [ ] Importar backup v3 antigo — confirmar que importa normalmente (agenda fica vazia, não quebra).
- [ ] Confirmar que BackupPanel mostra "Backup v4: memória, próximos passos, ocorrências e agenda".
- [ ] Confirmar que summary de importação mostra contagem de eventos da agenda quando > 0.
- [ ] Confirmar disclaimer: "Agenda operacional. Confirme prazos formais com documentos, prestadores ou profissionais responsáveis."
- [ ] Confirmar que AgendaPredio NÃO exibe calendário mensal, recorrência, push ou responsáveis.
- [ ] Confirmar que ao trocar de aba e voltar para Ferramentas → Rotina do síndico, a Agenda ainda aparece.

## 21. Assistente contextual sem IA — Fase 81

Objetivo: verificar que o bloco "Contexto do prédio" aparece corretamente nos novos casos e que o fallback está mais honesto.

Pré-condição geral: dados cadastrados em Dados do prédio (AVCB, seguro, mandato) e ao menos uma ocorrência registrada.

### Pergunta 1 — AVCB vencido

- [ ] Cadastrar AVCB com data passada.
- [ ] Perguntar no Assistente: "O que acontece se o AVCB vencer?"
- [ ] Confirmar que a resposta principal é da KB (não inventada).
- [ ] Confirmar que bloco "Contexto do prédio" aparece com menção ao vencimento do AVCB cadastrado.
- [ ] Confirmar que o bloco NÃO menciona data exata, nome de pessoa, unidade ou nota.
- [ ] Confirmar que o texto não parece orientação jurídica.

### Pergunta 2 — Seguro vencendo

- [ ] Cadastrar seguro com data a 15 dias.
- [ ] Perguntar: "Como funciona o seguro do condomínio?"
- [ ] Confirmar resposta da KB.
- [ ] Confirmar bloco "Contexto do prédio" mencionando que o seguro vence em breve (prazo em dias, sem data exata exposta).
- [ ] Confirmar ausência de conteúdo jurídico ou apólice.

### Pergunta 3 — Obra / manutenção

- [ ] Adicionar evento de tipo "Manutenção" ou "Extintores" na Agenda do Prédio com data futura dentro de 90 dias.
- [ ] Perguntar: "Quando fazer manutenção dos extintores?"
- [ ] Confirmar resposta da KB.
- [ ] Confirmar bloco "Contexto do prédio" com texto sobre itens futuros na Agenda — sem expor título do evento, nota ou data exata.
- [ ] Remover o evento da agenda e perguntar novamente — confirmar que bloco NÃO aparece (sem dado relevante).

### Pergunta 4 — Barulho

- [ ] Perguntar: "Morador está fazendo barulho depois da meia-noite. O que fazer?"
- [ ] Confirmar resposta da KB (categoria multas ou áreas-comuns).
- [ ] Confirmar bloco "Contexto do prédio" com sugestão de registrar como ocorrência e criar próximo passo.
- [ ] Confirmar que o bloco NÃO menciona ocorrências existentes, unidade, nome ou texto livre.
- [ ] Confirmar que o bloco NÃO parece protocolo oficial ou prova jurídica.

### Pergunta 5 — Inadimplência

- [ ] Perguntar: "Como cobrar morador inadimplente?"
- [ ] Confirmar resposta da KB (categoria inadimplencia/cobranca).
- [ ] Confirmar que o "Próximo passo" aparece normalmente.
- [ ] Confirmar que nenhum bloco "Contexto do prédio" aparece para inadimplência (sem dado local relevante nesta categoria).

### Pergunta 6 — Pergunta fora da base

- [ ] Perguntar algo completamente fora do escopo: "Qual é a previsão do tempo amanhã?"
- [ ] Confirmar que o fallback aparece (bloco default, não uma resposta inventada).
- [ ] Confirmar novo texto: "Não encontrei uma orientação específica para essa situação na base atual. Use a resposta como ponto de partida e, se envolver risco jurídico, financeiro, trabalhista ou técnico, confirme com profissional habilitado."
- [ ] Confirmar as três sugestões discretas em texto: "Reformule a pergunta com outras palavras", "Registre a situação como ocorrência no app", "Crie um próximo passo para acompanhar".
- [ ] Confirmar que NÃO há botões novos de navegação no fallback.
- [ ] Confirmar que o fallback NÃO inventa base legal ou resposta jurídica aberta.

### Regressões

- [ ] Confirmar que resposta normal (entrada KB com boa pontuação) continua aparecendo sem bloco desnecessário.
- [ ] Confirmar que bloco "Contexto do prédio" aparece apenas quando houver dado local relevante ao tema.
- [ ] Confirmar que GuidancePanel, HomeAcaoHub e AgendaPredio continuam funcionando normalmente.
- [ ] Confirmar que exportar e importar backup continuam sem erro.
- [ ] Confirmar que TypeScript zero erros e build limpo (/ 222 kB, /admin 204 kB).
