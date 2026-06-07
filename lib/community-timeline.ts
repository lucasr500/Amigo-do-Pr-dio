// ─── Timeline institucional — eventos do condomínio ──────────────────────────
import { safeRead, safeWrite } from "./session-core";
import type {
  TimelineEvent, TimelineEventType, Visibility,
} from "./community-types";

export type { TimelineEvent };

const KEY = "amigo_community_timeline";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTimeline(): TimelineEvent[] {
  return safeRead<TimelineEvent[]>(KEY, []);
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

export function deleteTimelineEvent(id: string): void {
  saveTimeline(getTimeline().filter((e) => e.id !== id));
}

// ─── Auto-geração de eventos por módulo ──────────────────────────────────────

export function emitPostPublished(postId: string, title: string, category: string): void {
  addTimelineEvent({
    type: "aviso_publicado",
    title: `Aviso publicado: ${title}`,
    description: `Categoria: ${category}`,
    visibility: "moradores",
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

export function emitDocumentPublished(docId: string, title: string): void {
  addTimelineEvent({
    type: "documento_publicado",
    title: `Documento publicado: ${title}`,
    visibility: "moradores",
    sourceModule: "documents",
    sourceId: docId,
    relatedDocumentId: docId,
    occurredAt: new Date().toISOString(),
  });
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
