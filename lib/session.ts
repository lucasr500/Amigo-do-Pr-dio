// ─── Session storage service ──────────────────────────────────────────────────
// Camada centralizada de leitura/escrita no localStorage.
// Toda persistência de dados do usuário passa por este módulo.
//
// Migração futura para backend: substituir `safeRead`/`safeWrite` por
// chamadas fetch() mantendo as mesmas assinaturas de função.

import { ate, desde, past } from "./urgency";

// Espelha o schema escrito por logQuery() em data.ts
export type QueryLog = {
  ts: string;
  q: string;
  tokens: string[];
  matchedId: string | null;
  score: number;
  isDefault: boolean;
  blockedByDomainAnchor: boolean;
  // Categoria da entrada matched — facilita análise de cobertura por domínio
  categoria: string | null;
};

export type ShareLog = {
  ts: string;
  q: string;
  matchedId: string | null;
  categoria: string | null;
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

// progresso salvo de cada checklist: { itemId: true } + timestamp de última interação
export type ChecklistStorage = Record<
  string,
  { checked: Record<string, boolean>; lastUsed: string }
>;

type ChecklistEvent = {
  ts: string;
  checklistId: string;
};

// ─── Perfil operacional do condomínio ──────────────────────────────────────
// Todos os campos são opcionais — o perfil pode ser parcial.
// Armazenado em localStorage com a mesma estratégia safeRead/safeWrite.
export type CondominioProfile = {
  hasElevador?: boolean;
  hasPiscina?: boolean;
  hasFuncionarios?: boolean;
  hasPortaria?: boolean;
  tipoSindico?: "morador" | "profissional";
  nomeCondominio?: string;
};

// ─── Memória operacional do condomínio ─────────────────────────────────────
// Registro leve de datas e fornecedores operacionais.
// Permite que o produto "conheça" o histórico do prédio.
export type MemoriaOperacional = {
  // Identificação
  administradora?: string;
  prestadoraElevador?: string;

  // Datas de última execução (formato "YYYY-MM-DD")
  ultimaAGO?: string;
  ultimaDedetizacao?: string;
  ultimaLimpezaCaixaDAgua?: string;
  ultimaManutencaoElevador?: string;
  ultimaInspecaoExtintores?: string;
  ultimaVistoriaSPDA?: string;
  ultimaVistoriaEletrica?: string;

  // Vencimentos (formato "YYYY-MM-DD")
  vencimentoAVCB?: string;
  vencimentoSeguro?: string;
};

// Chaves do localStorage — centralizadas para facilitar migração futura para backend
const KEYS = {
  QUERIES:            "amigo_queries",    // escrito por data.ts logQuery()
  FAVORITES:          "amigo_favorites",
  STATS:              "amigo_stats",
  SHARES:             "amigo_shares",
  CHECKLISTS:         "amigo_checklists",
  CHECKLIST_EVENTS:   "amigo_checklist_events",
  INTERACTIONS:       "amigo_interactions",
  PROFILE:            "amigo_profile",
  MEMORIA:            "amigo_memoria",
  SESSION_META:       "amigo_session_meta",
  RESOLUTION_EVENTS:  "amigo_resolution_events",
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

// ─── Compartilhamentos ────────────────────────────────────────────────────────

// Registra cada vez que o usuário compartilha uma resposta via WhatsApp.
// Permite cruzar: quais temas geram mais compartilhamento orgânico.
export function logShare(entry: Omit<ShareLog, "ts">): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEYS.SHARES);
    const logs: ShareLog[] = raw ? (JSON.parse(raw) as ShareLog[]) : [];
    logs.push({ ...entry, ts: new Date().toISOString() });
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    localStorage.setItem(KEYS.SHARES, JSON.stringify(logs));
  } catch {
    // localStorage indisponível
  }
}

