"use client";

import { useEffect, useState } from "react";
import {
  getDocumentos,
  upsertDocumento,
  getPendenciasAbertas,
  addPendencia,
  addAuditEntry,
  DOCUMENTOS_ESSENCIAIS_IDS,
  DOCUMENTO_LABEL,
  DOCUMENTO_CATEGORIA,
  DOCUMENTO_CRITICIDADE,
  type DocumentoEssencial,
  type DocumentoStatus,
  type DocumentoEssencialId,
  type DocumentoCategoria,
} from "@/lib/session";
import {
  isDocumentoVencido,
  isDocumentoProximoVencimento,
  isDocumentoFaltante,
  getDocumentosSummary,
  buildPendenciaFromDocumento,
  buildAgendaFromDocumento,
  buildFinancialFromDocumento,
} from "@/lib/session-documentos";
import { addAgendaEvent, getAgendaEvents } from "@/lib/session-agenda";
import { addFinancialEntry, currentMonthKey } from "@/lib/financial";
import { trackEvent } from "@/lib/telemetry";
import EmptyState from "@/components/ui/EmptyState";
import { getWhereToFind } from "@/lib/discovery-hints";
import DocumentosCollapsedButton from "@/components/documentos/DocumentosCollapsedButton";
import DocumentosGroupSection from "@/components/documentos/DocumentosGroupSection";
import DocumentosStatsHeader from "@/components/documentos/DocumentosStatsHeader";
import { CRIT_ORDER, GRUPOS, type DocFilter } from "@/components/documentos/documentos-config";

type Props = { onSaved?: () => void };

const STATUS_LABEL: Record<DocumentoStatus, string> = {
  tenho:             "Em arquivo",
  nao_tenho:         "Ausente",
  precisa_localizar: "Revisar",
  nao_se_aplica:     "N/A",
};

const STATUS_BADGE: Record<DocumentoStatus, string> = {
  tenho:             "bg-sage-50 text-sage-800 ring-sage-100",
  nao_tenho:         "bg-terracotta-50 text-terracotta-700 ring-terracotta-100",
  precisa_localizar: "bg-amber-50 text-amber-700 ring-amber-100",
  nao_se_aplica:     "bg-navy-50 text-navy-400 ring-navy-100",
};

const PENDENCIA_TITULO: Partial<Record<DocumentoEssencialId, string>> = {
  convencao:               "Localizar convenção condominial",
  regimento:               "Localizar regimento interno",
  ata_eleicao:             "Encontrar ata de eleição do síndico",
  apolice_seguro:          "Localizar apólice do seguro predial",
  avcb_clcb:               "Localizar AVCB ou CLCB do condomínio",
  spda_laudo:              "Localizar laudo do SPDA / Para-raio",
  brigada_certificado:     "Localizar certificado de brigada de incêndio",
  contrato_elevador:       "Localizar contrato de manutenção de elevadores",
  contrato_limpeza:        "Localizar contrato de limpeza",
  contrato_portaria:       "Localizar contrato de portaria",
  laudos_tecnicos:         "Localizar laudos técnicos relevantes",
  extintores_comprovante:  "Localizar comprovante de manutenção de extintores",
  caixa_agua_comprovante:  "Localizar comprovante de limpeza da caixa d'água",
  dedetizacao_comprovante: "Localizar comprovante de dedetização",
  cct_funcionarios:        "Localizar CCT aplicável aos funcionários",
  controle_ferias:         "Organizar controle de férias dos funcionários",
  ppra_pgr:                "Localizar PPRA / PGR do condomínio",
  pcmso:                   "Localizar PCMSO dos funcionários",
  cnd_condominio:          "Verificar situação fiscal (CND) do condomínio",
};

const DOC_HINT_MAP: Partial<Record<DocumentoEssencialId, string>> = {
  avcb_clcb:               "avcb",
  apolice_seguro:          "seguro_apolice",
  convencao:               "convencao",
  extintores_comprovante:  "manut_extintores",
  contrato_elevador:       "manut_elevador",
  caixa_agua_comprovante:  "manut_caixa",
  dedetizacao_comprovante: "manut_dedetizacao",
  cct_funcionarios:        "funcionarios",
  ppra_pgr:                "funcionarios",
  pcmso:                   "funcionarios",
  controle_ferias:         "ferias_funcionario",
};

