"use client";

// Contexto de autenticação — preparado para login futuro.
// O app funciona 100% sem login (modo guest).
// Quando auth real for habilitada: substituir GuestAuthState por sessão real do Supabase.

import React, { createContext, useContext, useEffect, useState } from "react";
import { isEnabled } from "@/lib/feature-flags";

export type AuthMode = "guest" | "authenticated" | "loading";

export type GuestUser = {
  type: "guest";
  localId: string; // ID local para identificar device
};

export type AuthenticatedUser = {
  type: "authenticated";
  id: string;
  email: string | null;
  displayName?: string;
};

export type AppUser = GuestUser | AuthenticatedUser;

export type AuthState = {
  mode: AuthMode;
  user: AppUser | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  // Ações futuras (stubs por ora):
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

// ── Local ID — persiste no dispositivo para identificação ─────────────────────

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

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("loading");
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!isEnabled("auth_enabled")) {
      // Auth desabilitada → sempre guest
      const localId = getOrCreateLocalId();
      setUser({ type: "guest", localId });
      setMode("guest");
      return;
    }

    // TODO: quando auth_enabled, verificar sessão real:
    // const session = await getSession(); // lib/auth/authClient.ts
    // if (session) { setUser({ type: "authenticated", ... }); setMode("authenticated"); }
    // else { setUser({ type: "guest", ... }); setMode("guest"); }

    const localId = getOrCreateLocalId();
    setUser({ type: "guest", localId });
    setMode("guest");
  }, []);

  const authState: AuthState = {
    mode,
    user,
    isGuest: mode === "guest",
    isAuthenticated: mode === "authenticated",

    async signIn(_email: string, _password: string) {
      if (!isEnabled("auth_enabled")) return { error: "Login ainda não disponível." };
      // TODO: implementar com authClient.signIn()
      return { error: "Login ainda não implementado." };
    },

    async signUp(_email: string, _password: string) {
      if (!isEnabled("auth_enabled")) return { error: "Cadastro ainda não disponível." };
      return { error: "Cadastro ainda não implementado." };
    },

    async signOut() {
      setUser({ type: "guest", localId: getOrCreateLocalId() });
      setMode("guest");
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

// Hook leve para casos onde apenas o ID do usuário é necessário.
export function useLocalId(): string {
  const { user } = useAuth();
  if (!user) return "guest";
  if (user.type === "guest") return user.localId;
  return user.id;
}
