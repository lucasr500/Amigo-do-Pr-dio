// Resolução de role efetivo — determina capacidades do usuário no condomínio.
// Baseado na membership ativa; nunca usa localStorage direto.

import type { MembershipRole } from "./types";
import { MANAGEMENT_ROLES, ELEVATED_ROLES } from "./types";

// ─── Resolução por role ───────────────────────────────────────────────────────

export function canManage(role: MembershipRole | null | undefined): boolean {
  if (!role) return false;
  return MANAGEMENT_ROLES.includes(role);
}

export function hasElevatedAccess(role: MembershipRole | null | undefined): boolean {
  if (!role) return false;
  return ELEVATED_ROLES.includes(role);
}

// ─── Feature flags por role ───────────────────────────────────────────────────

export type TenantFeature =
  | "manage_members"
  | "manage_documents"
  | "manage_financial"
  | "manage_agenda"
  | "view_reports"
  | "manage_settings"
  | "invite_members"
  | "read_only";

const ROLE_FEATURES: Record<MembershipRole, TenantFeature[]> = {
  owner: [
    "manage_members",
    "manage_documents",
    "manage_financial",
    "manage_agenda",
    "view_reports",
    "manage_settings",
    "invite_members",
  ],
  manager: [
    "manage_members",
    "manage_documents",
    "manage_financial",
    "manage_agenda",
    "view_reports",
    "manage_settings",
    "invite_members",
  ],
  council: [
    "manage_documents",
    "manage_agenda",
    "view_reports",
    "invite_members",
  ],
  resident: [
    "view_reports",
  ],
  viewer: [
    "read_only",
  ],
};

export function canAccessFeature(
  role: MembershipRole | null | undefined,
  feature: TenantFeature
): boolean {
  if (!role) return false;
  return ROLE_FEATURES[role]?.includes(feature) ?? false;
}

/**
 * Resolve o role efetivo a partir de uma membership.
 * Retorna null se o usuário não tiver membership ativa no condomínio.
 * O app continua funcionando em guest/local-first mesmo sem role.
 */
export function resolveEffectiveRole(
  membership: { role: MembershipRole; status: string } | null | undefined
): MembershipRole | null {
  if (!membership || membership.status !== "active") return null;
  return membership.role;
}
