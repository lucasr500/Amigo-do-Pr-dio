// Definições dos checklists operacionais.
// Compartilhado entre ChecklistPanel.tsx e PainelOperacional.tsx.
// critical: true → item de obrigação legal ou alto risco se ignorado.

export type ChecklistItem = { id: string; text: string; critical?: boolean };
export type ChecklistDef = {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: ChecklistItem[];
  recurrenceDays?: number;   // sugerir revisão após X dias da última conclusão
  recurrenceLabel?: string;  // ex: "mensalmente", "semestralmente"
};

export const CHECKLISTS: ChecklistDef[] = [
  {
    id: "assembleia",
    title: "Assembleia",
    icon: "👥",
    description: "Antes de convocar e realizar",
    items: [
      { id: "as1", text: "Definir pauta com todos os pontos a votar" },
      { id: "as2", text: "Verificar quorum mínimo exigido pela convenção" },
      { id: "as3", text: "Enviar convocação com pelo menos 10 dias de antecedência", critical: true },
      { id: "as4", text: "Afixar convocação na entrada do prédio" },
      { id: "as5", text: "Verificar inadimplentes sem direito a voto", critical: true },
      { id: "as6", text: "Preparar lista de presença com assinaturas", critical: true },
      { id: "as7", text: "Designar secretário para redigir a ata" },
      { id: "as8", text: "Registrar início com horário, local e quorum atingido" },
      { id: "as9", text: "Aceitar procurações devidamente assinadas" },
      { id: "as10", text: "Encaminhar ata ao cartório se a convenção exigir", critical: true },
    ],
  },
  {
    id: "admissao",
    title: "Admissão de funcionário",
    icon: "🧹",
    description: "Para registrar um novo colaborador",
    items: [
      { id: "ad1", text: "Conferir documentos: RG, CPF, CTPS, PIS/PASEP", critical: true },
      { id: "ad2", text: "Definir cargo, jornada e salário conforme CCT vigente" },
      { id: "ad3", text: "Assinar contrato de trabalho em 2 vias" },
      { id: "ad4", text: "Realizar exame médico admissional", critical: true },
      { id: "ad5", text: "Registrar na CTPS em até 5 dias úteis" },
      { id: "ad6", text: "Cadastrar no eSocial antes do início das atividades", critical: true },
      { id: "ad7", text: "Fornecer os EPIs necessários ao cargo" },
      { id: "ad8", text: "Cadastrar no vale-transporte" },
      { id: "ad9", text: "Apresentar o regimento interno e as regras do condomínio" },
      { id: "ad10", text: "Definir responsável pela supervisão direta" },
    ],
  },
  {
    id: "manutencao",
    title: "Manutenção preventiva",
    icon: "🔨",
    description: "Verificações periódicas obrigatórias",
    recurrenceDays: 30,
    recurrenceLabel: "mensalmente",
    items: [
      { id: "mp1", text: "Elevadores: manutenção mensal pela empresa credenciada", critical: true },
      { id: "mp2", text: "Extintores: recarga anual e inspeção semestral", critical: true },
      { id: "mp3", text: "AVCB: conferir data de vencimento (renovar antes do prazo)", critical: true },
      { id: "mp4", text: "Caixa d'água: limpeza a cada 6 meses (Portaria MS 888/2021)" },
      { id: "mp5", text: "Para-raios (SPDA): vistoria anual por empresa habilitada", critical: true },
      { id: "mp6", text: "Instalações elétricas: vistoria preventiva anual" },
      { id: "mp7", text: "Dedetização: mínimo semestral ou conforme laudo" },
      { id: "mp8", text: "Fachada: inspeção de infiltrações e reboco anualmente" },
      { id: "mp9", text: "Portões e portarias: lubrificação e ajuste trimestrais" },
      { id: "mp10", text: "Registrar todas as manutenções em pasta do condomínio" },
    ],
  },
  {
    id: "sindico-novo",
    title: "Síndico novo",
    icon: "🏛️",
    description: "O que fazer ao assumir o condomínio",
    items: [
      { id: "sn1", text: "Receber livros contábeis, atas e documentos do síndico anterior" },
      { id: "sn2", text: "Conferir contratos vigentes: administradora, elevador, seguro" },
      { id: "sn3", text: "Verificar situação dos funcionários: registros e conformidade com a CCT" },
      { id: "sn4", text: "Conferir AVCB, seguro obrigatório e demais licenças em vigor", critical: true },
      { id: "sn5", text: "Checar inadimplência atual e acordos em aberto" },
      { id: "sn6", text: "Convocar assembleia para prestação de contas da gestão anterior" },
      { id: "sn7", text: "Atualizar o CNPJ do condomínio com os dados do novo síndico", critical: true },
      { id: "sn8", text: "Comunicar fornecedores sobre a troca de gestão" },
      { id: "sn9", text: "Verificar conta bancária em nome do condomínio", critical: true },
      { id: "sn10", text: "Elaborar previsão orçamentária para o mandato" },
    ],
  },
];
