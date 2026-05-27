// Engine de notificações internas.
// Roda no startup do app e reavalia regras periodicamente.
// Sem push real — notificações ficam no centro interno.

import {
  getNotifications,
  addNotification,
  type AppNotification,
} from "@/lib/session";
import { evaluateNotificationRules, type CooldownMap } from "./notification-rules";
import { isEnabled } from "@/lib/feature-flags";

const COOLDOWN_KEY = "amigo_notif_cooldown";

function readCooldownMap(): CooldownMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    return raw ? (JSON.parse(raw) as CooldownMap) : {};
  } catch {
    return {};
  }
}

function writeCooldownMap(map: CooldownMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(map));
  } catch { /* empty */ }
}

// Roda o engine e gera notificações para regras disparadas.
// Retorna quantas notificações novas foram criadas.
export function runNotificationEngine(): number {
  if (!isEnabled("notifications_enabled")) return 0;

  const existing = getNotifications();
  const cooldownMap = readCooldownMap();

  const candidates = evaluateNotificationRules(existing, cooldownMap);

  let created = 0;
  const updatedCooldown = { ...cooldownMap };

  for (const candidate of candidates) {
    addNotification(candidate);
    // Registra cooldown para este tipo + actionKey
    const cooldownKey = candidate.type + ":" + (candidate.actionKey ?? "");
    updatedCooldown[cooldownKey] = Date.now();
    created++;
  }

  if (created > 0) {
    writeCooldownMap(updatedCooldown);
  }

  return created;
}

// Retorna notificações não-dismissed, mais recentes primeiro.
export function getActiveNotifications(): AppNotification[] {
  return getNotifications()
    .filter((n) => !n.dismissed)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Retorna contagem de não lidas (para badge no Header).
export function getUnreadCount(): number {
  return getActiveNotifications().filter((n) => !n.read).length;
}
