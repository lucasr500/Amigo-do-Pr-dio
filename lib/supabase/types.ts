// Tipos do banco Supabase — derivados das migrations 001 e 002.
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