export function getShares(): ShareLog[] {
  return safeRead<ShareLog[]>(KEYS.SHARES, []);
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export function getChecklistStorage(): ChecklistStorage {
  return safeRead<ChecklistStorage>(KEYS.CHECKLISTS, {});
}

export function saveChecklistProgress(
  checklistId: string,
  checked: Record<string, boolean>
): void {
  const all = getChecklistStorage();
  all[checklistId] = { checked, lastUsed: new Date().toISOString() };
  safeWrite(KEYS.CHECKLISTS, all);
}

export function resetChecklistStorage(checklistId: string): void {
  const all = getChecklistStorage();
  delete all[checklistId];
  safeWrite(KEYS.CHECKLISTS, all);
}

// ─── Interações de descoberta ─────────────────────────────────────────────────
// Registra cliques em CTAs de descoberta (Veja também, Checklist recomendado, Category pill).
// Permite medir quais mecanismos de surfacing geram exploração real.

type InteractionEvent = {
  ts: string;
  type: string;  // "veja-tambem" | "checklist-cta" | "category-pill" | "dica-saber-mais"
  detail: string; // ID da entrada, checklistId, categoria, etc.
};

export function logInteraction(type: string, detail: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEYS.INTERACTIONS);
    const events: InteractionEvent[] = raw ? (JSON.parse(raw) as InteractionEvent[]) : [];
    events.push({ ts: new Date().toISOString(), type, detail });
    if (events.length > 300) events.splice(0, events.length - 300);
    localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(events));
  } catch {
    // localStorage indisponível
  }
}

// Registra abertura de checklist para análise de uso (quais são mais utilizados).
export function logChecklistOpen(checklistId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEYS.CHECKLIST_EVENTS);
    const events: ChecklistEvent[] = raw ? (JSON.parse(raw) as ChecklistEvent[]) : [];
    events.push({ ts: new Date().toISOString(), checklistId });
    if (events.length > 200) events.splice(0, events.length - 200);
    localStorage.setItem(KEYS.CHECKLIST_EVENTS, JSON.stringify(events));
  } catch {
    // localStorage indisponível
  }
}

// ─── Perfil operacional ───────────────────────────────────────────────────────

export function getProfile(): CondominioProfile | null {
  return safeRead<CondominioProfile | null>(KEYS.PROFILE, null);
}

export function saveProfile(profile: CondominioProfile): void {
  safeWrite(KEYS.PROFILE, profile);
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEYS.PROFILE); } catch { /* noop */ }
}

export function hasProfile(): boolean {
  return getProfile() !== null;
}

// ─── Metadados de sessão ─────────────────────────────────────────────────────
// Rastreia contexto entre sessões: data da última abertura, contagem de sessões.
// Usado para criar a sensação de continuidade ("última visita há X dias").

export type SessionMeta = {
  lastOpenedAt: string | null;
  previousOpenedAt: string | null;
  sessionCount: number;
  lastRevisaoMensalAt: string | null;
  sessionId: string;
};

function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSessionMeta(): SessionMeta {
  const stored = safeRead<Partial<SessionMeta>>(KEYS.SESSION_META, {});
  return {
    lastOpenedAt: stored.lastOpenedAt ?? null,
    previousOpenedAt: stored.previousOpenedAt ?? null,
    sessionCount: stored.sessionCount ?? 0,
    lastRevisaoMensalAt: stored.lastRevisaoMensalAt ?? null,
    sessionId: stored.sessionId ?? generateSessionId(),
  };
}

// Chamado uma vez por abertura do app. Retorna dias desde a sessão anterior.
export function recordSessionOpen(): number | null {
  const prev = getSessionMeta();
  const daysSinceLast = prev.lastOpenedAt
    ? Math.floor((Date.now() - new Date(prev.lastOpenedAt).getTime()) / 86400000)
    : null;
  safeWrite(KEYS.SESSION_META, {
    ...prev,
    previousOpenedAt: prev.lastOpenedAt,
    lastOpenedAt: new Date().toISOString(),
    sessionCount: prev.sessionCount + 1,
    sessionId: prev.sessionId || generateSessionId(),
  });
  return daysSinceLast;
}

export function recordRevisaoMensal(): void {
  const meta = getSessionMeta();
  safeWrite(KEYS.SESSION_META, { ...meta, lastRevisaoMensalAt: new Date().toISOString() });
}

export function getSessionId(): string {
  return getSessionMeta().sessionId || generateSessionId();
}

// ─── Eventos de resolução ─────────────────────────────────────────────────────
// Registra quando o síndico marca um item do GuidancePanel como resolvido.
// Alimenta o histórico vivo do condomínio e prepara automações futuras.

export type ResolutionEvent = {
  ts: string;
  field: string;
  value: string;
  label: string;
};

