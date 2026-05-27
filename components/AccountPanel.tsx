"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isEnabled } from "@/lib/feature-flags";
import { getSyncStatus, formatLastSync, type SyncStatus } from "@/lib/sync/syncStatus";
import { getUserBackupJson, type UserBackup } from "@/lib/session";

type MigrationStep = "idle" | "sending" | "sent" | "error";

type Props = {
  onRefresh?: () => void;
};

export default function AccountPanel({ onRefresh }: Props) {
  const { mode, user, isAuthenticated, sendMagicLink, signOut } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [email, setEmail] = useState("");
  const [migStep, setMigStep] = useState<MigrationStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const authEnabled = isEnabled("auth_enabled");
  const syncEnabled = isEnabled("sync_enabled");

  useEffect(() => {
    setSyncStatus(getSyncStatus());
  }, []);

  async function handleSendMagicLink() {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }
    setMigStep("sending");
    setErrorMsg("");
    const result = await sendMagicLink(email.trim());
    if (result.error) {
      setErrorMsg(result.error);
      setMigStep("error");
    } else {
      setMigStep("sent");
    }
  }

  async function handleManualSync() {
    if (!isAuthenticated || !user || user.type !== "authenticated") return;
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const { uploadSnapshot } = await import("@/lib/sync/syncEngine");
      const { setSyncSyncing, setSyncSynced, setSyncError } = await import("@/lib/sync/syncStatus");
      setSyncSyncing();
      const backup = JSON.parse(getUserBackupJson()) as UserBackup;
      const result = await uploadSnapshot(user.id, backup);
      if (result.ok) {
        setSyncSynced();
        setSyncFeedback("Dados sincronizados com sucesso.");
      } else {
        setSyncError(result.error ?? "Erro desconhecido");
        setSyncFeedback(result.error ?? "Falha na sincronização.");
      }
      setSyncStatus(getSyncStatus());
      onRefresh?.();
    } finally {
      setSyncing(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setSyncStatus(getSyncStatus());
  }

  const stateLabel: Record<string, string> = {
    idle: "Nunca sincronizado",
    syncing: "Sincronizando…",
    synced: "Sincronizado",
    error: "Erro na última sincronização",
    offline: "Offline",
  };

  const stateColor: Record<string, string> = {
    idle: "text-navy-400",
    syncing: "text-teal-500",
    synced: "text-teal-600",
    error: "text-red-500",
    offline: "text-amber-500",
  };

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center py-16 text-navy-400 text-sm">
        Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">

      {/* ── Cabeçalho da conta ── */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
        {isAuthenticated && user?.type === "authenticated" ? (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-base">
              {user.email?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-navy-800 truncate">{user.email}</p>
              <p className="text-[11px] font-medium text-teal-600">Conta ativa</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              Sair
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-400">
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-navy-700">Modo local</p>
              <p className="text-[11px] text-navy-400">Dados salvos neste dispositivo</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Status de sincronização (autenticado + sync habilitado) ── */}
      {isAuthenticated && syncEnabled && syncStatus && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-navy-700">Sincronização na nuvem</p>
              <p className={`text-[11px] font-medium ${stateColor[syncStatus.state] ?? "text-navy-400"}`}>
                {stateLabel[syncStatus.state] ?? syncStatus.state}
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? "Sincronizando…" : "Sincronizar agora"}
            </button>
          </div>
          {syncStatus.lastSyncAt && (
            <p className="text-[11px] text-navy-400">
              Último sync: {formatLastSync(syncStatus.lastSyncAt)}
            </p>
          )}
          {syncFeedback && (
            <p className={`text-[11px] ${syncFeedback.includes("sucesso") ? "text-teal-600" : "text-red-500"}`}>
              {syncFeedback}
            </p>
          )}
        </div>
      )}

      {/* ── Login via magic link (não autenticado + auth habilitado) ── */}
      {!isAuthenticated && authEnabled && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100 space-y-3">
          <div>
            <p className="text-[13px] font-semibold text-navy-700">Salvar na nuvem</p>
            <p className="text-[11px] text-navy-500 mt-0.5">
              Acesse seus dados em qualquer dispositivo. Um link é enviado para seu e-mail.
            </p>
          </div>

          {migStep !== "sent" ? (
            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendMagicLink(); }}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />
              {errorMsg && <p className="text-[11px] text-red-500">{errorMsg}</p>}
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={migStep === "sending"}
                className="w-full rounded-xl bg-teal-600 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {migStep === "sending" ? "Enviando…" : "Enviar link de acesso"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-teal-50 p-3 text-center">
              <p className="text-[13px] font-semibold text-teal-700">Link enviado!</p>
              <p className="mt-0.5 text-[11px] text-teal-600">
                Verifique seu e-mail e clique no link para ativar sua conta.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Auth não habilitado ainda ── */}
      {!isAuthenticated && !authEnabled && (
        <div className="rounded-2xl bg-navy-50 p-4 ring-1 ring-navy-100">
          <p className="text-[12px] text-navy-500 leading-relaxed">
            <span className="font-medium text-navy-700">Login em nuvem em breve.</span>{" "}
            Por enquanto seus dados são armazenados localmente neste dispositivo. Faça backup regularmente pela aba Condomínio.
          </p>
        </div>
      )}

    </div>
  );
}
