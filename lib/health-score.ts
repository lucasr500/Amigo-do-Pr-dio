// Índice local de Saúde Operacional do condomínio.
// Determinístico, 100% client-side, sem IA, sem backend, sem dado remoto.
// Mede organização operacional com base nos dados cadastrados no app.
// NÃO indica regularidade jurídica, compliance, ausência de risco ou garantia.

import {
  getMemoriaOperacional,
  getMemoriaAssistida,
  getDocumentos,
  getFuncionarios,
  getManutencoes,
  getOcorrencias,
  getPendenciasAbertas,
  getPendenciasConcluidas,
  getProfile,
  getWeeklyReviewState,
  getCurrentWeekKey,
  type MemoriaOperacional,
  type AssistedDateField,
} from "./session";
import { buildGuidanceItems } from "./guidance";
import { contarStatusManutencoes } from "./recorrencias";

export type HealthStatusKey =
  | "critico"
  | "atencao"
  | "em-evolucao"
  | "bem-acompanhado"
  | "tudo-em-ordem";

export type HealthFactor = {
  label: string;
  status: "ok" | "partial" | "missing";
  note?: string;
};

export type HealthScoreResult = {
  percentage: number;
  statusKey: HealthStatusKey;
  statusLabel: string;
  diagnosticPhrase: string;
  factors: HealthFactor[];
  suggestions: string[];
  howToGain10Pts: string[];   // Ações específicas para ganhar ~10 pontos percentuais
  biggestBottleneck: string;  // Única coisa que mais pesa no score atual
};

// Campos de rotinas operacionais monitoráveis
const ROUTINE_FIELDS: Array<keyof MemoriaOperacional> = [
  "ultimaDedetizacao",
  "ultimaLimpezaCaixaDAgua",
  "ultimaManutencaoElevador",
  "ultimaInspecaoExtintores",
  "ultimaVistoriaSPDA",
  "ultimaVistoriaEletrica",
  "ultimaAGO",
];

// Máximo de pontos brutos — v2 com cobertura operacional
const MAX_RAW = 123;

// Pontua um campo de data essencial considerando precisão da AssistedDateField.
// Fallback para string legada (dados pré-v5) tratados como precisão parcial.
function scoreEssentialField(
  strValue: string | undefined,
  assisted: AssistedDateField | undefined
): number {
  if (assisted) {
    if (assisted.status === "not_applicable") return 7;
    if (assisted.status === "unknown" || assisted.status === "to_discover") return 3;
    if (assisted.precision === "exact") return 10;
    if (assisted.precision === "month" || assisted.precision === "year") return 7;
    return 5;
  }
  return strValue ? 8 : 0;
}

function statusFromPct(pct: number): HealthStatusKey {
  if (pct <= 39) return "critico";
  if (pct <= 59) return "atencao";
  if (pct <= 79) return "em-evolucao";
  if (pct <= 94) return "bem-acompanhado";
  return "tudo-em-ordem";
}

const STATUS_LABELS: Record<HealthStatusKey, string> = {
  "critico":         "Crítico",
  "atencao":         "Atenção",
  "em-evolucao":     "Em evolução",
  "bem-acompanhado": "Bem acompanhado",
  "tudo-em-ordem":   "Tudo em ordem",
};

const PHRASES: Record<HealthStatusKey, string> = {
  "critico":
    "Há dados essenciais ausentes ou alertas críticos que precisam de atenção.",
  "atencao":
    "Acompanhamento parcial. Resolva os alertas e as pendências antigas para avançar.",
  "em-evolucao":
    "O monitoramento está em curso. Complete as informações essenciais para ganhar precisão.",
  "bem-acompanhado":
    "Prédio bem acompanhado. Mantenha a revisão e os dados atualizados.",
  "tudo-em-ordem":
    "Organização operacional em dia. Continue com o acompanhamento regular.",
};

