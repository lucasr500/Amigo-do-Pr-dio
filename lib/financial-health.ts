// Motor de saúde financeira operacional do condomínio.
// 100% determinístico, client-side, sem IA, sem backend.
// NÃO indica contabilidade formal, compliance ou garantia financeira.
// Arquivo só importado por componentes financeiros (dynamic) — fora do bundle inicial.

import {
  getMovimentacoes,
  getSaldoAtual,
  type MovimentacaoFinanceira,
} from "./session";

export type FinancialHealthStatus = "critico" | "atencao" | "saudavel" | "sem_dados";
export type TendenciaFinanceira = "subindo" | "estavel" | "caindo" | "indefinido";

export type FinancialHealth = {
  score: number;                      // 0–100
  status: FinancialHealthStatus;
  caixaMeses: number;                 // quantos meses de despesas o saldo atual cobre
  tendencia: TendenciaFinanceira;     // comparação últimos 3 meses
  receitas30d: number;                // soma receitas últimos 30 dias
  despesas30d: number;                // soma despesas últimos 30 dias
  saldoAtual: number;                 // saldo acumulado total
  principalProblema?: string;         // principal gap identificado
  recomendacao?: string;              // ação recomendada
  hasData: boolean;                   // se há movimentações registradas
  totalMovimentacoes: number;
  primeiraMovimentacao: string | null;  // YYYY-MM-DD
  ultimaMovimentacao: string | null;    // YYYY-MM-DD
};

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function nMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

function sumPeriod(items: MovimentacaoFinanceira[], tipo: "receita" | "despesa", start: string, end: string): number {
  return items
    .filter((m) => m.tipo === tipo && m.data >= start && m.data <= end)
    .reduce((s, m) => s + m.valor, 0);
}

