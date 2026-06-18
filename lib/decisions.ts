// ─── Registro de decisões do síndico — memória institucional ─────────────────
// Decisões relevantes ficam registradas com contexto, fundamento e risco.
// Protege o síndico juridicamente e alimenta a continuidade entre gestões.

import { safeRead, safeWrite, KEYS } from "./session-core";
import { emitDecisionStatusChanged } from "./community-timeline";
import type { Visibility } from "./community-types";
import { mirrorUpsertDecision, mirrorDeleteDecision } from "@/lib/tenant/decisionsRemote";

export type DecisionCategory =
  | "financeiro"
  | "obras"
  | "juridico"
  | "trabalhista"
  | "assembleia"
  | "manutencao"
  | "regimento"
  | "fornecedor"
  | "seguranca"
  | "morador"
  | "outro";

export type DecisionRiskLevel = "baixo" | "medio" | "alto";
export type DecisionStatus = "registrada" | "em_execucao" | "concluida" | "suspensa";

export type Decision = {
  id: string;
  title: string;
  date: string;               // YYYY-MM-DD
  category: DecisionCategory;
  context: string;            // o que motivou a decisão
  rationale: string;          // por que esta decisão
  outcome: string;            // decisão tomada
  status: DecisionStatus;     // ciclo de vida operacional
  // quem pode LER (default gestao); espelha o enum da comunidade. Opcional no tipo
  // (como no desenho rev.2) para não quebrar construtores por literal; normalizeDecision
  // SEMPRE preenche com 'gestao' quando ausente, então na prática é sempre definido.
  visibility?: Visibility;
  riskLevel?: DecisionRiskLevel;
  riskNotes?: string;
  nextStep?: string;
  linkedUnit?: string;        // unidade relacionada, se aplicável
  linkedDocumentId?: string;  // documento relacionado
  linkedSupplierId?: string;  // fornecedor relacionado
  linkedPendenciaId?: string; // pendência relacionada
  createdAt: string;
  updatedAt: string;
};

export const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
  registrada:  "Registrada",
  em_execucao: "Em execução",
  concluida:   "Concluída",
  suspensa:    "Suspensa",
};

export const DECISION_CATEGORY_LABELS: Record<DecisionCategory, string> = {
  financeiro:  "Financeiro",
  obras:       "Obras e reformas",
  juridico:    "Jurídico",
  trabalhista: "Trabalhista",
  assembleia:  "Assembleia",
  manutencao:  "Manutenção",
  regimento:   "Regimento/Convenção",
  fornecedor:  "Fornecedor",
  seguranca:   "Segurança",
  morador:     "Morador/Unidade",
  outro:       "Outro",
};

function genId(): string {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeDecision(raw: Partial<Decision>): Decision {
  const now = new Date().toISOString();
  const category: DecisionCategory = raw.category && raw.category in DECISION_CATEGORY_LABELS
    ? raw.category
    : "outro";
  const status: DecisionStatus =
    raw.status === "registrada" ||
    raw.status === "em_execucao" ||
    raw.status === "concluida" ||
    raw.status === "suspensa"
      ? raw.status
      : "registrada";
  const riskLevel: DecisionRiskLevel | undefined =
    raw.riskLevel === "baixo" || raw.riskLevel === "medio" || raw.riskLevel === "alto"
      ? raw.riskLevel
      : undefined;

  const visibility: Visibility =
    raw.visibility === "gestao" || raw.visibility === "conselho" ||
    raw.visibility === "moradores" || raw.visibility === "publico"
      ? raw.visibility
      : "gestao";

  return {
    id: raw.id || genId(),
    title: raw.title?.trim() || "Decisão sem título",
    date: raw.date || now.slice(0, 10),
    category,
    context: raw.context?.trim() || "",
    rationale: raw.rationale?.trim() || "",
    outcome: raw.outcome?.trim() || "",
    status,
    visibility,
    riskLevel,
    riskNotes: raw.riskNotes?.trim() || undefined,
    nextStep: raw.nextStep?.trim() || undefined,
    linkedUnit: raw.linkedUnit?.trim() || undefined,
    linkedDocumentId: raw.linkedDocumentId,
    linkedSupplierId: raw.linkedSupplierId,
    linkedPendenciaId: raw.linkedPendenciaId,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || raw.createdAt || now,
  };
}

export function getDecisions(): Decision[] {
  return safeRead<Partial<Decision>[]>(KEYS.DECISIONS, []).map(normalizeDecision);
}

export function saveDecisions(list: Decision[]): void {
  safeWrite(KEYS.DECISIONS, list.map(normalizeDecision).slice(-500));
}

export function addDecision(data: Omit<Decision, "id" | "createdAt" | "updatedAt" | "status" | "visibility"> & { status?: DecisionStatus; visibility?: Visibility }): Decision {
  const now = new Date().toISOString();
  const decision = normalizeDecision({ ...data, id: genId(), createdAt: now, updatedAt: now });
  saveDecisions([...getDecisions(), decision]);
  void mirrorUpsertDecision(decision); // dual-write PUSH best-effort (no-op se flag off)
  return decision;
}

export function updateDecision(id: string, patch: Partial<Omit<Decision, "id" | "createdAt">>): void {
  const previous = getDecisions().find((d) => d.id === id);
  const next = getDecisions().map((d) => d.id === id ? normalizeDecision({ ...d, ...patch, updatedAt: new Date().toISOString() }) : d);
  saveDecisions(next);

  const updated = next.find((d) => d.id === id);
  if (updated) void mirrorUpsertDecision(updated); // dual-write PUSH best-effort (no-op se flag off)
  if (
    previous &&
    updated &&
    previous.status !== updated.status &&
    (updated.status === "concluida" || updated.status === "em_execucao" || updated.status === "suspensa")
  ) {
    emitDecisionStatusChanged(updated.id, updated.title, DECISION_STATUS_LABELS[updated.status]);
  }
}

export function deleteDecision(id: string): void {
  saveDecisions(getDecisions().filter((d) => d.id !== id));
  void mirrorDeleteDecision(id); // dual-write PUSH best-effort (no-op se flag off)
}

export function getDecisionsByCategory(category: DecisionCategory): Decision[] {
  return getDecisions().filter((d) => d.category === category);
}

export function getRecentDecisions(limit = 10): Decision[] {
  return [...getDecisions()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export function buildDecisionsReport(decisions: Decision[]): string {
  const sorted = [...decisions].sort((a, b) => b.date.localeCompare(a.date));

  const lines: string[] = [
    "REGISTRO DE DECISÕES DO SÍNDICO",
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    `Total de registros: ${sorted.length}`,
    "",
    "Este registro documenta as principais decisões tomadas durante o mandato,",
    "com contexto, fundamentação e próximos passos.",
    "",
    "═══════════════════════════════════════════════════════",
    "",
  ];

  for (const d of sorted) {
    lines.push(`▸ ${d.title}`);
    lines.push(`  Data: ${d.date} | Categoria: ${DECISION_CATEGORY_LABELS[d.category]} | Status: ${DECISION_STATUS_LABELS[d.status]}`);
    if (d.riskLevel) lines.push(`  Risco: ${d.riskLevel}`);
    lines.push(`  Contexto: ${d.context}`);
    lines.push(`  Fundamento: ${d.rationale}`);
    lines.push(`  Decisão: ${d.outcome}`);
    if (d.nextStep) lines.push(`  Próximo passo: ${d.nextStep}`);
    if (d.riskNotes) lines.push(`  Observação de risco: ${d.riskNotes}`);
    lines.push("");
  }

  return lines.join("\n");
}
