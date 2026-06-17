"use client";

import BrandMark from "@/components/BrandMark";

type Props = {
  onSetup?: () => void;
  onAssistente?: () => void;
  onDemo?: () => void;
  onSuggestionSelect?: (q: string) => void;
};

export default function Hero({ onSetup, onAssistente, onDemo }: Props) {
  return (
    <section className="px-5 pb-5 pt-2 sm:px-6 sm:pt-4">
      <div className="animate-fade-in-up stagger-1 overflow-hidden rounded-[28px] border border-navy-100/20 bg-navy-900 px-5 py-5 text-cream-100 shadow-elevated">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cream-100/68">
              Comunicação do Condomínio
            </p>
            <p className="mt-1 max-w-[260px] text-[12.5px] leading-relaxed text-cream-100/72">
              Cockpit completo para organizar rotina, prazos, documentos e decisões.
            </p>
          </div>
          <BrandMark className="h-14 w-14 shrink-0 ring-1 ring-cream-100/10" rounded="rounded-lg" />
        </div>

        <h2 className="max-w-[330px] font-display text-[28px] font-semibold leading-[1.08] text-cream-50 sm:text-[32px]">
          Comece com valor antes de configurar tudo.
        </h2>
        <p className="mt-3 max-w-[350px] text-[14px] leading-relaxed text-cream-100/82">
          Veja uma rotina preenchida, entenda o cockpit e depois cadastre os dados essenciais no seu ritmo.
        </p>

        <div className="mt-4 grid gap-2">
          {["Veja uma rotina preenchida.", "Cadastre os documentos essenciais.", "Crie sua primeira pendência."].map((item, index) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream-100 text-[11px] font-bold text-navy-900">
                {index + 1}
              </span>
              <span className="text-[12px] font-medium text-cream-100/82">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {onDemo && (
            <div>
              <button
                type="button"
                onClick={onDemo}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cream-100 px-5 py-2.5 text-[13px] font-semibold text-navy-900 shadow-card transition-all duration-200 hover:bg-cream-50 active:scale-[0.98]"
              >
                Ver rotina preenchida
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="mt-1.5 text-[11px] text-cream-100/50">
                Condomínio exemplo — seus dados não são afetados
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {onSetup && (
              <button
                type="button"
                onClick={onSetup}
                className="min-h-10 rounded-full border border-white/10 px-4 py-2 text-[12.5px] font-semibold text-cream-100/82 transition-colors hover:bg-white/[0.08] hover:text-cream-50"
              >
                Configurar meu condomínio
              </button>
            )}
            {onAssistente && (
              <button
                type="button"
                onClick={onAssistente}
                className="min-h-10 rounded-full px-2 text-[12.5px] font-medium text-cream-100/78 transition-colors hover:text-cream-50"
              >
                Fazer uma pergunta
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
