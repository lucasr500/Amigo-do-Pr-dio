// ─── Home do Morador (W5) ────────────────────────────────────────────────────
// Backbone de dados da experiência do morador: "o que está acontecendo no meu
// prédio?", composto SOMENTE de fontes já filtradas por papel — linha do tempo
// (W1.2), documentos (W1.1), transparência (W3) e enquetes consultivas. Tudo por
// view mode/role LOCAL — não é multi-usuário real (isso é pós-relacional). Respeita
// a Não-Exposição: o morador nunca vê dado de gestão.
//
// Read-only/derivação; sem storage novo, sem efeitos.

import { getUnifiedTimeline } from "./timeline";
import { getDocumentsForRole } from "./documents";
import { buildTransparencySummary } from "./transparency";
import { getActivePolls } from "./community-polls";
import { canSeeVisibility } from "./community-permissions";
import type { CommunityRole, TimelineEvent, Poll } from "./community-types";

export type ResidentFeedItem = {
  id: string;
  kind: "timeline" | "enquete" | "documento" | "transparencia";
  title: string;
  detail?: string;
  occurredAt?: string;
};

export type ResidentSummary = {
  headline: string;
  recent: TimelineEvent[];      // linha do tempo visível ao morador (mais recentes)
  polls: Poll[];                // enquetes consultivas abertas e visíveis
  documentsVisible: number;     // quantos documentos o morador pode consultar
  transparencyAvailable: boolean;
  hasActivity: boolean;
};

const RESIDENT: CommunityRole = "resident";

export function buildResidentSummary(role: CommunityRole = RESIDENT): ResidentSummary {
  const recent = getUnifiedTimeline({ role }).slice(0, 8);
  const polls = getActivePolls().filter((p) => canSeeVisibility(role, p.visibility));
  const documentsVisible = getDocumentsForRole(role).length;
  let transparencyAvailable = false;
  try { transparencyAvailable = buildTransparencySummary().hasData; } catch { /* local-first */ }

  const hasActivity = recent.length > 0 || polls.length > 0 || documentsVisible > 0 || transparencyAvailable;
  const headline = hasActivity
    ? "Veja o que está acontecendo no seu condomínio."
    : "Ainda não há novidades publicadas. Quando houver, aparecem aqui.";

  return { headline, recent, polls, documentsVisible, transparencyAvailable, hasActivity };
}
