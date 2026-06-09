"use client";

import { useState, useEffect } from "react";
import {
  getRequests, addRequest, updateRequest, resolveRequest, closeRequest,
  respondToRequest, getRequestSummary, getWorkNotices, getSuggestions,
  buildRequestsWhatsAppText, seedDemoRequests, type ResidentRequest,
} from "@/lib/community-requests";
import { emitRequestOpened, emitRequestResolved, emitWorkNoticeRegistered } from "@/lib/community-timeline";
import {
  REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_PRIORITY_LABELS,
  type RequestType, type RequestStatus, type RequestPriority, type CommunityRole,
} from "@/lib/community-types";
import { can, isAllDemoData } from "@/lib/community-permissions";
import EmptyState from "@/components/ui/EmptyState";

const TYPES = Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][];
const PRIORITIES = Object.entries(REQUEST_PRIORITY_LABELS) as [RequestPriority, string][];

const STATUS_COLORS: Record<RequestStatus, string> = {
  recebido:            "bg-blue-50 text-blue-700",
  em_analise:          "bg-amber-50 text-amber-700",
  encaminhado:         "bg-purple-50 text-purple-700",
  respondida:          "bg-sage-50 text-sage-700",
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

const TYPE_BADGE: Partial<Record<RequestType, string>> = {
  aviso_obra: "bg-orange-50 text-orange-700",
  sugestao:   "bg-sage-50 text-sage-700",
  duvida:     "bg-blue-50 text-blue-700",
  ocorrencia: "bg-amber-50 text-amber-700",
};

type ViewTab = "abertas" | "obra" | "sugestoes" | "fechadas";

type BaseFormState = {
  unitNumber: string;
  authorName: string;
  authorContact: string;
  type: RequestType;
  title: string;
  description: string;
  priority: RequestPriority;
};

type ObraFormState = BaseFormState & {
  workStartDate: string;
  workEndDate: string;
  workTimeWindow: string;
  workResponsible: string;
};

const EMPTY_BASE: BaseFormState = {
  unitNumber: "", authorName: "", authorContact: "",
  type: "solicitacao", title: "", description: "", priority: "normal",
};

const EMPTY_OBRA: ObraFormState = {
  ...EMPTY_BASE, type: "aviso_obra",
  workStartDate: "", workEndDate: "", workTimeWindow: "", workResponsible: "",
};

type Props = { role: CommunityRole; onSeed?: () => void };

export default function RequestsPanel({ role, onSeed }: Props) {
  const [requests, setRequests] = useState<ResidentRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"request" | "obra" | "sugestao">("request");
  const [baseForm, setBaseForm] = useState<BaseFormState>(EMPTY_BASE);
  const [obraForm, setObraForm] = useState<ObraFormState>(EMPTY_OBRA);
  const [viewTab, setViewTab] = useState<ViewTab>("abertas");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const isManager = role === "manager" || role === "council";
  const canManage = can(role, "canUpdateRequestStatus");

  const CLOSED: RequestStatus[] = ["resolvido", "recusado", "arquivado"];
  const ACTIVE: RequestStatus[] = ["recebido", "em_analise", "encaminhado", "respondida", "aguardando_terceiro"];
  const SUGGESTION_TYPES: RequestType[] = ["sugestao", "duvida", "ocorrencia"];

  const load = () => {
    const all = getRequests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setRequests(can(role, "canViewAllRequests") ? all : all.slice(0, 20));
  };

  useEffect(() => {
    if (isManager && getRequests().length === 0) { seedDemoRequests(); onSeed?.(); }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSubmitBase = () => {
    if (!baseForm.title.trim() || !baseForm.authorName.trim()) return;
    const req = addRequest({
      ...baseForm,
      authorContact: baseForm.authorContact || undefined,
      unitNumber: baseForm.unitNumber || undefined,
    });
    emitRequestOpened(req.id, req.title, req.unitNumber);
    setShowForm(false);
    setBaseForm(EMPTY_BASE);
    load();
  };

  const handleSubmitObra = () => {
    if (!obraForm.title.trim() || !obraForm.authorName.trim()) return;
    const req = addRequest({
      unitNumber: obraForm.unitNumber || undefined,
      authorName: obraForm.authorName,
      authorContact: obraForm.authorContact || undefined,
      type: "aviso_obra",
      title: obraForm.title,
      description: obraForm.description,
      priority: "normal",
      workStartDate: obraForm.workStartDate || undefined,
      workEndDate: obraForm.workEndDate || undefined,
      workTimeWindow: obraForm.workTimeWindow || undefined,
      workResponsible: obraForm.workResponsible || undefined,
    });
    emitWorkNoticeRegistered(req.id, req.unitNumber ?? "—", req.title);
    setShowForm(false);
    setObraForm(EMPTY_OBRA);
    load();
  };

  const handleResolve = (id: string) => {
    const note = resolutionNote[id] ?? "";
    resolveRequest(id, note);
    emitRequestResolved(id, getRequests().find((r) => r.id === id)?.title ?? "");
    setExpandedId(null);
    load();
  };

  const handleRespond = (id: string) => {
    const text = responseText[id]?.trim();
    if (!text) return;
    respondToRequest(id, text);
    setResponseText((prev) => ({ ...prev, [id]: "" }));
    load();
  };

  const handleClose = (id: string, status: "recusado" | "arquivado") => {
    closeRequest(id, status);
    load();
  };

  const handleAnalise = (id: string) => {
    updateRequest(id, { status: "em_analise" });
    load();
  };

  const handleCopy = (req: ResidentRequest) => {
    navigator.clipboard.writeText(buildRequestsWhatsAppText(req)).then(() => {
      setCopied(req.id);
      setTimeout(() => setCopied(null), 2500);
    }).catch(() => {});
  };

  const summary = getRequestSummary();
  const workNoticesCount = isManager ? getWorkNotices().length : 0;
  const suggestionsCount = isManager ? getSuggestions().length : 0;

  const filtered = (() => {
    if (viewTab === "abertas")   return requests.filter((r) => ACTIVE.includes(r.status) && r.type !== "aviso_obra" && !SUGGESTION_TYPES.includes(r.type));
    if (viewTab === "obra")      return requests.filter((r) => r.type === "aviso_obra");
    if (viewTab === "sugestoes") return requests.filter((r) => SUGGESTION_TYPES.includes(r.type));
    if (viewTab === "fechadas")  return requests.filter((r) => CLOSED.includes(r.status));
    return requests;
  })();

  const emptyCopy: Record<ViewTab, { title: string; description: string; actionLabel: string; actionMode: "request" | "obra" | "sugestao" }> = {
    abertas: {
      title: "Nenhuma solicitação aberta",
      description: isManager
        ? "Quando moradores enviarem pedidos, dúvidas ou ocorrências, a gestão acompanha tudo por aqui."
        : "Use este canal para enviar pedidos, dúvidas ou ocorrências sem expor o assunto em conversa pública.",
      actionLabel: "Enviar solicitação",
      actionMode: "request",
    },
    obra: {
      title: "Nenhum aviso de obra registrado",
      description: isManager
        ? "Avisos de obra ajudam a gestão a acompanhar impacto, unidade, período e responsável."
        : "Avise a gestão antes de iniciar reforma interna e deixe período, unidade e responsável registrados.",
      actionLabel: "Registrar aviso de obra",
      actionMode: "obra",
    },
    sugestoes: {
      title: "Nenhuma sugestão recebida",
      description: isManager
        ? "Sugestões, dúvidas e ocorrências leves ficam registradas sem virar conversa solta entre moradores."
        : "Envie uma sugestão ou dúvida para a gestão responder pelo canal estruturado.",
      actionLabel: "Enviar sugestão",
      actionMode: "sugestao",
    },
    fechadas: {
      title: "Nenhum item fechado",
      description: "Solicitações respondidas, recusadas, resolvidas ou arquivadas aparecerão aqui como histórico do canal.",
      actionLabel: "Enviar solicitação",
      actionMode: "request",
    },
  };

  const openForm = (mode: "request" | "obra" | "sugestao") => {
    setFormMode(mode);
    if (mode === "obra") setObraForm(EMPTY_OBRA);
    else {
      const type: RequestType = mode === "sugestao" ? "sugestao" : "solicitacao";
      setBaseForm({ ...EMPTY_BASE, type });
    }
    setShowForm(true);
  };

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">
              {isManager ? "Triagem — Canal do Morador" : "Minha Participação"}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              {isManager
                ? "Solicitações, avisos de obra e sugestões com protocolo rastreável."
                : "Registre solicitações, avisos de obra ou sugestões. A gestão responde aqui."}
            </p>
          </div>
          {can(role, "canCreateRequest") && !showForm && (
            <button type="button" onClick={() => openForm("request")}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              + Solicitação
            </button>
          )}
        </div>

        {/* Resumo manager */}
        {isManager && summary.total > 0 && (
          <div className="border-t border-navy-50 px-5 py-2.5 grid grid-cols-4 gap-2">
            {[
              { label: "Abertas", value: summary.open, color: summary.open > 0 ? "text-amber-600" : "text-navy-700" },
              { label: "Obras", value: workNoticesCount, color: workNoticesCount > 0 ? "text-orange-600" : "text-navy-700" },
              { label: "Sugestões", value: suggestionsCount, color: "text-sage-700" },
              { label: "Resolvidas", value: summary.resolved, color: "text-green-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9.5px] text-navy-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs triagem (manager) */}
        {isManager && requests.length > 0 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex gap-1.5 flex-wrap">
              {([
                { tab: "abertas" as const, label: `Abertas${summary.open > 0 ? ` (${summary.open})` : ""}` },
                { tab: "obra" as const, label: `Obras${workNoticesCount > 0 ? ` (${workNoticesCount})` : ""}` },
                { tab: "sugestoes" as const, label: `Sugestões${suggestionsCount > 0 ? ` (${suggestionsCount})` : ""}` },
                { tab: "fechadas" as const, label: "Fechadas" },
              ]).map(({ tab, label }) => (
                <button key={tab} type="button" onClick={() => setViewTab(tab)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors flex-shrink-0 ${viewTab === tab ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTAs do morador */}
        {!isManager && can(role, "canCreateRequest") && !showForm && (
          <div className="border-t border-navy-50 px-5 py-2.5 flex gap-2 flex-wrap">
            <button type="button" onClick={() => openForm("obra")}
              className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-[11px] font-medium text-orange-700 hover:bg-orange-100">
              Avisar obra
            </button>
            <button type="button" onClick={() => openForm("sugestao")}
              className="rounded-full bg-sage-50 border border-sage-200 px-3 py-1.5 text-[11px] font-medium text-sage-700 hover:bg-sage-100">
              Enviar sugestão
            </button>
          </div>
        )}
      </div>

      {/* Alerta de obras */}
      {isManager && workNoticesCount > 0 && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-3.5 w-3.5 text-orange-700" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
          <p className="text-[11px] text-orange-800 leading-snug">
            {workNoticesCount} aviso{workNoticesCount !== 1 ? "s" : ""} de obra ativo{workNoticesCount !== 1 ? "s" : ""} aguardando triagem.
          </p>
        </div>
      )}

      {/* Formulário — solicitação / sugestão */}
      {showForm && (formMode === "request" || formMode === "sugestao") && can(role, "canCreateRequest") && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">
              {formMode === "sugestao" ? "Enviar participação" : "Nova solicitação"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Seu nome *</label>
                <input type="text" value={baseForm.authorName} onChange={(e) => setBaseForm({ ...baseForm, authorName: e.target.value })}
                  placeholder="Nome do morador"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Unidade</label>
                <input type="text" value={baseForm.unitNumber} onChange={(e) => setBaseForm({ ...baseForm, unitNumber: e.target.value })}
                  placeholder="Ex: 302"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Tipo</label>
                <select value={baseForm.type} onChange={(e) => setBaseForm({ ...baseForm, type: e.target.value as RequestType })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {TYPES.filter(([t]) => t !== "aviso_obra" && t !== "reserva").map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Prioridade</label>
                <select value={baseForm.priority} onChange={(e) => setBaseForm({ ...baseForm, priority: e.target.value as RequestPriority })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Título *</label>
              <input type="text" value={baseForm.title} onChange={(e) => setBaseForm({ ...baseForm, title: e.target.value })}
                placeholder={formMode === "sugestao" ? "Resumo da sua sugestão ou dúvida" : "Resumo do problema ou pedido"}
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Descrição</label>
              <textarea rows={3} value={baseForm.description} onChange={(e) => setBaseForm({ ...baseForm, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleSubmitBase}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                {formMode === "sugestao" ? "Enviar participação" : "Enviar solicitação"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário — aviso de obra */}
      {showForm && formMode === "obra" && can(role, "canCreateRequest") && (
        <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">Registrar aviso de obra</p>
            <p className="text-[11.5px] text-navy-400 leading-relaxed">
              Informe a gestão sobre reforma interna. Não substitui aprovação formal conforme convenção.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Seu nome *</label>
                <input type="text" value={obraForm.authorName} onChange={(e) => setObraForm({ ...obraForm, authorName: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Unidade *</label>
                <input type="text" value={obraForm.unitNumber} onChange={(e) => setObraForm({ ...obraForm, unitNumber: e.target.value })}
                  placeholder="Ex: 302"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Título da obra *</label>
              <input type="text" value={obraForm.title} onChange={(e) => setObraForm({ ...obraForm, title: e.target.value })}
                placeholder="Ex: Reforma no banheiro"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Início</label>
                <input type="date" value={obraForm.workStartDate} onChange={(e) => setObraForm({ ...obraForm, workStartDate: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Término previsto</label>
                <input type="date" value={obraForm.workEndDate} onChange={(e) => setObraForm({ ...obraForm, workEndDate: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Horário aprox.</label>
                <input type="text" value={obraForm.workTimeWindow} onChange={(e) => setObraForm({ ...obraForm, workTimeWindow: e.target.value })}
                  placeholder="Ex: 08h–17h"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Responsável</label>
                <input type="text" value={obraForm.workResponsible} onChange={(e) => setObraForm({ ...obraForm, workResponsible: e.target.value })}
                  placeholder="Nome/contato"
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Observação</label>
              <textarea rows={2} value={obraForm.description} onChange={(e) => setObraForm({ ...obraForm, description: e.target.value })}
                placeholder="Tipo de serviço, materiais, impacto esperado..."
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleSubmitObra}
                className="rounded-full bg-orange-600 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-orange-700 active:scale-[0.97]">
                Registrar aviso de obra
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {filtered.length === 0 && !showForm && (
        <EmptyState
          title={emptyCopy[viewTab].title}
          description={emptyCopy[viewTab].description}
          actionLabel={can(role, "canCreateRequest") && viewTab !== "fechadas" ? emptyCopy[viewTab].actionLabel : undefined}
          onAction={can(role, "canCreateRequest") && viewTab !== "fechadas" ? () => openForm(emptyCopy[viewTab].actionMode) : undefined}
        />
      )}

      {/* Aviso demo */}
      {isManager && requests.length > 0 && isAllDemoData(requests) && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-2.5 flex items-start gap-2">
          <span className="text-[11px] text-amber-700 font-medium flex-shrink-0 mt-0.5">Demonstração</span>
          <p className="text-[11px] text-amber-600 leading-relaxed">Estas são solicitações de exemplo. Registre uma real para substituí-las.</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((req) => (
          <div key={req.id}
            className={`overflow-hidden rounded-2xl border bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)] ${req.priority === "urgente" ? "border-red-200/80" : req.type === "aviso_obra" ? "border-orange-200/80" : "border-navy-100/80"}`}>
            <button type="button" className="w-full px-5 py-3.5 text-left"
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12.5px] font-semibold text-navy-800">{req.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium ${STATUS_COLORS[req.status]}`}>
                      {REQUEST_STATUS_LABELS[req.status]}
                    </span>
                    {TYPE_BADGE[req.type] && (
                      <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium ${TYPE_BADGE[req.type]}`}>
                        {REQUEST_TYPE_LABELS[req.type]}
                      </span>
                    )}
                    {req.priority !== "normal" && (
                      <span className={`text-[10px] font-semibold ${PRIORITY_COLORS[req.priority]}`}>
                        ↑{REQUEST_PRIORITY_LABELS[req.priority]}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-navy-400">
                    {req.unitNumber && `Un. ${req.unitNumber} · `}
                    {REQUEST_TYPE_LABELS[req.type]}
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

                {/* Campos de obra */}
                {req.type === "aviso_obra" && (req.workStartDate || req.workTimeWindow || req.workResponsible) && (
                  <div className="rounded-xl bg-orange-50/60 px-3 py-2.5 text-[11.5px] text-navy-700 space-y-0.5">
                    {req.workStartDate && (
                      <p><span className="text-navy-400">Período: </span>
                        {req.workStartDate}{req.workEndDate ? ` a ${req.workEndDate}` : ""}
                      </p>
                    )}
                    {req.workTimeWindow && <p><span className="text-navy-400">Horário: </span>{req.workTimeWindow}</p>}
                    {req.workResponsible && <p><span className="text-navy-400">Responsável: </span>{req.workResponsible}</p>}
                  </div>
                )}

                {/* Resposta da gestão */}
                {req.managementResponse && (
                  <div className="rounded-xl bg-sage-50 px-3 py-2.5 border border-sage-100">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-sage-700 mb-0.5">Resposta da gestão</p>
                    <p className="text-[12px] text-sage-900">{req.managementResponse}</p>
                  </div>
                )}

                {/* Nota de resolução */}
                {req.resolutionNote && (
                  <div className="rounded-xl bg-green-50 px-3 py-2.5 border border-green-100">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-green-700 mb-0.5">Resolução</p>
                    <p className="text-[12px] text-green-800">{req.resolutionNote}</p>
                  </div>
                )}

                {req.authorContact && isManager && (
                  <p className="text-[11px] text-navy-400">Contato: {req.authorContact}</p>
                )}

                {/* Ações manager — itens ativos */}
                {canManage && ACTIVE.includes(req.status) && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="mb-1 block text-[10.5px] font-medium text-navy-500">Resposta da gestão</label>
                      <div className="flex gap-2">
                        <input type="text" value={responseText[req.id] ?? ""}
                          onChange={(e) => setResponseText((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Responder ao morador..."
                          className="flex-1 rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                        <button type="button" onClick={() => handleRespond(req.id)}
                          className="rounded-xl bg-sage-600 px-3 text-[11px] font-medium text-white hover:bg-sage-700 whitespace-nowrap">
                          Responder
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={resolutionNote[req.id] ?? ""}
                        onChange={(e) => setResolutionNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Nota de encerramento..."
                        className="flex-1 rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                      <button type="button" onClick={() => handleResolve(req.id)}
                        className="rounded-xl bg-green-600 px-3 text-[11px] font-medium text-white hover:bg-green-700">
                        Resolver
                      </button>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {req.status === "recebido" && (
                        <button type="button" onClick={() => handleAnalise(req.id)}
                          className="text-[11px] text-amber-600 underline underline-offset-2 hover:text-amber-800">
                          Marcar em análise
                        </button>
                      )}
                      <button type="button" onClick={() => handleCopy(req)}
                        className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                        {copied === req.id ? "Copiado!" : "Copiar para WhatsApp"}
                      </button>
                      <button type="button" onClick={() => handleClose(req.id, "recusado")}
                        className="text-[11px] text-navy-300 underline underline-offset-2 hover:text-red-600">Recusar</button>
                      <button type="button" onClick={() => handleClose(req.id, "arquivado")}
                        className="text-[11px] text-navy-300 underline underline-offset-2 hover:text-navy-500">Arquivar</button>
                    </div>
                  </div>
                )}

                {canManage && CLOSED.includes(req.status) && (
                  <button type="button" onClick={() => handleCopy(req)}
                    className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                    {copied === req.id ? "Copiado!" : "Copiar para WhatsApp"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-navy-50/60 px-4 py-2.5">
        <p className="text-[10.5px] text-navy-400 leading-relaxed">
          Canal local de participação. Protocolos rastreáveis, sem exposição pública. Não substitui comunicação formal prevista na convenção.
        </p>
      </div>
    </section>
  );
}
