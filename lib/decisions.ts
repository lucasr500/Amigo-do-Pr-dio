// ─── Registro de decisões do síndico — memória institucional ─────────────────
// Decisões relevantes ficam registradas com contexto, fundamento e risco.
// Protege o síndico juridicamente e alimenta a continuidade entre gestões.

import { safeRead, safeWrite, KEYS } from "./session-core";

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

export type Decision = {
  id: string;
  title: string;
  date: string;               // YYYY-MM-DD
  category: DecisionCategory;
  context: string;            // o que motivou a decisão
  rationale: string;          // por que esta decisão
  outcome: string;            // decisão tomada
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

export function getDecisions(): Decision[] {
  return safeRead<Decision[]>(KEYS.DECISIONS, []);
}

export function saveDecisions(list: Decision[]): void {
  safeWrite(KEYS.DECISIONS, list.slice(-500));
}

export function addDecision(data: Omit<Decision, "id" | "createdAt" | "updatedAt">): Decision {
  const now = new Date().toISOString();
  const decision: Decision = { ...data, id: genId(), createdAt: now, updatedAt: now };
  saveDecisions([...getDecisions(), decision]);
  return decision;
}

export function updateDecision(id: string, patch: Partial<Omit<Decision, "id" | "createdAt">>): void {
  saveDecisions(
    getDecisions().map((d) => d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)
  );
}

export function deleteDecision(id: string): void {
  saveDecisions(getDecisions().filter((d) => d.id !== id));
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
    lines.push(`  Data: ${d.date} | Categoria: ${DECISION_CATEGORY_LABELS[d.category]}`);
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
