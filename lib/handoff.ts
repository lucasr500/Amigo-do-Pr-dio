// ─── Handoff de mandato — transição entre síndicos ───────────────────────────
// Transforma o maior ponto de churn em argumento de venda:
// o síndico que sai prepara um pacote completo para o próximo.

import { safeRead, safeWrite, KEYS, todayISO } from "./session-core";
import type { CondominioProfile, MemoriaOperacional, Pendencia, ManutencaoRecorrente, FuncionarioFerias } from "./session";

export type HandoffItemStatus = "ok" | "pendente" | "nao_aplicavel";

export type HandoffChecklistItem = {
  id: string;
  categoria: "documentos" | "financeiro" | "operacao" | "pessoas" | "juridico" | "dados";
  titulo: string;
  descricao: string;
  status: HandoffItemStatus;
  observacao?: string;
  completedAt?: string;
};

export type HandoffState = {
  iniciatedAt?: string;
  successorName?: string;
  successorContact?: string;
  handoffDate?: string;
  notes?: string;
  items: HandoffChecklistItem[];
  reportGeneratedAt?: string;
  completed: boolean;
};

const DEFAULT_ITEMS: Omit<HandoffChecklistItem, "status" | "observacao" | "completedAt">[] = [
  // Documentos
  { id: "doc_convencao",     categoria: "documentos", titulo: "Convenção e Regimento",          descricao: "Localizar e entregar cópias físicas ou digitais da Convenção e do Regimento Interno." },
  { id: "doc_ata_eleicao",   categoria: "documentos", titulo: "Ata de eleição do novo síndico", descricao: "Registrar em cartório e fornecer ao novo síndico uma cópia da ata de eleição." },
  { id: "doc_avcb",          categoria: "documentos", titulo: "AVCB/CLCB",                      descricao: "Informar vencimento do AVCB e empresa responsável pela renovação." },
  { id: "doc_seguro",        categoria: "documentos", titulo: "Apólice de seguro",               descricao: "Fornecer apólice vigente com vencimento, corretora e contato." },
  { id: "doc_contratos",     categoria: "documentos", titulo: "Contratos de prestadores",        descricao: "Reunir e entregar contratos de elevador, limpeza, portaria, administradora e outros." },
  { id: "doc_laudos",        categoria: "documentos", titulo: "Laudos técnicos",                 descricao: "Reunir laudos elétrico, SPDA, caixa d'água, extintores e demais." },
  { id: "doc_cnd",           categoria: "documentos", titulo: "CND/Certidões fiscais",           descricao: "Verificar validade das certidões negativas e entregar cópias." },
  // Financeiro
  { id: "fin_balancetes",    categoria: "financeiro",  titulo: "Balancetes dos últimos 12 meses", descricao: "Entregar ao novo síndico todos os balancetes do período de gestão." },
  { id: "fin_saldo",         categoria: "financeiro",  titulo: "Saldo e conta bancária",           descricao: "Confirmar saldo atual e transferir signatários da conta do condomínio." },
  { id: "fin_pendencias",    categoria: "financeiro",  titulo: "Contas a pagar pendentes",         descricao: "Listar contas vencidas e a vencer para que nada fique em aberto." },
  { id: "fin_inadimplencia", categoria: "financeiro",  titulo: "Relatório de inadimplência",       descricao: "Entregar lista de unidades inadimplentes e acordo em andamento." },
  // Operação
  { id: "op_manutencoes",    categoria: "operacao",    titulo: "Calendário de manutenções",       descricao: "Informar próximas manutenções agendadas e histórico recente." },
  { id: "op_fornecedores",   categoria: "operacao",    titulo: "Lista de fornecedores",            descricao: "Reunir contatos de todos os fornecedores habituais com avaliação." },
  { id: "op_obras",          categoria: "operacao",    titulo: "Obras em andamento",               descricao: "Detalhar obras em curso: escopo, contrato, etapa atual e prazo." },
  { id: "op_pendencias",     categoria: "operacao",    titulo: "Pendências operacionais abertas",  descricao: "Listar todas as pendências abertas para o novo síndico dar continuidade." },
  { id: "op_ocorrencias",    categoria: "operacao",    titulo: "Ocorrências relevantes abertas",   descricao: "Repassar ocorrências em acompanhamento que exijam atenção." },
  // Pessoas
  { id: "pess_funcionarios", categoria: "pessoas",     titulo: "Contratos de funcionários",        descricao: "Entregar cópias de contratos, registros eSocial, CCT vigente e situação de férias." },
  { id: "pess_ferias",       categoria: "pessoas",     titulo: "Controle de férias",               descricao: "Informar saldo de férias de cada funcionário, vencidas ou a vencer." },
  { id: "pess_contatos",     categoria: "pessoas",     titulo: "Relação de moradores e contatos",  descricao: "Entregar lista de moradores, proprietários e contatos de emergência." },
  // Jurídico
  { id: "jur_processos",     categoria: "juridico",    titulo: "Processos e litígios",             descricao: "Informar sobre processos judiciais e/ou administrativos em curso." },
  { id: "jur_multas",        categoria: "juridico",    titulo: "Multas e advertências ativas",     descricao: "Listar multas e advertências aplicadas e pendentes de resposta." },
  // Dados
  { id: "dad_backup",        categoria: "dados",       titulo: "Backup do sistema Amigo do Prédio", descricao: "Exportar backup completo e entregar ao novo síndico para importação no novo dispositivo." },
  { id: "dad_senhas",        categoria: "dados",       titulo: "Credenciais e senhas",              descricao: "Transferir senhas de sistemas, câmeras, alarmes e portais de administração." },
];

