"use client";

type Props = {
  onAssistente?: (q: string) => void;
};

const RISK_CARDS = [
  {
    icon: "🛡️",
    title: "AVCB",
    risk: "Vencido, o prédio fica sujeito à autuação e interdição pelos bombeiros.",
    question: "O que acontece se o AVCB do condomínio vencer?",
  },
  {
    icon: "📋",
    title: "Seguro predial",
    risk: "Sem seguro vigente, o condomínio fica sem cobertura para incêndio, raio e explosão.",
    question: "Qual o prazo para renovar o seguro predial do condomínio?",
  },
  {
    icon: "🏛️",
    title: "Mandato do síndico",
    risk: "Mandato vencido sem eleição gera irregularidade jurídica na gestão do condomínio.",
    question: "O que acontece quando o mandato do síndico vence sem renovação?",
  },
  {
    icon: "👥",
    title: "Férias de funcionários",
    risk: "Férias vencidas acumulam passivo trabalhista — o síndico responde pessoalmente.",
    question: "Quais são os riscos trabalhistas de férias vencidas no condomínio?",
  },
  {
    icon: "📁",
    title: "Documentação essencial",
    risk: "Convenção, laudos e contratos inacessíveis atrasam decisões e expõem o condomínio juridicamente.",
    question: "Quais documentos o condomínio é obrigado a manter organizados?",
  },
  {
    icon: "🔧",
    title: "Manutenções periódicas",
    risk: "Elevador, extintores e caixa d'água sem manutenção geram responsabilidade penal para o síndico.",
    question: "Quais manutenções periódicas são obrigatórias no condomínio?",
  },
] as const;

export default function RiskPreviewStrip({ onAssistente }: Props) {
  return (
    <section className="px-5 pb-4 sm:px-6">
      <div className="mb-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
          Monitoramento ativo
        </p>
        <p className="mt-0.5 font-display text-[16px] font-semibold leading-snug text-navy-800">
          O que o Amigo do Prédio monitora para você
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {RISK_CARDS.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => onAssistente?.(card.question)}
            className="flex flex-col gap-1.5 rounded-[16px] border border-navy-100/70 bg-white/70 px-3.5 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.04)] transition-all hover:border-navy-200 hover:bg-white hover:shadow-sm active:scale-[0.97]"
          >
            <span className="text-[18px] leading-none" aria-hidden="true">{card.icon}</span>
            <p className="text-[12.5px] font-semibold leading-snug text-navy-800">{card.title}</p>
            <p className="text-[11px] leading-relaxed text-navy-500">{card.risk}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
