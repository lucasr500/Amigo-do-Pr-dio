// Cutover de LEITURA das Ordens de Serviço (017) — deliberado e reversível.
// Puxa as ordens remotas (já filtradas pela RLS staff×papel) do condomínio ativo, faz merge
// com o store local e grava. A UI segue lendo getServiceOrders().
//
// SEGURANÇA (invariante): com `service_orders_remote_enabled` off OU anônimo OU sem condomínio,
// é NO-OP TOTAL — store local intocado, byte-a-byte idêntico ao atual.

import { isEnabled } from "@/lib/feature-flags";
import { getServiceOrders, saveServiceOrders } from "@/lib/service-orders";
import { listRemoteServiceOrders } from "@/lib/tenant/serviceOrdersRemote";
import { mergeServiceOrders } from "@/lib/tenant/serviceOrdersMerge";

export type PullResult = { merged: boolean; remoteCount: number };

export async function pullRemoteServiceOrders(): Promise<PullResult> {
  if (typeof window === "undefined") return { merged: false, remoteCount: 0 };
  if (!isEnabled("service_orders_remote_enabled")) return { merged: false, remoteCount: 0 };
  try {
    const remote = await listRemoteServiceOrders();
    if (remote.length === 0) return { merged: false, remoteCount: 0 };
    const local = getServiceOrders();
    const merged = mergeServiceOrders(local, remote);
    saveServiceOrders(merged);
    return { merged: true, remoteCount: remote.length };
  } catch {
    return { merged: false, remoteCount: 0 };
  }
}
