// Maturidade de dados — diferente do Health Score.
// Health Score mede risco/organização operacional.
// Maturidade de Dados mede o quanto o app CONHECE o condomínio.
// Sem IA. 100% determinístico.

import {
  getMemoriaAssistida,
  getMemoriaOperacional,
  getProfile,
  getDocumentos,
  getFuncionarios,
  getManutencoes,
  type AssistedDateField,
} from "@/lib/session";

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type EssentialDateKey = "avcb" | "seguro" | "mandato";

export type DataMaturityStatus =
  | "filled"        // dado conhecido com boa precisão
  | "approximate"   // dado conhecido mas com precisão reduzida (mês/ano)
  | "to_discover"   // usuário marcou "vou descobrir depois"
  | "not_applicable"// campo irrelevante para este condomínio
  | "unknown";      // nunca preenchido

export type DataMaturityItem = {
  id: string;
  label: string;
  module: "memoria" | "profile" | "documentos" | "funcionarios" | "manutencoes";
  importance: "critica" | "importante" | "recomendada";
  estimatedMinutes: number;
  status: DataMaturityStatus;
  unlocks?: string;        // o que se ativa ao preencher
  discoveryHint?: string;  // onde encontrar esta informação
};

export type EssentialDateInfo = {
  key: EssentialDateKey;
  label: string;
  hint: string;
  isFilled: boolean;
  isToDiscover: boolean;
  field?: AssistedDateField;
};

export type DataMaturityNextStep = {
  id: string;
  titulo: string;
  subtitulo: string;
  campo?: EssentialDateKey;
  target: "condominio" | "ferramentas";
  priority: number;
  discoveryHint?: string;
};

export type DataMaturityResult = {
  // ── Spec completo ──────────────────────────────────────────────────────────
  percentage: number;
  level: "inicial" | "em_andamento" | "bom" | "avancado";
  knownCount: number;
  unknownCount: number;
  approximateCount: number;
  toDiscoverCount: number;
  notApplicableCount: number;
  criticalMissing: DataMaturityItem[];
  quickWins: DataMaturityItem[];
  nextBestFields: DataMaturityItem[];
  unlockedCapabilities: string[];
  lockedCapabilities: string[];
  // ── Compat com código existente ───────────────────────────────────────────
  essentialDatesFilled: number;
  essentialDates: EssentialDateInfo[];
  hasProfile: boolean;
  hasFuncionarios: boolean;
  hasManutencoes: boolean;
  hasDocumentos: boolean;
  overallPct: number;
  nextStep: DataMaturityNextStep | null;
};

// ─── Catálogo fixo de pontos de dados rastreados ───────────────────────────────

const ESSENTIAL_DATE_META: Record<EssentialDateKey, { label: string; hint: string }> = {
  avcb:    { label: "Vencimento do AVCB", hint: "O app avisa 90, 60 e 30 dias antes do vencimento." },
  seguro:  { label: "Vencimento do seguro predial", hint: "O app avisa quando a renovação se aproximar." },
  mandato: { label: "Fim do mandato do síndico", hint: "O app lembra de convocar a assembleia com antecedência." },
};

// ─── Helpers de status ─────────────────────────────────────────────────────────

function assistedStatus(field?: AssistedDateField, legacyValue?: string): DataMaturityStatus {
  if (legacyValue) return "filled";
  if (!field) return "unknown";
  if (field.status === "not_applicable") return "not_applicable";
  if (field.status === "to_discover")   return "to_discover";
  if (field.status === "unknown")       return "to_discover";
  if (field.precision === "month" || field.precision === "year") return "approximate";
  if (field.status === "filled" || field.status === "estimated") return "filled";
  return "unknown";
}

function boolStatus(val: boolean | undefined): DataMaturityStatus {
  return val !== undefined ? "filled" : "unknown";
}

function stringStatus(val: string | undefined | null): DataMaturityStatus {
  return (val && val.trim() !== "") ? "filled" : "unknown";
}

// ─── Cálculo principal ─────────────────────────────────────────────────────────

