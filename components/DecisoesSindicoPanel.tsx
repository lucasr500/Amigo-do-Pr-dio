"use client";

import { useState } from "react";

type Severidade = "critico" | "relevante" | "atencao" | "baixo";

type Decisao = {
  id: string;
  pergunta: string;
  categoria: string;
  severidade: Severidade;
  resposta: string;
  alertas?: string[];
  dica?: string;
};

const DECISOES: Decisao[] = [
  // ── CRÍTICO ──────────────────────────────────────────────────────────────────
  {
    id: "avcb_vencido",
    categoria: "Crítico",
    severidade: "critico",
    pergunta: "O AVCB está vencido — qual o risco imediato?",
    resposta:
      "Risco jurídico e penal imediato. Com AVCB vencido: (1) o seguro predial pode ser invalidado em caso de sinistro; (2) a prefeitura pode embargar o prédio; (3) o síndico pode ser responsabilizado civil e criminalmente em caso de incêndio ou acidente.",
    alertas: ["Inicie o processo de renovação com urgência — pode levar 60 a 90 dias.", "Notifique o conselho fiscal por escrito sobre o vencimento."],
    dica: "Contrate despachante especializado em AVCB para agilizar o processo junto ao Corpo de Bombeiros.",
  },
  {
    id: "funcionario_sem_registro",
    categoria: "Crítico",
    severidade: "critico",
    pergunta: "Descobri que funcionário trabalha sem registro — o que fazer?",
    resposta:
      "Registre imediatamente. O condomínio está exposto a passivo trabalhista integral retroativo (FGTS, INSS, 13º, férias, horas extras) mais multas da Receita e do MTE. A cada dia sem registro, o risco aumenta.",
    alertas: ["Passivo retroativo pode superar anos de salário.", "Fiscalização do MTE pode gerar auto de infração com multa por empregado não registrado."],
    dica: "Acione administradora ou escritório de RH especializado em condomínios para formalizar o vínculo com a data correta.",
  },
  {
    id: "atraso_salario",
    categoria: "Crítico",
    severidade: "critico",
    pergunta: "Não tenho caixa para pagar salário do funcionário — o que fazer?",
    resposta:
      "Salário deve ser pago até o 5º dia útil do mês seguinte (CLT, art. 459). Atraso gera multa de 1% ao dia + correção. Com mais de 30 dias de atraso, o funcionário pode pedir rescisão indireta (culpa do empregador) com todos os direitos rescisórios.",
    alertas: ["Rescisão indireta por atraso salarial é reconhecida pela Justiça do Trabalho.", "Priorize pagamento de salário antes de qualquer outra despesa operacional."],
    dica: "Se necessário, acione fundo de reserva ou faça cobrança emergencial de inadimplentes antes de atrasar salário.",
  },
  {
    id: "morador_ameaca",
    categoria: "Crítico",
    severidade: "critico",
    pergunta: "Um morador ameaçou ou agrediu funcionário ou síndico — o que fazer?",
    resposta:
      "1. Segurança imediata: retire a vítima da situação de risco. 2. Registre boletim de ocorrência (BO) na delegacia — imprescindível. 3. Documente com fotos, vídeos e depoimentos de testemunhas. 4. Notifique formalmente o condômino por escrito. 5. Se reincidente, convoque assembleia para discussão de medidas.",
    alertas: ["BO deve ser feito no mesmo dia — provas se perdem com o tempo.", "Funcionário agredido tem direito a afastamento e o condomínio pode responder por omissão."],
    dica: "Instale câmera na portaria e nas áreas comuns críticas — fundamental para provas futuras.",
  },
  {
    id: "seguro_vencido",
    categoria: "Crítico",
    severidade: "critico",
    pergunta: "O seguro predial venceu e ainda não renovei — qual o risco?",
    resposta:
      "Sem seguro vigente: (1) qualquer sinistro (incêndio, explosão, dano elétrico) sai do bolso do condomínio; (2) o síndico pode ser responsabilizado pessoalmente por omissão; (3) o Código Civil (art. 1.346) torna o seguro obrigatório para todos os condomínios edilícios.",
    alertas: ["Seguro contra incêndio é obrigação legal, não opção.", "Enquanto não renovar, o condomínio opera em risco integral."],
    dica: "Peça cotações a pelo menos 3 corretoras. O valor deve cobrir o custo de reconstrução total — não o valor de mercado.",
  },
  {
    id: "sindico_responsabilidade_penal",
    categoria: "Crítico",
    severidade: "critico",
    pergunta: "Em que situações o síndico pode ser responsabilizado criminalmente?",
    resposta:
      "O síndico responde penalmente por: omissão em manutenção que cause acidente (homicídio ou lesão culposa), AVCB vencido em caso de incêndio, descumprimento de obrigações trabalhistas com dolo, desvio ou apropriação indébita de verbas do condomínio.",
    alertas: ["Mantenha registros de todas as decisões, notificações e providências tomadas.", "Seguro D&O (responsabilidade civil do síndico) é altamente recomendado."],
    dica: "Documente tudo em ata, e-mail ou comunicado formal — a prova de que você agiu protege contra responsabilização.",
  },

  // ── FINANCEIRO ───────────────────────────────────────────────────────────────
  {
    id: "cota_extra",
    categoria: "Financeiro",
    severidade: "atencao",
    pergunta: "Posso cobrar cota extra sem aprovação em assembleia?",
    resposta:
      "Em geral, não. Cotas extraordinárias precisam ser aprovadas em assembleia (exceto emergências previstas na convenção). Verifique o que sua convenção condominial define para situações de urgência.",
    alertas: ["Cotas não aprovadas podem ser contestadas judicialmente."],
    dica: "Para obras urgentes, muitas convenções permitem aprovação por e-mail/app se houver quórum — consulte a sua.",
  },
  {
    id: "fundo_reserva_baixo",
    categoria: "Financeiro",
    severidade: "relevante",
    pergunta: "O fundo de reserva está muito baixo — como proceder?",
    resposta:
      "O fundo de reserva serve para emergências. Se estiver abaixo de 5% do orçamento anual, o condomínio opera sem margem de segurança. Apresente em assembleia uma proposta de recomposição: aumento temporário da taxa ou rateio específico.",
    alertas: ["Sem fundo de reserva, qualquer emergência vira crise financeira imediata."],
    dica: "Manter entre 10% e 20% do orçamento anual é a prática recomendada por administradoras experientes.",
  },
  {
    id: "inadimplencia_acao",
    categoria: "Financeiro",
    severidade: "relevante",
    pergunta: "Quais são os passos para cobrar um inadimplente?",
    resposta:
      "1. Notificação extrajudicial (carta registrada). 2. Negativação em cartório de protesto. 3. Ação de cobrança no juizado especial (até 40 salários-mínimos) ou ação ordinária. O prazo prescricional é de 5 anos (lei 14.905/2024).",
    alertas: ["Verifique na convenção as multas e juros aplicáveis — a lei limita a 2% de multa + 1% de juros ao mês."],
  },
  {
    id: "prestacao_contas",
    categoria: "Financeiro",
    severidade: "baixo",
    pergunta: "Como fazer uma prestação de contas transparente?",
    resposta:
      "Apresente mensalmente: extrato bancário, balancete com receitas e despesas por categoria, DRE (demonstração de resultado), previsão vs. realizado, e status do fundo de reserva. Distribua o relatório por e-mail e afixe no quadro de avisos.",
    dica: "Prestação de contas clara reduz conflitos e aumenta a confiança dos moradores na gestão.",
  },

  // ── TRABALHISTA ───────────────────────────────────────────────────────────────
  {
    id: "ferias_funcionario",
    categoria: "Trabalhista",
    severidade: "relevante",
    pergunta: "Quando as férias do funcionário precisam ser concedidas?",
    resposta:
      "As férias devem ser concedidas dentro dos 12 meses seguintes ao período aquisitivo (período concessivo). Se vencerem sem concessão, o empregador paga em dobro (CLT, art. 137).",
    alertas: ["Férias vencidas geram passivo trabalhista imediato."],
    dica: "Avise o funcionário com pelo menos 30 dias de antecedência e formalize por escrito.",
  },
  {
    id: "rescisao_funcionario",
    categoria: "Trabalhista",
    severidade: "relevante",
    pergunta: "Como demitir um funcionário do condomínio?",
    resposta:
      "Sem justa causa: aviso prévio (proporcional ao tempo de serviço), FGTS + 40% de multa, 13º proporcional, férias + 1/3. Com justa causa: apenas saldo de salário e férias vencidas. Homologação no sindicato ou por advogado para vínculos longos.",
    alertas: ["Consulte a CCT aplicável — pode haver direitos adicionais."],
  },
  {
    id: "advertencia_formal",
    categoria: "Trabalhista",
    severidade: "atencao",
    pergunta: "Como formalizar uma advertência a funcionário?",
    resposta:
      "A advertência deve ser por escrito, com: data, descrição da conduta, base na norma interna ou CCT, e assinatura do funcionário (recusa deve ser testemunhada). Até 2 advertências escritas + suspensão de 1 a 30 dias são requisitos para justa causa por reincidência.",
    dica: "Guarde os originais assinados no prontuário do funcionário por pelo menos 5 anos.",
  },
  {
    id: "acumulo_funcao",
    categoria: "Trabalhista",
    severidade: "atencao",
    pergunta: "Funcionário que acumula funções tem direito a remuneração extra?",
    resposta:
      "Depende da CCT. Em geral, se o funcionário exerce habitualmente função superior à contratada, pode receber o salário da função maior enquanto durar o acúmulo. O acúmulo informal e prolongado pode gerar pedido de equiparação salarial.",
    alertas: ["Formalize acordos de acúmulo de função por escrito para evitar reclamações trabalhistas."],
  },
  {
    id: "banco_horas",
    categoria: "Trabalhista",
    severidade: "baixo",
    pergunta: "Como funciona o banco de horas no condomínio?",
    resposta:
      "O banco de horas permite compensar horas extras sem pagamento imediato, desde que haja acordo coletivo ou individual por escrito. O prazo para compensação é de até 6 meses (acordo individual) ou 1 ano (acordo coletivo). Horas não compensadas no prazo devem ser pagas com adicional.",
    dica: "Registre o banco de horas mensalmente e dê ciência ao funcionário do saldo acumulado.",
  },
  {
    id: "ponto_eletronico",
    categoria: "Trabalhista",
    severidade: "atencao",
    pergunta: "O condomínio precisa de ponto eletrônico para os funcionários?",
    resposta:
      "Obrigatório para empresas com mais de 20 empregados (portaria MTE 671/2021). Para condomínios com menos funcionários, o ponto manual ou por aplicativo homologado é suficiente. O registro de ponto deve ser mantido por 5 anos.",
    alertas: ["Condomínio sem controle de ponto adequado fica vulnerável a reclamações trabalhistas de horas extras."],
  },

  // ── GESTÃO ────────────────────────────────────────────────────────────────────
  {
    id: "obras_areas_comuns",
    categoria: "Gestão",
    severidade: "atencao",
    pergunta: "Quem aprova obras nas áreas comuns?",
    resposta:
      "Obras de conservação (manutenção do estado atual) podem ser aprovadas pelo síndico. Obras de melhorias ou benfeitorias exigem aprovação em assembleia com quórum definido na convenção.",
    dica: "Sempre documente qualquer obra com fotos, orçamentos e, quando necessário, ata da assembleia.",
  },
  {
    id: "contratar_sem_assembleia",
    categoria: "Gestão",
    severidade: "atencao",
    pergunta: "O síndico pode contratar serviços sem aprovação em assembleia?",
    resposta:
      "Sim, para contratos dentro da previsão orçamentária aprovada e que não impliquem obra de benfeitoria. Para serviços novos, acima do limite da convenção ou que representem aumento de despesa não prevista, a aprovação em assembleia é necessária.",
    dica: "Consulte sempre a convenção para o limite de valor que o síndico pode contratar autonomamente.",
  },
  {
    id: "troca_administradora",
    categoria: "Gestão",
    severidade: "atencao",
    pergunta: "Como trocar de administradora de forma correta?",
    resposta:
      "1. Deliberação em assembleia com quórum definido na convenção. 2. Notificação à administradora atual conforme contrato (geralmente 30 a 90 dias). 3. Passagem formal de documentos, chaves, contratos, cadastros e saldos bancários. 4. Abertura de nova conta bancária em nome do condomínio.",
    alertas: ["Exija lista completa de documentos a receber na transição — convenção, plantas, contratos, livros de ocorrências, extrato do fundo de reserva."],
  },
  {
    id: "comunicado_decisao",
    categoria: "Gestão",
    severidade: "baixo",
    pergunta: "Toda decisão do síndico precisa de comunicado formal?",
    resposta:
      "Decisões que afetam condôminos (obras, multas, contratos relevantes, mudanças de rotina) devem ser comunicadas formalmente por escrito — circular, e-mail, app ou quadro de avisos. A formalização protege o síndico e garante que todos foram informados.",
    dica: "Guarde comprovantes de envio ou afixação — são prova de ciência em casos de contestação.",
  },
  {
    id: "conselho_fiscal",
    categoria: "Gestão",
    severidade: "baixo",
    pergunta: "Qual a função do conselho fiscal do condomínio?",
    resposta:
      "O conselho fiscal (ou consultivo) fiscaliza as contas do condomínio, emite parecer sobre a prestação de contas anual e pode convocar assembleia extraordinária se identificar irregularidades. Não tem poder executivo — não pode interferir nas decisões operacionais do síndico.",
    dica: "Inclua o conselho nas prestações de contas mensais — isso evita conflitos e cria aliados para as deliberações em assembleia.",
  },

  // ── ASSEMBLEIAS ───────────────────────────────────────────────────────────────
  {
    id: "assembleia_quorum",
    categoria: "Assembleias",
    severidade: "atencao",
    pergunta: "Qual o quórum necessário para assembleias?",
    resposta:
      "AGO (assembleia ordinária): qualquer número após segunda convocação. Mudança na convenção: 2/3 dos condôminos. Mudança de regimento interno: maioria absoluta (50%+1). Obras voluptuárias: 2/3. Verifique sempre sua convenção, que pode exigir quóruns diferentes.",
    dica: "Na segunda convocação, o intervalo mínimo recomendado é de 30 minutos após a primeira.",
  },
  {
    id: "procuracoes_voto",
    categoria: "Assembleias",
    severidade: "baixo",
    pergunta: "Um condômino pode votar por procuração em assembleia?",
    resposta:
      "Sim. A procuração pode ser simples, não precisa ser registrada em cartório. O procurador não precisa ser condômino, salvo se a convenção exigir. Verifique se a convenção limita o número de procurações por pessoa.",
    dica: "Aceite procurações por e-mail ou WhatsApp se a convenção não proibir explicitamente.",
  },
  {
    id: "votacao_digital",
    categoria: "Assembleias",
    severidade: "atencao",
    pergunta: "Assembleia por videoconferência ou votação por app é válida?",
    resposta:
      "Sim, desde a Lei 14.309/2022 é expressamente permitida a realização de assembleias híbridas ou 100% online, desde que todos os condôminos sejam convocados adequadamente e a plataforma permita identificação e registro de votos.",
    alertas: ["Guarde a gravação e o relatório de votação como prova."],
    dica: "Inclua na convocação o link da plataforma e instrução de acesso para evitar ausências por dificuldade técnica.",
  },
  {
    id: "convocacao_prazo",
    categoria: "Assembleias",
    severidade: "atencao",
    pergunta: "Qual o prazo mínimo de convocação de uma assembleia?",
    resposta:
      "O Código Civil não define prazo mínimo federal — a convenção condominial é quem define. Na ausência de previsão, a prática consolidada é de 8 a 10 dias de antecedência. Convocações com prazo muito curto podem ser contestadas.",
    alertas: ["Convocação inadequada pode invalidar as deliberações da assembleia."],
  },

  // ── LEGAL ─────────────────────────────────────────────────────────────────────
  {
    id: "avcb_responsabilidade",
    categoria: "Legal",
    severidade: "critico",
    pergunta: "O que acontece se o AVCB estiver vencido?",
    resposta:
      "O síndico pode ser responsabilizado civil e criminalmente em caso de incêndio. O condomínio pode sofrer embargo pela prefeitura e o seguro predial pode ser invalidado se o sinistro ocorrer com AVCB vencido.",
    alertas: ["Renove com pelo menos 90 dias de antecedência — o processo pode demorar."],
  },
  {
    id: "seguro_predial_obrigatorio",
    categoria: "Legal",
    severidade: "relevante",
    pergunta: "O seguro predial é obrigatório?",
    resposta:
      "Sim. O art. 1.346 do Código Civil torna obrigatório o seguro da edificação contra risco de incêndio ou destruição total ou parcial para todos os condomínios edilícios.",
    alertas: ["O seguro deve cobrir o valor de reconstrução do imóvel, não o valor de mercado."],
  },
  {
    id: "mandato_vencido",
    categoria: "Legal",
    severidade: "relevante",
    pergunta: "O mandato do síndico venceu e não houve eleição — o que fazer?",
    resposta:
      "O síndico com mandato vencido pode continuar no cargo até a eleição de substituto, mas fica em situação de risco jurídico — decisões tomadas nesse período podem ser contestadas. Convoque assembleia extraordinária para eleição com urgência.",
    alertas: ["Contratos assinados com mandato vencido podem ser questionados."],
    dica: "Convoque a assembleia com pelo menos 10 dias de antecedência e notifique o conselho fiscal.",
  },
  {
    id: "laudo_estrutural",
    categoria: "Legal",
    severidade: "relevante",
    pergunta: "Quando o condomínio precisa de laudo estrutural?",
    resposta:
      "Laudos estruturais são obrigatórios para edificações acima de determinada idade conforme a legislação municipal (muitos municípios seguem a ABNT NBR 5674). Prédios com sinais visíveis de patologia (fissuras, infiltrações, recalque) precisam de vistoria imediata — independente de prazo.",
    alertas: ["Ignorar sinais de patologia pode gerar responsabilidade penal em caso de acidente."],
    dica: "Contrate engenheiro ou arquiteto com ART/RRT para qualquer laudo técnico.",
  },

  // ── CONVIVÊNCIA ───────────────────────────────────────────────────────────────
  {
    id: "barulho_limite",
    categoria: "Convivência",
    severidade: "atencao",
    pergunta: "Como agir em casos de barulho excessivo?",
    resposta:
      "1. Notificação verbal e depois escrita ao condômino. 2. Se persistir, aplique multa conforme regimento (geralmente 5x a cota). 3. Para casos graves, o prejudicado pode acionar a Polícia Civil (perturbação do sossego) e ajuizar ação cível.",
    dica: "Documente todas as ocorrências com data, hora e natureza do barulho antes de aplicar multa.",
  },
  {
    id: "vazamento_responsabilidade",
    categoria: "Convivência",
    severidade: "atencao",
    pergunta: "Quem paga o conserto de vazamento entre apartamentos?",
    resposta:
      "Depende da origem: se o vazamento vem da área comum (laje, coluna), é responsabilidade do condomínio. Se vem do apartamento de cima (encanamento interno, box, área privativa), é responsabilidade daquele proprietário.",
    alertas: ["Sempre identifique a origem antes de assumir a responsabilidade."],
    dica: "Um laudo de empresa especializada pode ser necessário para definir a origem.",
  },
  {
    id: "multa_regimento",
    categoria: "Convivência",
    severidade: "atencao",
    pergunta: "Como aplicar uma multa por infração ao regimento?",
    resposta:
      "1. Notificação escrita ao infrator com descrição da infração. 2. Prazo de defesa (recomendado: 5 a 10 dias). 3. Análise da defesa. 4. Aplicação da multa por escrito, com base no regimento. O valor máximo é 5x a cota condominial por infração (exceto convenção que estabeleça mais).",
    dica: "Todas as multas devem ser devidamente documentadas e comunicadas por escrito.",
  },
  {
    id: "pet_condominio",
    categoria: "Convivência",
    severidade: "baixo",
    pergunta: "O condomínio pode proibir animais?",
    resposta:
      "Não completamente. O STJ consolidou que convenção não pode proibir genericamente a presença de animais domésticos (REsp 1.783.076). Pode regulamentar uso das áreas comuns e exigir vacinas/identificação. Animais que causem perigo ou perturbação reiterada podem ser objeto de notificação.",
    alertas: ["Tente mediação antes de qualquer medida mais rígida."],
  },
  {
    id: "locatario_direitos",
    categoria: "Convivência",
    severidade: "baixo",
    pergunta: "Locatários podem votar em assembleia?",
    resposta:
      "Sim, desde que tenham procuração do proprietário e este não compareça. Locatários podem participar e votar em assuntos do interesse direto deles (administração do condomínio), mas não em assuntos que alterem a convenção ou regimento.",
  },
  {
    id: "obra_horario",
    categoria: "Convivência",
    severidade: "baixo",
    pergunta: "Quais são os horários permitidos para obras nos apartamentos?",
    resposta:
      "Os horários são definidos pelo regimento interno ou pela lei municipal de silêncio. Na ausência de previsão específica, o padrão mais comum é: segunda a sexta das 8h às 17h, sábados das 9h às 13h. Domingos e feriados: geralmente proibido.",
    dica: "Inclua no regulamento a exigência de comunicado prévio ao síndico antes do início de obras.",
  },
];

