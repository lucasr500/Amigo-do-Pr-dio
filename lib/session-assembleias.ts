// ─── Domínio: Assembleia ──────────────────────────────────────────────────────
// Entidade-âncora do wedge social. Centro do loop:
//   informar → discutir → organizar → decidir → lembrar
// Uma assembleia (informar) tem itens de pauta (organizar) que ancoram discussão e
// enquete; cujos resultados viram decisão registrada (decidir) e evento de timeline
// (lembrar). Esta camada NÃO fecha o loop sozinha — os vínculos com Decision/Poll/
// Timeline vivem em lib/assembleias-loop.ts para manter este módulo sem ciclos.
//
// Persiste em localStorage via session-core (local-first). Dual-write PUSH best-effort
// para Supabase quando `assemblies_remote_enabled` estiver ligado. Sem lógica de UI.
// Espelha integralmente o padrão de lib/session-agenda.ts.

import { safeRead, safeWrite, KEYS, todayISO } from "./session-core";
import {
  mirrorUpsertAssembly, mirrorDeleteAssembly,
  mirrorUpsertItem, mirrorDeleteItem,
} from "@/lib/tenant/assembliesRemote";

// ─── Caps de armazenamento ────────────────────────────────────────────────────
export const MAX_ASSEMBLEIAS = 200;
export const MAX_ITENS_TOTAL  = 2000;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type AssemblyTipo = "ago" | "age" | "outra";
export type AssemblyStatus = "rascunho" | "convocada" | "realizada" | "encerrada";
export type AgendaItemTipo = "informe" | "deliberacao" | "eleicao";

export type Assembly = {
  id: string;
  titulo: string;
  tipo: AssemblyTipo;
  data?: string;            // YYYY-MM-DD
  local?: string;
  status: AssemblyStatus;
  quorumMin?: number;
  quorumAtingido?: number;
  ataDocumentId?: string;
  convocadaEm?: string;     // ISO
  createdAt: string;
  updatedAt?: string;
};

export type AssemblyAgendaItem = {
  id: string;
  assemblyId: string;
  ordem: number;
  titulo: string;
  descricao?: string;
  tipo: AgendaItemTipo;
  resultado?: string;
  decididoEm?: string;      // ISO
  linkedDecisionId?: string;
  linkedPollId?: string;
  createdAt: string;
  updatedAt?: string;
};

export const ASSEMBLY_TIPO_LABELS: Record<AssemblyTipo, string> = {
  ago:   "AGO — Ordinária",
  age:   "AGE — Extraordinária",
  outra: "Outra reunião",
};

export const ASSEMBLY_STATUS_LABELS: Record<AssemblyStatus, string> = {
  rascunho:  "Rascunho",
  convocada: "Convocada",
  realizada: "Realizada",
  encerrada: "Encerrada",
};

export const AGENDA_ITEM_TIPO_LABELS: Record<AgendaItemTipo, string> = {
  informe:     "Informe",
  deliberacao: "Deliberação",
  eleicao:     "Eleição",
};

// ─── IDs estáveis (gerados no cliente, chave do upsert remoto) ────────────────

