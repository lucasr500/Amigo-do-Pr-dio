import type { DocumentoCategoria } from "@/lib/session";

export type DocFilter = "todos" | "criticos" | "faltam" | "vencidos" | "proximos" | "regulares" | "sem_revisao";

export const DOC_FILTER_LABEL: Record<DocFilter, string> = {
  todos:       "Todos",
  criticos:    "Críticos",
  faltam:      "Faltam",
  vencidos:    "Vencidos",
  proximos:    "Próximos",
  regulares:   "Regulares",
  sem_revisao: "Sem revisão",
};

export const DOC_FILTERS: DocFilter[] = ["todos", "criticos", "faltam", "vencidos", "proximos", "regulares", "sem_revisao"];

export const CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  seguranca:   "Segurança",
  trabalhista: "Trabalhista",
  juridico:    "Jurídico",
  operacional: "Operacional",
  fiscal:      "Fiscal",
  manutencao:  "Manutenção",
};

export const CATEGORIA_COR: Record<DocumentoCategoria, string> = {
  seguranca:   "bg-terracotta-50 text-terracotta-700",
  trabalhista: "bg-amber-50 text-amber-700",
  juridico:    "bg-navy-50 text-navy-600",
  operacional: "bg-teal-50 text-teal-700",
  fiscal:      "bg-purple-50 text-purple-700",
  manutencao:  "bg-orange-50 text-orange-700",
};

export const GRUPOS: DocumentoCategoria[] = ["juridico", "seguranca", "manutencao", "trabalhista", "operacional", "fiscal"];

export const GRUPO_DESCRICAO: Record<DocumentoCategoria, string> = {
  juridico:    "Base legal do condomínio",
  seguranca:   "Documentos obrigatórios de segurança",
  manutencao:  "Contratos e laudos técnicos",
  trabalhista: "Documentação de pessoal",
  operacional: "Contratos e comprovantes operacionais",
  fiscal:      "Situação fiscal e tributária",
};

export const EMPTY_STATE_EXPERT: Record<DocumentoCategoria, string> = {
  juridico:    "Convenção, regimento e ata de eleição são a base legal do condomínio. Sem eles, decisões em assembleia podem ser contestadas.",
  seguranca:   "AVCB, SPDA e brigada de incêndio são exigências do Corpo de Bombeiros. A falta pode gerar interdição do prédio.",
  manutencao:  "Contratos de elevador e laudos técnicos comprovam que a manutenção obrigatória está sendo feita. Protegem o síndico em caso de acidente.",
  trabalhista: "CCT, PPRA/PGR e PCMSO são obrigações trabalhistas para quem tem funcionários. A ausência gera passivo e autuação.",
  operacional: "Comprovantes de serviços periódicos demonstram que o condomínio está em ordem. Podem ser exigidos em controle auxiliar da administradora.",
  fiscal:      "CND indica que o condomínio está quite com obrigações fiscais. Necessária em financiamentos e algumas negociações.",
};

export const CRIT_ORDER: Record<string, number> = { critica: 0, importante: 1, recomendada: 2 };
