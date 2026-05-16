# Rascunho — Política de Privacidade
## Amigo do Prédio

> **Documento interno — rascunho pré-jurídico.**
> Este rascunho foi elaborado em conformidade com os princípios da LGPD (Lei 13.709/2018).
> Não publicar sem revisão por advogado especializado em proteção de dados. Versão: 2026-05-16 (Fase 38).

---

## Política de Privacidade — Amigo do Prédio

**Última atualização:** [data]

### 1. Identificação do Controlador

**Amigo do Prédio** — [razão social / nome do responsável a definir]
E-mail: [contato de privacidade a definir]

### 2. Dados Coletados e Finalidade

O Amigo do Prédio foi projetado com o princípio de **mínimo de dados** desde a concepção (privacy by design).

#### 2.1 Dados armazenados localmente (no dispositivo do usuário)

Os seguintes dados ficam armazenados **apenas no dispositivo do usuário** (localStorage do navegador), nunca são enviados para servidores externos:

| Dado | Finalidade | Controlado por |
|------|------------|----------------|
| Nome do condomínio | Personalização da interface | Usuário (editável/deletável) |
| Características (elevador, piscina, funcionários, tipo de síndico) | Personalização da interface | Usuário (editável/deletável) |
| Datas operacionais (vencimentos, assembleias) | Monitoramento e alertas | Usuário (editável/deletável) |
| Histórico de perguntas ao Assistente | Histórico pessoal | Usuário (deletável via backup/limpar) |
| Favoritos salvos | Acesso rápido | Usuário (deletável) |
| Progresso de checklists | Rastreamento de tarefas | Usuário (deletável via reset) |

**Estes dados não saem do dispositivo.** O fundador não tem acesso a eles.

#### 2.2 Dados de telemetria (quando Supabase estiver configurado)

O Amigo do Prédio pode coletar, de forma anônima, os seguintes eventos de uso:

| Dado | Finalidade | O que NÃO é coletado |
|------|------------|----------------------|
| Tipo de ação realizada (ex: "pergunta feita", "comunicado gerado") | Melhoria do produto | Conteúdo das perguntas completo |
| Categoria da pergunta identificada | Análise de uso da KB | Dados pessoais do síndico |
| Contador de campos preenchidos (número) | Entender adoção de ferramentas | Conteúdo dos campos de texto |
| Meses de atraso no simulador (número) | Entender perfil de uso | Valor da cota ou nome do devedor |
| Identificador de sessão anônimo | Contar usuários únicos | IP, nome, e-mail ou qualquer dado identificável |
| Duração da sessão (segundos) | Engajamento | Localização ou dispositivo |

O texto das perguntas feitas ao Assistente é truncado em **80 caracteres** e não inclui dados pessoais de moradores.

Nenhum dado financeiro (valores de cota, débitos) é armazenado nos servidores.

### 3. Base Legal (LGPD)

| Tratamento | Base legal (Art. 7º LGPD) |
|------------|---------------------------|
| Dados locais no dispositivo | Legítimo interesse do usuário (dados permanecem no próprio dispositivo) |
| Telemetria de uso | Legítimo interesse do controlador (melhoria do serviço, conforme art. 7º, IX) |

Para coleta de telemetria, o usuário será informado de forma clara na interface antes de qualquer dado ser coletado.

### 4. Compartilhamento de Dados

Os dados de telemetria são armazenados no Supabase (plataforma de banco de dados em nuvem com servidores nos EUA). O Supabase é um subprocessador de dados que possui certificação de segurança adequada.

**O Amigo do Prédio não vende, aluga ou compartilha dados com terceiros para fins de marketing.**

### 5. Retenção de Dados

| Dado | Retenção |
|------|----------|
| Dados locais no dispositivo | Enquanto o usuário não limpar o navegador ou usar a função "Backup e restauração" → apagar dados |
| Dados de telemetria (Supabase) | [a definir — sugestão: 12 meses] |

### 6. Direitos do Titular (LGPD)

O usuário tem direito a:

- **Acesso:** solicitar quais dados temos sobre você
- **Correção:** corrigir dados inexatos
- **Exclusão:** solicitar a eliminação dos dados de telemetria
- **Portabilidade:** exportar dados locais via função "Exportar backup" no app
- **Revogação:** parar de usar o app (dados locais permanecem no dispositivo até limpeza manual)
- **Informação:** saber com quem compartilhamos dados

Para exercer esses direitos: [e-mail de privacidade a definir]

### 7. Segurança

| Medida | Descrição |
|--------|-----------|
| Dados locais | Protegidos pela segurança do próprio dispositivo/navegador |
| Telemetria | Transmitida via HTTPS; armazenada com Row Level Security (RLS) no Supabase |
| Painel admin | Protegido por senha configurada pelo operador |
| Dados sensíveis | Não coletados — por design, não existe campo para nome de moradores ou valores financeiros |

### 8. Cookies e Rastreamento

O Amigo do Prédio **não usa cookies de rastreamento**. O armazenamento local (localStorage) é usado apenas para dados do próprio usuário listados na seção 2.1.

### 9. Usuários Menores

O Amigo do Prédio é destinado a síndicos e profissionais do setor condominial. Não é destinado a menores de 18 anos.

### 10. Alterações nesta Política

Alterações significativas serão comunicadas com no mínimo 30 dias de antecedência. A versão mais recente estará sempre disponível no aplicativo.

### 11. Encarregado de Dados (DPO)

[Nome e contato do DPO a definir, ou indicar que não há DPO formal para operação de pequeno porte com base no art. 41, §3º da LGPD]

---

## Notas para revisão jurídica

> Itens que o advogado especializado em LGPD deve revisar:

1. **Identificação do controlador** — confirmar se é pessoa física (CPF) ou jurídica (CNPJ); a LGPD exige identificação clara
2. **Necessidade de DPO** — para operações de pequeno porte com dados de baixo risco, o DPO não é obrigatório; confirmar
3. **Transferência internacional** — Supabase com servidores nos EUA: verificar mecanismo de adequação (art. 33 LGPD)
4. **Base legal de telemetria** — legitimo interesse é adequado? Verificar se é necessário consentimento explícito
5. **Notificação na interface** — como e quando o usuário será informado da coleta de telemetria?
6. **Retenção** — definir período de retenção dos dados de telemetria (sugestão: 12 meses)
7. **Registro das atividades** — a LGPD recomenda registro das atividades de tratamento (art. 37); preparar internamente
8. **Incidente de segurança** — preparar procedimento para notificação à ANPD em caso de vazamento
9. **Menores** — verificar se é necessário aviso explícito ou verificação de idade

---

*Rascunho interno — Amigo do Prédio*
*Versão: 2026-05-16 (Fase 38) — NÃO PUBLICAR SEM REVISÃO JURÍDICA*