export function getHandoffState(): HandoffState {
  const stored = safeRead<Partial<HandoffState>>(KEYS.HANDOFF_STATE, {});
  const storedItems = Array.isArray(stored.items) ? stored.items : [];
  const storedItemMap = new Map(storedItems.map((i) => [i.id, i]));

  const items: HandoffChecklistItem[] = DEFAULT_ITEMS.map((def) => {
    const saved = storedItemMap.get(def.id);
    return {
      ...def,
      status: saved?.status ?? "pendente",
      observacao: saved?.observacao,
      completedAt: saved?.completedAt,
    };
  });

  return {
    iniciatedAt: stored.iniciatedAt,
    successorName: stored.successorName,
    successorContact: stored.successorContact,
    handoffDate: stored.handoffDate,
    notes: stored.notes,
    items,
    reportGeneratedAt: stored.reportGeneratedAt,
    completed: stored.completed ?? false,
  };
}

export function saveHandoffState(state: HandoffState): void {
  safeWrite(KEYS.HANDOFF_STATE, state);
}

export function updateHandoffItem(id: string, status: HandoffItemStatus, observacao?: string): void {
  const state = getHandoffState();
  const items = state.items.map((item) =>
    item.id === id
      ? { ...item, status, observacao, completedAt: status === "ok" ? new Date().toISOString() : undefined }
      : item
  );
  saveHandoffState({ ...state, items });
}

