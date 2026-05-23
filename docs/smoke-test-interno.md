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

## 22. Fase 83 — Agenda Central, Home sem redundância e Minha Conta

### AgendaMensal na Home

- [ ] Com dados cadastrados, abrir a aba Início e confirmar que `AgendaMensal` aparece entre `HomeCondominioHub` e `GuidancePanel`.
- [ ] Confirmar título "Agenda do mês", mês e ano atuais, subtítulo "Compromissos, prazos e acompanhamentos do prédio."
- [ ] Confirmar grade com 7 colunas (Dom a Sáb), dias do mês corretos.
- [ ] Confirmar que hoje está destacado (fundo navy-100 ou navy-700 se selecionado).
- [ ] Confirmar que dia selecionado padrão é hoje.
- [ ] Tocar em um dia sem eventos — confirmar "Nada agendado para este dia."
- [ ] Criar evento na Agenda (Ferramentas → Rotina → Agenda) para o dia de hoje. Voltar à Home. Confirmar dot no dia de hoje.
- [ ] Tocar no dia — confirmar que o evento aparece como "Tipo · Título truncado" (sem nota).
- [ ] Confirmar que a nota do evento NÃO aparece na Home.
- [ ] Confirmar CTA "+ Agendar neste dia" navega para Ferramentas → Rotina do síndico com AgendaPredio visível.
- [ ] Cadastrar AVCB com data no mês atual. Confirmar dot no dia do vencimento. Tocar no dia — confirmar item "AVCB" (label genérico).
- [ ] Sem dados cadastrados, confirmar que AgendaMensal NÃO aparece (exibe Hero).
- [ ] Confirmar que AgendaMensal NÃO exibe modal complexo, recorrência, integração externa ou push.

### HomeAcaoHub enxugado

- [ ] Confirmar título "Próximos passos do prédio" (não "O que fazer agora").
- [ ] Confirmar que o bloco "Próxima data" / "Próximo na agenda" NÃO existe mais no HomeAcaoHub.
- [ ] Confirmar que o CTA "Ver agenda →" NÃO existe mais no HomeAcaoHub.
- [ ] Confirmar que CTA "+ Registrar ocorrência →" continua funcionando e navega para Ferramentas.
- [ ] Confirmar que CTA "Perguntar ao Assistente →" navega para a aba Assistente.
- [ ] Confirmar que revisão semanal, pendências (add/complete) e telemetria continuam funcionando.

### BottomNav — Minha Conta

- [ ] Confirmar que a quarta aba exibe "Minha Conta" (não "Condomínio").
- [ ] Confirmar que a aba abre a mesma tela de antes (OnboardingProfile, MemoriaPanel, Timeline, etc.).
- [ ] Confirmar que o título interno da aba ainda exibe "Conta & Dados" quando há dados (inalterado).
- [ ] Confirmar que todas as seções da aba Minha Conta continuam funcionando.

### Assistente — Temas com perguntas

- [ ] Abrir aba Assistente, confirmar grade de temas com título do tema e "Ver perguntas →" em cada card.
- [ ] Clicar em um tema (ex: "Multas e advertências") — confirmar que aparece lista de perguntas, não dispara query imediatamente.
- [ ] Confirmar botão "← Temas" volta à grade sem erros.
- [ ] Clicar em uma pergunta — confirmar que preenche o input (sem auto-submeter).
- [ ] Confirmar que cada tema tem ao menos 4 perguntas listadas.
- [ ] Confirmar que o fluxo colapsado ("Perguntar sobre outro tema") também funciona com a nova estrutura de temas.
- [ ] Confirmar que o motor de busca, KB e lib/data.ts estão inalterados.

### Hierarquia da Home com dados (Fase 83)

