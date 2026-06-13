// Copy centralizada dos estados vazios da Central Digital.
// Pura e determinística — sem dependência de React, localStorage ou rede.
// Objetivo: cada estado vazio responde "o que faço agora?" (princípio Apple-like),
// com tom adequado ao público (gestão x membro) e sem duplicar texto pelos painéis.

export type EmptyAudience = "manager" | "member";

export type CommunityEmptyContext =
  | "mural"
  | "requests"
  | "polls"
  | "documents"
  | "reservas";

export interface EmptyStateContent {
  title: string;
  description: string;
  /** Linha de orientação discreta — o próximo passo natural. */
  hint: string;
}

const CONTENT: Record<CommunityEmptyContext, Record<EmptyAudience, EmptyStateContent>> = {
  mural: {
    manager: {
      title: "Nenhum comunicado publicado ainda",
      description: "Use o Mural Oficial para manter os moradores informados sem depender de grupos de mensagem.",
      hint: "Dica: o primeiro comunicado costuma ser a apresentação da nova gestão.",
    },
    member: {
      title: "Nenhum comunicado disponível",
      description: "Quando a gestão publicar avisos, obras ou comunicados oficiais, eles aparecerão aqui.",
      hint: "Você será avisado assim que houver um novo comunicado.",
    },
  },
  requests: {
    manager: {
      title: "Nenhuma solicitação registrada",
      description: "As solicitações dos moradores chegam aqui organizadas, com histórico e status — sem se perder em conversas.",
      hint: "Cada solicitação resolvida vira registro na memória do condomínio.",
    },
    member: {
      title: "Você ainda não fez solicitações",
      description: "Registre pedidos, reclamações ou sugestões para a gestão de forma organizada e com acompanhamento.",
      hint: "Dica: solicitações registradas aqui têm protocolo e não se perdem.",
    },
  },
  polls: {
    manager: {
      title: "Nenhuma enquete criada",
      description: "Consulte os moradores de forma transparente e registre o resultado como decisão oficial do condomínio.",
      hint: "Enquetes aumentam a participação e reduzem ruído em assembleias.",
    },
    member: {
      title: "Nenhuma enquete aberta",
      description: "Quando a gestão abrir uma consulta, você poderá votar e acompanhar o resultado por aqui.",
      hint: "Sua participação ajuda a tornar as decisões mais legítimas.",
    },
  },
  documents: {
    manager: {
      title: "Nenhum documento publicado",
      description: "Publique atas, regimento, balancetes e contratos para dar transparência e preservar a memória do condomínio.",
      hint: "Documentos publicados continuam acessíveis mesmo após a troca de síndico.",
    },
    member: {
      title: "Nenhum documento disponível",
      description: "Atas, regimento, balancetes e demais documentos oficiais ficarão reunidos aqui, sempre à mão.",
      hint: "Tudo em um só lugar — sem precisar pedir no grupo.",
    },
  },
  reservas: {
    manager: {
      title: "Nenhuma reserva registrada",
      description: "Organize o uso dos espaços comuns com regras claras e histórico, evitando conflitos de agenda.",
      hint: "Defina os espaços disponíveis para os moradores começarem a reservar.",
    },
    member: {
      title: "Nenhuma reserva por aqui",
      description: "Reserve salão, churrasqueira e demais áreas comuns de forma simples e com confirmação.",
      hint: "Dica: reserve com antecedência para garantir a data desejada.",
    },
  },
};

/**
 * Retorna o conteúdo do estado vazio para um contexto da Central Digital,
 * adequado ao público (gestão x membro).
 */
export function communityEmptyState(
  context: CommunityEmptyContext,
  audience: EmptyAudience
): EmptyStateContent {
  return CONTENT[context][audience];
}

/** Converte um papel/flag de gestão no público de copy correspondente. */
export function audienceFromRole(isManager: boolean): EmptyAudience {
  return isManager ? "manager" : "member";
}
