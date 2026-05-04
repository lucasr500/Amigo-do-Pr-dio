// ─── Session storage service ──────────────────────────────────────────────────
// Camada centralizada de leitura/escrita no localStorage.
// Toda persistência de dados do usuário passa por este módulo.
//
// Migração futura para backend: substituir `safeRead`/`safeWrite` por
// chamadas fetch() mantendo as mesmas assinaturas de função.

// Espelha o schema escrito por logQuery() em data.ts
export type QueryLog = {
  ts: string;
  q: string;
  tokens: string[];
  matchedId: string | null;
  score: number;
  isDefault: boolean;
  blockedByDomainAnchor: boolean;
};

export type FavoriteEntry = {
  id: string;        // chave local única
  ts: string;        // ISO timestamp de quando foi salvo
  q: string;         // pergunta original do usuário
  matchedId: string; // ID da entrada na knowledge base
  categoria: string;
  resposta: string;  // snapshot do texto no momento do save
};

export type UsageStats = {
  totalCount: number;
  todayCount: number;
  lastDate: string; // "YYYY-MM-DD" — reseta todayCount ao virar o dia
};

// Chaves do localStorage — centralizadas para facilitar migração
const KEYS = {
  QUERIES:   "amigo_queries",    // escrito por data.ts logQuery()
  FAVORITES: "amigo_favorites",
  STATS:     "amigo_stats",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded ou localStorage indisponível (modo privado)
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Histórico de perguntas ───────────────────────────────────────────────────

// Retorna as últimas `limit` perguntas únicas, mais recente primeiro.
export function getRecentQueries(limit = 7): QueryLog[] {
  const all = safeRead<QueryLog[]>(KEYS.QUERIES, []);
  const seen = new Set<string>();
  const result: QueryLog[] = [];
  for (let i = all.length - 1; i >= 0; i--) {
    const key = all[i].q.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(all[i]);
    }
    if (result.length >= limit) break;
  }
  return result; // ordem: mais recente → mais antigo
}

export function clearQueryHistory(): void {
  safeWrite(KEYS.QUERIES, []);
}

// ─── Favoritos ────────────────────────────────────────────────────────────────

export function getFavorites(): FavoriteEntry[] {
  return safeRead<FavoriteEntry[]>(KEYS.FAVORITES, []);
}

export function isFavorited(matchedId: string): boolean {
  return getFavorites().some((f) => f.matchedId === matchedId);
}

export function saveFavorite(entry: Omit<FavoriteEntry, "id" | "ts">): void {
  const list = getFavorites();
  if (list.some((f) => f.matchedId === entry.matchedId)) return;
  list.push({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
  });
  safeWrite(KEYS.FAVORITES, list);
}

export function removeFavorite(matchedId: string): void {
  safeWrite(
    KEYS.FAVORITES,
    getFavorites().filter((f) => f.matchedId !== matchedId)
  );
}

// ─── Estatísticas de uso ──────────────────────────────────────────────────────

export function getUsageStats(): UsageStats {
  return safeRead<UsageStats>(KEYS.STATS, {
    totalCount: 0,
    todayCount: 0,
    lastDate: todayISO(),
  });
}

export function incrementUsage(): void {
  const today = todayISO();
  const stats = getUsageStats();
  safeWrite(KEYS.STATS, {
    totalCount: stats.totalCount + 1,
    todayCount: stats.lastDate === today ? stats.todayCount + 1 : 1,
    lastDate: today,
  });
}
