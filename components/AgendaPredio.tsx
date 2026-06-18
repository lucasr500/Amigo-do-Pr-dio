"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAgendaEvents,
  addAgendaEvent,
  updateAgendaEvent,
  completeAgendaEvent,
  deleteAgendaEvent,
  addPendencia,
  type AgendaEvent,
  type AgendaEventType,
  type AgendaRecurrence,
  type Pendencia,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { ate } from "@/lib/urgency";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";

const TYPE_LABELS: Record<AgendaEventType, string> = {
  assembleia: "Assembleia",
  manutencao: "Manutenção",
  dedetizacao: "Dedetização",
  caixa_agua: "Caixa d'água",
  extintores: "Extintores",
  vistoria: "Vistoria",
  obra: "Obra",
  cobranca: "Cobrança",
  reuniao: "Reunião",
  fornecedor: "Fornecedor",
  comunicado: "Comunicado",
  retorno: "Retorno",
  outro: "Outro",
};

const TYPE_ICONS: Record<AgendaEventType, string> = {
  assembleia: "AG",
  manutencao: "MT",
  dedetizacao: "DD",
  caixa_agua: "CA",
  extintores: "EX",
  vistoria: "VI",
  obra: "OB",
  cobranca: "CB",
  reuniao: "RN",
  fornecedor: "FN",
  comunicado: "CM",
  retorno: "RT",
  outro: "EV",
};

const RECURRENCE_LABELS: Record<AgendaRecurrence, string> = {
  nenhuma: "Sem recorrência",
  semanal: "Semanal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const PRIORITY_LABELS: Record<NonNullable<Pendencia["prioridade"]>, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const OPERATIONAL_TEMPLATES: Array<{
  id: string;
  title: string;
  type: AgendaEventType;
  recurrence: AgendaRecurrence;
  prioridade: NonNullable<Pendencia["prioridade"]>;
  note: string;
}> = [
  { id: "ago", title: "AGO", type: "assembleia", recurrence: "anual", prioridade: "alta", note: "Assembleia geral ordinária e prestação de contas." },
  { id: "age", title: "Assembleia extraordinária", type: "assembleia", recurrence: "nenhuma", prioridade: "media", note: "Definir pauta, convocação e documentação." },
  { id: "caixa_agua", title: "Limpeza da caixa d'água", type: "caixa_agua", recurrence: "semestral", prioridade: "alta", note: "Confirmar execução, comprovante e comunicação aos moradores." },
  { id: "dedetizacao", title: "Dedetização", type: "dedetizacao", recurrence: "semestral", prioridade: "media", note: "Agendar fornecedor e orientar moradores." },
  { id: "elevador", title: "Manutenção de elevador", type: "manutencao", recurrence: "mensal", prioridade: "alta", note: "Registrar visita técnica e pendências do fornecedor." },
  { id: "extintores", title: "Extintores", type: "extintores", recurrence: "anual", prioridade: "alta", note: "Verificar validade, recarga e comprovante." },
  { id: "seguro", title: "Seguro do condomínio", type: "vistoria", recurrence: "anual", prioridade: "critica", note: "Renovar apólice antes do vencimento." },
  { id: "avcb", title: "AVCB / laudo equivalente", type: "vistoria", recurrence: "anual", prioridade: "critica", note: "Confirmar validade, laudos e próximos passos." },
  { id: "bombas", title: "Inspeção de bombas", type: "manutencao", recurrence: "trimestral", prioridade: "media", note: "Checar bombas, registros e sinais de falha." },
  { id: "prestacao", title: "Prestação de contas", type: "reuniao", recurrence: "mensal", prioridade: "media", note: "Conferir saldo, despesas, inadimplência e comprovantes." },
  { id: "contrato", title: "Vencimento de contrato", type: "fornecedor", recurrence: "anual", prioridade: "media", note: "Avaliar renovação, reajuste e escopo do fornecedor." },
];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function urgencyTextClass(iso: string): string {
  const days = ate(iso);
  if (isNaN(days)) return "text-navy-400";
  if (days < 0) return "text-terracotta-700 font-medium";
  if (days === 0) return "text-amber-700 font-medium";
  if (days <= 7) return "text-orange-600 font-medium";
  if (days <= 30) return "text-yellow-700";
  return "text-navy-400";
}

