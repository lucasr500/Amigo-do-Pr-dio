// Motor de guidance operacional — regras determinísticas que orientam o síndico.
// Transforma estado da memória operacional em orientações humanas, contextualizadas
// e priorizadas. Sem IA — todo o raciocínio é baseado em thresholds e contexto editorial.

import { MemoriaOperacional, CondominioProfile } from "./session";
import { ate, desde, past } from "./urgency";

export type GuidancePriority = "critico" | "atencao";

export type ResolveAction = {
  field: keyof MemoriaOperacional;
  type: "done" | "expiry";
  buttonLabel: string;
  successMessage: string;
};

export type GuidanceItem = {
  id: string;
  icon: string;
  label: string;
  urgencyLabel: string;
  context: string;
  howLong?: string;
  askQ: string;
  priority: GuidancePriority;
  resolveAction: ResolveAction;
  // Orientação operacional — adicionados para explicações inteligentes
  consequencia?: string;  // O que acontece se ignorar
  proximoPasso?: string;  // Ação concreta e específica agora
  checklist?: string[];   // Passos ordenados para resolver
};

const ROTINA_DISCLAIMER =
  "As periodicidades são referências operacionais. Confirme contratos, normas locais e orientações técnicas aplicáveis.";

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildGuidanceItems(
  m: MemoriaOperacional,
  profile: CondominioProfile | null
): GuidanceItem[] {
  const items: GuidanceItem[] = [];

  // AVCB — Auto de Vistoria do Corpo de Bombeiros
  if (m.vencimentoAVCB) {
    const d = ate(m.vencimentoAVCB);
    if (d < 0) {
      items.push({
        id: "avcb-vencido",
        icon: "📋",
        label: "AVCB",
        urgencyLabel: "Documento vencido — regularize agora",
        context:
          "O AVCB é exigido pelo Corpo de Bombeiros para o funcionamento regular do condomínio. Vencido, o prédio fica sujeito a autuações, multas e pode ser interditado em vistoria — responsabilidade direta do síndico.",
        howLong: "O processo de renovação leva em média 30 a 60 dias.",
        askQ: "Como renovar o AVCB do condomínio?",
        priority: "critico",
        resolveAction: { field: "vencimentoAVCB", type: "expiry", buttonLabel: "Registrar renovação do AVCB", successMessage: "AVCB atualizado" },
        consequencia: "Com AVCB vencido, qualquer vistoria do Corpo de Bombeiros pode resultar em autuação ou interdição do prédio.",
        proximoPasso: "Ligue hoje para a empresa que fez o último AVCB e solicite agendamento de vistoria de renovação.",
        checklist: ["Localizar o AVCB anterior", "Contatar prestadora de proteção contra incêndio", "Verificar adequações necessárias", "Protocolar renovação no Corpo de Bombeiros", "Registrar nova data no app"],
      });
    } else if (d === 0) {
      items.push({
        id: "avcb-hoje",
        icon: "📋",
        label: "AVCB",
        urgencyLabel: "Vence hoje — providencie agora",
        context:
          "O AVCB vence hoje. Protocole imediatamente o pedido de renovação junto ao Corpo de Bombeiros para evitar que o documento fique irregular.",
        howLong: "O processo de renovação leva em média 30 a 60 dias — inicie hoje.",
        askQ: "Como renovar o AVCB do condomínio?",
        priority: "critico",
        resolveAction: { field: "vencimentoAVCB", type: "expiry", buttonLabel: "Registrar nova data do AVCB", successMessage: "AVCB atualizado" },
        consequencia: "A partir de amanhã o AVCB estará vencido — o prédio ficará em situação irregular junto ao Corpo de Bombeiros.",
        proximoPasso: "Contate agora a empresa de proteção contra incêndio para protocolar a renovação.",
        checklist: ["Contatar prestadora de proteção contra incêndio", "Protocolar renovação no Corpo de Bombeiros", "Registrar nova data no app"],
      });
    } else if (d <= 7) {
      items.push({
        id: "avcb-urgente",
        icon: "📋",
        label: "AVCB",
        urgencyLabel: `Vence em ${d} dia${d !== 1 ? "s" : ""} — inicie o processo agora`,
        context:
          "Com menos de 7 dias, é essencial protocolar o pedido de renovação imediatamente. O processo inclui vistoria do Corpo de Bombeiros e pode demorar mais do que o prazo restante.",
        howLong: "Protocole o pedido hoje para evitar o vencimento.",
        askQ: "Como renovar o AVCB do condomínio?",
        priority: "critico",
        resolveAction: { field: "vencimentoAVCB", type: "expiry", buttonLabel: "Registrar nova data do AVCB", successMessage: "AVCB atualizado" },
        consequencia: "Com apenas ${d} dias, o processo de renovação (30–60 dias) provavelmente não terminará a tempo — o documento ficará vencido.",
        proximoPasso: "Protocole o pedido de renovação junto ao Corpo de Bombeiros hoje mesmo.",
        checklist: ["Contatar prestadora de proteção contra incêndio", "Protocolar renovação no Corpo de Bombeiros", "Registrar nova data ao receber o documento"],
      });
    } else if (d <= 30) {
      items.push({
        id: "avcb-iminente",
        icon: "📋",
        label: "AVCB",
        urgencyLabel: `Vence em ${d} dias — inicie o processo agora`,
        context:
          "Com menos de 30 dias, já é o momento de protocolar o pedido de renovação. O processo inclui vistoria do Corpo de Bombeiros e pode demorar mais do que o prazo restante.",
        howLong: "Protocole o pedido esta semana para evitar o vencimento.",
        askQ: "Como renovar o AVCB do condomínio?",
        priority: "critico",
        resolveAction: { field: "vencimentoAVCB", type: "expiry", buttonLabel: "Registrar nova data do AVCB", successMessage: "AVCB atualizado" },
        consequencia: "Se não iniciar o processo esta semana, o AVCB pode vencer antes da renovação ser concluída.",
        proximoPasso: "Agende a vistoria de renovação com a prestadora de proteção contra incêndio esta semana.",
        checklist: ["Contatar prestadora para agendar vistoria", "Verificar adequações necessárias", "Protocolar no Corpo de Bombeiros", "Registrar nova data ao receber"],
      });
    } else if (d <= 60) {
      items.push({
        id: "avcb-breve",
        icon: "📋",
        label: "AVCB",
        urgencyLabel: `Vence em ${d} dias — planeje a renovação`,
        context:
          "Ainda há tempo, mas o processo de renovação do AVCB envolve vistoria e tramitação burocrática. Iniciar cedo evita correria e risco de vencimento.",
        askQ: "Como renovar o AVCB do condomínio?",
        priority: "atencao",
        resolveAction: { field: "vencimentoAVCB", type: "expiry", buttonLabel: "Registrar nova data do AVCB", successMessage: "AVCB atualizado" },
        consequencia: "Deixar para mais perto pode não dar tempo para o processo de renovação completo.",
        proximoPasso: "Contate a prestadora de proteção contra incêndio para verificar disponibilidade e agendar.",
        checklist: ["Contatar prestadora para verificar disponibilidade", "Agendar vistoria de renovação", "Registrar nova data ao receber o documento"],
      });
    } else if (d <= 90) {
      items.push({
        id: "avcb-atencao",
        icon: "📋",
        label: "AVCB",
        urgencyLabel: `Vence em ${d} dias — acompanhe o prazo`,
        context:
          "O AVCB ainda está dentro do prazo. Anote na agenda para iniciar o processo de renovação em breve — o trâmite burocrático exige antecedência.",
        askQ: "Como renovar o AVCB do condomínio?",
        priority: "atencao",
        resolveAction: { field: "vencimentoAVCB", type: "expiry", buttonLabel: "Registrar nova data do AVCB", successMessage: "AVCB atualizado" },
        consequencia: "O prazo ainda é confortável — mas o processo de renovação leva 30 a 60 dias, então não deixe para a última hora.",
        proximoPasso: "Anote na agenda para iniciar o processo de renovação em cerca de 30 dias.",
        checklist: ["Anote para contatar a prestadora daqui a 30 dias", "Verificar se há adequações técnicas necessárias antes da vistoria"],
      });
    }
  }

  // Seguro condominial
  if (m.vencimentoSeguro) {
    const d = ate(m.vencimentoSeguro);
    if (d < 0) {
      items.push({
        id: "seguro-vencido",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: "Seguro vencido — renovação urgente",
        context:
          "O seguro condominial cobre eventos como incêndio, raio e explosão — obrigatório para todos os condomínios. Sem cobertura ativa, qualquer sinistro recai integralmente sobre o condomínio.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar renovação do seguro", successMessage: "Seguro renovado" },
        consequencia: "Um incêndio ou explosão enquanto o seguro está vencido pode gerar prejuízo total ao condomínio e responsabilidade pessoal do síndico.",
        proximoPasso: "Contate hoje a corretora ou seguradora responsável pela apólice atual para iniciar a renovação.",
        checklist: ["Localizar a apólice atual ou contato da corretora", "Solicitar proposta de renovação", "Verificar valor segurado vs. custo de reposição", "Contratar renovação e arquivar nova apólice", "Registrar nova data no app"],
      });
    } else if (d === 0) {
      items.push({
        id: "seguro-hoje",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: "Renova hoje — providencie agora",
        context:
          "O seguro condominial vence hoje. Providencie a renovação imediatamente para que o condomínio não fique sem cobertura.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
        consequencia: "A partir de amanhã o condomínio estará sem cobertura de seguro — qualquer sinistro gerará prejuízo direto.",
        proximoPasso: "Contate agora a corretora ou seguradora para renovar a apólice hoje.",
        checklist: ["Contatar corretora para renovação imediata", "Confirmar cobertura e pagamento", "Registrar nova data no app"],
      });
    } else if (d <= 7) {
      items.push({
        id: "seguro-urgente",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dia${d !== 1 ? "s" : ""} — providencie agora`,
        context:
          "Com menos de 7 dias para o vencimento, providencie a renovação hoje. O seguro cobre incêndio, raio e explosão.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
        consequencia: "Com ${d} dias, qualquer atraso pode deixar o condomínio sem cobertura de seguro.",
        proximoPasso: "Contate a corretora ainda hoje para garantir a renovação antes do vencimento.",
        checklist: ["Contatar corretora para renovação urgente", "Confirmar cobertura e pagamento", "Registrar nova data no app"],
      });
    } else if (d <= 30) {
      items.push({
        id: "seguro-iminente",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dias — providencie agora`,
        context:
          "Providencie a renovação antes do vencimento. O seguro cobre incêndio, raio e explosão.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
        consequencia: "Se não renovar esta semana, o seguro pode vencer antes de tudo estar confirmado.",
        proximoPasso: "Solicite a proposta de renovação à corretora esta semana.",
        checklist: ["Solicitar proposta de renovação à corretora", "Verificar condições e valor segurado", "Contratar e registrar nova data no app"],
      });
    } else if (d <= 60) {
      items.push({
        id: "seguro-breve",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dias — planeje a renovação`,
        context:
          "Ainda há tempo para renovar o seguro com tranquilidade. Verifique as condições da apólice atual e, se necessário, obtenha cotações comparativas.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "atencao",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
        consequencia: "Renovação automática sem análise pode manter cobertura inadequada ou valor segurado defasado.",
        proximoPasso: "Solicite à corretora a proposta de renovação com condições atualizadas.",
        checklist: ["Solicitar proposta de renovação à corretora", "Comparar cobertura e valor segurado", "Contratar e registrar nova data no app"],
      });
    } else if (d <= 90) {
      items.push({
        id: "seguro-atencao",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dias — acompanhe o prazo`,
        context:
          "O seguro está dentro do prazo. Comece a avaliar as condições da renovação com antecedência.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "atencao",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
        consequencia: "O prazo ainda é confortável — mas convém não deixar a renovação para a última semana.",
        proximoPasso: "Anote na agenda para contatar a corretora daqui a 30 dias.",
        checklist: ["Anote para acionar a corretora em 30 dias", "Verificar valor segurado atual vs. custo de reposição"],
      });
    }
  }

  // AGO — Assembleia Geral Ordinária
  if (m.ultimaAGO && past(m.ultimaAGO)) {
    const meses = Math.floor(desde(m.ultimaAGO) / 30);
    if (meses >= 14) {
      items.push({
        id: "ago-atrasada",
        icon: "👥",
        label: "Assembleia Ordinária (AGO)",
        urgencyLabel: `Não realizada há ${meses} meses — convocação necessária`,
        context:
          "A AGO é obrigatória ao menos uma vez por ano para aprovação das contas e deliberação sobre assuntos gerais do condomínio.",
        howLong: "A convocação deve ser enviada com no mínimo 10 dias de antecedência.",
        consequencia: "AGO não realizada pode invalidar aprovações de contas e gerar questionamentos sobre decisões tomadas no período.",
        proximoPasso: "Defina uma data para a AGO e inicie o processo de convocação esta semana.",
        checklist: ["Definir data e pauta", "Organizar prestação de contas", "Enviar convocação", "Realizar e lavrar ata", "Registrar data no app"],
        askQ: "Como convocar uma assembleia?",
        priority: "critico",
        resolveAction: { field: "ultimaAGO", type: "done", buttonLabel: "AGO realizada", successMessage: "AGO registrada" },
      });
    } else if (meses >= 10) {
      items.push({
        id: "ago-proxima",
        icon: "👥",
        label: "Assembleia Ordinária (AGO)",
        urgencyLabel: `Realizada há ${meses} meses — planeje a próxima`,
        context:
          "Com 10 meses desde a última AGO, já é hora de começar o planejamento. Pautas, convocações e aprovação de prestação de contas exigem organização prévia.",
        askQ: "Como convocar uma assembleia?",
        priority: "atencao",
        resolveAction: { field: "ultimaAGO", type: "done", buttonLabel: "Registrar nova AGO", successMessage: "AGO registrada" },
        consequencia: "Deixar para a última hora dificulta a organização de pauta, documentação e convocação adequada.",
        proximoPasso: "Reserve uma data no calendário e comece a organizar a prestação de contas.",
        checklist: ["Definir data provável", "Organizar documentação contábil", "Preparar pauta", "Enviar convocação"],
      });
    }
  }

  // Dedetização
  if (m.ultimaDedetizacao && past(m.ultimaDedetizacao)) {
    const ds = desde(m.ultimaDedetizacao);
    if (ds > 180) {
      items.push({
        id: "dedet-atrasada",
        icon: "🐛",
        label: "Dedetização",
        urgencyLabel: `Última há ${ds} dias — verificar se realizada`,
        context:
          `A dedetização semestral das áreas comuns, garagem e tubulações previne infestações. Com mais de 6 meses sem registro, vale confirmar se o serviço foi realizado. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser feita a dedetização do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaDedetizacao", type: "done", buttonLabel: "Dedetização realizada", successMessage: "Dedetização registrada" },
        consequencia: "Infestações de pragas nas áreas comuns geram reclamações e podem comprometer a saúde dos moradores.",
        proximoPasso: "Confirme com a administradora ou prestador se a dedetização foi realizada e, se não, agende.",
        checklist: ["Verificar com administradora se o serviço foi feito", "Se não: contatar prestador para agendamento", "Realizar e registrar data no app"],
      });
    } else if (ds > 150) {
      items.push({
        id: "dedet-atencao",
        icon: "🐛",
        label: "Dedetização",
        urgencyLabel: "Prazo semestral se aproximando",
        context:
          `Programe a dedetização das áreas comuns. A referência operacional é semestral — com mais de 150 dias já vale agendar ou confirmar a próxima visita. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser feita a dedetização do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaDedetizacao", type: "done", buttonLabel: "Dedetização realizada", successMessage: "Dedetização registrada" },
        consequencia: "Deixar passar o prazo pode levar a infestações nas áreas comuns e reclamações de moradores.",
        proximoPasso: "Contate o prestador de dedetização para verificar disponibilidade e agendar a visita.",
        checklist: ["Contatar prestador para agendar", "Confirmar acesso às áreas comuns", "Registrar data no app após realização"],
      });
    }
  }

  // Limpeza da caixa d'água
  if (m.ultimaLimpezaCaixaDAgua && past(m.ultimaLimpezaCaixaDAgua)) {
    const ds = desde(m.ultimaLimpezaCaixaDAgua);
    if (ds > 180) {
      items.push({
        id: "caixa-atrasada",
        icon: "💧",
        label: "Limpeza da caixa d'água",
        urgencyLabel: `Última há ${ds} dias — verificar se realizada`,
        context:
          `A limpeza semestral da caixa d'água é uma referência operacional importante para manter a qualidade da água. Como o registro passou de 6 meses, vale verificar se o serviço já foi realizado e documentado. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser limpa a caixa d'água do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaLimpezaCaixaDAgua", type: "done", buttonLabel: "Limpeza realizada", successMessage: "Limpeza registrada" },
        consequencia: "Caixa d'água sem limpeza periódica pode acumular sedimentos e comprometer a qualidade da água dos moradores.",
        proximoPasso: "Confirme com a administradora se o serviço foi realizado ou contrate prestador especializado.",
        checklist: ["Verificar se serviço foi feito e não registrado", "Se não: contatar empresa de limpeza", "Realizar e registrar data no app"],
      });
    } else if (ds > 150) {
      items.push({
        id: "caixa-atencao",
        icon: "💧",
        label: "Limpeza da caixa d'água",
        urgencyLabel: "Prazo semestral se aproximando",
        context:
          `Programe a limpeza da caixa d'água antes de completar 6 meses ou confirme se já há serviço agendado. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser limpa a caixa d'água do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaLimpezaCaixaDAgua", type: "done", buttonLabel: "Limpeza realizada", successMessage: "Limpeza registrada" },
        consequencia: "Ultrapassar 6 meses sem limpeza pode gerar reclamações sobre qualidade da água.",
        proximoPasso: "Contate o prestador para agendar a limpeza antes de completar o semestre.",
        checklist: ["Contatar empresa de limpeza de caixas", "Agendar visita com antecedência", "Registrar data no app após conclusão"],
      });
    }
  }

  // Manutenção do elevador
  if (m.ultimaManutencaoElevador && profile?.hasElevador && past(m.ultimaManutencaoElevador)) {
    const ds = desde(m.ultimaManutencaoElevador);
    if (ds > 45) {
      items.push({
        id: "elevador-atrasado",
        icon: "🛗",
        label: "Manutenção do elevador",
        urgencyLabel: `${ds} dias sem registro — confirmar com a prestadora`,
        context:
          `A manutenção mensal do elevador costuma estar prevista em contrato e em exigências técnicas locais. Como passou de 45 dias sem registro, confirme com a prestadora se a visita foi feita e documentada. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência o elevador precisa de manutenção?",
        priority: "atencao",
        resolveAction: { field: "ultimaManutencaoElevador", type: "done", buttonLabel: "Manutenção realizada", successMessage: "Manutenção registrada" },
        consequencia: "Elevador sem manutenção registrada pode configurar descumprimento contratual e risco operacional em caso de falha.",
        proximoPasso: "Contate a empresa de manutenção para confirmar se a visita foi realizada e solicitar registro.",
        checklist: ["Contatar prestadora de manutenção", "Verificar se houve visita não registrada", "Se não: agendar nova visita urgente", "Registrar data no app"],
      });
    } else if (ds > 30) {
      items.push({
        id: "elevador-atencao",
        icon: "🛗",
        label: "Manutenção do elevador",
        urgencyLabel: "Confirme a visita de manutenção mensal",
        context:
          `Verifique se a empresa de manutenção realizou a visita prevista este mês e se o registro ficou documentado. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência o elevador precisa de manutenção?",
        priority: "atencao",
        resolveAction: { field: "ultimaManutencaoElevador", type: "done", buttonLabel: "Confirmar manutenção realizada", successMessage: "Manutenção registrada" },
        consequencia: "Perder uma visita de manutenção mensal pode estar em desacordo com o contrato e reduz a segurança operacional.",
        proximoPasso: "Verifique com a portaria ou administradora se a empresa esteve no prédio este mês.",
        checklist: ["Confirmar visita com portaria ou administradora", "Se realizada: registrar data no app", "Se não: contatar empresa para remarcar"],
      });
    }
  }

  // Extintores
  if (m.ultimaInspecaoExtintores && past(m.ultimaInspecaoExtintores)) {
    const ds = desde(m.ultimaInspecaoExtintores);
    const mo = Math.floor(ds / 30);
    if (ds > 365) {
      items.push({
        id: "extintores-atrasados",
        icon: "🧯",
        label: "Inspeção dos extintores",
        urgencyLabel: `${mo} meses sem registro — verificar se realizada`,
        context:
          `A inspeção anual dos extintores é uma referência operacional de segurança. Como passou de 12 meses, vale confirmar com a empresa responsável se a inspeção foi realizada e registrada. ${ROTINA_DISCLAIMER}`,
        askQ: "Qual o prazo para manutenção dos extintores do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaInspecaoExtintores", type: "done", buttonLabel: "Inspeção realizada", successMessage: "Inspeção registrada" },
        consequencia: "Extintores sem inspeção podem estar inoperantes em caso de emergência — risco real para moradores e responsabilidade do síndico.",
        proximoPasso: "Contate a empresa de manutenção de extintores para verificar e, se necessário, agendar inspeção.",
        checklist: ["Verificar se inspeção foi realizada e não registrada", "Se não: contatar empresa especializada", "Realizar inspeção e registrar data no app"],
      });
    } else if (ds > 330) {
      items.push({
        id: "extintores-atencao",
        icon: "🧯",
        label: "Inspeção dos extintores",
        urgencyLabel: "Prazo de inspeção anual se aproximando",
        context:
          `Programe a inspeção dos extintores das áreas comuns antes de completar 12 meses ou confirme se a vistoria já está agendada. ${ROTINA_DISCLAIMER}`,
        askQ: "Qual o prazo para manutenção dos extintores do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaInspecaoExtintores", type: "done", buttonLabel: "Inspeção realizada", successMessage: "Inspeção registrada" },
        consequencia: "Deixar passar o prazo anual coloca os extintores em situação irregular — equipamentos potencialmente sem recarga ou teste.",
        proximoPasso: "Contate a empresa de extintores para agendar a inspeção antes do prazo anual.",
        checklist: ["Contatar empresa especializada", "Agendar inspeção e recarga se necessário", "Registrar data no app após conclusão"],
      });
    }
  }

  // SPDA
  if (m.ultimaVistoriaSPDA && past(m.ultimaVistoriaSPDA)) {
    const ds = desde(m.ultimaVistoriaSPDA);
    const mo = Math.floor(ds / 30);
    if (ds > 365) {
      items.push({
        id: "spda-atrasado",
        icon: "⚡",
        label: "Vistoria SPDA",
        urgencyLabel: `${mo} meses sem registro — verificar laudo com técnico`,
        context:
          `A vistoria periódica do SPDA ajuda a manter o sistema de proteção contra descargas atmosféricas em condição operacional. Como passou de 12 meses, vale verificar o laudo e confirmar a necessidade de nova vistoria com responsável técnico. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser feita a vistoria do para-raios?",
        priority: "atencao",
        resolveAction: { field: "ultimaVistoriaSPDA", type: "done", buttonLabel: "Vistoria realizada", successMessage: "Vistoria SPDA registrada" },
        consequencia: "SPDA sem vistoria pode estar inoperante em caso de descarga atmosférica — risco à estrutura e aos moradores.",
        proximoPasso: "Verifique se há laudo recente e, se não, contrate engenheiro ou empresa especializada em SPDA.",
        checklist: ["Verificar se há laudo técnico recente", "Se não: contratar profissional habilitado", "Realizar vistoria e arquivar laudo", "Registrar data no app"],
      });
    } else if (ds > 330) {
      items.push({
        id: "spda-atencao",
        icon: "⚡",
        label: "Vistoria SPDA",
        urgencyLabel: "Prazo anual se aproximando",
        context:
          `A referência operacional é revisar o SPDA anualmente ou conforme orientação técnica aplicável. Com o prazo se aproximando, vale agendar ou confirmar a próxima vistoria. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser feita a vistoria do para-raios?",
        priority: "atencao",
        resolveAction: { field: "ultimaVistoriaSPDA", type: "done", buttonLabel: "Vistoria realizada", successMessage: "Vistoria SPDA registrada" },
        consequencia: "Não revisar o SPDA periodicamente pode deixar o sistema inoperante sem que você saiba.",
        proximoPasso: "Contate um engenheiro ou empresa especializada para agendar a vistoria anual.",
        checklist: ["Contatar profissional habilitado para SPDA", "Agendar vistoria", "Registrar data no app após laudo emitido"],
      });
    }
  }

  // Vistoria elétrica
  if (m.ultimaVistoriaEletrica && past(m.ultimaVistoriaEletrica)) {
    const ds = desde(m.ultimaVistoriaEletrica);
    const mo = Math.floor(ds / 30);
    if (ds > 365) {
      items.push({
        id: "eletrica-atrasada",
        icon: "🔌",
        label: "Vistoria elétrica",
        urgencyLabel: `${mo} meses sem registro — verificar laudo com técnico`,
        context:
          `A vistoria das instalações elétricas é uma referência operacional de prevenção. Como passou de 12 meses, vale verificar se há laudo recente ou necessidade de inspeção por profissional habilitado. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser feita a vistoria elétrica?",
        priority: "atencao",
        resolveAction: { field: "ultimaVistoriaEletrica", type: "done", buttonLabel: "Vistoria realizada", successMessage: "Vistoria elétrica registrada" },
        consequencia: "Instalações elétricas sem vistoria podem ter problemas não detectados — risco de curto-circuito ou incêndio.",
        proximoPasso: "Verifique se há laudo recente com a administradora e, se não, contrate inspeção por eletricista ou engenheiro.",
        checklist: ["Verificar laudo elétrico existente", "Se desatualizado: contratar engenheiro eletricista", "Realizar inspeção e arquivar laudo", "Registrar data no app"],
      });
    } else if (ds > 330) {
      items.push({
        id: "eletrica-atencao",
        icon: "🔌",
        label: "Vistoria elétrica",
        urgencyLabel: "Prazo anual se aproximando",
        context:
          `A referência operacional é revisar as instalações elétricas periodicamente, com apoio técnico quando aplicável. Com o prazo anual se aproximando, vale programar a verificação. ${ROTINA_DISCLAIMER}`,
        askQ: "Com que frequência deve ser feita a vistoria elétrica?",
        priority: "atencao",
        resolveAction: { field: "ultimaVistoriaEletrica", type: "done", buttonLabel: "Vistoria realizada", successMessage: "Vistoria elétrica registrada" },
        consequencia: "Deixar passar o prazo anual mantém o condomínio sem diagnóstico elétrico atualizado.",
        proximoPasso: "Agende a vistoria elétrica com eletricista ou engenheiro habilitado antes de completar o ano.",
        checklist: ["Contatar profissional habilitado", "Agendar inspeção das instalações comuns", "Registrar data no app após laudo emitido"],
      });
    }
  }

  // Vencimento do mandato do síndico
  if (m.fimMandatoSindico) {
    const d = ate(m.fimMandatoSindico);
    if (d < 0) {
      items.push({
        id: "mandato-vencido",
        icon: "🗳️",
        label: "Mandato do síndico",
        urgencyLabel: "Consta como vencido — regularize a assembleia",
        context:
          "O mandato do síndico consta como vencido. Verifique a convenção, organize a assembleia de eleição ou recondução e formalize o resultado em ata.",
        howLong: "A convocação deve respeitar os prazos da convenção — geralmente 10 a 15 dias de antecedência.",
        askQ: "O que acontece quando o mandato do síndico vence?",
        priority: "critico",
        resolveAction: { field: "fimMandatoSindico", type: "expiry", buttonLabel: "Registrar novo mandato", successMessage: "Mandato atualizado" },
        consequencia: "Atos praticados com mandato vencido podem ser questionados juridicamente por qualquer condômino.",
        proximoPasso: "Consulte a convenção hoje para saber o prazo mínimo de convocação e agende a assembleia.",
        checklist: ["Ler prazo mínimo de convocação na convenção", "Definir data e pauta (eleição ou recondução)", "Enviar convocação a todos os condôminos", "Realizar assembleia e lavrar ata", "Registrar nova data de mandato no app"],
      });
    } else if (d === 0) {
      items.push({
        id: "mandato-hoje",
        icon: "🗳️",
        label: "Mandato do síndico",
        urgencyLabel: "Vence hoje — organize a assembleia",
        context:
          "O mandato do síndico vence hoje. Organize a convocação da assembleia de eleição ou recondução o quanto antes, observando os prazos da convenção.",
        askQ: "Como convocar uma assembleia para eleição de síndico?",
        priority: "critico",
        resolveAction: { field: "fimMandatoSindico", type: "expiry", buttonLabel: "Registrar novo mandato", successMessage: "Mandato atualizado" },
        consequencia: "A partir de agora qualquer ato do síndico pode ser contestado por mandato vencido.",
        proximoPasso: "Consulte a convenção agora para saber o prazo de convocação e inicie o processo de assembleia.",
        checklist: ["Verificar prazo de convocação na convenção", "Definir data da assembleia", "Enviar convocação", "Realizar e lavrar ata", "Registrar nova data no app"],
      });
    } else if (d <= 30) {
      items.push({
        id: "mandato-urgente",
        icon: "🗳️",
        label: "Mandato do síndico",
        urgencyLabel: `Vence em ${d} dia${d !== 1 ? "s" : ""} — inicie a convocação`,
        context:
          "Com menos de 30 dias até o fim do mandato, é hora de convocar a assembleia. Observe o prazo mínimo previsto na convenção.",
        howLong: "A convocação geralmente exige 10 a 15 dias de antecedência mínima.",
        askQ: "Como convocar uma assembleia para eleição de síndico?",
        priority: "critico",
        resolveAction: { field: "fimMandatoSindico", type: "expiry", buttonLabel: "Registrar novo mandato", successMessage: "Mandato atualizado" },
        consequencia: "Não convocar a tempo pode resultar em mandato vencido antes da assembleia — situação de incerteza jurídica.",
        proximoPasso: "Verifique o prazo de convocação na convenção e envie o edital ainda esta semana.",
        checklist: ["Verificar prazo de convocação na convenção", "Redigir e enviar edital", "Realizar assembleia e lavrar ata", "Registrar nova data no app"],
      });
    } else if (d <= 60) {
      items.push({
        id: "mandato-breve",
        icon: "🗳️",
        label: "Mandato do síndico",
        urgencyLabel: `Vence em ${d} dias — planeje a convocação`,
        context:
          "O mandato se aproxima do fim. É o momento ideal para planejar a assembleia com tranquilidade.",
        askQ: "Como convocar uma assembleia para eleição de síndico?",
        priority: "atencao",
        resolveAction: { field: "fimMandatoSindico", type: "expiry", buttonLabel: "Registrar novo mandato", successMessage: "Mandato atualizado" },
        consequencia: "Deixar para mais perto reduz o tempo de planejamento e aumenta o risco de vencer o mandato.",
        proximoPasso: "Verifique a convenção e planeje a data da assembleia para o próximo mês.",
        checklist: ["Ler prazo de convocação na convenção", "Definir data e pauta", "Preparar edital de convocação"],
      });
    } else if (d <= 90) {
      items.push({
        id: "mandato-atencao",
        icon: "🗳️",
        label: "Mandato do síndico",
        urgencyLabel: `Vence em ${d} dias — acompanhe o prazo`,
        context:
          "O mandato do síndico está dentro do prazo, mas vale começar a planejar a assembleia de eleição ou recondução para não deixar para a última hora. Verifique a convenção quanto ao período e procedimento.",
        askQ: "Com que antecedência devo convocar a assembleia de eleição do síndico?",
        priority: "atencao",
        resolveAction: { field: "fimMandatoSindico", type: "expiry", buttonLabel: "Registrar novo mandato", successMessage: "Mandato atualizado" },
        consequencia: "Mandato que vence sem assembleia convocada cria um período de incerteza jurídica sobre os atos do síndico.",
        proximoPasso: "Leia a convenção agora para saber o prazo mínimo de convocação e marque na agenda para iniciar 90 dias antes.",
        checklist: ["Ler prazo de convocação na convenção", "Anotar na agenda para convocar com antecedência", "Definir se será eleição ou recondução"],
      });
    }
  }

  // Ordena: crítico primeiro; dentro do mesmo nível mantém ordem de inserção
  return items.sort((a, b) => {
    if (a.priority === b.priority) return 0;
    return a.priority === "critico" ? -1 : 1;
  });
  // Nota: sem .slice() aqui — o GuidancePanel controla o limite de exibição
}