export function logResolutionEvent(field: string, value: string, label: string): void {
  const events = safeRead<ResolutionEvent[]>(KEYS.RESOLUTION_EVENTS, []);
  events.push({ ts: new Date().toISOString(), field, value, label });
  if (events.length > 100) events.splice(0, events.length - 100);
  safeWrite(KEYS.RESOLUTION_EVENTS, events);
}

export function getResolutionEvents(): ResolutionEvent[] {
  return safeRead<ResolutionEvent[]>(KEYS.RESOLUTION_EVENTS, []);
}

// Atualiza um campo específico da memória operacional e registra o evento de resolução.
export function resolveMemoriaField(
  field: keyof MemoriaOperacional,
  value: string,
  label: string
): void {
  const m = getMemoriaOperacional();
  saveMemoriaOperacional({ ...m, [field]: value });
  logResolutionEvent(field, value, label);
}

// ─── Memória operacional ──────────────────────────────────────────────────────

export function getMemoriaOperacional(): MemoriaOperacional {
  return safeRead<MemoriaOperacional>(KEYS.MEMORIA, {});
}

export function saveMemoriaOperacional(memoria: MemoriaOperacional): void {
  safeWrite(KEYS.MEMORIA, memoria);
}

export function hasMemoriaOperacional(): boolean {
  const m = getMemoriaOperacional();
  return Object.keys(m).length > 0;
}

export function countMemoriaItens(): number {
  const m = getMemoriaOperacional();
  return Object.values(m).filter((v) => v !== undefined && v !== "").length;
}

// ─── Habit score ─────────────────────────────────────────────────────────────
// Indicador leve de engajamento do usuário com o produto.
// Calculado 100% client-side a partir de sinais do localStorage.

export type HabitTier = "new" | "exploring" | "forming" | "habitual" | "power";

export type HabitScore = {
  tier: HabitTier;
  score: number;
  maxScore: number;
  signals: string[];
  nextMilestone: string;
};

export function computeHabitScore(): HabitScore {
  const stats = getUsageStats();
  const meta = getSessionMeta();
  const memoriaCount = countMemoriaItens();
  const favoritesCount = getFavorites().length;
  const checklistStorage = getChecklistStorage();
  const checklistsUsed = Object.values(checklistStorage).filter(
    (c) => Object.values(c.checked).some(Boolean)
  ).length;

  const signals: string[] = [];
  let score = 0;

  if (stats.totalCount >= 3)  { score++; signals.push("3+ perguntas feitas"); }
  if (stats.totalCount >= 10) { score++; signals.push("10+ perguntas feitas"); }
  if (stats.totalCount >= 30) { score++; signals.push("30+ perguntas feitas"); }
  if (memoriaCount >= 3)      { score++; signals.push("3+ itens de memória"); }
  if (memoriaCount >= 7)      { score++; signals.push("7+ itens de memória"); }
  if (meta.sessionCount >= 3) { score++; signals.push("3+ sessões"); }
  if (meta.sessionCount >= 7) { score++; signals.push("7+ sessões"); }
  if (favoritesCount >= 1)    { score++; signals.push("favoritos salvos"); }
  if (checklistsUsed >= 1)    { score++; signals.push("checklist iniciado"); }
  if (meta.lastRevisaoMensalAt !== null) { score++; signals.push("revisão mensal feita"); }

  const maxScore = 10;

  let tier: HabitTier;
  let nextMilestone: string;
  if (score <= 1) {
    tier = "new";
    nextMilestone = "Faça 3 perguntas para explorar o produto";
  } else if (score <= 3) {
    tier = "exploring";
    nextMilestone = "Registre dados na memória do condomínio";
  } else if (score <= 5) {
    tier = "forming";
    nextMilestone = "Retorne em mais 2 sessões para consolidar o hábito";
  } else if (score <= 8) {
    tier = "habitual";
    nextMilestone = "Complete uma revisão mensal e salve favoritos";
  } else {
    tier = "power";
    nextMilestone = "Você já usa o produto como ferramenta de gestão ativa";
  }

  return { tier, score, maxScore, signals, nextMilestone };
}

// ─── Saúde operacional do condomínio ─────────────────────────────────────────
// Indicador sintético baseado em memória + perfil.
// Consumido pelo CondominioStatusHeader para transmitir status geral ao usuário.

