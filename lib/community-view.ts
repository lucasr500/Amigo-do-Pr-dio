// ─── Resolução de papel da Comunidade a partir do perfil de login ────────────
// Regra anti-leak (QA opção A): o MORADOR (activeProfile=resident) é TRAVADO em
// visão de morador — nunca vê a camada de gestão por default nem pode simular
// gestão. Só o SÍNDICO usa o view-mode (preview da experiência do morador).
// O enforcement real (multi-usuário) é pós-relacional; esta função garante que o
// perfil de login não vaze conteúdo de gestão na UI atual (local/single-user).

import { getViewMode } from "./community-permissions";
import type { CommunityRole } from "./community-types";

export type LoginProfile = "manager" | "resident";

export function resolveCommunityRole(profile: LoginProfile): CommunityRole {
  if (profile === "resident") return "resident"; // travado — sem leak
  return getViewMode();                            // síndico pode simular papéis
}

export function canSimulateRole(profile: LoginProfile): boolean {
  return profile === "manager";
}
