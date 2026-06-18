import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { resolveCommunityRole, canSimulateRole } from "@/lib/community-view";
import { setViewMode } from "@/lib/community-permissions";

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

describe("community-view — anti-leak por papel (QA opção A)", () => {
  test("MORADOR é travado em 'resident' mesmo com view-mode 'manager' no storage", () => {
    setViewMode("manager"); // tenta forçar gestão
    expect(resolveCommunityRole("resident")).toBe("resident"); // não vaza
  });

  test("morador não pode simular papéis; síndico pode", () => {
    expect(canSimulateRole("resident")).toBe(false);
    expect(canSimulateRole("manager")).toBe(true);
  });

  test("síndico usa o view-mode (preview): respeita o que está salvo", () => {
    setViewMode("council");
    expect(resolveCommunityRole("manager")).toBe("council");
    setViewMode("resident");
    expect(resolveCommunityRole("manager")).toBe("resident");
  });
});
