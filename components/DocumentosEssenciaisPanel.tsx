"use client";

import { useEffect, useState } from "react";
import {
  getDocumentos,
  upsertDocumento,
  addPendencia,
  getPendenciasAbertas,
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
import { trackEvent } from "@/lib/telemetry";
import { getWhereToFind } from "@/lib/discovery-hints";

type Props = { onSaved?: () => void };

const STATUS_LABEL: Record<DocumentoStatus, string> = {
  tenho:             "Tenho",
  nao_tenho:         "Não tenho",
  precisa_localizar: "Localizar",
  nao_se_aplica:     "N/A",
};

const STATUS_BADGE: Record<DocumentoStatus, string> = {
  tenho:             "bg-navy-50 text-navy-600 ring-navy-100",
  nao_tenho:         "bg-terracotta-50 text-terracotta-700 ring-terracotta-100",
  precisa_localizar: "bg-amber-50 text-amber-700 ring-amber-100",
  nao_se_aplica:     "bg-navy-50 text-navy-400 ring-navy-100",
};

const CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  seguranca:   "Segurança",
  trabalhista: "Trabalhista",
  juridico:    "Jurídico",
  operacional: "Operacional",
  fiscal:      "Fiscal",
  manutencao:  "Manutenção",
};

const CATEGORIA_COR: Record<DocumentoCategoria, string> = {
  seguranca:   "bg-terracotta-50 text-terracotta-700",
  trabalhista: "bg-amber-50 text-amber-700",
  juridico:    "bg-navy-50 text-navy-600",
  operacional: "bg-teal-50 text-teal-700",
  fiscal:      "bg-purple-50 text-purple-700",
  manutencao:  "bg-orange-50 text-orange-700",
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

const GRUPOS: DocumentoCategoria[] = ["juridico", "seguranca", "manutencao", "trabalhista", "operacional", "fiscal"];

const GRUPO_DESCRICAO: Record<DocumentoCategoria, string> = {
  juridico:    "Base legal do condomínio",
  seguranca:   "Documentos obrigatórios de segurança",
  manutencao:  "Contratos e laudos técnicos",
  trabalhista: "Documentação de pessoal",
  operacional: "Contratos e comprovantes operacionais",
  fiscal:      "Situação fiscal e tributária",
};

const EMPTY_STATE_EXPERT: Record<DocumentoCategoria, string> = {
  juridico:    "Convenção, regimento e ata de eleição são a base legal do condomínio. Sem eles, decisões em assembleia podem ser contestadas.",
  seguranca:   "AVCB, SPDA e brigada de incêndio são exigências do Corpo de Bombeiros. A falta pode gerar interdição do prédio.",
  manutencao:  "Contratos de elevador e laudos técnicos comprovam que a manutenção obrigatória está sendo feita. Protegem o síndico em caso de acidente.",
  trabalhista: "CCT, PPRA/PGR e PCMSO são obrigações trabalhistas para quem tem funcionários. A ausência gera passivo e autuação.",
  operacional: "Comprovantes de serviços periódicos demonstram que o condomínio está em ordem. Podem ser exigidos em auditoria de administradora.",
  fiscal:      "CND indica que o condomínio está quite com obrigações fiscais. Necessária em financiamentos e algumas negociações.",
};

// Maps document IDs to discovery hint IDs in lib/discovery-hints.ts
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

const CRIT_ORDER: Record<string, number> = { critica: 0, importante: 1, recomendada: 2 };

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
  const [pendenciaIds, setPendenciaIds] = useState<Set<string>>(new Set());
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    const stored = getDocumentos();
    const map: Record<string, DocumentoEssencial> = {};
    stored.forEach((d) => { map[d.id] = d; });
    setDocs(map);
    const pIds = new Set(
      getPendenciasAbertas()
        .filter((p) => p.origem === "documento" && !!p.matchedId)
        .map((p) => p.matchedId!)
    );
    setPendenciaIds(pIds);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

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

  // First critical document not yet confirmed — used for priority prompt
  const firstUnfilledCritical = DOCUMENTOS_ESSENCIAIS_IDS.find((id) => {
    const critico = DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica";
    const doc = docs[id];
    return critico && (!doc || (doc.status !== "tenho" && doc.status !== "nao_se_aplica"));
  }) as DocumentoEssencialId | undefined;

  const openEditor = (id: string) => {
    const doc = docs[id];
    setEditingId(id);
    setEditingStatus(doc?.status ?? null);
    setEditingOnde(doc?.ondeEsta ?? "");
    setEditingLink(doc?.linkExterno ?? "");
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditingStatus(null);
    setEditingOnde("");
    setEditingLink("");
  };

  const persistDoc = (id: string, status: DocumentoStatus, onde?: string, link?: string) => {
    const now = new Date().toISOString();
    const existing = docs[id];
    const updated: DocumentoEssencial = {
      id,
      status,
      updatedAt: now,
      ...(existing ? {
        vencimento: existing.vencimento,
        observacoes: existing.observacoes,
        dataVencimento: existing.dataVencimento,
      } : {}),
      ondeEsta: onde?.trim() || existing?.ondeEsta,
      linkExterno: link?.trim() || existing?.linkExterno,
    };
    const next = { ...docs, [id]: updated };
    setDocs(next);
    upsertDocumento(updated);

    if (status === "precisa_localizar" && !pendenciaIds.has(id)) {
      const titulo = PENDENCIA_TITULO[id as DocumentoEssencialId] ?? `Localizar: ${DOCUMENTO_LABEL[id as DocumentoEssencialId] ?? id}`;
      addPendencia({ titulo, categoria: "gestao", origem: "documento", matchedId: id });
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
    persistDoc(id, editingStatus, editingOnde, editingLink);
    closeEditor();
  };

  // One-tap save from priority card — no extra fields needed
  const quickSave = (id: DocumentoEssencialId, status: DocumentoStatus) => {
    persistDoc(id, status);
  };

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    const pct = cadastrados > 0 ? Math.round((tenho / Math.max(1, total - naoAplica)) * 100) : null;
    const subtitle = cadastrados === 0
      ? "AVCB, seguro, convenção, brigada e outros — mapeie a documentação do prédio"
      : criticosNaoConfirmados > 0
      ? `${tenho} confirmados · ${criticosNaoConfirmados} documento${criticosNaoConfirmados > 1 ? "s" : ""} crítico${criticosNaoConfirmados > 1 ? "s" : ""} sem confirmar`
      : `${tenho} confirmados · ${precisa} a localizar · ${naoTenho} ausentes`;

    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]" aria-hidden="true">
            📁
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">Documentos essenciais</p>
            <p className="text-[11.5px] text-navy-400 truncate">{subtitle}</p>
          </div>
          {pct !== null && (
            <span className={`shrink-0 text-[11px] font-semibold ${pct >= 70 ? "text-teal-600" : pct >= 40 ? "text-amber-600" : "text-terracotta-600"}`}>
              {pct}%
            </span>
          )}
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">
            {cadastrados === 0 ? "Mapear →" : "Ver →"}
          </span>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">Documentos essenciais</p>
            {savedFeedback ? (
              <p className="text-[11px] text-teal-600 animate-fade-in">✓ Salvo</p>
            ) : (
              <p className="text-[11px] text-navy-400">{total} documentos em 6 categorias</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Resumo de cobertura */}
        {cadastrados > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tenho > 0 && (
              <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-[10.5px] font-medium text-navy-600 ring-1 ring-navy-100">
                ✓ {tenho} confirmado{tenho !== 1 ? "s" : ""}
              </span>
            )}
            {precisa > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-medium text-amber-700 ring-1 ring-amber-100">
                ⟳ {precisa} a localizar
              </span>
            )}
            {naoTenho > 0 && (
              <span className="inline-flex items-center rounded-full bg-terracotta-50 px-2.5 py-0.5 text-[10.5px] font-medium text-terracotta-700 ring-1 ring-terracotta-100">
                ✗ {naoTenho} ausente{naoTenho !== 1 ? "s" : ""}
              </span>
            )}
            {criticosNaoConfirmados > 0 && (
              <span className="inline-flex items-center rounded-full bg-terracotta-100 px-2.5 py-0.5 text-[10.5px] font-medium text-terracotta-800 ring-1 ring-terracotta-200">
                ⚠ {criticosNaoConfirmados} crítico{criticosNaoConfirmados !== 1 ? "s" : ""} pendente{criticosNaoConfirmados !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Cartão de prioridade: próximo crítico a confirmar */}
        {criticosNaoConfirmados > 0 && firstUnfilledCritical && (
          <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50/50 px-3.5 py-3">
            <p className="text-[10.5px] font-semibold text-amber-700 mb-1.5">
              {cadastrados === 0
                ? "Comece pelo mais importante"
                : "Próximo documento crítico a confirmar"}
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
                  className="min-h-[44px] rounded-full bg-white px-4 py-1 text-[11.5px] font-medium text-navy-700 ring-1 ring-navy-200 hover:ring-navy-400 active:scale-95 transition-all"
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

        {/* Grupos por categoria */}
        <div className="space-y-2">
          {GRUPOS.map((cat) => {
            // Sort criticals first within each group
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

            // Progressive reveal: when a group has no registered docs, show only criticals first
            const criticalIds   = idsGrupo.filter((id) => DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica");
            const showAll       = grupoMostrandoTodos.has(cat) || cadastradosGrupo > 0 || criticalIds.length === 0;
            const idsToShow     = showAll ? idsGrupo : criticalIds;
            const hiddenCount   = showAll ? 0 : idsGrupo.length - criticalIds.length;

            // Progress bar color
            const barColor = cadastradosGrupo === 0
              ? ""
              : tenhoGrupo === idsGrupo.length
              ? "bg-teal-400"
              : tenhoGrupo > 0
              ? "bg-amber-400"
              : "bg-terracotta-300";

            return (
              <div key={cat} className="rounded-xl border border-navy-50 overflow-hidden">
                {/* Header do grupo */}
                <button
                  type="button"
                  onClick={() => setGrupoAberto(aberto ? null : cat)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-navy-50/50 transition-colors"
                >
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORIA_COR[cat]}`}>
                    {CATEGORIA_LABEL[cat]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] text-navy-500">{GRUPO_DESCRICAO[cat]}</p>
                    {/* Per-category progress bar */}
                    {cadastradosGrupo > 0 && (
                      <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-navy-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${Math.round((tenhoGrupo / idsGrupo.length) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cadastradosGrupo > 0 && (
                      <span className="text-[10px] text-navy-400">
                        {tenhoGrupo}/{idsGrupo.length}
                      </span>
                    )}
                    {precisaGrupo > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                    )}
                    {naoTenhoGrupo > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-terracotta-400" aria-hidden="true" />
                    )}
                    <svg
                      className={`h-3.5 w-3.5 text-navy-300 transition-transform ${aberto ? "rotate-90" : ""}`}
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {/* Itens do grupo */}
                {aberto && (
                  <div className="border-t border-navy-50 bg-navy-50/20 px-3 py-2 space-y-1.5">
                    {/* Empty state especialista por categoria */}
                    {cadastradosGrupo === 0 && (
                      <p className="text-[11px] leading-relaxed text-navy-500 px-0.5 py-1">
                        {EMPTY_STATE_EXPERT[cat]}
                      </p>
                    )}

                    {idsToShow.map((id) => {
                      const docId = id as DocumentoEssencialId;
                      const doc = docs[id];
                      const status = doc?.status;
                      const critico = DOCUMENTO_CRITICIDADE[docId] === "critica";
                      const isEditing = editingId === id;
                      const hasOnde = !!doc?.ondeEsta;
                      const hasLink = !!doc?.linkExterno;
                      const hintId = DOC_HINT_MAP[docId];
                      const whereToFind = hintId ? getWhereToFind(hintId) : null;

                      return (
                        <div key={id} className="rounded-lg bg-white px-3 py-2">
                          {/* Linha principal: nome + badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0 flex-1">
                              {critico && (
                                <span className="mt-0.5 shrink-0 text-[9px] font-bold text-terracotta-500 uppercase tracking-wide">★</span>
                              )}
                              <p className="text-[12px] font-medium text-navy-800 leading-snug">
                                {DOCUMENTO_LABEL[docId]}
                              </p>
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

                          {/* Metadados rápidos (onde / link) quando não editando */}
                          {!isEditing && (hasOnde || hasLink) && (
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                              {hasOnde && (
                                <span className="text-[10.5px] text-navy-400">
                                  📂 {doc.ondeEsta}
                                </span>
                              )}
                              {hasLink && (
                                <span className="text-[10.5px] text-navy-400 truncate max-w-[160px]">
                                  🔗 {doc.linkExterno}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Dica de localização para documentos a localizar (modo leitura) */}
                          {!isEditing && status === "precisa_localizar" && whereToFind && (
                            <p className="mt-1 text-[10.5px] leading-snug text-amber-600">
                              <span className="font-medium">Onde encontrar:</span> {whereToFind}
                            </p>
                          )}

                          {/* Editor inline */}
                          {isEditing && (
                            <div className="mt-2.5 space-y-2.5">
                              {/* Status buttons */}
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

                              {/* Discovery hint when marking as "precisa_localizar" */}
                              {editingStatus === "precisa_localizar" && whereToFind && (
                                <div className="rounded-lg bg-amber-50/70 px-3 py-2">
                                  <p className="text-[10.5px] leading-snug text-amber-700">
                                    <span className="font-medium">Onde encontrar:</span> {whereToFind}
                                  </p>
                                </div>
                              )}

                              {/* Onde está */}
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

                              {/* Link / referência */}
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

                              {/* Ações */}
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

                          {pendenciaIds.has(id) && status === "precisa_localizar" && !isEditing && (
                            <p className="mt-1 text-[10px] text-amber-600">Próximo passo criado</p>
                          )}
                        </div>
                      );
                    })}

                    {/* Progressive reveal: "Ver N mais" when showing only criticals */}
                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setGrupoMostrandoTodos((prev) => new Set([...prev, cat]))}
                        className="w-full py-2 text-[11px] text-navy-400 hover:text-navy-600 text-center transition-colors"
                      >
                        Ver {hiddenCount} mais →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          ★ = documentos críticos. &ldquo;Localizar&rdquo; cria próximo passo automático. &ldquo;N/A&rdquo; = não se aplica a este condomínio.
        </p>
      </div>
    </section>
  );
}
