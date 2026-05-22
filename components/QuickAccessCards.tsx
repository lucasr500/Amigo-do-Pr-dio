"use client";

import { useState } from "react";
import { TOPICS, Topic } from "@/lib/data";

// ── Perguntas sugeridas por tema ──────────────────────────────────────────────
// Definidas inline — não altera lib/data.ts, KB nem motor de busca.
const THEME_QUESTIONS: Record<string, string[]> = {
  multas: [
    "Morador faz barulho toda noite. Posso multar?",
    "Qual o valor máximo de multa por infração ao regulamento?",
    "Como registrar formalmente uma advertência antes de multar?",
    "Posso multar morador sem prévia advertência?",
    "Morador recebeu multa e não pagou. O que fazer?",
  ],
  obras: [
    "Morador precisa avisar antes de fazer obra?",
    "Quais horários são permitidos para obra no condomínio?",
    "Obra causou dano à área comum. Quem paga?",
    "Morador está fazendo obra sem autorização. Como proceder?",
    "Qual documento exigir antes de autorizar obra em unidade?",
  ],
  assembleias: [
    "Preciso de assembleia urgente. Como convocar?",
    "Qual o prazo mínimo de convocação de assembleia?",
    "Quem pode convocar uma assembleia extraordinária?",
    "Quantos moradores precisam estar presentes para ter quórum?",
    "Assembleia pode ser realizada de forma online?",
  ],
  inadimplencia: [
    "Vizinho deve 3 meses. Quais são os passos?",
    "Posso cortar acesso de inadimplente à área de lazer?",
    "Em quanto tempo posso protestar o inadimplente em cartório?",
    "Qual o limite de multa sobre a dívida condominial?",
    "Inadimplente pode votar em assembleia?",
  ],
  funcionarios: [
    "Porteiro faltou sem avisar. O que posso fazer?",
    "Como calcular os encargos trabalhistas de um funcionário do condomínio?",
    "Posso dispensar um funcionário sem justa causa?",
    "Porteiro terceirizado: quem é responsável se houver acidente?",
    "Qual a jornada correta do porteiro?",
  ],
  convencao: [
    "Posso proibir pets pela convenção do condomínio?",
    "A convenção pode ser alterada sem assembleia?",
    "Regimento interno tem força legal?",
    "O que fazer quando a convenção é descumprida?",
    "Convenção proíbe Airbnb. Isso é válido?",
  ],
  locacao: [
    "Inquilino ignora as regras. Quem é responsável?",
    "Posso proibir a locação por temporada (Airbnb)?",
    "Dono precisa avisar o condomínio quando aluga o apartamento?",
    "Inquilino pode participar de assembleia?",
    "Multa aplicada ao inquilino: quem paga — locatário ou proprietário?",
  ],
  lgpd: [
    "Câmera no corredor do andar: precisa de autorização?",
    "Câmeras da portaria podem ser monitoradas por moradores?",
    "Como guardar imagens de câmeras de segurança dentro da lei?",
    "Quem pode ter acesso às imagens das câmeras?",
    "O condomínio precisa ter política de privacidade?",
  ],
  responsabilidade: [
    "Vazamento do apartamento de cima: quem paga?",
    "Infiltração da cobertura danificou meu apartamento. E agora?",
    "Área comum danificada por morador: como cobrar?",
    "Acidente em área comum: o condomínio é responsável?",
    "Dano causado por funcionário do condomínio: quem responde?",
  ],
  trabalhista: [
    "Qual a jornada correta do porteiro?",
    "Posso exigir que o funcionário use uniforme?",
    "Funcionário de condomínio tem direito a adicional noturno?",
    "Como deve ser feita a rescisão de funcionário do condomínio?",
    "Síndico pode ser considerado empregado do condomínio?",
  ],
  gestao: [
    "Síndico pode decidir sozinho sem assembleia?",
    "Quais decisões precisam obrigatoriamente de assembleia?",
    "Síndico pode contratar empresa sem orçamentos?",
    "Como o síndico presta contas aos moradores?",
    "Mandato do síndico terminou. O que acontece?",
  ],
  financeiro: [
    "Como calcular o reajuste necessário da cota condominial?",
    "O que compõe o rateio do condomínio?",
    "Fundo de reserva: qual o percentual adequado?",
    "Síndico pode fazer obra usando fundo de reserva?",
    "Como justificar aumento de cota condominial para os moradores?",
  ],
};

