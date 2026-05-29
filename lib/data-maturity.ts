// Maturidade de dados — mede o quanto o usuário preencheu e aponta
// o próximo passo de MENOR FRICÇÃO. Sem IA. 100% determinístico.

import {
  getMemoriaAssistida,
  getMemoriaOperacional,
  getProfile,
  getDocumentos,
  getFuncionarios,
  getManutencoes,
  type AssistedDateField,
} from "@/lib/session";

export type EssentialDateKey = "avcb" | "seguro" | "mandato";

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
};

export type DataMaturityResult = {
  essentialDatesFilled: number;   // 0-3
  essentialDates: EssentialDateInfo[];
  hasProfile: boolean;
  hasFuncionarios: boolean;
  hasManutencoes: boolean;
  hasDocumentos: boolean;
  overallPct: number;             // 0-100
  nextStep: DataMaturityNextStep | null;
};

const ESSENTIAL_DATE_META: Record<EssentialDateKey, { label: string; hint: string }> = {
  avcb:    { label: "Vencimento do AVCB", hint: "O app avisa 90, 60 e 30 dias antes do vencimento." },
  seguro:  { label: "Vencimento do seguro predial", hint: "O app avisa quando a renovação se aproximar." },
  mandato: { label: "Fim do mandato do síndico", hint: "O app lembra de convocar a assembleia com antecedência." },
};

function isDateFilled(field?: AssistedDateField, legacyValue?: string): boolean {
  if (legacyValue) return true;
  if (!field) return false;
  return field.status === "filled" || field.status === "estimated" || field.status === "not_applicable";
}

function isToDiscover(field?: AssistedDateField): boolean {
  return field?.status === "to_discover" || field?.status === "unknown";
}

export function buildDataMaturity(): DataMaturityResult {
  const assistida = getMemoriaAssistida();
  const mem = getMemoriaOperacional();
  const prof = getProfile();
  const docs = getDocumentos();
  const funcs = getFuncionarios();
  const manutencoes = getManutencoes();

  const essentialDates: EssentialDateInfo[] = [
    {
      key:         "avcb",
      ...ESSENTIAL_DATE_META.avcb,
      isFilled:    isDateFilled(assistida.avcb, mem.vencimentoAVCB),
      isToDiscover: isToDiscover(assistida.avcb),
      field:       assistida.avcb,
    },
    {
      key:         "seguro",
      ...ESSENTIAL_DATE_META.seguro,
      isFilled:    isDateFilled(assistida.seguro, mem.vencimentoSeguro),
      isToDiscover: isToDiscover(assistida.seguro),
      field:       assistida.seguro,
    },
    {
      key:         "mandato",
      ...ESSENTIAL_DATE_META.mandato,
      isFilled:    isDateFilled(assistida.mandato, mem.fimMandatoSindico),
      isToDiscover: isToDiscover(assistida.mandato),
      field:       assistida.mandato,
    },
  ];

  const essentialDatesFilled = essentialDates.filter((d) => d.isFilled).length;
  const hasProfileData = !!prof;
  const hasFuncionarios = funcs.length > 0;
  const hasManutencoes = manutencoes.filter((m) => m.ativo).length > 0;
  const hasDocumentos = docs.filter((d) => d.status === "tenho").length > 0;

  // Progresso geral: 5 componentes ponderados
  const scores = [
    essentialDatesFilled >= 1 ? 25 : 0,
    essentialDatesFilled >= 2 ? 15 : 0,
    essentialDatesFilled >= 3 ? 10 : 0,
    hasProfileData ? 20 : 0,
    hasFuncionarios ? 10 : 0,
    hasManutencoes ? 10 : 0,
    hasDocumentos ? 10 : 0,
  ];
  const overallPct = Math.min(100, scores.reduce((a, b) => a + b, 0));

  // Próximo passo: menor fricção de maior impacto
  const nextStep = buildNextStep(essentialDates, hasProfileData, hasFuncionarios, hasManutencoes);

  return {
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
  hasProfileData: boolean,
  hasFuncionarios: boolean,
  hasManutencoes: boolean,
): DataMaturityNextStep | null {
  // 1. Se não tem nenhuma data essential
  const missing = essentialDates.filter((d) => !d.isFilled && !d.isToDiscover);
  if (missing.length > 0) {
    const next = missing[0];
    return {
      id:        `fill_${next.key}`,
      titulo:    next.label,
      subtitulo: next.hint,
      campo:     next.key,
      target:    "condominio",
      priority:  1,
    };
  }

  // 2. Se tem "a descobrir" — lembrar de resolver
  const toDiscover = essentialDates.filter((d) => d.isToDiscover);
  if (toDiscover.length > 0) {
    const next = toDiscover[0];
    return {
      id:        `discover_${next.key}`,
      titulo:    `Descobrir: ${next.label}`,
      subtitulo: "Você marcou 'descobrir depois'. Quando tiver a informação, registre aqui.",
      campo:     next.key,
      target:    "condominio",
      priority:  2,
    };
  }

  // 3. Perfil não configurado
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
