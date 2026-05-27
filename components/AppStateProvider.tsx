"use client";

// Provider leve de estado global do app.
// Centraliza hidratação de dados comuns para eliminar reads redundantes.
// Componentes específicos continuam com seus próprios useEffects quando precisam
// de dados mais granulares — este provider cobre o "esqueleto" de estado.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  getProfile,
  hasMemoriaOperacional,
  hasProfile,
  computeCondominioHealth,
  getPendenciasAbertas,
  type CondominioProfile,
  type CondominioHealthStatus,
} from "@/lib/session";
import { getUnreadCount, runNotificationEngine } from "@/lib/notifications";
import { captureHealthSnapshot } from "@/lib/health-history";
import { isEnabled } from "@/lib/feature-flags";

export type AppState = {
  // Dados básicos
  hasData: boolean;
  profile: CondominioProfile | null;
  condoName: string;
  healthStatus: CondominioHealthStatus | null;
  pendenciasCount: number;
  profileCompletion: number;   // 0–100
  // Notificações
  unreadNotifications: number;
  // Controle
  hydrated: boolean;
  // Forçar re-leitura de dados (chamado após saves)
  refresh: () => void;
  // Timestamp do último refresh (para componentes detectarem mudança)
  refreshKey: number;
};

const AppStateContext = createContext<AppState | null>(null);

function computeProfileCompletion(profile: CondominioProfile | null): number {
  if (!profile) return 0;
  const fields = [
    profile.nomeCondominio,
    profile.hasElevador !== undefined ? "set" : "",
    profile.tipoSindico,
    profile.hasFuncionarios !== undefined ? "set" : "",
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AppState, "refresh">>({
    hasData: false,
    profile: null,
    condoName: "",
    healthStatus: null,
    pendenciasCount: 0,
    profileCompletion: 0,
    unreadNotifications: 0,
    hydrated: false,
    refreshKey: 0,
  });

  const refreshKeyRef = useRef(0);

  const load = useCallback(() => {
    const hasData = hasMemoriaOperacional() || hasProfile();
    const profile = getProfile();
    const pendencias = getPendenciasAbertas();

    let healthStatus: CondominioHealthStatus | null = null;
    if (hasData) {
      try {
        const health = computeCondominioHealth();
        healthStatus = health.status;
      } catch { /* ignore */ }
    }

    // Captura snapshot do health score (idempotente — 1x por dia)
    if (hasData && isEnabled("health_history_enabled")) {
      try { captureHealthSnapshot(); } catch { /* ignore */ }
    }

    // Roda notification engine ao carregar
    if (isEnabled("notifications_enabled")) {
      try { runNotificationEngine(); } catch { /* ignore */ }
    }

    const unreadNotifications = isEnabled("notifications_enabled")
      ? getUnreadCount()
      : 0;

    refreshKeyRef.current += 1;

    setState({
      hasData,
      profile,
      condoName: profile?.nomeCondominio ?? "",
      healthStatus,
      pendenciasCount: pendencias.length,
      profileCompletion: computeProfileCompletion(profile),
      unreadNotifications,
      hydrated: true,
      refreshKey: refreshKeyRef.current,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return (
    <AppStateContext.Provider value={{ ...state, refresh }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

// Hook simplificado para o refreshKey — componentes que só precisam saber "houve mudança"
export function useRefreshKey(): number {
  return useAppState().refreshKey;
}
