import type { DocumentosSummary } from "@/lib/session-documentos";
import { DOC_FILTER_LABEL, DOC_FILTERS } from "./documentos-config";

export function buildDocumentosFilterOptions() {
  return DOC_FILTERS.map((value) => ({ value, label: DOC_FILTER_LABEL[value] }));
}

export function buildDocumentosExecutiveText(summary: DocumentosSummary): string {
  if (summary.criticosPendentes > 0) {
    return `${summary.criticosPendentes} documento${summary.criticosPendentes > 1 ? "s" : ""} crítico${summary.criticosPendentes > 1 ? "s" : ""} pendente${summary.criticosPendentes > 1 ? "s" : ""} de ação.`;
  }
  if (summary.vencidos > 0) {
    return `${summary.vencidos} documento${summary.vencidos > 1 ? "s" : ""} vencido${summary.vencidos > 1 ? "s" : ""} para regularizar.`;
  }
  if (summary.proximos > 0) {
    return `${summary.proximos} documento${summary.proximos > 1 ? "s" : ""} vencem nos próximos 60 dias.`;
  }
  return "Documentos sem pendências críticas registradas no app.";
}
