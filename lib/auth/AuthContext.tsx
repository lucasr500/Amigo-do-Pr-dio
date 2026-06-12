"use client";

// Contexto de autenticação — suporta guest mode e magic link.
// O app funciona 100% sem login (modo guest).
//
// Sessão válida também dispara o tenant bootstrap (lib/tenant/bootstrap):
// garante condomínio padrão + membership owner/active e expõe o estado em
// `tenant`. Falha de tenant NUNCA bloqueia o auth nem o app — o produto
// continua local-first e o estado vira "error" com mensagem amigável.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { isEnabled } from "@/lib/feature-flags";
import { TENANT_IDLE, TENANT_LOADING, type TenantState } from "@/lib/tenant/bootstrap";

export type AuthMode = "guest" | "authenticated" | "loading";

export type GuestUser = {
  type: "guest";
  localId: string;
};

export type AuthenticatedUser = {
  type: "authenticated";
  id: string;
  email: string | null;
};

export type AppUser = GuestUser | AuthenticatedUser;

export type AuthState = {
  mode: AuthMode;
  user: AppUser | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  tenant: TenantState;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

function getOrCreateLocalId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    const key = "amigo_local_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const newId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, newId);
    return newId;
  } catch {
    return "guest";
  }
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("loading");
  const [user, setUser] = useState<AppUser | null>(null);
  const [tenant, setTenant] = useState<TenantState>(TENANT_IDLE);

  // userId já bootstrapado nesta instância — evita re-rodar o bootstrap a cada
  // evento de auth (TOKEN_REFRESHED dispara onAuthStateChange a cada renovação).
  const bootstrappedFor = useRef<string | null>(null);

  const bootstrapTenant = useCallback((userId: string) => {
    if (bootstrappedFor.current === userId) return;
    bootstrappedFor.current = userId;
    setTenant(TENANT_LOADING);
    void (async () => {
      try {
        const { runTenantBootstrap } = await import("@/lib/tenant/bootstrap");
        const state = await runTenantBootstrap(userId);
        setTenant(state);
        // Em erro, libera para retry no próximo evento de auth (ex.: rede voltou).
        if (state.status === "error") bootstrappedFor.current = null;
      } catch {
        setTenant({
          status: "error",
          condominioId: null,
          condominioNome: null,
          errorMessage:
            "Não foi possível carregar o condomínio agora. Seus dados locais continuam disponíveis.",
        });
        bootstrappedFor.current = null;
      }
    })();
  }, []);

  const applyGuest = useCallback(() => {
    setUser({ type: "guest", localId: getOrCreateLocalId() });
    setMode("guest");
    setTenant(TENANT_IDLE);
    bootstrappedFor.current = null;
  }, []);

  useEffect(() => {
    if (!isEnabled("auth_enabled")) {
      applyGuest();
      return;
    }

    let cleanup: (() => void) | null = null;

    (async () => {
      const { getSession, onAuthStateChange } = await import("@/lib/auth/authClient");

      // Verifica sessão existente
      const existing = await getSession();
      if (existing) {
        setUser({ type: "authenticated", id: existing.user.id, email: existing.user.email });
        setMode("authenticated");
        const { enableSyncOnAuth } = await import("@/lib/feature-flags");
        enableSyncOnAuth();
        bootstrapTenant(existing.user.id);
      } else {
        applyGuest();
      }

      // Ouve mudanças futuras
      cleanup = await onAuthStateChange(async (session) => {
        if (session) {
          const localId = getOrCreateLocalId();
          setUser({ type: "authenticated", id: session.user.id, email: session.user.email });
          setMode("authenticated");
          // Ativa sync para usuários autenticados que ainda não tomaram decisão explícita
          const { enableSyncOnAuth } = await import("@/lib/feature-flags");
          enableSyncOnAuth();
          // Garante condomínio padrão + membership (idempotente, dedupe interno)
          bootstrapTenant(session.user.id);
          // Vincula local_id ao auth.uid() em background (idempotente)
          const { claimLocalId } = await import("@/lib/auth/profileLinking");
          claimLocalId(session.user.id, localId).catch(() => {});
        } else {
          applyGuest();
        }
      });
    })();

    return () => { cleanup?.(); };
  }, [applyGuest, bootstrapTenant]);

  const authState: AuthState = {
    mode,
    user,
    isGuest: mode === "guest",
    isAuthenticated: mode === "authenticated",
    tenant,

    async sendMagicLink(email: string) {
      if (!isEnabled("auth_enabled")) return { error: "Login ainda não disponível." };
      const { signInWithMagicLink } = await import("@/lib/auth/authClient");
      return signInWithMagicLink(email);
    },

    async signOut() {
      if (isEnabled("auth_enabled")) {
        const { signOut: sbSignOut } = await import("@/lib/auth/authClient");
        await sbSignOut();
      }
      // Limpa estado de tenant — o próximo login re-resolve o condomínio ativo.
      try {
        const { clearActiveCondominioId } = await import("@/lib/tenant/tenantClient");
        clearActiveCondominioId();
        const { resetTenantBootstrap } = await import("@/lib/tenant/bootstrap");
        resetTenantBootstrap();
      } catch { /* tenant é opcional — logout nunca falha por causa dele */ }
      applyGuest();
    },
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useLocalId(): string {
  const { user } = useAuth();
  if (!user) return "guest";
  if (user.type === "guest") return user.localId;
  return user.id;
}
