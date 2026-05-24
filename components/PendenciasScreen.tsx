"use client";

import { useEffect, useState } from "react";
import {
  getPendencias,
  addPendencia,
  completePendencia,
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

type DueBadge = { label: string; style: string };

function getDueBadge(dueDate: string): DueBadge {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Use noon to avoid DST/timezone edge cases
  const due = new Date(dueDate + "T12:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0)   return { label: "Atrasada",        style: "bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-200/60" };
  if (diffDays === 0) return { label: "Vence hoje",       style: "bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-200/60" };
  if (diffDays === 1) return { label: "Vence amanhã",     style: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/60" };
  if (diffDays <= 7)  return { label: `Em ${diffDays} dias`, style: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/60" };
  return { label: formatDateShort(dueDate), style: "bg-navy-50 text-navy-400 ring-1 ring-navy-100/60" };
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["Abertas", "Requer ação", "Concluídas"] as const;
type TabKey = (typeof TABS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onBack?: () => void;
  initialTab?: TabKey;
};

export default function PendenciasScreen({ refreshKey, onBack, initialTab = "Abertas" }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [all, setAll]             = useState<Pendencia[]>([]);
  const [hydrated, setHydrated]   = useState(false);

  // Form state
  const [showForm,      setShowForm]      = useState(false);
  const [formTitulo,    setFormTitulo]    = useState("");
  const [formCategoria, setFormCategoria] = useState("operacional");
  const [formDueDate,   setFormDueDate]   = useState("");
  const [formError,     setFormError]     = useState("");

  useEffect(() => {
    setAll(getPendencias());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return null;

  const abertas      = all.filter((p) => p.status === "aberta");
  const requerAcao   = abertas.filter(
    (p) => p.origem && ["guidance", "response", "memoria", "ocorrencia"].includes(p.origem)
  );
  const concluidas   = all
    .filter((p) => p.status === "concluida")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 12);

  const proximosPassos = abertas
    .filter((p) => !p.origem || ["manual", "agenda", "revisao"].includes(p.origem))
    .slice(0, 6);

  const abertasSorted = sortByUrgency(abertas);

  const displayItems: Pendencia[] =
    activeTab === "Abertas"      ? abertasSorted :
    activeTab === "Requer ação"  ? requerAcao :
                                   concluidas;

  const tabCounts: Record<TabKey, number> = {
    Abertas:       abertas.length,
    "Requer ação": requerAcao.length,
    Concluídas:    concluidas.length,
  };

  function handleComplete(id: string) {
    const p = all.find((x) => x.id === id);
    completePendencia(id);
    logInteraction("pendencia-concluida", id);
    void trackEvent("pendencia_completed", {
      categoria: p?.categoria ?? null,
      origem: p?.origem ?? null,
      matched_id: p?.matchedId ?? null,
    });
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
    setActiveTab("Abertas");
  }

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
              O que precisa da sua atenção.
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

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="px-5 pb-4 sm:px-6">
        <div className="flex gap-1 rounded-[14px] bg-navy-50/80 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-[10px] py-2 text-[12px] font-medium transition-all active:scale-[0.97] ${
                activeTab === tab
                  ? "bg-navy-700 text-white shadow-sm"
                  : "text-navy-500 hover:text-navy-700"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && activeTab !== tab && (
                <span className="ml-1 text-[10px] opacity-70">({tabCounts[tab]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Formulário inline ───────────────────────────────────────── */}
      {showForm && activeTab === "Abertas" && (
        <div className="px-5 pb-4 sm:px-6">
          <div className="rounded-[18px] border border-navy-200/60 bg-white px-4 py-4 shadow-[0_2px_12px_-4px_rgba(35,75,99,0.14)]">
            <p className="mb-3 text-[12.5px] font-semibold text-navy-800">Nova pendência</p>

            {/* Título */}
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

            {/* Categoria */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[11.5px] font-medium text-navy-500">
                Categoria
              </label>
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

            {/* Prazo */}
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

            {/* Botões */}
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

      {/* ── Pendências list ─────────────────────────────────────────── */}
      <div className="space-y-3 px-5 pb-4 sm:px-6">
        {displayItems.length === 0 ? (
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-6 shadow-card">
            {activeTab === "Abertas" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nenhuma pendência aberta.</p>
                <p className="mt-1.5 max-w-[280px] mx-auto text-[12px] leading-relaxed text-navy-400">
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
            {activeTab === "Requer ação" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nada exigindo ação agora.</p>
                <p className="mt-1.5 max-w-[280px] mx-auto text-[12px] leading-relaxed text-navy-400">
                  Pendências vindas do Assistente, prazos ou alertas aparecem aqui quando precisarem de acompanhamento.
                </p>
              </div>
            )}
            {activeTab === "Concluídas" && (
              <div className="text-center">
                <p className="text-[13px] font-semibold text-navy-700">Nenhuma pendência concluída ainda.</p>
                <p className="mt-1.5 max-w-[280px] mx-auto text-[12px] leading-relaxed text-navy-400">
                  Ao finalizar uma tarefa, ela aparece aqui como histórico operacional.
                </p>
              </div>
            )}
          </div>
        ) : (
          displayItems.map((p) => {
            const priority = getPriority(p);
            const icon     = getIcon(p);
            const subtitle = getSubtitle(p);
            const dateStr  =
              activeTab === "Concluídas"
                ? formatDateFull(p.completedAt ?? p.createdAt)
                : formatDateFull(p.createdAt);
            const dueBadge = p.dueDate ? getDueBadge(p.dueDate) : null;

            return (
              <div
                key={p.id}
                className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[18px]">
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-semibold leading-snug text-navy-800">
                        {p.titulo}
                      </p>
                      {priority && (
                        <span
                          className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[priority]}`}
                        >
                          {priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-navy-400">{subtitle}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-600">
                        {dateStr}
                      </span>
                      {dueBadge && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dueBadge.style}`}>
                          {dueBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Próximos passos ─────────────────────────────────────────── */}
      <section className="px-5 pb-8 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-navy-800">Próximos passos</p>
          <span className="text-[12px] text-navy-400">
            {proximosPassos.length > 0 ? `${proximosPassos.length} aberto${proximosPassos.length > 1 ? "s" : ""}` : ""}
          </span>
        </div>

        {proximosPassos.length === 0 ? (
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-4 shadow-card">
            <p className="text-[12.5px] text-navy-400">
              Defina o que fazer e mantenha o ritmo.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {proximosPassos.map((p, idx) => {
              const badge = p.dueDate ? getDueBadge(p.dueDate) : null;
              return (
                <div key={p.id}>
                  {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleComplete(p.id)}
                      aria-label="Marcar como concluído"
                      className="group flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-navy-200 transition-all hover:border-green-400 hover:bg-green-50 active:scale-90"
                    >
                      <svg
                        viewBox="0 0 10 10"
                        className="h-2.5 w-2.5 text-transparent transition-colors group-hover:text-green-500"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M2 5l2 2.5L8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-navy-700">{p.titulo}</p>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {badge ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${badge.style}`}>
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-navy-400">{formatDateShort(p.createdAt)}</span>
                      )}
                      <svg className="h-4 w-4 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
