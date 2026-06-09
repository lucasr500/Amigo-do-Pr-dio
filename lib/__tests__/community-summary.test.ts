import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildCentralDigitalSummary } from "@/lib/community-summary";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => localStorageMock.clear());

describe("buildCentralDigitalSummary", () => {
  test("conta domínios da Central Digital sem depender de UI", () => {
    localStorageMock.setItem("amigo_community_posts", JSON.stringify([
      { id: "p1", title: "Comunicado", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false, createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "p2", title: "Sugestão", body: "y", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false, createdAt: "2026-06-02T10:00:00Z", updatedAt: "2026-06-02T10:00:00Z" },
    ]));
    localStorageMock.setItem("amigo_community_requests", JSON.stringify([
      { id: "r1", unitNumber: "101", authorName: "A", type: "aviso_obra", title: "Obra", description: "x", status: "recebido", priority: "urgente", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "r2", unitNumber: "102", authorName: "B", type: "sugestao", title: "Jardim", description: "x", status: "respondida", priority: "normal", createdAt: "2026-06-02T10:00:00Z", updatedAt: "2026-06-02T10:00:00Z" },
      { id: "r3", unitNumber: "103", authorName: "C", type: "manutencao", title: "Lâmpada", description: "x", status: "resolvido", priority: "normal", createdAt: "2026-06-03T10:00:00Z", updatedAt: "2026-06-03T10:00:00Z" },
    ]));
    localStorageMock.setItem("amigo_community_reservations", JSON.stringify([
      { id: "res1", unit: "201", requesterName: "A", space: "Salão", date: "2099-06-20", status: "aprovada", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "res2", unit: "202", requesterName: "B", space: "Churrasqueira", date: "2099-06-21", status: "solicitada", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    ]));
    localStorageMock.setItem("amigo_community_polls", JSON.stringify([
      { id: "poll1", title: "Horário", description: "", options: [], visibility: "moradores", status: "ativa", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    ]));
    localStorageMock.setItem("amigo_community_documents", JSON.stringify([
      { id: "d1", title: "Regimento", category: "regimento_interno", visibility: "moradores", publishedAt: "2026-06-01", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "d2", title: "Conselho", category: "ata", visibility: "conselho", publishedAt: "2026-06-01", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    ]));

    const summary = buildCentralDigitalSummary();

    expect(summary.officialPosts).toBe(1);
    expect(summary.residentPosts).toBe(1);
    expect(summary.openRequests).toBe(2);
    expect(summary.urgentRequests).toBe(1);
    expect(summary.workNotices).toBe(1);
    expect(summary.suggestions).toBe(1);
    expect(summary.pendingReservations).toBe(1);
    expect(summary.approvedReservations).toBe(1);
    expect(summary.activePolls).toBe(1);
    expect(summary.publicDocuments).toBe(1);
  });
});
