// ─── Assistente contextual — respostas com contexto do condomínio ─────────────
// Coleta o contexto operacional do condomínio e enriquece respostas do assistente.
// Não usa IA externa — é baseado em regras e dados cadastrados.

import type { CondominioProfile, MemoriaOperacional, Pendencia } from "./session";
import type { DocumentoEssencial } from "./session-documentos";

export type ContextualCard = {
  id: string;
  type: "alert" | "suggestion" | "info" | "action";
  priority: number;   // 1 = mais urgente
  title: string;
  body: string;
  actionLabel?: string;
  actionKey?: string;
};

export type AssistantContext = {
  condoName?: string;
  numUnidades?: number;
  hasElevador: boolean;
  hasPiscina: boolean;
  hasFuncionarios: boolean;
  tipoSindico?: string;
  mandatoData?: string;
  mandatoVenceEm?: number;     // dias até fim do mandato (negativo = vencido)
  avcbData?: string;
  avcbVenceEm?: number;
  seguroData?: string;
  seguroVenceEm?: number;
  pendenciasAbertas: number;
  pendenciasCriticas: number;
  pendenciasVencidasOuProximas: number;
  documentosFaltantes: number;
  documentosVencidos: number;
};

function daysUntil(date?: string): number | undefined {
  if (!date) return undefined;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function buildAssistantContext(
  profile: CondominioProfile | null,
  memoria: MemoriaOperacional,
  pendencias: Pendencia[],
  documentos: DocumentoEssencial[]
): AssistantContext {
  const today = new Date().toISOString().slice(0, 10);
  const abertas = pendencias.filter((p) => p.status !== "concluida");
  const inSeven = new Date();
  inSeven.setDate(inSeven.getDate() + 7);
  const nextSeven = inSeven.toISOString().slice(0, 10);
  const criticas = abertas.filter((p) => p.dueDate && p.dueDate < today);
  const vencidasOuProximas = abertas.filter((p) => p.dueDate && p.dueDate <= nextSeven);
  const docsFaltantes = documentos.filter((d) => d.status === "nao_tenho" || d.status === "precisa_localizar");
  const docsVencidos = documentos.filter((d) => {
    if (d.status !== "tenho") return false;
    const v = d.dataVencimento || d.vencimento?.value;
    return v && v < today;
  });

  return {
    condoName: profile?.nomeCondominio,
    numUnidades: profile?.numUnidades,
    hasElevador: profile?.hasElevador ?? false,
    hasPiscina: profile?.hasPiscina ?? false,
    hasFuncionarios: profile?.hasFuncionarios ?? false,
    tipoSindico: profile?.tipoSindico,
    mandatoData: memoria.fimMandatoSindico,
    mandatoVenceEm: daysUntil(memoria.fimMandatoSindico),
    avcbData: memoria.vencimentoAVCB,
    avcbVenceEm: daysUntil(memoria.vencimentoAVCB),
    seguroData: memoria.vencimentoSeguro,
    seguroVenceEm: daysUntil(memoria.vencimentoSeguro),
    pendenciasAbertas: abertas.length,
    pendenciasCriticas: criticas.length,
    pendenciasVencidasOuProximas: vencidasOuProximas.length,
    documentosFaltantes: docsFaltantes.length,
    documentosVencidos: docsVencidos.length,
  };
}

export function buildContextualCards(ctx: AssistantContext): ContextualCard[] {
  const cards: ContextualCard[] = [];

  if (ctx.avcbVenceEm !== undefined && ctx.avcbVenceEm <= 30) {
    cards.push({
      id: "ctx_avcb",
      type: "alert",
      priority: 1,
      title: ctx.avcbVenceEm <= 0
        ? "AVCB vencido — merece atenção"
        : `AVCB vence em ${ctx.avcbVenceEm} dia${ctx.avcbVenceEm !== 1 ? "s" : ""}`,
      body: ctx.avcbVenceEm <= 0
        ? "O vencimento cadastrado do AVCB já passou. Isso pode indicar risco operacional e convém verificar o documento com profissional responsável."
        : `O AVCB vence em ${ctx.avcbVenceEm} dias. Convém organizar a vistoria com antecedência e acompanhar o prazo de emissão.`,
      actionLabel: "Ver pendências",
      actionKey: "open_pendencias",
    });
  }

  if (ctx.seguroVenceEm !== undefined && ctx.seguroVenceEm <= 60) {
    cards.push({
      id: "ctx_seguro",
      type: "alert",
      priority: 2,
      title: ctx.seguroVenceEm <= 0
        ? "Seguro vencido — verificar apólice"
        : `Seguro vence em ${ctx.seguroVenceEm} dia${ctx.seguroVenceEm !== 1 ? "s" : ""}`,
      body: ctx.seguroVenceEm <= 0
        ? "O vencimento cadastrado do seguro já passou. Vale confirmar a situação da apólice com a corretora ou administradora."
        : `Vale iniciar a cotação e conferir coberturas antes do vencimento cadastrado.`,
      actionLabel: "Ver documentos",
      actionKey: "open_documentos",
    });
  }

  if (ctx.mandatoVenceEm !== undefined && ctx.mandatoVenceEm <= 60) {
    cards.push({
      id: "ctx_mandato",
      type: "alert",
      priority: 3,
      title: ctx.mandatoVenceEm <= 0
        ? "Mandato vencido — organizar conferência"
        : `Mandato vence em ${ctx.mandatoVenceEm} dia${ctx.mandatoVenceEm !== 1 ? "s" : ""}`,
      body: ctx.mandatoVenceEm <= 0
        ? "O vencimento cadastrado do mandato já passou. Use isso como apoio operacional para verificar ata, convenção e próximos passos formais."
        : `Prepare a transição e confira os prazos de convocação aplicáveis ao condomínio.`,
      actionLabel: "Iniciar handoff",
      actionKey: "open_handoff",
    });
  }

  if (ctx.pendenciasCriticas > 0) {
    cards.push({
      id: "ctx_pendencias_criticas",
      type: "alert",
      priority: 4,
      title: `${ctx.pendenciasCriticas} pendência${ctx.pendenciasCriticas > 1 ? "s" : ""} com prazo vencido`,
      body: `Você tem ${ctx.pendenciasCriticas} pendência${ctx.pendenciasCriticas > 1 ? "s" : ""} com prazo vencido. Itens atrasados aumentam o risco operacional e podem gerar responsabilidade.`,
      actionLabel: "Ver pendências",
      actionKey: "open_pendencias",
    });
  }

  if (ctx.documentosFaltantes > 0) {
    cards.push({
      id: "ctx_docs_faltantes",
      type: "suggestion",
      priority: 5,
      title: `${ctx.documentosFaltantes} documento${ctx.documentosFaltantes > 1 ? "s" : ""} não localizado${ctx.documentosFaltantes > 1 ? "s" : ""}`,
      body: `Documentos não localizados são risco em caso de fiscalização ou sinistro. Regularize progressivamente, priorizando AVCB, seguro e convenção.`,
      actionLabel: "Ver documentos",
      actionKey: "open_documentos",
    });
  }

  if (ctx.hasElevador) {
    cards.push({
      id: "ctx_elevador_tip",
      type: "info",
      priority: 10,
      title: "Dica: elevador",
      body: "Com base no perfil do seu condomínio, lembre de registrar as manutenções mensais do elevador no calendário operacional. O prazo legal é mensal.",
    });
  }

  if (ctx.hasFuncionarios) {
    cards.push({
      id: "ctx_funcionarios_tip",
      type: "info",
      priority: 11,
      title: "Dica: funcionários",
      body: "Verifique o saldo de férias dos funcionários regularmente. Férias vencidas há mais de 12 meses geram obrigação de pagamento em dobro.",
    });
  }

  return cards.sort((a, b) => a.priority - b.priority);
}

export function enrichResponseWithContext(
  responseText: string,
  query: string,
  ctx: AssistantContext
): string {
  const enrichments: string[] = [];

  const queryLower = query.toLowerCase();
  const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");
  const operationalDisclaimer = "Esta resposta serve como apoio operacional e não substitui avaliação jurídica, técnica ou administrativa específica.";

  if (/avcb|bombeiro|vistoria/.test(queryLower) && ctx.avcbVenceEm !== undefined && ctx.avcbData) {
    enrichments.push(
      ctx.avcbVenceEm <= 0
        ? `No seu prédio, o AVCB está registrado com vencimento em ${formatDate(ctx.avcbData)} (${Math.abs(ctx.avcbVenceEm)} dia${Math.abs(ctx.avcbVenceEm) !== 1 ? "s" : ""} atrás). Isso merece atenção e verificação documental.`
        : `No seu prédio, o AVCB está registrado com vencimento em ${formatDate(ctx.avcbData)} (${ctx.avcbVenceEm} dia${ctx.avcbVenceEm !== 1 ? "s" : ""}). Isso torna o tema relevante para a rotina de acompanhamento.`
    );
    enrichments.push(operationalDisclaimer);
  }

  if (/seguro|apólice|apolice/.test(queryLower) && ctx.seguroVenceEm !== undefined && ctx.seguroData) {
    enrichments.push(
      ctx.seguroVenceEm <= 0
        ? `No cadastro atual do condomínio, o seguro está marcado com vencimento em ${formatDate(ctx.seguroData)}. Convém confirmar a situação da apólice.`
        : `No cadastro atual do condomínio, o seguro está marcado com vencimento em ${formatDate(ctx.seguroData)}. Vale manter esse prazo acompanhado junto aos demais documentos essenciais.`
    );
    enrichments.push(operationalDisclaimer);
  }

  if (/mandato|eleição|eleicao|sindico|síndico|transição|transicao/.test(queryLower) && ctx.mandatoVenceEm !== undefined && ctx.mandatoData) {
    enrichments.push(
      ctx.mandatoVenceEm <= 0
        ? `O mandato cadastrado venceu em ${formatDate(ctx.mandatoData)}. A resposta abaixo deve ser lida como apoio operacional para organização da transição.`
        : `O mandato cadastrado vence em ${formatDate(ctx.mandatoData)}. A resposta abaixo deve ser lida como apoio operacional para organização da transição.`
    );
    enrichments.push(operationalDisclaimer);
  }

  if (/pend[eê]ncia|pendente|prazo|atrasad|priorizar/.test(queryLower) && ctx.pendenciasAbertas > 0) {
    enrichments.push(
      `Hoje existem ${ctx.pendenciasAbertas} pendência${ctx.pendenciasAbertas !== 1 ? "s" : ""} aberta${ctx.pendenciasAbertas !== 1 ? "s" : ""} no condomínio, sendo ${ctx.pendenciasVencidasOuProximas} vencida${ctx.pendenciasVencidasOuProximas !== 1 ? "s" : ""} ou próxima${ctx.pendenciasVencidasOuProximas !== 1 ? "s" : ""} do prazo.`
    );
  }

  if (/elevador/.test(queryLower) && !ctx.hasElevador) {
    enrichments.push("ℹ Seu condomínio não tem elevador cadastrado.");
  }

  if (/piscina/.test(queryLower) && !ctx.hasPiscina) {
    enrichments.push("ℹ Seu condomínio não tem piscina cadastrada.");
  }

  if (enrichments.length === 0) return responseText;

  return `**Contexto do seu condomínio:**\n${Array.from(new Set(enrichments)).join("\n")}\n\n${responseText}`;
}

export function getSuggestedQueriesForContext(ctx: AssistantContext): string[] {
  const suggestions: string[] = [];

  if (ctx.avcbVenceEm !== undefined && ctx.avcbVenceEm <= 60) {
    suggestions.push("Como renovar o AVCB do condomínio?");
  }
  if (ctx.seguroVenceEm !== undefined && ctx.seguroVenceEm <= 60) {
    suggestions.push("O que verificar ao renovar o seguro do condomínio?");
  }
  if (ctx.mandatoVenceEm !== undefined && ctx.mandatoVenceEm <= 90) {
    suggestions.push("Como convocar assembleia para eleição de síndico?");
  }
  if (ctx.hasElevador) {
    suggestions.push("Qual a frequência obrigatória de manutenção de elevadores?");
  }
  if (ctx.hasFuncionarios) {
    suggestions.push("Como calcular férias vencidas de funcionários?");
    suggestions.push("O que é dissídio e como aplicar no condomínio?");
  }
  if (ctx.hasPiscina) {
    suggestions.push("Quais laudos são exigidos para piscina em condomínio?");
  }
  if (ctx.pendenciasAbertas > 5) {
    suggestions.push("Como organizar e priorizar pendências do condomínio?");
  }

  // Perguntas gerais relevantes
  suggestions.push(
    "Como convocar uma assembleia corretamente?",
    "O que fazer quando há vazamento no condomínio?",
    "Como aplicar multa por infração ao regulamento?",
  );

  return suggestions.slice(0, 6);
}
