// ─── Central Digital do Condomínio — tipos e interfaces ───────────────────────
// Todas as entidades da camada comunitária do produto.
// Módulos de dados importam daqui. Nenhuma lógica de UI aqui.

// ─── Papéis ───────────────────────────────────────────────────────────────────

export type CommunityRole = "manager" | "council" | "resident" | "viewer";

export const ROLE_LABELS: Record<CommunityRole, string> = {
  manager:  "Síndico / Gestão",
  council:  "Conselho",
  resident: "Morador",
  viewer:   "Visitante",
};

export const ROLE_DESCRIPTION: Record<CommunityRole, string> = {
  manager:  "Acesso completo. Publicar, responder, moderar e configurar.",
  council:  "Ver relatórios, documentos do conselho e solicitações agregadas.",
  resident: "Mural, documentos públicos, solicitações e enquetes consultivas.",
  viewer:   "Leitura limitada. Sem interações.",
};

// ─── Visibilidade ─────────────────────────────────────────────────────────────

export type Visibility = "gestao" | "conselho" | "moradores" | "publico";

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  gestao:    "Apenas gestão",
  conselho:  "Gestão + Conselho",
  moradores: "Moradores",
  publico:   "Público (todos)",
};

// ─── Post — Mural Oficial ─────────────────────────────────────────────────────

export type PostCategory =
  | "aviso" | "obra" | "manutencao" | "prestacao_de_contas"
  | "seguranca" | "assembleia" | "documento" | "urgencia"
  | "novidade" | "regra" | "outro";

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  aviso:               "Aviso",
  obra:                "Obra",
  manutencao:          "Manutenção",
  prestacao_de_contas: "Prestação de Contas",
  seguranca:           "Segurança",
  assembleia:          "Assembleia",
  documento:           "Documento",
  urgencia:            "Urgência",
  novidade:            "Novidade",
  regra:               "Regra",
  outro:               "Outro",
};

export type InstitutionalPost = {
  id: string;
  title: string;
  body: string;
  category: PostCategory;
  visibility: Visibility;
  allowComments: boolean;
  pinned: boolean;
  archived: boolean;
  relatedDocumentIds?: string[];
  createdAt: string;
  updatedAt: string;
};

// ─── Comentário ───────────────────────────────────────────────────────────────

export type CommentStatus = "publicado" | "pendente" | "oculto" | "removido";

export type Comment = {
  id: string;
  postId: string;
  authorName: string;
  authorRole: CommunityRole;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
  moderatedAt?: string;
};

// ─── Enquete consultiva ───────────────────────────────────────────────────────

export type PollStatus = "rascunho" | "ativa" | "encerrada";

export type PollOption = {
  id: string;
  label: string;
};

export type Poll = {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  visibility: Visibility;
  status: PollStatus;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PollVote = {
  id: string;
  pollId: string;
  optionId: string;
  voterLabel?: string; // número da unidade ou anônimo
  createdAt: string;
};

// ─── Solicitação estruturada ──────────────────────────────────────────────────

export type RequestType =
  | "reclamacao" | "solicitacao" | "sugestao" | "manutencao"
  | "barulho" | "seguranca" | "limpeza" | "garagem" | "obra" | "documento" | "outro";

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  reclamacao:  "Reclamação",
  solicitacao: "Solicitação",
  sugestao:    "Sugestão",
  manutencao:  "Manutenção",
  barulho:     "Barulho",
  seguranca:   "Segurança",
  limpeza:     "Limpeza",
  garagem:     "Garagem",
  obra:        "Obra",
  documento:   "Documento",
  outro:       "Outro",
};

export type RequestStatus =
  | "recebido" | "em_analise" | "encaminhado"
  | "aguardando_terceiro" | "resolvido" | "recusado" | "arquivado";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  recebido:           "Recebido",
  em_analise:         "Em análise",
  encaminhado:        "Encaminhado",
  aguardando_terceiro: "Aguardando terceiro",
  resolvido:          "Resolvido",
  recusado:           "Recusado",
  arquivado:          "Arquivado",
};

export type RequestPriority = "baixa" | "normal" | "alta" | "urgente";

