// ─── Domínio: Pendências ──────────────────────────────────────────────────────
// Tipos, normalizador e CRUD de pendências do síndico.
// Persiste em localStorage via session-core. Sem lógica de UI.

import { safeRead, safeWrite, KEYS } from "./session-core";

// ─── Caps de armazenamento ────────────────────────────────────────────────────
export const MAX_PENDENCIAS  = 200;
export const WARN_PENDENCIAS = 150;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PendenciaPrioridade = "critica" | "alta" | "media" | "baixa";

export type PendencyEventType = "criado" | "concluido" | "reaberto" | "editado" | "nota";

export type PendencyEvent = {
  ts: string;               // ISO timestamp
  type: PendencyEventType;
  note?: string;            // observação (resolução, motivo de edição, nota livre)
};

const MAX_EVENTS_PER_PENDENCIA = 20;

export type Pendencia = {
  id: string;
  titulo: string;
  descricao?: string;
  categoria?: string;
  origem?: "manual" | "response" | "guidance" | "revisao" | "memoria" | "ocorrencia" | "agenda" | "assistente_preenchimento" | "documento" | "funcionario" | "comunicado" | "financeiro";
  matchedId?: string | null;
  status: "aberta" | "concluida";
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  prioridade?: PendenciaPrioridade;          // v8+
  responsavel?: string;                      // v9+
  origemDetalhe?: string;                    // v9+
  linkedType?: "agenda" | "documento" | "financeiro" | "ocorrencia" | "assistente";
  linkedId?: string | null;
  observacaoResolucao?: string;              // v8+ — preenchido ao concluir
  events?: PendencyEvent[];                  // v10+ — log de eventos por item
};

// ─── Normalizador ─────────────────────────────────────────────────────────────

export function normalizePendencia(raw: Partial<Pendencia>): Pendencia {
  const now = new Date().toISOString();
  const status = raw.status === "concluida" ? "concluida" : "aberta";
  const prioridade: PendenciaPrioridade =
    raw.prioridade === "critica" ||
    raw.prioridade === "alta" ||
    raw.prioridade === "media" ||
    raw.prioridade === "baixa"
      ? raw.prioridade
      : raw.origem === "guidance"
        ? "alta"
        : "media";

  return {
    id: raw.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    titulo: raw.titulo?.trim() || "Pendência sem título",
    descricao: raw.descricao?.trim() || undefined,
    categoria: raw.categoria || "operacional",
    origem: raw.origem || "manual",
    matchedId: raw.matchedId ?? null,
    status,
    createdAt: raw.createdAt || now,
    completedAt: status === "concluida" ? raw.completedAt || now : raw.completedAt,
    dueDate: raw.dueDate || undefined,
    prioridade,
    responsavel: raw.responsavel?.trim() || undefined,
    origemDetalhe: raw.origemDetalhe?.trim() || undefined,
    linkedType: raw.linkedType,
    linkedId: raw.linkedId ?? null,
    observacaoResolucao: raw.observacaoResolucao?.trim() || undefined,
    events: Array.isArray(raw.events) ? raw.events : undefined,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getPendencias(): Pendencia[] {
  return safeRead<Partial<Pendencia>[]>(KEYS.PENDENCIAS, []).map(normalizePendencia);
}

function appendEvent(p: Pendencia, event: PendencyEvent): Pendencia {
  const existing = p.events ?? [];
  const updated  = [...existing, event];
  return { ...p, events: updated.length > MAX_EVENTS_PER_PENDENCIA ? updated.slice(-MAX_EVENTS_PER_PENDENCIA) : updated };
}

export function addPendencia(
  p: Omit<Pendencia, "id" | "createdAt" | "status">
): Pendencia {
  const all = getPendencias();
  const now = new Date().toISOString();
  const nova: Pendencia = {
    ...p,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "aberta",
    createdAt: now,
    events: [{ ts: now, type: "criado" }],
  };
  all.push(nova);
  // Preserva todas as pendências abertas; descarta apenas concluídas antigas se necessário
  if (all.length > MAX_PENDENCIAS) {
    const abertas    = all.filter((item) => item.status === "aberta");
    const concluidas = all.filter((item) => item.status === "concluida");
    const maxConcluidas = Math.max(0, MAX_PENDENCIAS - abertas.length);
    safeWrite(KEYS.PENDENCIAS, [...abertas, ...concluidas.slice(-maxConcluidas)]);
  } else {
    safeWrite(KEYS.PENDENCIAS, all);
  }
  return nova;
}

export function completePendencia(id: string, observacao?: string): void {
  const now = new Date().toISOString();
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) => {
      if (p.id !== id) return p;
      const updated: Pendencia = {
        ...p,
        status: "concluida",
        completedAt: now,
        ...(observacao?.trim() ? { observacaoResolucao: observacao.trim() } : {}),
      };
      return appendEvent(updated, { ts: now, type: "concluido", note: observacao?.trim() || undefined });
    })
  );
}

export function updatePendencia(
  id: string,
  patch: Partial<Omit<Pendencia, "id" | "createdAt">>
): void {
  const now = new Date().toISOString();
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) => {
      if (p.id !== id) return p;
      const updated: Pendencia = { ...p, ...patch };
      return appendEvent(updated, { ts: now, type: "editado" });
    })
  );
}

export function reopenPendencia(id: string): void {
  const now = new Date().toISOString();
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) => {
      if (p.id !== id) return p;
      const updated: Pendencia = { ...p, status: "aberta", completedAt: undefined, observacaoResolucao: undefined };
      return appendEvent(updated, { ts: now, type: "reaberto" });
    })
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