export function computeHealthScore(): HealthScoreResult {
  const m          = getMemoriaOperacional();
  const profile    = getProfile();
  const guidance   = buildGuidanceItems(m, profile);
  const pendencias = getPendenciasAbertas();
  const weekKey    = getCurrentWeekKey();
  const weekly     = getWeeklyReviewState();

  const assistida    = getMemoriaAssistida();
  const documentos   = getDocumentos();
  const funcionarios = getFuncionarios();
  const manutencoes  = getManutencoes();
  const manutStatus  = manutencoes.length > 0 ? contarStatusManutencoes() : null;

  const now     = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const staleMs = 14 * 86_400_000;

  let raw = 0;

  // ── 1. Essenciais — até 30 pts (precisão-aware) ───────────────────────────
  const avcbPts    = scoreEssentialField(m.vencimentoAVCB, assistida.avcb);
  const seguroPts  = scoreEssentialField(m.vencimentoSeguro, assistida.seguro);
  const mandatoPts = scoreEssentialField(m.fimMandatoSindico, assistida.mandato);
  raw += avcbPts + seguroPts + mandatoPts;

  const hasAVCB    = avcbPts > 0;
  const hasSeguro  = seguroPts > 0;
  const hasMandato = mandatoPts > 0;
  const essentialsCount =
    (hasAVCB ? 1 : 0) + (hasSeguro ? 1 : 0) + (hasMandato ? 1 : 0);

  // ── 2. Estado de alertas — 20 pts ─────────────────────────────────────────
  const criticals = guidance.filter((i) => i.priority === "critico");
  const atencaos  = guidance.filter((i) => i.priority === "atencao");
  if (criticals.length === 0) raw += 15;
  if (atencaos.length === 0)  raw += 5;

  // ── 3. Próximos passos — até 18 pts ──────────────────────────────────────
  const stale     = pendencias.filter((p) => now - new Date(p.createdAt).getTime() > staleMs);
  const openCount = pendencias.length;
  if (stale.length === 0)     raw += 10;
  else if (stale.length <= 1) raw += 5;
  if (openCount <= 3)          raw += 5;
  else if (openCount <= 5)     raw += 2;

  // Bônus por conclusão ativa no último mês (máx +3)
  const cutoff30d = now - 30 * 86_400_000;
  const recentResolved = getPendenciasConcluidas().filter(
    (p) => p.completedAt && new Date(p.completedAt).getTime() >= cutoff30d
  ).length;
  if (recentResolved >= 3)      raw += 3;
  else if (recentResolved >= 1) raw += 1;

  // ── 4. Revisão semanal — 10 pts ───────────────────────────────────────────
  const reviewedThisWeek = weekly.lastCompletedWeekKey === weekKey;
  if (reviewedThisWeek) raw += 10;

  // ── 5. Rotinas — 10 pts (proporcional; 3+ campos = nota cheia) ───────────
  const filledRoutines = ROUTINE_FIELDS.filter((f) => !!m[f]).length;
  raw += Math.min(10, Math.round((filledRoutines / 3) * 10));

  // ── 6. Ocorrência com acompanhamento — 5 pts ─────────────────────────────
  const recentTracked = getOcorrencias().filter(
    (o) => new Date(o.createdAt).getTime() >= weekAgo && o.hasNextStep === true
  );
  if (recentTracked.length > 0) raw += 5;

  // ── 7. Documentos essenciais — até 10 pts ────────────────────────────────
  const docTenho       = documentos.filter((d) => d.status === "tenho").length;
  const docNaoAplica   = documentos.filter((d) => d.status === "nao_se_aplica").length;
  const docRegistrados = documentos.length;
  const docAtivos      = Math.max(1, docRegistrados - docNaoAplica);
  const docPct         = docRegistrados > 0 ? docTenho / docAtivos : -1;
  let docPts = 0;
  if (docPct >= 0.7) docPts = 10;
  else if (docPct >= 0.4) docPts = 5;
  else if (docPct >= 0) docPts = 2;
  raw += docPts;

  // ── 8. Funcionários / férias — até 5 pts ─────────────────────────────────
  let funcPts = 0;
  if (funcionarios.length === 0) {
    funcPts = 3; // sem funcionários = sem risco trabalhista
  } else {
    const hasIssue = funcionarios.some(
      (f) => f.status === "vencida" || f.status === "desconhecida"
    );
    funcPts = hasIssue ? 0 : 5;
  }
  raw += funcPts;

  // ── 9. Cobertura operacional de manutenções — até 15 pts ─────────────────
  let manutPts = 0;
  if (manutStatus !== null) {
    const total = manutStatus.total;
    if (total > 0) {
      if (manutStatus.atrasadas === 0) manutPts += 8;
      else if (manutStatus.atrasadas <= 1) manutPts += 4;
      const cobertos = manutStatus.emDia + manutStatus.proximas;
      manutPts += Math.min(7, Math.round((cobertos / total) * 7));
    }
  }
  raw += manutPts;

  const percentage     = Math.min(100, Math.round((raw / MAX_RAW) * 100));
  const statusKey      = statusFromPct(percentage);
  const statusLabel    = STATUS_LABELS[statusKey];
  const diagnosticPhrase = PHRASES[statusKey];

  // ── Fatores ───────────────────────────────────────────────────────────────
  const factors: HealthFactor[] = [];

  // Essenciais (precision-aware)
  const avcbExact    = avcbPts === 10;
  const seguroExact  = seguroPts === 10;
  const mandatoExact = mandatoPts === 10;
  const allExact     = avcbExact && seguroExact && mandatoExact;
  const allFilled    = hasAVCB && hasSeguro && hasMandato;

  if (allExact) {
    factors.push({ label: "Essenciais: 3/3 com data exata", status: "ok" });
  } else if (allFilled) {
    factors.push({
      label: "Essenciais: 3/3 registrados",
      status: "partial",
      note: "Confirmar precisão das datas melhora o score",
    });
  } else if (essentialsCount > 0) {
    factors.push({
      label: `Essenciais: ${essentialsCount}/3 registrados`,
      status: "partial",
      note: "AVCB, seguro e mandato do síndico",
    });
  } else {
    factors.push({
      label: "Essenciais não cadastrados",
      status: "missing",
      note: "AVCB, seguro e mandato do síndico",
    });
  }

  // Alertas
  if (criticals.length > 0) {
    factors.push({
      label: `${criticals.length} alerta${criticals.length > 1 ? "s" : ""} crítico${criticals.length > 1 ? "s" : ""}`,
      status: "missing",
    });
  } else if (atencaos.length > 0) {
    factors.push({
      label: `${atencaos.length} alerta${atencaos.length > 1 ? "s" : ""} de atenção`,
      status: "partial",
    });
  } else {
    factors.push({ label: "Sem alertas ativos", status: "ok" });
  }

  // Próximos passos
  if (stale.length > 0) {
    factors.push({
      label: `${stale.length} passo${stale.length > 1 ? "s" : ""} parado${stale.length > 1 ? "s" : ""} há +14 dias`,
      status: "missing",
    });
  } else if (openCount > 5) {
    factors.push({ label: `${openCount} próximos passos abertos`, status: "partial" });
  } else if (openCount > 0) {
    factors.push({
      label: `${openCount} próximo${openCount > 1 ? "s" : ""} passo${openCount > 1 ? "s" : ""} em andamento`,
      status: "ok",
    });
  } else {
    factors.push({ label: "Sem próximos passos pendentes", status: "ok" });
  }

  // Revisão semanal
  factors.push(
    reviewedThisWeek
      ? { label: "Revisão semanal concluída", status: "ok" }
      : { label: "Revisão semanal pendente", status: "partial" }
  );

  // Rotinas
  if (filledRoutines >= 3) {
    factors.push({ label: `${filledRoutines} rotinas cadastradas`, status: "ok" });
  } else if (filledRoutines > 0) {
    factors.push({
      label: `${filledRoutines} rotina${filledRoutines > 1 ? "s" : ""} cadastrada${filledRoutines > 1 ? "s" : ""}`,
      status: "partial",
      note: "Dedetização, caixa d'água, elevador e outras",
    });
  } else {
    factors.push({
      label: "Rotinas não cadastradas",
      status: "partial",
      note: "Dedetização, caixa d'água, elevador e outras",
    });
  }

  // Documentos
  if (docRegistrados === 0) {
    factors.push({ label: "Documentos: não mapeados ainda", status: "partial" });
  } else if (docPts === 10) {
    factors.push({ label: `Documentos: ${docTenho} confirmados`, status: "ok" });
  } else {
    factors.push({
      label: `Documentos: ${docTenho} de ${docAtivos} confirmados`,
      status: "partial",
    });
  }

  // Funcionários
  if (funcionarios.length === 0) {
    factors.push({ label: "Funcionários: sem vínculos registrados", status: "ok" });
  } else if (funcPts === 5) {
    factors.push({ label: `Funcionários: férias em dia (${funcionarios.length})`, status: "ok" });
  } else {
    const issueCount = funcionarios.filter(
      (f) => f.status === "vencida" || f.status === "desconhecida"
    ).length;
    factors.push({
      label: `Funcionários: ${issueCount} com férias a verificar`,
      status: "missing",
    });
  }

  // Manutenções
  if (manutStatus === null || manutStatus.total === 0) {
    factors.push({ label: "Manutenções recorrentes: não cadastradas", status: "partial" });
  } else if (manutStatus.atrasadas === 0) {
    factors.push({ label: `Manutenções: ${manutStatus.emDia + manutStatus.proximas}/${manutStatus.total} em dia`, status: "ok" });
  } else {
    factors.push({
      label: `Manutenções: ${manutStatus.atrasadas} atrasada${manutStatus.atrasadas > 1 ? "s" : ""}`,
      status: "missing",
    });
  }

  // ── Sugestões (máx 3) ─────────────────────────────────────────────────────
  const suggestions: string[] = [];

  if (!hasAVCB)
    suggestions.push("Cadastrar data do AVCB");
  if (!hasSeguro && suggestions.length < 3)
    suggestions.push("Cadastrar vencimento do seguro");
  if (!hasMandato && suggestions.length < 3)
    suggestions.push("Cadastrar fim do mandato do síndico");
  if (criticals.length > 0 && suggestions.length < 3)
    suggestions.push("Resolver alertas críticos");
  if (stale.length > 0 && suggestions.length < 3)
    suggestions.push("Concluir próximos passos antigos");
  if (funcPts === 0 && funcionarios.length > 0 && suggestions.length < 3)
    suggestions.push("Regularizar férias dos funcionários");
  if (docRegistrados === 0 && suggestions.length < 3)
    suggestions.push("Mapear situação dos documentos essenciais");
  if (!reviewedThisWeek && suggestions.length < 3)
    suggestions.push("Concluir revisão semanal");
  if (manutStatus !== null && manutStatus.atrasadas > 0 && suggestions.length < 3)
    suggestions.push("Atualizar manutenções recorrentes atrasadas");
  else if ((manutStatus === null || manutStatus.total === 0) && filledRoutines < 3 && suggestions.length < 3)
    suggestions.push("Cadastrar manutenções recorrentes");
  if (suggestions.length < 3)
    suggestions.push("Exportar backup dos dados");

  // ── Orientação: como subir ~10 pontos ─────────────────────────────────────
  // Cada ponto percentual = MAX_RAW / 100 ≈ 1.2 raw pts. Para +10 pct ≈ +12 raw.
  const howToGain10Pts: string[] = [];

  const missingEssentials = (!hasAVCB ? 1 : 0) + (!hasSeguro ? 1 : 0) + (!hasMandato ? 1 : 0);
  const impreciseEssentials = (hasAVCB && !avcbExact ? 1 : 0) + (hasSeguro && !seguroExact ? 1 : 0) + (hasMandato && !mandatoExact ? 1 : 0);

  if (missingEssentials > 0) {
    const missing = [!hasAVCB && "AVCB", !hasSeguro && "seguro", !hasMandato && "mandato"].filter(Boolean);
    howToGain10Pts.push(`Cadastrar ${missing.join(", ")} com data exata (+${missingEssentials * 10} pts brutos)`);
  } else if (impreciseEssentials > 0) {
    howToGain10Pts.push("Confirmar datas exatas dos essenciais: cada confirmação vale +3 pts brutos");
  }

  if (criticals.length > 0 && howToGain10Pts.length < 3) {
    howToGain10Pts.push(`Resolver ${criticals.length} alerta${criticals.length > 1 ? "s" : ""} crítico${criticals.length > 1 ? "s" : ""} (+15 pts brutos se zerar)`);
  }

  if (!reviewedThisWeek && howToGain10Pts.length < 3) {
    howToGain10Pts.push("Completar a revisão semanal (+10 pts brutos imediatos)");
  }

  if (stale.length > 0 && howToGain10Pts.length < 3) {
    howToGain10Pts.push(`Limpar ${stale.length} próximo${stale.length > 1 ? "s" : ""} passo${stale.length > 1 ? "s" : ""} parado${stale.length > 1 ? "s" : ""} (+10 pts brutos)`);
  }

  if (manutStatus === null && howToGain10Pts.length < 3) {
    howToGain10Pts.push("Cadastrar manutenções recorrentes e manter em dia (+até 15 pts brutos)");
  } else if (manutStatus !== null && manutStatus.atrasadas > 0 && howToGain10Pts.length < 3) {
    howToGain10Pts.push("Atualizar manutenções atrasadas (+até 15 pts brutos ao zerar)");
  }

  if (howToGain10Pts.length < 1) {
    howToGain10Pts.push("Continue mantendo os dados atualizados e a revisão semanal em dia");
  }

  // ── Maior gargalo ─────────────────────────────────────────────────────────
  let biggestBottleneck = "";
  const maxRawMissing: Array<[number, string]> = [];

  const essenciaisMissing = 30 - (avcbPts + seguroPts + mandatoPts);
  if (essenciaisMissing > 0) maxRawMissing.push([essenciaisMissing, "Essenciais sem cadastro completo"]);

  const alertasMissing = (criticals.length > 0 ? 15 : 0) + (atencaos.length > 0 ? 5 : 0);
  if (alertasMissing > 0) maxRawMissing.push([alertasMissing, "Alertas críticos ou de atenção ativos"]);

  const manutMissing = 15 - manutPts;
  if (manutMissing > 5) maxRawMissing.push([manutMissing, "Manutenções recorrentes sem registro ou atrasadas"]);

  const pendMissing = stale.length > 0 ? 10 : (openCount > 5 ? 5 : 0);
  if (pendMissing > 0) maxRawMissing.push([pendMissing, "Próximos passos parados ou em excesso"]);

  if (!reviewedThisWeek) maxRawMissing.push([10, "Revisão semanal não concluída esta semana"]);

  maxRawMissing.sort((a, b) => b[0] - a[0]);
  biggestBottleneck = maxRawMissing[0]?.[1] ?? "Nenhum gargalo significativo identificado";

  return {
    percentage,
    statusKey,
    statusLabel,
    diagnosticPhrase,
    factors: factors.slice(0, 6),
    suggestions: suggestions.slice(0, 3),
    howToGain10Pts: howToGain10Pts.slice(0, 3),
    biggestBottleneck,
  };
}

