// Modelos de comunicados para o Gerador de Comunicados.
// Para adicionar um novo modelo: incluir novo objeto no array COMUNICADO_TEMPLATES.
// Tipos de campo disponíveis: text | date | time | textarea | select.
// A função generate() recebe os valores preenchidos e o nome do condomínio (do perfil).

export type ComunicadoId = "assembleia" | "obra" | "notificacao" | "geral";

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

export const COMUNICADO_TEMPLATES: ComunicadoDef[] = [
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
      {
        id: "local",
        label: "Local",
        type: "text",
        placeholder: "Ex: Salão de festas, 1º andar",
      },
      {
        id: "pauta",
        label: "Pauta (um item por linha)",
        type: "textarea",
        placeholder: "Prestação de contas\nAprovação do orçamento\nAssuntos gerais",
      },
    ],
    generate: (v, condo) => {
      const tipo = v.tipo || "Ordinária";
      const data = fmtDate(v.data);
      const horario = v.horario || "_____";
      const local = v.local || "_____";
      const itens = (v.pauta || "")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((l, i) => `${i + 1}. ${l}`)
        .join("\n");
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
    id: "obra",
    icon: "🔨",
    title: "Comunicado de Obra",
    description: "Reforma ou serviço em unidade ou área comum",
    disclaimer: "Obras podem exigir aprovação prévia e documentação técnica conforme o regulamento interno.",
    fields: [
      {
        id: "unidade",
        label: "Unidade ou área",
        type: "text",
        placeholder: "Ex: Apto 302 / Área da garagem",
      },
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
      {
        id: "horario",
        label: "Horário permitido",
        type: "text",
        placeholder: "Ex: Seg–sex, 8h às 17h",
      },
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
    id: "notificacao",
    icon: "⚠️",
    title: "Notificação de Infração",
    description: "Advertência por descumprimento de regra",
    disclaimer: "Observe o procedimento previsto na convenção antes de aplicar qualquer sanção.",
    fields: [
      {
        id: "unidade",
        label: "Unidade",
        type: "text",
        placeholder: "Ex: Apto 504",
      },
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
      {
        id: "prazo",
        label: "Prazo para regularização",
        type: "text",
        placeholder: "Ex: 5 dias úteis",
      },
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
    id: "geral",
    icon: "📢",
    title: "Comunicado Geral",
    description: "Aviso, informação ou lembrete",
    disclaimer: "Ajuste o texto conforme a necessidade e o tom adequado para o seu condomínio.",
    fields: [
      {
        id: "assunto",
        label: "Assunto",
        type: "text",
        placeholder: "Ex: Manutenção do elevador",
      },
      {
        id: "corpo",
        label: "Texto do comunicado",
        type: "textarea",
        placeholder: "Escreva o aviso aqui. Seja claro e objetivo.",
      },
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
