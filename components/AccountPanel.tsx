"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isEnabled } from "@/lib/feature-flags";
import { getSyncStatus, formatLastSync, setSyncReadyToSync, type SyncStatus } from "@/lib/sync/syncStatus";
import { getUserBackupJson, importUserData, getLastBackupAt, getSessionMeta, type UserBackup } from "@/lib/session";
import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";

type MigrationStep = "idle" | "sending" | "sent" | "error";
type RestorePhase   = "none" | "preview" | "confirming" | "in_progress" | "done" | "error";

type Props = {
  onRefresh?: () => void;
};

const STATE_LABEL: Record<string, string> = {
  idle:          "Dados salvos localmente",
  local_only:    "Dados salvos localmente",
  ready_to_sync: "Pronto para salvar na nuvem",
  syncing:       "Salvando backup…",
  synced:        "Backup salvo com sucesso",
  error:         "Não foi possível salvar agora",
  offline:       "Sem conexão — backup pendente",
};

const STATE_COLOR: Record<string, string> = {
  idle:          "text-navy-400",
  local_only:    "text-navy-400",
  ready_to_sync: "text-teal-500",
  syncing:       "text-teal-500",
  synced:        "text-teal-600",
  error:         "text-red-500",
  offline:       "text-amber-500",
};

// Salva cópia local antes de qualquer restore remoto.
function savePreRestoreBackup(): void {
  try {
    if (typeof window === "undefined") return;
    const wrapper = JSON.stringify({
      savedAt: new Date().toISOString(),
      data: getUserBackupJson(),
    });
    localStorage.setItem("amigo_pre_restore_backup", wrapper);
  } catch { /* quota — ignora */ }
}

