"use client";

import { useState, useEffect } from "react";
import {
  getReservations, addReservation, updateReservation, cancelReservation,
  getReservationSummary,
} from "@/lib/community-reservas";
import { emitReservationApproved, emitReservationCancelled } from "@/lib/community-timeline";
import {
  RESERVATION_STATUS_LABELS, type ReservationStatus, type CommunityRole, type SpaceReservation,
} from "@/lib/community-types";
import { can } from "@/lib/community-permissions";
import { formatDateSafe } from "@/lib/date-format";
import EmptyState from "@/components/ui/EmptyState";
import { communityEmptyState, audienceFromRole } from "@/components/ui/empty-state-helpers";

const COMMON_SPACES = [
  "Salão de Festas",
  "Churrasqueira",
  "Academia",
  "Quadra Poliesportiva",
  "Espaço Kids",
  "Sauna",
  "Área de Lazer",
  "Outro",
];

const STATUS_COLORS: Record<ReservationStatus, string> = {
  solicitada: "bg-amber-50 text-amber-700",
  aprovada:   "bg-green-50 text-green-700",
  recusada:   "bg-red-50 text-red-700",
  cancelada:  "bg-navy-50 text-navy-500",
};

type FilterTab = "todas" | "pendentes" | "aprovadas" | "historico";

type FormState = {
  unit: string;
  requesterName: string;
  space: string;
  customSpace: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  unit: "", requesterName: "", space: "Salão de Festas", customSpace: "",
  date: "", timeStart: "", timeEnd: "", description: "",
};

type Props = { role: CommunityRole };

