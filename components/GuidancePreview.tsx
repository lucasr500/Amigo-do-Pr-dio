"use client";

// Preview estático do monitoramento operacional — visível apenas no estado sem dados.
// Não lê nem escreve em localStorage. Não interfere no GuidancePanel real.
// Itens são dados fixos de exemplo, nunca gerados dinamicamente.

type Props = {
  onSetup?: () => void;
};

export default function GuidancePreview({ onSetup }: Props) {
  return (
    <section className="px-5 pb-4 sm:px-6">

      {/* Rótulo de seção */}
      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
          O que o app monitora
        </p>
        <span className="rounded-full border border-navy-200/80 bg-navy-50 px-2 py-px text-[9.5px] font-semibold uppercase tracking-[0.07em] text-navy-400">
          Exemplo
        </span>
      </div>

      <div className="rounded-[18px] border border-navy-100/70 bg-white/70 px-4 py-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_12px_-6px_rgba(31,49,71,0.07)]">

        {/* Item mockado 1 — crítico */}
        <div className="flex items-start gap-3">
          <div className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-terracotta-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug text-navy-800">
              AVCB vence em 23 dias
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-navy-500">
              Renove com o Corpo de Bombeiros antes do vencimento para manter a regularidade do prédio.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex select-none items-center rounded-full border border-navy-100 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-navy-500">
                Ver orientação
              </span>
              <span className="inline-flex select-none items-center rounded-full px-2.5 py-1 text-[11px] text-navy-400">
                Salvar em Pendências
              </span>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="my-3 h-px bg-navy-100/50" />

        {/* Item mockado 2 — atenção */}
        <div className="flex items-start gap-3">
          <div className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug text-navy-800">
              Mandato termina em 68 dias
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-navy-500">
              Convoque a assembleia com antecedência para eleição ou renovação do mandato.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 border-t border-navy-100/50 pt-3.5">
          <p className="text-[12px] leading-relaxed text-navy-500">
            Esses alertas aparecem automaticamente quando você cadastra as datas essenciais do prédio.
          </p>
          {onSetup && (
            <button
              type="button"
              onClick={onSetup}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-cream-50 transition-all duration-200 hover:bg-navy-800 active:scale-[0.98]"
            >
              Ativar monitoramento de prazos
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
