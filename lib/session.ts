// ─── Session storage service ──────────────────────────────────────────────────
// Camada centralizada de leitura/escrita no localStorage.
// Toda persistência de dados do usuário passa por este módulo.
//
// Migração futura para backend: substituir `safeRead`/`safeWrite` por
// chamadas fetch() mantendo as mesmas assinaturas de função.
//
// Versão do schema de dados: SESSION_SCHEMA_VERSION
// Incrementar aqui ao adicionar campos incompatíveis.
export const SESSION_SCHEMA_VERSION = 9;

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
export type TipoGestao = "sindico_morador" | "profissional" | "autogestao" | "administradora";

export type CondominioProfile = {
  nomeCondominio?: string;
  hasElevador?: boolean;
  hasPiscina?: boolean;
  hasFuncionarios?: boolean;
  hasPortaria?: boolean;
  tipoSindico?: "morador" | "profissional";
  // Campos v2 — opcionais para retrocompatibilidade
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  numUnidades?: number;
  numBlocos?: number;
  hasGaragem?: boolean;
  hasSalao?: boolean;
  tipoGestao?: TipoGestao;
  nomeAdministradora?: string;
  observacoesInternas?: string;
};

// ─── Datas assistidas — precisão flexível ──────────────────────────────────
// Permite aceitar datas completas, aproximadas, desconhecidas ou dispensadas.
// Armazenado em paralelo com MemoriaOperacional para retrocompatibilidade.

export type DatePrecision = "exact" | "month" | "year" | "unknown" | "not_applicable";

export type AssistedDateField = {
  value?: string;       // YYYY-MM-DD (exact), YYYY-MM (month), YYYY (year)
  precision: DatePrecision;
  status: "filled" | "estimated" | "unknown" | "to_discover" | "not_applicable";
  notes?: string;
  updatedAt: string;    // ISO
};

export type MemoriaAssistida = {
  avcb?: AssistedDateField;
  seguro?: AssistedDateField;
  mandato?: AssistedDateField;
};

// ─── Modo de implantação ────────────────────────────────────────────────────
// Capturado no onboarding para adaptar linguagem e plano inicial.
export type ImplantacaoMode = "existing" | "new_sindico" | "organizing";

// ─── Documentos essenciais ──────────────────────────────────────────────────
export type DocumentoStatus = "tenho" | "nao_tenho" | "precisa_localizar" | "nao_se_aplica";

export type DocumentoCategoria =
  | "seguranca" | "trabalhista" | "juridico" | "operacional" | "fiscal" | "manutencao";

export type DocumentoCriticidade = "critica" | "importante" | "recomendada";

export type DocumentoEssencial = {
  id: string;
  status: DocumentoStatus;
  vencimento?: AssistedDateField;
  observacoes?: string;
  ondeEsta?: string;
  updatedAt: string;
  // Campos v2 — opcionais para retrocompatibilidade
  dataVencimento?: string;   // YYYY-MM-DD — vencimento explícito quando "tenho"
  recorrencia?: ManutencaoFrequencia; // se renovação periódica
  // Campos v3 — link e localização física
  linkExterno?: string;      // URL ou caminho de referência
  nomeArquivo?: string;      // nome descritivo do arquivo físico ou digital
};

// ─── Movimentações financeiras ────────────────────────────────────────────────
// Registro simples de receitas e despesas operacionais do condomínio.
// Sem ERP, sem integração bancária, sem cobrança — apenas visibilidade financeira básica.

export type MovimentacaoFinanceira = {
  id: string;
  data: string;          // YYYY-MM-DD
  valor: number;         // em reais (sempre positivo; tipo define se é + ou -)
  tipo: "receita" | "despesa";
  categoria: string;     // ver lib/financial-categories.ts
  observacao?: string;
  origem: "manual";
  createdAt: string;
  updatedAt?: string;
};

// ─── Manutenções recorrentes ─────────────────────────────────────────────────
// Engine de recorrência operacional. Cada item representa uma manutenção
// obrigatória ou recomendada, com frequência e histórico de execução.

export type ManutencaoFrequencia =
  | "mensal" | "bimestral" | "trimestral" | "semestral" | "anual" | "sob_demanda";

export type ManutencaoCriticidade = "critica" | "importante" | "recomendada";

export type ManutencaoRecorrente = {
  id: string;
  label: string;
  frequencia: ManutencaoFrequencia;
  criticidade: ManutencaoCriticidade;
  ultimaExecucao?: string; // YYYY-MM-DD
  fornecedor?: string;
  observacoes?: string;
  ativo: boolean; // false = não se aplica a este condomínio
  createdAt: string;
  updatedAt: string;
};

// ─── Férias de funcionários ─────────────────────────────────────────────────
export type FeriasFuncionarioStatus = "em_dia" | "a_vencer" | "vencida" | "desconhecida";

export type FuncionarioFerias = {
  id: string;
  nomeFuncao: string;
  cargo?: string;              // cargo/função explícito
  dataAdmissao?: string;       // YYYY-MM-DD
  ultimasFeriasGozo?: string;  // YYYY-MM-DD — início da última fruição de férias
  periodoAquisitivo?: string;
  status: FeriasFuncionarioStatus;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
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
  fimMandatoSindico?: string;
};

