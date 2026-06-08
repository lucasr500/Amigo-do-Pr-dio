"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  addPendencia,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { COMUNICADO_TEMPLATES, ComunicadoId } from "@/lib/comunicados";
import { emitComunicadoRegistered } from "@/lib/community-timeline";

type ComunicadoAnchor =
  | "comunicado"
  | "comunicado-infracao"
  | "comunicado-obra"
  | "comunicado-convocacao"
  | "comunicado-cobranca";

type Props = {
  targetAnchor?: string | null;
  highlightAnchor?: string | null;
};

const ANCHOR_TO_TEMPLATE: Partial<Record<ComunicadoAnchor, ComunicadoId>> = {
  "comunicado-infracao": "notificacao",
  "comunicado-obra": "obra",
  "comunicado-convocacao": "assembleia",
  "comunicado-cobranca": "cobranca",
};

const FOLLOWUP_TITLES: Record<ComunicadoId, string> = {
  assembleia:          "Acompanhar resultado da assembleia",
  resultado_assembleia:"Acompanhar deliberações da assembleia",
  obra:                "Acompanhar obra aprovada",
  obra_emergencial:    "Acompanhar reparo emergencial",
  manutencao_preventiva: "Acompanhar manutenção preventiva",
  interrupcao_agua:    "Verificar retorno do fornecimento de água",
  interrupcao_energia: "Verificar retorno do fornecimento de energia",
  dedetizacao:         "Acompanhar resultado da dedetização",
  limpeza_caixa:       "Arquivar laudo de limpeza da caixa",
  notificacao:         "Acompanhar notificação enviada",
  barulho:             "Monitorar ocorrências de barulho",
  areas_comuns:        "Verificar uso das áreas comuns",
  cobranca:            "Acompanhar cobrança enviada",
  inadimplencia_geral: "Monitorar evolução da inadimplência",
  prestacao_contas:    "Acompanhar prestação de contas",
  seguranca:           "Acompanhar medidas de segurança",
  fornecedor:          "Acompanhar transição de fornecedor",
  posse_sindico:       "Registrar início de mandato",
  boas_praticas:       "Monitorar convivência no condomínio",
  geral:               "Acompanhar comunicado enviado",
};

const TEMPLATE_TO_ANCHOR: Record<ComunicadoId, ComunicadoAnchor> = {
  assembleia:          "comunicado-convocacao",
  resultado_assembleia:"comunicado-convocacao",
  obra:                "comunicado-obra",
  obra_emergencial:    "comunicado-obra",
  manutencao_preventiva: "comunicado",
  interrupcao_agua:    "comunicado",
  interrupcao_energia: "comunicado",
  dedetizacao:         "comunicado",
  limpeza_caixa:       "comunicado",
  notificacao:         "comunicado-infracao",
  barulho:             "comunicado-infracao",
  areas_comuns:        "comunicado",
  cobranca:            "comunicado-cobranca",
  inadimplencia_geral: "comunicado-cobranca",
  prestacao_contas:    "comunicado",
  seguranca:           "comunicado",
  fornecedor:          "comunicado",
  posse_sindico:       "comunicado",
  boas_praticas:       "comunicado",
  geral:               "comunicado",
};

