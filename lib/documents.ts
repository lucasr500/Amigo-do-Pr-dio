// ─── Documentos unificados (W1.1) ────────────────────────────────────────────
// UMA superfície de leitura sobre os DOIS stores legados — essenciais
// (session-documentos: checklist de conformidade) e públicos (community-documents:
// biblioteca publicada) — cada item com `visibility` por papel.
//
// SEM PERDA DE DADOS: esta camada apenas LÊ os stores existentes e os projeta num
// modelo comum; não apaga nem reescreve chave nenhuma. Os dois stores seguem como
// fonte de escrita (consumidores legados intocados — invariante "não quebrar
// dependentes"). A unificação é da EXPERIÊNCIA de leitura, filtrada por papel.

import {
  getDocumentos, DOCUMENTO_LABEL, DOCUMENTO_CATEGORIA, DOCUMENTO_CRITICIDADE,
  type DocumentoEssencial, type DocumentoEssencialId,
  type DocumentoStatus, type DocumentoCategoria, type DocumentoCriticidade,
} from "./session-documentos";
import { getPublicDocuments } from "./community-documents";
import { PUBLIC_DOC_CATEGORY_LABELS, type PublicDocument, type Visibility, type CommunityRole } from "./community-types";
import { canSeeVisibility } from "./community-permissions";

export type DocSource = "essencial" | "publico";

export type UnifiedDocument = {
  uid: string;              // namespaced: `ess:<id>` | `pub:<id>` — estável e único entre fontes
  source: DocSource;
  sourceId: string;         // id original no store de origem
  title: string;
  category: string;         // rótulo humano da categoria
  visibility: Visibility;   // essenciais = gestao (conformidade interna); públicos = a sua própria
  status?: DocumentoStatus; // só essenciais
  criticidade?: DocumentoCriticidade; // só essenciais
  vencimento?: string;      // YYYY-MM-DD (essencial.dataVencimento|vencimento.value | public.validUntil)
  url?: string;             // link externo
  updatedAt?: string;
};

// Essenciais não têm visibilidade própria: são conformidade interna da gestão.
const ESSENCIAL_VISIBILITY: Visibility = "gestao";

function essencialToUnified(d: DocumentoEssencial): UnifiedDocument {
  const id = d.id as DocumentoEssencialId;
  return {
    uid: `ess:${d.id}`,
    source: "essencial",
    sourceId: d.id,
    title: DOCUMENTO_LABEL[id] ?? d.id,
    category: humanCategoria(DOCUMENTO_CATEGORIA[id]),
    visibility: ESSENCIAL_VISIBILITY,
    status: d.status,
    criticidade: DOCUMENTO_CRITICIDADE[id],
    vencimento: d.dataVencimento || d.vencimento?.value || undefined,
    url: d.linkExterno || undefined,
    updatedAt: d.updatedAt,
  };
}

function publicoToUnified(d: PublicDocument): UnifiedDocument {
  return {
    uid: `pub:${d.id}`,
    source: "publico",
    sourceId: d.id,
    title: d.title,
    category: PUBLIC_DOC_CATEGORY_LABELS[d.category] ?? "Outro",
    visibility: d.visibility,
    vencimento: d.validUntil || undefined,
    url: d.url || undefined,
    updatedAt: d.updatedAt,
  };
}

const CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  seguranca: "Segurança", trabalhista: "Trabalhista", juridico: "Jurídico",
  operacional: "Operacional", fiscal: "Fiscal", manutencao: "Manutenção",
};
function humanCategoria(c: DocumentoCategoria | undefined): string {
  return (c && CATEGORIA_LABEL[c]) || "Outro";
}

/** Todos os documentos (essenciais + públicos) num modelo único. Apenas leitura. */
export function getUnifiedDocuments(): UnifiedDocument[] {
  const essenciais = getDocumentos().map(essencialToUnified);
  const publicos = getPublicDocuments().map(publicoToUnified);
  return [...essenciais, ...publicos];
}

/** Documentos visíveis para um papel — a régua de visibilidade unificada. */
export function getDocumentsForRole(role: CommunityRole): UnifiedDocument[] {
  return getUnifiedDocuments().filter((d) => canSeeVisibility(role, d.visibility));
}

/** Resumo leve por papel — para cards/Início sem reabrir cada store. */
export function getUnifiedDocumentsSummary(role: CommunityRole): {
  total: number; visiveis: number; porFonte: Record<DocSource, number>;
} {
  const all = getUnifiedDocuments();
  const visiveis = all.filter((d) => canSeeVisibility(role, d.visibility));
  return {
    total: all.length,
    visiveis: visiveis.length,
    porFonte: {
      essencial: visiveis.filter((d) => d.source === "essencial").length,
      publico: visiveis.filter((d) => d.source === "publico").length,
    },
  };
}
