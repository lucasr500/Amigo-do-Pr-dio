"use client";

import { useRef, useState } from "react";
import { exportUserData, importUserData, parseAndValidateUserData, ImportResult } from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  onImported?: () => void;
};

type ImportState =
  | { phase: "idle" }
  | { phase: "confirming"; summary: Extract<ImportResult, { success: true }>["summary"]; raw: string }
  | { phase: "success"; nomeCondominio?: string }
  | { phase: "error"; message: string };

export default function BackupPanel({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ phase: "idle" });

  const handleExport = () => {
    exportUserData();
    void trackEvent("backup_exported");
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

  const handleReset = () => {
    setImportState({ phase: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            Seus dados ficam salvos neste dispositivo. Exporte para protegê-los ou
            transferi-los para outro aparelho.
          </p>
        </div>

        <div className="mx-5 border-t border-navy-50" />

        <div className="px-5 py-3.5 space-y-3">

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
              <p className="text-[11px] text-navy-400">Salva um arquivo .json no seu dispositivo</p>
            </div>
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

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
              </p>
              <p className="text-[11px] text-amber-600 mb-3">
                Os dados atuais do dispositivo serão substituídos.
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
            <div className="rounded-xl border border-sage-200 bg-sage-50/60 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 flex-shrink-0 text-sage-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[12.5px] font-semibold text-sage-800">
                    Dados restaurados
                  </p>
                  {importState.nomeCondominio && (
                    <p className="text-[11px] text-sage-600">
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

        {/* Nota de privacidade */}
        <div className="border-t border-navy-50 px-5 py-2.5">
          <p className="text-[10.5px] text-navy-400">
            Os dados ficam apenas no seu dispositivo — nada é enviado a servidores nesta versão.
          </p>
        </div>
      </div>
    </section>
  );
}
