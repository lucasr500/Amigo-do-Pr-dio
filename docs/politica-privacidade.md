# Política de Privacidade — Amigo do Prédio

**Vigência a partir de:** 2026-06-14
**Última atualização:** 2026-06-14

> ⚖️ **Minuta para revisão jurídica final do Lucas (advogado).** Os pontos marcados
> `[DECISÃO DO LUCAS]` dependem de juízo legal ou de dados ainda não definidos e devem
> ser cravados antes da publicação. O texto reflete o que o produto de fato faz hoje
> (ver inventário técnico no histórico do projeto). Não descreve prática que o código
> não execute.

---

## 1. Quem trata seus dados (e em que papel)

O Amigo do Prédio ("AdP", "nós") é um aplicativo web (PWA) de apoio à gestão
condominial. Na LGPD (Lei 13.709/2018), atuamos em **dois papéis diferentes**, e é
importante entender a distinção:

- **Quando se trata da SUA conta e do uso do app**, o AdP é **Controlador** — nós
  decidimos como tratar seu e-mail e seus dados de uso.
- **Quando se trata dos dados de TERCEIROS que você (síndico/gestor) insere** —
  funcionários, fornecedores, moradores, ocorrências — **o condomínio é o Controlador**
  desses dados e **o AdP é apenas Operador**: nós só armazenamos e processamos esses
  dados seguindo a finalidade que você definiu, conforme os Arts. 39 e 42 da LGPD.

**Identificação do Controlador (AdP):**
- Responsável: `[DECISÃO DO LUCAS]` — pessoa física (nome/CPF) ou jurídica (razão social/CNPJ).
- Encarregado pelo Tratamento de Dados (DPO): **Lucas** (fundador). Contato do
  Encarregado e canal de privacidade: `[DECISÃO DO LUCAS — e-mail de privacidade]`.

> **Importante para você, síndico/gestor:** ao inserir dados de outras pessoas, **você
> é responsável** por ter uma base legal para isso (ver Termos de Uso, seção sobre dados
> de terceiros). O AdP oferece a ferramenta; a responsabilidade pelo conteúdo inserido
> sobre terceiros é do condomínio/gestor.

---

## 2. O AdP é offline-first — boa parte dos dados nem sai do seu aparelho

Por padrão, o AdP funciona **no seu próprio dispositivo**:

- **Sem conta:** todos os dados que você cadastra ficam **apenas no seu aparelho**
  (armazenamento local do navegador — `localStorage`). Não são enviados para nenhum
  servidor, e nós não temos acesso a eles.
- **Com conta (login) e sincronização ativada:** para você não perder dados e poder
  usar em mais de um aparelho, o app envia uma **cópia dos seus dados para a nuvem**
  (ver seção 3). A sincronização **segue o login**: usuário anônimo = desligada;
  usuário autenticado = ligada (você pode desativar manualmente).

---

## 3. Quais dados tratamos, de onde vêm e para quê

### 3.1 Dados da sua conta (Controlador: AdP)
| Dado | Origem | Finalidade | Onde fica |
|---|---|---|---|
| E-mail | Você, ao fazer login por link mágico | Autenticar e identificar sua conta | Supabase Auth (`auth.users`) |
| Identificador de perfil, nome de exibição | Gerado/informado | Vincular sua conta aos seus dados | Tabela `profiles` |

### 3.2 Dados operacionais do condomínio e de terceiros (Controlador: condomínio · Operador: AdP)
Quando você usa o app autenticado e sincroniza, uma cópia completa dos seus dados
operacionais é enviada à nuvem (tabela `app_snapshots`, em formato único por usuário).
Isso inclui, conforme o que você cadastrar:
| Categoria | Exemplos de campos | Pode conter dado pessoal de terceiro? |
|---|---|---|
| Perfil do condomínio | nome, características | Não |
| Memória operacional | datas de AVCB, seguro, mandato, manutenções | Não |
| **Funcionários** | função/nome, cargo, admissão, férias, observações | **Sim** |
| **Ocorrências** | descrição (texto livre), local, responsável | **Sim** |
| **Fornecedores** | contato, CNPJ, responsável | **Sim** |
| **Central Digital** (mural, solicitações, enquetes) | autor, contato, nº da unidade | **Sim** |
| Decisões, eventos por unidade, resumo financeiro, checklists, histórico de perguntas, favoritos | vários | Parcial |

