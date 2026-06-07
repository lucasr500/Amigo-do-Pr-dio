// Scheduler local determinístico.
// Roda na abertura do app e em intervalos configuráveis.
// Sem cron real — usa app startup e Page Visibility API.

import { runNotificationEngine } from "./notifications";
import { captureHealthSnapshot } from "./health-history";
import { isEnabled } from "./feature-flags";
import { addAuditEntry, getHealthHistory } from "./session";
import { evaluateMilestones } from "./milestones";

const SCHEDULER_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

let schedulerTimer: ReturnType<typeof setInterval> | null = null;

type SchedulerTask = {
  id: string;
  run: () => void;
};

const TASKS: SchedulerTask[] = [
  {
    id: "notification_engine",
    run: () => {
      if (!isEnabled("notifications_enabled")) return;
      const created = runNotificationEngine();
      if (created > 0) {
        addAuditEntry({
          category: "health",
          action: `${created} notificação${created > 1 ? "ões" : ""} gerada${created > 1 ? "s" : ""} pelo scheduler`,
          impact: "neutral",
        });
      }
    },
  },
  {
    id: "health_snapshot",
    run: () => {
      if (!isEnabled("health_history_enabled")) return;
      const today = new Date().toISOString().slice(0, 10);
      const history = getHealthHistory();
      // Só captura se ainda não tiver snapshot de hoje
      if (!history.some((s) => s.date === today)) {
        captureHealthSnapshot();
      }
    },
  },
  {
    id: "milestones",
    run: () => {
      const newMilestones = evaluateMilestones();
      if (newMilestones.length > 0) {
        addAuditEntry({
          category: "health",
          action: `Marco atingido: ${newMilestones.join(", ")}`,
          impact: "positive",
        });
      }
    },
  },
];

function runAllTasks(): void {
  for (const task of TASKS) {
    try {
      task.run();
    } catch (e) {
      console.warn(`[scheduler] task ${task.id} failed:`, e);
    }
  }
}

// Inicia o scheduler. Deve ser chamado 1x na abertura do app.
// Retorna função de cleanup para useEffect.
export function startScheduler(): () => void {
  if (typeof window === "undefined") return () => { /* empty */ };

  // Roda imediatamente na abertura
  runAllTasks();

  // Roda periodicamente
  schedulerTimer = setInterval(runAllTasks, SCHEDULER_INTERVAL_MS);

  // Roda ao voltar para a aba (Page Visibility API)
  const handleVisibility = () => {
    if (!document.hidden) runAllTasks();
  };
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    if (schedulerTimer) clearInterval(schedulerTimer);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}