export type CondominioHealthStatus = "em-dia" | "atencao" | "pendente" | "critico";

export type CondominioHealth = {
  status: CondominioHealthStatus;
  alertCount: number;
  atencaoCount: number;
  okCount: number;
  totalMonitored: number;
  label: string;
  summary: string;
  executiveSummary: string;
};

export function computeCondominioHealth(): CondominioHealth {
  const m = getMemoriaOperacional();
  const profile = getProfile();

  let alertCount = 0;
  let atencaoCount = 0;
  let okCount = 0;

  type AlertDetail = { label: string; note: string };
  const alerts: AlertDetail[] = [];
  const atencoes: AlertDetail[] = [];

  if (m.vencimentoAVCB) {
    const d = ate(m.vencimentoAVCB);
    if (d < 0) {
      alertCount++;
      alerts.push({ label: "AVCB", note: "vencido" });
    } else if (d <= 30) {
      alertCount++;
      alerts.push({ label: "AVCB", note: d === 0 ? "vence hoje" : `vence em ${d} dia${d !== 1 ? "s" : ""}` });
    } else if (d <= 90) {
      atencaoCount++;
      atencoes.push({ label: "AVCB", note: `vence em ${d} dias` });
    } else {
      okCount++;
    }
  }
  if (m.vencimentoSeguro) {
    const d = ate(m.vencimentoSeguro);
    if (d < 0) {
      alertCount++;
      alerts.push({ label: "Seguro", note: "vencido" });
    } else if (d <= 30) {
      alertCount++;
      alerts.push({ label: "Seguro", note: d === 0 ? "renova hoje" : `renova em ${d} dia${d !== 1 ? "s" : ""}` });
    } else if (d <= 90) {
      atencaoCount++;
      atencoes.push({ label: "Seguro", note: `renova em ${d} dias — planeje` });
    } else {
      okCount++;
    }
  }
  if (m.ultimaAGO && past(m.ultimaAGO)) {
    const mo = Math.floor(desde(m.ultimaAGO) / 30);
    if (mo >= 14) {
      alertCount++;
      alerts.push({ label: "AGO", note: `não realizada há ${mo} meses` });
    } else if (mo >= 10) {
      atencaoCount++;
      atencoes.push({ label: "AGO", note: `há ${mo} meses — planeje a próxima` });
    } else {
      okCount++;
    }
  }
  if (m.ultimaDedetizacao && past(m.ultimaDedetizacao)) {
    const ds = desde(m.ultimaDedetizacao);
    if (ds > 180) {
      alertCount++;
      alerts.push({ label: "Dedetização", note: "prazo semestral vencido" });
    } else if (ds > 150) {
      atencaoCount++;
      atencoes.push({ label: "Dedetização", note: "prazo semestral se aproximando" });
    } else {
      okCount++;
    }
  }
  if (m.ultimaLimpezaCaixaDAgua && past(m.ultimaLimpezaCaixaDAgua)) {
    const ds = desde(m.ultimaLimpezaCaixaDAgua);
    if (ds > 180) {
      alertCount++;
      alerts.push({ label: "Caixa d'água", note: "prazo semestral vencido" });
    } else if (ds > 150) {
      atencaoCount++;
      atencoes.push({ label: "Caixa d'água", note: "prazo semestral se aproximando" });
    } else {
      okCount++;
    }
  }
  if (m.ultimaManutencaoElevador && profile?.hasElevador && past(m.ultimaManutencaoElevador)) {
    const ds = desde(m.ultimaManutencaoElevador);
    if (ds > 45) {
      alertCount++;
      alerts.push({ label: "Elevador", note: `${ds} dias sem manutenção` });
    } else if (ds > 30) {
      atencaoCount++;
      atencoes.push({ label: "Elevador", note: "confirme a visita de manutenção" });
    } else {
      okCount++;
    }
  }
  if (m.ultimaInspecaoExtintores && past(m.ultimaInspecaoExtintores)) {
    const ds = desde(m.ultimaInspecaoExtintores);
    const mo = Math.floor(ds / 30);
    if (ds > 210) {
      alertCount++;
      alerts.push({ label: "Extintores", note: `${mo} meses sem inspeção` });
    } else if (ds > 150) {
      atencaoCount++;
      atencoes.push({ label: "Extintores", note: "prazo de inspeção anual se aproximando" });
    } else {
      okCount++;
    }
  }

  const totalMonitored = alertCount + atencaoCount + okCount;

  if (totalMonitored === 0) {
    return { status: "em-dia", alertCount: 0, atencaoCount: 0, okCount: 0, totalMonitored: 0, label: "Sem registros", summary: "", executiveSummary: "" };
  }

  let status: CondominioHealthStatus;
  let label: string;
  let summary: string;
  let executiveSummary: string;

  if (alertCount >= 2) {
    status = "critico";
    label = "Atenção urgente";
    summary = `${alertCount} itens requerem ação`;
    if (alerts.length >= 3) {
      executiveSummary = `${alerts.length} itens precisam de atenção prioritária.`;
    } else {
      const names = alerts.slice(0, 2).map((a) => a.label).join(" e ");
      executiveSummary = okCount > 0
        ? `${names} precisam de atenção. Os demais estão em ordem.`
        : `${names} precisam de atenção prioritária.`;
    }
  } else if (alertCount === 1) {
    status = "pendente";
    label = "Uma pendência";
    summary = "1 item requer ação";
    const top = alerts[0];
    executiveSummary = okCount > 0
      ? `${top.label} ${top.note}. Os demais estão em ordem.`
      : `${top.label} ${top.note}.`;
  } else if (atencaoCount > 0) {
    status = "atencao";
    label = "Em observação";
    summary = `${atencaoCount} item${atencaoCount > 1 ? "s" : ""} merece${atencaoCount > 1 ? "m" : ""} atenção`;
    executiveSummary = atencaoCount === 1 && atencoes.length >= 1
      ? `O condomínio está estável. ${atencoes[0].label} merece acompanhamento.`
      : `Situação estável, com ${atencaoCount} itens para acompanhar.`;
  } else {
    status = "em-dia";
    label = "Tudo em ordem";
    summary = `${okCount} item${okCount > 1 ? "s" : ""} em ordem`;
    executiveSummary = "Tudo em ordem por aqui.";
  }

  return { status, alertCount, atencaoCount, okCount, totalMonitored, label, summary, executiveSummary };
}

