// Feature flags determinísticos — sem backend, sem IA.
// Controla rollout incremental de módulos futuros.
// Armazenado em localStorage como override local de flags.

import { KEYS } from "./session-core";
const FLAG_KEY = KEYS.FEATURE_FLAGS;

// Definição de todos os flags existentes.
// Mudar default aqui ativa/desativa globalmente.
const FLAG_DEFAULTS = {
  notifications_enabled:    true,   // Central de notificações internas
  health_history_enabled:   true,   // Histórico do Health Score
  sync_enabled:             false,  // Sync com Supabase — segue a autenticação (anônimo=off, autenticado=on); ver syncFollowsAuth()
  auth_enabled:             true,   // Login/conta — ativo
  tenant_enabled:           true,   // Ativa o contexto multi-tenant (condomínio + papel) ao autenticar
  multi_device_enabled:     false,  // Multi-device sync (futuro)
  agenda_remote_enabled:    false,  // dual-write da Agenda (Fatia 2a)
  assemblies_remote_enabled: false, // dual-write da Assembleia — so liga apos o gate de isolamento verde
  ai_layer_enabled:         false,  // Assistente com IA externa (futuro)
  experimental_dashboard:   false,  // Dashboard experimental
  premium_features:         false,  // Funcionalidades premium (futuro)
  // Central Digital do Condomínio
  community_portal_enabled: true,   // Central Digital — mural, solicitações, documentos
  resident_access_enabled:  true,   // Modo de visualização morador
  council_access_enabled:   true,   // Modo de visualização conselho
  public_documents_enabled: true,   // Biblioteca de documentos públicos
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

// Regra: o sync segue a autenticação — anônimo = off, autenticado = on.
// Exceção: se o usuário tomou decisão explícita (setSyncPreference), ela prevalece
// sobre a autenticação. Idempotente.
const SYNC_EXPLICIT_KEY = "amigo_sync_pref_explicit";

function hasExplicitSyncChoice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SYNC_EXPLICIT_KEY) === "1";
  } catch {
    return false;
  }
}

// Alinha sync_enabled ao estado de autenticação, a menos que o usuário já tenha
// escolhido manualmente. Chamar com true ao autenticar e false ao virar anônimo.
export function syncFollowsAuth(isAuthenticated: boolean): void {
  if (typeof window === "undefined") return;
  if (hasExplicitSyncChoice()) return; // escolha do usuário precede a regra
  try {
    const overrides = readOverrides();
    overrides.sync_enabled = isAuthenticated;
    localStorage.setItem(FLAG_KEY, JSON.stringify(overrides));
  } catch { /* quota — ignora */ }
}

// Registra uma decisão explícita do usuário sobre o sync (precede a regra de auth).
export function setSyncPreference(value: boolean): void {
  if (typeof window === "undefined") return;
  setFlag("sync_enabled", value);
  try {
    localStorage.setItem(SYNC_EXPLICIT_KEY, "1");
  } catch { /* quota — ignora */ }
}

/**
 * @deprecated Use syncFollowsAuth(true) — via canônica da regra "sync segue a
 * autenticação". Mantido apenas como compat; equivale a "autenticou liga sync".
 */
export function enableSyncOnAuth(): void {
  syncFollowsAuth(true);
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
