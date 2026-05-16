"use client";

type Props = {
  onSetup?: () => void;
  onAssistente?: () => void;
};

const MONITORED_ITEMS = [
  { icon: "📋", label: "AVCB" },
  { icon: "🛡️", label: "Seguro" },
  { icon: "👥", label: "AGO" },
  { icon: "💧", label: "Caixa d'água" },
  { icon: "🧯", label: "Extintores" },
  { icon: "🛗", label: "Elevador" },
];

export default function Hero({ onSetup, onAssistente }: Props) {
  return (
    <section className="px-5 pt-3 pb-5 sm:px-6 sm:pt-4">
      <div className="animate-fade-in-up stagger-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">
          Amigo do Prédio
        </p>
        <h2 className="mt-1.5 font-display text-[26px] font-medium leading-[1.15] tracking-tight text-navy-800 sm:text-[32px]">
          Acompanhe seu{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-navy-900">condomínio</span>
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-0 right-0 z-0 h-2.5 bg-sage-200/70"
            />
          </span>{" "}
          em dia
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-navy-500">
          Vencimentos, manutenções, documentos e obrigações legais — tudo monitorado em um lugar.
        </p>

        {/* Preview do que é monitorado */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {MONITORED_ITEMS.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full border border-navy-100 bg-white/80 px-2.5 py-1 text-[11px] text-navy-500"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 animate-fade-in-up stagger-2">
        {onSetup && (
          <button
            type="button"
            onClick={onSetup}
            className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2 text-[12.5px] font-medium text-cream-50 shadow-sm transition-all hover:bg-navy-900 active:scale-[0.97]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Registrar dados do prédio
          </button>
        )}
        <p className="mt-2 text-[11px] text-navy-400">
          Leva menos de 2 minutos. O sistema passa a monitorar automaticamente.
        </p>
        {onAssistente && (
          <button
            type="button"
            onClick={onAssistente}
            className="mt-2.5 text-[11.5px] text-navy-500 underline underline-offset-2 transition-colors hover:text-navy-700"
          >
            Ou faça uma pergunta ao Assistente agora →
          </button>
        )}
      </div>
    </section>
  );
}
