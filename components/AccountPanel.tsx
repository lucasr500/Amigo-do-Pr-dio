"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isEnabled } from "@/lib/feature-flags";
import {
  getSyncStatus,
  formatLastSync,
  setSyncReadyToSync,
  setSyncSyncing,
  setSyncSynced,
  setSyncError,
  setSyncConflict,
  type SyncStatus,
} from "@/lib/sync/syncStatus";
import { getUserBackupJson, importUserData, getProfile, type UserBackup } from "@/lib/session";
import { isDemoActive } from "@/lib/demo";
import { isAutoBackupEnabled, setAutoBackupEnabled } from "@/lib/sync/autoBackup";
import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";
import { compareSnapshots } from "@/lib/sync/syncConflict";
import { getCloudBackupDiagnostics } from "@/lib/sync/syncDiagnostics";
import SyncConflictDialog from "@/components/SyncConflictDialog";

type MigrationStep = "idle" | "sending" | "sent" | "error";
type RestoreStep = "idle" | "loading" | "confirm" | "restoring" | "done" | "error";

type Props = {
  onRefresh?: () => void;
};

const STATE_LABEL: Record<string, string> = {
  idle:          "Dados locais neste dispositivo",
  local_only:    "Dados locais neste dispositivo",
  ready_to_sync: "Pronto para salvar na nuvem",
  syncing:       "Sincronizando…",
  synced:        "Backup salvo na nuvem",
  error:         "Erro ao sincronizar",
  offline:       "Offline — backup pendente",
  conflict:      "Conflito detectado",
};

const STATE_COLOR: Record<string, string> = {
  idle:          "text-navy-400",
  local_only:    "text-navy-400",
  ready_to_sync: "text-teal-500",
  syncing:       "text-teal-500",
  synced:        "text-teal-600",
  error:         "text-red-500",
  offline:       "text-amber-500",
  conflict:      "text-amber-600",
};

