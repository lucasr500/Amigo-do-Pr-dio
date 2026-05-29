// Biblioteca de playbooks e checklists operacionais.
// Fonte única de verdade para orientações contextuais.
// Sem dependências runtime — dados puramente estáticos.

export type Playbook = {
  id: string;
  titulo: string;
  contexto: string;       // Por que isso importa (plain language)
  risco: string;          // O que acontece se ignorar
  acaoImediata: string;   // Faça ISSO agora
  acaoRecomendada: string;// Próximo passo depois do imediato
  acompanhamento: string; // Como verificar que foi resolvido
  checklist: string[];    // Passos ordenados para resolver
};

export const PLAYBOOKS: Record<string, Playbook> = {
  avcb_vencido: {
    id: "avcb_vencido",
    titulo: "AVCB vencido",
    contexto:
      "O AVCB atesta que o prédio atende às normas de segurança contra incêndio do Corpo de Bombeiros. Sem ele vigente, o condomínio opera em irregularidade técnica.",
    risco:
      "Vencido, o prédio fica exposto a autuações, multas e eventual interdição em vistoria — responsabilidade direta do síndico.",
    acaoImediata:
      "Contate hoje a empresa que realizou o último AVCB ou uma prestadora especializada em proteção contra incêndio.",
    acaoRecomendada:
      "Solicite orçamento, agende vistoria e inicie o processo junto ao Corpo de Bombeiros.",
    acompanhamento:
      "Registre a nova data de vencimento no app assim que o documento for emitido.",
    checklist: [
      "Localizar o AVCB anterior (pasta física ou arquivo digital)",
      "Identificar a empresa de proteção contra incêndio responsável",
      "Verificar se há adequações necessárias (extintores, iluminação de emergência, sinalização)",
      "Solicitar visita técnica ou orçamento de renovação",
      "Protocolar processo junto ao Corpo de Bombeiros",
      "Registrar nova data de vencimento no app",
    ],
  },
  avcb_vencendo: {
    id: "avcb_vencendo",
    titulo: "AVCB vencendo em breve",
    contexto:
      "O processo de renovação do AVCB envolve vistoria técnica e tramitação — iniciar cedo evita que o documento fique irregular.",
    risco:
      "Deixar para a última hora pode significar vencimento antes da renovação — o que exige tratamento como AVCB vencido.",
    acaoImediata:
      "Agende a vistoria de renovação com a prestadora de proteção contra incêndio ainda esta semana.",
    acaoRecomendada:
      "Verifique se há adequações técnicas necessárias antes da vistoria.",
    acompanhamento:
      "Confirme o protocolo de entrada no Corpo de Bombeiros e a data prevista de emissão.",
    checklist: [
      "Verificar data exata de vencimento no documento físico",
      "Contatar prestadora para agendar vistoria de renovação",
      "Confirmar se há irregularidades a corrigir antes da vistoria",
      "Protocolar pedido de renovação no Corpo de Bombeiros",
      "Registrar nova data de vencimento ao receber o documento",
    ],
  },
  seguro_vencido: {
    id: "seguro_vencido",
    titulo: "Seguro condominial vencido",
    contexto:
      "O seguro condominial cobre eventos como incêndio, raio e explosão. Sem cobertura ativa, qualquer sinistro recai integralmente sobre o condomínio.",
    risco:
      "Um sinistro enquanto o seguro está vencido pode gerar prejuízo total ao condomínio e responsabilidade pessoal do síndico.",
    acaoImediata:
      "Contate a corretora ou seguradora responsável pela apólice atual para iniciar a renovação hoje.",
    acaoRecomendada:
      "Se não houver corretora, solicite cotações a pelo menos duas seguradoras.",
    acompanhamento:
      "Registre a nova data de vencimento e arquive a apólice renovada em local de fácil acesso.",
    checklist: [
      "Localizar a apólice atual ou o contato da corretora responsável",
      "Solicitar proposta de renovação ou novas cotações",
      "Verificar se o valor segurado reflete o custo de reposição atual",
      "Verificar se há cláusulas que exigem aprovação em assembleia",
      "Contratar a renovação e obter o endosso ou nova apólice",
      "Registrar nova data de vencimento no app",
    ],
  },
  seguro_vencendo: {
    id: "seguro_vencendo",
    titulo: "Seguro condominial vencendo em breve",
    contexto:
      "Chegou o momento ideal para avaliar a apólice atual antes de renovar — comparar cobertura e preço evita renovações automáticas desfavoráveis.",
    risco:
      "Deixar para a última hora pode resultar em renovação sem análise ou, pior, vencimento do seguro.",
    acaoImediata:
      "Solicite à corretora ou seguradora a proposta de renovação com as condições atualizadas.",
    acaoRecomendada:
      "Compare o valor segurado com o custo de reposição atual do imóvel.",
    acompanhamento:
      "Confirme o pagamento e arquive a nova apólice com a data de vencimento.",
    checklist: [
      "Localizar a apólice atual com a data de vencimento",
      "Solicitar proposta de renovação à corretora ou seguradora",
      "Verificar se o valor segurado está atualizado",
      "Aprovar renovação (verificar se a convenção exige assembleia)",
      "Pagar e arquivar nova apólice",
      "Registrar nova data de vencimento no app",
    ],
  },
  mandato_vencido: {
    id: "mandato_vencido",
    titulo: "Mandato do síndico vencido",
    contexto:
      "Sem renovação formal do mandato, a representação do condomínio em contratos, assembleias e documentos pode ser contestada por qualquer condômino.",
    risco:
      "Atos praticados com mandato vencido podem ser questionados juridicamente, gerando insegurança na gestão.",
    acaoImediata:
      "Consulte a convenção para identificar o procedimento e o prazo mínimo de convocação de assembleia.",
    acaoRecomendada:
      "Convoque a assembleia de eleição ou recondução com a antecedência mínima exigida.",
    acompanhamento:
      "Registre a ata da assembleia e atualize a data do novo mandato no app.",
    checklist: [
      "Ler a convenção para identificar prazo mínimo de convocação",
      "Definir data, local e pauta (eleição ou recondução)",
      "Redigir e enviar convocação a todos os condôminos",
      "Afixar convocação na entrada do prédio",
      "Realizar assembleia com lista de presença assinada",
      "Lavrar ata com presidente e secretário",
      "Registrar nova data de mandato no app",
    ],
  },
  mandato_vencendo: {
    id: "mandato_vencendo",
    titulo: "Mandato do síndico vencendo em breve",
    contexto:
      "Organizar a assembleia com antecedência garante continuidade na gestão e evita o período de mandato vencido.",
    risco:
      "Deixar o mandato vencer gera incerteza jurídica sobre quem representa o condomínio.",
    acaoImediata:
      "Verifique na convenção o prazo mínimo de convocação e planeje a assembleia.",
    acaoRecomendada:
      "Prepare a pauta e comunique os condôminos com antecedência suficiente.",
    acompanhamento:
      "Registre a ata e atualize a data do novo mandato no app.",
    checklist: [
      "Verificar prazo mínimo de convocação na convenção",
      "Decidir entre eleição ou recondução",
      "Agendar data e local da assembleia",
      "Preparar e enviar edital de convocação",
      "Realizar assembleia e lavrar ata",
      "Registrar nova data de mandato no app",
    ],
  },
  elevador_sem_manutencao: {
    id: "elevador_sem_manutencao",
    titulo: "Elevador sem manutenção registrada",
    contexto:
      "A manutenção mensal do elevador geralmente está prevista em contrato. Sem registro, não é possível confirmar que o serviço está sendo realizado regularmente.",
    risco:
      "Elevador sem manutenção pode apresentar falhas mecânicas, gerar risco de acidente e responsabilidade ao condomínio.",
    acaoImediata:
      "Contate a empresa de manutenção do elevador e confirme se a última visita foi realizada.",
    acaoRecomendada:
      "Solicite o relatório de serviço da última visita e arquive como evidência.",
    acompanhamento:
      "Registre a data da última manutenção no app e acompanhe mensalmente.",
    checklist: [
      "Identificar a empresa de manutenção do elevador contratada",
      "Confirmar se há contrato de manutenção vigente",
      "Solicitar relatório da última visita técnica",
      "Verificar data de vencimento de certificados aplicáveis",
      "Registrar data da última manutenção no app",
      "Confirmar agendamento da próxima visita",
    ],
  },
  funcionario_ferias_vencidas: {
    id: "funcionario_ferias_vencidas",
    titulo: "Funcionário com férias vencidas",
    contexto:
      "O período de férias deve ser concedido dentro do prazo legal. Férias não concedidas no prazo geram passivo trabalhista para o condomínio.",
    risco:
      "Férias vencidas obrigam o condomínio a pagar o período em dobro se o funcionário reclamar na Justiça do Trabalho.",
    acaoImediata:
      "Consulte a situação de cada funcionário com férias vencidas e agende o período de gozo com a contabilidade.",
    acaoRecomendada:
      "Emita o aviso de férias com 30 dias de antecedência (ou menos se acordado com o funcionário).",
    acompanhamento:
      "Registre a data de gozo no app assim que as férias forem concedidas.",
    checklist: [
      "Identificar quais funcionários estão com férias vencidas",
      "Consultar contabilidade ou departamento pessoal",
      "Agendar período de férias de acordo com o funcionário",
      "Emitir aviso de férias com a antecedência correta",
      "Pagar férias até 2 dias antes do início do gozo",
      "Registrar data de gozo no app",
    ],
  },
  documento_critico_ausente: {
    id: "documento_critico_ausente",
    titulo: "Documento essencial não localizado",
    contexto:
      "Documentos como convenção, AVCB, seguro predial e laudos técnicos são exigidos em vendas de imóveis, vistorias, assembleias e averbações.",
    risco:
      "Não ter acesso rápido a documentos essenciais pode travar processos importantes e expor o condomínio a penalidades.",
    acaoImediata:
      "Verifique na pasta física de documentos do condomínio ou consulte a administradora.",
    acaoRecomendada:
      "Organize os documentos em formato digital e mantenha cópias acessíveis.",
    acompanhamento:
      "Atualize o status de cada documento no app conforme localizar.",
    checklist: [
      "Listar os documentos marcados como não localizados",
      "Verificar pasta física do condomínio",
      "Consultar administradora sobre cópias arquivadas",
      "Solicitar certidões ou segundas vias se necessário",
      "Digitalizar e arquivar em local seguro",
      "Atualizar status para 'Tenho' no app",
    ],
  },
  ago_atrasada: {
    id: "ago_atrasada",
    titulo: "Assembleia Geral Ordinária atrasada",
    contexto:
      "A AGO é obrigatória ao menos uma vez por ano para aprovação das contas e deliberação sobre assuntos gerais do condomínio.",
    risco:
      "AGO não realizada no prazo pode invalidar aprovações de contas e gerar questionamentos sobre decisões do período.",
    acaoImediata:
      "Defina uma data para a AGO e inicie o processo de convocação.",
    acaoRecomendada:
      "Prepare a prestação de contas e organize a documentação para apresentação.",
    acompanhamento:
      "Registre a data da AGO realizada no app após a assembleia.",
    checklist: [
      "Definir data, horário e local da AGO",
      "Preparar pauta (prestação de contas, eleições se necessário, outros)",
      "Organizar documentação contábil",
      "Redigir e enviar convocação com prazo mínimo exigido",
      "Realizar assembleia com lista de presença",
      "Lavrar ata e registrar data no app",
    ],
  },
  manutencoes_atrasadas: {
    id: "manutencoes_atrasadas",
    titulo: "Manutenções recorrentes atrasadas",
    contexto:
      "Manutenções preventivas em dia reduzem o custo de reparos corretivos e evitam falhas inesperadas que afetam os moradores.",
    risco:
      "Manutenções negligenciadas aumentam o risco de falhas, acidentes e custos de reparo emergencial.",
    acaoImediata:
      "Verifique quais manutenções estão atrasadas no painel e contate os fornecedores para agendar.",
    acaoRecomendada:
      "Priorize por criticidade: críticas > importantes > recomendadas.",
    acompanhamento:
      "Registre cada manutenção realizada no app e atualize a data de execução.",
    checklist: [
      "Verificar lista de manutenções atrasadas no painel",
      "Priorizar por criticidade",
      "Contatar fornecedores para agendamento",
      "Confirmar a execução e solicitar comprovante de serviço",
      "Registrar data de execução no app",
    ],
  },
};

