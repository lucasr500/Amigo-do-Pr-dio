import type { DocumentosSummary } from "@/lib/session-documentos";
import FilterChips from "@/components/ui/FilterChips";
import MetricCard from "@/components/ui/MetricCard";
import type { DocFilter } from "./documentos-config";
import { buildDocumentosExecutiveText, buildDocumentosFilterOptions } from "./documentos-ui-helpers";

type Props = {
  activeFilter: DocFilter;
  cadastrados: number;
  onFilterChange: (filter: DocFilter) => void;
  summary: DocumentosSummary;
};

export default function DocumentosStatsHeader({
  activeFilter,
  cadastrados,
  onFilterChange,
  summary,
}: Props) {
  if (cadastrados === 0) {
    return (
      <FilterChips
        value={activeFilter}
        options={buildDocumentosFilterOptions()}
        onChange={onFilterChange}
        ariaLabel="Filtros de documentos essenciais"
        className="mb-3"
      />
    );
  }

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard
          label="Críticos pendentes"
          value={String(summary.criticosPendentes)}
          status={summary.criticosPendentes > 0 ? "danger" : "neutral"}
          onClick={() => onFilterChange("criticos")}
        />
        <MetricCard
          label="Vencidos"
          value={String(summary.vencidos)}
          status={summary.vencidos > 0 ? "danger" : "neutral"}
          onClick={() => onFilterChange("vencidos")}
        />
        <MetricCard
          label="Próximos 60 dias"
          value={String(summary.proximos)}
          status={summary.proximos > 0 ? "warning" : "neutral"}
          onClick={() => onFilterChange("proximos")}
        />
        <MetricCard
          label="Regulares"
          value={String(summary.tenho)}
          status="good"
          onClick={() => onFilterChange("regulares")}
        />
      </div>

      <div className="mb-3 rounded-[10px] bg-navy-50/40 px-3 py-2">
        <p className="text-[11.5px] leading-relaxed text-navy-600">
          {buildDocumentosExecutiveText(summary)}
        </p>
      </div>

      <FilterChips
        value={activeFilter}
        options={buildDocumentosFilterOptions()}
        onChange={onFilterChange}
        ariaLabel="Filtros de documentos essenciais"
        className="mb-3"
      />
    </>
  );
}