export default function DocumentosEssenciaisPanel({ onSaved }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [grupoAberto, setGrupoAberto] = useState<DocumentoCategoria | null>(null);
  const [grupoMostrandoTodos, setGrupoMostrandoTodos] = useState<Set<DocumentoCategoria>>(new Set());
  const [docs, setDocs] = useState<Record<string, DocumentoEssencial>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<DocumentoStatus | null>(null);
  const [editingLink, setEditingLink] = useState("");
  const [editingOnde, setEditingOnde] = useState("");
  const [editingVencimento, setEditingVencimento] = useState("");
  const [editingCusto, setEditingCusto] = useState("");
  const [pendenciaIds, setPendenciaIds] = useState<Set<string>>(new Set());
  const [agendaDocIds, setAgendaDocIds] = useState<Set<string>>(new Set());
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DocFilter>("todos");
  const [showCustoForm, setShowCustoForm] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const stored = getDocumentos();
    const map: Record<string, DocumentoEssencial> = {};
    stored.forEach((d) => { map[d.id] = d; });
    setDocs(map);

    // Pendências vinculadas (novo padrão linkedType + fallback matchedId)
    const pIds = new Set(
      getPendenciasAbertas()
        .filter((p) =>
          (p.linkedType === "documento" && !!p.linkedId) ||
          (p.origem === "documento" && !!p.matchedId)
        )
        .map((p) => (p.linkedId ?? p.matchedId)!)
    );
    setPendenciaIds(pIds);

    // Eventos de agenda vinculados a documentos
    const agIds = new Set(
      getAgendaEvents()
        .filter((e) => !e.completedAt && e.note?.includes("[doc:"))
        .map((e) => {
          const match = e.note?.match(/\[doc:([^\]]+)\]/);
          return match ? match[1] : null;
        })
        .filter((id): id is string => !!id)
    );
    setAgendaDocIds(agIds);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const summary = getDocumentosSummary(today);

  // Smart default filter
  const defaultFilter: DocFilter =
    summary.criticosPendentes > 0 ? "criticos"
    : summary.vencidos > 0 ? "vencidos"
    : "todos";

  // Compute active filter (use defaultFilter on first expansion)
  const effectiveFilter = activeFilter;

  function flash(msg: string) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  }

  const total = DOCUMENTOS_ESSENCIAIS_IDS.length;
  const tenho = Object.values(docs).filter((d) => d.status === "tenho").length;
  const naoTenho = Object.values(docs).filter((d) => d.status === "nao_tenho").length;
  const precisa = Object.values(docs).filter((d) => d.status === "precisa_localizar").length;
  const naoAplica = Object.values(docs).filter((d) => d.status === "nao_se_aplica").length;
  const cadastrados = Object.keys(docs).length;

  const criticosNaoConfirmados = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => {
    const critico = DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica";
    const doc = docs[id];
    return critico && (!doc || (doc.status !== "tenho" && doc.status !== "nao_se_aplica"));
  }).length;

  const firstUnfilledCritical = DOCUMENTOS_ESSENCIAIS_IDS.find((id) => {
    const critico = DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica";
    const doc = docs[id];
    return critico && (!doc || (doc.status !== "tenho" && doc.status !== "nao_se_aplica"));
  }) as DocumentoEssencialId | undefined;

  // Filter predicate
  function matchesFilter(id: string, filter: DocFilter): boolean {
    const docId = id as DocumentoEssencialId;
    const doc = docs[id];
    const crit = DOCUMENTO_CRITICIDADE[docId] === "critica";
    switch (filter) {
      case "todos":       return true;
      case "criticos":    return crit;
      case "faltam":      return isDocumentoFaltante(doc);
      case "vencidos":    return !!doc && isDocumentoVencido(doc, today);
      case "proximos":    return !!doc && !isDocumentoVencido(doc, today) && isDocumentoProximoVencimento(doc, 60, today);
      case "regulares":   return !!doc && doc.status === "tenho" && !isDocumentoVencido(doc, today);
      case "sem_revisao": return !doc;
      default:            return true;
    }
  }

  const filteredIds = DOCUMENTOS_ESSENCIAIS_IDS.filter((id) => matchesFilter(id, effectiveFilter));
  const isFiltered = effectiveFilter !== "todos";

  const openEditor = (id: string) => {
    const doc = docs[id];
    setEditingId(id);
    setEditingStatus(doc?.status ?? null);
    setEditingOnde(doc?.ondeEsta ?? "");
    setEditingLink(doc?.linkExterno ?? "");
    setEditingVencimento(doc?.dataVencimento ?? "");
    setEditingCusto(doc?.custoEstimado ? String(doc.custoEstimado) : "");
    setShowCustoForm(null);
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditingStatus(null);
    setEditingOnde("");
    setEditingLink("");
    setEditingVencimento("");
    setEditingCusto("");
    setShowCustoForm(null);
  };

  const persistDoc = (
    id: string,
    status: DocumentoStatus,
    onde?: string,
    link?: string,
    vencimento?: string,
    custo?: string
  ) => {
    const now = new Date().toISOString();
    const existing = docs[id];
    const updated: DocumentoEssencial = {
      id,
      status,
      updatedAt: now,
      ...(existing ? {
        vencimento: existing.vencimento,
        observacoes: existing.observacoes,
        linkedPendenciaId: existing.linkedPendenciaId,
        linkedAgendaEventId: existing.linkedAgendaEventId,
        linkedFinancialEntryId: existing.linkedFinancialEntryId,
      } : {}),
      ondeEsta: onde?.trim() || existing?.ondeEsta,
      linkExterno: link?.trim() || existing?.linkExterno,
      dataVencimento: vencimento?.trim() || existing?.dataVencimento,
      custoEstimado: custo ? Number(custo.replace(",", ".")) : existing?.custoEstimado,
      reviewedAt: now,
    };
    const next = { ...docs, [id]: updated };
    setDocs(next);
    upsertDocumento(updated);

    if (status === "precisa_localizar" && !pendenciaIds.has(id)) {
      const titulo = PENDENCIA_TITULO[id as DocumentoEssencialId] ?? `Localizar: ${DOCUMENTO_LABEL[id as DocumentoEssencialId] ?? id}`;
      addPendencia({
        titulo,
        categoria: "gestao",
        origem: "documento",
        matchedId: id,
        linkedType: "documento",
        linkedId: id,
      });
      void trackEvent("pendencia_created_from_documento", { doc_id: id });
      setPendenciaIds((prev) => new Set([...prev, id]));
    }

    addAuditEntry({
      category: "documento",
      action: `Documento atualizado: ${DOCUMENTO_LABEL[id as DocumentoEssencialId] ?? id}`,
      detail: status,
      impact: status === "tenho" ? "positive" : status === "nao_tenho" ? "negative" : "neutral",
    });

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
    onSaved?.();
  };

  const saveEditing = (id: string) => {
    if (!editingStatus) return;
    persistDoc(id, editingStatus, editingOnde, editingLink, editingVencimento, editingCusto);
    closeEditor();
  };

  const quickSave = (id: DocumentoEssencialId, status: DocumentoStatus) => {
    persistDoc(id, status);
  };

  function createPendenciaForDoc(docId: DocumentoEssencialId) {
    if (pendenciaIds.has(docId)) {
      flash("Pendência já existe para este documento.");
      return;
    }
    const doc = docs[docId];
    const payload = buildPendenciaFromDocumento(docId, doc, today);
    addPendencia({
      titulo: payload.titulo,
      descricao: payload.descricao,
      categoria: payload.categoria,
      origem: payload.origem,
      prioridade: payload.prioridade,
      dueDate: payload.dueDate,
      linkedType: payload.linkedType,
      linkedId: payload.linkedId,
      matchedId: payload.matchedId,
      origemDetalhe: payload.origemDetalhe,
    });
    setPendenciaIds((prev) => new Set([...prev, docId]));
    void trackEvent("pendencia_created_from_documento", { doc_id: docId });
    flash("Pendência criada.");
    onSaved?.();
  }

  function createAgendaForDoc(docId: DocumentoEssencialId) {
    const doc = docs[docId];
    if (!doc?.dataVencimento) {
      flash("Informe o vencimento do documento antes de agendar.");
      return;
    }
    if (agendaDocIds.has(docId)) {
      flash("Evento de agenda já existe para este documento.");
      return;
    }
    const payload = buildAgendaFromDocumento(docId, doc.dataVencimento, today);
    addAgendaEvent({
      title: payload.title,
      date: payload.date,
      type: payload.type,
      note: payload.note,
      prioridade: payload.prioridade,
      recurrence: "nenhuma",
      source: "manual",
      updatedAt: new Date().toISOString(),
    });
    setAgendaDocIds((prev) => new Set([...prev, docId]));
    flash("Evento criado na agenda.");
    onSaved?.();
  }

  function createFinancialForDoc(docId: DocumentoEssencialId, custoStr: string) {
    const custo = Number(custoStr.replace(",", "."));
    if (!Number.isFinite(custo) || custo <= 0) {
      flash("Informe um valor válido para o custo previsto.");
      return;
    }
    const doc = docs[docId];
    const payload = buildFinancialFromDocumento(docId, custo, doc?.dataVencimento);
    addFinancialEntry(currentMonthKey(), {
      type: payload.type,
      title: payload.title,
      amount: payload.amount,
      dueDate: payload.dueDate,
      category: payload.category,
      notes: payload.notes,
      status: "previsto",
    });
    setShowCustoForm(null);
    flash("Custo previsto criado no financeiro.");
    onSaved?.();
  }

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <DocumentosCollapsedButton
          cadastrados={cadastrados}
          criticosNaoConfirmados={criticosNaoConfirmados}
          naoAplica={naoAplica}
          naoTenho={naoTenho}
          precisa={precisa}
          tenho={tenho}
          total={total}
          onOpen={() => {
            setExpanded(true);
            setActiveFilter(defaultFilter);
          }}
        />
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div id="documentos-essenciais-panel" className="rounded-lg border border-navy-100/80 bg-white/[0.88] p-4 shadow-card-md">

        {/* ── Cabeçalho ── */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">Documentos essenciais</p>
            {savedFeedback ? (
              <p className="text-[11px] text-sage-700 animate-fade-in">Salvo</p>
            ) : (
              <p className="text-[11px] text-navy-400">{total} documentos essenciais em 6 categorias</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Fechar documentos essenciais"
            className="min-h-8 rounded-full px-2.5 text-[11.5px] text-navy-400 hover:bg-navy-50 hover:text-navy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
          >
            Fechar
          </button>
        </div>

        <DocumentosStatsHeader
          activeFilter={activeFilter}
          cadastrados={cadastrados}
          onFilterChange={setActiveFilter}
          summary={summary}
        />

        {/* ── Feedback de ação ── */}
        {actionFeedback && (
          <div className="mb-2 rounded-lg bg-sage-50 px-3 py-2 text-[11.5px] text-sage-800">
            {actionFeedback}
          </div>
        )}

        {/* ── Estado vazio inicial ── */}
        {cadastrados === 0 && (
          <div className="mb-3">
            <EmptyState
              title="Nenhum documento revisado ainda"
              description="Comece pelos essenciais para montar a base de segurança jurídica do condomínio."
              actionLabel="Começar pelo AVCB"
              onAction={() => quickSave("avcb_clcb", "precisa_localizar")}
            />
          </div>
        )}

        {/* ── Cartão de prioridade: próximo crítico a confirmar ── */}
        {!isFiltered && criticosNaoConfirmados > 0 && firstUnfilledCritical && (
          <div className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3.5 py-3">
            <p className="text-[10.5px] font-semibold text-amber-700 mb-1.5">
              {cadastrados === 0
                ? "Comece pelo essencial"
                : "Próximo documento essencial a confirmar"}
            </p>
            <p className="text-[13px] font-semibold leading-snug text-navy-800 mb-2.5">
              {DOCUMENTO_LABEL[firstUnfilledCritical]}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(["tenho", "precisa_localizar", "nao_se_aplica"] as DocumentoStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => quickSave(firstUnfilledCritical, s)}
                  className="min-h-[44px] rounded-full bg-white/[0.86] px-4 py-1 text-[11.5px] font-semibold text-navy-700 ring-1 ring-navy-200 hover:bg-white hover:ring-navy-400 active:scale-95 transition-all"
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            {DOC_HINT_MAP[firstUnfilledCritical] && getWhereToFind(DOC_HINT_MAP[firstUnfilledCritical]!) && (
              <p className="text-[10.5px] leading-snug text-navy-400">
                <span className="font-medium">Onde encontrar:</span>{" "}
                {getWhereToFind(DOC_HINT_MAP[firstUnfilledCritical]!)}
              </p>
            )}
          </div>
        )}

        {/* ── Lista filtrada ou por grupos ── */}
        {isFiltered ? (
          // Vista flat filtrada
          <div className="space-y-1.5">
            {filteredIds.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-navy-400">
                Nenhum documento neste filtro.
              </p>
            ) : (
              filteredIds.map((id) => {
                const docId = id as DocumentoEssencialId;
                return renderDocCard(docId);
              })
            )}
          </div>
        ) : (
          // Vista por grupos (comportamento original)
          <div className="space-y-2">
            {GRUPOS.map((cat) => {
              const idsGrupo = DOCUMENTOS_ESSENCIAIS_IDS
                .filter((id) => DOCUMENTO_CATEGORIA[id as DocumentoEssencialId] === cat)
                .sort((a, b) =>
                  (CRIT_ORDER[DOCUMENTO_CRITICIDADE[a as DocumentoEssencialId]] ?? 2) -
                  (CRIT_ORDER[DOCUMENTO_CRITICIDADE[b as DocumentoEssencialId]] ?? 2)
                );

              const tenhoGrupo        = idsGrupo.filter((id) => docs[id]?.status === "tenho").length;
              const precisaGrupo      = idsGrupo.filter((id) => docs[id]?.status === "precisa_localizar").length;
              const naoTenhoGrupo     = idsGrupo.filter((id) => docs[id]?.status === "nao_tenho").length;
              const cadastradosGrupo  = idsGrupo.filter((id) => !!docs[id]).length;
              const aberto            = grupoAberto === cat;

              const criticalIds = idsGrupo.filter((id) => DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica");
              const showAll     = grupoMostrandoTodos.has(cat) || cadastradosGrupo > 0 || criticalIds.length === 0;
              const idsToShow   = showAll ? idsGrupo : criticalIds;
              const hiddenCount = showAll ? 0 : idsGrupo.length - criticalIds.length;

              const barColor = cadastradosGrupo === 0
                ? ""
                : tenhoGrupo === idsGrupo.length
                ? "bg-sage-500"
                : tenhoGrupo > 0
                ? "bg-amber-400"
                : "bg-terracotta-300";

              return (
                <DocumentosGroupSection
                  key={cat}
                  aberto={aberto}
                  barColor={barColor}
                  cadastradosGrupo={cadastradosGrupo}
                  cat={cat}
                  hiddenCount={hiddenCount}
                  idsGrupoLength={idsGrupo.length}
                  idsToShow={idsToShow}
                  naoTenhoGrupo={naoTenhoGrupo}
                  onShowAll={() => setGrupoMostrandoTodos((prev) => new Set([...prev, cat]))}
                  onToggle={() => setGrupoAberto(aberto ? null : cat)}
                  precisaGrupo={precisaGrupo}
                  renderDocCard={renderDocCard}
                  tenhoGrupo={tenhoGrupo}
                />
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          ★ = documentos críticos · Controle auxiliar — não substitui guarda documental oficial, orientação jurídica ou técnica.
        </p>
      </div>
    </section>
  );

  // ── Card de documento (shared entre vista flat e grupo) ─────────────────────
  function renderDocCard(docId: DocumentoEssencialId) {
    const id = docId as string;
    const doc = docs[id];
    const status = doc?.status;
    const critico = DOCUMENTO_CRITICIDADE[docId] === "critica";
    const isEditing = editingId === id;
    const hasOnde = !!doc?.ondeEsta;
    const hasLink = !!doc?.linkExterno;
    const hintId = DOC_HINT_MAP[docId];
    const whereToFind = hintId ? getWhereToFind(hintId) : null;
    const vencido = !!doc && isDocumentoVencido(doc, today);
    const proximo = !!doc && !vencido && isDocumentoProximoVencimento(doc, 60, today);
    const faltante = isDocumentoFaltante(doc);
    const hasPendencia = pendenciaIds.has(id);
    const hasAgenda = agendaDocIds.has(id);
    const hasVencimento = !!doc?.dataVencimento;
    const showCusto = showCustoForm === id;

    return (
      <div key={id} className={`rounded-lg px-3 py-2 ${vencido ? "bg-terracotta-50/60 border border-terracotta-100" : proximo ? "bg-amber-50/50 border border-amber-100" : "bg-white"}`}>
        {/* Linha principal */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            {critico && (
              <span className="mt-0.5 shrink-0 text-[9px] font-bold text-terracotta-500 uppercase tracking-wide">★</span>
            )}
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-navy-800 leading-snug">
                {DOCUMENTO_LABEL[docId]}
              </p>
              {vencido && (
                <p className="text-[10px] font-medium text-terracotta-700">Vencido em {doc!.dataVencimento}</p>
              )}
              {proximo && (
                <p className="text-[10px] text-amber-700">Vence em {doc!.dataVencimento}</p>
              )}
            </div>
          </div>
          {!isEditing && (
            status ? (
              <button
                type="button"
                onClick={() => openEditor(id)}
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_BADGE[status]}`}
              >
                {STATUS_LABEL[status]}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openEditor(id)}
                className="shrink-0 text-[10.5px] text-navy-400 hover:text-navy-600"
              >
                Registrar
              </button>
            )
          )}
        </div>

        {/* Metadados */}
        {!isEditing && (hasOnde || hasLink) && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {hasOnde && <span className="text-[10.5px] text-navy-400">Local: {doc!.ondeEsta}</span>}
            {hasLink && <span className="max-w-[160px] truncate text-[10.5px] text-navy-400">Ref.: {doc!.linkExterno}</span>}
          </div>
        )}

        {/* Dica de localização */}
        {!isEditing && status === "precisa_localizar" && whereToFind && (
          <p className="mt-1 text-[10.5px] leading-snug text-amber-600">
            <span className="font-medium">Onde encontrar:</span> {whereToFind}
          </p>
        )}

        {/* CTAs operacionais */}
        {!isEditing && (faltante || vencido || hasVencimento) && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(faltante || vencido) && (
              <button
                type="button"
                onClick={() => createPendenciaForDoc(docId)}
                className={`text-[10.5px] font-medium ${hasPendencia ? "text-navy-300 cursor-default" : "text-terracotta-700 hover:text-terracotta-800"}`}
                disabled={hasPendencia}
              >
                {hasPendencia ? "Pendência criada" : "Criar pendência"}
              </button>
            )}
            {hasVencimento && (
              <button
                type="button"
                onClick={() => createAgendaForDoc(docId)}
                className={`text-[10.5px] font-medium ${hasAgenda ? "text-navy-300 cursor-default" : "text-navy-500 hover:text-navy-700"}`}
                disabled={hasAgenda}
              >
                {hasAgenda ? "Agendado" : "Agendar renovação"}
              </button>
            )}
            {!showCusto && (
              <button
                type="button"
                onClick={() => setShowCustoForm(showCusto ? null : id)}
                className="text-[10.5px] text-navy-400 hover:text-navy-600"
              >
                + custo previsto
              </button>
            )}
          </div>
        )}

        {/* Mini-form de custo previsto */}
        {!isEditing && showCusto && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={editingCusto}
              onChange={(e) => setEditingCusto(e.target.value)}
              placeholder="Valor estimado (R$)"
              className="flex-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-[12px] text-navy-800"
            />
            <button
              type="button"
              onClick={() => createFinancialForDoc(docId, editingCusto)}
              className="rounded-full bg-navy-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-navy-800"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => { setShowCustoForm(null); setEditingCusto(""); }}
              className="text-[11px] text-navy-400"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Editor inline */}
        {isEditing && (
          <div className="mt-2.5 space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {(["tenho", "nao_tenho", "precisa_localizar", "nao_se_aplica"] as DocumentoStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditingStatus(s)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                    editingStatus === s
                      ? "bg-navy-700 text-white ring-navy-700"
                      : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {editingStatus === "precisa_localizar" && whereToFind && (
              <div className="rounded-lg bg-amber-50/70 px-3 py-2">
                <p className="text-[10.5px] leading-snug text-amber-700">
                  <span className="font-medium">Onde encontrar:</span> {whereToFind}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[10px] font-medium text-navy-500">
                Vencimento <span className="text-navy-300">(opcional)</span>
              </label>
              <input
                type="date"
                value={editingVencimento}
                onChange={(e) => setEditingVencimento(e.target.value)}
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2 text-[12px] text-navy-800 outline-none focus:border-navy-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium text-navy-500">
                Onde está / localização <span className="text-navy-300">(opcional)</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                value={editingOnde}
                onChange={(e) => setEditingOnde(e.target.value)}
                placeholder="Ex: Pasta jurídica, drive da administradora"
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2 text-[12px] text-navy-800 placeholder-navy-300 outline-none focus:border-navy-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium text-navy-500">
                Link ou referência <span className="text-navy-300">(opcional)</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                value={editingLink}
                onChange={(e) => setEditingLink(e.target.value)}
                placeholder="Ex: drive.google.com/... ou nome do arquivo"
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2 text-[12px] text-navy-800 placeholder-navy-300 outline-none focus:border-navy-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveEditing(id)}
                disabled={!editingStatus}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[11.5px] font-medium text-white transition-all hover:bg-navy-900 active:scale-95 disabled:opacity-40"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={closeEditor}
                className="px-2 text-[11px] text-navy-400 hover:text-navy-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {hasPendencia && status === "precisa_localizar" && !isEditing && (
          <p className="mt-1 text-[10px] text-amber-600">Próximo passo criado</p>
        )}
      </div>
    );
  }
}
