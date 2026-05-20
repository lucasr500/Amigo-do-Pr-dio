# Smoke Test Interno — Amigo do Prédio

Este checklist não substitui teste com síndicos. Ele é apenas validação interna do fundador.

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
- [ ] Criar 6+ itens e verificar overflow.
- [ ] Concluir item e verificar Timeline.

## 5. Assistente

- [ ] Perguntar sobre barulho.
- [ ] Perguntar sobre inadimplência.
- [ ] Perguntar sobre assembleia.
- [ ] Perguntar sobre obra.
- [ ] Perguntar sobre funcionário.
- [ ] Fazer pergunta fora do escopo.
- [ ] Testar botão Voltar.

## 6. Ferramentas

- [ ] Comunicado.
- [ ] Checklist.
- [ ] Multa.
- [ ] Reajuste.

## 7. Backup

- [ ] Exportar.
- [ ] Limpar `localStorage`.
- [ ] Importar.
- [ ] Verificar dados restaurados.

## 8. PWA

- [ ] Instalar no iPhone/Android quando possível.
- [ ] Verificar safe-area.
- [ ] Verificar bottom nav.
- [ ] Verificar scroll.
- [ ] Verificar input de data.

## 9. /admin

- [ ] Rodar auditoria.
- [ ] Registrar recall.
- [ ] Registrar categorias problemáticas.