export function getHandoffProgress(): { done: number; total: number; pct: number } {
  const { items } = getHandoffState();
  const done = items.filter((i) => i.status !== "pendente").length;
  const total = items.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function initHandoff(): void {
  const state = getHandoffState();
  if (!state.iniciatedAt) {
    saveHandoffState({ ...state, iniciatedAt: new Date().toISOString() });
  }
}

export function buildHandoffReport(
  state: HandoffState,
  profile: CondominioProfile | null,
  memoria: MemoriaOperacional,
  pendencias: Pendencia[],
  manutencoes: ManutencaoRecorrente[],
  funcionarios: FuncionarioFerias[]
): string {
  const today = todayISO();
  const condo = profile?.nomeCondominio ?? "Condomínio";
  const successor = state.successorName ?? "[Nome do sucessor]";
  const handoffDate = state.handoffDate ?? today;

  const categoriaLabel: Record<HandoffChecklistItem["categoria"], string> = {
    documentos: "Documentos",
    financeiro: "Financeiro",
    operacao: "Operação",
    pessoas: "Pessoas",
    juridico: "Jurídico",
    dados: "Dados e Sistemas",
  };

  const byCategoria = new Map<HandoffChecklistItem["categoria"], HandoffChecklistItem[]>();
  for (const item of state.items) {
    if (!byCategoria.has(item.categoria)) byCategoria.set(item.categoria, []);
    byCategoria.get(item.categoria)!.push(item);
  }

  const pendenciasAbertas = pendencias.filter((p) => p.status !== "concluida");
  const manutencoesProximas = manutencoes.filter((m) => m.ativo && m.ultimaExecucao);

  const lines: string[] = [
    `PACOTE DE TRANSIÇÃO DE MANDATO — ${condo.toUpperCase()}`,
    `Data de entrega: ${handoffDate}`,
    `Preparado por: síndico atual`,
    `Destinado a: ${successor}`,
    `Gerado em: ${today} pelo Amigo do Prédio`,
    "",
    "═══════════════════════════════════════════════════════",
    "SÍNTESE DO MANDATO",
    "═══════════════════════════════════════════════════════",
    "",
  ];

  if (memoria.fimMandatoSindico) lines.push(`Término do mandato: ${memoria.fimMandatoSindico}`);
  if (memoria.vencimentoAVCB)   lines.push(`AVCB vigente até: ${memoria.vencimentoAVCB}`);
  if (memoria.vencimentoSeguro) lines.push(`Seguro vigente até: ${memoria.vencimentoSeguro}`);
  if (memoria.ultimaAGO)        lines.push(`Última AGO: ${memoria.ultimaAGO}`);

  if (pendenciasAbertas.length > 0) {
    lines.push("", `Pendências abertas a transferir: ${pendenciasAbertas.length}`);
    pendenciasAbertas.slice(0, 10).forEach((p) => {
      lines.push(`  • ${p.titulo}${p.dueDate ? ` (prazo: ${p.dueDate})` : ""}`);
    });
    if (pendenciasAbertas.length > 10) lines.push(`  … e mais ${pendenciasAbertas.length - 10}`);
  }

  if (funcionarios.length > 0) {
    lines.push("", `Funcionários: ${funcionarios.length}`);
    funcionarios.forEach((f) => {
      lines.push(`  • ${f.nomeFuncao}${f.cargo ? ` (${f.cargo})` : ""}${f.dataAdmissao ? ` — admitido em ${f.dataAdmissao}` : ""}`);
    });
  }

  if (manutencoesProximas.length > 0) {
    lines.push("", "Manutenções recorrentes ativas:");
    manutencoesProximas.slice(0, 8).forEach((m) => {
      lines.push(`  • ${m.label} (${m.frequencia})${m.ultimaExecucao ? ` — última: ${m.ultimaExecucao}` : ""}`);
    });
  }

  lines.push("", "═══════════════════════════════════════════════════════");
  lines.push("CHECKLIST DE ENTREGA");
  lines.push("═══════════════════════════════════════════════════════");

  for (const [cat, items] of byCategoria) {
    lines.push("", `▸ ${categoriaLabel[cat]}`);
    for (const item of items) {
      const statusIcon = item.status === "ok" ? "✓" : item.status === "nao_aplicavel" ? "–" : "○";
      lines.push(`  ${statusIcon} ${item.titulo}`);
      if (item.observacao) lines.push(`    Obs: ${item.observacao}`);
    }
  }

  if (state.notes) {
    lines.push("", "═══════════════════════════════════════════════════════");
    lines.push("OBSERVAÇÕES GERAIS DO SÍNDICO ATUAL");
    lines.push("═══════════════════════════════════════════════════════");
    lines.push("", state.notes);
  }

  lines.push(
    "",
    "═══════════════════════════════════════════════════════",
    "Este relatório foi gerado pelo Amigo do Prédio.",
    "Os dados são de responsabilidade do síndico responsável pela gestão.",
    "═══════════════════════════════════════════════════════"
  );

  return lines.join("\n");
}
