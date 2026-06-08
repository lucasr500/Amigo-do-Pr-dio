// Medição e aviso de uso de localStorage.
// Estimativa conservadora baseada em 4MB (abaixo do limite típico de 5MB).
// Sem side effects — puro, testável.

const ESTIMATED_MAX_KB = 4096; // 4 MB conservador

export type QuotaLevel = "ok" | "warn" | "danger" | "critical";

export type StorageQuotaStatus = {
  usedKB: number;
  maxKB: number;
  pct: number;           // 0–100
  level: QuotaLevel;
  message: string | null;
};

export function getStorageQuotaStatus(usedKB: number): StorageQuotaStatus {
  const pct = Math.round((usedKB / ESTIMATED_MAX_KB) * 100);

  let level: QuotaLevel = "ok";
  let message: string | null = null;

  if (pct >= 95) {
    level = "critical";
    message = "Armazenamento local quase cheio. Exporte um backup e limpe dados antigos para evitar perda.";
  } else if (pct >= 80) {
    level = "danger";
    message = "Armazenamento local acima de 80%. Recomendado exportar backup em breve.";
  } else if (pct >= 60) {
    level = "warn";
    message = "Uso de armazenamento moderado. Exporte backup periodicamente.";
  }

  return {
    usedKB,
    maxKB: ESTIMATED_MAX_KB,
    pct,
    level,
    message,
  };
}
