// Dicas de descoberta — onde encontrar cada dado quando o usuário não sabe.
// Fase 6: "Não sei" como caminho de valor.
// Sem IA. Texto estático, determinístico.

export type DiscoveryHint = {
  whereToFind: string;     // onde procurar o dado
  whyImportant: string;    // por que este campo importa
  unlocks: string;         // o que se ativa ao preencher
};

const HINTS: Record<string, DiscoveryHint> = {
  avcb: {
    whereToFind: "No certificado do Corpo de Bombeiros, com a administradora ou no acervo documental do prédio.",
    whyImportant: "Exigência legal. A falta pode gerar multa ou interdição do condomínio.",
    unlocks: "Alertas automáticos 90, 60, 30 e 7 dias antes do vencimento.",
  },
  seguro: {
    whereToFind: "Na apólice vigente do seguro predial ou solicitando à administradora ou corretora.",
    whyImportant: "Obrigatório por lei. Cobre incêndio, raio e explosão.",
    unlocks: "Alerta de renovação antes do vencimento da apólice.",
  },
  mandato: {
    whereToFind: "Na ata de eleição ou recondução do síndico registrada em cartório ou com a administradora.",
    whyImportant: "Vencido sem eleição gera irregularidade. Assembleias precisam ser convocadas com antecedência.",
    unlocks: "Alerta para convocar assembleia com antecedência adequada.",
  },
  manut_elevador: {
    whereToFind: "No contrato de manutenção ou na última ordem de serviço da empresa de elevadores.",
    whyImportant: "Manutenção mensal obrigatória por lei. Ausência pode gerar responsabilidade civil.",
    unlocks: "Verificação mensal se a manutenção obrigatória está em dia.",
  },
  manut_extintores: {
    whereToFind: "Na nota fiscal ou laudo da última recarga/inspeção dos extintores.",
    whyImportant: "Exigência da NR 23 e do Corpo de Bombeiros. Prazo anual.",
    unlocks: "Alerta anual antes do vencimento da manutenção dos extintores.",
  },
  manut_dedetizacao: {
    whereToFind: "No comprovante, nota fiscal ou registro da empresa dedetizadora.",
    whyImportant: "Controle de pragas é exigência sanitária em condomínios.",
    unlocks: "Calendário de controle de pragas com alerta de renovação.",
  },
  manut_caixa: {
    whereToFind: "No comprovante de limpeza ou com a empresa de limpeza da caixa d'água.",
    whyImportant: "Obrigatória semestralmente por lei. Afeta a qualidade da água do prédio.",
    unlocks: "Alerta semestral de limpeza obrigatória.",
  },
  funcionarios: {
    whereToFind: "Registros de emprego, folha de pagamento, CTPS ou com a administradora.",
    whyImportant: "Férias vencidas geram passivo trabalhista com correção e possível ação judicial.",
    unlocks: "Controle de férias, alertas de vencimento e histórico trabalhista.",
  },
  ferias_funcionario: {
    whereToFind: "Recibos de férias, folha de pagamento, histórico no eSocial ou com a administradora.",
    whyImportant: "Período aquisitivo vencido acumula dobro e correção sobre o valor.",
    unlocks: "Alerta antes do vencimento do período aquisitivo.",
  },
  data_admissao: {
    whereToFind: "CTPS do funcionário, contrato de trabalho ou ficha de registro.",
    whyImportant: "Data de admissão determina quando começa o primeiro período aquisitivo de férias.",
    unlocks: "Cálculo automático de quando as férias vão vencer.",
  },
  convencao: {
    whereToFind: "No cartório de registro de imóveis, com a administradora ou no acervo do prédio.",
    whyImportant: "Regulamenta a vida do condomínio. Base legal para decisões em assembleia.",
    unlocks: "Base documental jurídica do condomínio registrada.",
  },
  seguro_apolice: {
    whereToFind: "Com a corretora de seguros, administradora ou na pasta documental do prédio.",
    whyImportant: "Comprova a cobertura do condomínio. Necessária para sinistros.",
    unlocks: "Rastreamento de vencimento e cobertura ativa.",
  },
  administradora: {
    whereToFind: "No contrato de prestação de serviços da administradora.",
    whyImportant: "Centraliza a comunicação e permite rastrear responsabilidades.",
    unlocks: "Campo preenchido melhora contexto das orientações do app.",
  },
  ago: {
    whereToFind: "Na ata da última Assembleia Geral Ordinária registrada.",
    whyImportant: "AGO anual é obrigatória para aprovação de contas e planejamento.",
    unlocks: "Indicação de quando a próxima AGO deve ser convocada.",
  },
};

export function getDiscoveryHint(fieldId: string): DiscoveryHint | null {
  return HINTS[fieldId] ?? null;
}

export function getWhereToFind(fieldId: string): string | null {
  return HINTS[fieldId]?.whereToFind ?? null;
}

export function getWhyImportant(fieldId: string): string | null {
  return HINTS[fieldId]?.whyImportant ?? null;
}

export function getUnlockReason(fieldId: string): string | null {
  return HINTS[fieldId]?.unlocks ?? null;
}