- [ ] Confirmar ordem: HomeCondominioHub → AgendaMensal → GuidancePanel → HomeAcaoHub (enxugado) → Contextual/Dica.
- [ ] Confirmar que AgendaMensal aparece ANTES do GuidancePanel.
- [ ] Confirmar que GuidancePanel continua mostrando alertas detalhados com resolve actions.
- [ ] Confirmar que não há bloco de "Próxima data" redundante na Home.
- [ ] Confirmar que AgendaPredio continua disponível em Ferramentas → Rotina do síndico (inalterada).

### Regressões (Fase 83)

- [ ] Confirmar TypeScript zero erros (`npx tsc --noEmit`).
- [ ] Confirmar build limpo (`npx next build`) com bundle / ≤ 230 kB.
- [ ] Confirmar que Backup export/import continua funcionando (agenda incluída no backup v4).
- [ ] Confirmar que GuidancePanel resolve actions (AVCB, Seguro, etc.) continuam funcionando.
- [ ] Confirmar que link da Home "Registrar ocorrência" ainda navega corretamente para Ferramentas.
- [ ] Confirmar que link de RevisaoMensal ainda abre aba Minha Conta e rola até seção correta.
- [ ] Confirmar que AgendaPredio em Ferramentas não foi alterada.
- [ ] Confirmar que HomeCondominioHub (saúde operacional) está inalterado.
- [ ] Confirmar que lib/knowledge.json, lib/data.ts, lib/guidance.ts, motor de busca e simuladores estão inalterados.

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

## 23. Validação pós-Fase 84 — Assistente e Saúde Operacional

Objetivo: verificar que as respostas do Assistente aparecem completas no mobile, que a Saúde Operacional é compreensível e que a Home com dados continua coerente. Confirmar que a Agenda Mensal não foi alterada.

Pré-condição: dados cadastrados (AVCB, seguro, mandato, pelo menos 1 pendência aberta).

### Cenário 1 — AVCB vencido

- [ ] Cadastrar AVCB com data passada.
- [ ] Perguntar no Assistente: "O AVCB do prédio venceu. O que devo fazer?"
- [ ] Confirmar que a resposta completa aparece imediatamente (sem efeito de digitação character-by-character).
- [ ] Confirmar que não há corte visual de texto no final da resposta.
- [ ] Confirmar que os blocos "Próximo passo", "Contexto do prédio", "Base legal" e "Dica prática" aparecem abaixo da resposta principal.
- [ ] Confirmar que a resposta não parece ter sido truncada.

### Cenário 2 — Obra sem autorização

- [ ] Perguntar: "Morador está fazendo obra sem autorização. Como proceder?"
- [ ] Confirmar que a resposta aparece completa e imediatamente.
- [ ] Confirmar que o bloco "Próximo passo" é exibido com ação concreta.
- [ ] Confirmar ausência de cursor piscante após o texto da resposta.

### Cenário 3 — Barulho

- [ ] Perguntar: "Morador está fazendo barulho depois da meia-noite. O que fazer?"
- [ ] Confirmar resposta completa e imediata da KB.
- [ ] Confirmar bloco "Contexto do prédio" com sugestão de registrar como ocorrência.
- [ ] Confirmar que o texto não aparece cortado em nenhum ponto.

### Cenário 4 — Inadimplente no grupo

- [ ] Perguntar: "Posso expor o nome do inadimplente no grupo do WhatsApp?"
- [ ] Confirmar resposta completa e sem truncamento.
- [ ] Confirmar disclaimer jurídico ao final.
- [ ] Confirmar que toda a resposta está visível sem necessidade de ação extra do usuário.

### Cenário 5 — Fallback fora da base

- [ ] Perguntar algo completamente fora do escopo: "Qual é a previsão do tempo amanhã?"
- [ ] Confirmar que o fallback aparece imediatamente e completo.
- [ ] Confirmar que os chips de categoria aparecem corretamente abaixo.
- [ ] Confirmar ausência de truncamento ou cursor.

### Cenário 6 — Resposta longa em viewport mobile

