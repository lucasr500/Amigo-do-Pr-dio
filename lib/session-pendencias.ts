// ─── Domínio: Pendências ──────────────────────────────────────────────────────
// Tipos, normalizador e CRUD de pendências do síndico.
// Persiste em localStorage via session-core. Sem lógica de UI.

import { safeRead, safeWrite, KEYS } from "./session-core";

// ─── Caps de armazenamento ────────────────────────────────────────────────────
export const MAX_PENDENCIAS  = 200;
export const WARN_PENDENCIAS = 150;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PendenciaPrioridade = "critica" | "alta" | "media" | "baixa";

export type Pendencia = {
  id: string;
  titulo: string;
  descricao?: string;
  categoria?: string;
  origem?: "manual" | "response" | "guidance" | "revisao" | "memoria" | "ocorrencia" | "agenda" | "assistente_preenchimento" | "documento" | "funcionario" | "comunicado";
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
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getPendencias(): Pendencia[] {
  return safeRead<Partial<Pendencia>[]>(KEYS.PENDENCIAS, []).map(normalizePendencia);
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
  patch: Partial<Omit<Pendencia, "id" | "createdAt">>
): void {
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) => (p.id === id ? { ...p, ...patch } : p))
  );
}

export function reopenPendencia(id: string): void {
  safeWrite(
    KEYS.PENDENCIAS,
    getPendencias().map((p) =>
      p.id === id ? { ...p, status: "aberta" as const, completedAt: undefined, observacaoResolucao: undefined } : p
    )
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
