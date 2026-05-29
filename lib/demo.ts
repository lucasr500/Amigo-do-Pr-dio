import { getUserBackupJson, importUserData } from "./session";
import { getDemoUserBackup } from "./demo-data";

const DEMO_FLAG_KEY = "amigo_demo_active";
const DEMO_BACKUP_KEY = "amigo_pre_demo_backup";

export function isDemoActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function activateDemo(): void {
  if (typeof window === "undefined") return;
  try {
    // Salva dados reais antes de sobrescrever
    const current = getUserBackupJson();
    localStorage.setItem(DEMO_BACKUP_KEY, current);
    // Carrega dados fictícios
    const demoJson = JSON.stringify(getDemoUserBackup());
    importUserData(demoJson);
    sessionStorage.setItem(DEMO_FLAG_KEY, "1");
  } catch {
    // Não deve interromper o fluxo
  }
}

export function deactivateDemo(): void {
  if (typeof window === "undefined") return;
  try {
    const previous = localStorage.getItem(DEMO_BACKUP_KEY);
    if (previous) {
      importUserData(previous);
      localStorage.removeItem(DEMO_BACKUP_KEY);
    } else {
      // Sem backup — limpa os dados do demo sem apagar nada real
      const emptyJson = JSON.stringify({
        version: "6",
        app: "amigo-do-predio",
        exportedAt: new Date().toISOString(),
        profile: null,
        memoria: {},
        favorites: [],
        checklists: {},
        pendencias: [],
        ocorrencias: [],
        agenda: [],
        memoriaAssistida: {},
        documentos: [],
        funcionarios: [],
        manutencoes: [],
      });
      importUserData(emptyJson);
    }
    sessionStorage.removeItem(DEMO_FLAG_KEY);
  } catch {
    sessionStorage.removeItem(DEMO_FLAG_KEY);
  }
}
