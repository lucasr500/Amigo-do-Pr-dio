"use client";

import { useEffect, useState } from "react";
import { getSyncStatus, type SyncState } from "@/lib/sync/syncStatus";
import { useAuth } from "@/lib/auth/AuthContext";
import { isEnabled } from "@/lib/feature-flags";
import { isDemoActive } from "@/lib/demo";

const BADGE_CONFIG: Record<
  SyncState | "demo",
  { label: string; dotClass: string; textClass: string } | null
> = {
  idle:          null,
  local_only:    null,
  ready_to_sync: { label: "Pronto para salvar",   dotClass: "bg-teal-400",            textClass: "text-teal-600"   },
  syncing:       { label: "Sincronizando…",        dotClass: "bg-teal-400 animate-pulse", textClass: "text-teal-600" },
  synced:        { label: "Salvo na nuvem",         dotClass: "bg-teal-500",            textClass: "text-teal-600"   },
  error:         { label: "Erro no backup",         dotClass: "bg-red-500",             textClass: "text-red-600"    },
  offline:       { label: "Backup pendente",        dotClass: "bg-amber-500",           textClass: "text-amber-600"  },
  conflict:      { label: "Conflito detectado",     dotClass: "bg-amber-500",           textClass: "text-amber-700"  },
  demo:          { label: "Modo demonstração",      dotClass: "bg-purple-400",          textClass: "text-purple-600" },
};

type Props = {
  refreshKey?: number;
};

export default function SyncStatusBadge({ refreshKey }: Props) {
  const { isAuthenticated } = useAuth();
  const authEnabled = isEnabled("auth_enabled");
  const [syncState, setSyncState] = useState<SyncState | "demo" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDemoActive()) {
      setSyncState("demo");
      return;
    }
    if (!isAuthenticated || !authEnabled) {
      setSyncState(null);
      return;
    }
    const s = getSyncStatus();
    setSyncState(s.state === "idle" || s.state === "local_only" ? null : s.state);
  }, [isAuthenticated, authEnabled, refreshKey]);

  if (!syncState) return null;

  const config = BADGE_CONFIG[syncState];
  if (!config) return null;

  return (
    <span
      aria-label={config.label}
      className={`inline-flex items-center gap-1.5 rounded-full border border-current/10 bg-white/80 px-2 py-0.5 text-[10px] font-semibold shadow-card ${config.textClass}`}
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
