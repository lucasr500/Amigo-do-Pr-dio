// Modelos de comunicados para o Gerador de Comunicados.
// Para adicionar um novo modelo: incluir novo objeto no array COMUNICADO_TEMPLATES.
// Tipos de campo disponíveis: text | date | time | textarea | select.
// A função generate() recebe os valores preenchidos e o nome do condomínio (do perfil).

export type ComunicadoId =
  | "assembleia"
  | "resultado_assembleia"
  | "obra"
  | "obra_emergencial"
  | "manutencao_preventiva"
  | "interrupcao_agua"
  | "interrupcao_energia"
  | "dedetizacao"
  | "limpeza_caixa"
  | "notificacao"
  | "barulho"
  | "areas_comuns"
  | "cobranca"
  | "inadimplencia_geral"
  | "prestacao_contas"
  | "seguranca"
  | "fornecedor"
  | "posse_sindico"
  | "boas_praticas"
  | "geral";

export type FieldDef = {
  id: string;
  label: string;
  type: "text" | "date" | "time" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export type ComunicadoDef = {
  id: ComunicadoId;
  icon: string;
  title: string;
  description: string;
  disclaimer: string;
  fields: FieldDef[];
  generate: (values: Record<string, string>, condoName: string) => string;
};

function fmtDate(iso: string): string {
  if (!iso) return "_____";
  const [y, m, d] = iso.split("-");
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${months[Number(m) - 1]} de ${y}`;
}

function fmtTime(t: string): string {
  return t || "_____";
}

export const COMUNICADO_TEMPLATES: ComunicadoDef[] = [
  // ── ASSEMBLEIAS ─────────────────────────────────────────────────────────────
  {
    id: "assembleia",
    icon: "👥",
    title: "Convocação de Assembleia",
    description: "AGO, AGE ou reunião de conselho",
    disclaimer: "Observe os prazos e o quorum previstos na convenção do condomínio.",
    fields: [
      {
        id: "tipo",
        label: "Tipo de assembleia",
        type: "select",
        options: [
          { value: "Ordinária", label: "Ordinária (AGO)" },
          { value: "Extraordinária", label: "Extraordinária (AGE)" },
        ],
      },
      { id: "data", label: "Data", type: "date" },
      { id: "horario", label: "Horário", type: "time" },
      { id: "local", label: "Local", type: "text", placeholder: "Ex: Salão de festas, 1º andar" },
      {
        id: "pauta",
        label: "Pauta (um item por linha — editável)",
        type: "textarea",
        placeholder: "Prestação de contas do exercício\nPrevisão orçamentária\nEleição de síndico, subsíndico e conselho\nAssuntos gerais",
      },
    ],
    generate: (v, condo) => {
      const tipo = v.tipo || "Ordinária";
      const data = fmtDate(v.data);
      const horario = fmtTime(v.horario);
      const local = v.local || "_____";
      const itens = (v.pauta || "")
        .trim().split("\n").filter(Boolean)
        .map((l, i) => `${i + 1}. ${l}`).join("\n");
      return `CONVOCAÇÃO DE ASSEMBLEIA ${tipo.toUpperCase()}${condo ? `\n${condo}` : ""}

Prezados condôminos,

Ficam convocados a comparecer à Assembleia ${tipo} a realizar-se em ${data}, às ${horario}h.

Local: ${local}

PAUTA:
${itens || "1. _____"}

O quorum mínimo e os prazos de convocação observarão o disposto na Convenção do Condomínio e na legislação vigente.

Contamos com a presença de todos.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "resultado_assembleia",
    icon: "📋",
    title: "Resultado de Assembleia",
    description: "Resumo das deliberações para todos os condôminos",
    disclaimer: "Certifique-se de que a ata foi lavrada e assinada antes de circular este resumo.",
    fields: [
      {
        id: "tipo",
        label: "Tipo de assembleia",
        type: "select",
        options: [
          { value: "Ordinária", label: "Ordinária (AGO)" },
          { value: "Extraordinária", label: "Extraordinária (AGE)" },
        ],
      },
      { id: "data", label: "Data de realização", type: "date" },
      { id: "quorum", label: "Quorum presente", type: "text", placeholder: "Ex: 12 de 36 unidades" },
      {
        id: "deliberacoes",
        label: "Deliberações aprovadas (uma por linha)",
        type: "textarea",
        placeholder: "Aprovação do orçamento anual\nReajuste da taxa condominial em 8%\nReeleição do síndico para mais 2 anos",
      },
      {
        id: "proximos_passos",
        label: "Próximos passos / observações (opcional)",
        type: "textarea",
        placeholder: "A ata ficará disponível em 10 dias úteis.",
      },
    ],
    generate: (v, condo) => {
      const tipo = v.tipo || "Ordinária";
      const data = fmtDate(v.data);
      const quorum = v.quorum || "_____";
      const itens = (v.deliberacoes || "")
        .trim().split("\n").filter(Boolean)
        .map((l, i) => `${i + 1}. ${l}`).join("\n");
      const extra = v.proximos_passos?.trim() ? `\n${v.proximos_passos.trim()}\n` : "";
      return `RESULTADO DA ASSEMBLEIA ${tipo.toUpperCase()}${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos que a Assembleia ${tipo} realizada em ${data} foi concluída com o quorum de ${quorum}.

DELIBERAÇÕES APROVADAS:
${itens || "1. _____"}
${extra}
A ata oficial estará disponível conforme o prazo regulamentar.

Agradecemos a participação de todos.

Atenciosamente,
A Administração`;
    },
  },

  // ── OBRAS E MANUTENÇÕES ──────────────────────────────────────────────────────
  {
    id: "obra",
    icon: "🔨",
    title: "Comunicado de Obra",
    description: "Reforma ou serviço em unidade ou área comum",
    disclaimer: "Obras podem exigir aprovação prévia e documentação técnica conforme o regulamento interno.",
    fields: [
      { id: "unidade", label: "Unidade ou área", type: "text", placeholder: "Ex: Apto 302 / Área da garagem" },
      {
        id: "tipo_obra",
        label: "Tipo de obra",
        type: "select",
        options: [
          { value: "reforma geral", label: "Reforma geral" },
          { value: "troca de piso", label: "Troca de piso" },
          { value: "pintura interna", label: "Pintura interna" },
          { value: "obra hidráulica", label: "Obra hidráulica" },
          { value: "obra elétrica", label: "Obra elétrica" },
          { value: "obra de alvenaria", label: "Obra de alvenaria" },
        ],
      },
      { id: "data_inicio", label: "Início previsto", type: "date" },
      { id: "data_fim", label: "Término previsto", type: "date" },
      { id: "horario", label: "Horário permitido", type: "text", placeholder: "Ex: Seg–sex, 8h às 17h" },
    ],
    generate: (v, condo) => {
      const unidade = v.unidade || "_____";
      const tipo = v.tipo_obra || "reforma";
      const inicio = fmtDate(v.data_inicio);
      const fim = fmtDate(v.data_fim);
      const horario = v.horario || "_____";
      return `COMUNICADO DE OBRA${condo ? `\n${condo}` : ""}

Informamos que será realizada ${tipo} na unidade/área: ${unidade}.

Período previsto: ${inicio} a ${fim}
Horário de execução: ${horario}

Os trabalhos serão realizados por profissional habilitado. Agradecemos a compreensão pelos eventuais incômodos e pedimos a todos que observem o regramento interno durante este período.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "obra_emergencial",
    icon: "🚧",
    title: "Obra Emergencial",
    description: "Reparo urgente em área comum ou estrutura",
    disclaimer: "Documente a necessidade do reparo e solicite ao menos dois orçamentos quando possível.",
    fields: [
      { id: "area", label: "Área / local afetado", type: "text", placeholder: "Ex: Telhado do bloco B / Hall de entrada" },
      { id: "descricao", label: "Descrição do problema", type: "textarea", placeholder: "Ex: Infiltração na laje do 6º andar causando risco de queda de reboco." },
      { id: "data_inicio", label: "Início dos serviços", type: "date" },
      { id: "previsao", label: "Previsão de conclusão", type: "text", placeholder: "Ex: 5 dias úteis / a definir" },
      { id: "restricoes", label: "Restrições de acesso (se houver)", type: "text", placeholder: "Ex: Corredor do bloco B interditado temporariamente" },
    ],
    generate: (v, condo) => {
      const area = v.area || "_____";
      const desc = v.descricao?.trim() || "_____";
      const inicio = fmtDate(v.data_inicio);
      const previsao = v.previsao || "_____";
      const restricoes = v.restricoes?.trim()
        ? `\nRestrições de acesso: ${v.restricoes.trim()}\n` : "";
      return `COMUNICADO — OBRA EMERGENCIAL${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos que foi identificada a necessidade de reparo emergencial na área: ${area}.

Situação: ${desc}

Os serviços terão início em ${inicio} com previsão de conclusão em ${previsao}.${restricoes}

Priorizamos a segurança e a preservação do patrimônio comum. Pedimos compreensão e colaboração durante o período de obras.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "manutencao_preventiva",
    icon: "🔧",
    title: "Manutenção Preventiva",
    description: "Aviso de manutenção programada em sistemas do condomínio",
    disclaimer: "Mantenha o registro das manutenções preventivas no log do condomínio.",
    fields: [
      {
        id: "sistema",
        label: "Sistema / equipamento",
        type: "select",
        options: [
          { value: "elevador(es)", label: "Elevador(es)" },
          { value: "sistema de bombeamento de água", label: "Bomba d'água" },
          { value: "portões e cancelas", label: "Portões e cancelas" },
          { value: "sistema elétrico geral", label: "Sistema elétrico" },
          { value: "sistema de CFTV / câmeras", label: "CFTV / câmeras" },
          { value: "sistema de interfone / portaria virtual", label: "Interfone / portaria" },
          { value: "gerador", label: "Gerador" },
          { value: "sistema de incêndio", label: "Sistema de incêndio" },
          { value: "piscina", label: "Piscina" },
        ],
      },
      { id: "data", label: "Data", type: "date" },
      { id: "horario_inicio", label: "Horário de início", type: "time" },
      { id: "horario_fim", label: "Previsão de término", type: "time" },
      { id: "impacto", label: "Impacto esperado (opcional)", type: "text", placeholder: "Ex: Elevador fora de operação durante o período" },
    ],
    generate: (v, condo) => {
      const sistema = v.sistema || "_____";
      const data = fmtDate(v.data);
      const hi = fmtTime(v.horario_inicio);
      const hf = fmtTime(v.horario_fim);
      const impacto = v.impacto?.trim()
        ? `\nImpacto esperado: ${v.impacto.trim()}\n` : "";
      return `AVISO DE MANUTENÇÃO PREVENTIVA${condo ? `\n${condo}` : ""}

Prezados condôminos,

Comunicamos que será realizada manutenção preventiva no(a) ${sistema} em ${data}, das ${hi}h às ${hf}h.${impacto}

A manutenção preventiva é essencial para a segurança e o bom funcionamento do condomínio. Agradecemos a compreensão.

Atenciosamente,
A Administração`;
    },
  },

  // ── INTERRUPÇÕES DE SERVIÇO ──────────────────────────────────────────────────
  {
    id: "interrupcao_agua",
    icon: "💧",
    title: "Interrupção de Água",
    description: "Aviso de corte temporário no fornecimento de água",
    disclaimer: "Comunique com o máximo de antecedência possível para que os moradores se preparem.",
    fields: [
      { id: "data", label: "Data", type: "date" },
      { id: "horario_inicio", label: "Início previsto", type: "time" },
      { id: "horario_fim", label: "Retorno previsto", type: "time" },
      { id: "motivo", label: "Motivo", type: "text", placeholder: "Ex: Limpeza da caixa d'água / reparo na rede" },
      { id: "recomendacao", label: "Recomendação (opcional)", type: "text", placeholder: "Ex: Reservar água para consumo essencial" },
    ],
    generate: (v, condo) => {
      const data = fmtDate(v.data);
      const hi = fmtTime(v.horario_inicio);
      const hf = fmtTime(v.horario_fim);
      const motivo = v.motivo?.trim() || "_____";
      const rec = v.recomendacao?.trim()
        ? `\nRecomendamos: ${v.recomendacao.trim()}\n` : "";
      return `AVISO — INTERRUPÇÃO NO FORNECIMENTO DE ÁGUA${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos que o fornecimento de água será interrompido em ${data}, das ${hi}h até aproximadamente ${hf}h.

Motivo: ${motivo}${rec}

Pedimos desculpas pelo transtorno e agradecemos a compreensão.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "interrupcao_energia",
    icon: "⚡",
    title: "Interrupção de Energia",
    description: "Aviso de corte temporário no fornecimento de energia elétrica",
    disclaimer: "Verifique se há equipamentos críticos (elevadores, bomba) que exigem procedimento especial.",
    fields: [
      { id: "data", label: "Data", type: "date" },
      { id: "horario_inicio", label: "Início previsto", type: "time" },
      { id: "horario_fim", label: "Retorno previsto", type: "time" },
      {
        id: "abrangencia",
        label: "Abrangência",
        type: "select",
        options: [
          { value: "todo o condomínio", label: "Todo o condomínio" },
          { value: "áreas comuns", label: "Somente áreas comuns" },
          { value: "determinados blocos/andares", label: "Blocos/andares específicos" },
          { value: "garagem", label: "Garagem" },
        ],
      },
      { id: "motivo", label: "Motivo", type: "text", placeholder: "Ex: Manutenção no quadro geral / solicitação da concessionária" },
    ],
    generate: (v, condo) => {
      const data = fmtDate(v.data);
      const hi = fmtTime(v.horario_inicio);
      const hf = fmtTime(v.horario_fim);
      const abrangencia = v.abrangencia || "_____";
      const motivo = v.motivo?.trim() || "_____";
      return `AVISO — INTERRUPÇÃO NO FORNECIMENTO DE ENERGIA${condo ? `\n${condo}` : ""}

Prezados condôminos,

Comunicamos que haverá interrupção no fornecimento de energia elétrica em ${data}, das ${hi}h até aproximadamente ${hf}h.

Abrangência: ${abrangencia}
Motivo: ${motivo}

Durante o período, elevadores e sistemas dependentes de energia estarão fora de operação. Recomendamos precaução no uso de escadas e atenção a equipamentos sensíveis.

Pedimos desculpas pelo transtorno.

Atenciosamente,
A Administração`;
    },
  },

  // ── HIGIENE E SAÚDE ──────────────────────────────────────────────────────────
  {
    id: "dedetizacao",
    icon: "🧴",
    title: "Dedetização / Controle de Pragas",
    description: "Aviso de aplicação de produto nas áreas do condomínio",
    disclaimer: "Siga as orientações técnicas da empresa contratada quanto a prazos de reentrada e ventilação.",
    fields: [
      { id: "data", label: "Data", type: "date" },
      { id: "horario_inicio", label: "Início previsto", type: "time" },
      { id: "areas", label: "Áreas a serem tratadas", type: "text", placeholder: "Ex: Garagem, salão de festas, lixeira e áreas técnicas" },
      { id: "empresa", label: "Empresa responsável (opcional)", type: "text", placeholder: "Ex: Dedet Serviços" },
      { id: "orientacoes", label: "Orientações especiais (opcional)", type: "textarea", placeholder: "Ex: Retirar animais de estimação das áreas comuns. Evitar transitar pelas áreas tratadas por 2h." },
    ],
    generate: (v, condo) => {
      const data = fmtDate(v.data);
      const hi = fmtTime(v.horario_inicio);
      const areas = v.areas?.trim() || "_____";
      const empresa = v.empresa?.trim() ? ` pela empresa ${v.empresa.trim()}` : "";
      const orientacoes = v.orientacoes?.trim()
        ? `\nOrientações:\n${v.orientacoes.trim()}\n` : "";
      return `AVISO DE DEDETIZAÇÃO${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos que será realizado serviço de controle de pragas${empresa} em ${data}, a partir das ${hi}h.

Áreas a serem tratadas: ${areas}${orientacoes}

Pedimos a colaboração de todos para o sucesso do serviço e a preservação da saúde dos moradores.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "limpeza_caixa",
    icon: "🚿",
    title: "Limpeza da Caixa d'Água",
    description: "Aviso de limpeza e desinfecção das cisternas",
    disclaimer: "A limpeza semestral é obrigatória por lei (Portaria MS 888/2021 e normas municipais). Arquive o laudo.",
    fields: [
      { id: "data", label: "Data", type: "date" },
      { id: "horario_inicio", label: "Início do corte d'água", type: "time" },
      { id: "horario_fim", label: "Retorno previsto", type: "time" },
      { id: "empresa", label: "Empresa responsável (opcional)", type: "text", placeholder: "Ex: Higiclean Serviços" },
    ],
    generate: (v, condo) => {
      const data = fmtDate(v.data);
      const hi = fmtTime(v.horario_inicio);
      const hf = fmtTime(v.horario_fim);
      const empresa = v.empresa?.trim() ? ` pela empresa ${v.empresa.trim()}` : "";
      return `AVISO — LIMPEZA DA CAIXA D'ÁGUA${condo ? `\n${condo}` : ""}

Prezados condôminos,

Comunicamos que será realizada limpeza e desinfecção das caixas d'água${empresa} em ${data}.

O fornecimento de água será interrompido das ${hi}h até aproximadamente ${hf}h.

Recomendamos reservar água para uso essencial durante o período.

Após a limpeza, o laudo técnico ficará arquivado e disponível para consulta.

Atenciosamente,
A Administração`;
    },
  },

  // ── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
  {
    id: "notificacao",
    icon: "⚠️",
    title: "Notificação de Infração",
    description: "Advertência por descumprimento de regra",
    disclaimer: "Observe o procedimento previsto na convenção antes de aplicar qualquer sanção.",
    fields: [
      { id: "unidade", label: "Unidade", type: "text", placeholder: "Ex: Apto 504" },
      {
        id: "tipo_infracao",
        label: "Situação identificada",
        type: "select",
        options: [
          { value: "perturbação do sossego (barulho excessivo)", label: "Barulho / perturbação do sossego" },
          { value: "uso indevido de área comum", label: "Uso indevido de área comum" },
          { value: "descumprimento de horário de obra", label: "Horário de obra descumprido" },
          { value: "circulação de animal em área comum sem autorização", label: "Animal em área comum" },
          { value: "descarte irregular de lixo ou entulho", label: "Descarte irregular de lixo" },
          { value: "estacionamento em local não permitido", label: "Estacionamento irregular" },
          { value: "descumprimento do regulamento interno", label: "Descumprimento do regulamento" },
        ],
      },
      { id: "prazo", label: "Prazo para regularização", type: "text", placeholder: "Ex: 5 dias úteis" },
    ],
    generate: (v, condo) => {
      const unidade = v.unidade || "_____";
      const infracao = v.tipo_infracao || "_____";
      const prazo = v.prazo || "_____";
      return `NOTIFICAÇÃO${condo ? `\n${condo}` : ""}

Prezado(a) condômino(a) — Unidade ${unidade},

Comunicamos que foi relatada/constatada situação de ${infracao}, em desacordo com o Regulamento Interno do condomínio.

Solicitamos a regularização da situação no prazo de ${prazo} a contar do recebimento desta notificação.

Caso a situação não seja regularizada no prazo indicado, o condomínio adotará as medidas cabíveis previstas na convenção e no regulamento interno, podendo incluir aplicação de advertência formal e/ou multa.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "barulho",
    icon: "🔕",
    title: "Comunicado sobre Barulho",
    description: "Circular de alerta sobre perturbação do sossego",
    disclaimer: "Evite identificar o infrator em comunicados circulares para preservar a privacidade.",
    fields: [
      {
        id: "horario",
        label: "Horário de silêncio do condomínio",
        type: "text",
        placeholder: "Ex: 22h às 8h em dias úteis e 23h às 9h nos fins de semana",
      },
      {
        id: "exemplos",
        label: "Exemplos de comportamentos (opcional)",
        type: "textarea",
        placeholder: "Ex: Música alta, festas sem autorização, movimentação de móveis, uso de furadeira fora do horário permitido.",
      },
    ],
    generate: (v, condo) => {
      const horario = v.horario?.trim() || "_____";
      const exemplos = v.exemplos?.trim()
        ? `\nExemplos de situações que devem ser evitadas:\n${v.exemplos.trim()}\n` : "";
      return `COMUNICADO — SOSSEGO E CONVIVÊNCIA${condo ? `\n${condo}` : ""}

Prezados condôminos,

Lembramos que o horário de silêncio neste condomínio é das ${horario}, conforme o Regulamento Interno.${exemplos}

A boa convivência depende do respeito mútuo. Agradecemos a colaboração de todos.

Em caso de perturbação, entre em contato com a administração pelos canais disponíveis.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "areas_comuns",
    icon: "🏊",
    title: "Uso de Áreas Comuns",
    description: "Regras ou comunicado sobre salão, piscina, academia ou garagem",
    disclaimer: "Atualizações de regras de áreas comuns podem exigir deliberação em assembleia.",
    fields: [
      {
        id: "area",
        label: "Área em questão",
        type: "select",
        options: [
          { value: "salão de festas", label: "Salão de festas" },
          { value: "piscina", label: "Piscina" },
          { value: "academia", label: "Academia" },
          { value: "garagem", label: "Garagem" },
          { value: "playground", label: "Playground" },
          { value: "churrasqueira", label: "Churrasqueira" },
          { value: "áreas comuns em geral", label: "Áreas comuns em geral" },
        ],
      },
      { id: "mensagem", label: "Mensagem / regra", type: "textarea", placeholder: "Descreva a orientação ou regra que deseja comunicar." },
    ],
    generate: (v, condo) => {
      const area = v.area || "_____";
      const mensagem = v.mensagem?.trim() || "_____";
      return `COMUNICADO — ${area.toUpperCase()}${condo ? `\n${condo}` : ""}

Prezados condôminos,

${mensagem}

Contamos com a colaboração de todos para manter nossas áreas comuns em ordem e preservar o bem-estar coletivo.

Atenciosamente,
A Administração`;
    },
  },

  // ── FINANCEIRO ───────────────────────────────────────────────────────────────
  {
    id: "cobranca",
    icon: "R$",
    title: "Notificação de Cobrança",
    description: "Aviso formal para unidade inadimplente",
    disclaimer: "Evite exposição pública do condômino. A cobrança deve seguir a convenção e os canais formais do condomínio.",
    fields: [
      { id: "unidade", label: "Unidade", type: "text", placeholder: "Ex: Apto 504" },
      { id: "competencias", label: "Competências em aberto", type: "text", placeholder: "Ex: março e abril de 2026" },
      { id: "prazo", label: "Prazo para regularização", type: "text", placeholder: "Ex: 5 dias úteis" },
      { id: "canal", label: "Canal de contato", type: "text", placeholder: "Ex: administradora / e-mail financeiro" },
    ],
    generate: (v, condo) => {
      const unidade = v.unidade || "_____";
      const competencias = v.competencias || "_____";
      const prazo = v.prazo || "_____";
      const canal = v.canal || "_____";
      return `NOTIFICAÇÃO DE COBRANÇA${condo ? `\n${condo}` : ""}

Prezado(a) condômino(a) — Unidade ${unidade},

Consta em nossos registros pendência referente a: ${competencias}.

Solicitamos a regularização no prazo de ${prazo}, ou contato pelo canal ${canal} para conferência das informações e orientação sobre pagamento.

Esta comunicação é individual e preserva a privacidade do condômino, conforme as boas práticas de gestão condominial.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "inadimplencia_geral",
    icon: "📊",
    title: "Inadimplência — Aviso Geral",
    description: "Circular sobre impacto da inadimplência no caixa do condomínio",
    disclaimer: "Não identifique unidades inadimplentes em comunicados circulares. Use a cobrança individual para cada caso.",
    fields: [
      { id: "percentual", label: "Taxa de inadimplência atual (%)", type: "text", placeholder: "Ex: 18%" },
      { id: "impacto", label: "Impacto no caixa / serviços", type: "text", placeholder: "Ex: Atraso no pagamento de fornecedores e redução de fundo de reserva" },
      { id: "prazo", label: "Prazo para quitação voluntária", type: "text", placeholder: "Ex: até o dia 15 de julho" },
    ],
    generate: (v, condo) => {
      const pct = v.percentual?.trim() || "_____";
      const impacto = v.impacto?.trim() || "_____";
      const prazo = v.prazo?.trim() || "_____";
      return `COMUNICADO — INADIMPLÊNCIA CONDOMINIAL${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos que a taxa de inadimplência atual está em ${pct}, o que compromete diretamente o caixa do condomínio.

Impacto: ${impacto}

Pedimos que condôminos com débitos em aberto procedam à regularização ${prazo}, evitando a necessidade de medidas judiciais e o comprometimento dos serviços essenciais.

Para quem precisar, estamos disponíveis para negociação por meio dos canais de contato da administração.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "prestacao_contas",
    icon: "📑",
    title: "Prestação de Contas",
    description: "Resumo financeiro mensal ou bimestral circular",
    disclaimer: "A prestação de contas completa deve estar disponível para consulta por qualquer condômino.",
    fields: [
      { id: "periodo", label: "Período de referência", type: "text", placeholder: "Ex: Maio de 2026 / 1º semestre de 2026" },
      { id: "receitas", label: "Total de receitas (R$)", type: "text", placeholder: "Ex: 38.500,00" },
      { id: "despesas", label: "Total de despesas (R$)", type: "text", placeholder: "Ex: 35.200,00" },
      { id: "saldo", label: "Saldo do período (R$)", type: "text", placeholder: "Ex: 3.300,00" },
      { id: "fundo_reserva", label: "Fundo de reserva atual (R$)", type: "text", placeholder: "Ex: 21.400,00" },
      { id: "observacoes", label: "Observações (opcional)", type: "textarea", placeholder: "Ex: Valor de despesas inclui obra emergencial no telhado (R$ 8.200)." },
    ],
    generate: (v, condo) => {
      const periodo = v.periodo || "_____";
      const receitas = v.receitas || "_____";
      const despesas = v.despesas || "_____";
      const saldo = v.saldo || "_____";
      const fundo = v.fundo_reserva || "_____";
      const obs = v.observacoes?.trim() ? `\nObservações: ${v.observacoes.trim()}\n` : "";
      return `PRESTAÇÃO DE CONTAS — ${periodo.toUpperCase()}${condo ? `\n${condo}` : ""}

Prezados condôminos,

Apresentamos abaixo o resumo financeiro referente a ${periodo}:

  Receitas totais:      R$ ${receitas}
  Despesas totais:      R$ ${despesas}
  Saldo do período:     R$ ${saldo}
  Fundo de reserva:     R$ ${fundo}
${obs}
A documentação completa (balancete, notas e comprovantes) está disponível para consulta junto à administração.

Atenciosamente,
A Administração`;
    },
  },

  // ── SEGURANÇA E GESTÃO ───────────────────────────────────────────────────────
  {
    id: "seguranca",
    icon: "🔒",
    title: "Comunicado de Segurança",
    description: "Alerta ou orientação sobre segurança e prevenção",
    disclaimer: "Evite divulgar detalhes de incidentes que possam expor vulnerabilidades ou gerar pânico.",
    fields: [
      {
        id: "tipo",
        label: "Tipo de comunicado",
        type: "select",
        options: [
          { value: "orientacao_preventiva", label: "Orientação preventiva" },
          { value: "atualizacao_sistema", label: "Atualização do sistema de segurança" },
          { value: "alerta_ocorrencia", label: "Alerta pós-ocorrência" },
          { value: "novos_procedimentos", label: "Novos procedimentos de acesso" },
        ],
      },
      { id: "mensagem", label: "Mensagem", type: "textarea", placeholder: "Descreva o comunicado de segurança." },
    ],
    generate: (v, condo) => {
      const mensagem = v.mensagem?.trim() || "_____";
      return `COMUNICADO — SEGURANÇA${condo ? `\n${condo}` : ""}

Prezados condôminos,

${mensagem}

Reforçamos que a segurança do condomínio é responsabilidade coletiva. Em caso de situações suspeitas, acione imediatamente a portaria ou os serviços de emergência (190/193).

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "fornecedor",
    icon: "🤝",
    title: "Atualização de Fornecedor",
    description: "Comunicado sobre troca, contratação ou encerramento de serviço",
    disclaimer: "Contratos de prestação de serviço acima de determinados valores podem exigir aprovação em assembleia.",
    fields: [
      {
        id: "tipo_evento",
        label: "Tipo de atualização",
        type: "select",
        options: [
          { value: "contratacao", label: "Contratação de novo fornecedor" },
          { value: "encerramento", label: "Encerramento de contrato" },
          { value: "troca", label: "Troca de fornecedor" },
          { value: "reajuste", label: "Reajuste contratual" },
        ],
      },
      { id: "servico", label: "Serviço / área", type: "text", placeholder: "Ex: Limpeza / Segurança / Elevadores / Jardinagem" },
      { id: "data_vigencia", label: "Data de vigência ou transição", type: "date" },
      { id: "detalhes", label: "Informações adicionais (opcional)", type: "textarea", placeholder: "Ex: A empresa X encerrou contrato em comum acordo. A partir desta data, os serviços serão prestados pela empresa Y." },
    ],
    generate: (v, condo) => {
      const servico = v.servico?.trim() || "_____";
      const data = fmtDate(v.data_vigencia);
      const detalhes = v.detalhes?.trim() ? `\n${v.detalhes.trim()}\n` : "";
      const tipoLabel: Record<string, string> = {
        contratacao: "Contratação de fornecedor",
        encerramento: "Encerramento de contrato",
        troca: "Troca de fornecedor",
        reajuste: "Reajuste contratual",
      };
      const tipo = tipoLabel[v.tipo_evento] || "Atualização";
      return `COMUNICADO — ${tipo.toUpperCase()}${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos atualização referente ao serviço de ${servico}, com vigência a partir de ${data}.${detalhes}

Qualquer dúvida sobre os serviços contratados pode ser esclarecida junto à administração.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "posse_sindico",
    icon: "🏛️",
    title: "Posse do Síndico",
    description: "Comunicado de início de mandato do novo síndico",
    disclaimer: "O novo síndico deve ser registrado em ata de assembleia e, se necessário, na convenção.",
    fields: [
      { id: "nome_sindico", label: "Nome do novo síndico", type: "text", placeholder: "Ex: João da Silva" },
      { id: "unidade", label: "Unidade", type: "text", placeholder: "Ex: Apto 101" },
      { id: "data_inicio", label: "Início do mandato", type: "date" },
      { id: "data_fim", label: "Término do mandato", type: "date" },
      { id: "contato", label: "Canal de contato (opcional)", type: "text", placeholder: "Ex: sindico@condominio.com.br / (11) 9 0000-0000" },
    ],
    generate: (v, condo) => {
      const nome = v.nome_sindico?.trim() || "_____";
      const unidade = v.unidade?.trim() || "_____";
      const inicio = fmtDate(v.data_inicio);
      const fim = fmtDate(v.data_fim);
      const contato = v.contato?.trim()
        ? `\nContato: ${v.contato.trim()}\n` : "";
      return `COMUNICADO — POSSE DO SÍNDICO${condo ? `\n${condo}` : ""}

Prezados condôminos,

Informamos que, em assembleia realizada recentemente, foi eleito(a) como novo(a) síndico(a) o(a) condômino(a) ${nome} (Unidade ${unidade}).

Mandato: ${inicio} a ${fim}${contato}

Agradecemos a todos que participaram da eleição e confiamos no trabalho de nossa nova gestão em benefício de todo o condomínio.

Atenciosamente,
A Administração`;
    },
  },
  {
    id: "boas_praticas",
    icon: "🌿",
    title: "Boas Práticas de Convivência",
    description: "Circular de orientações gerais para a boa convivência",
    disclaimer: "Comunicados de convivência têm melhor resultado quando positivos e construtivos, sem tom punitivo.",
    fields: [
      {
        id: "tema",
        label: "Tema principal",
        type: "select",
        options: [
          { value: "coleta_seletiva", label: "Coleta seletiva e descarte correto" },
          { value: "elevador", label: "Uso correto do elevador" },
          { value: "animais", label: "Animais de estimação nas áreas comuns" },
          { value: "entregas", label: "Recebimento de encomendas e deliveries" },
          { value: "mudancas", label: "Mudanças e reserva de elevador de serviço" },
          { value: "geral", label: "Convivência geral" },
        ],
      },
      { id: "mensagem", label: "Mensagem", type: "textarea", placeholder: "Escreva as orientações de forma clara e positiva." },
    ],
    generate: (v, condo) => {
      const mensagem = v.mensagem?.trim() || "_____";
      return `COMUNICADO — BOAS PRÁTICAS DE CONVIVÊNCIA${condo ? `\n${condo}` : ""}

Prezados condôminos,

${mensagem}

A convivência harmoniosa é construída por todos. Agradecemos a colaboração e o cuidado de cada morador com os espaços e as pessoas que compartilhamos neste condomínio.

Atenciosamente,
A Administração`;
    },
  },

  // ── GERAL ────────────────────────────────────────────────────────────────────
  {
    id: "geral",
    icon: "📢",
    title: "Comunicado Geral",
    description: "Aviso, informação ou lembrete",
    disclaimer: "Ajuste o texto conforme a necessidade e o tom adequado para o seu condomínio.",
    fields: [
      { id: "assunto", label: "Assunto", type: "text", placeholder: "Ex: Manutenção do elevador" },
      { id: "corpo", label: "Texto do comunicado", type: "textarea", placeholder: "Escreva o aviso aqui. Seja claro e objetivo." },
    ],
    generate: (v, condo) => {
      const assunto = v.assunto?.trim() ? `Assunto: ${v.assunto.trim()}\n` : "";
      const corpo = v.corpo?.trim() || "_____";
      return `COMUNICADO${condo ? `\n${condo}` : ""}
${assunto}
Prezados condôminos,

${corpo}

Atenciosamente,
A Administração`;
    },
  },
];