- [ ] Com app em viewport ~390px (iPhone padrão), perguntar: "Quais são os deveres do síndico segundo o Código Civil?"
- [ ] Confirmar que a resposta aparece completa sem corte.
- [ ] Confirmar que o scroll natural da página permite ver toda a resposta e os blocos auxiliares.
- [ ] Confirmar que não há `overflow-hidden`, `max-height` restritivo ou clamp no card de resposta.

### Cenário 7 — Saúde Operacional explica como melhorar

- [ ] Acessar a Home com dados cadastrados.
- [ ] Localizar o card de Saúde Operacional (porcentagem + barra + badge de status).
- [ ] Confirmar que abaixo da frase diagnóstica aparece: "Considera dados cadastrados, alertas ativos, próximos passos e revisão semanal."
- [ ] Confirmar que abaixo dessa linha aparece: "Para melhorar: resolva alertas, conclua passos e mantenha os prazos atualizados."
- [ ] Confirmar que o card não aumentou excessivamente em altura.
- [ ] Confirmar que a porcentagem, barra e badge de status continuam exibidos normalmente.
- [ ] Confirmar que o cálculo do índice não foi alterado.

### Cenário 8 — Home com dados continua clara

- [ ] Confirmar hierarquia da Home com dados: HomeCondominioHub → AgendaMensal → GuidancePanel → HomeAcaoHub.
- [ ] Confirmar que HomeAcaoHub exibe CTA "Perguntar ao Assistente →" e "+ Registrar ocorrência →".
- [ ] Confirmar que os dois CTAs navegam corretamente (Assistente e Ferramentas → Rotina).
- [ ] Confirmar que não há redundância entre os blocos (saúde, agenda, alertas, próximos passos com responsabilidades distintas).

### Cenário 9 — AgendaMensal não foi alterada

- [ ] Confirmar que a Agenda Mensal ainda exibe o calendário do mês corrente.
- [ ] Confirmar que ao tocar em um dia com eventos, a lista aparece abaixo.
- [ ] Confirmar que CTA "+ Agendar neste dia" navega para Ferramentas → Rotina do síndico → Agenda.
- [ ] Confirmar que os vencimentos automáticos (AVCB, Seguro etc.) ainda aparecem no calendário quando há datas cadastradas.
- [ ] Confirmar que `components/AgendaMensal.tsx` não foi modificado na Fase 84.

### Cenário 10 — Regressões

- [ ] Confirmar que QuickAccessCards (tema→perguntas→preenche input) continua funcionando normalmente.
- [ ] Confirmar que GuidancePanel continua exibindo alertas e próximos passos corretamente.
- [ ] Confirmar que AgendaPredio em Ferramentas continua funcionando normalmente.
- [ ] Confirmar que backup exporta e importa sem erro.
- [ ] Confirmar que TypeScript zero erros e build limpo (/ ≤ 230 kB, /admin 204 kB).

## 25. Fase 86 — Agenda Mensal v2: Ícones Operacionais

Objetivo: confirmar que a Agenda Mensal exibe ícones visuais discretos na grade e na lista do dia, sem quebrar layout, sem poluir a Home e sem alterar qualquer outra feature.

Pré-condição: dados cadastrados (AVCB, Seguro, Mandato com datas no mês corrente ou no próximo mês). Ao menos um evento manual na Agenda (Ferramentas → Rotina → Agenda) com data no mês corrente.

### Cenário 1 — Mês vigente aparece corretamente

- [ ] Abrir a Home com dados cadastrados.
- [ ] Confirmar que o componente `AgendaMensal` aparece entre `HomeCondominioHub` e `GuidancePanel`.
- [ ] Confirmar título "Agenda do mês", mês e ano atuais em português.
- [ ] Confirmar subtítulo "Compromissos, prazos e acompanhamentos do prédio."
- [ ] Confirmar grade 7 colunas (Dom a Sáb) com todos os dias do mês corrente.

### Cenário 2 — Evento manual aparece com ícone