function urgencyLabel(iso: string): string {
  const days = ate(iso);
  if (isNaN(days)) return formatEventDate(iso);
  if (days === -1) return "Vencido ontem";
  if (days < 0)   return `Vencido há ${Math.abs(days)} dias`;
  if (days === 0)  return "Hoje";
  if (days === 1)  return "Amanhã";
  if (days <= 30)  return `Em ${days} dias`;
  return formatEventDate(iso);
}

function weekDayLabel(iso: string): string {
  const days = ate(iso);
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

type FormState = {
  title: string;
  date: string;
  type: AgendaEventType;
  note: string;
  responsavel: string;
  prioridade: NonNullable<Pendencia["prioridade"]>;
  recurrence: AgendaRecurrence;
  templateId?: string;
  createStep: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  date: "",
  type: "outro",
  note: "",
  responsavel: "",
  prioridade: "media",
  recurrence: "nenhuma",
  templateId: undefined,
  createStep: false,
};

type Props = {
  onSaved?: () => void;
};

export default function AgendaPredio({ onSaved }: Props) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents(getAgendaEvents());
  }, []);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }, [showForm]);

  function reload() {
    setEvents(getAgendaEvents());
  }

  function handleSave() {
    if (!form.title.trim() || !form.date) return;

    const daysUntil = ate(form.date);

    const payload = {
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      note: form.note.trim() || undefined,
      responsavel: form.responsavel.trim() || undefined,
      prioridade: form.prioridade,
      recurrence: form.recurrence,
      templateId: form.templateId,
      source: form.templateId ? "template" as const : "manual" as const,
    };

    const saved = editingId
      ? (updateAgendaEvent(editingId, payload), events.find((e) => e.id === editingId) ?? null)
      : addAgendaEvent(payload);

    if (form.createStep) {
      const step = addPendencia({
        titulo: `Agenda: ${form.title.trim()}`,
        origem: "agenda",
        categoria: form.type === "cobranca" ? "financeiro" : "operacional",
        dueDate: form.date,
        prioridade: form.prioridade,
        responsavel: form.responsavel.trim() || undefined,
        linkedType: "agenda",
        linkedId: editingId ?? saved?.id ?? null,
      });
      if (!editingId && saved) updateAgendaEvent(saved.id, { linkedPendenciaId: step.id });
    }

    trackEvent("agenda_event_created", {
      type: form.type,
      days_until: isNaN(daysUntil) ? null : daysUntil,
      has_note: form.note.trim().length > 0,
      has_linked_step: form.createStep,
      has_recurrence: form.recurrence !== "nenhuma",
      has_template: !!form.templateId,
      mode: editingId ? "edit" : "create",
    });

    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    reload();
    onSaved?.();
    void saved;
  }

  function handleComplete(id: string, eventType: AgendaEventType) {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    const daysUntil = ate(event.date);
    completeAgendaEvent(id);
    trackEvent("agenda_event_completed", {
      type: eventType,
      days_until: isNaN(daysUntil) ? null : daysUntil,
    });
    reload();
    onSaved?.();
  }

  function handleDelete(id: string) {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    deleteAgendaEvent(id);
    trackEvent("agenda_event_deleted", { type: event.type });
    setConfirmDeleteId(null);
    reload();
    onSaved?.();
  }

  function openEdit(e: AgendaEvent) {
    setEditingId(e.id);
    setForm({
      title: e.title,
      date: e.date,
      type: e.type,
      note: e.note ?? "",
      responsavel: e.responsavel ?? "",
      prioridade: e.prioridade ?? "media",
      recurrence: e.recurrence ?? "nenhuma",
      templateId: e.templateId,
      createStep: false,
    });
    setShowForm(true);
  }

  function applyTemplate(templateId: string) {
    const template = OPERATIONAL_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setForm((f) => ({
      ...f,
      title: template.title,
      type: template.type,
      note: template.note,
      prioridade: template.prioridade,
      recurrence: template.recurrence,
      templateId: template.id,
    }));
    setShowForm(true);
  }

  function createPendenciaFromEvent(e: AgendaEvent) {
    const step = addPendencia({
      titulo: `Resolver evento vencido: ${e.title}`,
      descricao: e.note || "Evento da agenda está vencido e precisa de encaminhamento.",
      origem: "agenda",
      categoria: e.type === "cobranca" ? "financeiro" : "operacional",
      dueDate: todayISO(),
      prioridade: e.prioridade === "baixa" ? "media" : e.prioridade ?? "alta",
      responsavel: e.responsavel,
      linkedType: "agenda",
      linkedId: e.id,
    });
    updateAgendaEvent(e.id, { linkedPendenciaId: step.id });
    reload();
    onSaved?.();
  }

  const today = todayISO();
  const pending = events
    .filter((e) => !e.completedAt)
    .sort((a, b) => a.date.localeCompare(b.date));
  const completed = events
    .filter((e) => !!e.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  // Buckets de urgência
  const overdue: AgendaEvent[] = [];
  const todayEvts: AgendaEvent[] = [];
  const next7: AgendaEvent[] = [];
  const next30: AgendaEvent[] = [];
  const later: AgendaEvent[] = [];
  for (const e of pending) {
    const d = ate(e.date);
    if (isNaN(d) || d > 30) later.push(e);
    else if (d < 0) overdue.push(e);
    else if (d === 0) todayEvts.push(e);
    else if (d <= 7) next7.push(e);
    else next30.push(e);
  }

  // Summary strip
  const summaryParts: string[] = [];
  if (overdue.length > 0)
    summaryParts.push(`${overdue.length} vencido${overdue.length > 1 ? "s" : ""}`);
  const iminent = todayEvts.length + next7.length;
  if (iminent > 0)
    summaryParts.push(`${iminent} nos próximos 7 dias`);
  const futureCount = next30.length + later.length;
  if (futureCount > 0)
    summaryParts.push(`${futureCount} futur${futureCount !== 1 ? "os" : "o"}`);

  const canSave = form.title.trim().length > 0 && form.date.length > 0;
  const weekEvents = [...todayEvts, ...next7].sort((a, b) => a.date.localeCompare(b.date));
  const weekGroups = weekEvents.reduce<Array<{ date: string; events: AgendaEvent[] }>>((groups, event) => {
    const current = groups.find((group) => group.date === event.date);
    if (current) current.events.push(event);
    else groups.push({ date: event.date, events: [event] });
    return groups;
  }, []);

  function renderEventCard(e: AgendaEvent, cardClass: string) {
    return (
      <li
        key={e.id}
        className={`flex items-start justify-between gap-3 rounded-[14px] border px-4 py-3 ${cardClass}`}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[10px] font-bold text-navy-500">
            {TYPE_ICONS[e.type]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-navy-800">{e.title}</p>
            <p className="mt-0.5 text-[11.5px]">
              <span className={urgencyTextClass(e.date)}>{urgencyLabel(e.date)}</span>
              <span className="text-navy-400"> · {TYPE_LABELS[e.type]}</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {e.prioridade && (
                <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10.5px] font-medium text-navy-500">
                  {PRIORITY_LABELS[e.prioridade]}
                </span>
              )}
              {e.responsavel && (
                <span className="rounded-full bg-sage-100/70 px-2 py-0.5 text-[10.5px] font-medium text-navy-600">
                  Resp. {e.responsavel}
                </span>
              )}
              {e.recurrence && e.recurrence !== "nenhuma" && (
                <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10.5px] font-medium text-navy-500">
                  {RECURRENCE_LABELS[e.recurrence]}
                </span>
              )}
              {e.linkedPendenciaId && (
                <span className="rounded-full bg-terracotta-50 px-2 py-0.5 text-[10.5px] font-medium text-terracotta-700">
                  Pendência criada
                </span>
              )}
            </div>
            {e.note && (
              <p className="mt-1 line-clamp-2 text-[11px] text-navy-400">{e.note}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          {confirmDeleteId === e.id ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11.5px] font-medium text-red-600 hover:text-red-700"
              >
                Apagar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded border border-navy-100 px-2 py-1 text-[11.5px] text-navy-500 hover:text-navy-700"
              >
                Não
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleComplete(e.id, e.type)}
                className="rounded border border-green-200 bg-green-50 px-2 py-1 text-[11.5px] font-medium text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
              >
                Concluir
              </button>
              {ate(e.date) < 0 && !e.linkedPendenciaId && (
                <button
                  type="button"
                  onClick={() => createPendenciaFromEvent(e)}
                  className="rounded border border-terracotta-200 bg-terracotta-50 px-2 py-1 text-[11.5px] font-medium text-terracotta-700 transition-colors hover:bg-terracotta-100"
                >
                  Virar pendência
                </button>
              )}
              <button
                type="button"
                onClick={() => openEdit(e)}
                className="rounded border border-navy-100 px-2 py-1 text-[11.5px] text-navy-500 hover:text-navy-700"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(e.id)}
                className="rounded border border-navy-100 px-2 py-1 text-[11.5px] text-navy-400 hover:text-navy-600"
              >
                Excluir
              </button>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <section className="px-5 pb-6 sm:px-6">
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Agenda operacional
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-navy-800">
              Agenda do prédio
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-700 px-3.5 py-2 text-[12px] font-semibold text-cream-50 transition-all hover:bg-navy-800 active:scale-[0.97]"
            >
              <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Novo evento
            </button>
          )}
        </div>

        {/* Summary strip — só quando há pelo menos 2 buckets com eventos */}
        {summaryParts.length >= 2 && (
          <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-2.5">
            <p className="text-[11.5px] text-navy-500">{summaryParts.join(" · ")}</p>
          </div>
        )}

        {!showForm && (
          <div className="space-y-2 rounded-[14px] border border-navy-100 bg-white px-3.5 py-3">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-navy-400">
              Templates operacionais
            </p>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
              {OPERATIONAL_TEMPLATES.slice(0, 8).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className="flex-shrink-0 rounded-full border border-navy-100 bg-navy-50/60 px-3 py-1.5 text-[11.5px] font-medium text-navy-600 transition-colors hover:bg-navy-100"
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div ref={formRef} className="space-y-3 rounded-[14px] border border-navy-100 bg-navy-50/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold text-navy-800">
                {editingId ? "Editar evento" : "Novo evento"}
              </p>
              {form.templateId && (
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-navy-500">
                  Template aplicado
                </span>
              )}
            </div>
            <FormField label="Descrição">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Revisão dos extintores"
                maxLength={100}
                className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Data">
                <input
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
                />
              </FormField>
              <FormField label="Tipo">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AgendaEventType }))}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
                >
                  {(Object.keys(TYPE_LABELS) as AgendaEventType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Responsável">
                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                  placeholder="Síndico, zelador..."
                  maxLength={60}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
                />
              </FormField>
              <FormField label="Prioridade">
                <select
                  value={form.prioridade}
                  onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value as FormState["prioridade"] }))}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Recorrência">
                <select
                  value={form.recurrence}
                  onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value as AgendaRecurrence }))}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
                >
                  {(Object.keys(RECURRENCE_LABELS) as AgendaRecurrence[]).map((r) => (
                    <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Observação" hint="Opcional">
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Detalhes ou lembrete"
                maxLength={300}
                rows={2}
                className="w-full resize-none rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300/20"
              />
            </FormField>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.createStep}
                onChange={(e) => setForm((f) => ({ ...f, createStep: e.target.checked }))}
                className="rounded"
              />
              <span className="text-[11.5px] text-navy-600">Criar próximo passo vinculado</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 rounded-xl bg-navy-700 py-2 text-[13px] font-semibold text-cream-50 transition-colors hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
              >
                {editingId ? "Salvar alterações" : "Salvar evento"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}
                className="rounded-xl border border-navy-100 bg-white px-4 py-2 text-[13px] text-navy-500 transition-colors hover:border-navy-200 hover:text-navy-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {pending.length === 0 && !showForm && (
          <EmptyState
            title="Nenhum evento agendado."
            description="Cadastre a próxima manutenção, assembleia ou vencimento importante para ativar a agenda operacional."
            actionLabel="Criar evento"
            onAction={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}
          />
        )}

        {!showForm && pending.length > 0 && (
          <div className="space-y-3 rounded-[16px] border border-navy-100 bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
                  Esta semana
                </p>
                <p className="mt-0.5 text-[11.5px] text-navy-500">
                  Visão simples dos próximos 7 dias. Recorrência gera uma nova ocorrência ao concluir.
                </p>
              </div>
              {overdue.length > 0 && (
                <span className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[10.5px] font-semibold text-terracotta-700">
                  {overdue.length} atrasado{overdue.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {weekGroups.length === 0 ? (
              <EmptyState
                title="Nenhum evento nos próximos 7 dias."
                description="Use um template para agendar manutenção, assembleia ou vencimento relevante."
                actionLabel="Usar template"
                onAction={() => applyTemplate(OPERATIONAL_TEMPLATES[0].id)}
              />
            ) : (
              <div className="space-y-3">
                {weekGroups.map((group) => (
                  <div key={group.date}>
                    <p className="mb-1.5 text-[11px] font-semibold capitalize text-navy-500">
                      {weekDayLabel(group.date)}
                    </p>
                    <ul className="space-y-2">
                      {group.events.map((event) =>
                        renderEventCard(
                          event,
                          event.prioridade === "critica" || event.prioridade === "alta"
                            ? "border-amber-200 bg-amber-50/20"
                            : "border-navy-100 bg-white"
                        )
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Eventos agrupados por status */}
        {pending.length > 0 && (
          <div className="space-y-5">

            {/* Vencidos */}
            {overdue.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-terracotta-700">
                    Vencidos
                  </p>
                  <span className="rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[10px] font-semibold text-terracotta-700">
                    {overdue.length}
                  </span>
                </div>
                <p className="mb-2 text-[11px] text-navy-400">
                  Eventos vencidos continuam visíveis até serem concluídos ou atualizados.
                </p>
                <ul className="space-y-2">
                  {overdue.map((e) => renderEventCard(e, "border-terracotta-200 bg-terracotta-50/30"))}
                </ul>
              </div>
            )}

            {/* Hoje */}
            {todayEvts.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-amber-700">
                    Hoje
                  </p>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    {todayEvts.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {todayEvts.map((e) => renderEventCard(e, "border-amber-200 bg-amber-50/20"))}
                </ul>
              </div>
            )}

            {/* Próximos 7 dias */}
            {next7.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-500">
                  Próximos 7 dias
                </p>
                <ul className="space-y-2">
                  {next7.map((e) => renderEventCard(e, "border-navy-100 bg-white"))}
                </ul>
              </div>
            )}

            {/* Próximos 30 dias */}
            {next30.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
                  Próximos 30 dias
                </p>
                <ul className="space-y-2">
                  {next30.map((e) => renderEventCard(e, "border-navy-100 bg-white"))}
                </ul>
              </div>
            )}

            {/* Mais adiante */}
            {later.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
                  Mais adiante
                </p>
                <ul className="space-y-2">
                  {later.map((e) => renderEventCard(e, "border-navy-100 bg-white"))}
                </ul>
              </div>
            )}

          </div>
        )}

        {/* Concluídos */}
        {completed.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="text-[11.5px] text-navy-400 hover:text-navy-600"
            >
              {showCompleted
                ? "▾ Ocultar concluídos"
                : `▸ Ver ${completed.length} concluído${completed.length > 1 ? "s" : ""}`}
            </button>

            {showCompleted && (
              <ul className="mt-2 space-y-2">
                {completed.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start gap-2.5 rounded-[14px] border border-navy-50 bg-navy-50/30 px-4 py-3 opacity-60"
                  >
                    <span className="mt-0.5 shrink-0 text-base">{TYPE_ICONS[e.type]}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-navy-400 line-through">{e.title}</p>
                      <p className="mt-0.5 text-[11px] text-navy-400">
                        {TYPE_LABELS[e.type]} · {formatEventDate(e.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="pt-1 text-[10.5px] leading-relaxed text-navy-300">
          Agenda operacional. Confirme prazos formais com documentos e profissionais responsáveis.
        </p>

      </div>
    </section>
  );
}
