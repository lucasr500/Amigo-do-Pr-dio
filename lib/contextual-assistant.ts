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
  mandatoVenceEm?: number;     // dias até fim do mandato (negativo = vencido)
  avcbVenceEm?: number;
  seguroVenceEm?: number;
  pendenciasAbertas: number;
  pendenciasCriticas: number;
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
  const criticas = abertas.filter((p) => p.dueDate && p.dueDate < today);
  const docsFaltantes = documentos.filter((d) => d.status === "nao_tenho" || d.status === "precisa_localizar");
  const docsVencidos = documentos.filter((d) => {
    if (d.status !== "tenho") return false;
    const v = d.vencimento?.value;
    return v && v < today;
  });

  return {
    condoName: profile?.nomeCondominio,
    numUnidades: profile?.numUnidades,
    hasElevador: profile?.hasElevador ?? false,
    hasPiscina: profile?.hasPiscina ?? false,
    hasFuncionarios: profile?.hasFuncionarios ?? false,
    tipoSindico: profile?.tipoSindico,
    mandatoVenceEm: daysUntil(memoria.fimMandatoSindico),
    avcbVenceEm: daysUntil(memoria.vencimentoAVCB),
    seguroVenceEm: daysUntil(memoria.vencimentoSeguro),
    pendenciasAbertas: abertas.length,
    pendenciasCriticas: criticas.length,
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
        ? "AVCB vencido — risco legal imediato"
        : `AVCB vence em ${ctx.avcbVenceEm} dia${ctx.avcbVenceEm !== 1 ? "s" : ""}`,
      body: ctx.avcbVenceEm <= 0
        ? "O AVCB está vencido. O condomínio está irregular perante o Corpo de Bombeiros. O síndico pode responder pessoalmente em caso de sinistro."
        : `O AVCB vence em ${ctx.avcbVenceEm} dias. Contrate a vistoria com antecedência — o prazo de emissão costuma levar de 5 a 15 dias úteis.`,
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
        ? "Seguro vencido — responsabilidade do síndico"
        : `Seguro vence em ${ctx.seguroVenceEm} dia${ctx.seguroVenceEm !== 1 ? "s" : ""}`,
      body: ctx.seguroVenceEm <= 0
        ? "Seguro vencido. O síndico pode ser pessoalmente responsabilizado em caso de sinistro sem cobertura. Renove imediatamente."
        : `Inicie a cotação agora. Seguros para condomínios têm prazo de análise e aprovação que pode levar até 30 dias.`,
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
        ? "Mandato vencido — regularize a eleição"
        : `Mandato vence em ${ctx.mandatoVenceEm} dia${ctx.mandatoVenceEm !== 1 ? "s" : ""}`,
      body: ctx.mandatoVenceEm <= 0
        ? "O mandato está vencido. O síndico perde poderes de representação. Convoque AGE imediatamente para regularização."
        : `Convoque a assembleia com pelo menos 10 dias de antecedência. Prepare a pauta com eleição do síndico e votação de contas.`,
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

  if (/avcb|bombeiro|vistoria/.test(queryLower) && ctx.avcbVenceEm !== undefined) {
    enrichments.push(
      ctx.avcbVenceEm <= 0
        ? `⚠ No seu condomínio: AVCB vencido há ${Math.abs(ctx.avcbVenceEm)} dia${Math.abs(ctx.avcbVenceEm) !== 1 ? "s" : ""}.`
        : ctx.avcbVenceEm <= 30
        ? `⚠ No seu condomínio: AVCB vence em ${ctx.avcbVenceEm} dia${ctx.avcbVenceEm !== 1 ? "s" : ""} — ação urgente.`
        : `ℹ No seu condomínio: AVCB vence em ${ctx.avcbVenceEm} dias.`
    );
  }

  if (/seguro/.test(queryLower) && ctx.seguroVenceEm !== undefined) {
    enrichments.push(
      ctx.seguroVenceEm <= 0
        ? `⚠ No seu condomínio: Seguro vencido.`
        : `ℹ No seu condomínio: Seguro vence em ${ctx.seguroVenceEm} dias.`
    );
  }

  if (/mandato|eleição|sindico|síndico/.test(queryLower) && ctx.mandatoVenceEm !== undefined) {
    enrichments.push(
      ctx.mandatoVenceEm <= 0
        ? `⚠ No seu condomínio: Mandato vencido.`
        : `ℹ No seu condomínio: Mandato vence em ${ctx.mandatoVenceEm} dias.`
    );
  }

  if (/elevador/.test(queryLower) && !ctx.hasElevador) {
    enrichments.push("ℹ Seu condomínio não tem elevador cadastrado.");
  }

  if (/piscina/.test(queryLower) && !ctx.hasPiscina) {
    enrichments.push("ℹ Seu condomínio não tem piscina cadastrada.");
  }

  if (enrichments.length === 0) return responseText;

  return responseText + "\n\n---\n**Contexto do seu condomínio:**\n" + enrichments.join("\n");
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
