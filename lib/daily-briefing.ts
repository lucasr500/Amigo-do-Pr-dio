// Motor de briefing diário — síntese verbal do estado operacional para a Home.
// Determinístico, 100% local-first. Sem IA, sem backend, sem side effects.
// Produz 1–3 frases que respondem: "por que abrir o app hoje?"

import { getProfile, getPendenciasAbertas, getMemoriaOperacional, getMemoriaAssistida, getLastBackupAt } from "./session";
import { getMonthlyReviewState } from "./session-monthly-review";
import { currentMonthKey } from "./financial";
import { getAgendaEvents } from "./session-agenda";
import { getDocumentos, DOCUMENTO_LABEL } from "./session-documentos";
import { computeHealthScore } from "./health-score";
import { getFinancialSummary } from "./financial";


export type BriefingUrgency = "critico" | "atencao" | "informacao" | "neutro";

export type BriefingLine = {
  text: string;
  urgency: BriefingUrgency;
};

export type DailyBriefing = {
  headline: string;           // "Hoje no Residencial Solaris:"
  lines: BriefingLine[];      // até 4 linhas operacionais
  primaryAction: string | null; // "A prioridade é renovar o AVCB."
  urgency: BriefingUrgency;   // nível geral
  hasData: boolean;
};

function daysUntil(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function daysAgo(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((today.getTime() - target.getTime()) / 86400000);
}

export function buildDailyBriefing(): DailyBriefing {
  const profile    = getProfile();
  const memoria    = getMemoriaOperacional();
  const assisted   = getMemoriaAssistida();
  const pendencias = getPendenciasAbertas();
  const eventos    = getAgendaEvents();
  const documentos = getDocumentos();

  const nomeCondominio = profile?.nomeCondominio ?? "seu condomínio";
  const headline = `Hoje em ${nomeCondominio}:`;

  const hasData = !!profile || Object.keys(memoria).length > 0;

  if (!hasData) {
    return {
      headline,
      lines: [{ text: "Cadastre os dados do condomínio para ativar o briefing diário.", urgency: "neutro" }],
      primaryAction: null,
      urgency: "neutro",
      hasData: false,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const lines: BriefingLine[] = [];
  let primaryAction: string | null = null;
  let topUrgency: BriefingUrgency = "neutro";

  const setUrgency = (u: BriefingUrgency) => {
    const rank = { critico: 3, atencao: 2, informacao: 1, neutro: 0 };
    if (rank[u] > rank[topUrgency]) topUrgency = u;
  };

  // 1. Pendências urgentes
  const urgentes = pendencias.filter(p => p.dueDate && p.dueDate <= today);
  if (urgentes.length > 0) {
    const txt = urgentes.length === 1
      ? `1 pendência com prazo vencido — ação necessária.`
      : `${urgentes.length} pendências com prazo vencido — ações necessárias.`;
    lines.push({ text: txt, urgency: "critico" });
    setUrgency("critico");
    if (!primaryAction) primaryAction = `Resolver: ${urgentes[0].titulo}.`;
  }

  // 2. Documentos críticos vencidos ou vencendo
  const CRIT_DOCS = ["avcb", "seguro_predial", "ata_eleicao_sindico"] as const;
  for (const docId of CRIT_DOCS) {
    const doc = documentos.find(d => d.id === docId);
    if (!doc?.dataVencimento) continue;
    const days = daysUntil(doc.dataVencimento);
    const label = DOCUMENTO_LABEL[docId as keyof typeof DOCUMENTO_LABEL] ?? docId;
    if (days < 0) {
      lines.push({ text: `${label} vencido há ${Math.abs(days)} dias.`, urgency: "critico" });
      setUrgency("critico");
      if (!primaryAction) primaryAction = `Prioridade: renovar ${label}.`;
    } else if (days <= 30) {
      lines.push({ text: `${label} vence em ${days} dias.`, urgency: days <= 7 ? "critico" : "atencao" });
      setUrgency(days <= 7 ? "critico" : "atencao");
      if (!primaryAction) primaryAction = `Iniciar renovação do ${label} esta semana.`;
    }
    if (lines.length >= 3) break;
  }

  // 3. Vencimentos via MemoriaOperacional (fallback para assistida)
  if (lines.length < 3) {
    const avcbDate = memoria.vencimentoAVCB || (assisted.avcb?.precision === "exact" ? assisted.avcb.value : null);
    if (avcbDate && !documentos.find(d => d.id === "avcb")?.dataVencimento) {
      const days = daysUntil(avcbDate);
      if (days < 0) {
        lines.push({ text: `AVCB vencido há ${Math.abs(days)} dias.`, urgency: "critico" });
        setUrgency("critico");
        if (!primaryAction) primaryAction = "Prioridade: iniciar renovação do AVCB.";
      } else if (days <= 45) {
        lines.push({ text: `AVCB vence em ${days} dias.`, urgency: "atencao" });
        setUrgency("atencao");
        if (!primaryAction) primaryAction = "Agendar renovação do AVCB com antecedência.";
      }
    }
  }

  // 4. Eventos de hoje e amanhã
  if (lines.length < 3) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().slice(0, 10);
    const eventoHoje = eventos.filter(e => e.date === today);
    const eventoAmanha = eventos.filter(e => e.date === tomorrowISO);
    if (eventoHoje.length > 0) {
      const nomes = eventoHoje.slice(0, 2).map(e => e.title).join(", ");
      lines.push({ text: `Hoje: ${nomes}.`, urgency: "informacao" });
      setUrgency("informacao");
    } else if (eventoAmanha.length > 0) {
      const nomes = eventoAmanha.slice(0, 2).map(e => e.title).join(", ");
      lines.push({ text: `Amanhã: ${nomes}.`, urgency: "informacao" });
      setUrgency("informacao");
    }
  }

  // 5. Revisão mensal pendente
  if (lines.length < 3) {
    const reviewState = getMonthlyReviewState(currentMonthKey());
    if (reviewState.status === "pendente") {
      const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long" });
      lines.push({ text: `Revisão de ${monthLabel} pendente.`, urgency: "informacao" });
      setUrgency("informacao");
      if (!primaryAction) primaryAction = `Fazer a revisão mensal de ${monthLabel}.`;
    }
  }

  // 6. Backup desatualizado
  if (lines.length < 3) {
    const lastBackup = getLastBackupAt();
    if (!lastBackup) {
      lines.push({ text: "Nenhum backup exportado ainda.", urgency: "informacao" });
      setUrgency("informacao");
    } else {
      const days = daysAgo(lastBackup.slice(0, 10));
      if (days > 30) {
        lines.push({ text: `Último backup há ${days} dias — recomendado exportar.`, urgency: "informacao" });
        setUrgency("informacao");
      }
    }
  }

  // 7. Pendências abertas em geral (sem prazo vencido)
  const abertas = pendencias.filter(p => !p.dueDate || p.dueDate > today);
  if (lines.length < 2 && abertas.length > 0) {
    lines.push({ text: `${abertas.length} pendência${abertas.length > 1 ? "s" : ""} aberta${abertas.length > 1 ? "s" : ""}.`, urgency: "neutro" });
  }

  // 8. Financeiro: contas vencidas
  if (lines.length < 3) {
    try {
      const fin = getFinancialSummary(currentMonthKey());
      if (fin.contasVencidas.length > 0) {
        lines.push({ text: `${fin.contasVencidas.length} conta${fin.contasVencidas.length > 1 ? "s" : ""} vencida${fin.contasVencidas.length > 1 ? "s" : ""} no financeiro.`, urgency: "atencao" });
        setUrgency("atencao");
      }
    } catch { /* ignora se financeiro não carregado */ }
  }

  // Fallback: estado saudável
  if (lines.length === 0) {
    const health = computeHealthScore();
    if (health.percentage >= 75) {
      lines.push({ text: `Saúde operacional em ${health.percentage}% — condomínio bem organizado.`, urgency: "neutro" });
    } else {
      lines.push({ text: `Saúde operacional em ${health.percentage}% — ${health.biggestBottleneck.toLowerCase()}.`, urgency: "informacao" });
      setUrgency("informacao");
    }
  }

  return {
    headline,
    lines: lines.slice(0, 4),
    primaryAction,
    urgency: topUrgency,
    hasData: true,
  };
}
