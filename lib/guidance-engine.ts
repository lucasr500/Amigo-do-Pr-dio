// Motor de guidance operacional avançado.
// Produz orientações ricas com 4 níveis de prioridade, consequências,
// próximos passos e checklists. Sem IA — 100% determinístico.
//
// Complementa guidance.ts (que foca em urgência de datas) com:
// - Cobertura de docs, funcionários e manutenções
// - 4 níveis: critico | importante | planejamento | melhoria
// - Consequências explícitas (o que acontece se ignorar)
// - Próximo passo concreto por situação
// - Resultado sintetizado (top 3 hoje, top risco, maior lacuna)

import {
  getMemoriaOperacional,
  getMemoriaAssistida,
  getDocumentos,
  getFuncionarios,
  getManutencoes,
  getProfile,
  DOCUMENTO_CRITICIDADE,
  DOCUMENTOS_ESSENCIAIS_IDS,
  type DocumentoEssencialId,
} from "./session";
import { getDecisions } from "./decisions";
import { getHandoffProgress } from "./handoff";
import { getActiveSuppliers } from "./suppliers";
import { desde, past } from "./urgency";
import { temManutencaoCriticaAtrasada } from "./recorrencias";
import { PLAYBOOKS, MICRO_GUIDANCE_BY_CATEGORY } from "./action-library";

export type GuidanceEnginePriority =
  | "critico"     // Ação imediata — risco legal ou financeiro sério
  | "importante"  // Ação este mês — impacto operacional significativo
  | "planejamento"// Planejar nos próximos 90 dias
  | "melhoria";   // Best practice — melhora sem urgência

export type GuidanceEngineItem = {
  id: string;
  icon: string;
  titulo: string;
  categoria: "legal" | "trabalhista" | "operacional" | "gestao" | "documentos";
  prioridade: GuidanceEnginePriority;
  contexto: string;       // Por que isso importa
  consequencia: string;   // O que acontece se ignorar
  proximoPasso: string;   // Ação concreta e específica agora
  checklist: string[];    // Passos ordenados para resolver
  playbookId?: string;    // ID do playbook em action-library
};

export type GuidanceEngineResult = {
  items: GuidanceEngineItem[];
  criticos: GuidanceEngineItem[];
  importantes: GuidanceEngineItem[];
  planejamento: GuidanceEngineItem[];
  melhorias: GuidanceEngineItem[];
  topTresHoje: GuidanceEngineItem[];   // Top 3 para "o que fazer hoje"
  topRisco: GuidanceEngineItem | null; // Maior risco único
  maiorLacuna: GuidanceEngineItem | null; // Maior gap operacional
  maiorMelhoria: GuidanceEngineItem | null; // Melhor ganho de melhoria
  microGuidance: string[];             // Dicas contextuais curtas
};

function toLocalDate(iso: string): Date {
  return iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
}

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = toLocalDate(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - now.getTime()) / 86_400_000);
}

