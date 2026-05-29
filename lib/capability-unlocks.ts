// Capacidades desbloqueadas conforme o usuário preenche dados.
// Usado para mostrar o "por quê" de cada campo — o que o preenchimento ativa.

import { buildDataMaturity, type EssentialDateKey } from "@/lib/data-maturity";
import { getProfile } from "@/lib/session";

export type CapabilityUnlock = {
  id: string;
  titulo: string;
  descricao: string;
  isUnlocked: boolean;
  unlockedByLabel: string;
};

export function buildCapabilityUnlocks(): CapabilityUnlock[] {
  const m = buildDataMaturity();
  const prof = getProfile();

  const avcbFilled   = m.essentialDates.find((d) => d.key === "avcb")?.isFilled ?? false;
  const seguroFilled = m.essentialDates.find((d) => d.key === "seguro")?.isFilled ?? false;
  const mandatoFilled = m.essentialDates.find((d) => d.key === "mandato")?.isFilled ?? false;

  return [
    {
      id:             "monitoring_avcb",
      titulo:         "Alertas de AVCB",
      descricao:      "Aviso automático 90, 60, 30 e 7 dias antes do vencimento.",
      isUnlocked:     avcbFilled,
      unlockedByLabel: "Vencimento do AVCB",
    },
    {
      id:             "monitoring_seguro",
      titulo:         "Alertas de seguro predial",
      descricao:      "Aviso antes do vencimento da apólice.",
      isUnlocked:     seguroFilled,
      unlockedByLabel: "Vencimento do seguro",
    },
    {
      id:             "monitoring_mandato",
      titulo:         "Alerta de assembleia",
      descricao:      "Lembrete para convocar a assembleia de eleição/recondução.",
      isUnlocked:     mandatoFilled,
      unlockedByLabel: "Fim do mandato do síndico",
    },
    {
      id:             "health_score",
      titulo:         "Score de saúde operacional",
      descricao:      "Percentual que reflete o estado real do prédio.",
      isUnlocked:     m.essentialDatesFilled >= 1,
      unlockedByLabel: "Qualquer data essencial",
    },
    {
      id:             "elevator_monitoring",
      titulo:         "Verificação de manutenção de elevador",
      descricao:      "O app detecta se a manutenção mensal está em dia.",
      isUnlocked:     prof?.hasElevador === true,
      unlockedByLabel: "Perfil: tem elevador",
    },
    {
      id:             "vacation_control",
      titulo:         "Controle de férias",
      descricao:      "Alerta quando férias de funcionários estão a vencer ou vencidas.",
      isUnlocked:     m.hasFuncionarios,
      unlockedByLabel: "Funcionários cadastrados",
    },
    {
      id:             "maintenance_calendar",
      titulo:         "Calendário de manutenções",
      descricao:      "Agenda automática com próximas execuções e alertas de atraso.",
      isUnlocked:     m.hasManutencoes,
      unlockedByLabel: "Manutenções ativas",
    },
  ];
}

export function getUnlockReasonForField(campo: EssentialDateKey): string {
  const reasons: Record<EssentialDateKey, string> = {
    avcb:    "Ativa alertas 90/60/30 dias antes do vencimento.",
    seguro:  "Ativa alerta de renovação da apólice.",
    mandato: "Lembra de convocar a assembleia com antecedência.",
  };
  return reasons[campo];
}
