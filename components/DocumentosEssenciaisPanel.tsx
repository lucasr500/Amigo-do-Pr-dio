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
  type DocumentoEssencial,
  type DocumentoStatus,
  type DocumentoEssencialId,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = { onSaved?: () => void };

const STATUS_LABEL: Record<DocumentoStatus, string> = {
  tenho:           "Tenho",
  nao_tenho:       "Não tenho",
  precisa_localizar: "Preciso localizar",
  nao_se_aplica:   "Não se aplica",
};

const STATUS_BADGE: Record<DocumentoStatus, string> = {
  tenho:           "bg-navy-50 text-navy-600 ring-navy-100",
  nao_tenho:       "bg-terracotta-50 text-terracotta-700 ring-terracotta-100",
  precisa_localizar: "bg-amber-50 text-amber-700 ring-amber-100",
  nao_se_aplica:   "bg-navy-50 text-navy-400 ring-navy-100",
};

const PENDENCIA_TITULO: Partial<Record<DocumentoEssencialId, string>> = {
  convencao:   "Localizar convenção condominial",
  regimento:   "Localizar regimento interno",
  ata_eleicao: "Encontrar ata de eleição do síndico vigente",
  apolice_seguro: "Localizar apólice do seguro predial",
  avcb_clcb:   "Localizar AVCB ou CLCB do condomínio",
  contrato_elevador: "Localizar contrato de manutenção de elevadores",
  contrato_limpeza: "Localizar contrato de limpeza",
  contrato_portaria: "Localizar contrato de portaria / segurança",
  laudos_tecnicos: "Localizar laudos técnicos relevantes",
  extintores_comprovante: "Localizar comprovantes de manutenção de extintores",
  caixa_agua_comprovante: "Localizar comprovante de limpeza da caixa d'água",
  dedetizacao_comprovante: "Localizar comprovante de dedetização",
  cct_funcionarios: "Localizar CCT aplicável aos funcionários",
  controle_ferias: "Organizar controle de férias dos funcionários",
};

export default function DocumentosEssenciaisPanel({ onSaved }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [docs, setDocs] = useState<Record<string, DocumentoEssencial>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const counts = {
    tenho: Object.values(docs).filter((d) => d.status === "tenho").length,
    nao_tenho: Object.values(docs).filter((d) => d.status === "nao_tenho").length,
    precisa_localizar: Object.values(docs).filter((d) => d.status === "precisa_localizar").length,
    nao_se_aplica: Object.values(docs).filter((d) => d.status === "nao_se_aplica").length,
    total: DOCUMENTOS_ESSENCIAIS_IDS.length,
    cadastrados: Object.keys(docs).length,
  };

  const setStatus = (id: string, status: DocumentoStatus) => {
    const now = new Date().toISOString();
    const existing = docs[id];
    const updated: DocumentoEssencial = {
      id,
      status,
      updatedAt: now,
      ...(existing ? {
        vencimento: existing.vencimento,
        observacoes: existing.observacoes,
        ondeEsta: existing.ondeEsta,
      } : {}),
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

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    const pct = counts.cadastrados > 0
      ? Math.round((counts.tenho / counts.total) * 100)
      : null;
    const subtitle = counts.cadastrados === 0
      ? "Convenção, AVCB, seguro, ata de eleição e outros — clique para gerenciar"
      : `${counts.tenho} documentos confirmados · ${counts.precisa_localizar} para localizar · ${counts.nao_tenho} ausentes`;

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
            <p className="text-[11.5px] text-navy-400">{subtitle}</p>
          </div>
          {pct !== null && (
            <span className="shrink-0 text-[11px] font-semibold text-navy-500">{pct}% ok</span>
          )}
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">
            {counts.cadastrados === 0 ? "Gerenciar →" : "Ver →"}
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
            {savedFeedback && (
              <p className="text-[11px] text-navy-500 animate-fade-in">✓ Salvo</p>
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

        {counts.cadastrados === 0 && (
          <div className="mb-3 rounded-xl bg-navy-50/60 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-navy-600">
              Registre o status de cada documento. Não precisa fazer upload — apenas indicar se tem, precisa localizar ou não se aplica ao seu condomínio.
            </p>
          </div>
        )}

        {/* Resumo */}
        {counts.cadastrados > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {counts.tenho > 0 && (
              <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-[10.5px] font-medium text-navy-600 ring-1 ring-navy-100">
                ✓ {counts.tenho} confirmado{counts.tenho !== 1 ? "s" : ""}
              </span>
            )}
            {counts.precisa_localizar > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-medium text-amber-700 ring-1 ring-amber-100">
                ⟳ {counts.precisa_localizar} a localizar
              </span>
            )}
            {counts.nao_tenho > 0 && (
              <span className="inline-flex items-center rounded-full bg-terracotta-50 px-2.5 py-0.5 text-[10.5px] font-medium text-terracotta-700 ring-1 ring-terracotta-100">
                ✗ {counts.nao_tenho} ausente{counts.nao_tenho !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Lista de documentos */}
        <div className="space-y-2">
          {DOCUMENTOS_ESSENCIAIS_IDS.map((id) => {
            const doc = docs[id];
            const status = doc?.status;
            const isEditing = editingId === id;

            return (
              <div key={id} className="rounded-xl border border-navy-50 bg-navy-50/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-medium text-navy-800 leading-tight">
                    {DOCUMENTO_LABEL[id]}
                  </p>
                  {status && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setEditingId(id)}
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium ring-1 ${STATUS_BADGE[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </button>
                  )}
                  {!status && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setEditingId(id)}
                      className="shrink-0 text-[11px] text-navy-400 hover:text-navy-600"
                    >
                      Registrar
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["tenho", "nao_tenho", "precisa_localizar", "nao_se_aplica"] as DocumentoStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStatus(id, s);
                          setEditingId(null);
                        }}
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                          status === s
                            ? "bg-navy-700 text-white ring-navy-700"
                            : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 text-[11px] text-navy-400 hover:text-navy-600"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {pendenciaIds.has(id) && status === "precisa_localizar" && (
                  <p className="mt-1 text-[10px] text-amber-600">Pendência criada para lembrar de localizar</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          Documentos marcados como &ldquo;Preciso localizar&rdquo; geram um próximo passo automático. &ldquo;Não se aplica&rdquo; não prejudica a saúde operacional.
        </p>
      </div>
    </section>
  );
}
