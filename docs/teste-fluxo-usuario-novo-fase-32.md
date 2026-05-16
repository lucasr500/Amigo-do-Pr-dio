# Teste de Fluxo — Usuário Novo — Fase 32

> Roteiro de teste para validar a experiência de primeiro acesso.
> Objetivo: novo dispositivo, zero dados salvos, sem instrução prévia.
> Executado em: 2026-05-13

---

## Setup

- Limpar localStorage: DevTools → Application → Storage → Clear site data
- Ou usar aba anônima / novo perfil do navegador
- URL: `http://localhost:3000` (dev) ou URL de produção

---

## Fluxo 1 — Primeiro acesso e onboarding

| Passo | Ação | Resultado esperado | Status |
|---|---|---|---|
| 1 | Abrir o app pela primeira vez | Aba Início carrega sem erro | |
| 2 | Observar o OnboardingProfile | Aparece como card expandido ou mensagem de boas-vindas | |
| 3 | Preencher nome do condomínio | Campo aceita texto, salva ao confirmar | |
| 4 | Navegar para aba Condomínio | Perfil preenchido aparece em MemoriaPanel | |
| 5 | Cadastrar uma data de vencimento | Data aparece em CondominioStatusHeader | |
| 6 | Voltar para aba Início | GuidancePanel mostra pelo menos 1 item operacional | |

**Atenção:** Se o GuidancePanel não aparecer após cadastrar datas, verificar se `hasMemoriaOperacional()` retorna true.

---

## Fluxo 2 — Assistente sem dados cadastrados

| Passo | Ação | Resultado esperado | Status |
|---|---|---|---|
| 1 | Ir para aba Assistente sem nenhum dado cadastrado | Campo de pergunta aparece limpo | |
| 2 | Perguntar: "Quantas advertências antes de multar?" | Retorna `advertencia-antes-multar` com score ≥ 14 | |
| 3 | Perguntar: "O síndico tem voto de desempate?" | Retorna `voto-desempate-sindico` | |
| 4 | Perguntar: "O condomínio pode proibir Airbnb?" | Retorna `locacao-temporada-airbnb` | |
| 5 | Perguntar: "Como documentar uma infração?" | Retorna `registro-infracao-procedimento` | |
| 6 | Perguntar algo fora do domínio: "Qual o melhor celular?" | Retorna fallback, não resposta inventada | |
| 7 | Usar um QuickAccessCard | Resposta correta é retornada | |

---

## Fluxo 3 — ComunicadoPanel sem perfil

| Passo | Ação | Resultado esperado | Status |
|---|---|---|---|
| 1 | Ir para aba Ferramentas sem nenhum dado cadastrado | ComunicadoPanel aparece com 4 modelos | |
| 2 | Selecionar modelo "Assembleia" | Formulário com campos aparece | |
| 3 | Observar hint de perfil | Deve aparecer: "Nome do condomínio vazio — cadastre em Condomínio → Perfil..." | |
| 4 | Deixar todos campos vazios | Botão "Copiar comunicado" deve estar desabilitado (opacity reduzida) | |
| 5 | Preencher um campo | Botão habilita | |
| 6 | Clicar "Copiar comunicado" | Texto copiado para clipboard, botão fica verde "Comunicado copiado" | |
| 7 | Esperar 3 segundos | Botão volta ao estado normal | |
| 8 | Prévia do comunicado | Nome do condomínio aparece como linha em branco (sem nome) | |
| 9 | Cadastrar perfil em outra aba e voltar | Nome do condomínio deve aparecer na prévia após recarregar o componente (nota: pode precisar reabrir o modelo) | |

---

## Fluxo 4 — SimuladorMulta edge cases

| Passo | Ação | Resultado esperado | Status |
|---|---|---|---|
| 1 | Ir para aba Ferramentas | SimuladorMulta aparece | |
| 2 | Deixar cota vazia e clicar Calcular | Botão desabilitado ou nada acontece | |
| 3 | Inserir cota: "0" | Botão desabilitado (cotaNum === 0) | |
| 4 | Inserir cota negativa: "-100" | cotaNum clampado para 0, botão desabilitado | |
| 5 | Inserir cota: "500" | Botão habilita | |
| 6 | Clicar Calcular com 1 mês | Tabela aparece com 1 linha | |
| 7 | Mover slider para 12 meses | Tabela mostra 12 linhas | |
| 8 | Tentar digitar meses > 12 no campo | Valor clampado para 12 | |
| 9 | Inserir cota muito alta: "999999" | Calcula sem crash, valores grandes formatados | |
| 10 | Inserir cota com vírgula: "1.500,00" | Parser trata vírgula como separador decimal corretamente | |
| 11 | Alterar taxa de juros | Resultado reseta (não mantém resultado anterior) | |

---

## Fluxo 5 — Navegação entre abas

| Passo | Ação | Resultado esperado | Status |
|---|---|---|---|
| 1 | Navegar rapidamente entre as 4 abas | Sem crash, sem estado inconsistente | |
| 2 | Voltar para aba Início após preencher formulário em outra aba | Aba Início mantém seu estado | |
| 3 | Fechar e reabrir o app | Dados do perfil persistem via localStorage | |
| 4 | Navegar para aba Ferramentas pela primeira vez | Componentes carregam via dynamic import (pode haver breve loading) | |

---

## Fluxo 6 — Backup

| Passo | Ação | Resultado esperado | Status |
|---|---|---|---|
| 1 | Preencher perfil completo + datas + checklist | Dados salvos em localStorage | |
| 2 | Aba Condomínio → BackupPanel → Exportar | Arquivo JSON baixa, conteúdo legível | |
| 3 | Limpar localStorage | Todos os dados somem | |
| 4 | Importar o backup | Dados restaurados sem erro | |
| 5 | Tentar importar arquivo inválido (ex: .txt) | Erro amigável, sem crash | |

---

## Microcopy e textos — checklist editorial

- [ ] Onboarding: linguagem acolhedora, não técnica
- [ ] GuidancePanel: itens formulados como ação ("Vencimento de seguro em X dias")
- [ ] ComunicadoPanel: hint de perfil vazio aparece no lugar certo, tom discreto
- [ ] SimuladorMulta: disclaimer menciona "estimativa" e "consulte a convenção"
- [ ] Assistente: fallback contextual sugere categoria relevante, não apenas "não sei"
- [ ] Assistente: disclaimer jurídico visível abaixo de toda resposta
- [ ] BottomNav: labels claras, ícones consistentes com o conteúdo da aba

---

## Resultado final

| Fluxo | Passou | Observações |
|---|---|---|
| 1 — Onboarding | | |
| 2 — Assistente | | |
| 3 — ComunicadoPanel | | |
| 4 — SimuladorMulta | | |
| 5 — Navegação | | |
| 6 — Backup | | |

---

*Documento interno — Amigo do Prédio*
*Versão: 2026-05-13 (Fase 32)*
