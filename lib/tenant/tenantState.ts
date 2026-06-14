// Lógica pura do contexto de tenant — sem React, sem localStorage, sem rede.
// Mantida separada do TenantContext.tsx para ser testável em Node e para deixar
// o provider fino. Decide o que fazer quando o estado de autenticação muda e
// traduz o resultado da ativação do condomínio num snapshot de UI.

import type { Condominio, MembershipRole, TenantResult } from "./types";

export type TenantStatus =
  | "loading"   // resolvendo (auth carregando ou ativação em andamento)
  | "guest"     // sem login — app roda local-first, sem condomínio remoto
  | "ready"     // condomínio ativo carregado, com papel resolvido
  | "error"     // ativação falhou (ex.: Supabase não configurado) — app segue local-first
  | "disabled"; // flag tenant_enabled desligada

export interface TenantSnapshot {
  status: TenantStatus;
  condominioId: string | null;
  condominio: Condominio | null;
  role: MembershipRole | null;
  error: string | null;
}

export const INITIAL_TENANT: TenantSnapshot = {
  status: "loading",
  condominioId: null,
  condominio: null,
  role: null,
  error: null,
};

export const GUEST_TENANT: TenantSnapshot = {
  status: "guest",
  condominioId: null,
  condominio: null,
  role: null,
  error: null,
};

export const DISABLED_TENANT: TenantSnapshot = {
  status: "disabled",
  condominioId: null,
  condominio: null,
  role: null,
  error: null,
};

// O que o provider deve fazer dado o estado de auth + flag.
export type TenantAction =
  | "activate"  // autenticado → garantir/ criar condomínio e carregar contexto
  | "guest"     // anônimo → limpar contexto e operar local-first
  | "disabled"  // flag desligada → não tocar em nada
  | "wait";     // auth ainda carregando → aguardar

export function decideTenantAction(input: {
  authMode: "guest" | "authenticated" | "loading";
  tenantEnabled: boolean;
}): TenantAction {
  if (!input.tenantEnabled) return "disabled";
  if (input.authMode === "loading") return "wait";
  if (input.authMode === "authenticated") return "activate";
  return "guest";
}

// Traduz o resultado de ensureDefaultCondominioForUser num snapshot.
// Falha NUNCA quebra o app: vira status "error" com papel null, e a UI degrada
// para local-first (canManage(null) = false).
export function tenantSnapshotFromResult(result: TenantResult): TenantSnapshot {
  if (result.ok) {
    return {
      status: "ready",
      condominioId: result.context.condominioId,
      condominio: result.context.condominio,
      role: result.context.role,
      error: null,
    };
  }
  return {
    status: "error",
    condominioId: null,
    condominio: null,
    role: null,
    error: result.error,
  };
}
