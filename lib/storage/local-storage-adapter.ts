// Implementação de StorageAdapter usando localStorage.
// Mantém a mesma semântica do safeRead/safeWrite de session.ts,
// mas com interface Promise-based pronta para async adapters futuros.

import type { StorageAdapter, StorageStatus } from "./types";

function isAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__amigo_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function checkStorageStatus(): StorageStatus {
  if (typeof window === "undefined") return "unavailable";
  try {
    const probe = "__amigo_probe__";
    localStorage.setItem(probe, "x".repeat(1024)); // 1 kB probe
    localStorage.removeItem(probe);
    return "available";
  } catch (e) {
    if (e instanceof DOMException && (
      e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED"
    )) {
      return "quota_exceeded";
    }
    return "unavailable";
  }
}

export const localStorageAdapter: StorageAdapter = {
  async get<T>(key: string, fallback: T): Promise<T> {
    if (!isAvailable()) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (!isAvailable()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException) {
        console.warn(`[storage] write failed for ${key}:`, e.name);
      }
    }
  },

  async remove(key: string): Promise<void> {
    if (!isAvailable()) return;
    try {
      localStorage.removeItem(key);
    } catch { /* empty */ }
  },

  async clear(prefix = "amigo_"): Promise<void> {
    if (!isAvailable()) return;
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) toRemove.push(key);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch { /* empty */ }
  },

  async keys(prefix = "amigo_"): Promise<string[]> {
    if (!isAvailable()) return [];
    try {
      const result: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) result.push(key);
      }
      return result;
    } catch {
      return [];
    }
  },

  async sizeKB(prefix = "amigo_"): Promise<number> {
    if (!isAvailable()) return 0;
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          total += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2;
        }
      }
      return Math.round(total / 1024);
    } catch {
      return 0;
    }
  },
};