export function computeFinancialHealth(): FinancialHealth {
  const all = getMovimentacoes();
  const today = isoToday();

  if (all.length === 0) {
    return {
      score: 0,
      status: "sem_dados",
      caixaMeses: 0,
      tendencia: "indefinido",
      receitas30d: 0,
      despesas30d: 0,
      saldoAtual: 0,
      principalProblema: "Nenhum dado financeiro registrado",
      recomendacao: "Registre receitas e despesas para ativar o monitoramento financeiro",
      hasData: false,
      totalMovimentacoes: 0,
      primeiraMovimentacao: null,
      ultimaMovimentacao: null,
    };
  }

  const sorted      = [...all].sort((a, b) => a.data.localeCompare(b.data));
  const primeira    = sorted[0].data;
  const ultima      = sorted[sorted.length - 1].data;
  const saldoAtual  = getSaldoAtual();

  // ── Período 30 dias ───────────────────────────────────────────────────────
  const start30     = nDaysAgo(30);
  const receitas30d = sumPeriod(all, "receita", start30, today);
  const despesas30d = sumPeriod(all, "despesa", start30, today);

  // ── Meses de caixa ────────────────────────────────────────────────────────
  // Referência: média de despesas mensais dos últimos 3 meses
  const start90     = nDaysAgo(90);
  const despesas90  = sumPeriod(all, "despesa", start90, today);
  const mediaMensal = despesas90 / 3;
  const caixaMeses  = mediaMensal > 0
    ? Math.max(0, parseFloat((saldoAtual / mediaMensal).toFixed(1)))
    : saldoAtual > 0 ? 99 : 0;

  // ── Tendência: comparar meses M-1 vs M-2 ─────────────────────────────────
  const m1Start = nMonthsAgo(1);
  const m1End   = today;
  const m2Start = nMonthsAgo(2);
  const m2End   = nDaysAgo(30);
  const m3Start = nMonthsAgo(3);
  const m3End   = nMonthsAgo(2);

  const saldoM1 = sumPeriod(all, "receita", m1Start, m1End) - sumPeriod(all, "despesa", m1Start, m1End);
  const saldoM2 = sumPeriod(all, "receita", m2Start, m2End) - sumPeriod(all, "despesa", m2Start, m2End);
  const saldoM3 = sumPeriod(all, "receita", m3Start, m3End) - sumPeriod(all, "despesa", m3Start, m3End);

  let tendencia: TendenciaFinanceira = "indefinido";
  const hasM1 = saldoM1 !== 0;
  const hasM2 = saldoM2 !== 0;
  const hasM3 = saldoM3 !== 0;

  if (hasM1 && hasM2) {
    const delta12 = saldoM1 - saldoM2;
    const delta23 = hasM3 ? saldoM2 - saldoM3 : null;
    if (delta12 > 50 && (delta23 === null || delta23 > 0)) tendencia = "subindo";
    else if (delta12 < -50 && (delta23 === null || delta23 < 0)) tendencia = "caindo";
    else tendencia = "estavel";
  }

  // ── Freshness: última movimentação ────────────────────────────────────────
  const daysSinceLast = ultima
    ? Math.floor((new Date(today).getTime() - new Date(ultima).getTime()) / 86400000)
    : 999;

  // ── Score ──────────────────────────────────────────────────────────────────
  let score = 50;

  // Caixa
  if (caixaMeses >= 4)      score += 30;
  else if (caixaMeses >= 3) score += 20;
  else if (caixaMeses >= 2) score += 10;
  else if (caixaMeses >= 1) score += 0;
  else if (caixaMeses > 0)  score -= 10;
  else                       score -= 30; // saldo negativo

  // Tendência
  if (tendencia === "subindo")   score += 15;
  else if (tendencia === "estavel") score += 5;
  else if (tendencia === "caindo") score -= 20;

  // Freshness
  if (daysSinceLast > 60)       score -= 20;
  else if (daysSinceLast > 45)  score -= 10;
  else if (daysSinceLast > 30)  score -= 5;

  // Receita vs Despesa (30d)
  if (receitas30d > 0 && despesas30d > 0) {
    const ratio = receitas30d / despesas30d;
    if (ratio >= 1.05)       score += 10;
    else if (ratio >= 0.95)  score += 5;
    else                      score -= 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const status: FinancialHealthStatus =
    score >= 70 ? "saudavel" :
    score >= 40 ? "atencao" :
    "critico";

  // ── Problema principal e recomendação ──────────────────────────────────────
  let principalProblema: string | undefined;
  let recomendacao: string | undefined;

  if (saldoAtual < 0) {
    principalProblema = "Saldo negativo — despesas superam receitas acumuladas";
    recomendacao = "Registre as receitas pendentes ou revise as despesas recorrentes";
  } else if (caixaMeses < 1) {
    principalProblema = `Caixa insuficiente — ${caixaMeses.toFixed(1)} meses de reserva`;
    recomendacao = "Reforce a arrecadação de cotas e reduza despesas não essenciais";
  } else if (tendencia === "caindo") {
    principalProblema = "Tendência de queda no saldo dos últimos meses";
    recomendacao = "Analise as despesas crescentes e verifique a arrecadação de cotas";
  } else if (daysSinceLast > 45) {
    principalProblema = `Dados desatualizados — última movimentação há ${daysSinceLast} dias`;
    recomendacao = "Registre as movimentações recentes para manter o monitoramento ativo";
  } else if (caixaMeses < 2) {
    principalProblema = `Reserva baixa — ${caixaMeses.toFixed(1)} meses de caixa`;
    recomendacao = "Planeje aumentar a reserva para ao menos 2–3 meses de despesas";
  }

  return {
    score,
    status,
    caixaMeses,
    tendencia,
    receitas30d,
    despesas30d,
    saldoAtual,
    principalProblema,
    recomendacao,
    hasData: true,
    totalMovimentacoes: all.length,
    primeiraMovimentacao: primeira,
    ultimaMovimentacao: ultima,
  };
}

// Formata valor em BRL compacto
export function formatBRL(valor: number): string {
  if (Math.abs(valor) >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(valor) >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}k`;
  }
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata meses de caixa para exibição
export function formatCaixaMeses(meses: number): string {
  if (meses >= 99) return "∞";
  if (meses < 0.1) return "< 0.1 mês";
  if (meses === 1) return "1 mês";
  return `${meses.toFixed(1)} meses`;
}