- [ ] Criar evento manual do tipo "Manutenção" com data no mês atual via Ferramentas → Rotina → Agenda.
- [ ] Voltar à Home.
- [ ] Confirmar que o dia do evento tem ícone(s) abaixo do número (não mais o dot de 3px).
- [ ] Confirmar que o ícone do tipo "Manutenção" é 🛠️.
- [ ] Tocar no dia — confirmar que a lista exibe 🛠️ à esquerda + "Manutenção" em negrito + título do evento abaixo.
- [ ] Confirmar que a nota do evento NÃO aparece na lista (apenas título truncado).

### Cenário 3 — AVCB aparece com ícone específico

- [ ] Cadastrar AVCB com data no mês atual.
- [ ] Confirmar que o dia do vencimento tem ícone na grade.
- [ ] Confirmar que o ícone do AVCB é 🧯.
- [ ] Tocar no dia — confirmar item com 🧯 + "AVCB" + "Vencimento monitorado".

### Cenário 4 — Seguro aparece com ícone específico

- [ ] Cadastrar Seguro com data no mês atual.
- [ ] Confirmar ícone 🛡️ na grade no dia do vencimento.
- [ ] Tocar no dia — confirmar item com 🛡️ + "Seguro" + "Vencimento monitorado".

### Cenário 5 — Mandato aparece com ícone específico

- [ ] Cadastrar Mandato com data no mês atual.
- [ ] Confirmar ícone 🗳️ na grade no dia do vencimento.
- [ ] Tocar no dia — confirmar item com 🗳️ + "Mandato" + "Vencimento monitorado".

### Cenário 6 — Múltiplos eventos no mesmo dia não quebram layout

- [ ] Criar 3 ou mais eventos/vencimentos para o mesmo dia.
- [ ] Confirmar que a célula exibe no máximo 2 ícones + "+N" para o excedente (ex: "+1").
- [ ] Confirmar que a célula não aumenta de altura nem transborda a grade.
- [ ] Confirmar que a grade permanece legível e alinhada em viewport mobile (375px e 320px).
- [ ] Tocar no dia — confirmar que todos os eventos aparecem na lista abaixo da grade.

### Cenário 7 — Clicar no dia mostra lista clara

- [ ] Tocar em um dia com eventos mistos (sistema + manual).
- [ ] Confirmar que cada item tem: ícone emoji à esquerda, label em negrito, subtítulo discreto.
- [ ] Confirmar que "Vencimento monitorado" aparece apenas em entradas de sistema.
- [ ] Confirmar que entradas manuais exibem o título truncado como subtítulo.
- [ ] Confirmar que a lista tem espaçamento adequado entre itens (não colada, não espaçada demais).
- [ ] Confirmar que não há modal, edição inline ou nova rota ao tocar em item da lista.

### Cenário 8 — Botão "+ Agendar neste dia" continua funcionando

- [ ] Com qualquer dia selecionado, confirmar que o botão "+ Agendar neste dia" aparece abaixo da lista.
- [ ] Tocar no botão — confirmar que navega para Ferramentas → Rotina do síndico com AgendaPredio visível.
- [ ] Confirmar que o formulário de novo evento na AgendaPredio não foi alterado.

### Cenário 9 — Agenda permanece estética e não poluída

- [ ] Confirmar que os ícones na grade são pequenos e discretos (não dominam o número do dia).
- [ ] Confirmar que dias sem eventos permanecem limpos (sem ícone, sem ponto).
- [ ] Confirmar legenda ao final do painel: "Ícones indicam vencimentos e eventos operacionais do prédio."
- [ ] Confirmar que a legenda é texto simples, sem lista de ícones, sem cor chamativa.
- [ ] Confirmar que o componente inteiro continua dentro do card arredondado com estética Navy/Cream.

### Cenário 10 — Home não foi reestruturada

