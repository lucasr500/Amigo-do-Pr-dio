// Feature flags determinísticos — sem backend, sem IA.
// Controla rollout incremental de módulos futuros.
// Armazenado em localStorage como override local de flags.

const FLAG_KEY = "amigo_feature_flags";

// Definição de todos os flags existentes.
// Mudar default aqui ativa/desativa globalmente.
const FLAG_DEFAULTS = {
  notifications_enabled:    true,   // Central de notificações internas
  health_history_enabled:   true,   // Histórico do Health Score
  sync_enabled:             false,  // Sync com Supabase — desativado por default (ativar via localStorage para teste)
  auth_enabled:             true,   // Login/conta — ativo
  multi_device_enabled:     false,  // Multi-device sync (futuro)
  ai_layer_enabled:         false,  // Assistente com IA externa (futuro)
  experimental_dashboard:   false,  // Dashboard experimental
  premium_features:         false,  // Funcionalidades premium (futuro)
} as const;

export type FeatureFlag = keyof typeof FLAG_DEFAULTS;

type FlagOverrides = Partial<Record<FeatureFlag, boolean>>;

function readOverrides(): FlagOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    return raw ? (JSON.parse(raw) as FlagOverrides) : {};
  } catch {
    return {};
  }
}

// Retorna o valor atual de um flag (override > default).
export function isEnabled(flag: FeatureFlag): boolean {
  const overrides = readOverrides();
  if (flag in overrides) return !!overrides[flag];
  return FLAG_DEFAULTS[flag];
}

// Seta um override local (persiste em localStorage).
export function setFlag(flag: FeatureFlag, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = readOverrides();
    overrides[flag] = value;
    localStorage.setItem(FLAG_KEY, JSON.stringify(overrides));
  } catch {
    // quota exceeded — ignora silenciosamente
  }
}

// Remove override — volta ao default.
export function resetFlag(flag: FeatureFlag): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = readOverrides();
    delete overrides[flag];
    localStorage.setItem(FLAG_KEY, JSON.stringify(overrides));
  } catch { /* empty */ }
}

// Retorna todos os flags com valores resolvidos (default + overrides).
export function getAllFlags(): Record<FeatureFlag, boolean> {
  const overrides = readOverrides();
  const result = {} as Record<FeatureFlag, boolean>;
  for (const [key, def] of Object.entries(FLAG_DEFAULTS)) {
    const flag = key as FeatureFlag;
    result[flag] = flag in overrides ? !!overrides[flag] : def;
  }
  return result;
}
