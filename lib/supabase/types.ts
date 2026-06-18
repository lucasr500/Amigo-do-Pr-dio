// Tipos do banco Supabase — derivados das migrations 001–005.
// Nunca importar diretamente no bundle inicial; usar apenas dentro de funções async lazy-loaded.

export interface DbProfile {
  id: string;
  local_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAppSnapshot {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  version: number;
  device_hint: string | null;
  payload: unknown; // UserBackup serializado como JSONB
}

export interface DbNotification {
  id: string;
  user_id: string;
  created_at: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  source_module: string | null;
  action_key: string | null;
  read: boolean;
  dismissed: boolean;
  scheduled_for: string | null;
}

export interface DbHealthSnapshot {
  id: string;
  user_id: string;
  created_at: string;
  snapshot_date: string;
  percentage: number;
  status_key: string;
  factor_count: number;
  missing_count: number;
  partial_count: number;
}

export interface DbAuditEntry {
  id: string;
  user_id: string;
  created_at: string;
  category: string;
  action: string;
  detail: string | null;
  impact: string | null;
}

// ─── Multi-tenant (migration 005) ────────────────────────────────────────────

export type MembershipRole = "owner" | "manager" | "council" | "resident" | "viewer";
export type MembershipStatus = "active" | "invited" | "suspended" | "removed";

export interface DbCondominio {
  id: string;
  owner_id: string;
  nome: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface DbMembership {
  id: string;
  user_id: string;
  condominio_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

// Tabelas do schema público — formato esperado pelo @supabase/supabase-js v2.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: Omit<DbProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbProfile, "id">>;
        Relationships: [];
      };
      app_snapshots: {
        Row: DbAppSnapshot;
        Insert: Omit<DbAppSnapshot, "id" | "created_at">;
        Update: Partial<Omit<DbAppSnapshot, "id">>;
        Relationships: [];
      };
      notifications: {
        Row: DbNotification;
        Insert: Omit<DbNotification, "id" | "created_at">;
        Update: Partial<Omit<DbNotification, "id">>;
        Relationships: [];
      };
      health_snapshots: {
        Row: DbHealthSnapshot;
        Insert: Omit<DbHealthSnapshot, "id" | "created_at">;
        Update: Partial<Omit<DbHealthSnapshot, "id">>;
        Relationships: [];
      };
      audit_log: {
        Row: DbAuditEntry;
        Insert: Omit<DbAuditEntry, "id" | "created_at">;
        Update: Partial<Omit<DbAuditEntry, "id">>;
        Relationships: [];
      };
      condominios: {
        Row: DbCondominio;
        Insert: Omit<DbCondominio, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbCondominio, "id">>;
        Relationships: [];
      };
      memberships: {
        Row: DbMembership;
        Insert: Omit<DbMembership, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbMembership, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_condominio_member: {
        Args: { condominio_uuid: string };
        Returns: boolean;
      };
      has_condominio_role: {
        Args: { condominio_uuid: string; allowed_roles: string[] };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
