"use client";

import BrandMark from "@/components/BrandMark";

type Props = {
  onSetup?: () => void;
  onAssistente?: () => void;
  onSuggestionSelect?: (q: string) => void;
};

export default function Hero({ onSetup, onAssistente }: Props) {
  return (
    <section className="px-5 pb-5 pt-2 sm:px-6 sm:pt-4">
      <div className="animate-fade-in-up stagger-1 overflow-hidden rounded-[22px] bg-navy-700 px-5 py-5 text-cream-100 shadow-[0_1px_2px_rgba(12,29,39,0.10),0_16px_40px_-24px_rgba(12,29,39,0.55)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-100/70">
              Monitoramento condominial
            </p>
            <p className="mt-1 text-[12.5px] text-cream-100/72">
              Monitora prazos do prédio e orienta em situações críticas.
            </p>
          </div>
          <BrandMark className="h-14 w-14 shrink-0 ring-1 ring-cream-100/10" rounded="rounded-[18px]" />
        </div>

        <h2 className="max-w-[330px] font-display text-[28px] font-semibold leading-[1.08] text-cream-50 sm:text-[32px]">
          Seu prédio precisa de memória.
        </h2>
        <p className="mt-3 max-w-[350px] text-[14px] leading-relaxed text-cream-100/82">
          Registre AVCB, seguro e mandato para ativar alertas, pendências e saúde operacional. Gratuito, sem conta.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {onSetup && (
            <button
              type="button"
              onClick={onSetup}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cream-100 px-4 py-2 text-[13px] font-semibold text-navy-800 shadow-sm transition-all duration-200 hover:bg-cream-50 active:scale-[0.98]"
            >
              Ativar monitoramento
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {onAssistente && (
            <button
              type="button"
              onClick={onAssistente}
              className="min-h-10 rounded-full px-2 text-[12.5px] font-medium text-cream-100/78 transition-colors hover:text-cream-50"
            >
              Consultar o Assistente
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
