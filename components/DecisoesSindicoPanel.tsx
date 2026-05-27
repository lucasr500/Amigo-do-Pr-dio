"use client";

import { useState } from "react";

type Decisao = {
  id: string;
  pergunta: string;
  categoria: string;
  resposta: string;
  alertas?: string[];
  dica?: string;
};

const DECISOES: Decisao[] = [
  {
    id: "cota_extra",
    categoria: "Financeiro",
    pergunta: "Posso cobrar cota extra sem aprovação em assembleia?",
    resposta:
      "Em geral, não. Cotas extraordinárias precisam ser aprovadas em assembleia (exceto emergências previstas na convenção). Verifique o que sua convenção condominial define para situações de urgência.",
    alertas: ["Cotas não aprovadas podem ser contestadas judicialmente."],
    dica: "Para obras urgentes, muitas convenções permitem aprovação por e-mail/app se houver quórum — consulte a sua.",
  },
  {
    id: "obras_areas_comuns",
    categoria: "Gestão",
    pergunta: "Quem aprova obras nas áreas comuns?",
    resposta:
      "Obras de conservação (manutenção do estado atual) podem ser aprovadas pelo síndico. Obras de melhorias ou benfeitorias exigem aprovação em assembleia com quórum definido na convenção.",
    dica: "Sempre documente qualquer obra com fotos, orçamentos e, quando necessário, ata da assembleia.",
  },
  {
    id: "inadimplencia_acao",
    categoria: "Financeiro",
    pergunta: "Quais são os passos para cobrar um inadimplente?",
    resposta:
      "1. Notificação extrajudicial (carta registrada). 2. Negativação em cartório de protesto. 3. Ação de cobrança no juizado especial (até 40 salários-mínimos) ou ação ordinária. O prazo prescricional é de 5 anos (lei 14.905/2024).",
    alertas: ["Verifique na convenção as multas e juros aplicáveis — a lei limita a 2% de multa + 1% de juros ao mês."],
  },
  {
    id: "ferias_funcionario",
    categoria: "Trabalhista",
    pergunta: "Quando as férias do funcionário precisam ser concedidas?",
    resposta:
      "As férias devem ser concedidas dentro dos 12 meses seguintes ao período aquisitivo (período concessivo). Se vencerem sem concessão, o empregador paga em dobro (CLT, art. 137).",
    alertas: ["Férias vencidas geram passivo trabalhista imediato."],
    dica: "Avise o funcionário com pelo menos 30 dias de antecedência e formalize por escrito.",
  },
  {
    id: "rescisao_funcionario",
    categoria: "Trabalhista",
    pergunta: "Como demitir um funcionário do condomínio?",
    resposta:
      "Sem justa causa: aviso prévio (proporcional ao tempo de serviço), FGTS + 40% de multa, 13º proporcional, férias + 1/3. Com justa causa: apenas saldo de salário e férias vencidas. Homologação no sindicato ou por advogado para vínculos longos.",
    alertas: ["Consulte a CCT aplicável — pode haver direitos adicionais."],
  },
  {
    id: "assembleia_quorum",
    categoria: "Gestão",
    pergunta: "Qual o quórum necessário para assembleias?",
    resposta:
      "AGO (assembleia ordinária): qualquer número após segunda convocação. Mudança na convenção: 2/3 dos condôminos. Mudança de regimento interno: maioria absoluta (50%+1). Obras voluptuárias: 2/3. Verifique sempre sua convenção, que pode exigir quóruns diferentes.",
    dica: "Na segunda convocação, o intervalo mínimo recomendado é de 30 minutos após a primeira.",
  },
  {
    id: "avcb_responsabilidade",
    categoria: "Legal",
    pergunta: "O que acontece se o AVCB estiver vencido?",
    resposta:
      "O síndico pode ser responsabilizado civil e criminalmente em caso de incêndio. O condomínio pode sofrer embargo pela prefeitura e o seguro predial pode ser invalidado se o sinistro ocorrer com AVCB vencido.",
    alertas: ["Renove com pelo menos 90 dias de antecedência — o processo pode demorar."],
  },
  {
    id: "seguro_predial_obrigatorio",
    categoria: "Legal",
    pergunta: "O seguro predial é obrigatório?",
    resposta:
      "Sim. O art. 1.346 do Código Civil torna obrigatório o seguro da edificação contra risco de incêndio ou destruição total ou parcial para todos os condomínios edilícios.",
    alertas: ["O seguro deve cobrir o valor de reconstrução do imóvel, não o valor de mercado."],
  },
  {
    id: "procuracoes_voto",
    categoria: "Gestão",
    pergunta: "Um condômino pode votar por procuração em assembleia?",
    resposta:
      "Sim. A procuração pode ser simples, não precisa ser registrada em cartório. O procurador não precisa ser condômino, salvo se a convenção exigir. Verifique se a convenção limita o número de procurações por pessoa.",
    dica: "Aceite procurações por e-mail ou WhatsApp se a convenção não proibir explicitamente.",
  },
  {
    id: "barulho_limite",
    categoria: "Gestão",
    pergunta: "Como agir em casos de barulho excessivo?",
    resposta:
      "1. Notificação verbal e depois escrita ao condômino. 2. Se persistir, aplique multa conforme regimento (geralmente 5x a cota). 3. Para casos graves, o prejudicado pode acionar a Polícia Civil (perturbação do sossego) e ajuizar ação cível.",
    dica: "Documente todas as ocorrências com data, hora e natureza do barulho antes de aplicar multa.",
  },
  {
    id: "vazamento_responsabilidade",
    categoria: "Gestão",
    pergunta: "Quem paga o conserto de vazamento entre apartamentos?",
    resposta:
      "Depende da origem: se o vazamento vem da área comum (laje, coluna), é responsabilidade do condomínio. Se vem do apartamento de cima (encanamento interno, box, área privativa), é responsabilidade daquele proprietário.",
    alertas: ["Sempre identifique a origem antes de assumir a responsabilidade."],
    dica: "Um laudo de empresa especializada pode ser necessário para definir a origem.",
  },
  {
    id: "multa_regimento",
    categoria: "Gestão",
    pergunta: "Como aplicar uma multa por infração ao regimento?",
    resposta:
      "1. Notificação escrita ao infrator com descrição da infração. 2. Prazo de defesa (recomendado: 5 a 10 dias). 3. Análise da defesa. 4. Aplicação da multa por escrito, com base no regimento. O valor máximo é 5x a cota condominial por infração (exceto convenção que estabeleça mais).",
    dica: "Todas as multas devem ser devidamente documentadas e comunicadas por escrito.",
  },
  {
    id: "pet_condominio",
    categoria: "Gestão",
    pergunta: "O condomínio pode proibir animais?",
    resposta:
      "Não completamente. O STJ consolidou que convenção não pode proibir genericamente a presença de animais domésticos (REsp 1.783.076). Pode regulamentar uso das áreas comuns e exigir vacinas/identificação. Animais que causem perigo ou perturbação reiterada podem ser objeto de notificação.",
    alertas: ["Tente mediação antes de qualquer medida mais rígida."],
  },
  {
    id: "locatario_direitos",
    categoria: "Gestão",
    pergunta: "Locatários podem votar em assembleia?",
    resposta:
      "Sim, desde que tenham procuração do proprietário e este não compareça. Locatários podem participar e votar em assuntos do interesse direto deles (administração do condomínio), mas não em assuntos que alterem a convenção ou regimento.",
  },
  {
    id: "sindico_responsabilidade",
    categoria: "Legal",
    pergunta: "Em que situações o síndico pode ser responsabilizado pessoalmente?",
    resposta:
      "O síndico responde pessoalmente por: negligência na manutenção de áreas comuns que causem dano, omissão em casos que exijam providências urgentes, desvio de verbas ou gestão fraudulenta, descumprimento de obrigações trabalhistas dos funcionários do condomínio.",
    alertas: ["Mantenha registros de todas as decisões e providências tomadas."],
    dica: "O seguro de responsabilidade civil do síndico (D&O) é uma proteção recomendada.",
  },
];

