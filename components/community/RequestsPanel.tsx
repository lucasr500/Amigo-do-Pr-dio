"use client";

import { useState, useEffect } from "react";
import {
  getRequests, addRequest, updateRequest, resolveRequest, closeRequest, getRequestSummary,
  buildRequestsWhatsAppText, seedDemoRequests, type ResidentRequest,
} from "@/lib/community-requests";
import { emitRequestOpened, emitRequestResolved } from "@/lib/community-timeline";
import {
  REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_PRIORITY_LABELS,
  type RequestType, type RequestStatus, type RequestPriority, type CommunityRole,
} from "@/lib/community-types";
import { can } from "@/lib/community-permissions";

const TYPES = Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][];
const STATUSES = Object.entries(REQUEST_STATUS_LABELS) as [RequestStatus, string][];
const PRIORITIES = Object.entries(REQUEST_PRIORITY_LABELS) as [RequestPriority, string][];

const STATUS_COLORS: Record<RequestStatus, string> = {
  recebido:            "bg-blue-50 text-blue-700",
  em_analise:          "bg-amber-50 text-amber-700",
  encaminhado:         "bg-purple-50 text-purple-700",
  aguardando_terceiro: "bg-gray-50 text-gray-600",
  resolvido:           "bg-green-50 text-green-700",
  recusado:            "bg-red-50 text-red-700",
  arquivado:           "bg-navy-50 text-navy-500",
};

const PRIORITY_COLORS: Record<RequestPriority, string> = {
  baixa:   "text-navy-400",
  normal:  "text-navy-500",
  alta:    "text-amber-600",
  urgente: "text-red-600",
};

type FormState = {
  unitNumber: string;
  authorName: string;
  authorContact: string;
  type: RequestType;
  title: string;
  description: string;
  priority: RequestPriority;
};

const EMPTY_FORM: FormState = {
  unitNumber: "", authorName: "", authorContact: "",
  type: "solicitacao", title: "", description: "", priority: "normal",
};

type Props = { role: CommunityRole; onSeed?: () => void };

