"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { COMUNICADO_TEMPLATES, ComunicadoId } from "@/lib/comunicados";

export default function ComunicadoPanel() {
  const [selectedId, setSelectedId] = useState<ComunicadoId | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [condoName, setCondoName] = useState("");

  useEffect(() => {
    const profile = getProfile();
    setCondoName(profile?.nomeCondominio ?? "");
  }, []);

  const template = COMUNICADO_TEMPLATES.find((t) => t.id === selectedId) ?? null;
  const preview = template ? template.generate(values, condoName) : "";

  const filledCount = Object.values(values).filter((v) => v && v.trim()).length;
  const hasPreview = preview.length > 0;

  const handleSelect = (id: ComunicadoId) => {
    setSelectedId(id);
    setValues({});
    setCopied(false);
    setCopyError(false);
    void trackEvent("comunicado_gerado", {
      tipo_comunicado: id,
      source: "ferramentas",
    });
  };

  const handleReset = () => {
    setSelectedId(null);
    setValues({});
    setCopied(false);
    setCopyError(false);
  };

  const handleCopy = async () => {
    if (!hasPreview) return;
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setCopyError(false);
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
      <section className="px-5 pb-6 sm:px-6">
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
              className="flex flex-col items-start gap-1.5 rounded-xl border border-navy-100 bg-white px-3.5 py-3.5 text-left shadow-sm transition-all hover:border-navy-200 hover:shadow active:scale-[0.98]"
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
    <section className="px-5 pb-6 sm:px-6">
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
                  className="w-full resize-none rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] leading-relaxed text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
                />
              ) : field.type === "select" ? (
                <select
                  id={`field-${field.id}`}
                  value={values[field.id] ?? ""}
                  onChange={(e) => setField(field.id, e.target.value)}
                  className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 outline-none transition-colors focus:border-navy-400 focus:bg-white"
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
                  className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
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
              <pre className="whitespace-pre-wrap font-sans text-[12px] leading-[1.7] text-navy-700">
                {preview}
              </pre>
            ) : (
              <p className="text-[12px] italic text-navy-300">
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
                ? "bg-sage-500 text-white"
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
            <p className="mt-2 text-center text-[10.5px] text-sage-600">
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