export default function ReservasPanel({ role }: Props) {
  const [reservations, setReservations] = useState<SpaceReservation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterTab, setFilterTab] = useState<FilterTab>("todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isManager = role === "manager" || role === "council";
  const canManageReservations = can(role, "canManageReservations");

  const load = () => {
    const all = getReservations().sort((a, b) => {
      if (a.status === "solicitada" && b.status !== "solicitada") return -1;
      if (a.status !== "solicitada" && b.status === "solicitada") return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
    setReservations(all);
  };

  useEffect(() => { load(); }, [role]);

  const handleSubmit = () => {
    if (!form.unit.trim() || !form.requesterName.trim() || !form.date) {
      setFormError("Informe unidade, nome e data da reserva.");
      return;
    }
    if (form.space === "Outro" && !form.customSpace.trim()) {
      setFormError("Informe o nome do espaço.");
      return;
    }
    if (form.timeStart && form.timeEnd && form.timeEnd <= form.timeStart) {
      setFormError("O horário de término deve ser posterior ao início.");
      return;
    }
    const space = form.space === "Outro" ? form.customSpace.trim() : form.space;
    addReservation({
      unit: form.unit.trim(),
      requesterName: form.requesterName.trim(),
      space,
      date: form.date,
      timeStart: form.timeStart || undefined,
      timeEnd: form.timeEnd || undefined,
      description: form.description.trim() || undefined,
      status: "solicitada",
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError(null);
    load();
  };

  const handleApprove = (res: SpaceReservation) => {
    const notes = managerNotes[res.id] ?? "";
    updateReservation(res.id, { status: "aprovada", approvedBy: "Síndico", notes: notes || undefined });
    emitReservationApproved(res.id, res.space, res.unit);
    setExpandedId(null);
    load();
  };

  const handleDeny = (res: SpaceReservation) => {
    const notes = managerNotes[res.id] ?? "";
    updateReservation(res.id, { status: "recusada", notes: notes || undefined });
    setExpandedId(null);
    load();
  };

  const handleCancel = (res: SpaceReservation) => {
    if (!confirm(`Cancelar a reserva de ${res.space} da unidade ${res.unit}?`)) return;
    cancelReservation(res.id);
    emitReservationCancelled(res.id, res.space, res.unit);
    load();
  };

  const summary = getReservationSummary();

  const filtered = reservations.filter((r) => {
    if (filterTab === "pendentes") return r.status === "solicitada";
    if (filterTab === "aprovadas") return r.status === "aprovada";
    if (filterTab === "historico") return r.status === "recusada" || r.status === "cancelada";
    return true;
  });

  const fmtDate = (iso: string) => formatDateSafe(iso, { weekday: "short", day: "numeric", month: "short" }, "Data inválida");

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Comunicação</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Reservas de Espaços</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              {isManager
                ? "Gerencie solicitações de reserva. Aprovações ficam registradas na timeline."
                : "Solicite reservas de espaços comuns. A gestão aprovará por aqui."}
            </p>
          </div>
          {can(role, "canCreateRequest") && (
            <button
              type="button"
              onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setFormError(null); }}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700"
            >
              + Solicitar
            </button>
          )}
        </div>

        {/* Resumo para manager */}
        {isManager && summary.total > 0 && (
          <div className="border-t border-navy-50 px-5 py-2.5 grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: summary.total, color: "text-navy-700" },
              { label: "Pendentes", value: summary.pending, color: "text-amber-600" },
              { label: "Aprovadas", value: summary.approved, color: "text-green-600" },
              { label: "Próximas", value: summary.upcoming, color: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9.5px] text-navy-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros de tab */}
        {reservations.length > 2 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex gap-1.5 flex-wrap">
              {(["todas", "pendentes", "aprovadas", "historico"] as FilterTab[]).map((tab) => {
                const labels: Record<FilterTab, string> = {
                  todas: "Todas",
                  pendentes: `Pendentes${summary.pending > 0 ? ` (${summary.pending})` : ""}`,
                  aprovadas: "Aprovadas",
                  historico: "Histórico",
                };
                return (
                  <button key={tab} type="button" onClick={() => setFilterTab(tab)}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${filterTab === tab ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Alerta de reservas pendentes */}
      {isManager && summary.pending > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-3.5 w-3.5 text-amber-700" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v5M8 9.5v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <p className="text-[11px] text-amber-800 leading-snug">
            {summary.pending} reserva{summary.pending !== 1 ? "s" : ""} aguardando aprovação.
          </p>
        </div>
      )}

      {/* Formulário */}
      {showForm && can(role, "canCreateRequest") && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">Solicitar reserva</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Unidade *</label>
                <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="Ex: 302"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Seu nome *</label>
                <input type="text" value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Espaço</label>
              <select value={form.space} onChange={(e) => setForm({ ...form, space: e.target.value })}
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                {COMMON_SPACES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {form.space === "Outro" && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Qual espaço?</label>
                <input type="text" value={form.customSpace} onChange={(e) => setForm({ ...form, customSpace: e.target.value })}
                  placeholder="Descreva o espaço"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Data *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Início</label>
                <input type="time" value={form.timeStart} onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Término</label>
                <input type="time" value={form.timeEnd} onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Observação (opcional)</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Número de convidados, montagem necessária, etc."
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>

            {formError && (
              <p className="text-[11px] font-medium text-terracotta-600">{formError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                Enviar solicitação
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {filtered.length === 0 && !showForm && (
        <EmptyState
          title={filterTab === "todas" ? "Nenhuma reserva registrada" : "Nenhuma reserva nesta categoria"}
          description={isManager
            ? "Organize churrasqueira, salão e áreas comuns com status, unidade e data em um só lugar."
            : "Solicite espaços comuns pelo canal oficial e acompanhe a aprovação pela gestão."}
          actionLabel={can(role, "canCreateRequest") && filterTab !== "historico" ? "Criar reserva" : undefined}
          onAction={can(role, "canCreateRequest") && filterTab !== "historico" ? () => { setShowForm(true); setForm(EMPTY_FORM); setFormError(null); } : undefined}
          hint={communityEmptyState("reservas", audienceFromRole(isManager)).hint}
        />
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((res) => (
          <div key={res.id} className={`overflow-hidden rounded-2xl border bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)] ${res.status === "solicitada" ? "border-amber-200/80" : "border-navy-100/80"}`}>
            <button
              type="button"
              className="w-full px-5 py-3.5 text-left"
              onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12.5px] font-semibold text-navy-800">{res.space}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium ${STATUS_COLORS[res.status]}`}>
                      {RESERVATION_STATUS_LABELS[res.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-navy-400">
                    {fmtDate(res.date)}
                    {res.timeStart && ` · ${res.timeStart}${res.timeEnd ? `–${res.timeEnd}` : ""}`}
                    {` · Un. ${res.unit}`}
                  </p>
                </div>
                <svg className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${expandedId === res.id ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {expandedId === res.id && (
              <div className="border-t border-navy-50 px-5 pb-3.5 pt-2.5 space-y-2.5">
                <div className="text-[11.5px] text-navy-600 space-y-0.5">
                  <p><span className="text-navy-400">Solicitante: </span>{res.requesterName}</p>
                  {res.description && <p><span className="text-navy-400">Observação: </span>{res.description}</p>}
                  {res.approvedBy && <p><span className="text-navy-400">Aprovado por: </span>{res.approvedBy}</p>}
                  {res.notes && <p><span className="text-navy-400">Nota: </span>{res.notes}</p>}
                  <p><span className="text-navy-400">Registrado em: </span>{formatDateSafe(res.createdAt, undefined, "Data não informada")}</p>
                </div>

                {/* Ações do manager para reservas solicitadas */}
                {canManageReservations && res.status === "solicitada" && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-navy-500">Observação da gestão (opcional)</label>
                      <input type="text"
                        value={managerNotes[res.id] ?? ""}
                        onChange={(e) => setManagerNotes((prev) => ({ ...prev, [res.id]: e.target.value }))}
                        placeholder="Ex: Aprovado. Taxa de limpeza: R$ 50"
                        className="w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleApprove(res)}
                        className="rounded-full bg-green-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-green-700">
                        ✓ Aprovar
                      </button>
                      <button type="button" onClick={() => handleDeny(res)}
                        className="rounded-full bg-white border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50">
                        ✕ Recusar
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancelar reserva aprovada */}
                {canManageReservations && res.status === "aprovada" && (
                  <button type="button" onClick={() => handleCancel(res)}
                    className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                    Cancelar reserva
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-navy-50/60 px-4 py-2.5">
        <p className="text-[10.5px] text-navy-400 leading-relaxed">
          Reservas são gerenciadas localmente. A aprovação da gestão é registrada na timeline institucional. Não substitui confirmação presencial ou regulamento interno.
        </p>
      </div>
    </section>
  );
}