export default function AccountPanel({ onRefresh }: Props) {
  const { mode, user, isAuthenticated, sendMagicLink, signOut } = useAuth();
  const [syncStatus, setSyncStatusState] = useState<SyncStatus | null>(null);
  const [remoteMeta, setRemoteMeta] = useState<RemoteSnapshotMeta | null>(null);
  const [remoteBackup, setRemoteBackup] = useState<UserBackup | null>(null);
  const [email, setEmail] = useState("");
  const [migStep, setMigStep] = useState<MigrationStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [restoreStep, setRestoreStep] = useState<RestoreStep>("idle");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [autoBackup, setAutoBackupState] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const authEnabled = isEnabled("auth_enabled");
  const syncEnabled = isEnabled("sync_enabled");
  const demoActive = isDemoActive();

  const refreshSyncStatus = () => setSyncStatusState(getSyncStatus());

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setAutoBackupState(isAutoBackupEnabled());
    }
    const local = getSyncStatus();
    setSyncStatusState(local);

    if (!isAuthenticated || !user || user.type !== "authenticated") return;

    if (local.state === "idle") {
      setSyncReadyToSync();
      setSyncStatusState(getSyncStatus());
    }

    (async () => {
      const { checkRemoteSnapshot } = await import("@/lib/sync/syncEngine");
      const meta = await checkRemoteSnapshot(user.id);
      setRemoteMeta(meta);

      // Detectar conflito no load e persistir no SyncStatus
      if (meta?.exists) {
        const localBackup = JSON.parse(getUserBackupJson()) as UserBackup;
        const lastSyncAt = getSyncStatus().lastSyncAt;
        const cmp = compareSnapshots(localBackup, meta, lastSyncAt);
        if (cmp.status === "conflict") {
          setSyncConflict();
          setSyncStatusState(getSyncStatus());
        }
      }
    })();
  }, [isAuthenticated, user]);

  const diagnostics = getCloudBackupDiagnostics({
    isAuthenticated,
    isDemo: demoActive,
    isOnline,
    remoteMeta,
    syncState: syncStatus?.state ?? "idle",
    lastLocalSyncAt: syncStatus?.lastSyncAt ?? null,
    autoBackupEnabled: autoBackup,
  });

  function handleToggleAutoBackup() {
    const next = !autoBackup;
    setAutoBackupEnabled(next);
    setAutoBackupState(next);
  }

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

  async function executeUpload() {
    if (!isAuthenticated || !user || user.type !== "authenticated") return;
    if (demoActive) {
      setSyncFeedback("Sync desativado no modo demonstração.");
      return;
    }
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const { uploadSnapshot } = await import("@/lib/sync/syncEngine");
      setSyncSyncing();
      refreshSyncStatus();

      const backup = JSON.parse(getUserBackupJson()) as UserBackup;
      const result = await uploadSnapshot(user.id, backup);

      if (result.ok) {
        setSyncSynced();
        setSyncFeedback("Backup salvo na nuvem com sucesso.");
        const { checkRemoteSnapshot } = await import("@/lib/sync/syncEngine");
        const meta = await checkRemoteSnapshot(user.id);
        setRemoteMeta(meta);
      } else {
        setSyncError(result.error ?? "Erro desconhecido");
        setSyncFeedback(result.error ?? "Falha ao salvar backup.");
      }
      refreshSyncStatus();
      onRefresh?.();
    } finally {
      setSyncing(false);
    }
  }

  async function handleManualSync() {
    if (!isAuthenticated || !user || user.type !== "authenticated") return;
    if (demoActive) {
      setSyncFeedback("Sync desativado no modo demonstração.");
      return;
    }

    const localBackup = JSON.parse(getUserBackupJson()) as UserBackup;
    const lastSyncAt = getSyncStatus().lastSyncAt;
    const conflict = compareSnapshots(localBackup, remoteMeta, lastSyncAt);

    if (conflict.status === "conflict") {
      setShowConflictDialog(true);
      return;
    }

    await executeUpload();
  }

  function handleConflictKeepLocal() {
    setShowConflictDialog(false);
    executeUpload();
  }

  async function handleConflictRestoreRemote() {
    setShowConflictDialog(false);
    await executeRestore();
  }

  async function handleRestoreClick() {
    if (!isAuthenticated || !user || user.type !== "authenticated") return;
    if (demoActive) {
      setRestoreError("Restore desativado no modo demonstração.");
      return;
    }
    setRestoreStep("loading");
    setRestoreError(null);
    try {
      const { downloadSnapshot } = await import("@/lib/sync/syncEngine");
      const backup = await downloadSnapshot(user.id);
      if (!backup) {
        setRestoreStep("error");
        setRestoreError("Nenhum backup encontrado na nuvem.");
        return;
      }
      setRemoteBackup(backup);
      setRestoreStep("confirm");
    } catch {
      setRestoreStep("error");
      setRestoreError("Erro ao buscar backup remoto.");
    }
  }

  async function executeRestore() {
    if (!isAuthenticated || !user || user.type !== "authenticated") return;
    setRestoreStep("restoring");
    try {
      let backup = remoteBackup;
      if (!backup) {
        const { downloadSnapshot } = await import("@/lib/sync/syncEngine");
        backup = await downloadSnapshot(user.id);
      }
      if (!backup) {
        setRestoreStep("error");
        setRestoreError("Backup remoto não encontrado.");
        return;
      }
      const result = importUserData(JSON.stringify(backup));
      if (!result.success) {
        setRestoreStep("error");
        setRestoreError("Backup incompatível com esta versão do app.");
        return;
      }
      setRestoreStep("done");
      refreshSyncStatus();
      onRefresh?.();
    } catch {
      setRestoreStep("error");
      setRestoreError("Erro ao aplicar o backup.");
    }
  }

  async function handleSignOut() {
    await signOut();
    setSyncStatusState(getSyncStatus());
    setRemoteMeta(null);
    setRemoteBackup(null);
    setRestoreStep("idle");
  }

  const condominioName = getProfile()?.nomeCondominio ?? null;

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center py-16 text-[13px] text-navy-400">
        Carregando…
      </div>
    );
  }

  return (
    <>
      {/* ── Conflict Dialog ── */}
      {showConflictDialog && remoteMeta && (
        <SyncConflictDialog
          remoteMeta={remoteMeta}
          condominioName={condominioName}
          onKeepLocal={handleConflictKeepLocal}
          onRestoreRemote={handleConflictRestoreRemote}
          disabled={syncing || restoreStep === "restoring"}
        />
      )}

      <div className="space-y-4 pb-4">

        {/* ── Demo Mode Banner ── */}
        {demoActive && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 px-4 py-3">
            <p className="text-[12px] font-semibold text-purple-700">Modo demonstração ativo</p>
            <p className="mt-0.5 text-[11px] text-purple-600">
              Sync e backup estão pausados. Seus dados reais estão protegidos.
            </p>
          </div>
        )}

        {/* ── Cabeçalho da conta ── */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
          {isAuthenticated && user?.type === "authenticated" ? (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-base">
                {user.email?.[0]?.toUpperCase() ?? "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-navy-800 truncate">{user.email}</p>
                <p className="text-[11px] font-medium text-teal-600">Conta conectada</p>
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
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                  <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-navy-700">Acesso local</p>
                <p className="text-[11px] text-navy-400">
                  Seus dados ficam neste dispositivo. Faça login para ativar o backup na nuvem.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Diagnóstico de backup cloud (autenticado) ── */}
        {isAuthenticated && authEnabled && user?.type === "authenticated" && syncStatus && !demoActive && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100 space-y-3">

            {/* Status headline */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy-700">Backup na nuvem</p>
                <p className={`text-[11px] font-medium mt-0.5 ${STATE_COLOR[syncStatus.state] ?? "text-navy-400"}`}>
                  {STATE_LABEL[syncStatus.state] ?? syncStatus.state}
                  {syncStatus.state === "error" && syncStatus.errorMsg
                    ? `: ${syncStatus.errorMsg}`
                    : null}
                </p>
              </div>
              {/* Estado indicator dot */}
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                syncStatus.state === "synced" ? "bg-teal-500" :
                syncStatus.state === "syncing" ? "bg-teal-400 animate-pulse" :
                syncStatus.state === "error" || syncStatus.state === "conflict" ? "bg-red-400" :
                syncStatus.state === "offline" ? "bg-amber-400" :
                "bg-navy-200"
              }`} aria-hidden="true" />
            </div>

            {/* Metadados do backup remoto */}
            {diagnostics.hasRemoteBackup && (
              <div className="rounded-xl bg-navy-50/60 px-3 py-2.5 space-y-1">
                {diagnostics.remoteUpdatedAt && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-navy-500">Backup na nuvem</p>
                    <p className="text-[11px] font-semibold text-navy-700">
                      {formatLastSync(diagnostics.remoteUpdatedAt)}
                    </p>
                  </div>
                )}
                {diagnostics.lastLocalSyncAt && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-navy-500">Neste dispositivo</p>
                    <p className="text-[11px] font-semibold text-navy-700">
                      {formatLastSync(diagnostics.lastLocalSyncAt)}
                    </p>
                  </div>
                )}
                {diagnostics.remoteVersion != null && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-navy-500">Versão do backup</p>
                    <p className="text-[11px] font-semibold text-navy-700">v{diagnostics.remoteVersion}</p>
                  </div>
                )}
              </div>
            )}

            {/* Conflito detectado */}
            {syncStatus.state === "conflict" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                <p className="text-[11.5px] font-semibold text-amber-800">Versões diferentes detectadas</p>
                <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
                  Use "Salvar backup na nuvem" para resolver e escolher qual versão manter.
                </p>
              </div>
            )}

            {/* Stale warning */}
            {diagnostics.status === "stale" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
                <p className="text-[11px] text-amber-700">{diagnostics.message}</p>
              </div>
            )}

            {/* Botão de upload */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full rounded-xl bg-teal-600 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? "Salvando…" : "Salvar backup na nuvem"}
            </button>

            {/* Restore */}
            {diagnostics.hasRemoteBackup && restoreStep === "idle" && (
              <button
                type="button"
                onClick={handleRestoreClick}
                className="w-full rounded-xl border border-navy-200 bg-white py-2.5 text-[13px] font-semibold text-navy-600 hover:bg-navy-50 transition-colors"
              >
                Restaurar da nuvem
              </button>
            )}

            {restoreStep === "loading" && (
              <p className="text-[12px] text-navy-400 text-center">Buscando backup…</p>
            )}

            {restoreStep === "confirm" && remoteBackup && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                <p className="text-[12px] font-semibold text-amber-800">Confirmar restauração?</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Os dados deste dispositivo serão substituídos pelo backup da nuvem
                  {condominioName ? ` (${condominioName})` : ""}. Esta ação não pode ser desfeita.
                </p>
                {remoteBackup.exportedAt && (
                  <p className="text-[11px] text-amber-600">
                    Backup de: {new Date(remoteBackup.exportedAt).toLocaleString("pt-BR")}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreStep("idle")}
                    className="flex-1 rounded-xl border border-navy-200 bg-white py-2 text-[12px] font-semibold text-navy-600 hover:bg-navy-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executeRestore}
                    className="flex-1 rounded-xl bg-amber-600 py-2 text-[12px] font-semibold text-white hover:bg-amber-700"
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            )}

            {restoreStep === "restoring" && (
              <p className="text-[12px] text-teal-600 text-center">Restaurando…</p>
            )}

            {restoreStep === "done" && (
              <div className="rounded-xl bg-teal-50 p-3 text-center">
                <p className="text-[12px] font-semibold text-teal-700">Backup restaurado com sucesso.</p>
                <button
                  type="button"
                  onClick={() => setRestoreStep("idle")}
                  className="mt-1 text-[11px] text-teal-600 underline"
                >
                  Fechar
                </button>
              </div>
            )}

            {(restoreStep === "error" && restoreError) && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-3">
                <p className="text-[12px] font-semibold text-red-700">Erro</p>
                <p className="text-[11px] text-red-600">{restoreError}</p>
                <button
                  type="button"
                  onClick={() => { setRestoreStep("idle"); setRestoreError(null); }}
                  className="mt-1 text-[11px] text-red-500 underline"
                >
                  Fechar
                </button>
              </div>
            )}

            {syncFeedback && (
              <p className={`text-[11px] ${syncFeedback.includes("sucesso") ? "text-teal-600" : "text-red-500"}`}>
                {syncFeedback}
              </p>
            )}
          </div>
        )}

        {/* ── Backup automático opt-in (autenticado + não demo) ── */}
        {isAuthenticated && authEnabled && !demoActive && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy-700">Backup automático neste dispositivo</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-navy-400">
                  O app salvará seus dados na nuvem quando você fizer alterações importantes.
                  Você ainda poderá exportar backup manualmente.
                </p>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={autoBackup}
                onClick={handleToggleAutoBackup}
                className={`mt-0.5 flex-shrink-0 h-6 w-11 rounded-full border-2 transition-colors relative ${
                  autoBackup
                    ? "bg-teal-500 border-teal-500"
                    : "bg-navy-100 border-navy-200"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                    autoBackup ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {autoBackup && (
              <p className="mt-2 text-[10.5px] text-teal-600 font-medium">
                Backup automático ativo neste dispositivo.
              </p>
            )}
          </div>
        )}

        {/* ── Auto-sync status ── */}
        {isAuthenticated && syncEnabled && syncStatus && syncStatus.state === "syncing" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
            <p className="text-[12px] text-teal-500 font-medium">Sincronização automática em andamento…</p>
          </div>
        )}

        {/* ── Login via magic link (não autenticado) ── */}
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

        {/* ── Auth não habilitado ── */}
        {!isAuthenticated && !authEnabled && (
          <div className="rounded-2xl bg-navy-50 p-4 ring-1 ring-navy-100">
            <p className="text-[12px] text-navy-500 leading-relaxed">
              <span className="font-medium text-navy-700">Dados salvos localmente.</span>{" "}
              Seus dados ficam armazenados neste dispositivo. Faça backup regularmente pela aba Condomínio.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
