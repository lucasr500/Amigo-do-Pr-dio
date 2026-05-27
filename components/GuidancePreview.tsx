"use client";

// Mostrado quando o usuário ainda não tem dados do condomínio.
// Substituiu o preview estático com dados mockados por um checklist de ativação real.

import { useEffect, useState } from "react";
import {
  getMemoriaAssistida,
  getMemoriaOperacional,
  getFuncionarios,
  getDocumentos,
} from "@/lib/session";

type Props = {
  onSetup?: () => void;
};

type Step = {
  label: string;
  detail: string;
  done: boolean;
};

function buildSteps(): Step[] {
  const m = getMemoriaOperacional();
  const a = getMemoriaAssistida();
  const funcs = getFuncionarios();
  const docs = getDocumentos();

  const hasDates = !!(
    m.vencimentoAVCB || m.vencimentoSeguro || m.fimMandatoSindico ||
    a.avcb || a.seguro || a.mandato
  );
  const hasFuncs = funcs.length > 0;
  const hasDocs  = docs.length > 0;

  return [
    {
      label: "Datas essenciais (AVCB, seguro, mandato)",
      detail: "Ativa alertas de prazo e o painel de saúde operacional.",
      done: hasDates,
    },
    {
      label: "Funcionários e situação de férias",
      detail: "Previne riscos trabalhistas e passivos com férias vencidas.",
      done: hasFuncs,
    },
    {
      label: "Documentos essenciais do condomínio",
      detail: "Mantém convenção, laudos e contratos organizados e rastreáveis.",
      done: hasDocs,
    },
  ];
}

export default function GuidancePreview({ onSetup }: Props) {
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    setSteps(buildSteps());
  }, []);

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="px-5 pb-4 sm:px-6">
      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
          Para começar
        </p>
        {doneCount > 0 && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-px text-[9.5px] font-semibold uppercase tracking-[0.07em] text-emerald-600">
            {doneCount} de 3 feito{doneCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="rounded-[18px] border border-navy-100/70 bg-white/70 px-4 py-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_12px_-6px_rgba(31,49,71,0.07)]">
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i}>
              {i > 0 && <div className="mb-3 h-px bg-navy-100/50" />}
              <div className="flex items-start gap-3">
                <span
                  className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    step.done
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-navy-100 text-navy-400"
                  }`}
                >
                  {step.done ? "✓" : String(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold leading-snug ${step.done ? "text-navy-400 line-through decoration-navy-300" : "text-navy-800"}`}>
                    {step.label}
                  </p>
                  {!step.done && (
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-500">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-navy-100/50 pt-3.5">
          {onSetup && (
            <button
              type="button"
              onClick={onSetup}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-cream-50 transition-all duration-200 hover:bg-navy-800 active:scale-[0.98]"
            >
              {doneCount > 0 ? "Continuar configurando" : "Configurar Meu prédio"}
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