const CATEGORIAS = Array.from(new Set(DECISOES.map((d) => d.categoria)));

export default function DecisoesSindicoPanel() {
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("Todos");

  const decisoesFiltradas = filtro === "Todos"
    ? DECISOES
    : DECISOES.filter((d) => d.categoria === filtro);

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]" aria-hidden="true">
            ⚖️
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">Decisões do síndico</p>
            <p className="text-[11.5px] text-navy-400">
              {DECISOES.length} situações comuns com orientação prática
            </p>
          </div>
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">Consultar →</span>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">Decisões do síndico</p>
            <p className="text-[10.5px] text-navy-400">Orientação prática — não é consultoria jurídica</p>
          </div>
          <button
            type="button"
            onClick={() => { setExpanded(false); setOpenId(null); }}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Filtros por categoria */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {["Todos", ...CATEGORIAS].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setFiltro(cat); setOpenId(null); }}
              className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                filtro === cat
                  ? "bg-navy-700 text-white ring-navy-700"
                  : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de decisões */}
        <div className="space-y-2">
          {decisoesFiltradas.map((d) => {
            const isOpen = openId === d.id;
            return (
              <div
                key={d.id}
                className="rounded-xl border border-navy-50 bg-navy-50/20 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : d.id)}
                  className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-medium uppercase tracking-wide text-navy-400">
                      {d.categoria}
                    </span>
                    <p className="text-[12.5px] font-medium leading-snug text-navy-800">
                      {d.pergunta}
                    </p>
                  </div>
                  <svg
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-navy-50 px-3 pb-3 pt-2.5 space-y-2">
                    <p className="text-[12px] leading-relaxed text-navy-700">{d.resposta}</p>

                    {d.alertas && d.alertas.length > 0 && (
                      <div className="rounded-lg bg-amber-50 px-3 py-2 space-y-0.5">
                        {d.alertas.map((a, i) => (
                          <p key={i} className="text-[11px] leading-relaxed text-amber-700">
                            ⚠ {a}
                          </p>
                        ))}
                      </div>
                    )}

                    {d.dica && (
                      <div className="rounded-lg bg-navy-50 px-3 py-2">
                        <p className="text-[11px] leading-relaxed text-navy-600">
                          💡 {d.dica}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          Orientações baseadas na legislação geral. Situações específicas podem variar conforme convenção, estado e município. Consulte um advogado para casos complexos.
        </p>
      </div>
    </section>
  );
}