export default function ComunicadoPanel({ targetAnchor, highlightAnchor }: Props) {
  const [selectedId, setSelectedId] = useState<ComunicadoId | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<ComunicadoAnchor>("comunicado");
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [condoName, setCondoName] = useState("");
  const [wasCopied, setWasCopied] = useState(false);
  const [followupCreated, setFollowupCreated] = useState(false);
  const [timelineRegistered, setTimelineRegistered] = useState(false);

  const AGO_PAUTA_DEFAULT =
    "Prestação de contas do exercício\nPrevisão orçamentária\nEleição de síndico, subsíndico e conselho\nAssuntos gerais";

  useEffect(() => {
    const profile = getProfile();
    setCondoName(profile?.nomeCondominio ?? "");
  }, []);

  useEffect(() => {
    if (!targetAnchor) return;
    const id = ANCHOR_TO_TEMPLATE[targetAnchor as ComunicadoAnchor];
    if (!id) return;
    setSelectedId(id);
    setActiveAnchor(targetAnchor as ComunicadoAnchor);
    const prefill: Record<string, string> = id === "assembleia"
      ? { tipo: "Ordinária", pauta: AGO_PAUTA_DEFAULT }
      : {};
    setValues(prefill);
    setCopied(false);
    setCopyError(false);
  }, [targetAnchor]);

  const template = COMUNICADO_TEMPLATES.find((t) => t.id === selectedId) ?? null;
  const preview = template ? template.generate(values, condoName) : "";

  const filledCount = Object.values(values).filter((v) => v && v.trim()).length;
  const hasPreview = preview.length > 0;

  const handleSelect = (id: ComunicadoId) => {
    setSelectedId(id);
    setActiveAnchor(TEMPLATE_TO_ANCHOR[id]);
    // AGO: pré-preenche tipo e pauta para Ordinária
    const prefill: Record<string, string> = id === "assembleia"
      ? { tipo: "Ordinária", pauta: AGO_PAUTA_DEFAULT }
      : {};
    setValues(prefill);
    setCopied(false);
    setCopyError(false);
    setWasCopied(false);
    setFollowupCreated(false);
    setTimelineRegistered(false);
    void trackEvent("comunicado_gerado", {
      tipo_comunicado: id,
      source: "ferramentas",
    });
  };

  const handleReset = () => {
    setSelectedId(null);
    setActiveAnchor("comunicado");
    setValues({});
    setCopied(false);
    setCopyError(false);
    setWasCopied(false);
    setFollowupCreated(false);
    setTimelineRegistered(false);
  };

  const handleCopy = async () => {
    if (!hasPreview) return;
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setCopyError(false);
      setWasCopied(true);
      void trackEvent("comunicado_copiado", {
        tipo_comunicado: selectedId ?? "",
        campos_preenchidos: filledCount,
        source: "ferramentas",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 6000);
    }
  };

  const setField = (fieldId: string, value: string) =>
    setValues((prev) => ({ ...prev, [fieldId]: value }));

  // ── Seletor de modelo ───────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <section
        id="comunicado"
        className={`scroll-mt-5 px-5 pb-6 sm:px-6 ${highlightAnchor === "comunicado" ? "tool-anchor-highlight" : ""}`}
      >
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
            Comunicados
          </h3>
          <span className="text-[11px] text-navy-400">Escolha um modelo</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {COMUNICADO_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.id)}
              className="flex min-h-[132px] flex-col items-start gap-1.5 rounded-xl border border-navy-100 bg-white px-3.5 py-3.5 text-left shadow-sm transition-all hover:border-navy-200 hover:shadow active:scale-[0.98]"
            >
              <span className="text-[20px] leading-none" aria-hidden="true">
                {t.icon}
              </span>
              <div>
                <p className="text-[12.5px] font-semibold leading-snug text-navy-800">
                  {t.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-navy-400">
                  {t.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // ── Formulário + prévia ─────────────────────────────────────────────────────
  return (
    <section
      id={activeAnchor}
      className={`scroll-mt-5 px-5 pb-6 sm:px-6 ${highlightAnchor === activeAnchor ? "tool-anchor-highlight" : ""}`}
    >
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-[11.5px] text-navy-400 transition-colors hover:text-navy-700"
          aria-label="Voltar para modelos"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Modelos
        </button>
        <span className="text-[11px] text-navy-300">/</span>
        <span className="text-[11.5px] font-medium text-navy-600">{template!.title}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        {/* Campos */}
        <div className="space-y-3.5 p-4">
          {template!.fields.map((field) => (
            <div key={field.id}>
              <label
                htmlFor={`field-${field.id}`}
                className="mb-1.5 block text-[11.5px] font-medium text-navy-600"
              >
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={`field-${field.id}`}
                  value={values[field.id] ?? ""}
                  onChange={(e) => setField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="min-h-24 w-full resize-none rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[14px] leading-relaxed text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
                />
              ) : field.type === "select" ? (
                <select
                  id={`field-${field.id}`}
                  value={values[field.id] ?? ""}
                  onChange={(e) => setField(field.id, e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[14px] text-navy-800 outline-none transition-colors focus:border-navy-400 focus:bg-white"
                >
                  <option value="">Selecionar...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`field-${field.id}`}
                  type={field.type}
                  value={values[field.id] ?? ""}
                  onChange={(e) => setField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-11 w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[14px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
                />
              )}
            </div>
          ))}
        </div>

        {!condoName && (
          <p className="px-4 pb-2 text-[10.5px] text-navy-400">
            Nome do condomínio vazio — cadastre em{" "}
            <span className="font-medium text-navy-500">Condomínio → Perfil</span> para aparecer no comunicado.
          </p>
        )}

        <div className="mx-4 border-t border-navy-50" />

        {/* Prévia */}
        <div className="p-4">
          <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.10em] text-navy-400">
            Prévia do comunicado
          </p>
          <div className="max-h-64 overflow-y-auto rounded-lg bg-navy-50/50 p-3.5">
            {filledCount > 0 ? (
              <pre className="whitespace-pre-wrap font-sans text-[14px] leading-[1.7] text-navy-700">
                {preview}
              </pre>
            ) : (
              <p className="text-[14px] italic text-navy-300">
                Preencha os campos acima para visualizar o comunicado.
              </p>
            )}
          </div>
        </div>

        {/* Ação copiar */}
        <div className="border-t border-navy-50 px-4 py-3.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={filledCount === 0}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-medium transition-all active:scale-[0.98] ${
              copied
                ? "bg-navy-700 text-white"
                : copyError
                  ? "bg-amber-500 text-white"
                  : "bg-navy-800 text-cream-50 hover:bg-navy-900 disabled:opacity-40"
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8l3.5 3.5L13 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Comunicado copiado
              </>
            ) : copyError ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 3v5M8 11v1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Não foi possível copiar
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M11 5V4a1.5 1.5 0 00-1.5-1.5h-6A1.5 1.5 0 002 4v7A1.5 1.5 0 003.5 12.5H5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Copiar comunicado
              </>
            )}
          </button>

          {/* Mensagem contextual abaixo do botão */}
          {copyError ? (
            <p className="mt-2 text-center text-[10.5px] text-amber-600">
              Selecione o texto da prévia e copie manualmente.
            </p>
          ) : copied ? (
            <p className="mt-2 text-center text-[10.5px] text-navy-500">
              Cole no WhatsApp, e-mail ou mural do condomínio.
            </p>
          ) : filledCount === 0 ? (
            <p className="mt-2 text-center text-[10.5px] text-navy-400">
              Preencha ao menos um campo para habilitar a cópia.
            </p>
          ) : (
            <p className="mt-2 text-center text-[10.5px] text-navy-400">
              Cole no WhatsApp, e-mail ou mural do condomínio.
            </p>
          )}
        </div>

        {/* CTAs pós-cópia — aparecem após o primeiro copiar */}
        {wasCopied && (
          <div className="border-t border-navy-50 px-4 py-3 space-y-2">
            {!followupCreated ? (
              <button
                type="button"
                onClick={() => {
                  const titulo = FOLLOWUP_TITLES[selectedId!] ?? "Acompanhar comunicado enviado";
                  addPendencia({ titulo, categoria: "comunicado", origem: "manual" });
                  setFollowupCreated(true);
                  void trackEvent("comunicado_followup_created", { template_type: selectedId ?? "" });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-navy-200 py-2.5 text-[12.5px] font-medium text-navy-600 transition-colors hover:bg-navy-50 active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Criar próximo passo de acompanhamento
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-1">
                <svg className="h-3.5 w-3.5 text-navy-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[12px] text-navy-500">Próximo passo criado com sucesso.</p>
              </div>
            )}

            {!timelineRegistered ? (
              <button
                type="button"
                onClick={() => {
                  emitComunicadoRegistered(selectedId!, template!.title);
                  setTimelineRegistered(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-navy-100 py-2.5 text-[12.5px] font-medium text-navy-500 transition-colors hover:bg-navy-50 active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5.5V8.5l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Registrar na timeline institucional
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-1">
                <svg className="h-3.5 w-3.5 text-sage-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[12px] text-navy-500">Comunicado registrado na timeline.</p>
              </div>
            )}
          </div>
        )}

        {/* Aviso contextual para templates sensíveis */}
        {(selectedId === "notificacao" || selectedId === "cobranca" || selectedId === "obra" || selectedId === "assembleia") && (
          <div className="border-t border-amber-100 px-4 py-3">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7.15 2.5L1.5 12a1 1 0 00.85 1.5h11.3a1 1 0 00.85-1.5L8.85 2.5a1 1 0 00-1.7 0z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <p className="text-[10.5px] leading-relaxed text-amber-700">
                Antes de enviar, confira se o texto está alinhado à convenção do condomínio e às decisões tomadas em assembleia, quando aplicável. Revise sempre o comunicado final.
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer do modelo */}
        {template!.disclaimer && (
          <div className="border-t border-navy-50 px-4 py-3">
            <p className="text-[10.5px] leading-relaxed text-navy-400">
              <span className="font-medium">Modelo orientativo.</span>{" "}
              {template!.disclaimer}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
