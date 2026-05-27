// Contrato da camada de persistência.
// Permite trocar localStorage por IndexedDB, Supabase ou outro
// sem alterar nenhum consumidor, apenas substituindo o adapter.

export interface StorageAdapter {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(prefix?: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
  sizeKB(prefix?: string): Promise<number>;
}

export interface StorageEvent {
  key: string;
  newValue: unknown;
  timestamp: number;
}

export type StorageStatus = "available" | "quota_exceeded" | "unavailable" | "unknown";