// ── Projeção de score nos próximos 30 dias ────────────────────────────────────
// Analisa o que vai mudar automaticamente nos próximos 30 dias
// (vencimentos chegando, revisão semanal pendente, etc.) sem ação do síndico.

export type ScoreProjectionEvent = {
  dayOffset: number;  // Daqui a quantos dias ocorre
  label: string;
  deltaEstimado: number; // negativo = queda de score
  type: "warning" | "critical";
};

export type ScoreProjection = {
  events: ScoreProjectionEvent[];
  projectedIn30Days: number;
  projectedStatusKey: HealthStatusKey;
  narrativa: string;
};

export function buildScoreProjection(currentPct: number): ScoreProjection {
  const m        = getMemoriaOperacional();
  const assistida = getMemoriaAssistida();
  const events: ScoreProjectionEvent[] = [];

  function daysUntil(iso: string | undefined): number | null {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - now.getTime()) / 86400000);
  }

  // AVCB
  const avcbDate  = m.vencimentoAVCB || assistida.avcb?.value;
  const avcbDays  = daysUntil(avcbDate);
  if (avcbDays !== null && avcbDays > 0 && avcbDays <= 30) {
    events.push({
      dayOffset: avcbDays,
      label: `AVCB vence`,
      deltaEstimado: -15,
      type: "critical",
    });
  }

  // Seguro
  const seguroDate = m.vencimentoSeguro || assistida.seguro?.value;
  const seguroDays = daysUntil(seguroDate);
  if (seguroDays !== null && seguroDays > 0 && seguroDays <= 30) {
    events.push({
      dayOffset: seguroDays,
      label: `Seguro predial vence`,
      deltaEstimado: -15,
      type: "critical",
    });
  }

  // Mandato
  const mandatoDate = m.fimMandatoSindico || assistida.mandato?.value;
  const mandatoDays = daysUntil(mandatoDate);
  if (mandatoDays !== null && mandatoDays > 0 && mandatoDays <= 30) {
    events.push({
      dayOffset: mandatoDays,
      label: `Mandato do síndico vence`,
      deltaEstimado: -10,
      type: "warning",
    });
  }

  // Revisão semanal vai expirar esta semana (sexta-feira)
  const weekKey = getCurrentWeekKey();
  const weekly  = getWeeklyReviewState();
  const dayOfWeek = new Date().getDay(); // 0=dom, 5=sex
  if (weekly.lastCompletedWeekKey !== weekKey) {
    const daysToFriday = (5 - dayOfWeek + 7) % 7;
    if (daysToFriday <= 7) {
      events.push({
        dayOffset: daysToFriday || 7,
        label: `Semana fecha sem revisão semanal`,
        deltaEstimado: -8,
        type: "warning",
      });
    }
  }

  events.sort((a, b) => a.dayOffset - b.dayOffset);

  const totalDelta = events.reduce((sum, e) => sum + e.deltaEstimado, 0);
  const projectedPct = Math.max(0, Math.min(100, currentPct + totalDelta));

  const projectedStatusKey = (
    projectedPct <= 39 ? "critico" :
    projectedPct <= 59 ? "atencao" :
    projectedPct <= 79 ? "em-evolucao" :
    projectedPct <= 94 ? "bem-acompanhado" : "tudo-em-ordem"
  ) as HealthStatusKey;

  let narrativa = "";
  if (events.length === 0) {
    narrativa = "Nenhum vencimento crítico previsto nos próximos 30 dias.";
  } else if (events.length === 1) {
    const e = events[0];
    narrativa = `${e.label} em ${e.dayOffset} dia${e.dayOffset !== 1 ? "s" : ""} — sem ação, score pode cair para ~${projectedPct}%.`;
  } else {
    narrativa = `${events.length} eventos nos próximos 30 dias podem reduzir o score para ~${projectedPct}% se não tratados.`;
  }

  return { events, projectedIn30Days: projectedPct, projectedStatusKey, narrativa };
}
