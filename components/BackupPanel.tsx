"use client";

import { useEffect, useRef, useState } from "react";
import { exportUserData, getUserBackupJson, importUserData, parseAndValidateUserData, getStorageSizeKB, clearAllData, recordBackupAt, getLastBackupAt, ImportResult } from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { getStorageQuotaStatus } from "@/lib/storage-quota";
import { emitBackupExported } from "@/lib/community-timeline";
import AlertBox from "@/components/ui/AlertBox";
import LocalFirstTrustNote from "@/components/LocalFirstTrustNote";

type Props = {
  onImported?: () => void;
};

type ImportState =
  | { phase: "idle" }
  | { phase: "confirming"; summary: Extract<ImportResult, { success: true }>["summary"]; raw: string }
  | { phase: "success"; nomeCondominio?: string }
  | { phase: "error"; message: string };

type ResetPhase = "idle" | "confirming" | "done";

export default function BackupPanel({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ phase: "idle" });
  const [storageSizeKB, setStorageSizeKB] = useState<number | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [resetPhase, setResetPhase] = useState<ResetPhase>("idle");
  const [resetInput, setResetInput] = useState("");
  const [sharing, setSharing] = useState(false);
  const backupTimelineEmittedRef = useRef(false);

  useEffect(() => {
    setStorageSizeKB(getStorageSizeKB());
    setLastBackupAt(getLastBackupAt());
  }, []);

  const handleExport = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const exported = exportUserData();
    if (!exported) {
      setExportFeedback("Não foi possível exportar o backup neste dispositivo.");
      setTimeout(() => setExportFeedback(null), 4000);
      return;
    }
    recordBackupAt();
    if (!backupTimelineEmittedRef.current) {
      emitBackupExported();
      backupTimelineEmittedRef.current = true;
    }
    void trackEvent("backup_exported");
    setLastBackupAt(now.toISOString());
    setExportFeedback(`Backup exportado: amigo-do-predio-backup-${dateStr}.json`);
    setTimeout(() => setExportFeedback(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      if (!raw) {
        setImportState({ phase: "error", message: "Não foi possível ler o arquivo." });
        return;
      }

      // Valida sem escrever — escreve só após confirmação do usuário
      const result = parseAndValidateUserData(raw);
      if (!result.success) {
        setImportState({ phase: "error", message: result.error });
      } else {
        setImportState({ phase: "confirming", summary: result.summary, raw });
      }
    };
    reader.readAsText(file);

    // Limpar input para permitir selecionar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    if (importState.phase !== "confirming") return;
    const result = importUserData(importState.raw);
    if (result.success) {
      void trackEvent("backup_imported");
      setImportState({ phase: "success", nomeCondominio: result.summary.nomeCondominio });
      onImported?.();
    } else {
      setImportState({ phase: "error", message: result.error });
    }
  };

  const handleWebShare = async () => {
    if (typeof navigator === "undefined") return;
    setSharing(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `amigo-do-predio-backup-${dateStr}.json`;
      const json = getUserBackupJson();
      const file = new File([json], fileName, { type: "application/json" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Backup — Amigo do Prédio" });
        recordBackupAt();
        setLastBackupAt(new Date().toISOString());
        void trackEvent("backup_shared_via_web_share");
      } else if (navigator.share) {
        await navigator.share({ title: "Amigo do Prédio — Backup", text: "Backup do condomínio exportado pelo Amigo do Prédio." });
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        // Compartilhamento indisponível — silencioso
      }
    } finally {
      setSharing(false);
    }
  };

  const handleReset = () => {
    setImportState({ phase: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmReset = () => {
    if (resetInput !== "APAGAR") return;
    clearAllData();
    void trackEvent("data_cleared");
    setResetPhase("done");
    setResetInput("");
    setStorageSizeKB(0);
    onImported?.();
  };

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">

        {/* Cabeçalho */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
            Seus dados
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-navy-800">
            Backup do condomínio
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
            Seus dados ficam salvos neste dispositivo. O backup JSON cria uma cópia manual para restaurar depois; ele não promete sincronização automática.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-navy-400">
            Exporte regularmente. O arquivo pode conter dados sensíveis do condomínio, pendências, agenda, documentos e financeiro; guarde em local seguro.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[10.5px] font-medium text-navy-500">Local neste dispositivo</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-medium text-amber-700">Sync automático não garantido</span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10.5px] font-medium text-teal-700">Backup manual disponível</span>
          </div>
          <p className="mt-2 text-[11px] text-navy-400">
            {lastBackupAt
              ? `Último backup: ${new Date(lastBackupAt).toLocaleDateString("pt-BR")} às ${new Date(lastBackupAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Nenhum backup exportado ainda."}
          </p>
        </div>

        <div className="mx-5 border-t border-navy-50" />

        <div className="px-5 py-3.5 space-y-3">
          <LocalFirstTrustNote compact />

          {/* Alerta de backup desatualizado */}
          {(() => {
            if (!lastBackupAt) {
              return (
                <AlertBox
                  tone="warning"
                  title="Nenhum backup exportado ainda."
                  description="Exporte agora para proteger os dados locais do condomínio."
                />
              );
            }
            const days = Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86400000);
            if (days >= 14) {
              return (
                <AlertBox
                  tone="warning"
                  title={`Último backup há ${days} dias.`}
                  description="Exporte uma cópia atualizada para manter a segurança dos dados locais."
                />
              );
            }
            return null;
          })()}

          {/* Exportar */}
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-left transition-colors hover:bg-navy-50/60 active:bg-navy-50"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50">
              <svg className="h-3.5 w-3.5 text-navy-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v8M8 10l-3-3M8 10l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-navy-800">Exportar dados</p>
              <p className="text-[11px] text-navy-400">Backup local v9: memória, documentos essenciais, funcionários, pendências, agenda, financeiro auxiliar e histórico de revisão mensal</p>
            </div>
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Feedback de exportação */}
          {exportFeedback && (
            <div className="flex items-center gap-2 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-2.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="break-all text-[11.5px] text-navy-600">{exportFeedback}</p>
            </div>
          )}

          {/* Compartilhar via Web Share API — apenas em dispositivos compatíveis */}
          {typeof navigator !== "undefined" && !!navigator.share && (
            <button
              type="button"
              onClick={handleWebShare}
              disabled={sharing}
              className="flex w-full items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-left transition-colors hover:bg-navy-50/60 active:bg-navy-50 disabled:opacity-60"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50">
                <svg className="h-3.5 w-3.5 text-navy-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.5 7L10.5 5M5.5 9L10.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-navy-800">
                  {sharing ? "Compartilhando…" : "Compartilhar backup"}
                </p>
                <p className="text-[11px] text-navy-400">Enviar arquivo via WhatsApp, e-mail ou nuvem</p>
              </div>
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Importar — idle */}
          {importState.phase === "idle" && (
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-left transition-colors hover:bg-navy-50/60 active:bg-navy-50">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50">
                <svg className="h-3.5 w-3.5 text-navy-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 10V2M8 2L5 5M8 2l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-navy-800">Restaurar backup</p>
                <p className="text-[11px] text-navy-400">Selecione um arquivo .json exportado anteriormente</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
              />
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
          )}

          {/* Confirmar importação */}
          {importState.phase === "confirming" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
              <p className="text-[12.5px] font-semibold text-amber-800 mb-1">
                Substituir dados atuais?
              </p>
              <p className="text-[11.5px] leading-relaxed text-amber-700 mb-1">
                {importState.summary.nomeCondominio
                  ? `Backup de "${importState.summary.nomeCondominio}"`
                  : "Backup sem nome de condomínio"}
                {importState.summary.memoriaCount > 0 && ` · ${importState.summary.memoriaCount} datas registradas`}
                {importState.summary.favoritesCount > 0 && ` · ${importState.summary.favoritesCount} favorito${importState.summary.favoritesCount > 1 ? "s" : ""}`}
                {importState.summary.pendenciasCount != null && importState.summary.pendenciasCount > 0 && ` · ${importState.summary.pendenciasCount} próximo${importState.summary.pendenciasCount > 1 ? "s passos" : " passo"}`}
                {importState.summary.ocorrenciasCount != null && importState.summary.ocorrenciasCount > 0 && ` · ${importState.summary.ocorrenciasCount} ocorrência${importState.summary.ocorrenciasCount > 1 ? "s" : ""}`}
                {importState.summary.agendaCount != null && importState.summary.agendaCount > 0 && ` · ${importState.summary.agendaCount} evento${importState.summary.agendaCount > 1 ? "s" : ""} na agenda`}
                {importState.summary.financialSnapshotsCount != null && importState.summary.financialSnapshotsCount > 0 && ` · ${importState.summary.financialSnapshotsCount} resumo${importState.summary.financialSnapshotsCount > 1 ? "s" : ""} financeiro${importState.summary.financialSnapshotsCount > 1 ? "s" : ""}`}
              </p>
              <p className="text-[11px] text-amber-600 mb-3">
                Os dados atuais deste dispositivo serão substituídos. Exporte um backup atual antes se quiser preservar o estado de agora.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-all hover:bg-amber-700 active:scale-[0.97]"
                >
                  Confirmar restauração
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full px-3 py-1.5 text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Sucesso */}
          {importState.phase === "success" && (
            <div className="rounded-xl border border-cream-200 bg-cream-100/60 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 flex-shrink-0 text-navy-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[12.5px] font-semibold text-navy-800">
                    Dados restaurados
                  </p>
                  {importState.nomeCondominio && (
                    <p className="text-[11px] text-navy-500">
                      {importState.nomeCondominio}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2.5 text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600"
              >
                Importar outro arquivo
              </button>
            </div>
          )}

          {/* Erro */}
          {importState.phase === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
              <p className="text-[12px] font-medium text-red-700 mb-0.5">
                Não foi possível restaurar
              </p>
              <p className="text-[11.5px] text-red-600 mb-2.5">
                {importState.message}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {/* Reset seguro — área discreta, separada de Exportar/Restaurar */}
        <div className="mx-5 border-t border-navy-50" />
        <div className="px-5 py-3.5">
          {resetPhase === "idle" && (
            <button
              type="button"
              onClick={() => setResetPhase("confirming")}
              className="text-[11.5px] text-navy-400 transition-colors hover:text-terracotta-600"
            >
              Novo condomínio / limpar dados
            </button>
          )}

          {resetPhase === "confirming" && (
            <div className="rounded-xl border border-terracotta-300 bg-terracotta-50/80 px-4 py-3.5">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0 text-terracotta-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 6.5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-[12.5px] font-bold text-terracotta-800">
                  Ação irreversível — todos os dados serão apagados
                </p>
              </div>
              <p className="mb-2 text-[11.5px] leading-relaxed text-terracotta-700">
                Serão removidos permanentemente deste dispositivo:
              </p>
              <ul className="mb-3 space-y-0.5 pl-3">
                {["Perfil e nome do condomínio", "Datas operacionais (AVCB, seguro, manutenções)", "Pendências e próximos passos", "Eventos da agenda", "Histórico de ocorrências"].map((item) => (
                  <li key={item} className="text-[11px] text-terracotta-700 before:mr-1.5 before:content-['•']">{item}</li>
                ))}
              </ul>
              <p className="mb-3 text-[11px] font-semibold text-terracotta-700">
                Exporte um backup antes se quiser preservar os dados.
              </p>
              <input
                type="text"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder='Digite "APAGAR" para confirmar'
                autoComplete="off"
                className="mb-3 w-full rounded-xl border border-terracotta-200 bg-white px-3 py-1.5 text-[12.5px] text-navy-800 placeholder:text-navy-300 focus:border-terracotta-400 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={resetInput !== "APAGAR"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-600 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-all hover:bg-terracotta-700 active:scale-[0.97] disabled:bg-navy-200 disabled:text-navy-400"
                >
                  Apagar tudo
                </button>
                <button
                  type="button"
                  onClick={() => { setResetPhase("idle"); setResetInput(""); }}
                  className="rounded-full px-3 py-1.5 text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {resetPhase === "done" && (
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 flex-shrink-0 text-navy-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[12.5px] text-navy-700">
                Dados apagados. Você pode começar um novo condomínio.
              </p>
            </div>
          )}
        </div>

        {/* Aviso de quota de armazenamento */}
        {storageSizeKB !== null && storageSizeKB > 0 && (() => {
          const quota = getStorageQuotaStatus(storageSizeKB);
          if (quota.level === "ok") return null;
          const colors = {
            warn:     "border-amber-200/80 bg-amber-50/70 text-amber-800",
            danger:   "border-terracotta-200/80 bg-terracotta-50/70 text-terracotta-800",
            critical: "border-terracotta-300 bg-terracotta-100/80 text-terracotta-900",
          };
          return (
            <div className={`mx-5 mb-3 rounded-lg border px-3.5 py-2.5 ${colors[quota.level]}`}>
              <p className="text-[11.5px] font-medium leading-snug">{quota.message}</p>
              <p className="mt-0.5 text-[10.5px] opacity-80">{quota.usedKB} KB usados de ~{quota.maxKB} KB ({quota.pct}%)</p>
            </div>
          );
        })()}

        {/* Nota de privacidade + indicador de armazenamento */}
        <div className="border-t border-navy-50 px-5 py-2.5 space-y-0.5">
          <p className="text-[10.5px] text-navy-400">
            Os dados do condomínio ficam apenas neste dispositivo — a telemetria não inclui essas informações.
          </p>
          {storageSizeKB !== null && storageSizeKB > 0 && (
            <p className="text-[10.5px] text-navy-300">
              Dados armazenados: ~{storageSizeKB} KB
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
