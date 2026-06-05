import MetricCard from "@/components/ui/MetricCard";
import { formatMoneyCompact } from "./financial-ui";

type Props = {
  estimatedBalance: number;
  resultado: number;
  totalUpcoming: number;
  next3DaysCount: number;
  riskLevel: string;
};

const RISK_STATUS: Record<string, "good" | "warning" | "danger"> = {
  "crítico": "danger",
  "atenção": "warning",
  "baixo": "good",
};

export default function FinancialExecutiveCards({
  estimatedBalance,
  resultado,
  totalUpcoming,
  next3DaysCount,
  riskLevel,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4">
      <MetricCard
        label="Saldo estimado"
        value={formatMoneyCompact(estimatedBalance)}
        status={estimatedBalance < 0 ? "danger" : "neutral"}
      />
      <MetricCard
        label="Resultado do mês"
        value={`${resultado >= 0 ? "+" : ""}${formatMoneyCompact(resultado)}`}
        status={resultado < 0 ? "danger" : "good"}
      />
      <MetricCard
        label="Contas próximas"
        value={totalUpcoming > 0 ? `${totalUpcoming} conta${totalUpcoming > 1 ? "s" : ""}` : "—"}
        detail={next3DaysCount > 0 ? `${next3DaysCount} em 3 dias` : undefined}
        status={next3DaysCount > 0 ? "danger" : totalUpcoming > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label="Risco de caixa"
        value={riskLevel}
        status={RISK_STATUS[riskLevel] ?? "neutral"}
      />
    </div>
  );
}
