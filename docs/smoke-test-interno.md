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

## 5. Registro rápido (agora em Ferramentas → Rotina do síndico)

- [ ] Confirmar que na Home aparece atalho discreto “+ Registrar ocorrência” (não o formulário completo).
- [ ] Clicar no atalho e confirmar que navega para Ferramentas, rolando até o Registro rápido.
- [ ] Confirmar que Ferramentas exibe grupos: Rotina do síndico / Comunicados / Simuladores / Checklists.
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

## 8. Ferramentas

- [ ] Confirmar grupos visuais: Rotina do síndico / Comunicados / Simuladores / Checklists.
- [ ] Comunicado.
- [ ] Checklist.
- [ ] Multa.
- [ ] Reajuste.
- [ ] Confirmar que simuladores funcionam igual (lógica não alterada).

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

## 12. Maturidade comercial percebida

- [ ] Confirmar que a Home comunica acompanhamento operacional, não apenas chat.
- [ ] Confirmar que Hub de Saúde Operacional responde "Como está meu prédio agora?" de forma interpretativa.
- [ ] Confirmar que Ferramentas responde "O que posso fazer agora?" com grupos claros.
- [ ] Confirmar que aba Condomínio ("Dados do prédio") responde "Quais dados sustentam o acompanhamento?".
- [ ] Confirmar que Próximos Passos deixa claro o ciclo dúvida → ação → acompanhamento.
- [ ] Confirmar que Revisão Mensal e Timeline explicam por que voltar ao app.
- [ ] Confirmar que Backup informa dados locais e proteção sem login.
- [ ] Confirmar que o Assistente não parece advogado virtual, consultoria jurídica ou substituto da administradora.