Finalidade: permitir a gestão operacional do condomínio (monitoramento de prazos,
comunicação, memória institucional, transparência) e a continuidade dos dados entre
dispositivos e trocas de síndico.

Também são gerados, atrelados à sua conta: `notifications` (avisos do app),
`health_snapshots` (índice de organização, sem dado pessoal), `audit_log` (registro de
ações), e os vínculos `condominios` / `memberships` (qual usuário pertence a qual
condomínio e com qual papel).

### 3.3 Dados de uso (telemetria) (Controlador: AdP)
Coletados de forma **estrutural e sem identificar você**, apenas se a telemetria estiver
configurada:
| Dado | Finalidade |
|---|---|
| Tipo de evento (ex.: "pergunta feita", "comunicado gerado") | Entender uso e melhorar o produto |
| Categoria da pergunta, score de acerto, indicador de fallback | Avaliar a base de conhecimento |
| Contadores (campos preenchidos, meses de atraso simulados), duração da sessão | Entender adoção e engajamento |
| Identificador técnico de sessão (token local, **sem vínculo** com nome, e-mail, CPF ou IP) | Contar sessões únicas |

**O que a telemetria NÃO coleta:** o texto das suas perguntas, nomes, valores
financeiros, e-mail, IP ou qualquer dado livre digitado. Confirmado no código: apenas
metadados estruturais são enviados.

---

## 4. Base legal de cada tratamento (Art. 7º / Art. 10 LGPD)

| Tratamento | Base legal | Justificativa |
|---|---|---|
| Conta e autenticação (e-mail) | Execução de contrato / procedimentos preliminares (Art. 7º, V) | Necessário para criar e manter sua conta |
| Sincronização dos dados operacionais na nuvem | Execução de contrato (Art. 7º, V) | Você optou por login + sync para não perder dados e usar multi-dispositivo |
| Dados de terceiros inseridos pelo gestor | **Base legal é de responsabilidade do condomínio (Controlador)** — tipicamente legítimo interesse (Art. 7º, IX) ou cumprimento de obrigação legal (Art. 7º, II) na gestão condominial | O AdP, como Operador, trata conforme instrução do Controlador (Art. 39) `[DECISÃO DO LUCAS — confirmar enquadramento]` |
| Telemetria de uso (estrutural, sem PII) | Legítimo interesse do controlador (Art. 7º, IX) | Melhoria do produto, com dados que não identificam o titular `[DECISÃO DO LUCAS — confirmar adequação vs. consentimento]` |

---

## 5. Com quem compartilhamos / suboperadores

- **Supabase** — provedor de banco de dados, autenticação e hospedagem em nuvem, atuando
  como **suboperador**. Armazena os dados das seções 3.1, 3.2 e 3.3 quando ativados.
- **Não vendemos, alugamos ou compartilhamos seus dados para marketing.**
- Não há outros terceiros recebendo dados nesta fase.

---

## 6. Transferência internacional de dados (Arts. 33–36 LGPD)

> `[DECISÃO DO LUCAS]` — A região de hospedagem do Supabase **ainda não foi definida em
> produção**. Texto condicional até cravar:

Caso o provedor de nuvem (Supabase) armazene os dados **fora do Brasil**, haverá
**transferência internacional de dados**. Nesse caso, adotaremos salvaguardas
compatíveis com os Arts. 33 a 36 da LGPD (por exemplo, cláusulas contratuais padrão e
garantias do provedor). Caso a hospedagem seja em região no Brasil (ex.: São Paulo), não
haverá transferência internacional. **A região definitiva será informada nesta Política
antes da ativação do sync em produção.**

---

