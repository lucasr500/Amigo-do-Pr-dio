// Camada remota das Ordens de Serviço — dual-write PUSH (017, gated-off). Best-effort.
// Gating em toda função: sem window, flag off ou sem condomínio → no-op. Com
// `service_orders_remote_enabled` desligado (default), zero rede.
//
// NÃO HÁ mirrorDelete: cancelamento é status 'cancelada' (soft) — nunca hard-delete.
// created_by é server-managed (DEFAULT auth.uid()); o push NÃO o envia.

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type {
  ServiceOrder, ServiceOrderStatus, ServiceOrderCategory, ServiceOrderOrigin,
  ServiceOrderPriority, ServiceOrderEvidence,
} from "@/lib/service-orders"; // type-only: sem ciclo runtime

type DbError = { message: string } | null;

type OrderRow = {
  id: string;
  condominio_id: string;
  created_by?: string | null;
  title: string | null;
  description: string | null;
  origin: string | null;
  linked_request_id: string | null;
  category: string | null;
  status: string | null;
  assignee_membership_id: string | null;
  priority: string | null;
  due_date: string | null;
  evidence: ServiceOrderEvidence[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};
type OrderUpsert = Omit<OrderRow, "created_by" | "created_at" | "updated_at">;

type OrdersTable = {
  upsert: (row: OrderUpsert, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  select: (cols: string) => { eq: (c: string, v: string) => Promise<{ data: OrderRow[] | null; error: DbError }> };
};
type SupabaseClient = { from: (table: "service_orders") => OrdersTable };

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

function toRow(o: ServiceOrder, condominioId: string): OrderUpsert {
  return {
    id: o.id,
    condominio_id: condominioId,
    title: o.title ?? "",
    description: o.description ?? null,
    origin: o.origin ?? "manual",
    linked_request_id: o.linkedRequestId ?? null,
    category: o.category ?? "outro",
    status: o.status ?? "aberta",
    assignee_membership_id: o.assigneeMembershipId ?? null,
    priority: o.priority ?? "media",
    due_date: o.dueDate ?? null,
    evidence: o.evidence ?? [],
  };
}

function fromRow(r: OrderRow): ServiceOrder {
  return {
    id: r.id,
    title: r.title ?? "",
    description: r.description ?? undefined,
    origin: (r.origin ?? "manual") as ServiceOrderOrigin,
    linkedRequestId: r.linked_request_id ?? undefined,
    category: (r.category ?? "outro") as ServiceOrderCategory,
    status: (r.status ?? "aberta") as ServiceOrderStatus,
    assigneeMembershipId: r.assignee_membership_id ?? undefined,
    priority: (r.priority ?? "media") as ServiceOrderPriority,
    dueDate: r.due_date ?? undefined,
    evidence: (r.evidence ?? []) as ServiceOrderEvidence[],
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

export async function mirrorUpsertServiceOrder(order: ServiceOrder): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("service_orders_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("service_orders").upsert(toRow(order, condId), { onConflict: "id" });
  } catch { /* best-effort */ }
}

export async function listRemoteServiceOrders(condominioId?: string): Promise<ServiceOrder[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("service_orders_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const { data, error } = await asClient(rawClient).from("service_orders").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromRow);
  } catch { return []; }
}