// ─── Backup e restauração de dados do usuário ────────────────────────────────
// Exporta apenas os dados operacionais do síndico (perfil, memória, favoritos, checklists).
// Diferente de exportTelemetry (que exporta dados de uso/análise), este backup é
// destinado ao próprio usuário para proteção e migração de dispositivo.

export type UserBackup = {
  version: "1";
  app: "amigo-do-predio";
  exportedAt: string;
  profile: CondominioProfile | null;
  memoria: MemoriaOperacional;
  favorites: FavoriteEntry[];
  checklists: ChecklistStorage;
};

export type ImportResult =
  | { success: true; summary: { nomeCondominio?: string; memoriaCount: number; favoritesCount: number } }
  | { success: false; error: string };

export function exportUserData(): void {
  if (typeof window === "undefined") return;

  const payload: UserBackup = {
    version: "1",
    app: "amigo-do-predio",
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    memoria: getMemoriaOperacional(),
    favorites: getFavorites(),
    checklists: getChecklistStorage(),
  };

  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amigo-do-predio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // Download indisponível no ambiente
  }
}

// Valida o backup sem escrever no localStorage — usado para mostrar preview antes da confirmação.
export function parseAndValidateUserData(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString) as unknown;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { success: false, error: "Arquivo inválido. Verifique se é um backup do Amigo do Prédio." };
    }

    const d = data as Record<string, unknown>;

    if (d.app !== "amigo-do-predio") {
      return { success: false, error: "Este arquivo não é um backup do Amigo do Prédio." };
    }

    if (d.version !== "1") {
      return { success: false, error: "Versão do backup incompatível." };
    }

    if (d.profile !== null && d.profile !== undefined && (typeof d.profile !== "object" || Array.isArray(d.profile))) {
      return { success: false, error: "Dados de perfil corrompidos no arquivo." };
    }
    if (!d.memoria || typeof d.memoria !== "object" || Array.isArray(d.memoria)) {
      return { success: false, error: "Dados de memória corrompidos no arquivo." };
    }
    if (!Array.isArray(d.favorites)) {
      return { success: false, error: "Dados de favoritos corrompidos no arquivo." };
    }
    if (!d.checklists || typeof d.checklists !== "object" || Array.isArray(d.checklists)) {
      return { success: false, error: "Dados de checklists corrompidos no arquivo." };
    }

    const profile = d.profile as CondominioProfile | null;
    const memoria = d.memoria as MemoriaOperacional;
    const memoriaCount = Object.values(memoria).filter((v) => v !== undefined && v !== "").length;
    const favoritesCount = (d.favorites as FavoriteEntry[]).length;

    return {
      success: true,
      summary: {
        nomeCondominio: profile?.nomeCondominio,
        memoriaCount,
        favoritesCount,
      },
    };
  } catch {
    return { success: false, error: "Arquivo corrompido ou formato inválido." };
  }
}