const SEVERIDADE_CONFIG: Record<Severidade, { label: string; dot: string; badgeClass: string }> = {
  critico:   { label: "Crítico",          dot: "bg-red-500",    badgeClass: "border-red-200 bg-red-50 text-red-700" },
  relevante: { label: "Risco relevante",  dot: "bg-orange-400", badgeClass: "border-orange-200 bg-orange-50 text-orange-700" },
  atencao:   { label: "Atenção",          dot: "bg-amber-400",  badgeClass: "border-amber-200 bg-amber-50 text-amber-700" },
  baixo:     { label: "Baixo impacto",    dot: "bg-green-400",  badgeClass: "border-green-200 bg-green-50 text-green-700" },
};

const TODAS_CATEGORIAS = ["Crítico", "Financeiro", "Trabalhista", "Gestão", "Assembleias", "Legal", "Convivência"];

export default function DecisoesSindicoPanel() {
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("Todos");

  const decisoesFiltradas = filtro === "Todos"
    ? DECISOES
    : filtro === "Crítico"
      ? DECISOES.filter((d) => d.severidade === "critico")
      : DECISOES.filter((d) => d.categoria === filtro);

  const criticoCount = DECISOES.filter((d) => d.severidade === "critico").length;

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
              {DECISOES.length} situações — {criticoCount} críticas
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
          {["Todos", ...TODAS_CATEGORIAS].map((cat) => {
            const isCritico = cat === "Crítico";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setFiltro(cat); setOpenId(null); }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                  filtro === cat
                    ? isCritico
                      ? "bg-red-600 text-white ring-red-600"
                      : "bg-navy-700 text-white ring-navy-700"
                    : isCritico
                      ? "bg-white text-red-600 ring-red-200 hover:ring-red-300"
                      : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Lista de decisões */}
        <div className="space-y-2">
          {decisoesFiltradas.map((d) => {
            const isOpen = openId === d.id;
            const sev = SEVERIDADE_CONFIG[d.severidade];
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${sev.dot}`} aria-hidden="true" />
                      <span className="text-[9.5px] font-medium uppercase tracking-wide text-navy-400">
                        {d.categoria}
                      </span>
                    </div>
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
                    {/* Severidade badge */}
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sev.badgeClass}`}>
                      {sev.label}
                    </span>

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
