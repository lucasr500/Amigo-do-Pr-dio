export type {
  MembershipRole,
  MembershipStatus,
  Condominio,
  Membership,
  TenantContext,
  TenantResult,
} from "./types";

export { MANAGEMENT_ROLES, ELEVATED_ROLES } from "./types";

export {
  getActiveCondominioId,
  setActiveCondominioId,
  clearActiveCondominioId,
  listUserCondominios,
  getMembership,
  ensureDefaultCondominioForUser,
} from "./tenantClient";

export type { EnsureCondominioOptions } from "./tenantClient";

export {
  canManage,
  hasElevatedAccess,
  canAccessFeature,
  resolveEffectiveRole,
} from "./effectiveRole";

export type { TenantFeature } from "./effectiveRole";

export {
  runTenantBootstrap,
  resetTenantBootstrap,
  tenantStatusLabel,
  TENANT_IDLE,
  TENANT_LOADING,
} from "./bootstrap";

export type {
  TenantState,
  TenantStatus,
  TenantStatusLabel,
  TenantBootstrapDeps,
} from "./bootstrap";