## 7. Por quanto tempo guardamos (retenção e eliminação)

| Dado | Retenção | Eliminação |
|---|---|---|
| Dados locais no dispositivo | Enquanto você não limpar o navegador ou usar "limpar dados" no app | Você controla — função de reset/backup |
| Snapshot na nuvem (`app_snapshots`) e dados da conta | **Enquanto a conta existir** | Ao excluir a conta, a exclusão em cascata (`on delete cascade`) remove perfil, snapshot, notificações e registros vinculados |
| Telemetria (`events`) | **12 meses** | Eliminação/anonimização após o prazo `[DECISÃO DO LUCAS — confirmar 12m]` |

---

## 8. Seus direitos como titular (Art. 18 LGPD)

Você pode, a qualquer momento: confirmar a existência de tratamento; **acessar** seus
dados; **corrigir** dados incompletos ou inexatos; solicitar **anonimização, bloqueio ou
eliminação**; solicitar **portabilidade**; obter informação sobre **compartilhamento**;
e, quando o tratamento se basear em consentimento, **revogá-lo**.

Como exercer:
- **Acesso/portabilidade dos seus dados locais:** use "Exportar backup" no próprio app
  (gera um arquivo JSON com todos os seus dados).
- **Exclusão da conta e dos dados na nuvem:** `[DECISÃO DO LUCAS — descrever fluxo: hoje
  via solicitação ao contato de privacidade; futuramente botão de excluir conta]`.
- **Demais pedidos:** pelo canal do Encarregado em `[DECISÃO DO LUCAS — e-mail]`.

> **Dados de terceiros:** pedidos de moradores/funcionários sobre dados que o **síndico
> inseriu** devem ser dirigidos ao **condomínio (Controlador)**. O AdP, como Operador,
> apoiará o atendimento conforme a instrução do Controlador.

---

## 9. Segurança (Art. 46) e incidentes (Art. 48)

Medidas atuais (refletindo o código):
- Transmissão por **HTTPS**; **Row Level Security (RLS)** no Supabase, de modo que cada
  usuário só acessa os próprios registros; isolamento entre condomínios por papéis
  (`memberships`).
- Painel administrativo protegido por senha server-side; chave de serviço nunca exposta
  no aplicativo.
- Minimização: a telemetria não recebe dados pessoais.
- **Ponto a endurecer:** a tabela de telemetria (`events`) hoje permite leitura ampla via
  chave pública — `[DECISÃO DO LUCAS — restringir leitura antes do uso externo]`.

**Incidentes:** em caso de incidente de segurança que possa acarretar risco relevante,
comunicaremos a **ANPD** e os **titulares afetados** em prazo razoável, conforme o Art.
48 da LGPD.

---

## 10. Dados de crianças e adolescentes (Art. 14)

O AdP destina-se a síndicos, gestores e profissionais do setor condominial. **Não é
destinado a menores de 18 anos** e não coletamos intencionalmente dados de crianças e
adolescentes.

---

## 11. Cookies e armazenamento local

O AdP **não usa cookies de rastreamento publicitário**. Utiliza:
- **Armazenamento local (`localStorage`)** para guardar seus dados e preferências no
  dispositivo (essencial para o funcionamento offline-first).
- **Sessão de login** (quando você cria conta), mantida pelo provedor de autenticação.

---

## 12. Situação atual do produto

O AdP está em **fase interna**, sem cobrança, sem venda e sem exposição comercial. Esta
Política descreve as práticas de dados **já presentes no código**; recursos ativados
apenas quando o provedor de nuvem estiver configurado operam, até lá, de forma inerte.

---

## 13. Alterações nesta Política

Podemos atualizar esta Política. Alterações significativas serão comunicadas com
antecedência razoável `[DECISÃO DO LUCAS — prazo, ex.: 30 dias]`, e a versão vigente
estará sempre disponível no app, com a data de vigência atualizada.

---

*Minuta — Amigo do Prédio · 2026-06-14 · sujeita à revisão jurídica final do Lucas.*
