// Rastreia última atividade e último sync para exibição de contexto.

const ACTIVITY_KEY = "amigo_last_activity";

export interface LastActivity {
  action: string;
  detail: string | null;
  at: string; // ISO timestamp
}

export function recordActivity(action: string, detail?: string): void {
  if (typeof window === "undefined") return;
  try {
    const entry: LastActivity = {
      action,
      detail: detail ?? null,
      at: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entry));
  } catch { /* quota — ignora */ }
}

export function getLastActivity(): LastActivity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as LastActivity) : null;
  } catch {
    return null;
  }
}

export function formatActivityTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Agora mesmo";
  if (mins < 60) return `Há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
