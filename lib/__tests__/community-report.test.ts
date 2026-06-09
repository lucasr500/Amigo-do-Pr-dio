import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildCommunityReport } from "@/lib/community-report";

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

describe("buildCommunityReport — reservas", () => {
  test("relatório de gestão inclui resumo de reservas", () => {
    localStorageMock.setItem("amigo_community_reservations", JSON.stringify([
      { id: "r1", unit: "201", requesterName: "A", space: "Salão", date: "2099-06-20", status: "aprovada", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "r2", unit: "202", requesterName: "B", space: "Churrasqueira", date: "2099-06-21", status: "solicitada", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    ]));

    const report = buildCommunityReport("manager", "Edifício Teste");

    expect(report).toContain("RESERVAS DE ESPAÇOS");
    expect(report).toContain("Pendentes: 1");
    expect(report).toContain("Aprovadas: 1");
    expect(report).toContain("Churrasqueira");
  });

  test("relatório de morador inclui próximas reservas aprovadas", () => {
    localStorageMock.setItem("amigo_community_reservations", JSON.stringify([
      { id: "r1", unit: "201", requesterName: "A", space: "Salão", date: "2099-06-20", status: "aprovada", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
      { id: "r2", unit: "202", requesterName: "B", space: "Churrasqueira", date: "2099-06-21", status: "solicitada", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    ]));

    const report = buildCommunityReport("resident", "Edifício Teste");

    expect(report).toContain("RESERVAS APROVADAS");
    expect(report).toContain("Salão");
    expect(report).not.toContain("Churrasqueira");
  });
});
