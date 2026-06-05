import FilterChips from "@/components/ui/FilterChips";
import type { FinancialFilter } from "./financial-ui";
import { buildFinancialFilterOptions } from "./financial-ui";

type Props = {
  value: FinancialFilter;
  onChange: (value: FinancialFilter) => void;
};

export default function FinancialFilters({ value, onChange }: Props) {
  return (
    <FilterChips
      value={value}
      options={buildFinancialFilterOptions()}
      onChange={onChange}
      ariaLabel="Filtros do financeiro auxiliar"
    />
  );
}