- [ ] Confirmar que `HomeCondominioHub` aparece antes da `AgendaMensal`.
- [ ] Confirmar que `GuidancePanel` aparece depois da `AgendaMensal`.
- [ ] Confirmar que `HomeAcaoHub` aparece depois do `GuidancePanel`.
- [ ] Confirmar que nenhum componente da Home foi removido, adicionado ou reordenado.
- [ ] Confirmar que `AgendaPredio` em Ferramentas → Rotina do síndico está intacta e funcionando.
- [ ] Confirmar que Assistente, Ferramentas, Minha Conta e BottomNav estão inalterados.
- [ ] Confirmar TypeScript zero erros e build limpo (/ 223 kB, /admin 204 kB).

## 24. Fase 85 — Legibilidade Mobile do Assistente

Objetivo: confirmar que as respostas do Assistente aparecem sem cursor residual, com separação visual clara entre resposta principal e blocos auxiliares, e com legibilidade confortável em respostas longas no mobile.

Pré-condição: dados cadastrados (AVCB, seguro, mandato). App com cache limpo (hard reload no mobile).

### Cenário 1 — Pergunta curta

- [ ] Perguntar: "Posso multar morador por barulho?"
- [ ] Confirmar que a resposta aparece imediatamente e completa.
- [ ] Confirmar que não há cursor "|" visível após o texto.
- [ ] Confirmar que não há nenhuma animação de digitação character-by-character.
- [ ] Confirmar que os blocos auxiliares (Próximo passo, Base legal etc.) aparecem separados por uma linha divisória discreta.

### Cenário 2 — Pergunta média

- [ ] Perguntar: "Quando posso convocar assembleia extraordinária?"
- [ ] Confirmar resposta imediata e completa.
- [ ] Confirmar separação visual clara entre texto principal e blocos auxiliares.
- [ ] Confirmar que a linha divisória (`border-t`) está visível entre o texto principal e o primeiro bloco auxiliar.
- [ ] Confirmar que os blocos auxiliares têm espaçamento confortável entre si.

### Cenário 3 — Pergunta longa sobre obra sem autorização

- [ ] Perguntar: "Morador está fazendo obra sem autorização no apartamento. Quais são os passos?"
- [ ] Confirmar que toda a resposta aparece completa sem corte visual.
- [ ] Confirmar que não há scroll interno no card (a página inteira rola).
- [ ] Confirmar que os blocos "Próximo passo", "Contexto do prédio" (se aplicável), "Base legal" e "Dica prática" aparecem abaixo da linha divisória, cada um com seu label em uppercase.
- [ ] Confirmar que o botão "Salvar nos próximos passos" aparece funcional no bloco Próximo passo.
- [ ] Confirmar que as action pills (Salvar, Copiar, WhatsApp, Refazer, Nova pergunta) aparecem após os blocos.

### Cenário 4 — Pergunta longa sobre AVCB vencido

- [ ] Cadastrar AVCB com data passada.
- [ ] Perguntar: "O AVCB do prédio venceu. Quais são as consequências e o que devo fazer?"
- [ ] Confirmar bloco "Contexto do prédio" aparece com menção ao AVCB cadastrado.
- [ ] Confirmar que toda a resposta, incluindo os blocos auxiliares, é visível ao rolar a página.
- [ ] Confirmar que o final da resposta (disclaimer jurídico) aparece sem estar cortado.

### Cenário 5 — Pergunta fora da base (fallback)

- [ ] Perguntar: "Como instalar câmera de segurança de forma legal?"
- [ ] Confirmar que o fallback aparece imediatamente e completo.
- [ ] Confirmar que os chips de categoria e sugestões contextuais aparecem normalmente.
- [ ] Confirmar que não há cursor "|" no fallback.

### Cenário 6 — Verificar ausência de cursor

- [ ] Fazer qualquer pergunta que retorne resposta da KB.
- [ ] Observar o momento em que a resposta aparece: não deve haver cursor piscante "|".
- [ ] Confirmar que o texto aparece completo de uma vez, com fade-in suave.
- [ ] Aguardar 3 segundos após a resposta aparecer e confirmar que o texto está estático (sem mais animação).

