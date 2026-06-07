// ─── Relatório para AGO — Assembleia Geral Ordinária ─────────────────────────
// Gera relatório anual executivo pronto para apresentar em assembleia.
// Usa todos os dados do condomínio: financeiro, documentos, operação, pessoas.

import type { CondominioProfile, MemoriaOperacional, Pendencia, ManutencaoRecorrente, FuncionarioFerias } from "./session";
import type { DocumentoEssencial } from "./session-documentos";
import type { MonthlyFinancialSnapshot } from "./financial";
import { buildAnnualBudgetProjection, detectFinancialAnomalies } from "./financial-intelligence";
import { getDecisions } from "./decisions";
import { getSuppliers } from "./suppliers";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export type AgoReportOptions = {
  includeFinancial: boolean;
  includeDocuments: boolean;
  includeOperations: boolean;
  includePeople: boolean;
  includeDecisions: boolean;
  includeNextYear: boolean;
  year?: number;
};

export function buildAgoReport(
  profile: CondominioProfile | null,
  memoria: MemoriaOperacional,
  pendencias: Pendencia[],
  documentos: DocumentoEssencial[],
  funcionarios: FuncionarioFerias[],
  manutencoes: ManutencaoRecorrente[],
  financialSnapshots: MonthlyFinancialSnapshot[],
  options: Partial<AgoReportOptions> = {}
): string {
  const opts: AgoReportOptions = {
    includeFinancial: true,
    includeDocuments: true,
    includeOperations: true,
    includePeople: true,
    includeDecisions: true,
    includeNextYear: true,
    ...options,
  };

  const year = opts.year ?? new Date().getFullYear();
  const condo = profile?.nomeCondominio ?? "Condomínio";
  const unidades = profile?.numUnidades;

  const lines: string[] = [
    `RELATÓRIO ANUAL DE GESTÃO — AGO ${year}`,
    condo.toUpperCase(),
    `Gerado em ${todayFormatted()} pelo Amigo do Prédio`,
    "",
    "════════════════════════════════════════════════════════",
    "1. APRESENTAÇÃO",
    "════════════════════════════════════════════════════════",
    "",
    `Este relatório consolida as principais atividades e indicadores de gestão`,
    `do ${condo} referentes ao período ${year}.`,
    "",
  ];

  if (unidades) lines.push(`Unidades: ${unidades}`);
  if (profile?.numBlocos && profile.numBlocos > 1) lines.push(`Blocos: ${profile.numBlocos}`);
  if (memoria.fimMandatoSindico) lines.push(`Término do mandato: ${memoria.fimMandatoSindico}`);
  if (memoria.ultimaAGO) lines.push(`Última AGO realizada: ${memoria.ultimaAGO}`);

  // ── Financeiro
  if (opts.includeFinancial && financialSnapshots.length > 0) {
    const yearSnaps = financialSnapshots.filter((s) => s.month.startsWith(String(year)));
    const projection = buildAnnualBudgetProjection(yearSnaps.length >= 3 ? yearSnaps : financialSnapshots);
    const anomalies = detectFinancialAnomalies(yearSnaps.length >= 3 ? yearSnaps : financialSnapshots);

    lines.push(
      "",
      "════════════════════════════════════════════════════════",
      "2. PRESTAÇÃO DE CONTAS",
      "════════════════════════════════════════════════════════",
      "",
      `Receitas médias mensais (registradas): ${formatBRL(projection.totalMonthlyRevenue)}`,
      `Despesas médias mensais (registradas): ${formatBRL(projection.totalMonthlyExpenses)}`,
      `Resultado médio mensal: ${formatBRL(projection.totalMonthlyRevenue - projection.totalMonthlyExpenses)}`,
    );

    if (yearSnaps.length > 0) {
      lines.push("", "Resumo por período:");
      for (const snap of yearSnaps.slice(-6)) {
        const rev = snap.entries.filter((e) => e.type === "receita").reduce((s, e) => s + e.amount, 0);
        const exp = snap.entries.filter((e) => e.type === "despesa" || e.type === "conta_a_pagar").reduce((s, e) => s + e.amount, 0);
        lines.push(`  ${snap.month}: Receita ${formatBRL(rev)} · Despesa ${formatBRL(exp)} · Saldo ${formatBRL(snap.estimatedBalance)}`);
      }
    }

    if (anomalies.length > 0) {
      lines.push("", "Variações significativas detectadas:");
      anomalies.slice(0, 5).forEach((a) => lines.push(`  • ${a.description}`));
    }

    lines.push("", "Nota: dados registrados manualmente como controle auxiliar. O demonstrativo oficial é o da administradora.");
  }

  // ── Documentos
  if (opts.includeDocuments && documentos.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const vencidos = documentos.filter((d) => {
      if (d.status !== "tenho") return false;
      const v = d.vencimento?.value;
      return v && v < today;
    });
    const aVencer = documentos.filter((d) => {
      if (d.status !== "tenho") return false;
      const v = d.vencimento?.value;
      if (!v) return false;
      const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      return v >= today && v <= in90;
    });
    const faltantes = documentos.filter((d) => d.status === "nao_tenho" || d.status === "precisa_localizar");
    const ok = documentos.filter((d) => d.status === "tenho");

    lines.push(
      "",
      "════════════════════════════════════════════════════════",
      "3. SITUAÇÃO DOCUMENTAL",
      "════════════════════════════════════════════════════════",
      "",
      `Documentos mapeados: ${documentos.length}`,
      `Documentos em ordem: ${ok.length}`,
      `Documentos vencidos: ${vencidos.length}`,
      `A vencer em 90 dias: ${aVencer.length}`,
      `Pendentes/não localizados: ${faltantes.length}`,
    );

    if (vencidos.length > 0) {
      lines.push("", "Documentos vencidos:");
      vencidos.forEach((d) => lines.push(`  • ${d.id.replace(/_/g, " ")} — venceu em ${d.vencimento?.value ?? "data não informada"}`));
    }
    if (aVencer.length > 0) {
      lines.push("", "A vencer em 90 dias:");
      aVencer.forEach((d) => lines.push(`  • ${d.id.replace(/_/g, " ")} — vence em ${d.vencimento?.value ?? "—"}`));
    }
  }

  // ── Operação
  if (opts.includeOperations) {
    const pendAbertas = pendencias.filter((p) => p.status !== "concluida");
    const pendConcluidas = pendencias.filter((p) => p.status === "concluida");
    const manutencoesRealizadas = manutencoes.filter((m) => m.ultimaExecucao);

    lines.push(
      "",
      "════════════════════════════════════════════════════════",
      "4. OPERAÇÃO E MANUTENÇÕES",
      "════════════════════════════════════════════════════════",
      "",
      `Pendências resolvidas: ${pendConcluidas.length}`,
      `Pendências em aberto: ${pendAbertas.length}`,
      `Manutenções registradas: ${manutencoesRealizadas.length}`,
    );

    if (manutencoesRealizadas.length > 0) {
      lines.push("", "Manutenções realizadas (registro mais recente):");
      manutencoesRealizadas.slice(0, 8).forEach((m) =>
        lines.push(`  • ${m.label} — última em ${m.ultimaExecucao}${m.fornecedor ? ` (${m.fornecedor})` : ""}`)
      );
    }

    if (memoria.ultimaAGO)              lines.push("", `AGO anterior: ${memoria.ultimaAGO}`);
    if (memoria.vencimentoAVCB)         lines.push(`AVCB vigente até: ${memoria.vencimentoAVCB}`);
    if (memoria.vencimentoSeguro)       lines.push(`Seguro vigente até: ${memoria.vencimentoSeguro}`);
    if (memoria.ultimaDedetizacao)      lines.push(`Última dedetização: ${memoria.ultimaDedetizacao}`);
    if (memoria.ultimaLimpezaCaixaDAgua) lines.push(`Última limpeza de caixa d'água: ${memoria.ultimaLimpezaCaixaDAgua}`);
  }

  // ── Pessoas
  if (opts.includePeople && funcionarios.length > 0) {
    lines.push(
      "",
      "════════════════════════════════════════════════════════",
      "5. QUADRO DE FUNCIONÁRIOS",
      "════════════════════════════════════════════════════════",
      "",
      `Funcionários cadastrados: ${funcionarios.length}`,
    );

    funcionarios.forEach((f) => {
      lines.push(`  • ${f.nomeFuncao}${f.cargo ? ` (${f.cargo})` : ""}${f.dataAdmissao ? ` — desde ${f.dataAdmissao}` : ""}`);
    });
  }

  // ── Fornecedores
  const suppliers = getSuppliers();
  if (suppliers.length > 0 && opts.includeOperations) {
    lines.push("", `Fornecedores cadastrados: ${suppliers.filter((s) => s.active).length} ativos`);
  }

  // ── Decisões relevantes
  if (opts.includeDecisions) {
    const decisions = getDecisions().filter((d) => d.date.startsWith(String(year)));
    if (decisions.length > 0) {
      lines.push(
        "",
        "════════════════════════════════════════════════════════",
        "6. DECISÕES RELEVANTES DO PERÍODO",
        "════════════════════════════════════════════════════════",
        ""
      );
      decisions.slice(-10).reverse().forEach((d) => {
        lines.push(`  • ${d.date} — ${d.title}`);
        lines.push(`    Decisão: ${d.outcome}`);
      });
    }
  }

  // ── Próximo ano
  if (opts.includeNextYear) {
    lines.push(
      "",
      "════════════════════════════════════════════════════════",
      `7. PREVISÃO ${year + 1}`,
      "════════════════════════════════════════════════════════",
      "",
    );

    if (memoria.vencimentoAVCB) lines.push(`• Renovação AVCB prevista: ${memoria.vencimentoAVCB}`);
    if (memoria.vencimentoSeguro) lines.push(`• Renovação do seguro prevista: ${memoria.vencimentoSeguro}`);
    if (memoria.fimMandatoSindico) lines.push(`• Término do mandato do síndico: ${memoria.fimMandatoSindico}`);

    const pendAbertas = pendencias.filter((p) => p.status !== "concluida");
    if (pendAbertas.length > 0) {
      lines.push("", "Pendências a resolver no próximo período:");
      pendAbertas.slice(0, 5).forEach((p) => lines.push(`  • ${p.titulo}`));
    }
  }

  lines.push(
    "",
    "════════════════════════════════════════════════════════",
    "Relatório gerado pelo Amigo do Prédio — controle auxiliar do síndico.",
    "Os dados financeiros são de responsabilidade do síndico e não substituem",
    "a prestação de contas formal da administradora.",
    "════════════════════════════════════════════════════════"
  );

  return lines.join("\n");
}