export default function AccountPanel({ onRefresh }: Props) {
  const { mode, user, isAuthenticated, sendMagicLink, signOut } = useAuth();
  const [syncStatus,   setSyncStatus]   = useState<SyncStatus | null>(null);
  const [remoteMeta,   setRemoteMeta]   = useState<RemoteSnapshotMeta | null>(null);
  const [email,        setEmail]        = useState("");
  const [migStep,      setMigStep]      = useState<MigrationStep>("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [syncing,      setSyncing]      = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Restore flow
  const [restorePhase, setRestorePhase] = useState<RestorePhase>("none");
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const authEnabled    = isEnabled("auth_enabled");
  const syncEnabled    = isEnabled("sync_enabled");
  const cloudEnabled   = isEnabled("cloud_backup_enabled");

  // Carrega status local e metadados remotos ao montar (usuário autenticado)
  useEffect(() => {
    const local = getSyncStatus();
    setSyncStatus(local);

    if (!isAuthenticated || !user || user.type !== "authenticated") return;

    // Se nunca sincronizou neste dispositivo, marca como ready_to_sync
    if (local.state === "idle") {
      setSyncReadyToSync();
      setSyncStatus(getSyncStatus());
    }

    // Verifica metadados do backup remoto (sem baixar payload)
    (async () => {
      const { checkRemoteSnapshot } = await import("@/lib/sync/syncEngine");
      const meta = await checkRemoteSnapshot(user.id);
      setRemoteMeta(meta);
    })();
  }, [isAuthenticated, user]);

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
      setSyncStatus(getSyncStatus());

      const backup = JSON.parse(getUserBackupJson()) as UserBackup;
      const result = await uploadSnapshot(user.id, backup);

      if (result.ok) {
        setSyncSynced();
        setSyncFeedback("Backup salvo na nuvem com sucesso.");
        // Atualiza meta remota após upload bem-sucedido
        const { checkRemoteSnapshot } = await import("@/lib/sync/syncEngine");
        const meta = await checkRemoteSnapshot(user.id);
        setRemoteMeta(meta);
        // Sai do fluxo de restore se estava ativo
        if (restorePhase !== "none" && restorePhase !== "done") {
          setRestorePhase("none");
          setRestoreInput("");
        }
      } else {
        setSyncError(result.error ?? "Erro desconhecido");
        setSyncFeedback("error");
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
    setRemoteMeta(null);
    setRestorePhase("none");
    setRestoreInput("");
  }

  // Inicia o fluxo de restore (apenas mostra preview sem baixar nada ainda)
  function handleRestoreStart() {
    setRestorePhase("preview");
    setRestoreError(null);
    setRestoreInput("");
  }

  // Avança para etapa de confirmação
  function handleRestoreRequestConfirm() {
    setRestorePhase("confirming");
    setRestoreInput("");
  }

  // Executa o restore: salva pre-restore → baixa remoto → importa
  async function handleRestoreExecute() {
    if (restoreInput !== "RESTAURAR" || !user || user.type !== "authenticated") return;
    setRestorePhase("in_progress");
    setRestoreError(null);

    try {
      // 1. Salva cópia local de segurança antes de substituir
      savePreRestoreBackup();

      // 2. Baixa backup remoto
      const { downloadSnapshot } = await import("@/lib/sync/syncEngine");
      const backup = await downloadSnapshot(user.id);

      if (!backup) {
        setRestoreError("Não foi possível obter o backup da nuvem. Seus dados locais não foram alterados.");
        setRestorePhase("error");
        return;
      }

      // 3. Importa no localStorage
      const jsonStr = JSON.stringify(backup);
      const result = importUserData(jsonStr);

      if (result.success) {
        setRestorePhase("done");
        setRestoreInput("");
        onRefresh?.();
      } else {
        setRestoreError(result.error ?? "O backup remoto não pôde ser aplicado. Seus dados locais não foram alterados.");
        setRestorePhase("error");
      }
    } catch {
      setRestoreError("Erro inesperado durante a restauração. Seus dados locais não foram alterados.");
      setRestorePhase("error");
    }
  }

  function handleRestoreCancel() {
    setRestorePhase("none");
    setRestoreInput("");
    setRestoreError(null);
  }

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
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-400">
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-navy-700">Modo local</p>
              <p className="text-[11px] text-navy-400 leading-relaxed mt-0.5">
                Seus dados ficam salvos neste dispositivo. Entre com seu e-mail para ativar o backup em nuvem.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Proteção de dados na nuvem (autenticado + cloud backup enabled) ── */}
      {isAuthenticated && authEnabled && cloudEnabled && user?.type === "authenticated" && syncStatus && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100 space-y-3">

          {/* Status do backup */}
          <div>
            <p className="text-[13px] font-semibold text-navy-700">Proteção de dados</p>
            <p className={`text-[11px] font-medium mt-0.5 ${STATE_COLOR[syncStatus.state] ?? "text-navy-400"}`}>
              {STATE_LABEL[syncStatus.state] ?? "Verificando…"}
            </p>
          </div>

          {/* Data do último backup bem-sucedido */}
          {syncStatus.state === "synced" && syncStatus.lastSyncAt && (
            <p className="text-[11px] text-navy-400">
              Último backup: {formatLastSync(syncStatus.lastSyncAt)}
            </p>
          )}

          {/* Backup remoto encontrado — exibir quando estado ≠ synced para evitar duplicação */}
          {syncStatus.state !== "synced" && remoteMeta?.exists && remoteMeta.updatedAt && (
            <p className="text-[11px] text-navy-400">
              Backup na nuvem: {formatLastSync(remoteMeta.updatedAt)}
              {remoteMeta.version != null ? ` · v${remoteMeta.version}` : ""}
            </p>
          )}

          {/* ── Botão de salvar backup (visível fora do fluxo de restore) ── */}
          {restorePhase === "none" && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full rounded-xl bg-teal-600 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? "Salvando…" : "Salvar backup na nuvem"}
            </button>
          )}

          {/* Feedback do upload */}
          {syncFeedback && restorePhase === "none" && (
            <p className={`text-[11px] leading-relaxed ${syncFeedback === "error" ? "text-red-500" : "text-teal-600"}`}>
              {syncFeedback === "error"
                ? "Não foi possível salvar agora. Seus dados locais continuam seguros neste dispositivo."
                : syncFeedback}
            </p>
          )}

          {/* ── Seção de restore — só aparece se há backup remoto ── */}
          {remoteMeta?.exists && restorePhase === "none" && (
            <div className="rounded-xl border border-navy-100 bg-navy-50/50 px-3 py-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-navy-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-[11px] leading-relaxed text-navy-500">
                  Existe um backup salvo na nuvem. Restaurar substituiria todos os dados deste dispositivo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestoreStart}
                className="text-[11.5px] font-medium text-navy-500 hover:text-navy-700 underline underline-offset-2"
              >
                Ver detalhes do backup remoto →
              </button>
            </div>
          )}

          {/* ── Restore: Preview ── */}
          {remoteMeta?.exists && restorePhase === "preview" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 space-y-3">
              <div>
                <p className="text-[12.5px] font-semibold text-amber-800">Backup encontrado na nuvem</p>
                <p className="text-[11.5px] text-amber-700 mt-0.5">
                  {remoteMeta.updatedAt
                    ? `Backup remoto: ${new Date(remoteMeta.updatedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "Data não disponível"}
                  {remoteMeta.version != null ? ` · v${remoteMeta.version}` : ""}
                </p>
                {(() => {
                  const lastLocal = getLastBackupAt() ?? getSessionMeta().lastOpenedAt;
                  if (!lastLocal || !remoteMeta.updatedAt) return null;
                  const localDate = new Date(lastLocal);
                  const remoteDate = new Date(remoteMeta.updatedAt);
                  return (
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      Dados locais: {localDate.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {remoteDate < localDate && (
                        <span className="ml-1 font-semibold">· O backup remoto pode ser mais antigo que os dados deste dispositivo</span>
                      )}
                    </p>
                  );
                })()}
              </div>
              <div className="rounded-lg bg-amber-100/70 px-3 py-2">
                <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                  Atenção: restaurar da nuvem substituirá todos os dados atuais deste dispositivo por este backup.
                  Antes de continuar, considere salvar uma cópia local pelo painel abaixo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreRequestConfirm}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-all hover:bg-amber-700 active:scale-[0.97]"
                >
                  Quero restaurar este backup
                </button>
                <button
                  type="button"
                  onClick={handleRestoreCancel}
                  className="text-[11px] text-navy-400 hover:text-navy-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* ── Restore: Confirmação dupla ── */}
          {remoteMeta?.exists && restorePhase === "confirming" && (
            <div className="rounded-xl border border-terracotta-300 bg-terracotta-50/80 px-4 py-3.5 space-y-3">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-terracotta-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 6.5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-[12px] font-bold text-terracotta-800">
                  Confirmação necessária — ação irreversível
                </p>
              </div>
              <p className="text-[11.5px] leading-relaxed text-terracotta-700">
                Esta ação substituirá todos os dados locais deste dispositivo pelo backup da nuvem.
                Uma cópia de segurança será criada automaticamente antes de continuar.
              </p>
              <div>
                <label className="block text-[11px] font-medium text-terracotta-700 mb-1">
                  Digite <strong>RESTAURAR</strong> para confirmar
                </label>
                <input
                  type="text"
                  value={restoreInput}
                  onChange={(e) => setRestoreInput(e.target.value)}
                  placeholder="RESTAURAR"
                  autoComplete="off"
                  className="w-full rounded-xl border border-terracotta-200 bg-white px-3 py-1.5 text-[12.5px] text-navy-800 placeholder:text-navy-300 focus:border-terracotta-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreExecute}
                  disabled={restoreInput !== "RESTAURAR"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-600 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-all hover:bg-terracotta-700 active:scale-[0.97] disabled:bg-navy-200 disabled:text-navy-400"
                >
                  Confirmar restauração
                </button>
                <button
                  type="button"
                  onClick={handleRestoreCancel}
                  className="text-[11px] text-navy-400 hover:text-navy-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* ── Restore: Em progresso ── */}
          {restorePhase === "in_progress" && (
            <div className="rounded-xl bg-navy-50 px-4 py-3 text-center">
              <p className="text-[12.5px] font-medium text-navy-600">Criando cópia local e restaurando backup…</p>
            </div>
          )}

          {/* ── Restore: Sucesso ── */}
          {restorePhase === "done" && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0 text-teal-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[13px] font-semibold text-teal-700">Dados restaurados com sucesso.</p>
              </div>
              <p className="text-[11px] text-teal-600 leading-relaxed">
                Uma cópia dos dados anteriores foi salva localmente como segurança.
              </p>
              <button
                type="button"
                onClick={handleRestoreCancel}
                className="text-[11px] text-teal-600 underline underline-offset-2 hover:text-teal-800"
              >
                Fechar
              </button>
            </div>
          )}

          {/* ── Restore: Erro ── */}
          {restorePhase === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 space-y-1.5">
              <p className="text-[12px] font-medium text-red-700">Restauração não concluída</p>
              <p className="text-[11.5px] text-red-600 leading-relaxed">
                {restoreError ?? "Ocorreu um erro inesperado. Seus dados locais não foram alterados."}
              </p>
              <button
                type="button"
                onClick={handleRestoreCancel}
                className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600"
              >
                Fechar
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── Auto-sync status (quando sync_enabled ativo) ── */}
      {isAuthenticated && syncEnabled && syncStatus && syncStatus.state === "syncing" && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
          <p className="text-[12px] text-teal-500 font-medium">Sincronização automática em andamento…</p>
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