export const REQUEST_PRIORITY_LABELS: Record<RequestPriority, string> = {
  baixa:   "Baixa",
  normal:  "Normal",
  alta:    "Alta",
  urgente: "Urgente",
};

export type ResidentRequest = {
  id: string;
  unitNumber?: string;
  authorName: string;
  authorContact?: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  assignedTo?: string;
  dueDate?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

// ─── Documento público ────────────────────────────────────────────────────────

export type PublicDocumentCategory =
  | "convencao" | "regimento_interno" | "ata" | "aviso" | "contrato_publico"
  | "seguro" | "avcb" | "manual" | "prestacao_de_contas" | "assembleia" | "outro";

export const PUBLIC_DOC_CATEGORY_LABELS: Record<PublicDocumentCategory, string> = {
  convencao:          "Convenção",
  regimento_interno:  "Regimento Interno",
  ata:                "Ata",
  aviso:              "Aviso",
  contrato_publico:   "Contrato",
  seguro:             "Seguro",
  avcb:               "AVCB",
  manual:             "Manual",
  prestacao_de_contas: "Prestação de Contas",
  assembleia:         "Assembleia",
  outro:              "Outro",
};

export type PublicDocument = {
  id: string;
  title: string;
  category: PublicDocumentCategory;
  description?: string;
  visibility: Visibility;
  url?: string;
  version?: string;
  validUntil?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  linkedInternalDocId?: string;
};

// ─── Timeline institucional ───────────────────────────────────────────────────

export type TimelineEventType =
  | "documento_publicado" | "documento_renovado" | "aviso_publicado"
  | "obra_iniciada" | "obra_concluida" | "manutencao_realizada"
  | "solicitacao_aberta" | "solicitacao_resolvida"
  | "enquete_criada" | "enquete_encerrada"
  | "assembleia_realizada" | "decisao_registrada" | "relatorio_emitido"
  | "mandato_atualizado" | "fornecedor_cadastrado" | "ocorrencia_registrada"
  | "comunicado_registrado" | "revisao_mensal_concluida" | "backup_exportado"
  | "outro";

export const TIMELINE_TYPE_LABELS: Record<TimelineEventType, string> = {
  documento_publicado:       "Documento publicado",
  documento_renovado:        "Documento renovado",
  aviso_publicado:           "Aviso publicado",
  obra_iniciada:             "Obra iniciada",
  obra_concluida:            "Obra concluída",
  manutencao_realizada:      "Manutenção realizada",
  solicitacao_aberta:        "Solicitação aberta",
  solicitacao_resolvida:     "Solicitação resolvida",
  enquete_criada:            "Enquete criada",
  enquete_encerrada:         "Enquete encerrada",
  assembleia_realizada:      "Assembleia realizada",
  decisao_registrada:        "Decisão registrada",
  relatorio_emitido:         "Relatório emitido",
  mandato_atualizado:        "Mandato atualizado",
  fornecedor_cadastrado:     "Fornecedor cadastrado",
  ocorrencia_registrada:     "Ocorrência registrada",
  comunicado_registrado:     "Comunicado registrado",
  revisao_mensal_concluida:  "Revisão mensal concluída",
  backup_exportado:          "Backup exportado",
  outro:                     "Evento",
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  visibility: Visibility;
  sourceModule?: string;
  sourceId?: string;
  relatedUnitId?: string;
  relatedDocumentId?: string;
  relatedRequestId?: string;
  relatedPostId?: string;
  relatedPollId?: string;
  occurredAt: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

// ─── Auditoria ────────────────────────────────────────────────────────────────

export type AuditAction =
  | "post_created" | "post_archived" | "post_pinned" | "post_updated"
  | "comment_hidden" | "comment_removed" | "comment_approved"
  | "request_opened" | "request_updated" | "request_resolved" | "request_closed"
  | "poll_created" | "poll_closed"
  | "document_published" | "document_updated" | "document_removed"
  | "timeline_event_created";

export type CommunityAuditEntry = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorRole: CommunityRole;
  description: string;
  createdAt: string;
};

// ─── View mode (simulação de papéis) ─────────────────────────────────────────

export type ViewMode = CommunityRole;

export const VIEW_MODE_KEY = "amigo_view_mode";