export default function RequestsPanel({ role, onSeed }: Props) {
  const [requests, setRequests] = useState<ResidentRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const isManager = role === "manager" || role === "council";
  const canManage = can(role, "canUpdateRequestStatus");

  const load = () => {
    const all = getRequests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setRequests(can(role, "canViewAllRequests") ? all : all.slice(0, 20));
  };

  useEffect(() => {
    if (isManager && getRequests().length === 0) { seedDemoRequests(); onSeed?.(); }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSubmit = () => {
    if (!form.title.trim() || !form.authorName.trim()) return;
    const req = addRequest({ ...form, authorContact: form.authorContact || undefined, unitNumber: form.unitNumber || undefined });
    emitRequestOpened(req.id, req.title, req.unitNumber);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleResolve = (id: string) => {
    const note = resolutionNote[id] ?? "";
    resolveRequest(id, note);
    emitRequestResolved(id, getRequests().find((r) => r.id === id)?.title ?? "");
    setExpandedId(null);
    load();
  };

  const handleClose = (id: string, status: "recusado" | "arquivado") => {
    closeRequest(id, status);
    load();
  };

  const handleCopy = (req: ResidentRequest) => {
    navigator.clipboard.writeText(buildRequestsWhatsAppText(req)).then(() => {
      setCopied(req.id);
      setTimeout(() => setCopied(null), 2500);
    }).catch(() => {});
  };

  const summary = getRequestSummary();
  const filtered = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const ACTIVE_STATUSES: RequestStatus[] = ["recebido", "em_analise", "encaminhado", "aguardando_terceiro"];
  const CLOSED_STATUSES: RequestStatus[] = ["resolvido", "recusado", "arquivado"];

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Solicitações</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              {isManager ? "Reclamações, pedidos e sugestões com protocolo rastreável." : "Abra sua solicitação. A gestão responderá por aqui."}
            </p>
          </div>
          {can(role, "canCreateRequest") && (
            <button type="button" onClick={() => setShowForm(true)}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              + Nova
            </button>
          )}
        </div>

        {/* Resumo (apenas manager/council) */}
        {isManager && summary.total > 0 && (
          <div className="border-t border-navy-50 px-5 py-2.5 grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: summary.total, color: "text-navy-700" },
              { label: "Abertas", value: summary.open, color: "text-amber-600" },
              { label: "Resolvidas", value: summary.resolved, color: "text-green-600" },
              { label: "Urgentes", value: summary.urgent, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9.5px] text-navy-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtro de status */}
        {requests.length > 3 && isManager && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setFilterStatus("all")}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${filterStatus === "all" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                Todas
              </button>
              {(["recebido", "em_analise", "resolvido", "arquivado"] as RequestStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${filterStatus === s ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {REQUEST_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      {showForm && can(role, "canCreateRequest") && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">Nova solicitação</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Seu nome *</label>
                <input type="text" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Unidade</label>
                <input type="text" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                  placeholder="Ex: 302"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RequestType })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Prioridade</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as RequestPriority })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Resumo do problema ou pedido"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Descrição</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                Enviar solicitação
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-navy-600 mb-1">Nenhuma solicitação encontrada</p>
          <p className="text-[11.5px] text-navy-400 leading-relaxed">
            {can(role, "canCreateRequest") ? "Abra uma solicitação para começar." : "Aguarde comunicados da gestão."}
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((req) => (
          <div key={req.id} className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
            <button type="button" className="w-full px-5 py-3.5 text-left"
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12.5px] font-semibold text-navy-800">{req.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium ${STATUS_COLORS[req.status]}`}>
                      {REQUEST_STATUS_LABELS[req.status]}
                    </span>
                    {req.priority !== "normal" && (
                      <span className={`text-[10px] font-semibold ${PRIORITY_COLORS[req.priority]}`}>
                        ↑{REQUEST_PRIORITY_LABELS[req.priority]}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-navy-400">
                    {REQUEST_TYPE_LABELS[req.type]}
                    {req.unitNumber && ` · Un. ${req.unitNumber}`}
                    {` · ${new Date(req.createdAt).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <svg className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${expandedId === req.id ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {expandedId === req.id && (
              <div className="border-t border-navy-50 px-5 pb-3.5 pt-2.5 space-y-2.5">
                {req.description && <p className="text-[12px] text-navy-700 leading-relaxed">{req.description}</p>}
                {req.resolutionNote && (
                  <div className="rounded-xl bg-green-50 px-3 py-2.5 border border-green-100">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-green-700 mb-0.5">Resposta da gestão</p>
                    <p className="text-[12px] text-green-800">{req.resolutionNote}</p>
                  </div>
                )}
                {req.authorContact && isManager && (
                  <p className="text-[11px] text-navy-400">Contato: {req.authorContact}</p>
                )}

                {/* Ações manager */}
                {canManage && ACTIVE_STATUSES.includes(req.status) && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <select value={req.status}
                        onChange={(e) => { updateRequest(req.id, { status: e.target.value as RequestStatus }); load(); }}
                        className="flex-1 rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] text-navy-700 focus:border-navy-300 focus:outline-none">
                        {STATUSES.filter(([s]) => !CLOSED_STATUSES.includes(s as RequestStatus)).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => { updateRequest(req.id, { status: req.status }); load(); }}
                        className="rounded-xl bg-navy-100 px-3 text-[11px] text-navy-600 hover:bg-navy-200">Salvar</button>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={resolutionNote[req.id] ?? ""}
                        onChange={(e) => setResolutionNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Resposta / resolução..."
                        className="flex-1 rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                      <button type="button" onClick={() => handleResolve(req.id)}
                        className="rounded-xl bg-green-600 px-3 text-[11px] font-medium text-white hover:bg-green-700">
                        Resolver
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleCopy(req)}
                        className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                        {copied === req.id ? "Copiado!" : "Copiar para WhatsApp"}
                      </button>
                      <button type="button" onClick={() => handleClose(req.id, "recusado")}
                        className="text-[11px] text-navy-300 underline underline-offset-2 hover:text-terracotta-600">Recusar</button>
                      <button type="button" onClick={() => handleClose(req.id, "arquivado")}
                        className="text-[11px] text-navy-300 underline underline-offset-2 hover:text-navy-500">Arquivar</button>
                    </div>
                  </div>
                )}
                {canManage && CLOSED_STATUSES.includes(req.status) && (
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => handleCopy(req)}
                      className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                      {copied === req.id ? "Copiado!" : "Copiar para WhatsApp"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
