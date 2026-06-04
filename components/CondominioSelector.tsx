"use client";

import { useEffect, useState, useRef } from "react";
import {
  getAllCondominios,
  getActiveCondominioId,
  getPortfolioStats,
  switchCondominio,
  addCondominio,
  deleteCondominio,
  updateCondominioNome,
  type CondominioMeta,
  type CondominioQuickStats,
} from "@/lib/condominios";

// ─── Health badge ─────────────────────────────────────────────────────────────

const HEALTH_COLOR: Record<string, string> = {
  "critico":         "text-terracotta-600 bg-terracotta-50 ring-terracotta-200",
  "atencao":         "text-amber-700 bg-amber-50 ring-amber-200",
  "em-evolucao":     "text-teal-600 bg-teal-50 ring-teal-200",
  "bem-acompanhado": "text-navy-600 bg-navy-50 ring-navy-200",
  "tudo-em-ordem":   "text-teal-700 bg-teal-50 ring-teal-200",
};

const HEALTH_LABEL: Record<string, string> = {
  "critico":         "Crítico",
  "atencao":         "Atenção",
  "em-evolucao":     "Em evolução",
  "bem-acompanhado": "Bem acompanhado",
  "tudo-em-ordem":   "Em ordem",
};

function HealthBadge({ score, statusKey }: { score: number | null; statusKey: string | null }) {
  if (score === null) {
    return (
      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-400 ring-1 ring-navy-100">
        Sem dados
      </span>
    );
  }
  const key = statusKey ?? "sem-dados";
  const colorClass = HEALTH_COLOR[key] ?? "text-navy-500 bg-navy-50 ring-navy-200";
  const label = HEALTH_LABEL[key] ?? key;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${colorClass}`}>
      {score}% · {label}
    </span>
  );
}

// ─── Portfolio summary card ───────────────────────────────────────────────────

function PortfolioSummary({ stats }: { stats: CondominioQuickStats[] }) {
  if (stats.length <= 1) return null;

  const withScores  = stats.filter((s) => s.healthScore !== null);
  const avgScore    = withScores.length > 0
    ? Math.round(withScores.reduce((sum, s) => sum + (s.healthScore ?? 0), 0) / withScores.length)
    : null;
  const totalVencidas = stats.reduce((sum, s) => sum + s.pendenciasVencidas, 0);
  const totalAbertas  = stats.reduce((sum, s) => sum + s.pendenciasAbertas, 0);
  const criticos      = stats.filter((s) => s.healthStatusKey === "critico").length;

  return (
    <div className="mx-5 mb-4 rounded-[16px] border border-navy-100/70 bg-navy-50/50 px-4 py-3">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
        Carteira — {stats.length} condomínios
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white px-2.5 py-2 text-center">
          <p className="text-[18px] font-bold leading-none text-navy-800">{avgScore ?? "—"}{avgScore !== null ? "%" : ""}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-navy-400">média saúde</p>
        </div>
        <div className={`rounded-xl px-2.5 py-2 text-center ${totalVencidas > 0 ? "bg-terracotta-50" : "bg-white"}`}>
          <p className={`text-[18px] font-bold leading-none ${totalVencidas > 0 ? "text-terracotta-700" : "text-navy-800"}`}>
            {totalVencidas}
          </p>
          <p className={`mt-0.5 text-[10px] leading-snug ${totalVencidas > 0 ? "text-terracotta-500" : "text-navy-400"}`}>
            vencidas
          </p>
        </div>
        <div className={`rounded-xl px-2.5 py-2 text-center ${criticos > 0 ? "bg-terracotta-50" : "bg-white"}`}>
          <p className={`text-[18px] font-bold leading-none ${criticos > 0 ? "text-terracotta-700" : "text-navy-800"}`}>
            {totalAbertas}
          </p>
          <p className={`mt-0.5 text-[10px] leading-snug ${criticos > 0 ? "text-terracotta-500" : "text-navy-400"}`}>
            pendentes
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CondominioSelector({ isOpen, onClose }: Props) {
  const [condos,        setCondos]        = useState<CondominioMeta[]>([]);
  const [stats,         setStats]         = useState<CondominioQuickStats[]>([]);
  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [editingName,   setEditingName]   = useState("");
  const [addingNew,     setAddingNew]     = useState(false);
  const [newName,       setNewName]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [switching,     setSwitching]     = useState<string | null>(null);
  const [hydrated,      setHydrated]      = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCondos(getAllCondominios());
    setStats(getPortfolioStats());
    setActiveId(getActiveCondominioId());
    setHydrated(true);
  }, [isOpen]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (addingNew && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [addingNew]);

  if (!isOpen) return null;

  function handleSwitch(targetId: string) {
    if (targetId === activeId) { onClose(); return; }
    setSwitching(targetId);
    const switched = switchCondominio(targetId);
    if (switched) {
      setTimeout(() => window.location.reload(), 150);
    } else {
      setSwitching(null);
    }
  }

  function handleStartEdit(condo: CondominioMeta) {
    setEditingId(condo.id);
    setEditingName(condo.nome);
  }

  function handleSaveName(id: string) {
    if (editingName.trim()) {
      updateCondominioNome(id, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
    setCondos(getAllCondominios());
    setStats(getPortfolioStats());
  }

  function handleAddCondominio() {
    if (!newName.trim()) return;
    const created = addCondominio(newName.trim());
    setAddingNew(false);
    setNewName("");
    setSwitching(created.id);
    setTimeout(() => window.location.reload(), 150);
  }

  function handleDelete(id: string) {
    if (condos.length <= 1) return;
    deleteCondominio(id);
    if (id === activeId) {
      setTimeout(() => window.location.reload(), 100);
      return;
    }
    setCondos(getAllCondominios());
    setStats(getPortfolioStats());
    setConfirmDelete(null);
  }

  if (!hydrated) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-[440px] rounded-t-[24px] bg-[#F7F1E8] p-6 sm:rounded-[24px]">
          <div className="h-32 animate-pulse rounded-xl bg-navy-100/60" />
        </div>
      </div>
    );
  }

  const isLoading = switching !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" aria-modal="true">
      <div
        className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[440px] rounded-t-[24px] bg-[#F7F1E8] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-5 shadow-2xl sm:rounded-[24px]">

        {/* Drag handle (mobile) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-navy-200/60" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 sm:px-6">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Seus condomínios
            </p>
            <p className="mt-0.5 font-display text-[18px] font-semibold leading-snug text-navy-800">
              {condos.length === 1 ? "Carteira" : `${condos.length} prédios`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full p-2 text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-600 disabled:opacity-40"
            aria-label="Fechar"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Portfolio summary */}
        <PortfolioSummary stats={stats} />

        {/* Condominium list */}
        <div className="max-h-[55vh] overflow-y-auto px-5 sm:px-6">
          <div className="space-y-2.5 pb-3">
            {condos.map((condo) => {
              const stat    = stats.find((s) => s.condominioId === condo.id);
              const isActive  = condo.id === activeId;
              const isSwitching = switching === condo.id;
              const isConfirming = confirmDelete === condo.id;

              return (
                <div
                  key={condo.id}
                  className={`rounded-[18px] border shadow-sm transition-all ${
                    isActive
                      ? "border-navy-200 bg-white"
                      : "border-navy-100/70 bg-white/80"
                  }`}
                >
                  <div className="px-4 py-3.5">
                    {/* Nome + edição */}
                    {editingId === condo.id ? (
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName(condo.id);
                            if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                          }}
                          maxLength={60}
                          className="min-h-9 flex-1 rounded-xl border border-navy-200 bg-navy-50/40 px-3 py-1.5 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveName(condo.id)}
                          className="rounded-full bg-navy-700 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-navy-800"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditingName(""); }}
                          className="text-[11px] text-navy-400 hover:text-navy-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {isActive && (
                            <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                          )}
                          <p className="truncate text-[13.5px] font-semibold text-navy-800">
                            {condo.nome || <span className="italic text-navy-400">Sem nome</span>}
                          </p>
                          {isActive && (
                            <span className="flex-shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-600 ring-1 ring-teal-200">
                              Ativo
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(condo)}
                          disabled={isLoading}
                          className="flex-shrink-0 rounded-lg p-1 text-navy-300 hover:bg-navy-50 hover:text-navy-500 disabled:opacity-40"
                          aria-label="Editar nome"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Health badge + pending */}
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      <HealthBadge score={stat?.healthScore ?? null} statusKey={stat?.healthStatusKey ?? null} />
                      {(stat?.pendenciasAbertas ?? 0) > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                          (stat?.pendenciasVencidas ?? 0) > 0
                            ? "bg-terracotta-50 text-terracotta-600 ring-terracotta-200"
                            : "bg-navy-50 text-navy-500 ring-navy-200"
                        }`}>
                          {stat?.pendenciasAbertas} pend.
                          {(stat?.pendenciasVencidas ?? 0) > 0 && ` · ${stat?.pendenciasVencidas} vencida${(stat?.pendenciasVencidas ?? 0) > 1 ? "s" : ""}`}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {!isConfirming ? (
                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSwitch(condo.id)}
                            disabled={isLoading}
                            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40 ${
                              isSwitching
                                ? "bg-teal-600 text-white"
                                : "bg-navy-700 text-white hover:bg-navy-800"
                            }`}
                          >
                            {isSwitching ? "Ativando…" : "Ativar"}
                          </button>
                        )}
                        {condos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(condo.id)}
                            disabled={isLoading}
                            className="text-[11px] text-navy-300 hover:text-terracotta-500 disabled:opacity-40"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-[11.5px] text-terracotta-700 font-medium">Remover este condomínio?</p>
                        <button
                          type="button"
                          onClick={() => handleDelete(condo.id)}
                          className="rounded-full bg-terracotta-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-terracotta-700"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="text-[11px] text-navy-400 hover:text-navy-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Adicionar novo condomínio */}
          {!addingNew ? (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              disabled={isLoading}
              className="flex w-full items-center gap-2.5 rounded-[16px] border border-dashed border-navy-200 px-4 py-3 text-left transition-colors hover:border-navy-300 hover:bg-white/60 active:scale-[0.99] disabled:opacity-40"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-600 text-[14px]" aria-hidden="true">+</span>
              <p className="text-[12.5px] font-medium text-navy-600">Adicionar condomínio</p>
            </button>
          ) : (
            <div className="rounded-[16px] border border-teal-200/80 bg-teal-50/60 px-4 py-3.5">
              <p className="mb-2 text-[12.5px] font-semibold text-navy-800">Nome do novo condomínio</p>
              <input
                ref={addInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCondominio();
                  if (e.key === "Escape") { setAddingNew(false); setNewName(""); }
                }}
                placeholder="Ex: Residencial das Flores"
                maxLength={60}
                className="mb-3 min-h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-teal-400 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCondominio}
                  disabled={!newName.trim()}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.97] disabled:bg-navy-200 disabled:text-navy-400"
                >
                  Criar e ativar
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingNew(false); setNewName(""); }}
                  className="text-[11px] text-navy-400 hover:text-navy-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
