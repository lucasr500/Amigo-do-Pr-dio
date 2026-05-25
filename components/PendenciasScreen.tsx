"use client";

import { useEffect, useState } from "react";
import {
  getPendencias,
  addPendencia,
  completePendencia,
  deletePendencia,
  logInteraction,
  type Pendencia,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

// ─── Priority helpers ─────────────────────────────────────────────────────────

function getPriority(p: Pendencia): "Alta" | "Média" | null {
  if (p.origem === "guidance") return "Alta";
  if (p.origem === "response" || p.origem === "memoria" || p.origem === "ocorrencia") return "Média";
  return null;
}

const PRIORITY_STYLE: Record<"Alta" | "Média", string> = {
  Alta:  "bg-green-100 text-green-700",
  Média: "bg-amber-100 text-amber-700",
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  multas: "⚖️", obras: "🏗️", assembleias: "👥", inadimplencia: "💰",
  cobranca: "📑", funcionarios: "👤", trabalhista: "📋", convencao: "📖",
  locacao: "🔑", lgpd: "🔒", responsabilidade: "⚠️", gestao: "📊",
  financeiro: "💳", "areas-comuns": "🏢", manutencao: "🔧",
  operacional: "📋", documentacao: "📄", convivencia: "🤝",
  fornecedor: "🛠️", juridico: "⚖️",
};

function getIcon(p: Pendencia): string {
  if (p.categoria && CATEGORY_ICONS[p.categoria]) return CATEGORY_ICONS[p.categoria];
  if (p.origem === "guidance") return "🔔";
  if (p.origem === "response") return "📝";
  if (p.origem === "agenda") return "📅";
  if (p.origem === "ocorrencia") return "📋";
  return "📌";
}

// ─── Subtitle helpers ─────────────────────────────────────────────────────────

const ORIGEM_SUBTITLE: Partial<Record<NonNullable<Pendencia["origem"]>, string>> = {
  response:   "Gerado pelo assistente",
  guidance:   "Alerta operacional",
  memoria:    "Dado do condomínio",
  ocorrencia: "Vinculado a ocorrência",
  manual:     "Criado por você",
  agenda:     "Vinculado à agenda",
  revisao:    "Da revisão mensal",
};

function getSubtitle(p: Pendencia): string {
  return (p.origem && ORIGEM_SUBTITLE[p.origem]) ?? "Próximo passo";
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Due date badge ───────────────────────────────────────────────────────────

type DueBadge = { label: string; style: string; overdue: boolean };

function getDueBadge(dueDate: string): DueBadge {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T12:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  const overdueStyle = "bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-200/60";
  const urgentStyle  = "bg-amber-50 text-amber-600 ring-1 ring-amber-200/60";
  const neutralStyle = "bg-navy-50 text-navy-400 ring-1 ring-navy-100/60";

  if (diffDays === -1) return { label: "Vencida ontem",                        style: overdueStyle, overdue: true };
  if (diffDays < 0)   return { label: `Vencida há ${Math.abs(diffDays)} dias`, style: overdueStyle, overdue: true };
  if (diffDays === 0) return { label: "Vence hoje",                            style: overdueStyle, overdue: false };
  if (diffDays === 1) return { label: "Vence amanhã",                          style: urgentStyle,  overdue: false };
  if (diffDays <= 7)  return { label: `Em ${diffDays} dias`,                   style: urgentStyle,  overdue: false };
  return { label: formatDateShort(dueDate), style: neutralStyle, overdue: false };
}

// ─── Sorting by urgency ───────────────────────────────────────────────────────

function sortByUrgency(list: Pendencia[]): Pendencia[] {
  return [...list].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

// ─── Form categories ──────────────────────────────────────────────────────────

const FORM_CATEGORIES = [
  { label: "Operacional",  value: "operacional" },
  { label: "Manutenção",   value: "manutencao" },
  { label: "Documentação", value: "documentacao" },
  { label: "Financeiro",   value: "financeiro" },
  { label: "Assembleia",   value: "assembleias" },
  { label: "Convivência",  value: "convivencia" },
  { label: "Fornecedor",   value: "fornecedor" },
  { label: "Jurídico",     value: "juridico" },
];

// ─── Filters ──────────────────────────────────────────────────────────────────

const FILTERS = ["Todas", "Vencidas", "Esta semana", "Sem prazo", "Concluídas"] as const;
type FilterKey = (typeof FILTERS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onBack?: () => void;
  initialTab?: string;
};

export default function PendenciasScreen({ refreshKey, onBack, initialTab }: Props) {
  const initialFilter: FilterKey =
    initialTab === "Concluídas" ? "Concluídas" : "Todas";

  const [activeFilter, setActiveFilter] = useState<FilterKey>(initialFilter);
  const [all, setAll]                   = useState<Pendencia[]>([]);
  const [hydrated, setHydrated]         = useState(false);

  // Form state
  const [showForm,        setShowForm]        = useState(false);
  const [formTitulo,      setFormTitulo]      = useState("");
  const [formCategoria,   setFormCategoria]   = useState("operacional");
  const [formDueDate,     setFormDueDate]     = useState("");
  const [formError,       setFormError]       = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setAll(getPendencias());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return null;

  const abertas = all.filter((p) => p.status === "aberta");
  const concluidas = all
    .filter((p) => p.status === "concluida")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 12);

  const todayStr    = new Date().toISOString().slice(0, 10);
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const vencidas   = abertas.filter((p) => !!p.dueDate && p.dueDate < todayStr);
  const estaSemana = abertas.filter((p) => !!p.dueDate && p.dueDate >= todayStr && p.dueDate <= nextWeekStr);
  const semPrazo   = abertas.filter((p) => !p.dueDate);

  const filterCounts: Record<FilterKey, number> = {
    Todas:          abertas.length,
    Vencidas:       vencidas.length,
    "Esta semana":  estaSemana.length,
    "Sem prazo":    semPrazo.length,
    Concluídas:     concluidas.length,
  };

  function getDisplayItems(): Pendencia[] {
    switch (activeFilter) {
      case "Todas":        return sortByUrgency(abertas);
      case "Vencidas":     return sortByUrgency(vencidas);
      case "Esta semana":  return sortByUrgency(estaSemana);
      case "Sem prazo":    return semPrazo;
      case "Concluídas":   return concluidas;
    }
  }

  const displayItems = getDisplayItems();

  function handleComplete(id: string) {
    const p = all.find((x) => x.id === id);
    completePendencia(id);
    logInteraction("pendencia-concluida", id);
    void trackEvent("pendencia_completed", {
      categoria:  p?.categoria ?? null,
      origem:     p?.origem ?? null,
      matched_id: p?.matchedId ?? null,
    });
    setAll(getPendencias());
  }

  function handleDelete(id: string, hasDueDate: boolean) {
    deletePendencia(id);
    void trackEvent("pendencia_deleted_manual", { has_due_date: hasDueDate });
    setConfirmDeleteId(null);
    setAll(getPendencias());
  }

  function handleSave() {
    if (!formTitulo.trim()) {
      setFormError("O título é obrigatório.");
      return;
    }
    addPendencia({
      titulo:    formTitulo.trim(),
      categoria: formCategoria,
      origem:    "manual",
      dueDate:   formDueDate || undefined,
    });
    void trackEvent("pendencia_created_manual", {
      category:     formCategoria,
      has_due_date: !!formDueDate,
    });
    setAll(getPendencias());
    setFormTitulo("");
    setFormCategoria("operacional");
    setFormDueDate("");
    setFormError("");
    setShowForm(false);
  }

  function handleCancelForm() {
    setFormTitulo("");
    setFormCategoria("operacional");
    setFormDueDate("");
    setFormError("");
    setShowForm(false);
  }

  function openForm() {
    setShowForm(true);
    setActiveFilter("Todas");
  }

  const isOverdueView = activeFilter !== "Concluídas";

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">

      {/* ── Cabeçalho ───────────────────────────────────────────────── */}
      <div className="px-5 pb-2 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)] sm:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11.5px] font-medium">Voltar</span>
          </button>
        )}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-bold leading-tight text-navy-800">
              Pendências
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-navy-500">
              Alertas, próximos passos e tarefas que precisam de acompanhamento.
            </p>
          </div>
          <button
            type="button"
            onClick={openForm}
            className="ml-3 mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-3.5 py-2 text-[12px] font-semibold text-cream-50 transition-all hover:bg-navy-800 active:scale-[0.97]"
          >
            <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nova
          </button>
        </div>
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="pb-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-0.5 sm:px-6">
          {FILTERS.map((filter) => {
            const count   = filterCounts[filter];
            const isActive = activeFilter === filter;
            const isAlert  = filter === "Vencidas" && count > 0 && !isActive;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all active:scale-[0.97] ${
                  isActive
                    ? filter === "Vencidas" && count > 0
                      ? "bg-terracotta-600 text-white shadow-sm"
                      : "bg-navy-700 text-white shadow-sm"
                    : isAlert
                    ? "border border-terracotta-200 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100"
                    : "border border-navy-100 bg-white text-navy-600 hover:bg-navy-50"
                }`}
              >
                {filter}
                {count > 0 && (
                  <span className={`ml-1 text-[10px] ${isActive ? "opacity-70" : "opacity-55"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Formulário inline ───────────────────────────────────────── */}
      {showForm && activeFilter !== "Concluídas" && (
        <div className="px-5 pb-4 sm:px-6">
          <div className="rounded-[18px] border border-navy-200/60 bg-white px-4 py-4 shadow-[0_2px_12px_-4px_rgba(35,75,99,0.14)]">
            <p className="mb-3 text-[12.5px] font-semibold text-navy-800">Nova pendência</p>

            <div className="mb-3">
              <label className="mb-1 block text-[11.5px] font-medium text-navy-500">
                Título <span className="text-terracotta-500">*</span>
              </label>
              <input
                type="text"
                value={formTitulo}
                onChange={(e) => { setFormTitulo(e.target.value); setFormError(""); }}
                placeholder="Ex.: Verificar infiltração do 402"
                maxLength={120}
                autoFocus
                className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
              />
              {formError && (
                <p className="mt-1 text-[11px] text-terracotta-600">{formError}</p>
              )}
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-[11.5px] font-medium text-navy-500">Categoria</label>
              <div className="flex flex-wrap gap-1.5">
                {FORM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormCategoria(cat.value)}
                    className={`rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 transition-all active:scale-95 ${
                      formCategoria === cat.value
                        ? "bg-navy-700 text-white ring-navy-700"
                        : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-[11.5px] font-medium text-navy-500">
                Prazo <span className="font-normal text-navy-300">(opcional)</span>
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/40 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
              >
                Salvar pendência
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-navy-100 bg-white px-4 py-2 text-[12.5px] font-medium text-navy-500 transition-all hover:bg-navy-50 active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lista de pendências ──────────────────────────────────────── */}
      <div className="space-y-3 px-5 pb-8 sm:px-6">
        {displayItems.length === 0 ? (
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-6 shadow-card">
            {activeFilter === "Todas" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nenhuma pendência aberta.</p>
                <p className="mt-1.5 mx-auto max-w-[280px] text-[12px] leading-relaxed text-navy-400">
                  Quando surgir algo para acompanhar, crie uma pendência e mantenha o controle por aqui.
                </p>
                <button
                  type="button"
                  onClick={openForm}
                  className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-cream-50 transition-all hover:bg-navy-800 active:scale-[0.98]"
                >
                  <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Criar pendência
                </button>
              </div>
            )}
            {activeFilter === "Vencidas" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-green-700">Nenhuma pendência vencida.</p>
                <p className="mt-1.5 mx-auto max-w-[280px] text-[12px] leading-relaxed text-navy-400">
                  Tudo em dia. Continue acompanhando os prazos por aqui.
                </p>
              </div>
            )}
            {activeFilter === "Esta semana" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nada vencendo esta semana.</p>
                <p className="mt-1.5 mx-auto max-w-[280px] text-[12px] leading-relaxed text-navy-400">
                  Nenhuma pendência com prazo nos próximos 7 dias.
                </p>
              </div>
            )}
            {activeFilter === "Sem prazo" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nenhuma pendência sem prazo.</p>
                <p className="mt-1.5 mx-auto max-w-[280px] text-[12px] leading-relaxed text-navy-400">
                  Todas as pendências abertas têm data definida.
                </p>
              </div>
            )}
            {activeFilter === "Concluídas" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nenhuma pendência concluída ainda.</p>
                <p className="mt-1.5 mx-auto max-w-[280px] text-[12px] leading-relaxed text-navy-400">
                  Ao finalizar uma tarefa, ela aparece aqui como histórico operacional.
                </p>
              </div>
            )}
          </div>
        ) : (
          displayItems.map((p) => {
            const priority  = getPriority(p);
            const icon      = getIcon(p);
            const subtitle  = getSubtitle(p);
            const dueBadge  = p.dueDate ? getDueBadge(p.dueDate) : null;
            const cardOverdue = isOverdueView && (dueBadge?.overdue ?? false);

            const dateStr =
              activeFilter === "Concluídas"
                ? formatDateFull(p.completedAt ?? p.createdAt)
                : formatDateFull(p.createdAt);

            return (
              <div
                key={p.id}
                className={`overflow-hidden rounded-[18px] border shadow-card transition-colors ${
                  cardOverdue
                    ? "border-terracotta-200 border-l-4 border-l-terracotta-500 bg-terracotta-50/20"
                    : "border-navy-100/70 bg-white"
                }`}
              >
                <div className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[18px] ${cardOverdue ? "bg-terracotta-100/60" : "bg-navy-50"}`}>
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13.5px] font-semibold leading-snug text-navy-800">
                          {p.titulo}
                        </p>
                        {priority && (
                          <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[priority]}`}>
                            {priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-navy-400">{subtitle}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-medium text-navy-400">
                          {dateStr}
                        </span>
                        {dueBadge && (
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dueBadge.style}`}>
                            {dueBadge.label}
                          </span>
                        )}
                      </div>

                      {/* Ações — apenas para pendências não concluídas */}
                      {activeFilter !== "Concluídas" && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-navy-50 pt-2.5">
                          <button
                            type="button"
                            onClick={() => handleComplete(p.id)}
                            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-navy-500 transition-colors hover:text-green-600 active:scale-95"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Concluir
                          </button>
                          {p.origem === "manual" && (
                            confirmDeleteId === p.id ? (
                              <>
                                <span className="text-[11.5px] text-navy-400">Remover?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id, !!p.dueDate)}
                                  className="text-[11px] font-medium text-terracotta-600 transition-colors hover:text-terracotta-700 active:scale-95"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] text-navy-400 transition-colors hover:text-navy-600 active:scale-95"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="text-[11px] text-navy-400 transition-colors hover:text-terracotta-500 active:scale-95"
                              >
                                Remover
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