// Micro-guidance: dicas contextuais curtas por categoria
// Usadas quando o usuário já tem dados cadastrados naquela área
export const MICRO_GUIDANCE_BY_CATEGORY: Record<string, string[]> = {
  documentos: [
    "Documentos mapeados facilitam consultas em assembleias e processos de venda.",
    "Convenção e regimento digitalizados reduzem o tempo de resposta em conflitos.",
    "Documentos organizados protegem o síndico em caso de questionamento.",
  ],
  funcionarios: [
    "Funcionários com férias em dia eliminam passivo trabalhista silencioso.",
    "Registrar a data de admissão ativa o monitoramento automático de riscos.",
    "Histórico de férias cadastrado facilita a conversa com a contabilidade.",
  ],
  manutencoes: [
    "Manutenção preventiva custa em média 3× menos do que corretiva.",
    "Um calendário de manutenções cadastrado facilita o planejamento de despesas.",
    "Registrar a última execução ativa o calendário operacional anual.",
  ],
  operacional: [
    "A revisão semanal leva menos de 5 minutos e mantém o monitoramento ativo.",
    "Registrar ocorrências com próximos passos melhora o acompanhamento.",
    "Backups regulares protegem seus dados contra perda acidental.",
  ],
  gestao: [
    "Mapear contratos de fornecedores melhora a previsibilidade de despesas.",
    "Ata de assembleia arquivada protege decisões históricas do condomínio.",
    "Dados completos permitem respostas mais rápidas em situações de urgência.",
  ],
};

// Frases de melhoria para Health Score (usadas em howToGain10Pts)
export const SCORE_IMPROVEMENT_HINTS: Record<string, string> = {
  essential_avcb:     "Cadastrar a data do AVCB com precisão exata",
  essential_seguro:   "Cadastrar o vencimento do seguro com data exata",
  essential_mandato:  "Cadastrar o fim do mandato do síndico com data exata",
  resolve_criticals:  "Resolver os alertas críticos ativos",
  weekly_review:      "Completar a revisão semanal (10 pts imediatos)",
  clear_stale:        "Limpar próximos passos parados há mais de 14 dias",
  add_manutencoes:    "Cadastrar manutenções recorrentes e manter em dia",
  map_documentos:     "Mapear a situação dos documentos essenciais",
  regularize_ferias:  "Regularizar férias dos funcionários",
};
