// ─── Solicitações estruturadas — CRUD ────────────────────────────────────────
import { safeRead, safeWrite } from "./session-core";
import type { ResidentRequest, RequestStatus } from "./community-types";
import { addAuditEntry } from "./community-posts";

export type { ResidentRequest, RequestStatus };

const KEY = "amigo_community_requests";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getRequests(): ResidentRequest[] {
  return safeRead<ResidentRequest[]>(KEY, []);
}

export function saveRequests(list: ResidentRequest[]): void {
  safeWrite(KEY, list);
}

export function addRequest(
  data: Omit<ResidentRequest, "id" | "createdAt" | "updatedAt" | "status">
): ResidentRequest {
  const now = new Date().toISOString();
  const req: ResidentRequest = {
    ...data,
    id: uid(),
    status: "recebido",
    createdAt: now,
    updatedAt: now,
  };
  saveRequests([req, ...getRequests()]);
  addAuditEntry("request_updated", "request", req.id, "resident", `Solicitação aberta: ${req.title}`);
  return req;
}

export function updateRequest(id: string, patch: Partial<ResidentRequest>): void {
  const now = new Date().toISOString();
  saveRequests(
    getRequests().map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: now } : r
    )
  );
}

export function resolveRequest(id: string, note: string): void {
  const now = new Date().toISOString();
  updateRequest(id, {
    status: "resolvido",
    resolutionNote: note,
    closedAt: now,
  });
  addAuditEntry("request_resolved", "request", id, "manager", "Solicitação resolvida");
}

export function closeRequest(id: string, status: Extract<RequestStatus, "recusado" | "arquivado">): void {
  updateRequest(id, { status, closedAt: new Date().toISOString() });
  addAuditEntry("request_closed", "request", id, "manager", `Solicitação ${status}`);
}

export function deleteRequest(id: string): void {
  saveRequests(getRequests().filter((r) => r.id !== id));
}

// ─── Utilitários de consulta ──────────────────────────────────────────────────

export function getOpenRequests(): ResidentRequest[] {
  const closed: RequestStatus[] = ["resolvido", "recusado", "arquivado"];
  return getRequests()
    .filter((r) => !closed.includes(r.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRequestsByStatus(status: RequestStatus): ResidentRequest[] {
  return getRequests().filter((r) => r.status === status);
}

export function getRequestSummary(): {
  total: number;
  open: number;
  resolved: number;
  urgent: number;
} {
  const all = getRequests();
  const closed: RequestStatus[] = ["resolvido", "recusado", "arquivado"];
  return {
    total: all.length,
    open: all.filter((r) => !closed.includes(r.status)).length,
    resolved: all.filter((r) => r.status === "resolvido").length,
    urgent: all.filter((r) => r.priority === "urgente" && !closed.includes(r.status)).length,
  };
}

export function buildRequestsWhatsAppText(req: ResidentRequest): string {
  const lines = [
    `*Protocolo #${req.id.slice(-6).toUpperCase()}*`,
    `Solicitação: ${req.title}`,
    `Tipo: ${req.type}`,
    `Unidade: ${req.unitNumber ?? "Não informada"}`,
    `Status: ${req.status}`,
  ];
  if (req.resolutionNote) lines.push(`Resposta: ${req.resolutionNote}`);
  return lines.join("\n");
}

// ─── Seed de exemplo ──────────────────────────────────────────────────────────

export function seedDemoRequests(): void {
  if (getRequests().length > 0) return;
  const now = new Date().toISOString();
  const past = new Date(Date.now() - 3 * 86400000).toISOString();

  const demo: ResidentRequest[] = [
    {
      id: `req-${Date.now()}-1`,
      unitNumber: "302",
      authorName: "Morador da 302",
      type: "barulho",
      title: "Barulho excessivo após 22h",
      description: "O apartamento acima tem feito barulho intenso após as 22h repetidamente.",
      status: "em_analise",
      priority: "alta",
      createdAt: past,
      updatedAt: past,
    },
    {
      id: `req-${Date.now()}-2`,
      unitNumber: "105",
      authorName: "Morador da 105",
      type: "manutencao",
      title: "Lâmpada queimada no corredor do 1º andar",
      description: "A lâmpada do corredor próximo à escada está queimada há 3 dias.",
      status: "resolvido",
      priority: "normal",
      resolutionNote: "Lâmpada substituída em 05/06. Agradecemos o aviso.",
      createdAt: past,
      updatedAt: now,
      closedAt: now,
    },
    {
      id: `req-${Date.now()}-3`,
      unitNumber: "201",
      authorName: "Morador da 201",
      type: "sugestao",
      title: "Instalar espelho no elevador",
      description: "Seria útil ter um espelho no elevador como é comum em outros prédios.",
      status: "recebido",
      priority: "baixa",
      createdAt: now,
      updatedAt: now,
    },
  ];
  saveRequests(demo);
}
