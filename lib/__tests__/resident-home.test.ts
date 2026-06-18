import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildResidentSummary } from "@/lib/resident-home";
import { KEYS } from "@/lib/session-core";
import { addPoll } from "@/lib/community-polls";
import { addPublicDocument } from "@/lib/community-documents";
import type { TimelineEvent } from "@/lib/community-types";

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
afterEach(() => { localStorageMock.clear(); });

function ev(id: string, visibility: TimelineEvent["visibility"]): TimelineEvent {
  return { id, type: "comunicado_registrado", title: id, visibility, occurredAt: "2026-06-01T10:00:00Z", createdAt: "2026-06-01T10:00:00Z" };
}

describe("home do morador (W5)", () => {
  test("sem novidades → headline de vazio, hasActivity false", () => {
    const s = buildResidentSummary();
    expect(s.hasActivity).toBe(false);
    expect(s.headline).toMatch(/ainda não há/i);
  });

  test("morador vê só o que é dele (timeline/enquete/documento por papel)", () => {
    localStorageMock.setItem(KEYS.COMMUNITY_TIMELINE, JSON.stringify([
      ev("pub", "moradores"),
      ev("gestao", "gestao"),
    ]));
    addPoll({ title: "Horário da obra", description: "", options: [{ id: "o1", label: "Manhã" }, { id: "o2", label: "Tarde" }], visibility: "moradores", status: "ativa" });
    addPoll({ title: "Interna gestão", description: "", options: [{ id: "o1", label: "A" }, { id: "o2", label: "B" }], visibility: "gestao", status: "ativa" });
    addPublicDocument({ title: "Convenção", category: "convencao", visibility: "moradores", publishedAt: "2026-01-01" });
    addPublicDocument({ title: "Restrito", category: "contrato_publico", visibility: "gestao", publishedAt: "2026-01-01" });

    const s = buildResidentSummary();
    expect(s.recent.map((e) => e.id)).toEqual(["pub"]);     // não vê o de gestão
    expect(s.polls.map((p) => p.title)).toEqual(["Horário da obra"]);
    expect(s.documentsVisible).toBe(1);                      // só o público de moradores
    expect(s.hasActivity).toBe(true);
  });

  test("conselho enxerga mais que morador (régua de papel)", () => {
    localStorageMock.setItem(KEYS.COMMUNITY_TIMELINE, JSON.stringify([ev("c", "conselho")]));
    expect(buildResidentSummary("resident").recent).toHaveLength(0);
    expect(buildResidentSummary("council").recent).toHaveLength(1);
  });
});
