import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { buildPredioContext } from "@/lib/predio-context";
import { addDecision } from "@/lib/decisions";
import { addAssembly } from "@/lib/session-assembleias";
import { KEYS } from "@/lib/session-core";
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

describe("seam Pergunte ao Prédio (W6) — contexto role-aware", () => {
  test("gestor recebe decisões no contexto; morador NÃO (blindagem por papel)", () => {
    addDecision({ title: "Trocar fornecedor do elevador", date: "2026-06-01", category: "fornecedor", context: "", rationale: "", outcome: "ok" });
    expect(buildPredioContext("manager").decisions.total).toBe(1);
    expect(buildPredioContext("resident").decisions.total).toBe(0); // morador não recebe decisão
    expect(buildPredioContext("council").decisions.total).toBe(1);  // conselho recebe
  });

  test("timeline do contexto respeita visibilidade do papel", () => {
    const ev = (id: string, v: TimelineEvent["visibility"]): TimelineEvent =>
      ({ id, type: "comunicado_registrado", title: id, visibility: v, occurredAt: "2026-06-01T10:00:00Z", createdAt: "2026-06-01T10:00:00Z" });
    localStorageMock.setItem(KEYS.COMMUNITY_TIMELINE, JSON.stringify([ev("pub", "moradores"), ev("ges", "gestao")]));
    expect(buildPredioContext("resident").timeline.total).toBe(1);
    expect(buildPredioContext("manager").timeline.total).toBe(2);
  });

  test("inclui próxima assembleia e estrutura completa", () => {
    addAssembly({ titulo: "AGE Fachada", tipo: "age", status: "convocada" });
    const ctx = buildPredioContext("manager");
    expect(ctx.assemblies.next?.titulo).toBe("AGE Fachada");
    expect(ctx.role).toBe("manager");
    expect(ctx).toHaveProperty("transparency");
    expect(ctx).toHaveProperty("documents");
  });
});
