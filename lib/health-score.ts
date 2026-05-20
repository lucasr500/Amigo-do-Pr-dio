// Índice local de Saúde Operacional do condomínio.
// Determinístico, 100% client-side, sem IA, sem backend, sem dado remoto.
// Mede organização operacional com base nos dados cadastrados no app.
// NÃO indica regularidade jurídica, compliance, ausência de risco ou garantia.

import {
  getMemoriaOperacional,
  getOcorrencias,
  getPendenciasAbertas,
  getProfile,
  getWeeklyReviewState,
  getCurrentWeekKey,
  type MemoriaOperacional,
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
const MAX_RAW = 90;

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

  const now     = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const staleMs = 14 * 86_400_000;

  let raw = 0;

  // ── 1. Essenciais — 30 pts (10 cada) ─────────────────────────────────────
  const hasAVCB    = !!m.vencimentoAVCB;
  const hasSeguro  = !!m.vencimentoSeguro;
  const hasMandato = !!m.fimMandatoSindico;
  const essentialsCount =
    (hasAVCB ? 1 : 0) + (hasSeguro ? 1 : 0) + (hasMandato ? 1 : 0);
  raw += essentialsCount * 10;

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
  // Só pontua se houver vínculo explícito de rastreamento (próximo passo criado).
  const recentTracked = getOcorrencias().filter(
    (o) => new Date(o.createdAt).getTime() >= weekAgo && o.hasNextStep === true
  );
  if (recentTracked.length > 0) raw += 5;

  const percentage     = Math.min(100, Math.round((raw / MAX_RAW) * 100));
  const statusKey      = statusFromPct(percentage);
  const statusLabel    = STATUS_LABELS[statusKey];
  const diagnosticPhrase = PHRASES[statusKey];

  // ── Fatores ───────────────────────────────────────────────────────────────
  const factors: HealthFactor[] = [];

  // Essenciais
  if (essentialsCount === 3) {
    factors.push({ label: "Essenciais: 3/3 cadastrados", status: "ok" });
  } else if (essentialsCount > 0) {
    factors.push({
      label: `Essenciais: ${essentialsCount}/3 cadastrados`,
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
    factors: factors.slice(0, 5),
    suggestions: suggestions.slice(0, 3),
  };
}
