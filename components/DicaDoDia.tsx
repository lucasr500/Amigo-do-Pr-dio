"use client";

import { useEffect, useState } from "react";

type Dica = {
  tema: string;
  texto: string;
  prompt: string;
};

const DICAS: Dica[] = [
  {
    tema: "AVCB",
    texto: "O Auto de Vistoria do Corpo de Bombeiros precisa ser renovado periodicamente. Com o AVCB vencido, o síndico pode responder pessoalmente por acidentes de incêndio.",
    prompt: "O que é AVCB e quando precisa renovar?",
  },
  {
    tema: "Elevadores",
    texto: "A manutenção mensal do elevador é obrigatória por lei. Se acontecer um acidente com manutenção atrasada, o condomínio pode ser responsabilizado.",
    prompt: "Com que frequência o elevador precisa de manutenção?",
  },
  {
    tema: "Fundo de reserva",
    texto: "O fundo de reserva serve para cobrir gastos extraordinários do condomínio. O locatário só é obrigado a repor o que foi usado em despesas ordinárias.",
    prompt: "O locatário é obrigado a repor o fundo de reserva?",
  },
  {
    tema: "Assembleia",
    texto: "A Assembleia Geral Ordinária deve ser realizada uma vez por ano para aprovação de contas, previsão orçamentária e eleição do síndico.",
    prompt: "Quando deve ser feita a assembleia ordinária?",
  },
  {
    tema: "Seguro",
    texto: "O seguro condominial é obrigatório por lei. Sem ele, o síndico pode ser responsabilizado pessoalmente por danos não cobertos.",
    prompt: "O seguro do condomínio é obrigatório?",
  },
  {
    tema: "Inadimplência",
    texto: "O condomínio pode negativar o condômino inadimplente no SPC/Serasa após autorização em assembleia e notificação formal prévia.",
    prompt: "Como negativar morador inadimplente?",
  },
  {
    tema: "Obras",
    texto: "Obras que mexem com a estrutura do prédio precisam de ART de engenheiro ou arquiteto antes de começar. Sem isso, a responsabilidade recai sobre o condomínio.",
    prompt: "Que obras precisam de ART no condomínio?",
  },
  {
    tema: "Funcionários",
    texto: "O condomínio deve realizar exames médicos admissional, periódico e demissional em todos os funcionários registrados. A falta pode gerar multa trabalhista.",
    prompt: "Quais exames médicos o condomínio deve fazer nos funcionários?",
  },
  {
    tema: "Garagem",
    texto: "Vaga de garagem vinculada à unidade não pode ser vendida separadamente do apartamento, salvo se a convenção expressamente autorizar.",
    prompt: "Posso vender a vaga de garagem separada do apartamento?",
  },
  {
    tema: "Caixa d'água",
    texto: "A limpeza da caixa d'água deve ser feita a cada 6 meses, conforme a Portaria MS 888/2021. O síndico é responsável por garantir essa periodicidade.",
    prompt: "Com que frequência deve ser feita a limpeza da caixa d'água?",
  },
  {
    tema: "Extintores",
    texto: "Extintores de incêndio precisam de recarga anual e inspeção semestral. A falta de manutenção pode comprometer o AVCB e a responsabilidade do síndico.",
    prompt: "Com que frequência os extintores precisam ser revisados?",
  },
  {
    tema: "Prestação de contas",
    texto: "O síndico tem obrigação legal de prestar contas anualmente em assembleia. Qualquer condômino pode solicitar acesso ao balancete a qualquer momento.",
    prompt: "Com que frequência o síndico deve prestar contas?",
  },
];

type DicaDoDiaProps = {
  onAsk: (q: string) => void;
  compact?: boolean;
};

export default function DicaDoDia({ onAsk, compact = false }: DicaDoDiaProps) {
  const [dica, setDica] = useState<Dica | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const now = new Date();
    // Seed baseada no dia do ano → mesma dica durante todo o dia, troca automaticamente à meia-noite
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    setDica(DICAS[dayOfYear % DICAS.length]);
  }, []);

  if (!dica) return null;

  if (compact && !expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up stagger-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-cream-200 bg-cream-100/55 px-4 py-2.5 text-left transition-colors hover:bg-cream-100 active:bg-cream-200"
          aria-expanded={false}
        >
          <svg
            className="h-3.5 w-3.5 flex-shrink-0 text-navy-400"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6 9.5c0 1 .9 2 2 2s2-1 2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M8 12.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-navy-700">
            Dica operacional: {dica.tema}
          </span>
          <span className="text-[11.5px] font-medium text-navy-500">Abrir</span>
        </button>
      </section>
    );
  }

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up stagger-2">
      <div className="rounded-2xl border border-cream-200 bg-cream-100/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="h-3.5 w-3.5 text-navy-400"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M6 9.5c0 1 .9 2 2 2s2-1 2-2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path d="M8 12.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-500">
            Dica operacional · {dica.tema}
          </p>
          {compact && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="ml-auto min-h-8 rounded-full px-2 text-[11.5px] text-navy-500"
              aria-label="Recolher dica operacional"
            >
              Recolher
            </button>
          )}
        </div>
        <p className="text-[14px] leading-[1.65] text-navy-700">{dica.texto}</p>
        <button
          type="button"
          onClick={() => onAsk(dica.prompt)}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12px] font-medium text-navy-600 ring-1 ring-navy-200 transition-all duration-150 hover:bg-navy-50 active:scale-95"
        >
          Saber mais
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
