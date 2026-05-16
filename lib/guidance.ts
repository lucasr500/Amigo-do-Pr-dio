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
};

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
          "O seguro condominial é obrigatório por lei (Art. 13 da Lei 4.591/64). Sem cobertura ativa, o condomínio assume integralmente riscos como incêndio e explosão — e o síndico pode ser responsabilizado pessoalmente.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar renovação do seguro", successMessage: "Seguro renovado" },
      });
    } else if (d === 0) {
      items.push({
        id: "seguro-hoje",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: "Renova hoje — providencie agora",
        context:
          "O seguro condominial vence hoje. Providencie a renovação imediatamente para que o condomínio não fique sem cobertura — exigência legal para todos os condomínios.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
      });
    } else if (d <= 7) {
      items.push({
        id: "seguro-urgente",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dia${d !== 1 ? "s" : ""} — providencie agora`,
        context:
          "Com menos de 7 dias para o vencimento, providencie a renovação hoje. O seguro cobre incêndio, raio e explosão — obrigação legal de todos os condomínios.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
      });
    } else if (d <= 30) {
      items.push({
        id: "seguro-iminente",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dias — providencie agora`,
        context:
          "Providencie a renovação antes do vencimento. O seguro cobre incêndio, raio e explosão — exigência legal para todos os condomínios.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "critico",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
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
      });
    } else if (d <= 90) {
      items.push({
        id: "seguro-atencao",
        icon: "🛡️",
        label: "Seguro condominial",
        urgencyLabel: `Renova em ${d} dias — acompanhe o prazo`,
        context:
          "O seguro está dentro do prazo. Comece a avaliar as condições da renovação com antecedência — cotações e aprovação em assembleia podem exigir tempo.",
        askQ: "O seguro condominial é obrigatório?",
        priority: "atencao",
        resolveAction: { field: "vencimentoSeguro", type: "expiry", buttonLabel: "Registrar nova data do seguro", successMessage: "Seguro renovado" },
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
          "A Lei 4.591/64 exige a AGO ao menos uma vez por ano. O atraso pode contestar a validade de deliberações tomadas no período e gerar conflitos entre condôminos e administradora.",
        howLong: "A convocação deve ser enviada com no mínimo 10 dias de antecedência.",
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
        urgencyLabel: `Última há ${ds} dias — realize em breve`,
        context:
          "A dedetização semestral das áreas comuns, garagem e tubulações previne infestações e é uma obrigação do síndico. Atrasos prolongados aumentam o risco e podem gerar reclamações formais dos moradores.",
        askQ: "Com que frequência deve ser feita a dedetização do condomínio?",
        priority: "critico",
        resolveAction: { field: "ultimaDedetizacao", type: "done", buttonLabel: "Dedetização realizada", successMessage: "Dedetização registrada" },
      });
    } else if (ds > 150) {
      items.push({
        id: "dedet-atencao",
        icon: "🐛",
        label: "Dedetização",
        urgencyLabel: "Prazo semestral se aproximando",
        context:
          "Programe a dedetização das áreas comuns. O prazo recomendado é semestral — com mais de 150 dias já é hora de agendar.",
        askQ: "Com que frequência deve ser feita a dedetização do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaDedetizacao", type: "done", buttonLabel: "Dedetização realizada", successMessage: "Dedetização registrada" },
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
        urgencyLabel: `Última há ${ds} dias — realize em breve`,
        context:
          "A Portaria MS 888/2021 e a NBR 5626 exigem limpeza semestral da caixa d'água. Atrasos comprometem a qualidade da água potável e expõem o condomínio a responsabilidade sanitária.",
        askQ: "Com que frequência deve ser limpa a caixa d'água do condomínio?",
        priority: "critico",
        resolveAction: { field: "ultimaLimpezaCaixaDAgua", type: "done", buttonLabel: "Limpeza realizada", successMessage: "Limpeza registrada" },
      });
    } else if (ds > 150) {
      items.push({
        id: "caixa-atencao",
        icon: "💧",
        label: "Limpeza da caixa d'água",
        urgencyLabel: "Prazo semestral se aproximando",
        context:
          "Programe a limpeza da caixa d'água antes de completar 6 meses. Exigência normativa e de saúde pública.",
        askQ: "Com que frequência deve ser limpa a caixa d'água do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaLimpezaCaixaDAgua", type: "done", buttonLabel: "Limpeza realizada", successMessage: "Limpeza registrada" },
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
        urgencyLabel: `${ds} dias sem manutenção — verifique o contrato`,
        context:
          "A manutenção mensal do elevador é obrigatória por lei e prevista no contrato da prestadora. O atraso pode anular garantias e gera responsabilidade civil do condomínio em caso de acidente com passageiro.",
        askQ: "Com que frequência o elevador precisa de manutenção?",
        priority: "critico",
        resolveAction: { field: "ultimaManutencaoElevador", type: "done", buttonLabel: "Manutenção realizada", successMessage: "Manutenção registrada" },
      });
    } else if (ds > 30) {
      items.push({
        id: "elevador-atencao",
        icon: "🛗",
        label: "Manutenção do elevador",
        urgencyLabel: "Confirme a visita de manutenção mensal",
        context:
          "Verifique se a empresa de manutenção realizou a visita prevista este mês. O registro da visita deve ser mantido no livro de ocorrências.",
        askQ: "Com que frequência o elevador precisa de manutenção?",
        priority: "atencao",
        resolveAction: { field: "ultimaManutencaoElevador", type: "done", buttonLabel: "Confirmar manutenção realizada", successMessage: "Manutenção registrada" },
      });
    }
  }

  // Extintores
  if (m.ultimaInspecaoExtintores && past(m.ultimaInspecaoExtintores)) {
    const ds = desde(m.ultimaInspecaoExtintores);
    const mo = Math.floor(ds / 30);
    if (ds > 210) {
      items.push({
        id: "extintores-atrasados",
        icon: "🧯",
        label: "Inspeção dos extintores",
        urgencyLabel: `${mo} meses sem inspeção`,
        context:
          "Extintores sem manutenção não funcionam em emergência. A NBR 12962 exige inspeção anual com recarga quando necessário. Em caso de incêndio, o síndico pode ser responsabilizado se o equipamento estiver irregular.",
        askQ: "Qual o prazo para manutenção dos extintores do condomínio?",
        priority: "critico",
        resolveAction: { field: "ultimaInspecaoExtintores", type: "done", buttonLabel: "Inspeção realizada", successMessage: "Inspeção registrada" },
      });
    } else if (ds > 150) {
      items.push({
        id: "extintores-atencao",
        icon: "🧯",
        label: "Inspeção dos extintores",
        urgencyLabel: "Prazo de inspeção anual se aproximando",
        context:
          "Programe a inspeção dos extintores das áreas comuns antes do prazo anual vencer. É exigência normativa e de segurança.",
        askQ: "Qual o prazo para manutenção dos extintores do condomínio?",
        priority: "atencao",
        resolveAction: { field: "ultimaInspecaoExtintores", type: "done", buttonLabel: "Inspeção realizada", successMessage: "Inspeção registrada" },
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
