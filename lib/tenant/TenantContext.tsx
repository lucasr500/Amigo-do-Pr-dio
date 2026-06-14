"use client";

// Contexto de tenant — ativa a fundação multi-tenant (dormente até aqui).
// Ao autenticar, garante/cria o condomínio do usuário (ensureDefaultCondominioForUser),
// expõe o condomínio ativo e o papel (role) para a árvore React e persiste o ativo.
// Modo guest permanece local-first: sem login, nenhum condomínio remoto é tocado.
//
// Esta é a "ignição" que liga o relacional. É pré-requisito de qualquer migração
// de módulo para o modelo por condomínio (Agenda, financeiro, etc.).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isEnabled } from "@/lib/feature-flags";
import { getProfile } from "@/lib/session";
import { clearActiveCondominioId } from "@/lib/tenant/tenantClient";
import { canManage, hasElevatedAccess } from "@/lib/tenant/effectiveRole";
import {
  decideTenantAction,
  tenantSnapshotFromResult,
  INITIAL_TENANT,
  GUEST_TENANT,
  DISABLED_TENANT,
  type TenantSnapshot,
} from "@/lib/tenant/tenantState";
import type { MembershipRole } from "@/lib/tenant/types";

export interface TenantState extends TenantSnapshot {
  /** true quando há condomínio ativo carregado com papel resolvido. */
  isReady: boolean;
  /** Capacidade de gestão derivada do papel (owner/manager). */
  canManage: boolean;
  /** Acesso elevado derivado do papel (owner/manager/council). */
  hasElevatedAccess: boolean;
  /** Reexecuta a ativação (ex.: após criar/entrar em outro condomínio). */
  refresh: () => void;
}

const TenantCtx = createContext<TenantState | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { mode, user } = useAuth();
  const [snap, setSnap] = useState<TenantSnapshot>(INITIAL_TENANT);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // userId estável: só é string quando autenticado de fato.
  const userId = user && user.type === "authenticated" ? user.id : null;

  useEffect(() => {
    let cancelled = false;

    const action = decideTenantAction({
      authMode: mode,
      tenantEnabled: isEnabled("tenant_enabled"),
    });

    if (action === "disabled") {
      setSnap(DISABLED_TENANT);
      return;
    }
    if (action === "wait") {
      setSnap(INITIAL_TENANT);
      return;
    }
    if (action === "guest" || !userId) {
      clearActiveCondominioId();
      setSnap(GUEST_TENANT);
      return;
    }

    // action === "activate"
    setSnap(INITIAL_TENANT); // estado de loading enquanto resolve

    (async () => {
      try {
        const { ensureDefaultCondominioForUser } = await import(
          "@/lib/tenant/tenantClient"
        );
        let nomeSugerido: string | undefined;
        try {
          nomeSugerido = getProfile()?.nomeCondominio;
        } catch {
          nomeSugerido = undefined;
        }
        const result = await ensureDefaultCondominioForUser({
          userId,
          nomeSugerido,
        });
        if (cancelled) return;
        setSnap(tenantSnapshotFromResult(result));
      } catch (e) {
        if (cancelled) return;
        setSnap({
          status: "error",
          condominioId: null,
          condominio: null,
          role: null,
          error: e instanceof Error ? e.message : "Erro ao ativar condomínio.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, userId, nonce]);

  const value: TenantState = {
    ...snap,
    isReady: snap.status === "ready",
    canManage: canManage(snap.role),
    hasElevatedAccess: hasElevatedAccess(snap.role),
    refresh,
  };

  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export function useTenant(): TenantState {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
}

/** Atalho para o papel efetivo do usuário no condomínio ativo (ou null). */
export function useTenantRole(): MembershipRole | null {
  return useTenant().role;
}
