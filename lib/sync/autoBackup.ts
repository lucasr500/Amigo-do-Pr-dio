// Preferência de backup automático por dispositivo.
// Opt-in explícito — nunca ativado por default.
// Separado do flag global sync_enabled para dar controle ao usuário.

const KEY = "amigo_auto_cloud_backup_enabled";

/** Retorna true se o usuário ativou backup automático neste dispositivo. */
export function isAutoBackupEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

/** Ativa ou desativa o backup automático neste dispositivo. */
export function setAutoBackupEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) localStorage.setItem(KEY, "true");
    else localStorage.removeItem(KEY);
  } catch {
    // quota — ignora silenciosamente
  }
}
