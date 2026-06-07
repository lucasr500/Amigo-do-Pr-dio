// ─── Histórico por unidade/apartamento ────────────────────────────────────────
// Linha do tempo de eventos vinculados a uma unidade específica.
// Transforma ocorrências isoladas em memória institucional por apartamento.

import { safeRead, safeWrite, KEYS } from "./session-core";

export type UnitEventType =
  | "ocorrencia"
  | "advertencia"
  | "multa"
  | "comunicado"
  | "inadimplencia"
  | "obra"
  | "assembleia_voto"
  | "mudanca"
  | "visita_tecnica"
  | "reclamacao"
  | "elogio"
  | "outro";

export type UnitEventStatus = "aberto" | "resolvido" | "informativo";

export type UnitEvent = {
  id: string;
  unit: string;               // "101", "301", "B-02" etc — texto livre
  type: UnitEventType;
  date: string;               // YYYY-MM-DD
  title: string;
  description: string;
  status: UnitEventStatus;
  resolvedAt?: string;
  responsavel?: string;
  linkedOcorrenciaId?: string;
  linkedDecisionId?: string;
  linkedComunicadoText?: string;
  amount?: number;            // valor de multa ou cobrança, se aplicável
  createdAt: string;
};

export const UNIT_EVENT_TYPE_LABELS: Record<UnitEventType, string> = {
  ocorrencia:       "Ocorrência",
  advertencia:      "Advertência",
  multa:            "Multa",
  comunicado:       "Comunicado",
  inadimplencia:    "Inadimplência",
  obra:             "Obra/Reforma",
  assembleia_voto:  "Voto em assembleia",
  mudanca:          "Mudança",
  visita_tecnica:   "Visita técnica",
  reclamacao:       "Reclamação",
  elogio:           "Elogio/Feedback",
  outro:            "Outro",
};

function genId(): string {
  return `ue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getUnitEvents(): UnitEvent[] {
  return safeRead<UnitEvent[]>(KEYS.UNIT_EVENTS, []);
}

export function saveUnitEvents(list: UnitEvent[]): void {
  safeWrite(KEYS.UNIT_EVENTS, list.slice(-1000));
}

export function addUnitEvent(data: Omit<UnitEvent, "id" | "createdAt">): UnitEvent {
  const event: UnitEvent = { ...data, id: genId(), createdAt: new Date().toISOString() };
  saveUnitEvents([...getUnitEvents(), event]);
  return event;
}

export function updateUnitEvent(id: string, patch: Partial<Omit<UnitEvent, "id" | "createdAt">>): void {
  saveUnitEvents(
    getUnitEvents().map((e) => e.id === id ? { ...e, ...patch } : e)
  );
}

export function deleteUnitEvent(id: string): void {
  saveUnitEvents(getUnitEvents().filter((e) => e.id !== id));
}

export function getUnitHistory(unit: string): UnitEvent[] {
  const normalizedUnit = unit.trim().toLowerCase();
  return getUnitEvents()
    .filter((e) => e.unit.trim().toLowerCase() === normalizedUnit)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllUnits(): string[] {
  const events = getUnitEvents();
  const unitSet = new Set(events.map((e) => e.unit.trim()));
  return [...unitSet].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

export function getUnitSummary(unit: string): {
  totalEvents: number;
  openEvents: number;
  multas: number;
  advertencias: number;
  inadimplencias: number;
  lastEventDate?: string;
} {
  const history = getUnitHistory(unit);
  return {
    totalEvents: history.length,
    openEvents: history.filter((e) => e.status === "aberto").length,
    multas: history.filter((e) => e.type === "multa").length,
    advertencias: history.filter((e) => e.type === "advertencia").length,
    inadimplencias: history.filter((e) => e.type === "inadimplencia").length,
    lastEventDate: history[0]?.date,
  };
}

export function getUnitsSummary(): {
  unit: string;
  totalEvents: number;
  openEvents: number;
  hasMulta: boolean;
}[] {
  const units = getAllUnits();
  return units.map((unit) => {
    const history = getUnitHistory(unit);
    return {
      unit,
      totalEvents: history.length,
      openEvents: history.filter((e) => e.status === "aberto").length,
      hasMulta: history.some((e) => e.type === "multa"),
    };
  }).sort((a, b) => b.totalEvents - a.totalEvents);
}

export function buildUnitReport(unit: string, events: UnitEvent[]): string {
  const lines: string[] = [
    `HISTÓRICO DA UNIDADE ${unit.toUpperCase()}`,
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    `Total de registros: ${events.length}`,
    "",
  ];

  if (events.length === 0) {
    lines.push("Nenhum registro encontrado para esta unidade.");
    return lines.join("\n");
  }

  for (const e of events) {
    const statusLabel = e.status === "resolvido" ? " [Resolvido]" : e.status === "aberto" ? " [Aberto]" : "";
    lines.push(`▸ ${e.date} — ${UNIT_EVENT_TYPE_LABELS[e.type]}${statusLabel}`);
    lines.push(`  ${e.title}`);
    lines.push(`  ${e.description}`);
    if (e.amount) lines.push(`  Valor: R$ ${e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    if (e.responsavel) lines.push(`  Responsável: ${e.responsavel}`);
    if (e.resolvedAt) lines.push(`  Resolvido em: ${e.resolvedAt}`);
    lines.push("");
  }

  return lines.join("\n");
}