export function buildDataMaturity(): DataMaturityResult {
  const assistida = getMemoriaAssistida();
  const mem       = getMemoriaOperacional();
  const prof      = getProfile();
  const docs      = getDocumentos();
  const funcs     = getFuncionarios();
  const manutencoes = getManutencoes();

  // ── Essential dates (compatibilidade com módulos existentes)
  const essentialDates: EssentialDateInfo[] = [
    {
      key: "avcb", ...ESSENTIAL_DATE_META.avcb,
      isFilled:     assistedStatus(assistida.avcb, mem.vencimentoAVCB) === "filled" || assistedStatus(assistida.avcb, mem.vencimentoAVCB) === "approximate",
      isToDiscover: assistedStatus(assistida.avcb, mem.vencimentoAVCB) === "to_discover",
      field: assistida.avcb,
    },
    {
      key: "seguro", ...ESSENTIAL_DATE_META.seguro,
      isFilled:     assistedStatus(assistida.seguro, mem.vencimentoSeguro) === "filled" || assistedStatus(assistida.seguro, mem.vencimentoSeguro) === "approximate",
      isToDiscover: assistedStatus(assistida.seguro, mem.vencimentoSeguro) === "to_discover",
      field: assistida.seguro,
    },
    {
      key: "mandato", ...ESSENTIAL_DATE_META.mandato,
      isFilled:     assistedStatus(assistida.mandato, mem.fimMandatoSindico) === "filled" || assistedStatus(assistida.mandato, mem.fimMandatoSindico) === "approximate",
      isToDiscover: assistedStatus(assistida.mandato, mem.fimMandatoSindico) === "to_discover",
      field: assistida.mandato,
    },
  ];
  const essentialDatesFilled = essentialDates.filter((d) => d.isFilled).length;

  // ── Build item catalogue ────────────────────────────────────────────────────
  const hasElevador = prof?.hasElevador === true;
  const hasFuncionariosProfile = prof?.hasFuncionarios === true;

  const items: DataMaturityItem[] = [
    // Datas críticas
    {
      id: "avcb", label: "Vencimento do AVCB",
      module: "memoria", importance: "critica", estimatedMinutes: 2,
      status: assistedStatus(assistida.avcb, mem.vencimentoAVCB),
      unlocks: "Alertas 90/60/30 dias antes do vencimento",
      discoveryHint: "Certificado do Corpo de Bombeiros, administradora ou acervo do prédio.",
    },
    {
      id: "seguro", label: "Vencimento do seguro predial",
      module: "memoria", importance: "critica", estimatedMinutes: 2,
      status: assistedStatus(assistida.seguro, mem.vencimentoSeguro),
      unlocks: "Alerta de renovação da apólice antes do vencimento",
      discoveryHint: "Apólice vigente ou solicitar à administradora.",
    },
    {
      id: "mandato", label: "Fim do mandato do síndico",
      module: "memoria", importance: "critica", estimatedMinutes: 1,
      status: assistedStatus(assistida.mandato, mem.fimMandatoSindico),
      unlocks: "Alerta para convocar assembleia de eleição ou recondução",
      discoveryHint: "Ata de eleição ou recondução do síndico.",
    },
    // Perfil
    {
      id: "nome_condominio", label: "Nome do condomínio",
      module: "profile", importance: "importante", estimatedMinutes: 1,
      status: stringStatus(prof?.nomeCondominio),
      unlocks: "Personaliza o painel e comunicados",
    },
    {
      id: "has_elevador", label: "Possui elevador?",
      module: "profile", importance: "importante", estimatedMinutes: 1,
      status: boolStatus(prof?.hasElevador),
      unlocks: "Ativa verificação de manutenção mensal obrigatória",
    },
    {
      id: "has_funcionarios", label: "Possui funcionários?",
      module: "profile", importance: "importante", estimatedMinutes: 1,
      status: prof?.hasFuncionarios !== undefined ? "filled" : "unknown",
      unlocks: "Ativa controle de férias e obrigações trabalhistas",
    },
    {
      id: "tipo_gestao", label: "Tipo de gestão",
      module: "profile", importance: "recomendada", estimatedMinutes: 1,
      status: stringStatus(prof?.tipoGestao),
      unlocks: "Orienta o app para o seu perfil de gestão",
    },
    {
      id: "num_unidades", label: "Número de unidades",
      module: "profile", importance: "recomendada", estimatedMinutes: 1,
      status: prof?.numUnidades !== undefined ? "filled" : "unknown",
    },
    // Manutenções
    {
      id: "manut_dedetizacao", label: "Última dedetização",
      module: "manutencoes", importance: "importante", estimatedMinutes: 2,
      status: stringStatus(mem.ultimaDedetizacao),
      unlocks: "Calendário de controle de pragas ativo",
      discoveryHint: "Nota fiscal, contrato ou registro da empresa dedetizadora.",
    },
    {
      id: "manut_caixa", label: "Limpeza da caixa d'água",
      module: "manutencoes", importance: "importante", estimatedMinutes: 2,
      status: stringStatus(mem.ultimaLimpezaCaixaDAgua),
      unlocks: "Alerta semestral de limpeza obrigatória",
      discoveryHint: "Comprovante de serviço ou registro com a empresa de limpeza.",
    },
    {
      id: "manut_elevador", label: "Manutenção do elevador",
      module: "manutencoes",
      importance: hasElevador ? "critica" : "recomendada",
      estimatedMinutes: 2,
      status: hasElevador ? stringStatus(mem.ultimaManutencaoElevador) : "not_applicable",
      unlocks: "Verificação mensal de manutenção obrigatória",
      discoveryHint: "Contrato ou última ordem de serviço da empresa de elevadores.",
    },
    {
      id: "manut_extintores", label: "Inspeção de extintores",
      module: "manutencoes", importance: "importante", estimatedMinutes: 2,
      status: stringStatus(mem.ultimaInspecaoExtintores),
      unlocks: "Alerta anual de manutenção dos extintores",
      discoveryHint: "Nota fiscal da última recarga ou inspeção.",
    },
    // Funcionários
    {
      id: "funcionarios", label: "Funcionários cadastrados",
      module: "funcionarios",
      importance: hasFuncionariosProfile ? "critica" : "recomendada",
      estimatedMinutes: 3,
      status: funcs.length > 0 ? "filled" : (prof?.hasFuncionarios === false ? "not_applicable" : "unknown"),
      unlocks: "Controle de férias, datas de admissão e obrigações trabalhistas",
    },
    // Documentos
    {
      id: "docs_seguranca", label: "Documentos de segurança mapeados",
      module: "documentos", importance: "critica", estimatedMinutes: 5,
      status: docs.filter((d) => ["avcb_clcb", "spda_laudo", "brigada_certificado"].includes(d.id) && d.status === "tenho").length > 0
        ? "filled" : "unknown",
      unlocks: "Mapa documental de segurança completo",
    },
    {
      id: "docs_juridicos", label: "Documentos jurídicos mapeados",
      module: "documentos", importance: "importante", estimatedMinutes: 5,
      status: docs.filter((d) => ["convencao", "regimento", "ata_eleicao"].includes(d.id) && d.status === "tenho").length > 0
        ? "filled" : "unknown",
      unlocks: "Base legal do condomínio documentada",
    },
  ];

  // ── Contagens ────────────────────────────────────────────────────────────────
  const relevantItems = items.filter((i) => i.status !== "not_applicable");
  const knownCount      = relevantItems.filter((i) => i.status === "filled" || i.status === "approximate").length;
  const approximateCount = relevantItems.filter((i) => i.status === "approximate").length;
  const toDiscoverCount  = relevantItems.filter((i) => i.status === "to_discover").length;
  const notApplicableCount = items.filter((i) => i.status === "not_applicable").length;
  const unknownCount = relevantItems.length - knownCount - toDiscoverCount;

  // ── Percentual ponderado ─────────────────────────────────────────────────────
  const weights: Record<DataMaturityItem["importance"], number> = { critica: 3, importante: 2, recomendada: 1 };
  const totalWeight   = relevantItems.reduce((s, i) => s + weights[i.importance], 0);
  const filledWeight  = relevantItems
    .filter((i) => i.status === "filled" || i.status === "approximate")
    .reduce((s, i) => s + weights[i.importance], 0);
  const percentage = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;

  const level: DataMaturityResult["level"] =
    percentage >= 80 ? "avancado" :
    percentage >= 50 ? "bom" :
    percentage >= 20 ? "em_andamento" : "inicial";

  // ── criticalMissing, quickWins, nextBestFields ────────────────────────────────
  const criticalMissing = items.filter(
    (i) => i.importance === "critica" && (i.status === "unknown" || i.status === "to_discover")
  );

  const quickWins = relevantItems.filter(
    (i) => i.status === "unknown" && i.estimatedMinutes <= 2 && i.importance !== "recomendada"
  ).slice(0, 3);

  const nextBestFields = relevantItems
    .filter((i) => i.status === "unknown" || i.status === "to_discover")
    .sort((a, b) => {
      const order = { critica: 0, importante: 1, recomendada: 2 };
      if (order[a.importance] !== order[b.importance]) return order[a.importance] - order[b.importance];
      return a.estimatedMinutes - b.estimatedMinutes;
    })
    .slice(0, 3);

  // ── Capacidades desbloqueadas/bloqueadas ──────────────────────────────────────
  const unlockedCapabilities: string[] = [];
  const lockedCapabilities: string[] = [];

  const capabilityMap: [string, boolean, string][] = [
    ["Alertas de AVCB (90/60/30 dias)",     essentialDates[0].isFilled, "Preencher vencimento do AVCB"],
    ["Alertas de seguro predial",           essentialDates[1].isFilled, "Preencher vencimento do seguro"],
    ["Alertas de mandato do síndico",       essentialDates[2].isFilled, "Preencher fim do mandato"],
    ["Score de saúde operacional",          essentialDatesFilled >= 1,  "Preencher ao menos 1 data essencial"],
    ["Controle de férias",                  funcs.length > 0,           "Cadastrar funcionários"],
    ["Verificação de elevador",             hasElevador && !!mem.ultimaManutencaoElevador, "Informar manutenção do elevador"],
    ["Calendário de manutenções",           manutencoes.filter((m) => m.ativo).length > 0, "Ativar manutenções recorrentes"],
    ["Orientações de gestão personalizadas", !!prof?.tipoGestao,        "Informar tipo de gestão"],
  ];

  for (const [label, isUnlocked, lockHint] of capabilityMap) {
    if (isUnlocked) unlockedCapabilities.push(label);
    else lockedCapabilities.push(`${label} — ${lockHint}`);
  }

  // ── Compatibilidade ───────────────────────────────────────────────────────────
  const hasProfileData  = !!prof;
  const hasFuncionarios = funcs.length > 0;
  const hasManutencoes  = manutencoes.filter((m) => m.ativo).length > 0;
  const hasDocumentos   = docs.filter((d) => d.status === "tenho").length > 0;
  const overallPct      = percentage;

  const nextStep = buildNextStep(essentialDates, items, hasProfileData, hasFuncionarios, hasManutencoes);

  return {
    percentage,
    level,
    knownCount,
    unknownCount,
    approximateCount,
    toDiscoverCount,
    notApplicableCount,
    criticalMissing,
    quickWins,
    nextBestFields,
    unlockedCapabilities,
    lockedCapabilities,
    // compat
    essentialDatesFilled,
    essentialDates,
    hasProfile: hasProfileData,
    hasFuncionarios,
    hasManutencoes,
    hasDocumentos,
    overallPct,
    nextStep,
  };
}

