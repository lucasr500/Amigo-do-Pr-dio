// ─── Sistema de permissões — Central Digital do Condomínio ────────────────────
// Centraliza TODAS as verificações de permissão.
// Nenhum componente deve ter lógica de permissão espalhada em ifs soltos.

import type { CommunityRole, Visibility } from "./community-types";

// ─── Mapa de capacidades por papel ────────────────────────────────────────────

type Permissions = {
  canCreatePost: boolean;
  canEditPost: boolean;
  canArchivePost: boolean;
  canPinPost: boolean;
  canModerateComments: boolean;
  canCreatePoll: boolean;
  canClosePoll: boolean;
  canVoteInPoll: boolean;
  canCreateRequest: boolean;
  canUpdateRequestStatus: boolean;
  canViewAllRequests: boolean;
  canPublishDocument: boolean;
  canCreateTimelineEvent: boolean;
  canViewPrivateTimeline: boolean;
  canViewFinancialData: boolean;
  canViewInternalDocuments: boolean;
  canSwitchViewMode: boolean;
  canExportReport: boolean;
};

const PERMISSIONS_MAP: Record<CommunityRole, Permissions> = {
  manager: {
    canCreatePost: true,
    canEditPost: true,
    canArchivePost: true,
    canPinPost: true,
    canModerateComments: true,
    canCreatePoll: true,
    canClosePoll: true,
    canVoteInPoll: true,
    canCreateRequest: true,
    canUpdateRequestStatus: true,
    canViewAllRequests: true,
    canPublishDocument: true,
    canCreateTimelineEvent: true,
    canViewPrivateTimeline: true,
    canViewFinancialData: true,
    canViewInternalDocuments: true,
    canSwitchViewMode: true,
    canExportReport: true,
  },
  council: {
    canCreatePost: false,
    canEditPost: false,
    canArchivePost: false,
    canPinPost: false,
    canModerateComments: false,
    canCreatePoll: false,
    canClosePoll: false,
    canVoteInPoll: true,
    canCreateRequest: true,
    canUpdateRequestStatus: false,
    canViewAllRequests: true,
    canPublishDocument: false,
    canCreateTimelineEvent: false,
    canViewPrivateTimeline: false,
    canViewFinancialData: false,
    canViewInternalDocuments: false,
    canSwitchViewMode: false,
    canExportReport: false,
  },
  resident: {
    canCreatePost: false,
    canEditPost: false,
    canArchivePost: false,
    canPinPost: false,
    canModerateComments: false,
    canCreatePoll: false,
    canClosePoll: false,
    canVoteInPoll: true,
    canCreateRequest: true,
    canUpdateRequestStatus: false,
    canViewAllRequests: false,
    canPublishDocument: false,
    canCreateTimelineEvent: false,
    canViewPrivateTimeline: false,
    canViewFinancialData: false,
    canViewInternalDocuments: false,
    canSwitchViewMode: false,
    canExportReport: false,
  },
  viewer: {
    canCreatePost: false,
    canEditPost: false,
    canArchivePost: false,
    canPinPost: false,
    canModerateComments: false,
    canCreatePoll: false,
    canClosePoll: false,
    canVoteInPoll: false,
    canCreateRequest: false,
    canUpdateRequestStatus: false,
    canViewAllRequests: false,
    canPublishDocument: false,
    canCreateTimelineEvent: false,
    canViewPrivateTimeline: false,
    canViewFinancialData: false,
    canViewInternalDocuments: false,
    canSwitchViewMode: false,
    canExportReport: false,
  },
};

// ─── API pública de verificação ───────────────────────────────────────────────

export function can(role: CommunityRole, permission: keyof Permissions): boolean {
  return PERMISSIONS_MAP[role][permission];
}

export function getPermissions(role: CommunityRole): Permissions {
  return PERMISSIONS_MAP[role];
}

// ─── Controle de visibilidade de conteúdo ────────────────────────────────────
// Determina se um papel pode VER um item com dada visibilidade.

const VISIBILITY_RANK: Record<Visibility, number> = {
  gestao:    0,
  conselho:  1,
  moradores: 2,
  publico:   3,
};

const ROLE_VISIBILITY_CLEARANCE: Record<CommunityRole, number> = {
  manager:  0,  // vê tudo (rank ≥ 0)
  council:  1,  // vê conselho, moradores, público
  resident: 2,  // vê moradores e público
  viewer:   3,  // só público
};

export function canSeeVisibility(role: CommunityRole, visibility: Visibility): boolean {
  return VISIBILITY_RANK[visibility] >= ROLE_VISIBILITY_CLEARANCE[role];
}

// ─── Filtro de coleções por visibilidade ──────────────────────────────────────
// Filtra array de objetos com campo `visibility` pelo papel atual.

export function filterByVisibility<T extends { visibility: Visibility }>(
  items: T[],
  role: CommunityRole
): T[] {
  return items.filter((item) => canSeeVisibility(role, item.visibility));
}

// ─── View mode persistido em localStorage ─────────────────────────────────────

import { VIEW_MODE_KEY, type ViewMode } from "./community-types";

export function getViewMode(): ViewMode {
  if (typeof window === "undefined") return "manager";
  try {
    const raw = localStorage.getItem(VIEW_MODE_KEY);
    if (raw === "manager" || raw === "council" || raw === "resident" || raw === "viewer") {
      return raw as ViewMode;
    }
  } catch { /* empty */ }
  return "manager";
}

export function setViewMode(mode: ViewMode): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* empty */ }
}
