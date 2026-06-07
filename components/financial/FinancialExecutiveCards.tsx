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
  crítico: "danger",
  atenção: "warning",
  baixo: "good",
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
        label="Caixa previsto"
        value={formatMoneyCompact(estimatedBalance)}
        detail="saldo local"
        status={estimatedBalance < 0 ? "danger" : "neutral"}
      />
      <MetricCard
        label="Resultado"
        value={`${resultado >= 0 ? "+" : ""}${formatMoneyCompact(resultado)}`}
        detail="receitas - despesas"
        status={resultado < 0 ? "danger" : "good"}
      />
      <MetricCard
        label="Próximos prazos"
        value={totalUpcoming > 0 ? `${totalUpcoming} conta${totalUpcoming > 1 ? "s" : ""}` : "Tudo certo"}
        detail={next3DaysCount > 0 ? `${next3DaysCount} nos próximos 3 dias` : "sem urgência"}
        status={next3DaysCount > 0 ? "danger" : totalUpcoming > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label="Risco de caixa"
        value={riskLevel}
        detail="visão executiva"
        status={RISK_STATUS[riskLevel] ?? "neutral"}
      />
    </div>
  );
}
