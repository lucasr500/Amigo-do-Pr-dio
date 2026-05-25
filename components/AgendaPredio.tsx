"use client";

import { useState, useEffect } from "react";
import {
  getAgendaEvents,
  addAgendaEvent,
  completeAgendaEvent,
  deleteAgendaEvent,
  addPendencia,
  type AgendaEvent,
  type AgendaEventType,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { ate } from "@/lib/urgency";

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
  assembleia: "🏛️",
  manutencao: "🔧",
  dedetizacao: "🪲",
  caixa_agua: "💧",
  extintores: "🧯",
  vistoria: "🔍",
  obra: "🏗️",
  cobranca: "💰",
  reuniao: "🤝",
  fornecedor: "📦",
  comunicado: "📢",
  retorno: "↩️",
  outro: "📅",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
  if (isNaN(days)) return "";
  if (days < 0) return `Vencido há ${Math.abs(days)}d`;
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days}d`;
}

type FormState = {
  title: string;
  date: string;
  type: AgendaEventType;
  note: string;
  createStep: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  date: "",
  type: "outro",
  note: "",
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

  useEffect(() => {
    setEvents(getAgendaEvents());
  }, []);

  function reload() {
    setEvents(getAgendaEvents());
  }

  function handleSave() {
    if (!form.title.trim() || !form.date) return;

    const daysUntil = ate(form.date);

    const saved = addAgendaEvent({
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      note: form.note.trim() || undefined,
    });

    if (form.createStep) {
      addPendencia({
        titulo: `Agenda: ${form.title.trim()}`,
        origem: "agenda",
      });
    }

    trackEvent("agenda_event_created", {
      type: form.type,
      days_until: isNaN(daysUntil) ? null : daysUntil,
      has_note: form.note.trim().length > 0,
      has_linked_step: form.createStep,
    });

    setForm(EMPTY_FORM);
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

  function renderEventCard(e: AgendaEvent, cardClass: string) {
    return (
      <li
        key={e.id}
        className={`flex items-start justify-between gap-3 rounded-[14px] border px-4 py-3 ${cardClass}`}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-base">{TYPE_ICONS[e.type]}</span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-navy-800">{e.title}</p>
            <p className="mt-0.5 text-[11.5px] text-navy-500">
              {TYPE_LABELS[e.type]} ·{" "}
              <span className={urgencyTextClass(e.date)}>
                {formatEventDate(e.date)} ({urgencyLabel(e.date)})
              </span>
            </p>
            {e.note && (
              <p className="mt-1 line-clamp-2 text-[11px] text-navy-400">{e.note}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          {confirmDeleteId === e.id ? (
            <div className="flex gap-1">
              <button
                onClick={() => handleDelete(e.id)}
                className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11.5px] font-medium text-red-600 hover:text-red-700"
              >
                Apagar
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded border border-navy-100 px-2 py-1 text-[11.5px] text-navy-500 hover:text-navy-700"
              >
                Não
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleComplete(e.id, e.type)}
                className="rounded border border-green-200 bg-green-50 px-2 py-1 text-[11.5px] font-medium text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
              >
                Concluir
              </button>
              <button
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
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-navy-50 px-3 py-1.5 text-[11.5px] font-medium text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-700"
            >
              + Novo evento
            </button>
          )}
        </div>

        {/* Summary strip — só quando há pelo menos 2 buckets com eventos */}
        {summaryParts.length >= 2 && (
          <div className="rounded-[12px] bg-navy-50/60 px-3.5 py-2.5">
            <p className="text-[11.5px] text-navy-500">{summaryParts.join(" · ")}</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="space-y-3 rounded-[14px] border border-navy-100 bg-navy-50/40 p-4">
            <div className="space-y-1">
              <label className="text-[11.5px] font-medium text-navy-600">Descrição</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Revisão dos extintores"
                maxLength={100}
                className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11.5px] font-medium text-navy-600">Data</label>
                <input
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11.5px] font-medium text-navy-600">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AgendaEventType }))}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 focus:border-navy-400 focus:outline-none"
                >
                  {(Object.keys(TYPE_LABELS) as AgendaEventType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11.5px] font-medium text-navy-600">Observação (opcional)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Detalhes ou lembrete"
                maxLength={300}
                rows={2}
                className="w-full resize-none rounded-xl border border-navy-200 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none"
              />
            </div>

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
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 rounded-xl bg-navy-700 py-2 text-[13px] font-semibold text-cream-50 transition-colors hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
              >
                Salvar evento
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="rounded-xl border border-navy-100 bg-white px-4 py-2 text-[13px] text-navy-500 transition-colors hover:border-navy-200 hover:text-navy-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {pending.length === 0 && !showForm && (
          <p className="py-4 text-center text-[12.5px] text-navy-400">
            Nenhum evento agendado. Adicione datas importantes do prédio.
          </p>
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