export function buildGuidanceEngine(): GuidanceEngineResult {
  const m          = getMemoriaOperacional();
  const assistida  = getMemoriaAssistida();
  const documentos = getDocumentos();
  const funcs      = getFuncionarios();
  const manutencoes = getManutencoes();
  const profile    = getProfile();
  const decisions  = getDecisions();
  const suppliers  = getActiveSuppliers();
  const handoff    = getHandoffProgress();
  const items: GuidanceEngineItem[] = [];
  const ids = new Set<string>();

  const add = (item: GuidanceEngineItem) => {
    if (!ids.has(item.id)) { ids.add(item.id); items.push(item); }
  };

  // ── AVCB ─────────────────────────────────────────────────────────────────
  const hasAvcb = !!(m.vencimentoAVCB || assistida.avcb?.value);
  if (!hasAvcb) {
    add({
      id: "eng_avcb_missing",
      icon: "📋",
      titulo: "AVCB não cadastrado",
      categoria: "legal",
      prioridade: "importante",
      contexto: "O AVCB atesta que o prédio atende às normas de segurança do Corpo de Bombeiros. Sem esse dado, não é possível monitorar o vencimento.",
      consequencia: "Sem monitoramento, o AVCB pode vencer sem que o síndico perceba — expondo o prédio a autuações.",
      proximoPasso: "Localize o documento na pasta física do condomínio ou com a administradora e registre a data aqui.",
      checklist: PLAYBOOKS.avcb_vencendo.checklist,
      playbookId: "avcb_vencendo",
    });
  } else {
    const d = m.vencimentoAVCB ? daysUntil(m.vencimentoAVCB) : null;
    if (d !== null && d <= 0) {
      add({
        id: "eng_avcb_vencido",
        icon: "📋",
        titulo: d < 0 ? `AVCB vencido há ${Math.abs(d)} dias` : "AVCB vence hoje",
        categoria: "legal",
        prioridade: "critico",
        contexto: PLAYBOOKS.avcb_vencido.contexto,
        consequencia: PLAYBOOKS.avcb_vencido.risco,
        proximoPasso: PLAYBOOKS.avcb_vencido.acaoImediata,
        checklist: PLAYBOOKS.avcb_vencido.checklist,
        playbookId: "avcb_vencido",
      });
    } else if (d !== null && d <= 30) {
      add({
        id: "eng_avcb_vencendo",
        icon: "📋",
        titulo: `AVCB vence em ${d} dia${d !== 1 ? "s" : ""}`,
        categoria: "legal",
        prioridade: d <= 7 ? "critico" : "importante",
        contexto: PLAYBOOKS.avcb_vencendo.contexto,
        consequencia: PLAYBOOKS.avcb_vencendo.risco,
        proximoPasso: PLAYBOOKS.avcb_vencendo.acaoImediata,
        checklist: PLAYBOOKS.avcb_vencendo.checklist,
        playbookId: "avcb_vencendo",
      });
    } else if (d !== null && d <= 60) {
      add({
        id: "eng_avcb_planejamento",
        icon: "📋",
        titulo: `AVCB vence em ${d} dias — planejar renovação`,
        categoria: "legal",
        prioridade: "planejamento",
        contexto: "O processo de renovação do AVCB exige antecedência — vistoria e tramitação burocrática podem demorar.",
        consequencia: "Iniciar tarde demais pode resultar em vencimento antes da renovação.",
        proximoPasso: "Agende agora a vistoria de renovação para garantir tempo suficiente.",
        checklist: PLAYBOOKS.avcb_vencendo.checklist,
        playbookId: "avcb_vencendo",
      });
    }
  }

  // ── Seguro condominial ────────────────────────────────────────────────────
  const hasSeguro = !!(m.vencimentoSeguro || assistida.seguro?.value);
  if (!hasSeguro) {
    add({
      id: "eng_seguro_missing",
      icon: "🛡️",
      titulo: "Seguro condominial não cadastrado",
      categoria: "legal",
      prioridade: "importante",
      contexto: "O seguro cobre eventos como incêndio e explosão. Sem a data cadastrada, não é possível monitorar o vencimento.",
      consequencia: "Seguro vencido sem que o síndico perceba deixa o condomínio sem cobertura — risco real em caso de sinistro.",
      proximoPasso: "Localize a apólice atual com a administradora ou corretora e registre a data de vencimento.",
      checklist: PLAYBOOKS.seguro_vencendo.checklist,
      playbookId: "seguro_vencendo",
    });
  } else {
    const d = m.vencimentoSeguro ? daysUntil(m.vencimentoSeguro) : null;
    if (d !== null && d <= 0) {
      add({
        id: "eng_seguro_vencido",
        icon: "🛡️",
        titulo: d < 0 ? `Seguro vencido há ${Math.abs(d)} dias` : "Seguro vence hoje",
        categoria: "legal",
        prioridade: "critico",
        contexto: PLAYBOOKS.seguro_vencido.contexto,
        consequencia: PLAYBOOKS.seguro_vencido.risco,
        proximoPasso: PLAYBOOKS.seguro_vencido.acaoImediata,
        checklist: PLAYBOOKS.seguro_vencido.checklist,
        playbookId: "seguro_vencido",
      });
    } else if (d !== null && d <= 30) {
      add({
        id: "eng_seguro_vencendo",
        icon: "🛡️",
        titulo: `Seguro vence em ${d} dia${d !== 1 ? "s" : ""}`,
        categoria: "legal",
        prioridade: d <= 7 ? "critico" : "importante",
        contexto: PLAYBOOKS.seguro_vencendo.contexto,
        consequencia: PLAYBOOKS.seguro_vencendo.risco,
        proximoPasso: PLAYBOOKS.seguro_vencendo.acaoImediata,
        checklist: PLAYBOOKS.seguro_vencendo.checklist,
        playbookId: "seguro_vencendo",
      });
    } else if (d !== null && d <= 60) {
      add({
        id: "eng_seguro_planejamento",
        icon: "🛡️",
        titulo: `Seguro vence em ${d} dias — avaliar renovação`,
        categoria: "legal",
        prioridade: "planejamento",
        contexto: "É o momento de avaliar a apólice atual antes de renovar automaticamente.",
        consequencia: "Renovação automática sem análise pode manter cobertura inadequada.",
        proximoPasso: "Solicite a proposta de renovação à corretora e verifique o valor segurado.",
        checklist: PLAYBOOKS.seguro_vencendo.checklist,
        playbookId: "seguro_vencendo",
      });
    }
  }

  // ── Mandato do síndico ────────────────────────────────────────────────────
  const hasMandato = !!(m.fimMandatoSindico || assistida.mandato?.value);
  if (!hasMandato) {
    add({
      id: "eng_mandato_missing",
      icon: "🗳️",
      titulo: "Data do mandato não cadastrada",
      categoria: "gestao",
      prioridade: "planejamento",
      contexto: "Sem a data de fim do mandato, não é possível monitorar quando convocar a assembleia de renovação.",
      consequencia: "Mandato vencido sem perceber gera incerteza sobre a representação do condomínio.",
      proximoPasso: "Verifique a ata de eleição do síndico e registre a data de fim do mandato.",
      checklist: ["Localizar a ata de eleição do síndico", "Identificar a data de fim do mandato", "Registrar no app"],
      playbookId: "mandato_vencendo",
    });
  } else {
    const d = m.fimMandatoSindico ? daysUntil(m.fimMandatoSindico) : null;
    if (d !== null && d <= 0) {
      add({
        id: "eng_mandato_vencido",
        icon: "🗳️",
        titulo: "Mandato do síndico vencido",
        categoria: "gestao",
        prioridade: "critico",
        contexto: PLAYBOOKS.mandato_vencido.contexto,
        consequencia: PLAYBOOKS.mandato_vencido.risco,
        proximoPasso: PLAYBOOKS.mandato_vencido.acaoImediata,
        checklist: PLAYBOOKS.mandato_vencido.checklist,
        playbookId: "mandato_vencido",
      });
    } else if (d !== null && d <= 60) {
      add({
        id: "eng_mandato_vencendo",
        icon: "🗳️",
        titulo: `Mandato vence em ${d} dias — planejar assembleia`,
        categoria: "gestao",
        prioridade: d <= 30 ? "importante" : "planejamento",
        contexto: PLAYBOOKS.mandato_vencendo.contexto,
        consequencia: PLAYBOOKS.mandato_vencendo.risco,
        proximoPasso: PLAYBOOKS.mandato_vencendo.acaoImediata,
        checklist: PLAYBOOKS.mandato_vencendo.checklist,
        playbookId: "mandato_vencendo",
      });
    }
  }

  // ── AGO ───────────────────────────────────────────────────────────────────
  if (m.ultimaAGO && past(m.ultimaAGO)) {
    const meses = Math.floor(desde(m.ultimaAGO) / 30);
    if (meses >= 14) {
      add({
        id: "eng_ago_atrasada",
        icon: "👥",
        titulo: `AGO atrasada — ${meses} meses sem assembleia ordinária`,
        categoria: "gestao",
        prioridade: "critico",
        contexto: PLAYBOOKS.ago_atrasada.contexto,
        consequencia: PLAYBOOKS.ago_atrasada.risco,
        proximoPasso: PLAYBOOKS.ago_atrasada.acaoImediata,
        checklist: PLAYBOOKS.ago_atrasada.checklist,
        playbookId: "ago_atrasada",
      });
    } else if (meses >= 10) {
      add({
        id: "eng_ago_proxima",
        icon: "👥",
        titulo: `Planejar próxima AGO — realizada há ${meses} meses`,
        categoria: "gestao",
        prioridade: "planejamento",
        contexto: "Com 10 meses desde a última AGO, já é hora de começar o planejamento da próxima.",
        consequencia: "Deixar para a última hora dificulta a organização de pauta e documentação.",
        proximoPasso: "Defina uma data provável e reserve na agenda para o planejamento da convocação.",
        checklist: PLAYBOOKS.ago_atrasada.checklist,
        playbookId: "ago_atrasada",
      });
    }
  }

  // ── Funcionários / férias ─────────────────────────────────────────────────
  const funcsVencidas = funcs.filter((f) => f.status === "vencida");
  const funcsDesc     = funcs.filter((f) => f.status === "desconhecida");

  if (funcsVencidas.length > 0) {
    add({
      id: "eng_ferias_vencidas",
      icon: "👷",
      titulo: `${funcsVencidas.length} funcionário${funcsVencidas.length > 1 ? "s" : ""} com férias vencidas`,
      categoria: "trabalhista",
      prioridade: "critico",
      contexto: PLAYBOOKS.funcionario_ferias_vencidas.contexto,
      consequencia: PLAYBOOKS.funcionario_ferias_vencidas.risco,
      proximoPasso: PLAYBOOKS.funcionario_ferias_vencidas.acaoImediata,
      checklist: PLAYBOOKS.funcionario_ferias_vencidas.checklist,
      playbookId: "funcionario_ferias_vencidas",
    });
  } else if (funcsDesc.length > 0) {
    add({
      id: "eng_ferias_desconhecida",
      icon: "👷",
      titulo: `Situação de férias desconhecida (${funcsDesc.length} funcionário${funcsDesc.length > 1 ? "s" : ""})`,
      categoria: "trabalhista",
      prioridade: "importante",
      contexto: "Sem informação sobre o histórico de férias, não é possível saber se há risco trabalhista acumulado.",
      consequencia: "Férias vencidas não identificadas acumulam passivo trabalhista silencioso.",
      proximoPasso: "Consulte a contabilidade ou departamento pessoal sobre a situação de férias de cada funcionário.",
      checklist: [
        "Consultar contabilidade sobre período aquisitivo de cada funcionário",
        "Verificar se há férias vencidas ou a vencer nos próximos 60 dias",
        "Atualizar status de cada funcionário no app",
      ],
      playbookId: "funcionario_ferias_vencidas",
    });
  } else if (funcs.length === 0) {
    add({
      id: "eng_funcionarios_missing",
      icon: "👷",
      titulo: "Funcionários não registrados",
      categoria: "trabalhista",
      prioridade: "planejamento",
      contexto: "Sem registro dos funcionários, não é possível monitorar riscos trabalhistas automaticamente.",
      consequencia: "Férias vencidas podem se acumular sem detecção, gerando passivo silencioso.",
      proximoPasso: "Acesse a seção de Funcionários e cadastre cada colaborador com data de admissão.",
      checklist: [
        "Listar todos os funcionários com vínculo empregatício no condomínio",
        "Cadastrar cada um com nome, função e data de admissão",
        "Registrar data da última fruição de férias",
      ],
    });
  }

  // ── Documentos essenciais ─────────────────────────────────────────────────
  const docRegistrados = documentos.length;
  const docsCriticos = DOCUMENTOS_ESSENCIAIS_IDS.filter(
    (id) => DOCUMENTO_CRITICIDADE[id as DocumentoEssencialId] === "critica"
  );
  const docsCriticosNaoConfirmados = docsCriticos.filter((id) => {
    const doc = documentos.find((d) => d.id === id);
    return !doc || doc.status === "nao_tenho";
  });

  if (docRegistrados === 0) {
    add({
      id: "eng_docs_nao_mapeados",
      icon: "📁",
      titulo: "Documentos essenciais não mapeados",
      categoria: "documentos",
      prioridade: "planejamento",
      contexto: "Convenção, AVCB, seguro, laudos técnicos e contratos são exigidos em diversas situações operacionais.",
      consequencia: "Sem mapeamento, não é possível saber o que falta — até uma situação urgente revelar a ausência.",
      proximoPasso: "Abra o painel de Documentos e registre o status de cada um conforme você for verificando.",
      checklist: PLAYBOOKS.documento_critico_ausente.checklist,
      playbookId: "documento_critico_ausente",
    });
  } else if (docsCriticosNaoConfirmados.length >= 2) {
    add({
      id: "eng_docs_criticos_ausentes",
      icon: "📁",
      titulo: `${docsCriticosNaoConfirmados.length} documentos críticos sem confirmação`,
      categoria: "documentos",
      prioridade: "importante",
      contexto: PLAYBOOKS.documento_critico_ausente.contexto,
      consequencia: PLAYBOOKS.documento_critico_ausente.risco,
      proximoPasso: PLAYBOOKS.documento_critico_ausente.acaoImediata,
      checklist: PLAYBOOKS.documento_critico_ausente.checklist,
      playbookId: "documento_critico_ausente",
    });
  }

  // ── Manutenções recorrentes ───────────────────────────────────────────────
  if (manutencoes.length > 0) {
    if (temManutencaoCriticaAtrasada()) {
      add({
        id: "eng_manut_critica_atrasada",
        icon: "🔧",
        titulo: "Manutenção crítica com prazo vencido",
        categoria: "operacional",
        prioridade: "importante",
        contexto: PLAYBOOKS.manutencoes_atrasadas.contexto,
        consequencia: PLAYBOOKS.manutencoes_atrasadas.risco,
        proximoPasso: PLAYBOOKS.manutencoes_atrasadas.acaoImediata,
        checklist: PLAYBOOKS.manutencoes_atrasadas.checklist,
        playbookId: "manutencoes_atrasadas",
      });
    }
  } else {
    add({
      id: "eng_manut_nao_cadastradas",
      icon: "🔧",
      titulo: "Manutenções recorrentes não cadastradas",
      categoria: "operacional",
      prioridade: "melhoria",
      contexto: "Registrar manutenções recorrentes ativa o calendário operacional anual e o monitoramento de prazos.",
      consequencia: "Sem registro, manutenções podem ser esquecidas — aumentando o custo de reparos corretivos.",
      proximoPasso: "Abra o painel de Manutenções e cadastre as recorrências do prédio.",
      checklist: [
        "Verificar quais manutenções são contratadas atualmente",
        "Cadastrar cada manutenção com frequência e última execução",
        "Confirmar com fornecedores a data da última visita",
      ],
    });
  }

  // Elevador sem manutenção (profile-aware)
  if (profile?.hasElevador) {
    const manutElev = manutencoes.find((x) => x.id === "manut_elevador" && x.ativo && x.ultimaExecucao);
    const legacyElev = m.ultimaManutencaoElevador;
    if (!manutElev && !legacyElev) {
      add({
        id: "eng_elevador_sem_manut",
        icon: "🛗",
        titulo: "Elevador sem manutenção registrada",
        categoria: "operacional",
        prioridade: "importante",
        contexto: PLAYBOOKS.elevador_sem_manutencao.contexto,
        consequencia: PLAYBOOKS.elevador_sem_manutencao.risco,
        proximoPasso: PLAYBOOKS.elevador_sem_manutencao.acaoImediata,
        checklist: PLAYBOOKS.elevador_sem_manutencao.checklist,
        playbookId: "elevador_sem_manutencao",
      });
    }

    const hasElevatorSupplier = suppliers.some((s) => s.category === "elevador" && s.active);
    if (!hasElevatorSupplier) {
      add({
        id: "eng_elevador_fornecedor_ausente",
        icon: "🛗",
        titulo: "Fornecedor de elevador não cadastrado",
        categoria: "operacional",
        prioridade: "importante",
        contexto: "O prédio informa possuir elevador, mas não há fornecedor ativo de elevador cadastrado.",
        consequencia: "Sem esse contato estruturado, emergências e manutenções podem depender de buscas improvisadas.",
        proximoPasso: "Cadastrar o fornecedor responsável pela manutenção do elevador.",
        checklist: [
          "Confirmar a empresa responsável pela manutenção",
          "Cadastrar contato, responsável e contrato do fornecedor",
          "Registrar a próxima manutenção prevista",
        ],
      });
    }
  }

  // ── Handoff crítico ───────────────────────────────────────────────────────
  const mandatoDate = m.fimMandatoSindico || assistida.mandato?.value;
  const mandatoDays = daysUntil(mandatoDate);
  if (mandatoDays !== null && mandatoDays >= 0 && mandatoDays < 90 && handoff.pct < 30) {
    add({
      id: "eng_handoff_critico",
      icon: "🔁",
      titulo: "Passagem de mandato está incompleta",
      categoria: "gestao",
      prioridade: "critico",
      contexto: "O mandato se aproxima do fim e o checklist de transição ainda está abaixo de 30%.",
      consequencia: "Isso pode dificultar a continuidade da gestão e a entrega organizada do histórico do condomínio.",
      proximoPasso: "Revisar o checklist de passagem de mandato e concluir os itens essenciais.",
      checklist: [
        "Conferir documentos essenciais",
        "Atualizar fornecedores ativos",
        "Revisar pendências abertas",
        "Registrar decisões recentes",
        "Exportar backup atualizado",
      ],
    });
  }

  // ── Decisões sem acompanhamento ───────────────────────────────────────────
  const staleDecision = decisions.find((decision) => {
    if (decision.linkedPendenciaId) return false;
    if (!decision.nextStep && decision.status !== "registrada" && decision.status !== "em_execucao") return false;
    const reference = decision.updatedAt || decision.createdAt;
    const ageDays = desde(reference);
    return Number.isFinite(ageDays) && ageDays > 30;
  });
  if (staleDecision) {
    add({
      id: "eng_decisao_sem_acompanhamento",
      icon: "🧭",
      titulo: "Decisão sem acompanhamento",
      categoria: "gestao",
      prioridade: "importante",
      contexto: "Há decisão registrada sem pendência vinculada ou acompanhamento recente.",
      consequencia: "Decisões sem próximo passo tendem a se perder na rotina do condomínio.",
      proximoPasso: "Criar ou vincular uma pendência para acompanhar a execução da decisão.",
      checklist: [
        "Revisar a decisão registrada",
        "Confirmar o próximo passo operacional",
        "Criar ou vincular uma pendência",
        "Atualizar o status da decisão",
      ],
    });
  }

  // ── Melhorias (melhoria) ──────────────────────────────────────────────────
  const docTenho = documentos.filter((d) => d.status === "tenho").length;
  const docAplicaveis = Math.max(1, docRegistrados - documentos.filter((d) => d.status === "nao_se_aplica").length);
  if (docRegistrados > 0 && docTenho / docAplicaveis < 0.5) {
    add({
      id: "eng_docs_melhoria",
      icon: "📁",
      titulo: "Aumentar cobertura documental",
      categoria: "documentos",
      prioridade: "melhoria",
      contexto: "Menos de 50% dos documentos mapeados estão confirmados. Aumentar a cobertura melhora a prontidão operacional.",
      consequencia: "Documentos não localizados são descobertos em situações urgentes — o pior momento.",
      proximoPasso: "Revise os documentos com status 'Não tenho' e tente localizá-los com a administradora.",
      checklist: PLAYBOOKS.documento_critico_ausente.checklist,
      playbookId: "documento_critico_ausente",
    });
  }

  // ── Ordenação e agrupamento ───────────────────────────────────────────────
  const PRIORITY_ORDER: Record<GuidanceEnginePriority, number> = {
    critico: 0, importante: 1, planejamento: 2, melhoria: 3,
  };
  items.sort((a, b) => PRIORITY_ORDER[a.prioridade] - PRIORITY_ORDER[b.prioridade]);

  const criticos     = items.filter((i) => i.prioridade === "critico");
  const importantes  = items.filter((i) => i.prioridade === "importante");
  const planejamentoItems = items.filter((i) => i.prioridade === "planejamento");
  const melhorias    = items.filter((i) => i.prioridade === "melhoria");

  const topTresHoje = [...criticos, ...importantes].slice(0, 3);
  const topRisco = criticos[0] ?? importantes.find((i) => i.categoria === "legal" || i.categoria === "trabalhista") ?? null;

  const lacunasCandidatas = items.filter((i) =>
    i.id.includes("missing") || i.id.includes("nao_mapeados") || i.id.includes("nao_cadastradas")
  );
  const maiorLacuna = lacunasCandidatas[0] ?? planejamentoItems[0] ?? null;

  const maiorMelhoria = melhorias[0] ?? null;

  // ── Micro-guidance contextual ─────────────────────────────────────────────
  const microGuidance: string[] = [];
  const pick = (arr: string[]): string => arr[Math.floor(Date.now() / 86_400_000) % arr.length];

  if (documentos.length > 0 && docTenho > 0)
    microGuidance.push(pick(MICRO_GUIDANCE_BY_CATEGORY.documentos));
  if (funcs.length > 0 && funcs.some((f) => f.status === "em_dia"))
    microGuidance.push(pick(MICRO_GUIDANCE_BY_CATEGORY.funcionarios));
  if (manutencoes.length > 0)
    microGuidance.push(pick(MICRO_GUIDANCE_BY_CATEGORY.manutencoes));
  if (microGuidance.length === 0)
    microGuidance.push(pick(MICRO_GUIDANCE_BY_CATEGORY.operacional));

  return {
    items,
    criticos,
    importantes,
    planejamento: planejamentoItems,
    melhorias,
    topTresHoje,
    topRisco,
    maiorLacuna,
    maiorMelhoria,
    microGuidance,
  };
}
