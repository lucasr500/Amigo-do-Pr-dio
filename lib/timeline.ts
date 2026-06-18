// ─── Linha do tempo unificada (W1.2) ─────────────────────────────────────────
// Fonte ÚNICA: o store institucional persistido (community-timeline), que já
// recebe tanto eventos institucionais (decisão, assembleia, documento, comunicado)
// quanto operacionais (obra, manutenção, pendência concluída, backup) via emits.
// Esta camada classifica cada evento numa TRILHA e oferece leitura filtrada por
// trilha + papel — substituindo a necessidade de uma superfície "operacional"
// separada (TimelineOperacional era uma view derivada, sem store próprio).
//
// SEM PERDA: apenas lê/classifica o store existente; não cria nem apaga chave.

import { getTimeline } from "./community-timeline";
import type { TimelineEvent, TimelineEventType, CommunityRole } from "./community-types";
import { filterByVisibility } from "./community-permissions";

export type TimelineTrack = "institucional" | "operacional";

// Classificação determinística por tipo. Institucional = governança/publicação;
// operacional = atividade do dia a dia. `outro` cai em operacional.
export const TIMELINE_TYPE_TRACK: Record<TimelineEventType, TimelineTrack> = {
  documento_publicado:      "institucional",
  documento_renovado:       "institucional",
  aviso_publicado:          "institucional",
  assembleia_realizada:     "institucional",
  decisao_registrada:       "institucional",
  relatorio_emitido:        "institucional",
  mandato_atualizado:       "institucional",
  fornecedor_cadastrado:    "institucional",
  comunicado_registrado:    "institucional",
  enquete_criada:           "institucional",
  enquete_encerrada:        "institucional",
  obra_iniciada:            "operacional",
  obra_concluida:           "operacional",
  manutencao_realizada:     "operacional",
  solicitacao_aberta:       "operacional",
  solicitacao_resolvida:    "operacional",
  ocorrencia_registrada:    "operacional",
  revisao_mensal_concluida: "operacional",
  backup_exportado:         "operacional",
  pendencia_concluida:      "operacional",
  outro:                    "operacional",
};

export function trackOf(type: TimelineEventType): TimelineTrack {
  return TIMELINE_TYPE_TRACK[type] ?? "operacional";
}

export type UnifiedTimelineOptions = {
  track?: TimelineTrack;   // filtra por trilha; ausente = todas
  role?: CommunityRole;    // filtra por visibilidade do papel; ausente = sem filtro
};

/** Linha do tempo única, ordenada (mais recente primeiro), filtrada por trilha + papel. */
export function getUnifiedTimeline(opts: UnifiedTimelineOptions = {}): TimelineEvent[] {
  let events = [...getTimeline()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  if (opts.role) events = filterByVisibility(events, opts.role);
  if (opts.track) events = events.filter((e) => trackOf(e.type) === opts.track);
  return events;
}

/** Contagem por trilha (para chips de filtro), respeitando o papel. */
export function timelineTrackCounts(role?: CommunityRole): Record<TimelineTrack | "total", number> {
  const base = role ? filterByVisibility(getTimeline(), role) : getTimeline();
  let institucional = 0, operacional = 0;
  for (const e of base) (trackOf(e.type) === "institucional" ? institucional++ : operacional++);
  return { institucional, operacional, total: base.length };
}
