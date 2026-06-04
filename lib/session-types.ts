// ─── Tipos primitivos compartilhados ──────────────────────────────────────────
// Tipos usados por múltiplos módulos de domínio (documentos, memória, manutenções).
// Não importar de session.ts ou de módulos de domínio — apenas primitivos puros.

export type DatePrecision = "exact" | "month" | "year" | "unknown" | "not_applicable";

export type AssistedDateField = {
  value?: string;       // YYYY-MM-DD (exact), YYYY-MM (month), YYYY (year)
  precision: DatePrecision;
  status: "filled" | "estimated" | "unknown" | "to_discover" | "not_applicable";
  notes?: string;
  updatedAt: string;    // ISO
};

export type ManutencaoFrequencia =
  | "mensal" | "bimestral" | "trimestral" | "semestral" | "anual" | "sob_demanda";
