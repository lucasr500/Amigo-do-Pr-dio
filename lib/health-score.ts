// Índice local de Saúde Operacional do condomínio.
// Determinístico, 100% client-side, sem IA, sem backend, sem dado remoto.
// Mede organização operacional com base nos dados cadastrados no app.
// NÃO indica regularidade jurídica, compliance, ausência de risco ou garantia.

import {
  getMemoriaOperacional,
  getMemoriaAssistida,
  getDocumentos,
  getFuncionarios,
  getOcorrencias,
  getPendenciasAbertas,
  getProfile,
  getWeeklyReviewState,
  getCurrentWeekKey,
  type MemoriaOperacional,
  type AssistedDateField,
} from "./session";
import { buildGuidanceItems } from "./guidance";

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

// Máximo de pontos brutos — backup excluído por ausência de timestamp confiável
const MAX_RAW = 105;

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

  const assistida  = getMemoriaAssistida();
  const documentos = getDocumentos();
  const funcionarios = getFuncionarios();

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

  // ── 3. Próximos passos — 15 pts ───────────────────────────────────────────
  const stale     = pendencias.filter((p) => now - new Date(p.createdAt).getTime() > staleMs);
  const openCount = pendencias.length;
  if (stale.length === 0)     raw += 10;
  else if (stale.length <= 1) raw += 5;
  if (openCount <= 3)          raw += 5;
  else if (openCount <= 5)     raw += 2;

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
  const TOTAL_DOCS = 14; // DOCUMENTOS_ESSENCIAIS_IDS.length — hardcoded to avoid import cycle
  const docTenho       = documentos.filter((d) => d.status === "tenho").length;
  const docNaoAplica   = documentos.filter((d) => d.status === "nao_se_aplica").length;
  const docRegistrados = documentos.length;
  const docAplicaveis  = Math.max(1, TOTAL_DOCS - docNaoAplica);
  const docPct         = docRegistrados > 0 ? docTenho / docAplicaveis : -1;
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
      label: `Documentos: ${docTenho} confirmados de ${TOTAL_DOCS}`,
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
  if (filledRoutines < 3 && suggestions.length < 3)
    suggestions.push("Registrar manutenções recorrentes");
  if (suggestions.length < 3)
    suggestions.push("Exportar backup dos dados");

  return {
    percentage,
    statusKey,
    statusLabel,
    diagnosticPhrase,
    factors: factors.slice(0, 6),
    suggestions: suggestions.slice(0, 3),
  };
}
