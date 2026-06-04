// ─── Motor de gestão multi-condomínio ────────────────────────────────────────
// Arquitetura: snapshot-switching.
//   - O condomínio ATIVO sempre vive nas chaves amigo_* existentes (sem mudança).
//   - Cada condomínio INATIVO tem um snapshot em amigo_condo_<id>_snapshot.
//   - Trocar de condomínio = salvar snapshot do atual + restaurar snapshot do alvo.
//   - session.ts não muda suas assinaturas. Zero risco de regressão.

export type CondominioMeta = {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
  // Cache do último health score conhecido (atualizado antes de trocar de condo)
  lastHealthScore?: number;
  lastHealthStatusKey?: string;
};

export type CondominioQuickStats = {
  condominioId: string;
  nome: string;
  healthScore: number | null;
  healthStatusKey: string | null;
  pendenciasAbertas: number;
  pendenciasVencidas: number;
  isActive: boolean;
  lastSeenAt: string | null;
};

// ─── Chaves globais (não pertencem a nenhum condomínio específico) ────────────
const CONDO_REGISTRY_KEY = "amigo_condominios";
const ACTIVE_CONDO_KEY   = "amigo_active_condo";

// ─── Chaves do condomínio ativo (dados "vivos" — as mesmas de session.ts) ────
// Estas chaves são salvas/restauradas no snapshot ao trocar de condomínio.
export const PER_CONDO_KEYS: readonly string[] = [
  "amigo_profile",
  "amigo_memoria",
  "amigo_memoria_assistida",
  "amigo_documentos",
  "amigo_funcionarios",
  "amigo_manutencoes",
  "amigo_implantacao_mode",
  "amigo_resolution_events",
  "amigo_pendencias",
  "amigo_ocorrencias",
  "amigo_agenda",
  "amigo_comunicado_history",
  "amigo_notifications",
  "amigo_health_history",
  "amigo_audit_log",
  "amigo_checklists",
  "amigo_revisao_semanal",
  "amigo_financeiro",   // v7+ — movimentações financeiras
];

// ─── Helpers internos ────────────────────────────────────────────────────────

function rRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

function rWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

function snapshotKey(id: string): string {
  return `amigo_condo_${id}_snapshot`;
}