type QuickAccessCardsProps = {
  onSelect: (topic: Topic) => void;
  collapsed?: boolean;
};

export default function QuickAccessCards({ onSelect, collapsed = false }: QuickAccessCardsProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleQuestionClick = (topic: Topic, question: string) => {
    setSelectedTopic(null);
    setExpanded(false);
    onSelect({ ...topic, examplePrompt: question });
  };

  const handleBack = () => {
    setSelectedTopic(null);
  };

  // Lista de perguntas do tema selecionado
  const renderQuestionList = (topic: Topic) => {
    const questions = THEME_QUESTIONS[topic.id] ?? [topic.examplePrompt];
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
        >
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11.5px] font-medium">Temas</span>
        </button>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-[16px]" aria-hidden="true">{topic.icon}</span>
          <p className="text-[13px] font-semibold text-navy-800">{topic.title}</p>
        </div>

        <ul className="space-y-2">
          {questions.map((q, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleQuestionClick(topic, q)}
                className="group w-full rounded-[14px] border border-navy-100/70 bg-white/80 px-4 py-3 text-left transition-all hover:border-navy-200 hover:bg-white hover:shadow-sm active:scale-[0.98]"
              >
                <p className="text-[12.5px] leading-snug text-navy-700 group-hover:text-navy-900">
                  {q}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Estado não-colapsado: grade de temas sempre visível
  if (!collapsed) {
    return (
      <section className="px-5 pb-7 sm:px-6 sm:pb-8 animate-fade-in-up stagger-3">
        <div className="mb-3">
          <h3 className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">
            Perguntar por tema
          </h3>
        </div>
        {selectedTopic ? (
          renderQuestionList(selectedTopic)
        ) : (
          <TopicGrid onSelect={handleTopicClick} />
        )}
      </section>
    );
  }

  // Estado colapsado: botão toggle + conteúdo
  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
      <button
        type="button"
        onClick={() => { setExpanded((v) => !v); if (expanded) setSelectedTopic(null); }}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-navy-100/70 bg-white/80 px-4 py-2.5 text-left transition-all duration-200 hover:bg-white active:scale-[0.99]"
        aria-expanded={expanded}
      >
        <span className="text-[11.5px] font-medium text-navy-600">
          Perguntar sobre outro tema
        </span>
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 text-navy-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2.5 animate-fade-in">
          {selectedTopic ? (
            renderQuestionList(selectedTopic)
          ) : (
            <TopicGrid onSelect={handleTopicClick} />
          )}
        </div>
      )}
    </section>
  );
}

// ── Grade de temas ─────────────────────────────────────────────────────────────

function TopicGrid({ onSelect }: { onSelect: (topic: Topic) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {TOPICS.map((topic, idx) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onSelect(topic)}
          style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
          className="group relative flex min-h-[136px] flex-col items-start gap-2 rounded-[18px] border border-cream-200/90 bg-white/92 p-3.5 text-left opacity-0 shadow-[0_1px_2px_rgba(31,49,71,0.03),0_12px_26px_-24px_rgba(31,49,71,0.28)] animate-fade-in-up transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-100 hover:bg-white hover:shadow-[0_10px_28px_-22px_rgba(31,49,71,0.34)] active:scale-[0.98] sm:p-4"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-cream-100 text-[15px] transition-colors duration-200 group-hover:bg-navy-50">
            <span aria-hidden="true">{topic.icon}</span>
          </div>
          <span className="text-[12.5px] font-semibold leading-snug text-navy-800 sm:text-[13px]">
            {topic.title}
          </span>
          <span className="text-[10.5px] text-navy-400">
            Ver perguntas →
          </span>
          <svg
            className="absolute right-3 top-3.5 h-3.5 w-3.5 text-navy-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
