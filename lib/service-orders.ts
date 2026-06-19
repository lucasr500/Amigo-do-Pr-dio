// ─── Ordem de Serviço — loop operacional (local-first) ───────────────────────
// morador reporta (Canal) → síndico vira ORDEM → funcionário executa e COMPROVA →
// registro na linha do tempo. NÃO é RH (folha/ponto/contrato é da administradora).
// Persiste em localStorage; espelho relacional gated (serviceOrdersRemote).

import { safeRead, safeWrite } from "./session-core";
import { mirrorUpsertServiceOrder } from "@/lib/tenant/serviceOrdersRemote";
import { addTimelineEvent } from "./community-timeline";
import type { ResidentRequest } from "./community-types";

const KEY = "amigo_service_orders";

export type ServiceOrderStatus = "aberta" | "em_andamento" | "concluida" | "cancelada";
export type ServiceOrderCategory = "manutencao" | "limpeza" | "seguranca" | "obra" | "outro";
export type ServiceOrderOrigin = "manual" | "solicitacao";
export type ServiceOrderPriority = "baixa" | "media" | "alta";

export type ServiceOrderEvidence = {
  kind: "foto" | "nota";
  url?: string;     // foto: link/objeto no Storage (fase futura)
  text?: string;    // nota
  createdAt: string;
};

export type ServiceOrder = {
  id: string;
  title: string;
  description?: string;
  origin: ServiceOrderOrigin;
  linkedRequestId?: string;          // quando nasce do Canal
  category: ServiceOrderCategory;
  status: ServiceOrderStatus;
  assigneeMembershipId?: string;     // o staff responsável (base da RLS de staff)
  priority: ServiceOrderPriority;
  dueDate?: string;                  // YYYY-MM-DD
  evidence: ServiceOrderEvidence[];
  createdAt: string;
  updatedAt: string;
};

function uid(): string {
  return `os_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getServiceOrders(): ServiceOrder[] {
  return safeRead<ServiceOrder[]>(KEY, []);
}

export function saveServiceOrders(orders: ServiceOrder[]): void {
  safeWrite(KEY, orders);
}

export function addServiceOrder(
  data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt" | "status" | "evidence" | "origin" | "priority" | "category"> &
    { status?: ServiceOrderStatus; evidence?: ServiceOrderEvidence[]; origin?: ServiceOrderOrigin; priority?: ServiceOrderPriority; category?: ServiceOrderCategory }
): ServiceOrder {
  const now = new Date().toISOString();
  const order: ServiceOrder = {
    ...data,
    id: uid(),
    origin: data.origin ?? "manual",
    priority: data.priority ?? "media",
    category: data.category ?? "outro",
    status: data.status ?? "aberta",
    evidence: data.evidence ?? [],
    createdAt: now,
    updatedAt: now,
  };
  saveServiceOrders([order, ...getServiceOrders()]);
  void mirrorUpsertServiceOrder(order); // dual-write PUSH best-effort (no-op se flag off)
  return order;
}

export function updateServiceOrder(id: string, patch: Partial<Omit<ServiceOrder, "id" | "createdAt">>): void {
  saveServiceOrders(
    getServiceOrders().map((o) => o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o)
  );
  const updated = getServiceOrders().find((o) => o.id === id);
  if (updated) void mirrorUpsertServiceOrder(updated);
}

/** Funcionário marca como feita + comprova; fecha o loop na linha do tempo. */
export function completeServiceOrder(id: string, evidence?: ServiceOrderEvidence): void {
  const order = getServiceOrders().find((o) => o.id === id);
  if (!order) return;
  const nextEvidence = evidence ? [...order.evidence, evidence] : order.evidence;
  updateServiceOrder(id, { status: "concluida", evidence: nextEvidence });

  // Loop → registro na linha do tempo (visibilidade gestão por padrão — defaults seguros).
  const type = order.category === "obra" ? "obra_concluida"
    : order.category === "manutencao" ? "manutencao_realizada"
    : "outro";
  const now = new Date().toISOString();
  addTimelineEvent({
    type, title: `Ordem concluída: ${order.title}`, description: order.description,
    visibility: "gestao", sourceModule: "service_orders", sourceId: order.id, occurredAt: now,
  });
}

/** Loop de entrada: o síndico converte uma solicitação do Canal em ordem de serviço. */
export function createServiceOrderFromRequest(
  request: Pick<ResidentRequest, "id" | "title" | "description">,
  category: ServiceOrderCategory = "outro",
  assigneeMembershipId?: string
): ServiceOrder {
  return addServiceOrder({
    title: request.title,
    description: request.description,
    origin: "solicitacao",
    linkedRequestId: request.id,
    category,
    assigneeMembershipId,
  });
}

export function getOpenServiceOrders(): ServiceOrder[] {
  const closed: ServiceOrderStatus[] = ["concluida", "cancelada"];
  return getServiceOrders()
    .filter((o) => !closed.includes(o.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getServiceOrdersForAssignee(membershipId: string): ServiceOrder[] {
  return getServiceOrders().filter((o) => o.assigneeMembershipId === membershipId);
}
