"use client";

type Props = {
  onSetup?: () => void;
  onAssistente?: () => void;
  onSuggestionSelect?: (q: string) => void;
};

const SITUATIONS = [
  { icon: "🔊", label: "Barulho após as 22h",        q: "Morador está fazendo barulho depois das 22h. Como devo agir?" },
  { icon: "🔨", label: "Obra sem aviso",              q: "Morador começou obra sem comunicar ao condomínio. O que fazer?" },
  { icon: "💰", label: "Querem expor inadimplente",   q: "Querem divulgar nome de inadimplente no grupo do WhatsApp. É permitido?" },
  { icon: "🗳️", label: "Mandato vencendo",            q: "O mandato do síndico está perto do fim. Quais os próximos passos?" },
  { icon: "💧", label: "Vazamento entre apts.",       q: "Morador reclama de infiltração vinda do apartamento de cima. Quem é responsável e como devo proceder?" },
];

export default function Hero({ onSetup, onAssistente, onSuggestionSelect }: Props) {
  return (
    <section className="px-5 pt-3 pb-5 sm:px-6 sm:pt-4">
      <div className="animate-fade-in-up stagger-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">
          Amigo do Prédio
        </p>
        <h2 className="mt-1.5 font-display text-[26px] font-medium leading-[1.15] tracking-tight text-navy-800 sm:text-[32px]">
          Recebeu um{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-navy-900">problema</span>
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-0 right-0 z-0 h-2.5 bg-cream-200/80"
            />
          </span>{" "}
          no condomínio?
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-navy-500">
          Descreva a situação e receba orientação, próximo passo e um texto pronto para usar.
        </p>

        {/* Situações comuns — chips clicáveis que vão direto para o Assistente */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {SITUATIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onSuggestionSelect?.(s.q)}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white/80 px-2.5 py-1 text-[11px] text-navy-600 transition-all duration-150 hover:border-navy-300 hover:bg-navy-50 active:scale-95"
            >
              <span aria-hidden="true">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 animate-fade-in-up stagger-2 flex flex-wrap items-center gap-3">
        {onAssistente && (
          <button
            type="button"
            onClick={onAssistente}
            className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2 text-[12.5px] font-medium text-cream-50 shadow-sm transition-all hover:bg-navy-900 active:scale-[0.97]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Perguntar ao Assistente
          </button>
        )}
        {onSetup && (
          <button
            type="button"
            onClick={onSetup}
            className="text-[11.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600"
          >
            Ativar monitoramento →
          </button>
        )}
      </div>
    </section>
  );
}
