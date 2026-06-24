# Track Jurídico do Rollout — PF→PJ, Termos de Uso e Política de Privacidade

**Autor:** Cowork (lane jurídica/produto, em paralelo ao código) · **Data:** 2026-06-18
**Status:** **MINUTA para revisão do Lucas** (advogado). Não é peça final — é um esqueleto denso e sob medida para você lapidar. Onde falta dado seu, está marcado `⟦…⟧`.
**Contexto:** o rollout (D6 — ligar o remoto/expor) está travado **só** pela transição PF→PJ. Região Supabase = `sa-east-1` (São Paulo) confirmada — isto **simplifica** LGPD (dado tratado no Brasil, sem transferência internacional como regra).
**Premissas do produto que moldam estes textos:** local-first (dado mora no dispositivo; servidor é cópia opcional via login); multi-persona (síndico, conselho, morador, funcionário); camada social com conteúdo de usuário; anti-posicionamento (não somos administradora — não tratamos boleto/folha).

---

# Parte 1 — Checklist PF→PJ (a transição que destrava tudo)

> Objetivo: ter uma PJ apta a ser **controladora de dados**, contratar o Supabase como **operadora**, emitir contrato/assinatura ao condomínio e publicar Termos/Privacidade com um CNPJ real.

1. **Definir o tipo societário** ⟦decisão sua⟧ — para SaaS solo, as rotas usuais são:
   - **SLU (Sociedade Limitada Unipessoal)** — sem sócio, responsabilidade limitada ao capital. Caminho mais comum para fundador único.
   - **EI / Empresário Individual** — mais simples, porém sem separação patrimonial plena (evitar para SaaS que trata dado sensível).
   - **LTDA** com sócio — se for entrar sócio/investidor.
   - *Recomendação a discutir:* SLU pela separação patrimonial sem exigir sócio.
2. **Enquadramento tributário** ⟦com seu contábil⟧ — Simples Nacional (Anexo III/V conforme fator-r; SaaS costuma cair no V ou III dependendo da folha) vs. Lucro Presumido. Definir antes de faturar.
3. **CNAEs** — incluir desenvolvimento/licenciamento de software: `6201-5/01` (desenvolvimento sob encomenda), `6202-3/00` (licenciamento de software customizável), `6209-1/00` (suporte/TI). ⟦confirmar com contábil⟧
4. **Capital social e objeto social** — objeto cobrindo "desenvolvimento, licenciamento e operação de plataforma digital para gestão e comunicação condominial".
5. **Conta PJ + meio de cobrança** — conta bancária PJ e gateway de assinatura (a assinatura do condomínio inteiro é o modelo escolhido; billing ainda não construído).
6. **DPO / Encarregado (LGPD art. 41)** — nomear encarregado (pode ser você no início) e publicar canal de contato.
7. **Contrato de operador com o Supabase (DPA)** — aceitar/assinar o Data Processing Addendum do Supabase e registrar `sa-east-1` como região de processamento.
8. **Registro de marca (INPI)** ⟦opcional, recomendável⟧ — "Amigo do Prédio" classe 9/42, para proteger o nome antes de expor.
9. **Contrato de licença/assinatura ao condomínio** — instrumento que o síndico/condomínio assina (quem contrata: o condomínio via síndico, com respaldo de assembleia). Define objeto, preço, responsabilidades e tratamento de dados.
10. **Só então:** publicar Termos + Privacidade com o CNPJ, e habilitar o rollout (D6) — ainda gated por feature flags até o portão "Completo-Núcleo".

---

# Parte 2 — Termos de Uso (MINUTA)

**Controladora:** ⟦Razão Social⟧, CNPJ ⟦…⟧ ("Amigo do Prédio", "nós"). Contato: ⟦e-mail⟧.

**1. Objeto.** O Amigo do Prédio é uma plataforma digital de **organização, comunicação, memória e governança** da vida condominial. **Não é** sistema de administração financeira, cobrança de boletos, folha de pagamento ou contabilidade do condomínio, e **não substitui** a administradora nem o síndico no exercício de suas funções legais.

**2. Quem pode usar e papéis.** O acesso é por papéis (síndico/gestão, conselho, morador, funcionário), atribuídos pelo responsável do condomínio. Cada papel vê e faz apenas o que seu nível permite. O usuário declara que as informações de vínculo com o condomínio são verídicas.

**3. Natureza dos conteúdos.** A plataforma distingue, de forma visível e inegociável: **(a) opinião de morador**, **(b) comunicado oficial** (da gestão) e **(c) deliberação de assembleia**. Opiniões de morador **não** representam a posição do condomínio nem da plataforma.

**4. Responsabilidade pelo conteúdo do usuário.** O usuário é **integral e exclusivamente responsável** pelo conteúdo que publica. É vedado publicar conteúdo ilícito, difamatório, calunioso, injurioso, discriminatório, que exponha indevidamente inadimplência ou dados pessoais de terceiros, ou que viole a honra, imagem ou privacidade de qualquer pessoa. A plataforma atua como **provedora de aplicação** (Marco Civil da Internet, Lei 12.965/2014) e poderá remover conteúdo mediante denúncia ou ordem competente, mantendo registro para auditoria.

