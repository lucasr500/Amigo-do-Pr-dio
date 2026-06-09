"use client";

import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";
import { formatLastSync } from "@/lib/sync/syncStatus";

type Props = {
  remoteMeta: RemoteSnapshotMeta;
  localExportedAt?: string | null;
  condominioName?: string | null;
  onKeepLocal: () => void;
  onRestoreRemote: () => void;
  disabled?: boolean;
};

export default function SyncConflictDialog({
  remoteMeta,
  localExportedAt,
  condominioName,
  onKeepLocal,
  onRestoreRemote,
  disabled = false,
}: Props) {
  const remoteLabel = remoteMeta.updatedAt
    ? formatLastSync(remoteMeta.updatedAt)
    : "Data desconhecida";
  const localLabel = localExportedAt
    ? formatLastSync(localExportedAt)
    : "Dados locais";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-sm rounded-3xl border border-navy-100 bg-white p-5 shadow-elevated">
        {/* Ícone */}
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50">
            <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 3L2 16h16L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 9v3M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <h2 id="conflict-title" className="text-[15px] font-semibold text-navy-800">
            Versões diferentes encontradas
          </h2>
        </div>

        <p className="mb-4 text-[12.5px] leading-relaxed text-navy-500">
          Encontramos dados diferentes neste dispositivo e na nuvem.
          {condominioName && (
            <span className="font-semibold text-navy-700"> {condominioName}.</span>
          )}{" "}
          Escolha qual versão manter — a outra será descartada.
        </p>

        {/* Comparativo */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-navy-100 bg-navy-50/60 px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Este dispositivo
            </p>
            <p className="mt-1 text-[12px] font-semibold text-navy-700">{localLabel}</p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500">
              Nuvem
            </p>
            <p className="mt-1 text-[12px] font-semibold text-teal-700">{remoteLabel}</p>
            {remoteMeta.version != null && (
              <p className="text-[10px] text-teal-500">v{remoteMeta.version}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onKeepLocal}
            disabled={disabled}
            className="min-h-11 w-full rounded-2xl bg-navy-800 px-4 text-[13px] font-semibold text-white transition-all hover:bg-navy-900 active:scale-[0.98] disabled:opacity-50"
          >
            Manter este dispositivo
          </button>
          <button
            type="button"
            onClick={onRestoreRemote}
            disabled={disabled}
            className="min-h-11 w-full rounded-2xl border border-teal-200 bg-teal-50 px-4 text-[13px] font-semibold text-teal-700 transition-all hover:bg-teal-100 active:scale-[0.98] disabled:opacity-50"
          >
            Restaurar da nuvem
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-navy-400">
          Esta ação não pode ser desfeita. Os dados da opção não escolhida serão perdidos.
        </p>
      </div>
    </div>
  );
}