export function importUserData(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString) as unknown;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { success: false, error: "Arquivo inválido. Verifique se é um backup do Amigo do Prédio." };
    }

    const d = data as Record<string, unknown>;

    if (d.app !== "amigo-do-predio") {
      return { success: false, error: "Este arquivo não é um backup do Amigo do Prédio." };
    }

    if (d.version !== "1") {
      return { success: false, error: "Versão do backup incompatível." };
    }

    // Validação de tipos mínima — rejeita estruturas claramente erradas
    if (d.profile !== null && d.profile !== undefined && (typeof d.profile !== "object" || Array.isArray(d.profile))) {
      return { success: false, error: "Dados de perfil corrompidos no arquivo." };
    }
    if (!d.memoria || typeof d.memoria !== "object" || Array.isArray(d.memoria)) {
      return { success: false, error: "Dados de memória corrompidos no arquivo." };
    }
    if (!Array.isArray(d.favorites)) {
      return { success: false, error: "Dados de favoritos corrompidos no arquivo." };
    }
    if (!d.checklists || typeof d.checklists !== "object" || Array.isArray(d.checklists)) {
      return { success: false, error: "Dados de checklists corrompidos no arquivo." };
    }

    // Escrita — cada campo individualmente para não quebrar os demais em caso de falha parcial
    // Perfil: se o backup tinha perfil null, limpa o perfil local (restaura o estado exportado)
    if (d.profile) {
      safeWrite(KEYS.PROFILE, d.profile);
    } else if (d.profile === null) {
      try { localStorage.removeItem(KEYS.PROFILE); } catch { /* noop */ }
    }
    safeWrite(KEYS.MEMORIA, d.memoria);
    safeWrite(KEYS.FAVORITES, d.favorites);
    safeWrite(KEYS.CHECKLISTS, d.checklists);

    const profile = d.profile as CondominioProfile | null;
    const memoria = d.memoria as MemoriaOperacional;
    const memoriaCount = Object.values(memoria).filter((v) => v !== undefined && v !== "").length;
    const favoritesCount = (d.favorites as FavoriteEntry[]).length;

    return {
      success: true,
      summary: {
        nomeCondominio: profile?.nomeCondominio,
        memoriaCount,
        favoritesCount,
      },
    };
  } catch {
    return { success: false, error: "Arquivo corrompido ou formato inválido." };
  }
}

// ─── Exportação de telemetria ─────────────────────────────────────────────────

