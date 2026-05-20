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
- [ ] Confirmar StatusHeader, GuidancePanel e ProximasDatas.

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

## 5. Registro rápido

- [ ] Registrar ocorrência de barulho com descrição curta.
- [ ] Confirmar que não há linguagem de livro oficial, denúncia ou protocolo.
- [ ] Marcar criação de próximo passo e confirmar chip “Ocorrência”.
- [ ] Confirmar ocorrência no Histórico operacional sem descrição livre.
- [ ] Gerar mensagem administrativa copiável.
- [ ] Copiar mensagem e confirmar que o texto é editável antes da cópia.
- [ ] Confirmar que a mensagem não expõe unidade, nome ou descrição da ocorrência.

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

- [ ] Comunicado.
- [ ] Checklist.
- [ ] Multa.
- [ ] Reajuste.

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
- [ ] Confirmar que Próximos Passos deixa claro o ciclo dúvida → ação → acompanhamento.
- [ ] Confirmar que Revisão Mensal e Timeline explicam por que voltar ao app.
- [ ] Confirmar que Backup informa dados locais e proteção sem login.
- [ ] Confirmar que o Assistente não parece advogado virtual, consultoria jurídica ou substituto da administradora.
