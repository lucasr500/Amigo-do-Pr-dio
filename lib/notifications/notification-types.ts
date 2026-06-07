// Tipos do sistema de notificações internas.
// Sem push real ainda — notificações aparecem no centro interno ao abrir o app.

export type NotificationType =
  | "critical_deadline"      // AVCB/seguro/mandato vencendo/vencido
  | "weekly_review"          // revisão semanal não feita
  | "monthly_review"         // revisão mensal disponível
  | "overdue_document"       // documento essencial sem status
  | "overdue_vacation"       // funcionário com férias vencidas
  | "implementation_gap"     // implantação parada há muito tempo
  | "health_drop"            // Health Score caiu significativamente
  | "stale_pending"          // próximo passo parado >21 dias
  | "routine_overdue"        // manutenção rotineira atrasada
  | "onboarding_incomplete"  // onboarding não finalizado
  | "mandate_expiring"       // mandato do síndico vencendo
  | "ago_overdue"            // AGO atrasada (>14 meses sem assembleia)
  | "backup_overdue"         // backup não feito há muito tempo
  | "score_milestone";       // health score atingiu marco importante

export type NotificationSeverity = "info" | "warning" | "critical";

// Re-exporta o tipo principal de session.ts para uso interno.
// O tipo AppNotification vive em session.ts para ficar próximo ao storage.
export type { AppNotification } from "@/lib/session";
