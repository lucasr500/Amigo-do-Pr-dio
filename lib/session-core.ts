// ─── Session core — primitivos de persistência ────────────────────────────────
// Camada de infraestrutura de storage: KEYS, safeRead, safeWrite, todayISO.
// Sem lógica de domínio. Importado por session-pendencias, session-agenda e
// pelo próprio session.ts para uso interno.
//
// Regra: este módulo NÃO importa de nenhum módulo de domínio do app.

// Chaves do localStorage — centralizadas para facilitar migração futura para backend
export const KEYS = {
  QUERIES:              "amigo_queries",    // escrito por data.ts logQuery()
  FAVORITES:            "amigo_favorites",
  STATS:                "amigo_stats",
  SHARES:               "amigo_shares",
  CHECKLISTS:           "amigo_checklists",
  CHECKLIST_EVENTS:     "amigo_checklist_events",
  INTERACTIONS:         "amigo_interactions",
  PROFILE:              "amigo_profile",
  MEMORIA:              "amigo_memoria",
  MEMORIA_ASSISTIDA:    "amigo_memoria_assistida",
  DOCUMENTOS:           "amigo_documentos",
  FUNCIONARIOS:         "amigo_funcionarios",
  MANUTENCOES:          "amigo_manutencoes",
  IMPLANTACAO_MODE:     "amigo_implantacao_mode",
  SESSION_META:         "amigo_session_meta",
  RESOLUTION_EVENTS:    "amigo_resolution_events",
  PENDENCIAS:           "amigo_pendencias",
  OCORRENCIAS:          "amigo_ocorrencias",
  AGENDA:               "amigo_agenda",
  REVISAO_MENSAL_HOME:  "amigo_revisao_mensal_home",
  MONTHLY_REVIEW_STATE:   "amigo_monthly_review_state",
  MONTHLY_REVIEW_HISTORY: "amigo_monthly_review_history",
  REVISAO_SEMANAL:       "amigo_revisao_semanal",
  ONBOARDING_COMPLETE:   "amigo_onboarding_complete",
  COMUNICADO_HISTORY:    "amigo_comunicado_history",
  NOTIFICATIONS:         "amigo_notifications",
  HEALTH_HISTORY:        "amigo_health_history",
  AUDIT_LOG:             "amigo_audit_log",
} as const;

// Lê de localStorage com fallback seguro.
// Retorna fallback se window não existe, chave ausente, ou JSON corrompido.
export function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed === null && fallback !== null) return fallback;
    return parsed;
  } catch {
    // JSON corrompido — remove a chave para evitar problema recorrente
    try { localStorage.removeItem(key); } catch { /* empty */ }
    return fallback;
  }
}

// Escreve em localStorage com handler de quota exceeded.
// No-op em ambiente de servidor (typeof window === "undefined").
export function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException) {
      // Quota exceeded: libera espaço em ordem de prioridade crescente e retenta
      const candidates = [KEYS.QUERIES, KEYS.AUDIT_LOG, KEYS.HEALTH_HISTORY];
      for (const candidate of candidates) {
        try {
          localStorage.removeItem(candidate);
          localStorage.setItem(key, JSON.stringify(value));
          return;
        } catch {
          // ainda sem espaço — tenta o próximo candidato
        }
      }
    }
  }
}

// Data atual em formato YYYY-MM-DD (fuso local do dispositivo).
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Utilitários de storage ───────────────────────────────────────────────────

// Tamanho estimado dos dados do app em localStorage.
// Conta apenas chaves do prefixo "amigo_" — exclui dados de outros sites/apps.
// Retorna valor em KB (arredondado para cima). Zero se localStorage indisponível.
export function getStorageSizeKB(): number {
  if (typeof window === "undefined") return 0;
  try {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("amigo_")) continue;
      const value = localStorage.getItem(key) ?? "";
      bytes += (key.length + value.length) * 2; // UTF-16: 2 bytes por char
    }
    return Math.ceil(bytes / 1024);
  } catch {
    return 0;
  }
}

// Remove todas as chaves próprias do app. Usado pelo reset seguro em BackupPanel.
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // localStorage indisponível
  }
}