// Gera download de um JSON com todos os dados de uso para análise offline.
// Acesso: chamar window.__amigoDoPredioExport() no console do browser.
// Contém apenas dados locais do dispositivo — sem PII enviada a servidor.
export function exportTelemetry(): void {
  if (typeof window === "undefined") return;
  const queries = safeRead<QueryLog[]>(KEYS.QUERIES, []);
  const shares = safeRead<ShareLog[]>(KEYS.SHARES, []);
  const favorites = getFavorites();
  const stats = getUsageStats();
  const checklistEvents = safeRead<ChecklistEvent[]>(KEYS.CHECKLIST_EVENTS, []);
  const checklistStorage = getChecklistStorage();

  // Top categorias por frequência de acertos
  const catCount: Record<string, number> = {};
  queries.filter((q) => q.categoria).forEach((q) => {
    catCount[q.categoria!] = (catCount[q.categoria!] ?? 0) + 1;
  });
  const topCategories = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cat, count]) => ({ cat, count }));

  // Top fallbacks: queries sem match — os tokens mais frequentes indicam gaps editoriais
  const fallbackTokenCount: Record<string, number> = {};
  queries
    .filter((q) => q.isDefault && !q.blockedByDomainAnchor)
    .forEach((q) => {
      q.tokens.forEach((t) => {
        fallbackTokenCount[t] = (fallbackTokenCount[t] ?? 0) + 1;
      });
    });
  const topFallbackTokens = Object.entries(fallbackTokenCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([token, count]) => ({ token, count }));

  // Uso de checklists
  const checklistOpenCount: Record<string, number> = {};
  checklistEvents.forEach((e) => {
    checklistOpenCount[e.checklistId] = (checklistOpenCount[e.checklistId] ?? 0) + 1;
  });

  const interactions = safeRead<InteractionEvent[]>(KEYS.INTERACTIONS, []);
  const interactionCount: Record<string, number> = {};
  interactions.forEach((e) => {
    interactionCount[e.type] = (interactionCount[e.type] ?? 0) + 1;
  });

  const explorationRate = queries.length > 0
    ? `${Math.round((interactions.filter((e) => e.type === "veja-tambem").length / queries.length) * 100)}%`
    : "0%";

  // Checklists com progresso parado há mais de 7 dias — "abandonados"
  const abandonedChecklists = Object.entries(checklistStorage)
    .filter(([, data]) => {
      const daysSince = (Date.now() - new Date(data.lastUsed).getTime()) / 86400000;
      const done = Object.values(data.checked).filter(Boolean).length;
      return done > 0 && done < 10 && daysSince > 7;
    })
    .map(([id, data]) => ({
      id,
      itemsDone: Object.values(data.checked).filter(Boolean).length,
      daysSinceLastUse: Math.floor((Date.now() - new Date(data.lastUsed).getTime()) / 86400000),
    }));

  const profile = getProfile();
  const memoria = getMemoriaOperacional();
  const memoriaItemsCount = countMemoriaItens();

  // Quais itens de memória estão preenchidos — indica adoção da feature
  const memoriaAdotada = Object.entries(memoria)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k]) => k);

  const payload = {
    exportedAt: new Date().toISOString(),
    condominioProfile: profile,
    memoriaOperacional: memoria,
    stats,
    summary: {
      totalQueries: queries.length,
      answeredRate: queries.length > 0
        ? `${Math.round((queries.filter((q) => !q.isDefault).length / queries.length) * 100)}%`
        : "0%",
      fallbackRate: queries.length > 0
        ? `${Math.round((queries.filter((q) => q.isDefault).length / queries.length) * 100)}%`
        : "0%",
      blockedRate: queries.length > 0
        ? `${Math.round((queries.filter((q) => q.blockedByDomainAnchor).length / queries.length) * 100)}%`
        : "0%",
      totalShares: shares.length,
      totalFavorites: favorites.length,
      checklistOpenEvents: checklistEvents.length,
      totalInteractions: interactions.length,
      explorationRate,
    },
    analytics: {
      topCategories,
      topFallbackTokens,
      checklistUsage: checklistOpenCount,
      checklistProgress: Object.fromEntries(
        Object.entries(checklistStorage).map(([id, data]) => [
          id,
          {
            itemsChecked: Object.values(data.checked).filter(Boolean).length,
            lastUsed: data.lastUsed,
          },
        ])
      ),
      interactionBreakdown: interactionCount,
      abandonedChecklists,
      // Memória operacional: adoção e itens preenchidos
      memoriaOperacionalAdotada: memoriaAdotada,
      memoriaOperacionalCount: memoriaItemsCount,
      checklistInactivityReport: Object.entries(checklistStorage)
        .map(([id, data]) => ({
          id,
          itemsDone: Object.values(data.checked).filter(Boolean).length,
          daysSinceLastUse: Math.floor((Date.now() - new Date(data.lastUsed).getTime()) / 86400000),
          lastUsed: data.lastUsed,
        }))
        .sort((a, b) => b.daysSinceLastUse - a.daysSinceLastUse),
    },
    queries,
    shares,
    favorites,
  };

  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amigo-do-predio-telemetria-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // Download indisponível no ambiente
  }
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
