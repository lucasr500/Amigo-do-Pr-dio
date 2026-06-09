"use client";

import { useState, useEffect } from "react";
import {
  getTimeline, addTimelineEvent, deleteTimelineEvent, buildTimelineReport,
  type TimelineEvent,
} from "@/lib/community-timeline";
import {
  TIMELINE_TYPE_LABELS, VISIBILITY_LABELS,
  type TimelineEventType, type Visibility, type CommunityRole,
} from "@/lib/community-types";
import { can, filterByVisibility } from "@/lib/community-permissions";

const TYPE_ICONS: Partial<Record<TimelineEventType, string>> = {
  aviso_publicado:       "📢",
  obra_iniciada:         "🔨",
  obra_concluida:        "✅",
  manutencao_realizada:  "🔧",
  solicitacao_aberta:    "📩",
  solicitacao_resolvida: "✓",
  enquete_criada:        "📊",
  enquete_encerrada:     "📊",
  documento_publicado:   "📄",
  documento_renovado:    "📄",
  assembleia_realizada:  "🏛",
  decisao_registrada:    "⚖",
  relatorio_emitido:     "📋",
  mandato_atualizado:    "👤",
  fornecedor_cadastrado: "🏢",
  ocorrencia_registrada: "⚠",
  comunicado_registrado: "✉",
  revisao_mensal_concluida: "✓",
  backup_exportado:      "↧",
  pendencia_concluida:   "✓",
};

type FormState = {
  type: TimelineEventType;
  title: string;
  description: string;
  visibility: Visibility;
  occurredAt: string;
};

const EMPTY_FORM: FormState = {
  type: "outro", title: "", description: "", visibility: "moradores",
  occurredAt: new Date().toISOString().slice(0, 10),
};

type Props = { role: CommunityRole };

export default function TimelinePanel({ role }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterType, setFilterType] = useState<TimelineEventType | "all">("all");
  const [copied, setCopied] = useState(false);

  const isManager = role === "manager";

  const load = () => {
    const all = getTimeline().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const visible = filterByVisibility(all, role);
    const typed = filterType !== "all"
      ? visible.filter((e) => e.type === filterType)
      : visible;
    setEvents(typed.slice(0, 100));
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, filterType]);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    addTimelineEvent({
      type: form.type,
      title: form.title.trim(),
      description: form.description || undefined,
      visibility: form.visibility,
      sourceModule: "manual",
      occurredAt: new Date(form.occurredAt + "T12:00:00").toISOString(),
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleCopy = () => {
    const report = buildTimelineReport(events, "Linha do tempo institucional");
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const usedTypes = (Object.keys(TIMELINE_TYPE_LABELS) as TimelineEventType[])
    .filter((t) => getTimeline().some((e) => e.type === t));

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Linha do tempo institucional</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              A história viva do condomínio. Tudo que importa, registrado com data e origem.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3 mt-0.5">
            {events.length > 0 && (
              <button type="button" onClick={handleCopy}
                className="rounded-full border border-navy-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
                {copied ? "Copiado!" : "Exportar"}
              </button>
            )}
            {can(role, "canCreateTimelineEvent") && (
              <button type="button" onClick={() => setShowForm(true)}
                className="rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
                Registrar evento
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        {events.length > 5 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex flex-wrap gap-1.5 overflow-x-auto">
              <button type="button" onClick={() => setFilterType("all")}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium flex-shrink-0 ${filterType === "all" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                Todos
              </button>
              {usedTypes.slice(0, 6).map((t) => (
                <button key={t} type="button" onClick={() => setFilterType(t)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium flex-shrink-0 ${filterType === t ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {TIMELINE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário manual */}
      {showForm && isManager && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">Registrar evento manualmente</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TimelineEventType })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {(Object.entries(TIMELINE_TYPE_LABELS) as [TimelineEventType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Data</label>
                <input type="date" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Descrição do evento *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Obra da fachada concluída"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Detalhes (opcional)</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Visibilidade</label>
              <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                {(Object.entries(VISIBILITY_LABELS) as [Visibility, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                Registrar
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {events.length === 0 && (
        <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-navy-600 mb-1">A memória institucional começa aqui</p>
          <p className="text-[11.5px] text-navy-400 leading-relaxed">
            Conforme você concluir pendências, renovar documentos, registrar decisões, cadastrar fornecedores e exportar backups, esta timeline será preenchida automaticamente.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {events.length > 0 && (
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-navy-100" aria-hidden="true" />
        )}
        <div className="space-y-1">
          {events.map((ev, idx) => (
            <div key={ev.id} className="relative flex gap-3 items-start pl-2">
              {/* Dot */}
              <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white border border-navy-100 text-[14px]">
                {TYPE_ICONS[ev.type] ?? "•"}
              </div>
              {/* Content */}
              <div className={`flex-1 min-w-0 rounded-2xl border border-navy-100/80 bg-white/90 px-4 py-3 shadow-[0_1px_3px_rgba(31,49,71,0.03)] ${idx === 0 ? "mt-0" : ""}`}>
                <p className="text-[12.5px] font-semibold text-navy-800">{ev.title}</p>
                {ev.description && <p className="mt-0.5 text-[11.5px] text-navy-500">{ev.description}</p>}
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-navy-400">
                    {new Date(ev.occurredAt).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[9.5px] text-navy-400">
                    {TIMELINE_TYPE_LABELS[ev.type]}
                  </span>
                  {isManager && ev.visibility !== "moradores" && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9.5px] text-amber-600">
                      {VISIBILITY_LABELS[ev.visibility]}
                    </span>
                  )}
                  {isManager && ev.sourceModule === "manual" && (
                    <button type="button" onClick={() => { deleteTimelineEvent(ev.id); load(); }}
                      className="ml-auto text-[10px] text-navy-300 hover:text-terracotta-600">
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