// Chaves do localStorage — centralizadas para facilitar migração futura para backend
const KEYS = {
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
  MOVIMENTACOES:        "amigo_financeiro",
  IMPLANTACAO_MODE:     "amigo_implantacao_mode",
  SESSION_META:         "amigo_session_meta",
  RESOLUTION_EVENTS:    "amigo_resolution_events",
  PENDENCIAS:           "amigo_pendencias",
  OCORRENCIAS:          "amigo_ocorrencias",
  AGENDA:               "amigo_agenda",
  REVISAO_MENSAL_HOME:  "amigo_revisao_mensal_home",
  REVISAO_SEMANAL:       "amigo_revisao_semanal",
  ONBOARDING_COMPLETE:   "amigo_onboarding_complete",
  COMUNICADO_HISTORY:    "amigo_comunicado_history",
  NOTIFICATIONS:         "amigo_notifications",
  HEALTH_HISTORY:        "amigo_health_history",
  AUDIT_LOG:             "amigo_audit_log",
} as const;

// ─── Limites de coleções ──────────────────────────────────────────────────────
// Exportados para a UI mostrar avisos progressivos antes do truncamento.
export const PENDENCIAS_LIMIT = 50;
export const OCORRENCIAS_LIMIT = 80;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    // Valida que o resultado é do tipo esperado (não null inesperado)
    if (parsed === null && fallback !== null) return fallback;
    return parsed;
  } catch {
    // JSON corrompido — remove a chave para evitar problema recorrente
    try { localStorage.removeItem(key); } catch { /* empty */ }
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
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

// ─── Onboarding de primeiro acesso ───────────────────────────────────────────
// Detecta se o usuário está abrindo o app pela primeira vez (sem dados e sem
// ter visto o fluxo). Usuários com dados existentes nunca são afetados.

export function isFirstRun(): boolean {
  if (typeof window === "undefined") return false;
  // Já completou (ou pulou) o onboarding anteriormente
  if (safeRead<boolean>(KEYS.ONBOARDING_COMPLETE, false)) return false;
  // Usuário existente — já tem dados no dispositivo
  if (hasProfile()) return false;
  return true;
}

export function markFirstRunComplete(): void {
  safeWrite(KEYS.ONBOARDING_COMPLETE, true);
}

// ─── Metadados de sessão ─────────────────────────────────────────────────────
// Rastreia contexto entre sessões: data da última abertura, contagem de sessões.
// Usado para criar a sensação de continuidade ("última visita há X dias").

export type SessionMeta = {
  lastOpenedAt: string | null;
  previousOpenedAt: string | null;
  sessionCount: number;
  lastRevisaoMensalAt: string | null;
  lastBackupAt?: string | null; // ISO — atualizado em cada exportação bem-sucedida
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
    lastBackupAt: stored.lastBackupAt ?? null,
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

export function recordBackupAt(): void {
  const meta = getSessionMeta();
  safeWrite(KEYS.SESSION_META, { ...meta, lastBackupAt: new Date().toISOString() });
}

export function getLastBackupAt(): string | null {
  return getSessionMeta().lastBackupAt ?? null;
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

// ─── Pendências ───────────────────────────────────────────────────────────────
// Sistema leve de próximos passos do síndico.
// Persiste em localStorage; não incluído no UserBackup v1.

export type PendenciaPrioridade = "critica" | "alta" | "media" | "baixa";

export type Pendencia = {
  id: string;
  titulo: string;
  categoria?: string;
  origem?: "manual" | "response" | "guidance" | "revisao" | "memoria" | "ocorrencia" | "agenda" | "assistente_preenchimento" | "documento" | "funcionario" | "comunicado";
  matchedId?: string | null;
  status: "aberta" | "concluida";
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  prioridade?: PendenciaPrioridade;          // v8+
  observacaoResolucao?: string;              // v8+ — preenchido ao concluir
};

export function getPendencias(): Pendencia[] {
  return safeRead<Pendencia[]>(KEYS.PENDENCIAS, []);
}

export function addPendencia(
  p: Omit<Pendencia, "id" | "createdAt" | "status">
): Pendencia {
  const all = getPendencias();
  const nova: Pendencia = {
    ...p,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "aberta",
    createdAt: new Date().toISOString(),
  };
  all.push(nova);
  safeWrite(KEYS.PENDENCIAS, all.slice(-50)); // máx 50 registros
  return nova;
}

export function completePendencia(id: string, observacao?: string): void {
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) =>
      p.id === id
        ? {
            ...p,
            status: "concluida" as const,
            completedAt: new Date().toISOString(),
            ...(observacao?.trim() ? { observacaoResolucao: observacao.trim() } : {}),
          }
        : p
    )
  );
}

export function updatePendencia(
  id: string,
  patch: Partial<Pick<Pendencia, "prioridade" | "dueDate" | "titulo">>
): void {
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) => (p.id === id ? { ...p, ...patch } : p))
  );
}

export function deletePendencia(id: string): void {
  safeWrite(KEYS.PENDENCIAS, getPendencias().filter((p) => p.id !== id));
}

export function getPendenciasAbertas(): Pendencia[] {
  return getPendencias().filter((p) => p.status === "aberta");
}

export function getPendenciasConcluidas(): Pendencia[] {
  return getPendencias().filter((p) => p.status === "concluida");
}

export function getPendenciasCount(): number {
  return getPendencias().length;
}

export function canAddPendencia(): boolean {
  return getPendencias().length < PENDENCIAS_LIMIT;
}

// ─── Agenda do prédio ────────────────────────────────────────────────────────
// Lista leve de eventos operacionais futuros. Sem recorrência, sem push,
// sem calendário mensal — apenas registro e acompanhamento local.

export type AgendaEventType =
  | "assembleia"
  | "manutencao"
  | "dedetizacao"
  | "caixa_agua"
  | "extintores"
  | "vistoria"
  | "obra"
  | "cobranca"
  | "reuniao"
  | "fornecedor"
  | "comunicado"
  | "retorno"
  | "outro";

export type AgendaEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: AgendaEventType;
  note?: string;
  linkedPendenciaId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export function getAgendaEvents(): AgendaEvent[] {
  return safeRead<AgendaEvent[]>(KEYS.AGENDA, []);
}