### Cenário 7 — Verificar ausência de scroll interno

- [ ] Fazer pergunta que gere resposta longa com todos os blocos: Próximo passo + Contexto + Base legal + Dica.
- [ ] Tentar rolar dentro do card de resposta: não deve haver scroll independente dentro do card.
- [ ] Confirmar que rolar a página move toda a tela normalmente.
- [ ] Confirmar que não há barra de scroll lateral dentro do card.

### Cenário 8 — Rolagem natural da página

- [ ] Em viewport mobile (~390px), fazer pergunta com resposta longa.
- [ ] Confirmar que a página rola suavemente para mostrar todos os blocos auxiliares.
- [ ] Confirmar que o último elemento visível (action pills ou disclaimer) tem margem inferior confortável antes do BottomNav.
- [ ] Confirmar que nenhum bloco fica cortado pelo BottomNav.

### Cenário 9 — Blocos auxiliares completos

- [ ] Confirmar que os blocos auxiliares aparecem com labels em uppercase (PRÓXIMO PASSO, CONTEXTO DO PRÉDIO, BASE LEGAL, DICA PRÁTICA).
- [ ] Confirmar que cada bloco tem conteúdo completo e legível.
- [ ] Confirmar que o espaçamento entre blocos é suficiente para distingui-los visualmente.
- [ ] Confirmar que o disclaimer jurídico final aparece completo.

### Cenário 10 — Resposta longa parece completa e acionável

- [ ] Ao final de uma resposta longa, confirmar que o botão "Salvar nos próximos passos" está visível e funcional.
- [ ] Confirmar que as action pills (Copiar, WhatsApp, Refazer) aparecem após todos os blocos.
- [ ] Confirmar que a separação visual entre resposta principal e blocos auxiliares reforça a percepção de "resposta completa + camadas de contexto".
- [ ] Confirmar que nenhuma resposta parece interrompida ou truncada.
- [ ] Confirmar que TypeScript zero erros e build limpo (/ ≤ 230 kB, /admin 204 kB).

## 26. Fases 87/88/89A — Onboarding, Conta e Stubs de Arquitetura

Objetivo: confirmar que o overlay de onboarding funciona corretamente para novos usuários, não aparece para usuários existentes, e que a seção "Conta e sincronização" exibe o estado correto.

Pré-condição: ter acesso ao console do browser para manipular `localStorage` conforme indicado.

### Cenário 1 — Onboarding exibido para novo usuário

- [ ] Limpar `localStorage` completamente (DevTools → Application → Clear storage).
- [ ] Recarregar o app.
- [ ] Confirmar que o overlay do OnboardingFlow aparece automaticamente sobre a Home.
- [ ] Confirmar que o overlay tem fundo cream `#F7F1E8` com backdrop escuro semitransparente.
- [ ] No mobile: confirmar que é um bottom sheet com `border-radius` no topo.
- [ ] No desktop: confirmar que é um card centrado na tela.

### Cenário 2 — Etapa 1: Boas-vindas

- [ ] Confirmar título "Bem-vindo ao Amigo do Prédio" (ou equivalente) e subtítulo descritivo.
- [ ] Confirmar botão "Começar" e link "Pular configuração".
- [ ] Confirmar que os 4 dots de progresso aparecem abaixo — dot 1 ativo (pill largo), dots 2–4 menores.
- [ ] Clicar "Pular configuração" — confirmar que o overlay fecha e a Home é exibida normalmente.
- [ ] Reabrir o app (mesmo localStorage) — confirmar que o overlay NÃO aparece novamente.

### Cenário 3 — Pular configuração grava a flag

- [ ] Após pular, verificar no localStorage: `amigo_onboarding_complete` = `true`.
- [ ] Verificar que `amigo_profile` NÃO foi criado (pular não salva perfil vazio).