export function generateCondominioId(): string {
  return `condo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Registry ────────────────────────────────────────────────────────────────

export function getAllCondominios(): CondominioMeta[] {
  return rRead<CondominioMeta[]>(CONDO_REGISTRY_KEY, []);
}

function saveCondominios(list: CondominioMeta[]): void {
  rWrite(CONDO_REGISTRY_KEY, list);
}

export function getActiveCondominioId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CONDO_KEY);
}

export function getActiveCondominio(): CondominioMeta | null {
  const id = getActiveCondominioId();
  if (!id) return null;
  return getAllCondominios().find((c) => c.id === id) ?? null;
}

export function hasMultipleCondominios(): boolean {
  return getAllCondominios().length > 1;
}

// ─── Snapshot management ─────────────────────────────────────────────────────

function captureCurrentData(): Record<string, string> {
  const snap: Record<string, string> = {};
  if (typeof window === "undefined") return snap;
  for (const key of PER_CONDO_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) snap[key] = val;
  }
  return snap;
}

function saveSnapshotForCondo(condominioId: string): void {
  if (typeof window === "undefined") return;
  const snap = captureCurrentData();
  try {
    localStorage.setItem(snapshotKey(condominioId), JSON.stringify(snap));
  } catch { /* quota */ }
}

function loadSnapshotForCondo(condominioId: string): void {
  if (typeof window === "undefined") return;
  for (const key of PER_CONDO_KEYS) {
    localStorage.removeItem(key);
  }
  const raw = localStorage.getItem(snapshotKey(condominioId));
  if (!raw) return;
  try {
    const snap = JSON.parse(raw) as Record<string, string>;
    for (const [key, value] of Object.entries(snap)) {
      localStorage.setItem(key, value);
    }
  } catch { /* snapshot corrompido */ }
}

function deleteSnapshotForCondo(condominioId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(snapshotKey(condominioId));
}

// ─── Cache do health score antes de trocar ───────────────────────────────────

function cacheHealthScore(condominioId: string): void {
  try {
    const raw = localStorage.getItem("amigo_health_history");
    if (!raw) return;
    const history = JSON.parse(raw) as Array<{ date: string; percentage: number; statusKey: string }>;
    if (!history.length) return;
    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    const condos = getAllCondominios();
    saveCondominios(condos.map((c) =>
      c.id === condominioId
        ? { ...c, lastHealthScore: latest.percentage, lastHealthStatusKey: latest.statusKey, updatedAt: new Date().toISOString() }
        : c
    ));
  } catch { /* noop */ }
}

// ─── API pública de gestão ────────────────────────────────────────────────────

// FASE 6 — Migração automática de usuários existentes.
// Idempotente: seguro chamar múltiplas vezes.
export function migrateToMultiCondo(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(CONDO_REGISTRY_KEY)) return; // já migrado

  // Lê o nome do condomínio existente (se houver)
  let nome = "";
  try {
    const raw = localStorage.getItem("amigo_profile");
    if (raw) {
      const p = JSON.parse(raw) as Record<string, unknown>;
      nome = (p?.nomeCondominio as string) ?? "";
    }
  } catch { /* noop */ }

  const defaultId = generateCondominioId();
  const now = new Date().toISOString();

  const registry: CondominioMeta[] = [{
    id: defaultId,
    nome,
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  }];

  // Dados existentes ficam nas chaves amigo_* (condomínio ativo) — nenhuma cópia necessária.
  localStorage.setItem(CONDO_REGISTRY_KEY, JSON.stringify(registry));
  localStorage.setItem(ACTIVE_CONDO_KEY, defaultId);
}

// Troca o condomínio ativo. Retorna true se a troca foi executada.
// Chama window.location.reload() após trocar — garante estado React limpo.
export function switchCondominio(targetId: string): boolean {
  if (typeof window === "undefined") return false;
  const currentId = getActiveCondominioId();
  if (currentId === targetId) return false;

  const condos = getAllCondominios();
  if (!condos.find((c) => c.id === targetId)) return false;

  // 1. Cacheia health score do condomínio atual antes de sair
  if (currentId) {
    cacheHealthScore(currentId);
    saveSnapshotForCondo(currentId);
    saveCondominios(getAllCondominios().map((c) =>
      c.id === currentId ? { ...c, updatedAt: new Date().toISOString() } : c
    ));
  }

  // 2. Carrega dados do condomínio alvo
  loadSnapshotForCondo(targetId);
  localStorage.setItem(ACTIVE_CONDO_KEY, targetId);

  // 3. Marca como recentemente visto
  saveCondominios(getAllCondominios().map((c) =>
    c.id === targetId ? { ...c, lastSeenAt: new Date().toISOString() } : c
  ));

  return true;
}

// Cria um novo condomínio e o ativa (salva snapshot do atual).
export function addCondominio(nome: string): CondominioMeta {
  const currentId = getActiveCondominioId();

  // Salva dados e score do condomínio atual antes de criar o novo
  if (currentId) {
    cacheHealthScore(currentId);
    saveSnapshotForCondo(currentId);
  }

  const newId = generateCondominioId();
  const now = new Date().toISOString();
  const newCondo: CondominioMeta = {
    id: newId,
    nome: nome.trim() || "Novo condomínio",
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  };

  saveCondominios([...getAllCondominios(), newCondo]);

  // Limpa dados vivos (novo condomínio começa vazio)
  for (const key of PER_CONDO_KEYS) {
    localStorage.removeItem(key);
  }

  localStorage.setItem(ACTIVE_CONDO_KEY, newId);
  return newCondo;
}

// Renomeia um condomínio (ativo ou inativo).
export function updateCondominioNome(id: string, nome: string): void {
  const trimmed = nome.trim();
  saveCondominios(getAllCondominios().map((c) =>
    c.id === id ? { ...c, nome: trimmed, updatedAt: new Date().toISOString() } : c
  ));

  // Se for o ativo, atualiza também o profile em localStorage
  if (getActiveCondominioId() === id) {
    try {
      const raw = localStorage.getItem("amigo_profile");
      if (raw) {
        const profile = JSON.parse(raw) as Record<string, unknown>;
        profile.nomeCondominio = trimmed;
        localStorage.setItem("amigo_profile", JSON.stringify(profile));
      }
    } catch { /* noop */ }
  } else {
    // Atualiza no snapshot do inativo
    try {
      const snapRaw = localStorage.getItem(snapshotKey(id));
      if (snapRaw) {
        const snap = JSON.parse(snapRaw) as Record<string, string>;
        if (snap["amigo_profile"]) {
          const p = JSON.parse(snap["amigo_profile"]) as Record<string, unknown>;
          p.nomeCondominio = trimmed;
          snap["amigo_profile"] = JSON.stringify(p);
          localStorage.setItem(snapshotKey(id), JSON.stringify(snap));
        }
      }
    } catch { /* noop */ }
  }
}

// Remove um condomínio. Não remove o último.
export function deleteCondominio(id: string): void {
  if (typeof window === "undefined") return;
  const condos = getAllCondominios();
  if (condos.length <= 1) return;

  const remaining = condos.filter((c) => c.id !== id);
  saveCondominios(remaining);
  deleteSnapshotForCondo(id);

  // Se era o ativo, ativa o próximo
  if (getActiveCondominioId() === id) {
    const target = remaining[0];
    loadSnapshotForCondo(target.id);
    localStorage.setItem(ACTIVE_CONDO_KEY, target.id);
  }
}

// Remove todos os dados de todos os condomínios.
export function clearAllCondominiosData(): void {
  if (typeof window === "undefined") return;
  const condos = getAllCondominios();
  for (const c of condos) {
    deleteSnapshotForCondo(c.id);
  }
  for (const key of PER_CONDO_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(CONDO_REGISTRY_KEY);
  localStorage.removeItem(ACTIVE_CONDO_KEY);
}

// ─── Portfolio stats ──────────────────────────────────────────────────────────
// Lê stats de todos os condomínios sem trocar o ativo.

export function getPortfolioStats(): CondominioQuickStats[] {
  const condos = getAllCondominios();
  const activeId = getActiveCondominioId();
  const todayStr = new Date().toISOString().slice(0, 10);

  return condos.map((condo): CondominioQuickStats => {
    const isActive = condo.id === activeId;

    // Lê pendências e health history
    let pendenciasAbertas = 0;
    let pendenciasVencidas = 0;
    let healthScore: number | null = condo.lastHealthScore ?? null;
    let healthStatusKey: string | null = condo.lastHealthStatusKey ?? null;

    try {
      const rawPend = isActive
        ? localStorage.getItem("amigo_pendencias")
        : (() => {
            const snapRaw = localStorage.getItem(snapshotKey(condo.id));
            if (!snapRaw) return null;
            const snap = JSON.parse(snapRaw) as Record<string, string>;
            return snap["amigo_pendencias"] ?? null;
          })();

      if (rawPend) {
        const pend = JSON.parse(rawPend) as Array<{ status: string; dueDate?: string }>;
        const abertas = pend.filter((p) => p.status === "aberta");
        pendenciasAbertas = abertas.length;
        pendenciasVencidas = abertas.filter((p) => !!p.dueDate && p.dueDate < todayStr).length;
      }
    } catch { /* noop */ }

    try {
      const rawHist = isActive
        ? localStorage.getItem("amigo_health_history")
        : (() => {
            const snapRaw = localStorage.getItem(snapshotKey(condo.id));
            if (!snapRaw) return null;
            const snap = JSON.parse(snapRaw) as Record<string, string>;
            return snap["amigo_health_history"] ?? null;
          })();

      if (rawHist) {
        const hist = JSON.parse(rawHist) as Array<{ date: string; percentage: number; statusKey: string }>;
        const sorted = [...hist].sort((a, b) => b.date.localeCompare(a.date));
        if (sorted[0]) {
          healthScore = sorted[0].percentage;
          healthStatusKey = sorted[0].statusKey;
        }
      }
    } catch { /* noop */ }

    return {
      condominioId: condo.id,
      nome: condo.nome || "Condomínio sem nome",
      healthScore,
      healthStatusKey,
      pendenciasAbertas,
      pendenciasVencidas,
      isActive,
      lastSeenAt: condo.lastSeenAt ?? null,
    };
  });
}

// Tamanho estimado dos snapshots em KB
export function getPortfolioStorageKB(): number {
  if (typeof window === "undefined") return 0;
  try {
    let bytes = 0;
    const condos = getAllCondominios();
    for (const c of condos) {
      const key = snapshotKey(c.id);
      const val = localStorage.getItem(key) ?? "";
      bytes += (key.length + val.length) * 2;
    }
    return Math.ceil(bytes / 1024);
  } catch { return 0; }
}
