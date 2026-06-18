// ─── Timeline institucional — eventos do condomínio ──────────────────────────
import { KEYS, safeRead, safeWrite } from "./session-core";
import type {
  TimelineEvent, TimelineEventType, Visibility,
} from "./community-types";

export type { TimelineEvent };

const KEY = KEYS.COMMUNITY_TIMELINE;
const LEGACY_KEY = "amigo_community_timeline";
const RECENT_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTimeline(): TimelineEvent[] {
  const current = safeRead<TimelineEvent[]>(KEY, []);
  if (current.length > 0 || KEY === LEGACY_KEY) return current;

  const legacy = safeRead<TimelineEvent[]>(LEGACY_KEY, []);
  if (legacy.length > 0) {
    saveTimeline(legacy);
    return legacy;
  }
  return current;
}

export function saveTimeline(events: TimelineEvent[]): void {
  safeWrite(KEY, events);
}

export function addTimelineEvent(
  data: Omit<TimelineEvent, "id" | "createdAt">
): TimelineEvent {
  const ev: TimelineEvent = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
  };
  const existing = getTimeline();
  safeWrite(KEY, [ev, ...existing].slice(0, 1000));
  return ev;
}

function hasRecentSimilarEvent(
  type: TimelineEventType,
  sourceModule: string,
  match: (event: TimelineEvent) => boolean,
  windowMs = RECENT_DEDUPE_WINDOW_MS
): boolean {
  const now = Date.now();
  return getTimeline().some((event) => {
    if (event.type !== type || event.sourceModule !== sourceModule) return false;
    if (!match(event)) return false;
    const created = new Date(event.createdAt || event.occurredAt).getTime();
    if (!Number.isFinite(created)) return true;
    return now - created <= windowMs;
  });
}

function addTimelineEventOnce(
  data: Omit<TimelineEvent, "id" | "createdAt">,
  match: (event: TimelineEvent) => boolean,
  windowMs?: number
): TimelineEvent | null {
  if (hasRecentSimilarEvent(data.type, data.sourceModule ?? "", match, windowMs)) return null;
  return addTimelineEvent(data);
}

export function deleteTimelineEvent(id: string): void {
  saveTimeline(getTimeline().filter((e) => e.id !== id));
}

// ─── Auto-geração de eventos por módulo ──────────────────────────────────────

// visibility defaults to "moradores" — pass post.visibility to reflect actual access level.
// Posts with gestao visibility do NOT emit public timeline events (no leakage).
export function emitPostPublished(
  postId: string,
  title: string,
  category: string,
  visibility: Visibility = "moradores"
): void {
  addTimelineEvent({
    type: "aviso_publicado",
    title: `Aviso publicado: ${title}`,
    description: `Categoria: ${category}`,
    visibility,
    sourceModule: "mural",
    sourceId: postId,
    relatedPostId: postId,
    occurredAt: new Date().toISOString(),
    metadata: { category },
  });
}

export function emitRequestOpened(requestId: string, title: string, unit?: string): void {
  addTimelineEvent({
    type: "solicitacao_aberta",
    title: `Solicitação aberta: ${title}`,
    description: unit ? `Unidade ${unit}` : undefined,
    visibility: "gestao",
    sourceModule: "requests",
    sourceId: requestId,
    relatedRequestId: requestId,
    occurredAt: new Date().toISOString(),
  });
}

export function emitRequestResolved(requestId: string, title: string): void {
  addTimelineEvent({
    type: "solicitacao_resolvida",
    title: `Solicitação resolvida: ${title}`,
    visibility: "moradores",
    sourceModule: "requests",
    sourceId: requestId,
    relatedRequestId: requestId,
    occurredAt: new Date().toISOString(),
  });
}

export function emitPollCreated(pollId: string, title: string): void {
  addTimelineEvent({
    type: "enquete_criada",
    title: `Enquete consultiva criada: ${title}`,
    visibility: "moradores",
    sourceModule: "polls",
    sourceId: pollId,
    relatedPollId: pollId,
    occurredAt: new Date().toISOString(),
  });
}

export function emitPollClosed(pollId: string, title: string): void {
  addTimelineEvent({
    type: "enquete_encerrada",
    title: `Enquete encerrada: ${title}`,
    visibility: "moradores",
    sourceModule: "polls",
    sourceId: pollId,
    relatedPollId: pollId,
    occurredAt: new Date().toISOString(),
  });
}