function genAssemblyId(): string {
  return `asm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
function genItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Normalizadores ───────────────────────────────────────────────────────────

export function normalizeAssembly(raw: Partial<Assembly>): Assembly {
  const now = new Date().toISOString();
  const tipo: AssemblyTipo =
    raw.tipo === "ago" || raw.tipo === "age" || raw.tipo === "outra" ? raw.tipo : "ago";
  const status: AssemblyStatus =
    raw.status === "rascunho" || raw.status === "convocada" ||
    raw.status === "realizada" || raw.status === "encerrada"
      ? raw.status
      : "rascunho";
  return {
    id: raw.id || genAssemblyId(),
    titulo: raw.titulo?.trim() || "Assembleia sem título",
    tipo,
    data: raw.data || undefined,
    local: raw.local?.trim() || undefined,
    status,
    quorumMin: typeof raw.quorumMin === "number" ? raw.quorumMin : undefined,
    quorumAtingido: typeof raw.quorumAtingido === "number" ? raw.quorumAtingido : undefined,
    ataDocumentId: raw.ataDocumentId || undefined,
    convocadaEm: raw.convocadaEm || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeAgendaItem(raw: Partial<AssemblyAgendaItem>): AssemblyAgendaItem {
  const now = new Date().toISOString();
  const tipo: AgendaItemTipo =
    raw.tipo === "informe" || raw.tipo === "deliberacao" || raw.tipo === "eleicao"
      ? raw.tipo
      : "deliberacao";
  return {
    id: raw.id || genItemId(),
    assemblyId: raw.assemblyId || "",
    ordem: typeof raw.ordem === "number" ? raw.ordem : 0,
    titulo: raw.titulo?.trim() || "Item de pauta",
    descricao: raw.descricao?.trim() || undefined,
    tipo,
    resultado: raw.resultado?.trim() || undefined,
    decididoEm: raw.decididoEm || undefined,
    linkedDecisionId: raw.linkedDecisionId || undefined,
    linkedPollId: raw.linkedPollId || undefined,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt,
  };
}

// ─── CRUD: assembleias ────────────────────────────────────────────────────────

export function getAssemblies(): Assembly[] {
  return safeRead<Partial<Assembly>[]>(KEYS.ASSEMBLEIAS, [])
    .map(normalizeAssembly)
    .sort((a, b) => (b.data ?? b.createdAt).localeCompare(a.data ?? a.createdAt));
}

export function getAssemblyById(id: string): Assembly | null {
  return getAssemblies().find((a) => a.id === id) ?? null;
}

export function addAssembly(
  data: Omit<Assembly, "id" | "createdAt" | "updatedAt">
): Assembly {
  const nova = normalizeAssembly({ ...data, id: genAssemblyId(), createdAt: new Date().toISOString() });
  const all = getAssemblies();
  safeWrite(KEYS.ASSEMBLEIAS, [nova, ...all].slice(0, MAX_ASSEMBLEIAS));
  void mirrorUpsertAssembly(nova); // dual-write PUSH best-effort (no-op se flag off)
  return nova;
}

export function updateAssembly(
  id: string,
  changes: Partial<Omit<Assembly, "id" | "createdAt">>
): void {
  safeWrite(
    KEYS.ASSEMBLEIAS,
    getAssemblies().map((a) =>
      a.id === id ? normalizeAssembly({ ...a, ...changes, updatedAt: new Date().toISOString() }) : a
    )
  );
  const u = getAssemblyById(id);
  if (u) void mirrorUpsertAssembly(u);
}

export function deleteAssembly(id: string): void {
  safeWrite(KEYS.ASSEMBLEIAS, getAssemblies().filter((a) => a.id !== id));
  // Cascata local: remove a pauta associada (espelha ON DELETE CASCADE da migration).
  const itensRestantes = getAllItems().filter((i) => i.assemblyId !== id);
  const removidos = getAllItems().filter((i) => i.assemblyId === id);
  safeWrite(KEYS.ASSEMBLEIA_ITENS, itensRestantes);
  void mirrorDeleteAssembly(id);
  for (const i of removidos) void mirrorDeleteItem(i.id);
}

// ─── CRUD: itens de pauta ───────────────────────────────────────────────────

function getAllItems(): AssemblyAgendaItem[] {
  return safeRead<Partial<AssemblyAgendaItem>[]>(KEYS.ASSEMBLEIA_ITENS, []).map(normalizeAgendaItem);
}

export function getAgendaItems(assemblyId: string): AssemblyAgendaItem[] {
  return getAllItems()
    .filter((i) => i.assemblyId === assemblyId)
    .sort((a, b) => a.ordem - b.ordem || a.createdAt.localeCompare(b.createdAt));
}

export function getAgendaItemById(id: string): AssemblyAgendaItem | null {
  return getAllItems().find((i) => i.id === id) ?? null;
}

export function addAgendaItem(
  data: Omit<AssemblyAgendaItem, "id" | "createdAt" | "updatedAt" | "ordem"> & { ordem?: number }
): AssemblyAgendaItem {
  const all = getAllItems();
  const ordem =
    typeof data.ordem === "number"
      ? data.ordem
      : getAgendaItems(data.assemblyId).length; // próximo no fim da pauta
  const novo = normalizeAgendaItem({ ...data, ordem, id: genItemId(), createdAt: new Date().toISOString() });
  safeWrite(KEYS.ASSEMBLEIA_ITENS, [...all, novo].slice(-MAX_ITENS_TOTAL));
  void mirrorUpsertItem(novo);
  return novo;
}

export function updateAgendaItem(
  id: string,
  changes: Partial<Omit<AssemblyAgendaItem, "id" | "assemblyId" | "createdAt">>
): void {
  safeWrite(
    KEYS.ASSEMBLEIA_ITENS,
    getAllItems().map((i) =>
      i.id === id ? normalizeAgendaItem({ ...i, ...changes, updatedAt: new Date().toISOString() }) : i
    )
  );
  const u = getAgendaItemById(id);
  if (u) void mirrorUpsertItem(u);
}

export function deleteAgendaItem(id: string): void {
  safeWrite(KEYS.ASSEMBLEIA_ITENS, getAllItems().filter((i) => i.id !== id));
  void mirrorDeleteItem(id);
}

// ─── Derivados de leitura ─────────────────────────────────────────────────────

export function countAgendaItems(assemblyId: string): number {
  return getAllItems().filter((i) => i.assemblyId === assemblyId).length;
}

export function countDecided(assemblyId: string): number {
  return getAllItems().filter((i) => i.assemblyId === assemblyId && !!i.decididoEm).length;
}
