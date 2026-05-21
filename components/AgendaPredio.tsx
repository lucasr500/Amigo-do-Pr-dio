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

function urgencyClass(iso: string): string {
  const days = ate(iso);
  if (isNaN(days)) return "text-zinc-500";
  if (days < 0) return "text-red-600 font-medium";
  if (days === 0) return "text-red-500 font-medium";
  if (days <= 7) return "text-orange-500 font-medium";
  if (days <= 30) return "text-yellow-600";
  return "text-zinc-500";
}

function urgencyLabel(iso: string): string {
  const days = ate(iso);
  if (isNaN(days)) return "";
  if (days < 0) return `${Math.abs(days)}d atrás`;
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

  const canSave = form.title.trim().length > 0 && form.date.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">Agenda do prédio</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Eventos e compromissos operacionais</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            + Novo evento
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Descrição</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Revisão dos extintores"
              maxLength={100}
              className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Data</label>
              <input
                type="date"
                value={form.date}
                min={today}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AgendaEventType }))}
                className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {(Object.keys(TYPE_LABELS) as AgendaEventType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Observação (opcional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Detalhes ou lembrete"
              maxLength={300}
              rows={2}
              className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.createStep}
              onChange={(e) => setForm((f) => ({ ...f, createStep: e.target.checked }))}
              className="rounded"
            />
            <span className="text-xs text-zinc-600">Criar próximo passo vinculado</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 text-white rounded-lg py-2 transition-colors"
            >
              Salvar evento
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="text-sm text-zinc-500 hover:text-zinc-700 px-4 py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pending.length === 0 && !showForm && (
        <p className="text-xs text-zinc-400 text-center py-4">
          Nenhum evento agendado. Adicione datas importantes do prédio.
        </p>
      )}

      {pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map((e) => (
            <li
              key={e.id}
              className="border border-zinc-200 rounded-xl px-4 py-3 bg-white flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-base mt-0.5 shrink-0">{TYPE_ICONS[e.type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{e.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {TYPE_LABELS[e.type]} ·{" "}
                    <span className={urgencyClass(e.date)}>
                      {formatEventDate(e.date)} ({urgencyLabel(e.date)})
                    </span>
                  </p>
                  {e.note && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{e.note}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                {confirmDeleteId === e.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-xs text-red-600 font-medium hover:text-red-700 px-2 py-1 rounded border border-red-200 bg-red-50"
                    >
                      Apagar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded border border-zinc-200"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleComplete(e.id, e.type)}
                      className="text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 rounded border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      Concluir
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(e.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded border border-zinc-200"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            {showCompleted ? "▾ Ocultar concluídos" : `▸ Ver ${completed.length} concluído${completed.length > 1 ? "s" : ""}`}
          </button>

          {showCompleted && (
            <ul className="space-y-2 mt-2">
              {completed.map((e) => (
                <li
                  key={e.id}
                  className="border border-zinc-100 rounded-xl px-4 py-3 bg-zinc-50 flex items-start gap-2 opacity-60"
                >
                  <span className="text-base mt-0.5 shrink-0">{TYPE_ICONS[e.type]}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-500 line-through truncate">{e.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {TYPE_LABELS[e.type]} · {formatEventDate(e.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-zinc-400 pt-1">
        Agenda operacional. Confirme prazos formais com documentos, prestadores ou profissionais responsáveis.
      </p>
    </section>
  );
}