export function addAgendaEvent(
  e: Omit<AgendaEvent, "id" | "createdAt">
): AgendaEvent {
  const all = getAgendaEvents();
  const nova: AgendaEvent = {
    ...e,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  all.push(nova);
  safeWrite(KEYS.AGENDA, all.slice(-100));
  return nova;
}

export function updateAgendaEvent(
  id: string,
  changes: Partial<Omit<AgendaEvent, "id" | "createdAt">>
): void {
  safeWrite(
    KEYS.AGENDA,
    getAgendaEvents().map((e) =>
      e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e
    )
  );
}

export function completeAgendaEvent(id: string): void {
  updateAgendaEvent(id, { completedAt: new Date().toISOString() });
}

export function deleteAgendaEvent(id: string): void {
  safeWrite(KEYS.AGENDA, getAgendaEvents().filter((e) => e.id !== id));
}

export function getUpcomingAgendaEvents(limitDays = 90): AgendaEvent[] {
  const today = todayISO();
  return getAgendaEvents()
    .filter((e) => !e.completedAt && e.date >= today)
    .filter((e) => {
      const diff = Math.floor(
        (new Date(e.date).getTime() - new Date(today).getTime()) / 86400000
      );
      return diff <= limitDays;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getAgendaEventById(id: string): AgendaEvent | null {
  return getAgendaEvents().find((e) => e.id === id) ?? null;
}

// ─── Ocorrências leves ───────────────────────────────────────────────────────
// Registro operacional simples da rotina do prédio. Não é livro oficial,
// protocolo formal ou consultoria jurídica.

export type OcorrenciaTipo =
  | "barulho"
  | "vazamento"
  | "obra"
  | "inadimplencia"
  | "manutencao"
  | "funcionario"
  | "area-comum"
  | "assembleia"
  | "briga"
  | "vistoria"
  | "reclamacao"
  | "lembrete"
  | "outro";

export type OcorrenciaPrioridade = "alta" | "media" | "baixa";
export type OcorrenciaStatus = "aberta" | "acompanhando" | "resolvida";

export type Ocorrencia = {
  id: string;
  titulo?: string;
  tipo: OcorrenciaTipo;
  descricao: string;
  local?: string;
  prioridade?: OcorrenciaPrioridade;
  proximo?: string;
  link?: string;
  createdAt: string;
  hasNextStep?: boolean;
  messageGeneratedAt?: string;
  statusOcorrencia?: OcorrenciaStatus;   // v8+
  responsavel?: string;                   // v8+
  linkedPendenciaId?: string;             // v8+ — vinculado a uma pendência
};

export function getOcorrencias(): Ocorrencia[] {
  return safeRead<Ocorrencia[]>(KEYS.OCORRENCIAS, []);
}

export function getOcorrenciasCount(): number {
  return getOcorrencias().length;
}

export function canAddOcorrencia(): boolean {
  return getOcorrencias().length < OCORRENCIAS_LIMIT;
}

export function addOcorrencia(
  o: Omit<Ocorrencia, "id" | "createdAt">
): Ocorrencia {
  const all = getOcorrencias();
  const nova: Ocorrencia = {
    ...o,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  all.push(nova);
  safeWrite(KEYS.OCORRENCIAS, all.slice(-80));
  return nova;
}

export function updateOcorrencia(
  id: string,
  patch: Partial<Omit<Ocorrencia, "id" | "createdAt">>
): void {
  safeWrite(
    KEYS.OCORRENCIAS,
    getOcorrencias().map((o) => (o.id === id ? { ...o, ...patch } : o))
  );
}

export function markOcorrenciaMessageGenerated(id: string): void {
  safeWrite(
    KEYS.OCORRENCIAS,
    getOcorrencias().map((o) =>
      o.id === id ? { ...o, messageGeneratedAt: new Date().toISOString() } : o
    )
  );
}

// ─── Revisão mensal na Home ─────────────────────────────────────────────────
// Controle mínimo de visualização do ritual mensal. Não participa do backup:
// é apenas estado local de surfacing para não insistir no card fora da janela.

type RevisaoMensalHomeMeta = {
  seenMonthKey: string | null;
  openCount: number;
};

export function getCurrentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getRevisaoMensalHomeMeta(): RevisaoMensalHomeMeta {
  return safeRead<RevisaoMensalHomeMeta>(KEYS.REVISAO_MENSAL_HOME, {
    seenMonthKey: null,
    openCount: 0,
  });
}

export function recordRevisaoMensalHomeOpen(monthKey = getCurrentMonthKey()): RevisaoMensalHomeMeta {
  const meta = getRevisaoMensalHomeMeta();
  const next = {
    seenMonthKey: monthKey,
    openCount: meta.seenMonthKey === monthKey ? meta.openCount + 1 : 1,
  };
  safeWrite(KEYS.REVISAO_MENSAL_HOME, next);
  return next;
}

// ─── Revisão semanal ────────────────────────────────────────────────────────
// Estado efêmero para evitar insistência no ritual durante a mesma semana.
// Não entra no backup: não é dado operacional do condomínio.

export type WeeklyReviewState = {
  lastCompletedWeekKey: string | null;
  lastCompletedAt: string | null;
};

export function getCurrentWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

export function getWeeklyReviewState(): WeeklyReviewState {
  return safeRead<WeeklyReviewState>(KEYS.REVISAO_SEMANAL, {
    lastCompletedWeekKey: null,
    lastCompletedAt: null,
  });
}

export function completeWeeklyReview(weekKey = getCurrentWeekKey()): WeeklyReviewState {
  const next = {
    lastCompletedWeekKey: weekKey,
    lastCompletedAt: new Date().toISOString(),
  };
  safeWrite(KEYS.REVISAO_SEMANAL, next);
  return next;
}

// ─── Tamanho estimado dos dados do app em localStorage ───────────────────────
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

// ─── Limpeza de dados locais ─────────────────────────────────────────────────
// Remove todas as chaves próprias do app. Usado pelo reset seguro em BackupPanel.
// Também limpa snapshots e registry multi-condomínio.
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  try {
    // Remove chaves principais do app
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    // Remove chaves multi-condomínio (snapshots + registry)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key === "amigo_condominios" ||
        key === "amigo_active_condo" ||
        key.startsWith("amigo_condo_")
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage indisponível
  }
}

// ─── Notifications storage ────────────────────────────────────────────────────

export type NotificationSeverity = "info" | "warning" | "critical";

export type AppNotification = {
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  scheduledFor?: string;
  read: boolean;
  dismissed: boolean;
  sourceModule: string;
  actionKey?: string; // chave para CTA (ex: "open_avcb", "open_funcionarios")
};

export function getNotifications(): AppNotification[] {
  return safeRead<AppNotification[]>(KEYS.NOTIFICATIONS, []);
}

export function saveNotifications(notifications: AppNotification[]): void {
  safeWrite(KEYS.NOTIFICATIONS, notifications.slice(-100)); // max 100
}

export function addNotification(n: Omit<AppNotification, "id" | "createdAt" | "read" | "dismissed">): AppNotification {
  const notification: AppNotification = {
    ...n,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
    dismissed: false,
  };
  const all = getNotifications();
  saveNotifications([...all, notification]);
  return notification;
}

export function markNotificationRead(id: string): void {
  const all = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(all);
}

export function dismissNotification(id: string): void {
  const all = getNotifications().map((n) =>
    n.id === id ? { ...n, dismissed: true, read: true } : n
  );
  saveNotifications(all);
}

export function markAllNotificationsRead(): void {
  const all = getNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(all);
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.read && !n.dismissed).length;
}

// ─── Health History storage ────────────────────────────────────────────────────

export type HealthSnapshot = {
  date: string;            // YYYY-MM-DD
  percentage: number;
  statusKey: string;
  factorCount: number;     // quantos fatores foram avaliados
  missingCount: number;    // fatores com status "missing"
  partialCount: number;    // fatores com status "partial"
};

export function getHealthHistory(): HealthSnapshot[] {
  return safeRead<HealthSnapshot[]>(KEYS.HEALTH_HISTORY, []);
}

export function saveHealthHistory(snapshots: HealthSnapshot[]): void {
  safeWrite(KEYS.HEALTH_HISTORY, snapshots.slice(-90)); // max 90 entradas (3 meses diários)
}

export function recordHealthSnapshot(snapshot: HealthSnapshot): void {
  const all = getHealthHistory();
  // Substitui snapshot do mesmo dia se já existir
  const withoutToday = all.filter((s) => s.date !== snapshot.date);
  saveHealthHistory([...withoutToday, snapshot]);
}

export function getHealthTrend(): "up" | "down" | "stable" | "unknown" {
  const history = getHealthHistory();
  if (history.length < 2) return "unknown";
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7); // última semana
  if (recent.length < 2) return "unknown";
  const first = recent[0].percentage;
  const last = recent[recent.length - 1].percentage;
  const delta = last - first;
  if (delta >= 5) return "up";
  if (delta <= -5) return "down";
  return "stable";
}

// ─── Audit Log (events auto-logged) ──────────────────────────────────────────

export type AuditCategory =
  | "documento"
  | "funcionario"
  | "health"
  | "onboarding"
  | "pendencia"
  | "memoria"
  | "implantacao";

export type AuditEntry = {
  id: string;
  category: AuditCategory;
  action: string;
  detail?: string;
  impact?: "positive" | "neutral" | "negative";
  timestamp: string;
};

export function getAuditLog(): AuditEntry[] {
  return safeRead<AuditEntry[]>(KEYS.AUDIT_LOG, []);
}

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">): void {
  const all = getAuditLog();
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  safeWrite(KEYS.AUDIT_LOG, [...all, newEntry].slice(-200)); // max 200 entradas
}

// ─── Memória assistida (precisão de datas) ───────────────────────────────────
// Camada paralela de metadados de precisão para campos críticos.
// Não substitui MemoriaOperacional — convive com ela para retrocompatibilidade.

export function getMemoriaAssistida(): MemoriaAssistida {
  return safeRead<MemoriaAssistida>(KEYS.MEMORIA_ASSISTIDA, {});
}

export function saveMemoriaAssistida(ma: MemoriaAssistida): void {
  safeWrite(KEYS.MEMORIA_ASSISTIDA, ma);
}

// Constrói AssistedDateField a partir de input do usuário.
export function buildAssistedDate(
  input: string,
  mode: "exact" | "month" | "year" | "unknown" | "to_discover" | "not_applicable",
  notes?: string
): AssistedDateField {
  const now = new Date().toISOString();
  if (mode === "unknown") {
    return { precision: "unknown", status: "unknown", notes, updatedAt: now };
  }
  if (mode === "to_discover") {
    return { precision: "unknown", status: "to_discover", notes, updatedAt: now };
  }
  if (mode === "not_applicable") {
    return { precision: "not_applicable", status: "not_applicable", notes, updatedAt: now };
  }
  if (mode === "month" && input) {
    // input: "MM/YYYY" ou "YYYY-MM" — normaliza para YYYY-MM
    const parts = input.includes("/") ? input.split("/") : input.split("-");
    const [a, b] = parts.length === 2 ? [parts[0], parts[1]] : ["", ""];
    const month = a.length === 4 ? a : b;
    const year = a.length === 4 ? b : a;
    const normalized = `${year}-${month.padStart(2, "0")}`;
    return { value: `${normalized}-01`, precision: "month", status: "estimated", notes, updatedAt: now };
  }
  if (mode === "year" && input) {
    return { value: `${input}-01-01`, precision: "year", status: "estimated", notes, updatedAt: now };
  }
  return { value: input, precision: "exact", status: "filled", notes, updatedAt: now };
}

// ─── Documentos essenciais ───────────────────────────────────────────────────

export const DOCUMENTOS_ESSENCIAIS_IDS = [
  // Jurídico
  "convencao",
  "regimento",
  "ata_eleicao",
  // Segurança
  "apolice_seguro",
  "avcb_clcb",
  "spda_laudo",
  "brigada_certificado",
  // Manutenção / Contratos
  "contrato_elevador",
  "contrato_limpeza",
  "contrato_portaria",
  "laudos_tecnicos",
  // Operacional / Comprovantes
  "extintores_comprovante",
  "caixa_agua_comprovante",
  "dedetizacao_comprovante",
  // Trabalhista
  "cct_funcionarios",
  "controle_ferias",
  "ppra_pgr",
  "pcmso",
  // Fiscal
  "cnd_condominio",
] as const;

export type DocumentoEssencialId = typeof DOCUMENTOS_ESSENCIAIS_IDS[number];

export const DOCUMENTO_LABEL: Record<DocumentoEssencialId, string> = {
  convencao:               "Convenção condominial",
  regimento:               "Regimento interno",
  ata_eleicao:             "Ata de eleição do síndico",
  apolice_seguro:          "Apólice de seguro predial",
  avcb_clcb:               "AVCB / CLCB",
  spda_laudo:              "Laudo SPDA / Para-raio",
  brigada_certificado:     "Certificado de Brigada de Incêndio",
  contrato_elevador:       "Contrato de manutenção de elevadores",
  contrato_limpeza:        "Contrato de limpeza",
  contrato_portaria:       "Contrato de portaria / segurança",
  laudos_tecnicos:         "Laudos técnicos (estrutural, elétrico etc.)",
  extintores_comprovante:  "Comprovante de manutenção de extintores",
  caixa_agua_comprovante:  "Comprovante de limpeza da caixa d'água",
  dedetizacao_comprovante: "Comprovante de dedetização",
  cct_funcionarios:        "CCT aplicável aos funcionários",
  controle_ferias:         "Controle de férias dos funcionários",
  ppra_pgr:                "PPRA / PGR",
  pcmso:                   "PCMSO",
  cnd_condominio:          "CND / Certidão negativa fiscal",
};

export const DOCUMENTO_CATEGORIA: Record<DocumentoEssencialId, DocumentoCategoria> = {
  convencao:               "juridico",
  regimento:               "juridico",
  ata_eleicao:             "juridico",
  apolice_seguro:          "seguranca",
  avcb_clcb:               "seguranca",
  spda_laudo:              "seguranca",
  brigada_certificado:     "seguranca",
  contrato_elevador:       "manutencao",
  contrato_limpeza:        "operacional",
  contrato_portaria:       "operacional",
  laudos_tecnicos:         "manutencao",
  extintores_comprovante:  "seguranca",
  caixa_agua_comprovante:  "operacional",
  dedetizacao_comprovante: "operacional",
  cct_funcionarios:        "trabalhista",
  controle_ferias:         "trabalhista",
  ppra_pgr:                "trabalhista",
  pcmso:                   "trabalhista",
  cnd_condominio:          "fiscal",
};

export const DOCUMENTO_CRITICIDADE: Record<DocumentoEssencialId, DocumentoCriticidade> = {
  convencao:               "critica",
  regimento:               "importante",
  ata_eleicao:             "critica",
  apolice_seguro:          "critica",
  avcb_clcb:               "critica",
  spda_laudo:              "critica",
  brigada_certificado:     "critica",
  contrato_elevador:       "importante",
  contrato_limpeza:        "recomendada",
  contrato_portaria:       "recomendada",
  laudos_tecnicos:         "importante",
  extintores_comprovante:  "critica",
  caixa_agua_comprovante:  "importante",
  dedetizacao_comprovante: "importante",
  cct_funcionarios:        "importante",
  controle_ferias:         "importante",
  ppra_pgr:                "importante",
  pcmso:                   "importante",
  cnd_condominio:          "recomendada",
};

export function getDocumentos(): DocumentoEssencial[] {
  return safeRead<DocumentoEssencial[]>(KEYS.DOCUMENTOS, []);
}

export function saveDocumentos(docs: DocumentoEssencial[]): void {
  safeWrite(KEYS.DOCUMENTOS, docs);
}

export function upsertDocumento(doc: DocumentoEssencial): void {
  const all = getDocumentos().filter((d) => d.id !== doc.id);
  all.push(doc);
  saveDocumentos(all);
}

export function getDocumentoById(id: string): DocumentoEssencial | null {
  return getDocumentos().find((d) => d.id === id) ?? null;
}

// ─── Manutenções recorrentes ──────────────────────────────────────────────────

export function getManutencoes(): ManutencaoRecorrente[] {
  return safeRead<ManutencaoRecorrente[]>(KEYS.MANUTENCOES, []);
}

export function saveManutencoes(list: ManutencaoRecorrente[]): void {
  safeWrite(KEYS.MANUTENCOES, list);
}

export function upsertManutencao(m: ManutencaoRecorrente): void {
  const all = getManutencoes().filter((x) => x.id !== m.id);
  all.push(m);
  saveManutencoes(all);
}

export function addManutencao(
  m: Omit<ManutencaoRecorrente, "id" | "createdAt" | "updatedAt">
): ManutencaoRecorrente {
  const all = getManutencoes();
  const nova: ManutencaoRecorrente = {
    ...m,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(nova);
  saveManutencoes(all);
  return nova;
}

export function updateManutencao(
  id: string,
  changes: Partial<Omit<ManutencaoRecorrente, "id" | "createdAt">>
): void {
  saveManutencoes(
    getManutencoes().map((m) =>
      m.id === id ? { ...m, ...changes, updatedAt: new Date().toISOString() } : m
    )
  );
}

export function deleteManutencao(id: string): void {
  saveManutencoes(getManutencoes().filter((m) => m.id !== id));
}

// ─── Movimentações financeiras ────────────────────────────────────────────────

export const MOVIMENTACOES_LIMIT = 500;

export function getMovimentacoes(): MovimentacaoFinanceira[] {
  return safeRead<MovimentacaoFinanceira[]>(KEYS.MOVIMENTACOES, []);
}

export function saveMovimentacoes(list: MovimentacaoFinanceira[]): void {
  safeWrite(KEYS.MOVIMENTACOES, list.slice(-MOVIMENTACOES_LIMIT));
}

export function addMovimentacao(
  m: Omit<MovimentacaoFinanceira, "id" | "createdAt" | "origem">
): MovimentacaoFinanceira {
  const all = getMovimentacoes();
  const nova: MovimentacaoFinanceira = {
    ...m,
    id:        `fin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    origem:    "manual",
    createdAt: new Date().toISOString(),
  };
  all.push(nova);
  saveMovimentacoes(all);
  return nova;
}

export function updateMovimentacao(
  id: string,
  changes: Partial<Omit<MovimentacaoFinanceira, "id" | "createdAt" | "origem">>
): void {
  saveMovimentacoes(
    getMovimentacoes().map((m) =>
      m.id === id ? { ...m, ...changes, updatedAt: new Date().toISOString() } : m
    )
  );
}

export function deleteMovimentacao(id: string): void {
  saveMovimentacoes(getMovimentacoes().filter((m) => m.id !== id));
}

export function getMovimentacoesUltimosMeses(n: number): MovimentacaoFinanceira[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - n);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return getMovimentacoes()
    .filter((m) => m.data >= cutoffStr)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function getReceitasPeriodo(startDate: string, endDate: string): MovimentacaoFinanceira[] {
  return getMovimentacoes()
    .filter((m) => m.tipo === "receita" && m.data >= startDate && m.data <= endDate);
}

export function getDespesasPeriodo(startDate: string, endDate: string): MovimentacaoFinanceira[] {
  return getMovimentacoes()
    .filter((m) => m.tipo === "despesa" && m.data >= startDate && m.data <= endDate);
}

export function getSaldoAtual(): number {
  return getMovimentacoes().reduce(
    (sum, m) => (m.tipo === "receita" ? sum + m.valor : sum - m.valor),
    0
  );
}

// ─── Férias de funcionários ──────────────────────────────────────────────────

export function getFuncionarios(): FuncionarioFerias[] {
  return safeRead<FuncionarioFerias[]>(KEYS.FUNCIONARIOS, []);
}

export function saveFuncionarios(list: FuncionarioFerias[]): void {
  safeWrite(KEYS.FUNCIONARIOS, list);
}

export function addFuncionario(f: Omit<FuncionarioFerias, "id" | "createdAt" | "updatedAt">): FuncionarioFerias {
  const all = getFuncionarios();
  const novo: FuncionarioFerias = {
    ...f,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(novo);
  saveFuncionarios(all);
  return novo;
}

export function updateFuncionario(id: string, changes: Partial<Omit<FuncionarioFerias, "id" | "createdAt">>): void {
  saveFuncionarios(
    getFuncionarios().map((f) =>
      f.id === id ? { ...f, ...changes, updatedAt: new Date().toISOString() } : f
    )
  );
}

export function deleteFuncionario(id: string): void {
  saveFuncionarios(getFuncionarios().filter((f) => f.id !== id));
}

// ─── Modo de implantação ─────────────────────────────────────────────────────

export function getImplantacaoMode(): ImplantacaoMode | null {
  return safeRead<ImplantacaoMode | null>(KEYS.IMPLANTACAO_MODE, null);
}

export function saveImplantacaoMode(mode: ImplantacaoMode): void {
  safeWrite(KEYS.IMPLANTACAO_MODE, mode);
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

  if (m.fimMandatoSindico) {
    const d = ate(m.fimMandatoSindico);
    if (d < 0) {
      alertCount++;
      alerts.push({ label: "Mandato", note: "consta como vencido — regularize a eleição" });
    } else if (d <= 30) {
      alertCount++;
      alerts.push({ label: "Mandato", note: d === 0 ? "vence hoje — organize a assembleia" : `vence em ${d} dia${d !== 1 ? "s" : ""} — organize a assembleia` });
    } else if (d <= 90) {
      atencaoCount++;
      atencoes.push({ label: "Mandato", note: `vence em ${d} dias — planeje a convocação` });
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

// ─── Validação interna de backup ─────────────────────────────────────────────
// Fonte única de verdade — usada por parseAndValidateUserData e importUserData.

type VersionFlags = {
  version: UserBackup["version"];
  isV2plus: boolean;
  isV3plus: boolean;
  isV4plus: boolean;
  isV5plus: boolean;
  isV7: boolean;
};

type BackupValidationOk = { ok: true; d: Record<string, unknown>; flags: VersionFlags };
type BackupValidationErr = { ok: false; error: string };

function validateBackupJson(jsonString: string): BackupValidationOk | BackupValidationErr {
  try {
    const data = JSON.parse(jsonString) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "Arquivo inválido. Verifique se é um backup do Amigo do Prédio." };
    }
    const d = data as Record<string, unknown>;
    if (d.app !== "amigo-do-predio") {
      return { ok: false, error: "Este arquivo não é um backup do Amigo do Prédio." };
    }
    if (d.version !== "1" && d.version !== "2" && d.version !== "3" && d.version !== "4" && d.version !== "5" && d.version !== "6" && d.version !== "7") {
      return { ok: false, error: "Versão do backup incompatível." };
    }
    if (d.profile !== null && d.profile !== undefined && (typeof d.profile !== "object" || Array.isArray(d.profile))) {
      return { ok: false, error: "Dados de perfil corrompidos no arquivo." };
    }
    if (!d.memoria || typeof d.memoria !== "object" || Array.isArray(d.memoria)) {
      return { ok: false, error: "Dados de memória corrompidos no arquivo." };
    }
    if (!Array.isArray(d.favorites)) {
      return { ok: false, error: "Dados de favoritos corrompidos no arquivo." };
    }
    if (!d.checklists || typeof d.checklists !== "object" || Array.isArray(d.checklists)) {
      return { ok: false, error: "Dados de checklists corrompidos no arquivo." };
    }
    const isV2plus = d.version === "2" || d.version === "3" || d.version === "4" || d.version === "5" || d.version === "6" || d.version === "7";
    const isV3plus = d.version === "3" || d.version === "4" || d.version === "5" || d.version === "6" || d.version === "7";
    const isV4plus = d.version === "4" || d.version === "5" || d.version === "6" || d.version === "7";
    const isV5plus = d.version === "5" || d.version === "6" || d.version === "7";
    const isV7     = d.version === "7";
    if (isV3plus && !Array.isArray(d.ocorrencias)) {
      return { ok: false, error: "Dados de ocorrências corrompidos no arquivo." };
    }
    if (isV4plus && !Array.isArray(d.agenda)) {
      return { ok: false, error: "Dados de agenda corrompidos no arquivo." };
    }
    return {
      ok: true,
      d,
      flags: { version: d.version as UserBackup["version"], isV2plus, isV3plus, isV4plus, isV5plus, isV7 },
    };
  } catch {
    return { ok: false, error: "Arquivo corrompido ou formato inválido." };
  }
}

function buildImportSummary(d: Record<string, unknown>, flags: VersionFlags): NonNullable<Extract<ImportResult, { success: true }>["summary"]> {
  const profile = d.profile as CondominioProfile | null;
  const memoria = d.memoria as MemoriaOperacional;
  return {
    nomeCondominio:    profile?.nomeCondominio,
    memoriaCount:      Object.values(memoria).filter((v) => v !== undefined && v !== "").length,
    favoritesCount:    (d.favorites as FavoriteEntry[]).length,
    pendenciasCount:   flags.isV2plus && Array.isArray(d.pendencias)  ? (d.pendencias  as Pendencia[]).length          : undefined,
    ocorrenciasCount:  flags.isV3plus && Array.isArray(d.ocorrencias) ? (d.ocorrencias as Ocorrencia[]).length         : undefined,
    agendaCount:       flags.isV4plus && Array.isArray(d.agenda)      ? (d.agenda      as AgendaEvent[]).length         : undefined,
    documentosCount:   flags.isV5plus && Array.isArray(d.documentos)  ? (d.documentos  as DocumentoEssencial[]).length  : undefined,
    funcionariosCount: flags.isV5plus && Array.isArray(d.funcionarios)? (d.funcionarios as FuncionarioFerias[]).length  : undefined,
    manutencoesCount:    (flags.version === "6" || flags.version === "7") && Array.isArray(d.manutencoes) ? (d.manutencoes as ManutencaoRecorrente[]).length : undefined,
    movimentacoesCount:  flags.isV7 && Array.isArray(d.movimentacoes) ? (d.movimentacoes as MovimentacaoFinanceira[]).length : undefined,
  };
}

// ─── Backup e restauração de dados do usuário ────────────────────────────────
// Exporta os dados operacionais do síndico (perfil, memória, favoritos, checklists, pendências, ocorrências).
// Diferente de exportTelemetry (que exporta dados de uso/análise), este backup é
// destinado ao próprio usuário para proteção e migração de dispositivo.
//
// Versões:
//   v1 — perfil, memória, favoritos, checklists (sem pendências)
//   v2 — idem + pendências (amigo_pendencias)
//   v3 — idem + ocorrências leves (amigo_ocorrencias)
//   v4 — idem + agenda do prédio (amigo_agenda)

export type UserBackup = {
  version: "1" | "2" | "3" | "4" | "5" | "6" | "7";
  app: "amigo-do-predio";
  exportedAt: string;
  profile: CondominioProfile | null;
  memoria: MemoriaOperacional;
  favorites: FavoriteEntry[];
  checklists: ChecklistStorage;
  pendencias?: Pendencia[];                   // v2+
  ocorrencias?: Ocorrencia[];                 // v3+
  agenda?: AgendaEvent[];                     // v4+
  memoriaAssistida?: MemoriaAssistida;         // v5+
  documentos?: DocumentoEssencial[];           // v5+
  funcionarios?: FuncionarioFerias[];          // v5+
  implantacaoMode?: ImplantacaoMode;           // v5+
  manutencoes?: ManutencaoRecorrente[];        // v6+
  movimentacoes?: MovimentacaoFinanceira[];    // v7+
};

export type ImportResult =
  | { success: true; summary: { nomeCondominio?: string; memoriaCount: number; favoritesCount: number; pendenciasCount?: number; ocorrenciasCount?: number; agendaCount?: number; documentosCount?: number; funcionariosCount?: number; manutencoesCount?: number; movimentacoesCount?: number } }
  | { success: false; error: string };

export function exportUserData(): void {
  if (typeof window === "undefined") return;

  const payload: UserBackup = {
    version: "7",
    app: "amigo-do-predio",
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    memoria: getMemoriaOperacional(),
    favorites: getFavorites(),
    checklists: getChecklistStorage(),
    pendencias: getPendencias(),
    ocorrencias: getOcorrencias(),
    agenda: getAgendaEvents(),
    memoriaAssistida: getMemoriaAssistida(),
    documentos: getDocumentos(),
    funcionarios: getFuncionarios(),
    implantacaoMode: getImplantacaoMode() ?? undefined,
    manutencoes: getManutencoes(),
    movimentacoes: getMovimentacoes(),
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

export function getUserBackupJson(): string {
  const payload: UserBackup = {
    version: "7",
    app: "amigo-do-predio",
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    memoria: getMemoriaOperacional(),
    favorites: getFavorites(),
    checklists: getChecklistStorage(),
    pendencias: getPendencias(),
    ocorrencias: getOcorrencias(),
    agenda: getAgendaEvents(),
    memoriaAssistida: getMemoriaAssistida(),
    documentos: getDocumentos(),
    funcionarios: getFuncionarios(),
    implantacaoMode: getImplantacaoMode() ?? undefined,
    manutencoes: getManutencoes(),
    movimentacoes: getMovimentacoes(),
  };
  return JSON.stringify(payload, null, 2);
}

// Valida o backup sem escrever no localStorage — usado para mostrar preview antes da confirmação.
export function parseAndValidateUserData(jsonString: string): ImportResult {
  const v = validateBackupJson(jsonString);
  if (!v.ok) return { success: false, error: v.error };
  return { success: true, summary: buildImportSummary(v.d, v.flags) };
}

// Importa backup v1–v6. Retrocompatível com todas as versões anteriores.
export function importUserData(jsonString: string): ImportResult {
  const v = validateBackupJson(jsonString);
  if (!v.ok) return { success: false, error: v.error };

  const { d, flags } = v;

  if (d.profile) {
    safeWrite(KEYS.PROFILE, d.profile);
  } else if (d.profile === null) {
    try { localStorage.removeItem(KEYS.PROFILE); } catch { /* noop */ }
  }
  safeWrite(KEYS.MEMORIA, d.memoria);
  safeWrite(KEYS.FAVORITES, d.favorites);
  safeWrite(KEYS.CHECKLISTS, d.checklists);

  if (flags.isV2plus && Array.isArray(d.pendencias)) {
    safeWrite(KEYS.PENDENCIAS, d.pendencias);
  }
  if (flags.isV3plus && Array.isArray(d.ocorrencias)) {
    safeWrite(KEYS.OCORRENCIAS, d.ocorrencias);
  } else {
    try { localStorage.removeItem(KEYS.OCORRENCIAS); } catch { /* noop */ }
  }
  if (flags.isV4plus && Array.isArray(d.agenda)) {
    safeWrite(KEYS.AGENDA, d.agenda);
  } else {
    try { localStorage.removeItem(KEYS.AGENDA); } catch { /* noop */ }
  }
  if (flags.isV5plus) {
    if (Array.isArray(d.documentos)) {
      safeWrite(KEYS.DOCUMENTOS, d.documentos);
    } else {
      try { localStorage.removeItem(KEYS.DOCUMENTOS); } catch { /* noop */ }
    }
    if (Array.isArray(d.funcionarios)) {
      safeWrite(KEYS.FUNCIONARIOS, d.funcionarios);
    } else {
      try { localStorage.removeItem(KEYS.FUNCIONARIOS); } catch { /* noop */ }
    }
    if (d.memoriaAssistida && typeof d.memoriaAssistida === "object" && !Array.isArray(d.memoriaAssistida)) {
      safeWrite(KEYS.MEMORIA_ASSISTIDA, d.memoriaAssistida);
    }
    if (d.implantacaoMode && typeof d.implantacaoMode === "string") {
      safeWrite(KEYS.IMPLANTACAO_MODE, d.implantacaoMode);
    }
  } else {
    try { localStorage.removeItem(KEYS.DOCUMENTOS); } catch { /* noop */ }
    try { localStorage.removeItem(KEYS.FUNCIONARIOS); } catch { /* noop */ }
  }
  if ((flags.version === "6" || flags.version === "7") && Array.isArray(d.manutencoes)) {
    safeWrite(KEYS.MANUTENCOES, d.manutencoes);
  } else {
    try { localStorage.removeItem(KEYS.MANUTENCOES); } catch { /* noop */ }
  }

  if (flags.isV7 && Array.isArray(d.movimentacoes)) {
    safeWrite(KEYS.MOVIMENTACOES, d.movimentacoes);
  } else {
    try { localStorage.removeItem(KEYS.MOVIMENTACOES); } catch { /* noop */ }
  }

  // Após restore bem-sucedido, registrar como backup recente para evitar falso positivo no nudge.
  recordBackupAt();

  return { success: true, summary: buildImportSummary(d, flags) };
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

// ─── Histórico de comunicados gerados ────────────────────────────────────────

export type ComunicadoHistoryEntry = {
  id: string;
  templateId: string;
  templateTitle: string;
  templateIcon: string;
  preview: string; // texto completo gerado no momento da cópia
  copiedAt: string; // ISO
};

export function getComunicadoHistory(): ComunicadoHistoryEntry[] {
  return safeRead<ComunicadoHistoryEntry[]>(KEYS.COMUNICADO_HISTORY, []);
}

export function addComunicadoHistory(entry: Omit<ComunicadoHistoryEntry, "id">): void {
  const all = getComunicadoHistory();
  all.push({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });
  safeWrite(KEYS.COMUNICADO_HISTORY, all.slice(-10));
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
