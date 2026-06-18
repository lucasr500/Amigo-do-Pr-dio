// ─── Prestação de contas / Transparência (W3) ────────────────────────────────
// Adapta o financeiro de GESTÃO para TRANSPARÊNCIA (decisão do Lucas): em vez de
// caixa/contas/inadimplência por unidade, publica um RESUMO agregado, próprio para
// ser visto por morador (visibility). Anti-posicionamento da Tese: não competimos
// com a administradora em financeiro — damos transparência.
//
// SEGURANÇA: expõe SOMENTE agregados (receitas, despesas, resultado, saldo). NUNCA
// inadimplência (delinquencyRate) nem entries individuais. Read-only sobre a lib
// financeira existente (preservada; consumidores intocados).

import { getCurrentFinancialSnapshot, currentMonthKey } from "./financial";
import type { Visibility } from "./community-types";

export type TransparencySummary = {
  month: string;          // YYYY-MM
  receitas: number;       // soma de entradas (receita)
  despesas: number;       // soma de saídas (despesa + conta_a_pagar)
  resultado: number;      // receitas − despesas
  saldoEstimado: number;  // saldo do snapshot
  visibility: Visibility; // padrão: moradores (transparência é para o condomínio)
  hasData: boolean;
};

function moneyBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function buildTransparencySummary(month = currentMonthKey()): TransparencySummary {
  const snap = getCurrentFinancialSnapshot(month);
  const receitas = snap.entries.filter((e) => e.type === "receita").reduce((s, e) => s + e.amount, 0);
  const despesas = snap.entries
    .filter((e) => e.type === "despesa" || e.type === "conta_a_pagar")
    .reduce((s, e) => s + e.amount, 0);
  return {
    month,
    receitas,
    despesas,
    resultado: receitas - despesas,
    saldoEstimado: snap.estimatedBalance,
    visibility: "moradores",
    hasData: snap.entries.length > 0,
  };
}

/**
 * Texto publicável como DOCUMENTO de transparência (corpo). Sem inadimplência,
 * sem lançamentos individuais — só o panorama agregado do mês.
 */
export function buildTransparencyReport(month = currentMonthKey()): string {
  const s = buildTransparencySummary(month);
  if (!s.hasData) {
    return [
      `PRESTAÇÃO DE CONTAS — ${month}`,
      "",
      "Ainda não há lançamentos registrados para este mês.",
      "",
      "Este resumo é informativo e de transparência; não substitui a prestação de contas formal da administradora.",
    ].join("\n");
  }
  return [
    `PRESTAÇÃO DE CONTAS — ${month}`,
    "",
    `Receitas do mês:  ${moneyBRL(s.receitas)}`,
    `Despesas do mês:  ${moneyBRL(s.despesas)}`,
    `Resultado do mês: ${moneyBRL(s.resultado)}`,
    `Saldo estimado:   ${moneyBRL(s.saldoEstimado)}`,
    "",
    "Resumo agregado, para transparência aos condôminos. Não inclui detalhamento individual.",
    "Não substitui a prestação de contas formal da administradora.",
  ].join("\n");
}
