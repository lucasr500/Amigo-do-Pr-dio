import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { getUnifiedTimeline, timelineTrackCounts, trackOf } from "@/lib/timeline";
import type { TimelineEvent } from "@/lib/community-types";
import { KEYS } from "@/lib/session-core";

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

function ev(id: string, type: TimelineEvent["type"], occurredAt: string, visibility: TimelineEvent["visibility"] = "moradores"): TimelineEvent {
  return { id, type, title: id, visibility, occurredAt, createdAt: occurredAt };
}

describe("linha do tempo unificada (W1.2)", () => {
  test("classificação de trilha determinística", () => {
    expect(trackOf("decisao_registrada")).toBe("institucional");
    expect(trackOf("assembleia_realizada")).toBe("institucional");
    expect(trackOf("pendencia_concluida")).toBe("operacional");
    expect(trackOf("manutencao_realizada")).toBe("operacional");
    expect(trackOf("outro")).toBe("operacional");
  });

  test("fonte única ordenada; filtro por trilha", () => {
    localStorageMock.setItem(KEYS.COMMUNITY_TIMELINE, JSON.stringify([
      ev("a", "decisao_registrada", "2026-06-01T10:00:00Z"),
      ev("b", "manutencao_realizada", "2026-06-03T10:00:00Z"),
      ev("c", "assembleia_realizada", "2026-06-02T10:00:00Z"),
    ]));
    const todas = getUnifiedTimeline();
    expect(todas.map((e) => e.id)).toEqual(["b", "c", "a"]); // desc por occurredAt
    expect(getUnifiedTimeline({ track: "institucional" }).map((e) => e.id)).toEqual(["c", "a"]);
    expect(getUnifiedTimeline({ track: "operacional" }).map((e) => e.id)).toEqual(["b"]);
  });

  test("filtro por papel respeita visibilidade", () => {
    localStorageMock.setItem(KEYS.COMMUNITY_TIMELINE, JSON.stringify([
      ev("pub", "comunicado_registrado", "2026-06-01T10:00:00Z", "moradores"),
      ev("int", "decisao_registrada", "2026-06-02T10:00:00Z", "gestao"),
    ]));
    const morador = getUnifiedTimeline({ role: "resident" });
    expect(morador.map((e) => e.id)).toEqual(["pub"]); // não vê o de gestão
    const counts = timelineTrackCounts("resident");
    expect(counts.total).toBe(1);
  });
});