export function emitWorkNoticeRegistered(requestId: string, unit: string, title: string): void {
  addTimelineEventOnce({
    type: "outro",
    title: `Aviso de obra registrado — Unidade ${unit}`,
    description: title,
    visibility: "moradores",
    sourceModule: "requests",
    sourceId: requestId,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === requestId);
}

export function emitReservationApproved(reservationId: string, space: string, unit: string): void {
  addTimelineEvent({
    type: "outro",
    title: `Reserva aprovada: ${space}`,
    description: `Unidade ${unit}`,
    visibility: "moradores",
    sourceModule: "reservas",
    sourceId: reservationId,
    occurredAt: new Date().toISOString(),
  });
}

export function emitReservationCancelled(reservationId: string, space: string, unit: string): void {
  addTimelineEvent({
    type: "outro",
    title: `Reserva cancelada: ${space}`,
    description: `Unidade ${unit}`,
    visibility: "gestao",
    sourceModule: "reservas",
    sourceId: reservationId,
    occurredAt: new Date().toISOString(),
  });
}

// visibility defaults to "moradores" — pass doc.visibility to reflect actual access level.
export function emitDocumentPublished(
  docId: string,
  title: string,
  visibility: Visibility = "moradores"
): void {
  addTimelineEvent({
    type: "documento_publicado",
    title: `Documento publicado: ${title}`,
    visibility,
    sourceModule: "documents",
    sourceId: docId,
    relatedDocumentId: docId,
    occurredAt: new Date().toISOString(),
  });
}

// ─── Emit operacionais — módulos internos do produto ─────────────────────────

// Assembleia realizada — fecha o ramo "lembrar" do loop da Assembleia.
// Visivel a moradores: o registro de que a assembleia aconteceu e institucional.
export function emitAssembleiaRealizada(
  assemblyId: string,
  titulo: string,
  itensDecididos?: number
): void {
  addTimelineEventOnce({
    type: "assembleia_realizada",
    title: `Assembleia realizada: ${titulo}`,
    description:
      typeof itensDecididos === "number"
        ? `${itensDecididos} item${itensDecididos !== 1 ? "s" : ""} de pauta deliberado${itensDecididos !== 1 ? "s" : ""}`
        : undefined,
    visibility: "moradores",
    sourceModule: "assembleias",
    sourceId: assemblyId,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === assemblyId, 24 * 60 * 60 * 1000);
}

export function emitDecisionRegistered(decisionId: string, title: string, categoryLabel: string): void {
  addTimelineEventOnce({
    type: "decisao_registrada",
    title: `Decisão registrada: ${title}`,
    description: `Categoria: ${categoryLabel}`,
    visibility: "gestao",
    sourceModule: "decisions",
    sourceId: decisionId,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === decisionId);
}

export function emitDecisionStatusChanged(
  decisionId: string,
  title: string,
  statusLabel: string
): void {
  addTimelineEventOnce({
    type: "decisao_registrada",
    title: `Decisão atualizada: ${title}`,
    description: `Status: ${statusLabel}`,
    visibility: "gestao",
    sourceModule: "decisions",
    sourceId: decisionId,
    occurredAt: new Date().toISOString(),
    metadata: { status: statusLabel },
  }, (event) => event.sourceId === decisionId && event.description === `Status: ${statusLabel}`, 24 * 60 * 60 * 1000);
}

export function emitPendenciaCompleted(pendenciaId: string, title: string): void {
  addTimelineEventOnce({
    type: "pendencia_concluida",
    title: `Pendência concluída: ${title}`,
    description: "A pendência foi marcada como concluída e registrada na memória institucional do condomínio.",
    visibility: "gestao",
    sourceModule: "pendencias",
    sourceId: pendenciaId,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === pendenciaId, Number.POSITIVE_INFINITY);
}

export function emitDocumentRenewed(docId: string, label: string, dataVencimento?: string): void {
  addTimelineEventOnce({
    type: "documento_renovado",
    title: `Documento renovado: ${label}`,
    description: dataVencimento
      ? `Vencimento atualizado para ${dataVencimento}.`
      : "O vencimento do documento foi atualizado e registrado na memória institucional.",
    visibility: "gestao",
    sourceModule: "documentos",
    sourceId: docId,
    relatedDocumentId: docId,
    occurredAt: new Date().toISOString(),
    metadata: dataVencimento ? { dataVencimento } : undefined,
  }, (event) =>
    event.sourceId === docId &&
    (dataVencimento ? event.metadata?.dataVencimento === dataVencimento : event.title === `Documento renovado: ${label}`),
  Number.POSITIVE_INFINITY);
}

export function emitSupplierRegistered(supplierId: string, name: string, categoryLabel: string): void {
  addTimelineEventOnce({
    type: "fornecedor_cadastrado",
    title: `Fornecedor cadastrado: ${name}`,
    description: `Categoria: ${categoryLabel}`,
    visibility: "gestao",
    sourceModule: "suppliers",
    sourceId: supplierId,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === supplierId);
}

export function emitComunicadoRegistered(templateId: string, title: string): void {
  addTimelineEventOnce({
    type: "comunicado_registrado",
    title: `Comunicado registrado: ${title}`,
    visibility: "moradores",
    sourceModule: "comunicados",
    sourceId: templateId,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === templateId);
}

export function emitMonthlyReviewCompleted(month: string, score: number): void {
  const monthFormatted = new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  addTimelineEventOnce({
    type: "revisao_mensal_concluida",
    title: `Revisão mensal concluída — ${monthFormatted}`,
    description: `Score: ${score}/100`,
    visibility: "gestao",
    sourceModule: "monthly-review",
    sourceId: month,
    occurredAt: new Date().toISOString(),
  }, (event) => event.sourceId === month);
}

export function emitBackupExported(): void {
  addTimelineEventOnce({
    type: "backup_exportado",
    title: "Backup exportado",
    description: "Dados do condomínio exportados com sucesso.",
    visibility: "gestao",
    sourceModule: "backup",
    occurredAt: new Date().toISOString(),
  }, (event) => event.type === "backup_exportado");
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export function filterTimeline(
  events: TimelineEvent[],
  opts: {
    visibility?: Visibility;
    type?: TimelineEventType;
    since?: string;
    until?: string;
    sourceModule?: string;
  }
): TimelineEvent[] {
  return events
    .filter((e) => {
      if (opts.visibility && e.visibility !== opts.visibility) return false;
      if (opts.type && e.type !== opts.type) return false;
      if (opts.since && e.occurredAt < opts.since) return false;
      if (opts.until && e.occurredAt > opts.until) return false;
      if (opts.sourceModule && e.sourceModule !== opts.sourceModule) return false;
      return true;
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

// ─── Relatório copiável ───────────────────────────────────────────────────────

export function buildTimelineReport(events: TimelineEvent[], title = "Timeline Institucional"): string {
  const lines = [
    title.toUpperCase(),
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
    "",
    ...events.slice(0, 50).map((e) => {
      const date = new Date(e.occurredAt).toLocaleDateString("pt-BR");
      return `• ${date} — ${e.title}${e.description ? ` (${e.description})` : ""}`;
    }),
  ];
  return lines.join("\n");
}

// ─── Seed de exemplo ──────────────────────────────────────────────────────────

export function seedDemoTimeline(): void {
  if (getTimeline().length > 0) return;
  const d = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 86400000).toISOString();

  const events: Omit<TimelineEvent, "id" | "createdAt">[] = [
    {
      type: "aviso_publicado",
      title: "Aviso publicado: Manutenção da bomba d'água",
      visibility: "moradores",
      sourceModule: "mural",
      occurredAt: d(0),
    },
    {
      type: "solicitacao_aberta",
      title: "Solicitação aberta: Barulho excessivo — Unidade 302",
      visibility: "gestao",
      sourceModule: "requests",
      occurredAt: d(3),
    },
    {
      type: "solicitacao_resolvida",
      title: "Solicitação resolvida: Lâmpada queimada no corredor",
      visibility: "moradores",
      sourceModule: "requests",
      occurredAt: d(2),
    },
    {
      type: "documento_publicado",
      title: "Documento publicado: Ata da AGO — Março 2025",
      visibility: "moradores",
      sourceModule: "documents",
      occurredAt: d(5),
    },
    {
      type: "enquete_criada",
      title: "Enquete consultiva criada: Melhor horário para manutenção",
      visibility: "moradores",
      sourceModule: "polls",
      occurredAt: d(1),
    },
    {
      type: "manutencao_realizada",
      title: "Manutenção realizada: Dedetização geral",
      visibility: "moradores",
      sourceModule: "operacao",
      occurredAt: d(10),
    },
    {
      type: "assembleia_realizada",
      title: "AGO realizada — Aprovação do orçamento anual",
      visibility: "moradores",
      occurredAt: d(30),
    },
  ];

  const now = new Date().toISOString();
  const built: TimelineEvent[] = events.map((e, i) => ({
    ...e,
    id: `tl-demo-${i}`,
    createdAt: now,
  }));
  saveTimeline(built);
}
