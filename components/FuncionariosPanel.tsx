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
  getProfile,
  saveProfile,
  type FuncionarioFerias,
  type FeriasFuncionarioStatus,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = { onSaved?: () => void };

// ── DateOrUnknown: campo de data com opção "Não sei" ─────────────────────────
// Definido no nível do módulo para evitar re-identidade e o bug do teclado iPhone.

type DateOrUnknownProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

function DateOrUnknown({ label, value, onChange }: DateOrUnknownProps) {
  const [unknown, setUnknown] = useState(!value);

  const toggleUnknown = () => {
    const next = !unknown;
    setUnknown(next);
    if (next) onChange("");
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-medium text-navy-600">{label}</p>
        <button
          type="button"
          onClick={toggleUnknown}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 transition-all active:scale-95 ${
            unknown
              ? "bg-navy-100 text-navy-700 ring-navy-200"
              : "bg-white text-navy-400 ring-navy-150 hover:ring-navy-300"
          }`}
        >
          {unknown ? "Informar" : "Não sei"}
        </button>
      </div>
      {unknown ? (
        <div className="min-h-9 flex items-center rounded-xl border border-navy-100/60 bg-navy-50/40 px-3 py-1.5">
          <span className="text-[11px] text-navy-400">Não registrada</span>
        </div>
      ) : (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-9 w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none"
        />
      )}
    </div>
  );
}

// ── FuncForm: componente no nível do módulo (fora do FuncionariosPanel)
// Garantia de estabilidade de identidade — evita o bug do teclado no iPhone onde
// inputs re-montados a cada keystroke perdem o foco.
type FuncFormProps = {
  draftNome: string; setDraftNome: (v: string) => void;
  draftCargo: string; setDraftCargo: (v: string) => void;
  draftStatus: FeriasFuncionarioStatus; setDraftStatus: (v: FeriasFuncionarioStatus) => void;
  draftAdmissao: string; setDraftAdmissao: (v: string) => void;
  draftUltimasFerias: string; setDraftUltimasFerias: (v: string) => void;
  draftPeriodo: string; setDraftPeriodo: (v: string) => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
};

function FuncForm({
  draftNome, setDraftNome,
  draftCargo, setDraftCargo,
  draftStatus, setDraftStatus,
  draftAdmissao, setDraftAdmissao,
  draftUltimasFerias, setDraftUltimasFerias,
  draftPeriodo, setDraftPeriodo,
  isEditing, onSave, onCancel,
}: FuncFormProps) {
  return (
    <div className="mt-3 rounded-xl border border-navy-100 bg-navy-50/30 p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[11px] font-medium text-navy-600">Nome ou apelido</p>
          <input
            type="text"
            value={draftNome}
            onChange={(e) => setDraftNome(e.target.value)}
            placeholder="Ex: Porteiro, João"
            maxLength={60}
            autoComplete="off"
            className="min-h-9 w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-navy-600">Cargo / função</p>
          <input
            type="text"
            value={draftCargo}
            onChange={(e) => setDraftCargo(e.target.value)}
            placeholder="Ex: Zelador"
            maxLength={40}
            autoComplete="off"
            className="min-h-9 w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none"
          />
        </div>
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
      <div className="grid grid-cols-2 gap-2">
        <DateOrUnknown
          label="Data admissão"
          value={draftAdmissao}
          onChange={setDraftAdmissao}
        />
        <DateOrUnknown
          label="Última fruição férias"
          value={draftUltimasFerias}
          onChange={setDraftUltimasFerias}
        />
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium text-navy-600">Período aquisitivo (opcional)</p>
        <input
          type="text"
          value={draftPeriodo}
          onChange={(e) => setDraftPeriodo(e.target.value)}
          placeholder="Ex: jan/2024 – jan/2025"
          maxLength={40}
          autoComplete="off"
          className="min-h-9 w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!draftNome.trim()}
          className="rounded-xl bg-navy-700 px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
        >
          {isEditing ? "Atualizar" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 text-[11.5px] text-navy-400 hover:text-navy-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

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

// Calcula meses desde a última fruição de férias ou desde admissão
function mesesDesde(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

// Gera texto de contexto temporal para férias
function contextoFeriasLabel(f: FuncionarioFerias): string | null {
  if (f.ultimasFeriasGozo) {
    const m = mesesDesde(f.ultimasFeriasGozo);
    if (m === null) return null;
    if (m >= 12) return `Férias há ${m} meses — período aquisitivo acumulando`;
    if (m >= 10) return `Férias há ${m} meses — período aquisitivo a vencer`;
    return null;
  }
  if (f.dataAdmissao) {
    const m = mesesDesde(f.dataAdmissao);
    if (m === null) return null;
    if (m >= 14) return `Admitido há ${m} meses sem férias mapeadas`;
    if (m >= 12) return `Admitido há ${m} meses — férias a serem planejadas`;
  }
  return null;
}

// Avalia risco trabalhista individual
function riscoTrabalhista(f: FuncionarioFerias): { nivel: "alto" | "medio" | "baixo" | "ok"; texto: string } | null {
  if (f.status === "vencida") {
    return { nivel: "alto", texto: "Férias vencidas geram passivo trabalhista" };
  }
  if (f.status === "desconhecida") {
    return { nivel: "medio", texto: "Situação desconhecida — verificar com RH" };
  }
  if (f.ultimasFeriasGozo) {
    const m = mesesDesde(f.ultimasFeriasGozo);
    if (m !== null && m >= 14) {
      return { nivel: "alto", texto: `${m} meses sem férias — ação necessária` };
    }
  }
  if (f.dataAdmissao && !f.ultimasFeriasGozo) {
    const m = mesesDesde(f.dataAdmissao);
    if (m !== null && m >= 14) {
      return { nivel: "medio", texto: "Férias não mapeadas — verifique registro" };
    }
  }
  return null;
}

export default function FuncionariosPanel({ onSaved }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [funcionarios, setFuncionarios] = useState<FuncionarioFerias[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasPendencia, setHasPendencia] = useState(false);
  // Phase 13: nível 1 — perfil conhece a resposta de "tem funcionários?"
  const [hasFuncionariosProfile, setHasFuncionariosProfile] = useState<boolean | undefined>(undefined);

  const [draftNome, setDraftNome] = useState("");
  const [draftCargo, setDraftCargo] = useState("");
  const [draftStatus, setDraftStatus] = useState<FeriasFuncionarioStatus>("desconhecida");
  const [draftPeriodo, setDraftPeriodo] = useState("");
  const [draftAdmissao, setDraftAdmissao] = useState("");
  const [draftUltimasFerias, setDraftUltimasFerias] = useState("");
  const [draftObs, setDraftObs] = useState("");

  useEffect(() => {
    setFuncionarios(getFuncionarios());
    const pendencias = getPendenciasAbertas();
    setHasPendencia(pendencias.some((p) => p.origem === "funcionario" && p.matchedId === "ferias_geral"));
    const prof = getProfile();
    setHasFuncionariosProfile(prof?.hasFuncionarios);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const resetForm = () => {
    setDraftNome(""); setDraftCargo(""); setDraftStatus("desconhecida");
    setDraftPeriodo(""); setDraftAdmissao(""); setDraftUltimasFerias(""); setDraftObs("");
    setAdding(false); setEditingId(null);
  };

  const handleAdd = () => {
    if (!draftNome.trim()) return;
    const novo = addFuncionario({
      nomeFuncao: draftNome.trim(),
      cargo: draftCargo.trim() || undefined,
      status: draftStatus,
      periodoAquisitivo: draftPeriodo.trim() || undefined,
      dataAdmissao: draftAdmissao.trim() || undefined,
      ultimasFeriasGozo: draftUltimasFerias.trim() || undefined,
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
    setDraftCargo(f.cargo ?? "");
    setDraftStatus(f.status);
    setDraftPeriodo(f.periodoAquisitivo ?? "");
    setDraftAdmissao(f.dataAdmissao ?? "");
    setDraftUltimasFerias(f.ultimasFeriasGozo ?? "");
    setDraftObs(f.observacoes ?? "");
    setEditingId(id);
    setAdding(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !draftNome.trim()) return;
    updateFuncionario(editingId, {
      nomeFuncao: draftNome.trim(),
      cargo: draftCargo.trim() || undefined,
      status: draftStatus,
      periodoAquisitivo: draftPeriodo.trim() || undefined,
      dataAdmissao: draftAdmissao.trim() || undefined,
      ultimasFeriasGozo: draftUltimasFerias.trim() || undefined,
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

  const comRisco = funcionarios.filter((f) => riscoTrabalhista(f) !== null).length;

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    const subtitle = funcionarios.length === 0
      ? "Registre funcionários, férias e data de admissão — visão trabalhista básica"
      : funcionarios.length === 1
      ? `${funcionarios[0].nomeFuncao}${funcionarios[0].cargo ? ` (${funcionarios[0].cargo})` : ""} · ${STATUS_LABEL[funcionarios[0].status]}`
      : comRisco > 0
      ? `${funcionarios.length} funcionários · ${comRisco} com risco trabalhista`
      : `${funcionarios.length} funcionários · ${counts.em_dia} em dia`;

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
            <p className="text-[13px] font-medium text-navy-800">Funcionários</p>
            <p className="text-[11.5px] text-navy-400 truncate">{subtitle}</p>
          </div>
          {comRisco > 0 && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
          )}
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">
            {funcionarios.length === 0 ? "Registrar →" : "Ver →"}
          </span>
        </button>
      </section>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const isFormActive = adding || !!editingId;

  const funcFormProps: FuncFormProps = {
    draftNome, setDraftNome,
    draftCargo, setDraftCargo,
    draftStatus, setDraftStatus,
    draftAdmissao, setDraftAdmissao,
    draftUltimasFerias, setDraftUltimasFerias,
    draftPeriodo, setDraftPeriodo,
    isEditing: !!editingId,
    onSave: editingId ? handleSaveEdit : handleAdd,
    onCancel: resetForm,
  };

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy-800">Funcionários</p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Phase 13: nível 1 — triagem "tem funcionários?" */}
        {funcionarios.length === 0 && !isFormActive && hasFuncionariosProfile === undefined && (
          <div className="mb-3 rounded-[14px] border border-navy-100/60 bg-navy-50/50 px-4 py-3">
            <p className="text-[12.5px] font-semibold text-navy-800">Seu condomínio tem funcionários próprios?</p>
            <p className="mt-0.5 text-[11px] text-navy-500">Registrar funcionários ativa controle de férias e riscos trabalhistas.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex min-h-[36px] items-center rounded-full bg-navy-700 px-4 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.97]"
              >
                Sim, vou cadastrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const prof = getProfile();
                  saveProfile({ ...(prof ?? {}), hasFuncionarios: false });
                  setHasFuncionariosProfile(false);
                  setExpanded(false);
                  onSaved?.();
                }}
                className="inline-flex min-h-[36px] items-center rounded-full border border-navy-200 bg-white px-4 py-1.5 text-[12px] font-medium text-navy-600 transition-all hover:bg-navy-50 active:scale-[0.97]"
              >
                Não / Terceirizado
              </button>
            </div>
          </div>
        )}

        {/* Sem funcionários — perfil diz que não tem */}
        {funcionarios.length === 0 && !isFormActive && hasFuncionariosProfile === false && (
          <div className="mb-3 rounded-[14px] border border-navy-100/60 bg-navy-50/40 px-4 py-3">
            <p className="text-[12px] text-navy-600">Perfil indica que não há funcionários próprios.</p>
            <button
              type="button"
              onClick={() => {
                const prof = getProfile();
                saveProfile({ ...(prof ?? {}), hasFuncionarios: true });
                setHasFuncionariosProfile(true);
                onSaved?.();
              }}
              className="mt-1.5 text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600"
            >
              Mudou — agora tem funcionários
            </button>
          </div>
        )}

        {/* Nota de contexto — perfil diz que tem, nenhum cadastrado ainda */}
        {funcionarios.length === 0 && !isFormActive && hasFuncionariosProfile === true && (
          <div className="mb-3 rounded-xl bg-navy-50/60 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-navy-600">
              Registre data de admissão e histórico de férias. Férias vencidas há mais de 12 meses geram passivo trabalhista — o app avisa antes que vire problema.
            </p>
          </div>
        )}

        {/* Lista */}
        {funcionarios.length > 0 && (
          <div className="mb-3 space-y-2">
            {funcionarios.map((f) => {
              const risco = riscoTrabalhista(f);
              const contexto = contextoFeriasLabel(f);

              return (
                <div key={f.id} className={`rounded-xl border px-3 py-2.5 ${risco?.nivel === "alto" ? "border-terracotta-100 bg-terracotta-50/30" : "border-navy-50 bg-navy-50/30"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-navy-800 truncate">
                        {f.nomeFuncao}
                        {f.cargo && f.cargo !== f.nomeFuncao && (
                          <span className="ml-1.5 text-[11px] font-normal text-navy-400">({f.cargo})</span>
                        )}
                      </p>
                      {f.dataAdmissao && (
                        <p className="text-[10.5px] text-navy-400">
                          Desde {new Date(`${f.dataAdmissao}T00:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                        </p>
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

                  {/* Contexto temporal */}
                  {contexto && (
                    <p className="mt-1 text-[10.5px] text-amber-600">{contexto}</p>
                  )}

                  {/* Alerta de risco */}
                  {risco && (
                    <p className={`mt-0.5 text-[10.5px] font-medium ${risco.nivel === "alto" ? "text-terracotta-600" : "text-amber-600"}`}>
                      {risco.nivel === "alto" ? "⚠ " : "· "}{risco.texto}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form de edição */}
        {editingId && <FuncForm {...funcFormProps} />}

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
        {adding && <FuncForm {...funcFormProps} />}

        {hasPendencia && (counts.vencida > 0 || counts.desconhecida > 0) && (
          <p className="mt-3 text-[10.5px] text-amber-600">
            Próximo passo criado para verificar situação de férias.
          </p>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          Férias vencidas há mais de 12 meses geram passivo trabalhista. Registre as datas de admissão e última fruição para acompanhamento preventivo.
        </p>
      </div>
    </section>
  );
}
