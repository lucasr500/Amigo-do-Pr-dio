"use client";

import { useEffect, useState } from "react";
import {
  getFuncionarios,
  addFuncionario,
  updateFuncionario,
  deleteFuncionario,
  addPendencia,
  getPendenciasAbertas,
  addAuditEntry,
  type FuncionarioFerias,
  type FeriasFuncionarioStatus,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = { onSaved?: () => void };

const STATUS_LABEL: Record<FeriasFuncionarioStatus, string> = {
  em_dia:       "Em dia",
  a_vencer:     "A vencer",
  vencida:      "Vencidas",
  desconhecida: "Não sei",
};

const STATUS_BADGE: Record<FeriasFuncionarioStatus, string> = {
  em_dia:       "bg-navy-50 text-navy-600 ring-navy-100",
  a_vencer:     "bg-amber-50 text-amber-700 ring-amber-100",
  vencida:      "bg-terracotta-50 text-terracotta-700 ring-terracotta-100",
  desconhecida: "bg-navy-50 text-navy-400 ring-navy-100",
};

export default function FuncionariosPanel({ onSaved }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [funcionarios, setFuncionarios] = useState<FuncionarioFerias[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasPendencia, setHasPendencia] = useState(false);

  const [draftNome, setDraftNome] = useState("");
  const [draftStatus, setDraftStatus] = useState<FeriasFuncionarioStatus>("desconhecida");
  const [draftPeriodo, setDraftPeriodo] = useState("");
  const [draftObs, setDraftObs] = useState("");

  useEffect(() => {
    setFuncionarios(getFuncionarios());
    const pendencias = getPendenciasAbertas();
    setHasPendencia(pendencias.some((p) => p.origem === "funcionario" && p.matchedId === "ferias_geral"));
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const resetForm = () => {
    setDraftNome("");
    setDraftStatus("desconhecida");
    setDraftPeriodo("");
    setDraftObs("");
    setAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!draftNome.trim()) return;
    const novo = addFuncionario({
      nomeFuncao: draftNome.trim(),
      status: draftStatus,
      periodoAquisitivo: draftPeriodo.trim() || undefined,
      observacoes: draftObs.trim() || undefined,
    });
    const next = [...funcionarios, novo];
    setFuncionarios(next);
    void trackEvent("funcionario_added", { status: draftStatus });
    addAuditEntry({
      category: "funcionario",
      action: `Funcionário adicionado: ${draftNome.trim()}`,
      detail: STATUS_LABEL[draftStatus],
      impact: draftStatus === "em_dia" || draftStatus === "a_vencer" ? "positive" : "negative",
    });
    checkAndCreatePendencia(next);
    resetForm();
    onSaved?.();
  };

  const handleEdit = (id: string) => {
    const f = funcionarios.find((x) => x.id === id);
    if (!f) return;
    setDraftNome(f.nomeFuncao);
    setDraftStatus(f.status);
    setDraftPeriodo(f.periodoAquisitivo ?? "");
    setDraftObs(f.observacoes ?? "");
    setEditingId(id);
    setAdding(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !draftNome.trim()) return;
    updateFuncionario(editingId, {
      nomeFuncao: draftNome.trim(),
      status: draftStatus,
      periodoAquisitivo: draftPeriodo.trim() || undefined,
      observacoes: draftObs.trim() || undefined,
    });
    const next = getFuncionarios();
    setFuncionarios(next);
    checkAndCreatePendencia(next);
    resetForm();
    onSaved?.();
  };

  const handleDelete = (id: string) => {
    deleteFuncionario(id);
    setFuncionarios(getFuncionarios());
  };

  const checkAndCreatePendencia = (list: FuncionarioFerias[]) => {
    const hasIssue = list.some((f) => f.status === "vencida" || f.status === "desconhecida");
    if (hasIssue && !hasPendencia) {
      addPendencia({
        titulo: "Verificar situação de férias dos funcionários",
        categoria: "funcionarios",
        origem: "funcionario",
        matchedId: "ferias_geral",
      });
      void trackEvent("pendencia_created_from_funcionario", {});
      setHasPendencia(true);
    }
  };

  const counts = {
    em_dia: funcionarios.filter((f) => f.status === "em_dia").length,
    a_vencer: funcionarios.filter((f) => f.status === "a_vencer").length,
    vencida: funcionarios.filter((f) => f.status === "vencida").length,
    desconhecida: funcionarios.filter((f) => f.status === "desconhecida").length,
  };

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    const subtitle = funcionarios.length === 0
      ? "Registre funcionários e situação de férias — pode ser simples"
      : funcionarios.length === 1
      ? `${funcionarios[0].nomeFuncao} · ${STATUS_LABEL[funcionarios[0].status]}`
      : `${funcionarios.length} funcionários · ${counts.em_dia} em dia · ${counts.vencida + counts.desconhecida} a verificar`;

    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]" aria-hidden="true">
            👷
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">Funcionários e férias</p>
            <p className="text-[11.5px] text-navy-400">{subtitle}</p>
          </div>
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">
            {funcionarios.length === 0 ? "Registrar →" : "Ver →"}
          </span>
        </button>
      </section>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const isFormActive = adding || !!editingId;

  const FuncForm = () => (
    <div className="mt-3 rounded-xl border border-navy-100 bg-navy-50/30 p-3 space-y-2.5">
      <div>
        <p className="mb-1 text-[11px] font-medium text-navy-600">Nome ou função</p>
        <input
          type="text"
          value={draftNome}
          onChange={(e) => setDraftNome(e.target.value)}
          placeholder="Ex: Porteiro, Zeladora, João"
          maxLength={60}
          className="min-h-9 w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none"
        />
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium text-navy-600">Situação das férias</p>
        <div className="flex flex-wrap gap-1.5">
          {(["em_dia", "a_vencer", "vencida", "desconhecida"] as FeriasFuncionarioStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setDraftStatus(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                draftStatus === s
                  ? "bg-navy-700 text-white ring-navy-700"
                  : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium text-navy-600">Período aquisitivo (opcional)</p>
        <input
          type="text"
          value={draftPeriodo}
          onChange={(e) => setDraftPeriodo(e.target.value)}
          placeholder="Ex: jan/2023 – jan/2024"
          maxLength={40}
          className="min-h-9 w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={editingId ? handleSaveEdit : handleAdd}
          disabled={!draftNome.trim()}
          className="rounded-xl bg-navy-700 px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
        >
          {editingId ? "Atualizar" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="px-2 text-[11.5px] text-navy-400 hover:text-navy-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy-800">Funcionários e férias</p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {funcionarios.length === 0 && !isFormActive && (
          <div className="mb-3 rounded-xl bg-navy-50/60 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-navy-600">
              Registre os funcionários e a situação das férias de cada um. Pode usar apenas a função, sem nome completo. Se não souber, marque &ldquo;Não sei&rdquo; — o app cria um lembrete.
            </p>
          </div>
        )}

        {/* Lista */}
        {funcionarios.length > 0 && (
          <div className="mb-3 space-y-2">
            {funcionarios.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-navy-50 bg-navy-50/30 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-navy-800 truncate">{f.nomeFuncao}</p>
                  {f.periodoAquisitivo && (
                    <p className="text-[10.5px] text-navy-400">{f.periodoAquisitivo}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium ring-1 ${STATUS_BADGE[f.status]}`}>
                    {STATUS_LABEL[f.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEdit(f.id)}
                    className="text-[10.5px] text-navy-400 hover:text-navy-600"
                  >
                    editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="text-[10.5px] text-terracotta-500 hover:text-terracotta-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form de edição */}
        {editingId && <FuncForm />}

        {/* Botão adicionar / form novo */}
        {!isFormActive && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-navy-500 hover:text-navy-700"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Adicionar funcionário
          </button>
        )}
        {adding && <FuncForm />}

        {hasPendencia && (counts.vencida > 0 || counts.desconhecida > 0) && (
          <p className="mt-3 text-[10.5px] text-amber-600">
            Pendência criada para verificar situação de férias.
          </p>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          Férias vencidas podem gerar passivo trabalhista. Se não souber a situação, marque &ldquo;Não sei&rdquo; para criar um lembrete.
        </p>
      </div>
    </section>
  );
}
