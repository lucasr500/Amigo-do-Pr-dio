// ─── Domínio: Documentos Essenciais ──────────────────────────────────────────
// Tipos, constantes, normalizador, CRUD e helpers operacionais de documentos.
// Persiste em localStorage via session-core. Sem lógica de UI.
// Importa de session-core e session-types — nunca de session.ts.

import { safeRead, safeWrite, KEYS, todayISO } from "./session-core";
import type { AssistedDateField, ManutencaoFrequencia } from "./session-types";

// Re-export shared types consumed by existing session.ts code
export type { AssistedDateField, ManutencaoFrequencia } from "./session-types";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DocumentoStatus = "tenho" | "nao_tenho" | "precisa_localizar" | "nao_se_aplica";
export type DocumentoCategoria =
  | "seguranca" | "trabalhista" | "juridico" | "operacional" | "fiscal" | "manutencao";
export type DocumentoCriticidade = "critica" | "importante" | "recomendada";

export type DocumentoEssencial = {
  id: string;
  status: DocumentoStatus;
  vencimento?: AssistedDateField;
  observacoes?: string;
  ondeEsta?: string;
  updatedAt: string;
  // Campos v2
  dataVencimento?: string;        // YYYY-MM-DD — vencimento explícito
  recorrencia?: ManutencaoFrequencia;
  // Campos v3 — link e localização física
  linkExterno?: string;
  nomeArquivo?: string;
  // Campos v4 — vínculos operacionais (opcionais, retrocompatíveis)
  responsavel?: string;
  custoEstimado?: number;
  fornecedor?: string;
  observacaoOperacional?: string;
  linkedPendenciaId?: string;
  linkedAgendaEventId?: string;
  linkedFinancialEntryId?: string;
  reviewedAt?: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

export const DOCUMENTOS_ESSENCIAIS_IDS = [
  // Jurídico
  "convencao",
  "regimento",
  "ata_eleicao",
  // Segurança
  "apolice_seguro",
  "avcb_clcb",
  "spda_laudo",
  "brigada_certificado",
  // Manutenção / Contratos
  "contrato_elevador",
  "contrato_limpeza",
  "contrato_portaria",
  "laudos_tecnicos",
  // Operacional / Comprovantes
  "extintores_comprovante",
  "caixa_agua_comprovante",
  "dedetizacao_comprovante",
  // Trabalhista
  "cct_funcionarios",
  "controle_ferias",
  "ppra_pgr",
  "pcmso",
  // Fiscal
  "cnd_condominio",
] as const;

export type DocumentoEssencialId = (typeof DOCUMENTOS_ESSENCIAIS_IDS)[number];

export const DOCUMENTO_LABEL: Record<DocumentoEssencialId, string> = {
  convencao:               "Convenção condominial",
  regimento:               "Regimento interno",
  ata_eleicao:             "Ata de eleição do síndico",
  apolice_seguro:          "Apólice de seguro predial",
  avcb_clcb:               "AVCB / CLCB",
  spda_laudo:              "Laudo SPDA / Para-raio",
  brigada_certificado:     "Certificado de Brigada de Incêndio",
  contrato_elevador:       "Contrato de manutenção de elevadores",
  contrato_limpeza:        "Contrato de limpeza",
  contrato_portaria:       "Contrato de portaria / segurança",
  laudos_tecnicos:         "Laudos técnicos (estrutural, elétrico etc.)",
  extintores_comprovante:  "Comprovante de manutenção de extintores",
  caixa_agua_comprovante:  "Comprovante de limpeza da caixa d'água",
  dedetizacao_comprovante: "Comprovante de dedetização",
  cct_funcionarios:        "CCT aplicável aos funcionários",
  controle_ferias:         "Controle de férias dos funcionários",
  ppra_pgr:                "PPRA / PGR",
  pcmso:                   "PCMSO",
  cnd_condominio:          "CND / Certidão negativa fiscal",
};

export const DOCUMENTO_CATEGORIA: Record<DocumentoEssencialId, DocumentoCategoria> = {
  convencao:               "juridico",
  regimento:               "juridico",
  ata_eleicao:             "juridico",
  apolice_seguro:          "seguranca",
  avcb_clcb:               "seguranca",
  spda_laudo:              "seguranca",
  brigada_certificado:     "seguranca",
  contrato_elevador:       "manutencao",
  contrato_limpeza:        "operacional",
  contrato_portaria:       "operacional",
  laudos_tecnicos:         "manutencao",
  extintores_comprovante:  "seguranca",
  caixa_agua_comprovante:  "operacional",
  dedetizacao_comprovante: "operacional",
  cct_funcionarios:        "trabalhista",
  controle_ferias:         "trabalhista",
  ppra_pgr:                "trabalhista",
  pcmso:                   "trabalhista",
  cnd_condominio:          "fiscal",
};

export const DOCUMENTO_CRITICIDADE: Record<DocumentoEssencialId, DocumentoCriticidade> = {
  convencao:               "critica",
  regimento:               "importante",
  ata_eleicao:             "critica",
  apolice_seguro:          "critica",
  avcb_clcb:               "critica",
  spda_laudo:              "critica",
  brigada_certificado:     "critica",
  contrato_elevador:       "importante",
  contrato_limpeza:        "recomendada",
  contrato_portaria:       "recomendada",
  laudos_tecnicos:         "importante",
  extintores_comprovante:  "critica",
  caixa_agua_comprovante:  "importante",
  dedetizacao_comprovante: "importante",
  cct_funcionarios:        "importante",
  controle_ferias:         "importante",
  ppra_pgr:                "importante",
  pcmso:                   "importante",
  cnd_condominio:          "recomendada",
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getDocumentos(): DocumentoEssencial[] {
  return safeRead<DocumentoEssencial[]>(KEYS.DOCUMENTOS, []);
}

export function saveDocumentos(docs: DocumentoEssencial[]): void {
  safeWrite(KEYS.DOCUMENTOS, docs);
}

export function upsertDocumento(doc: DocumentoEssencial): void {
  const all = getDocumentos().filter((d) => d.id !== doc.id);
  all.push(doc);
  saveDocumentos(all);
}

export function getDocumentoById(id: string): DocumentoEssencial | null {
  return getDocumentos().find((d) => d.id === id) ?? null;
}

// ─── Helpers de status ────────────────────────────────────────────────────────

export function isDocumentoVencido(doc: DocumentoEssencial, today = todayISO()): boolean {
  return !!doc.dataVencimento && doc.dataVencimento < today;
}

export function isDocumentoProximoVencimento(
  doc: DocumentoEssencial,
  days = 60,
  today = todayISO()
): boolean {
  if (!doc.dataVencimento) return false;
  if (doc.dataVencimento < today) return false;
  const future = new Date(`${today}T12:00:00`);
  future.setDate(future.getDate() + days);
  return doc.dataVencimento <= future.toISOString().slice(0, 10);
}

export function isDocumentoFaltante(doc: DocumentoEssencial | undefined): boolean {
  return !doc || doc.status === "nao_tenho" || doc.status === "precisa_localizar";
}

// ─── Data sugerida para renovação ─────────────────────────────────────────────
// Críticos: 30 dias antes; Importantes: 15 dias; Recomendados: 7 dias.
// Se a data calculada já passou, retorna hoje.

export function suggestedRenewalDate(
  docId: DocumentoEssencialId,
  dataVencimento: string,
  today = todayISO()
): string {
  const crit = DOCUMENTO_CRITICIDADE[docId];
  const daysBefore = crit === "critica" ? 30 : crit === "importante" ? 15 : 7;
  const d = new Date(`${dataVencimento}T12:00:00`);
  d.setDate(d.getDate() - daysBefore);
  const suggested = d.toISOString().slice(0, 10);
  return suggested < today ? today : suggested;
}

// ─── Resumo operacional de documentos ─────────────────────────────────────────

export type DocumentosSummary = {
  total: number;
  tenho: number;
  faltam: number;
  vencidos: number;
  proximos: number;
  criticos: number;
  criticosPendentes: number;
  semRevisao: number;
};

export function getDocumentosSummary(today = todayISO()): DocumentosSummary {
  const docs = getDocumentos();
  const docsMap = new Map(docs.map((d) => [d.id, d]));

  let tenho = 0, faltam = 0, vencidos = 0, proximos = 0,
      criticos = 0, criticosPendentes = 0, semRevisao = 0;

  for (const id of DOCUMENTOS_ESSENCIAIS_IDS) {
    const doc = docsMap.get(id);
    const crit = DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica";
    if (crit) criticos++;

    if (!doc) {
      semRevisao++;
      if (crit) criticosPendentes++;
      continue;
    }
    if (doc.status === "tenho") {
      tenho++;
      if (isDocumentoVencido(doc, today)) vencidos++;
      else if (isDocumentoProximoVencimento(doc, 60, today)) proximos++;
    } else if (doc.status === "nao_tenho" || doc.status === "precisa_localizar") {
      faltam++;
      if (crit) criticosPendentes++;
    } else if (doc.status === "nao_se_aplica") {
      tenho++; // N/A counts as resolved
    }
  }

  return {
    total: DOCUMENTOS_ESSENCIAIS_IDS.length,
    tenho,
    faltam,
    vencidos,
    proximos,
    criticos,
    criticosPendentes,
    semRevisao,
  };
}

// ─── Payload builders ─────────────────────────────────────────────────────────

export type DocumentoPendenciaPayload = {
  titulo: string;
  descricao: string;
  categoria: string;
  origem: "documento";
  prioridade: "critica" | "alta" | "media" | "baixa";
  dueDate?: string;
  linkedType: "documento";
  linkedId: string;
  matchedId: string;
  origemDetalhe: string;
};

export function buildPendenciaFromDocumento(
  docId: DocumentoEssencialId,
  doc?: DocumentoEssencial,
  today = todayISO()
): DocumentoPendenciaPayload {
  const label = DOCUMENTO_LABEL[docId];
  const crit = DOCUMENTO_CRITICIDADE[docId];
  const vencido = doc ? isDocumentoVencido(doc, today) : false;
  const status = doc?.status;

  const titulo = vencido
    ? `Regularizar documento vencido: ${label}`
    : status === "nao_tenho"
    ? `Obter documento: ${label}`
    : `Localizar documento: ${label}`;

  const prioridade: DocumentoPendenciaPayload["prioridade"] =
    crit === "critica" && vencido ? "critica"
    : crit === "critica" ? "alta"
    : crit === "importante" ? "media"
    : "baixa";

  return {
    titulo,
    descricao: `Documento "${label}" requer ação operacional. Controle auxiliar — não substitui orientação jurídica ou técnica.`,
    categoria: "gestao",
    origem: "documento",
    prioridade,
    dueDate: doc?.dataVencimento,
    linkedType: "documento",
    linkedId: docId,
    matchedId: docId,
    origemDetalhe: label,
  };
}

export type DocumentoAgendaPayload = {
  title: string;
  date: string;
  type: "vistoria";
  note: string;
  prioridade: "alta" | "media" | "baixa";
};

export function buildAgendaFromDocumento(
  docId: DocumentoEssencialId,
  dataVencimento: string,
  today = todayISO()
): DocumentoAgendaPayload {
  const label = DOCUMENTO_LABEL[docId];
  const crit = DOCUMENTO_CRITICIDADE[docId];
  const date = suggestedRenewalDate(docId, dataVencimento, today);
  const prioridade: "alta" | "media" | "baixa" =
    crit === "critica" ? "alta" : crit === "importante" ? "media" : "baixa";

  return {
    title: `Renovar: ${label}`,
    date,
    type: "vistoria",
    note: `Renovação de documento essencial: ${label}. Vencimento: ${dataVencimento}. [doc:${docId}]`,
    prioridade,
  };
}

export type DocumentoFinancialPayload = {
  type: "conta_a_pagar";
  title: string;
  amount: number;
  dueDate?: string;
  category: string;
  notes: string;
};

function docFinancialCategory(docId: DocumentoEssencialId): string {
  const cat = DOCUMENTO_CATEGORIA[docId];
  if (cat === "seguranca") return "Seguro";
  if (cat === "manutencao") return "Manutenção";
  if (cat === "trabalhista") return "Encargos trabalhistas";
  if (cat === "juridico") return "Condomínio";
  return "Outros";
}

export function buildFinancialFromDocumento(
  docId: DocumentoEssencialId,
  custo: number,
  dataVencimento?: string
): DocumentoFinancialPayload {
  const label = DOCUMENTO_LABEL[docId];
  return {
    type: "conta_a_pagar",
    title: `Renovação: ${label}`,
    amount: custo,
    dueDate: dataVencimento,
    category: docFinancialCategory(docId),
    notes: `Custo previsto para renovação de "${label}". Controle auxiliar — não substitui demonstrativo contábil oficial.`,
  };
}
