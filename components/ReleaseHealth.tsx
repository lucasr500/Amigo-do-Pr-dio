"use client";

import { useEffect, useState } from "react";
import {
  getStorageSizeKB,
  getPendencias,
  getOcorrencias,
  getLastBackupAt,
  getHealthHistory,
  getMovimentacoes,
  SESSION_SCHEMA_VERSION,
  PENDENCIAS_LIMIT,
  OCORRENCIAS_LIMIT,
} from "@/lib/session";
import {
  getAllCondominios,
  getActiveCondominioId,
  getPortfolioStorageKB,
} from "@/lib/condominios";
import { getSyncStatus } from "@/lib/sync/syncStatus";
import { isEnabled } from "@/lib/feature-flags";
import { isPushSupported, getStoredSubscription } from "@/lib/push/pushManager";

const APP_VERSION = "0.1.0";

type Metric = { label: string; value: string; warn?: boolean; mono?: boolean };

function getAuthState(): "guest" | "autenticado" {
  if (typeof window === "undefined") return "guest";
  try {
    const raw = localStorage.getItem("amigo_sb_session");
    if (!raw) return "guest";
    const s = JSON.parse(raw) as Record<string, unknown>;
    return s?.access_token ? "autenticado" : "guest";
  } catch { return "guest"; }
}

function formatAge(isoOrNull: string | null): string {
  if (!isoOrNull) return "nunca";
  const days = Math.floor((Date.now() - new Date(isoOrNull).getTime()) / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "1 dia atrás";
  return `${days} dias atrás`;
}

export default function ReleaseHealth() {
  const [expanded,  setExpanded]  = useState(false);
  const [metrics,   setMetrics]   = useState<Metric[]>([]);
  const [swStatus,  setSwStatus]  = useState<string>("verificando…");
  const [hydrated,  setHydrated]  = useState(false);
  const [copyDone,  setCopyDone]  = useState(false);

  useEffect(() => {
    async function load() {
      const storageKB    = getStorageSizeKB();
      const pendTotal    = getPendencias().length;
      const ocorrTotal   = getOcorrencias().length;
      const finTotal     = getMovimentacoes().length;
      const lastBackup   = getLastBackupAt();
      const historyDays  = getHealthHistory().length;
      const syncStatus   = getSyncStatus();
      const syncEnabled  = isEnabled("sync_enabled");
      const cloudEnabled = isEnabled("cloud_backup_enabled");
      const authEnabled  = isEnabled("auth_enabled");
      const authState    = getAuthState();
      const pushSupported= isPushSupported();
      const hasSub       = getStoredSubscription() !== null;
      const permission   = pushSupported && "Notification" in window ? Notification.permission : "n/a";

      let swReg = "não registrado";
      try {
        const reg = await navigator.serviceWorker?.getRegistration("/sw.js");
        swReg = reg ? "registrado" : "não registrado";
      } catch { swReg = "erro"; }
      setSwStatus(swReg);

      const backupAge = lastBackup
        ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000)
        : null;

      const syncState = syncEnabled
        ? syncStatus.state === "synced" ? `Ativo · ${formatAge(syncStatus.lastSyncAt)}`
        : `Ativo · ${syncStatus.state}`
        : "Desativado";

      const condos      = getAllCondominios();
      const activeId    = getActiveCondominioId();
      const activeCondo = condos.find((c) => c.id === activeId);
      const snapshotKB  = getPortfolioStorageKB();

      const computed: Metric[] = [
        { label: "Versão do app",         value: `v${APP_VERSION}` },
        { label: "Schema dos dados",       value: `v${SESSION_SCHEMA_VERSION}` },
        {
          label: "Condomínios",
          value: `${condos.length} total · ativo: ${activeCondo?.nome || activeId?.slice(0, 12) || "?"}`,
        },
        { label: "Storage (ativo)",        value: storageKB > 0 ? `${storageKB} KB` : "< 1 KB" },
        { label: "Storage (snapshots)",    value: snapshotKB > 0 ? `${snapshotKB} KB` : "< 1 KB" },
        {
          label: "Pendências",
          value: `${pendTotal} / ${PENDENCIAS_LIMIT}`,
          warn: pendTotal >= 40,
        },
        {
          label: "Ocorrências",
          value: `${ocorrTotal} / ${OCORRENCIAS_LIMIT}`,
          warn: ocorrTotal >= 65,
        },
        {
          label: "Movimentações financeiras",
          value: `${finTotal} lançamentos`,
        },
        {
          label: "Histórico de saúde",
          value: `${historyDays} dias`,
        },
        {
          label: "Backup local",
          value: backupAge === null ? "nunca" : backupAge === 0 ? "hoje" : `${backupAge} dias atrás`,
          warn: backupAge === null || backupAge > 14,
        },
        {
          label: "Auth",
          value: `${authState} · flag ${authEnabled ? "ativo" : "inativo"}`,
        },
        {
          label: "Cloud backup",
          value: cloudEnabled ? "habilitado" : "desabilitado",
        },
        {
          label: "Auto-sync",
          value: syncState,
        },
        {
          label: "Push",
          value: `${pushSupported ? "suportado" : "não suportado"} · permissão ${permission} · sub ${hasSub ? "ativa" : "inativa"}`,
        },
        {
          label: "Service worker",
          value: swReg,
          warn: swReg !== "registrado",
          mono: true,
        },
      ];

      setMetrics(computed);
      setHydrated(true);
    }
    void load();
  }, []);

  async function handleCopyDiagnostic() {
    const lines: string[] = [
      "DIAGNÓSTICO TÉCNICO — Amigo do Prédio",
      `Data: ${new Date().toISOString()}`,
      "",
      ...metrics.map((m) => `${m.label}: ${m.value}`),
      `SW: ${swStatus}`,
      `Schema migração: ${localStorage.getItem("amigo_condominios") ? "multi-condo ativo" : "pendente"}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  if (!hydrated) return null;

  return (
    <div className="px-5 pb-3 sm:px-6">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[16px] border border-navy-100/70 bg-white/80 px-4 py-3 text-left shadow-sm transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50 text-[13px]" aria-hidden="true">
            🔍
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-navy-800">Diagnóstico técnico</p>
            <p className="text-[11px] text-navy-400">v{APP_VERSION} · schema v{SESSION_SCHEMA_VERSION}</p>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <div className="rounded-[18px] border border-navy-100/80 bg-white/90 px-4 py-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-navy-800">Diagnóstico técnico</p>
              <p className="text-[10.5px] text-navy-400">v{APP_VERSION} · schema v{SESSION_SCHEMA_VERSION}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-[11.5px] text-navy-400 hover:text-navy-600"
            >
              Fechar
            </button>
          </div>

          <div className="space-y-1.5 mb-3">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2 ${
                  m.warn ? "bg-amber-50/60" : "bg-navy-50/40"
                }`}
              >
                <p className="text-[11.5px] text-navy-600 flex-shrink-0">{m.label}</p>
                <p
                  className={`text-right text-[11px] leading-snug ${
                    m.mono ? "font-mono" : "font-medium"
                  } ${m.warn ? "text-amber-700" : "text-navy-600"}`}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyDiagnostic}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.97]"
            >
              {copyDone ? "Copiado!" : "Copiar diagnóstico"}
            </button>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-navy-300">
            Painel interno — nenhum dado pessoal ou conteúdo do usuário é incluído.
          </p>
        </div>
      )}
    </div>
  );
}