### Cenário 4 — Etapa 2: Dados do condomínio

- [ ] Limpar localStorage novamente e recarregar.
- [ ] No overlay, clicar "Começar".
- [ ] Confirmar etapa 2 com campo "Nome do condomínio", chips "Síndico morador" / "Síndico profissional", chips "Sim" / "Não" para elevador.
- [ ] Preencher nome e selecionar chips.
- [ ] Confirmar dot 2 ativo e botão "Continuar" habilitado.
- [ ] Clicar "Pular" — confirmar que avança para etapa 3 sem salvar dados.

### Cenário 5 — Etapa 3: Datas de vencimento

- [ ] Confirmar etapa 3 com inputs de data para AVCB, Seguro e Mandato.
- [ ] Confirmar descrição abaixo de cada campo explicando o que é.
- [ ] Preencher ao menos uma data.
- [ ] Clicar "Continuar" — confirmar que avança para etapa 4.
- [ ] Clicar "Pular etapa" — confirmar que avança para etapa 4 sem salvar datas.

### Cenário 6 — Etapa 4: Resumo e conclusão

- [ ] Confirmar etapa 4 com ícone de check e resumo dos dados preenchidos.
- [ ] Confirmar badge "Dados salvos neste dispositivo".
- [ ] Confirmar card neutro "Sincronização em nuvem — Em breve" com badge "Em breve".
- [ ] Clicar "Ir para o app" — confirmar que o overlay fecha.
- [ ] Confirmar que a Home atualiza (dados preenchidos aparecem se há perfil/memória).
- [ ] Confirmar que `amigo_onboarding_complete` = `true` no localStorage.

### Cenário 7 — Dados salvos após onboarding completo

- [ ] Completar o onboarding preenchendo nome do condomínio (etapa 2) e datas (etapa 3).
- [ ] Após fechar o overlay, ir para aba Condomínio.
- [ ] Confirmar que o nome do condomínio está salvo no OnboardingProfile.
- [ ] Confirmar que as datas de AVCB/Seguro/Mandato aparecem no MemoriaPanel.

### Cenário 8 — Usuário existente não vê onboarding

- [ ] Com dados já cadastrados e flag `amigo_onboarding_complete` presente, recarregar o app.
- [ ] Confirmar que o overlay NÃO aparece.
- [ ] Confirmar que a Home exibe normalmente: HomeCondominioHub, AgendaMensal, GuidancePanel.
- [ ] Navegar entre abas — confirmar que nenhum overlay aparece em nenhuma aba.

### Cenário 9 — Seção "Conta e sincronização" em Minha Conta

- [ ] Abrir aba "Minha Conta" (aba Condomínio).
- [ ] Rolar até o final da tela.
- [ ] Confirmar seção "Conta" com ícone 💾 e texto "Dados salvos neste dispositivo".
- [ ] Confirmar subtítulo "Armazenamento local — sem conta necessária".
- [ ] Confirmar card aninhado com ☁️ "Sincronização em nuvem" + subtítulo "Em breve — seus dados, em qualquer dispositivo" + badge "Em breve".
- [ ] Confirmar que nenhum botão de login, input de e-mail ou formulário aparece.
- [ ] Confirmar que o card é puramente informativo e não tem ação clicável.

### Cenário 10 — Regressões

- [ ] Confirmar que todos os componentes da aba Condomínio continuam funcionando: OnboardingProfile, MemoriaPanel, TimelineOperacional, RevisaoMensal, BackupPanel.
- [ ] Confirmar que exportar e importar backup continuam sem erro.
- [ ] Confirmar que a Home com dados (HomeCondominioHub → AgendaMensal → GuidancePanel → HomeAcaoHub) continua íntegra.
- [ ] Confirmar que Assistente, Ferramentas e BottomNav estão inalterados.
- [ ] Confirmar TypeScript zero erros e build limpo (/ 224 kB, /admin 204 kB).
