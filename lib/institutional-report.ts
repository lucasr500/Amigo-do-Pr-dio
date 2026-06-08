// Helper puro: relatório institucional consolidado.
// Agrega decisões, fornecedores, timeline, documentos, financeiro e handoff.
// Sem side effects. Sem DOM. Testável por função pura.

import { buildCommandCenterCached } from "./command-center";
import { getDecisions, DECISION_STATUS_LABELS } from "./decisions";
import { getActiveSuppliers } from "./suppliers";
import { getTimeline } from "./community-timeline";
import { currentMonthKey, getCurrentFinancialSnapshot } from "./financial";
import { getHandoffProgress } from "./handoff";
import { getPendencias } from "./session-pendencias";
import { getProfile } from "./session";
import { getDocumentosSummary } from "./session-documentos";
import { getMonthlyReviewHistory } from "./session-monthly-review";

function fmtDateShort(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildInstitutionalReport(month = currentMonthKey()): string {
  const profile     = getProfile();
  const condoName   = profile?.nomeCondominio ?? "Condomínio";
  const mesRef      = new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // ── Saúde operacional ──────────────────────────────────────────────────────
  let healthScore = 0;
  let summaryText = "sem dados";
  let topPriorities: string[] = [];
  try {
    const cc = buildCommandCenterCached();
    healthScore = cc.healthPercentage;
    summaryText = cc.summaryText;
    topPriorities = cc.todayFocus.slice(0, 3).map((f) => f.title);
  } catch { /* silencioso */ }

  // ── Pendências ─────────────────────────────────────────────────────────────
  let abertas = 0, vencidas = 0, concluidas = 0;
  let penAtencao = "";
  try {
    const all = getPendencias();
    const today = new Date().toISOString().slice(0, 10);
    abertas    = all.filter((p) => p.status === "aberta").length;
    vencidas   = all.filter((p) => p.status === "aberta" && p.dueDate && p.dueDate < today).length;
    concluidas = all.filter((p) => p.status === "concluida").length;
    if (vencidas > 0) penAtencao = `${vencidas} vencida${vencidas > 1 ? "s" : ""} — requer atenção imediata.`;
    else if (abertas > 5) penAtencao = "Volume alto de pendências em aberto.";
  } catch { /* silencioso */ }

  // ── Documentos ────────────────────────────────────────────────────────────
  let docTenho = 0, docVencidos = 0, docProximos = 0, docCriticos = 0;
  try {
    const ds = getDocumentosSummary();
    docTenho     = ds.tenho;
    docVencidos  = ds.vencidos;
    docProximos  = ds.proximos;
    docCriticos  = ds.criticosPendentes;
  } catch { /* silencioso */ }

  // ── Financeiro ────────────────────────────────────────────────────────────
  let finSaldo: number | null = null;
  let finInadimplencia: number | null = null;
  try {
    const snap = getCurrentFinancialSnapshot(month);
    if (snap.estimatedBalance !== 0 || snap.entries.length > 0) {
      finSaldo = snap.estimatedBalance;
      finInadimplencia = snap.delinquencyRate ?? null;
    }
  } catch { /* silencioso */ }

  // ── Decisões ──────────────────────────────────────────────────────────────
  let decTotal = 0, decEmExecucao = 0, decConcluidas = 0, decUltima = "";
  try {
    const decisions = getDecisions();
    decTotal       = decisions.length;
    decEmExecucao  = decisions.filter((d) => d.status === "em_execucao").length;
    decConcluidas  = decisions.filter((d) => d.status === "concluida").length;
    const ultima   = [...decisions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (ultima) {
      decUltima = `${ultima.title} — ${DECISION_STATUS_LABELS[ultima.status]} (${fmtDateShort(ultima.date)})`;
    }
  } catch { /* silencioso */ }

  // ── Fornecedores ──────────────────────────────────────────────────────────
  let suppCount = 0;
  let suppNames: string[] = [];
  try {
    const ativos = getActiveSuppliers();
    suppCount = ativos.length;
    suppNames = ativos.slice(0, 4).map((s) => s.name);
  } catch { /* silencioso */ }

  // ── Timeline ──────────────────────────────────────────────────────────────
  let timelineEvents: string[] = [];
  try {
    const tl = getTimeline();
    timelineEvents = tl.slice(0, 4).map((ev) => `${ev.title} (${fmtDateShort(ev.occurredAt.slice(0, 10))})`);
  } catch { /* silencioso */ }

  // ── Handoff / Continuidade ────────────────────────────────────────────────
  let handoffPct = 0;
  try {
    handoffPct = getHandoffProgress().pct;
  } catch { /* silencioso */ }

  let reviewCount = 0;
  try {
    reviewCount = getMonthlyReviewHistory().length;
  } catch { /* silencioso */ }

  // ── Construção do texto ───────────────────────────────────────────────────
  const lines: string[] = [];

  lines.push(`🏢 Relatório institucional auxiliar — ${condoName}`);
  lines.push(`📅 Referência: ${mesRef}`);
  lines.push("");

  // Saúde
  lines.push("✅ Saúde operacional");
  lines.push(`HealthScore: ${healthScore}/100 — ${summaryText}`);
  if (topPriorities.length > 0) {
    lines.push("Prioridades identificadas:");
    topPriorities.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
  }
  lines.push("");

  // Pendências
  lines.push("📌 Pendências");
  lines.push(`Abertas: ${abertas}  Vencidas: ${vencidas}  Concluídas: ${concluidas}`);
  if (penAtencao) lines.push(`Atenção: ${penAtencao}`);
  lines.push("");

  // Documentos
  lines.push("📄 Documentos essenciais");
  if (docCriticos > 0) {
    lines.push(`${docCriticos} crítico${docCriticos > 1 ? "s" : ""} pendente${docCriticos > 1 ? "s" : ""} — requer regularização.`);
  } else {
    lines.push(`Em dia: ${docTenho}  Vencendo em breve: ${docProximos}  Vencidos: ${docVencidos}`);
  }
  lines.push("");

  // Financeiro
  if (finSaldo !== null) {
    lines.push("💰 Financeiro auxiliar");
    lines.push(`Saldo estimado: ${brl(finSaldo)}`);
    if (finInadimplencia !== null) {
      lines.push(`Inadimplência registrada: ${finInadimplencia}%`);
    }
    lines.push("");
  }

  // Decisões
  if (decTotal > 0) {
    lines.push("🏛️ Decisões e governança");
    lines.push(`Registradas: ${decTotal}  Em execução: ${decEmExecucao}  Concluídas: ${decConcluidas}`);
    if (decUltima) lines.push(`Última: ${decUltima}`);
    lines.push("");
  }

  // Memória institucional
  const memTotal = decTotal + suppCount + timelineEvents.length;
  lines.push("🕘 Memória institucional");
  if (memTotal > 0) {
    lines.push(`${memTotal} registro${memTotal > 1 ? "s" : ""} acumulado${memTotal > 1 ? "s" : ""}`);
    if (suppCount > 0) {
      lines.push(`Fornecedores ativos: ${suppCount}${suppNames.length > 0 ? ` (${suppNames.join(", ")})` : ""}`);
    }
    if (timelineEvents.length > 0) {
      lines.push("Eventos recentes:");
      timelineEvents.forEach((ev) => lines.push(`  • ${ev}`));
    }
  } else {
    lines.push("Sem registros acumulados ainda — cadastre decisões, fornecedores e revisões mensais.");
  }
  lines.push("");

  // Continuidade
  lines.push("🔁 Continuidade da gestão");
  lines.push(`Passagem de mandato: ${handoffPct}% preparada`);
  if (reviewCount > 0) lines.push(`Revisões mensais realizadas: ${reviewCount}`);
  else lines.push("Revisão mensal: ainda não realizada");
  lines.push("");

  lines.push("─────────────────────────────");
  lines.push("Resumo auxiliar de gestão, gerado com dados locais informados manualmente.");
  lines.push("Não substitui ata, balancete, prestação de contas oficial, parecer jurídico ou orientação profissional especializada.");

  return lines.join("\n");
}
