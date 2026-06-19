// Tipos da camada de tenant — Amigo do Prédio.
// Importados pelo tenantClient e pelos helpers de permissão efetiva.

// staff = "Funcionário/Zelador" — baixo privilégio institucional, escrita restrita ao escopo
// operacional (ordens atribuídas a si). Aditivo: não altera os papéis existentes nem a RLS provada.
export type MembershipRole = "owner" | "manager" | "council" | "resident" | "viewer" | "staff";
export type MembershipStatus = "active" | "invited" | "suspended" | "removed";

export interface Condominio {
  id: string;
  nome: string;
  slug: string | null;
  ownerId: string;
  archivedAt: string | null;
}

export interface Membership {
  id: string;
  userId: string;
  condominioId: string;
  role: MembershipRole;
  status: MembershipStatus;
}

export interface TenantContext {
  condominioId: string;
  condominio: Condominio;
  membership: Membership;
  role: MembershipRole;
}

export type TenantResult =
  | { ok: true; context: TenantContext }
  | { ok: false; error: string };

// Roles que têm capacidade de gestão.
export const MANAGEMENT_ROLES: MembershipRole[] = ["owner", "manager"];

// Roles que têm acesso de leitura estendida.
export const ELEVATED_ROLES: MembershipRole[] = ["owner", "manager", "council"];