function buildNextStep(
  essentialDates: EssentialDateInfo[],
  items: DataMaturityItem[],
  hasProfileData: boolean,
  hasFuncionarios: boolean,
  hasManutencoes: boolean,
): DataMaturityNextStep | null {
  // 1. Datas essenciais desconhecidas
  const missing = essentialDates.filter((d) => !d.isFilled && !d.isToDiscover);
  if (missing.length > 0) {
    const next = missing[0];
    const item = items.find((i) => i.id === next.key);
    return {
      id:            `fill_${next.key}`,
      titulo:        next.label,
      subtitulo:     next.hint,
      campo:         next.key,
      target:        "condominio",
      priority:      1,
      discoveryHint: item?.discoveryHint,
    };
  }

  // 2. Datas essenciais a descobrir
  const toDiscover = essentialDates.filter((d) => d.isToDiscover);
  if (toDiscover.length > 0) {
    const next = toDiscover[0];
    const item = items.find((i) => i.id === next.key);
    return {
      id:            `discover_${next.key}`,
      titulo:        `Descobrir: ${next.label}`,
      subtitulo:     "Você marcou 'descobrir depois'. Registre quando tiver a informação.",
      campo:         next.key,
      target:        "condominio",
      priority:      2,
      discoveryHint: item?.discoveryHint,
    };
  }

  // 3. Perfil básico não preenchido
  if (!hasProfileData) {
    return {
      id:        "fill_profile",
      titulo:    "Identificar seu condomínio",
      subtitulo: "Ativa orientações específicas para o tipo e tamanho do prédio.",
      target:    "condominio",
      priority:  3,
    };
  }

  // 4. Sem funcionários registrados
  if (!hasFuncionarios) {
    return {
      id:        "add_funcionario",
      titulo:    "Cadastrar funcionários",
      subtitulo: "Ativa o controle de férias e obrigações trabalhistas.",
      target:    "condominio",
      priority:  4,
    };
  }

  // 5. Sem manutenções ativas
  if (!hasManutencoes) {
    return {
      id:        "add_manutencao",
      titulo:    "Ativar manutenções recorrentes",
      subtitulo: "Cria um calendário automático de manutenções obrigatórias.",
      target:    "condominio",
      priority:  5,
    };
  }

  return null;
}