**5. Moderação.** Conteúdo comum é publicado e pode ser denunciado/removido (reativo); conteúdo **sensível** (inadimplência, acusações nominais) passa por **aprovação prévia** da gestão/conselho. A plataforma mantém **trilha de auditoria** imutável das ações de moderação. A ausência de remoção imediata não implica concordância da plataforma com o conteúdo.

**6. Uso aceitável.** Proibido: engenharia reversa, automação abusiva, tentativa de acesso a dados de outro condomínio, uso para fim diverso da gestão/convivência condominial.

**7. Dados e privacidade.** O tratamento de dados pessoais segue a **Política de Privacidade** (Parte 3), parte integrante destes Termos. O modelo é **local-first**: por padrão os dados ficam no dispositivo do usuário; o login e a sincronização em nuvem são **opcionais** e descritos na Política.

**8. Limitação de responsabilidade.** A plataforma é fornecida "no estado em que se encontra". Não nos responsabilizamos por decisões tomadas pelo condomínio, por divergências entre condôminos, nem por perdas decorrentes de uso indevido, de exclusão de dados pelo próprio usuário (limpeza do dispositivo sem backup) ou de indisponibilidade de terceiros (ex.: provedor de nuvem). ⟦ajustar limites conforme sua estratégia de risco⟧

**9. Propriedade intelectual.** O software, marca e identidade são da controladora. O conteúdo inserido pelo condomínio permanece do condomínio/usuários; concedem-nos licença limitada para operar o serviço.

**10. Vigência, alteração e foro.** Podemos alterar estes Termos mediante aviso na plataforma. Vigência enquanto durar o uso. Foro: ⟦comarca⟧, Brasil. Lei aplicável: brasileira.

---

# Parte 3 — Política de Privacidade (MINUTA, LGPD)

**Controladora:** ⟦Razão Social/CNPJ⟧. **Encarregado (DPO):** ⟦nome/e-mail⟧.

**1. Princípio local-first.** Por padrão, os dados operacionais do condomínio ficam **no dispositivo do usuário** (armazenamento local do navegador). **Sem login**, não há envio a servidores nossos: sincronização, conta e telemetria operam em modo inerte.

**2. Quando há tratamento em nuvem.** Se o usuário **opta por criar conta e sincronizar**, passamos a tratar os dados para hospedar a cópia e habilitar multi-dispositivo/multi-persona. Operadora: **Supabase**, com processamento na região **`sa-east-1` (São Paulo, Brasil)** — sem transferência internacional como regra.

**3. Dados tratados (por finalidade).**
- *Conta/autenticação:* e-mail (magic link). Para a gestão, fator adicional (MFA).
- *Dados do condomínio:* perfil do prédio, memória institucional, decisões, agenda, comunicados, documentos — conforme o papel.
- *Conteúdo da camada social:* posts, comentários, enquetes, solicitações (com a separação de natureza).
- *Telemetria opcional e privacy-safe:* categoria, score, origem, id de match, duração de sessão. **Não** enviamos query bruta, título de pendência nem texto livre digitado.

**4. Bases legais (LGPD art. 7).** Execução de contrato/serviço (sincronização, papéis), legítimo interesse (segurança, telemetria agregada), consentimento (quando aplicável) e cumprimento de obrigação legal/exercício regular de direitos (trilha de auditoria da moderação).

**5. Dados sensíveis e de inadimplência.** Inadimplência individual e decisões jurídicas/trabalhistas são **restritas à gestão/conselho** por padrão (regra aplicada no banco, não só na interface). Exposição agregada ao morador é opcional e **fechada por padrão**; abrir é ação explícita e registrada do síndico.

**6. Compartilhamento.** Não vendemos dados. Compartilhamos apenas com a operadora de nuvem (Supabase) para operar o serviço, e com autoridades mediante ordem legal. **Não** compartilhamos com a administradora salvo integração futura **autorizada** pelo condomínio.

**7. Retenção e exclusão.** Dados locais: controlados pelo usuário (backup/exclusão no próprio dispositivo). Dados em nuvem: retidos enquanto a conta/assinatura existir; excluídos ⟦prazo⟧ após o encerramento, salvo trilha de auditoria de moderação (retida pelo prazo legal de defesa).

**8. Direitos do titular (LGPD art. 18).** Confirmação, acesso, correção, anonimização, portabilidade, eliminação e revogação de consentimento — pelo canal do Encarregado. Prazo de resposta conforme a LGPD.

**9. Segurança.** Isolamento entre condomínios por RLS provada contra banco real (gate automatizado); MFA para gestão; criptografia em trânsito; minimização (telemetria sem conteúdo livre).

**10. Crianças e adolescentes.** A plataforma destina-se a maiores responsáveis pela gestão/convivência condominial; não direcionada a menores.

**11. Alterações.** Avisaremos mudanças relevantes na plataforma.

---

# Decisões que dependem só de você
1. Tipo societário (SLU recomendado) e enquadramento tributário — com seu contábil.
2. Razão social, CNPJ, foro, e-mail de contato/DPO para preencher os `⟦…⟧`.
3. Prazo de retenção pós-encerramento e limites de responsabilidade (§8 dos Termos).
4. Quer que eu evolua qualquer das três peças (checklist, Termos, Privacidade) para versão final cláusula-a-cláusula, ou prefere lapidar você mesmo a partir desta minuta?
