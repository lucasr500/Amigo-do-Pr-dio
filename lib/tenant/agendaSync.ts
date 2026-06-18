// Cutover de LEITURA da Agenda — deliberado e reversível (espelha decisionsSync).
// Puxa os eventos remotos do condomínio ativo, faz merge com o store local e grava
// localmente. A UI segue lendo getAgendaEvents() — um único caminho de leitura.
//
// SEGURANÇA (invariante): com `agenda_remote_enabled` off OU anônimo OU sem condomínio,
// é NO-OP TOTAL — store local intocado, byte-a-byte idêntico ao atual.
//
// A tabela agenda_events já existe (migration 006); push/merge já existem
// (agendaRemote.ts / agendaMerge.ts). Esta fatia fia apenas o PULL.

import { isEnabled } from "@/lib/feature-flags";
import { getAgendaEvents, saveAgendaEvents } from "@/lib/session-agenda";
import { listRemoteAgenda } from "@/lib/tenant/agendaRemote";
import { mergeAgendaEvents } from "@/lib/tenant/agendaMerge";

export type PullResult = { merged: boolean; remoteCount: number };

/**
 * Cutover de leitura: merge remoto→local, preservando local-first como fallback.
 * No-op (sem tocar o store) com off / anônimo / sem condomínio / remoto vazio.
 * Best-effort: nunca lança.
 */
export async function pullRemoteAgenda(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("agenda_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemoteAgenda();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getAgendaEvents();
    const merged = mergeAgendaEvents(local, remote);
    saveAgendaEvents(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    return { merged: false, remoteCount: 0 };
  }
}
