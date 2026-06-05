import { beforeEach, describe, expect, test } from "vitest";
import {
  buildCommandCenter,
  buildCommandCenterCached,
  clearCommandCenterCache,
  getCommandCenterSignature,
} from "@/lib/command-center";

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((key) => delete store[key]); },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageMock },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
  localStorageMock.clear();
  clearCommandCenterCache();
});

describe("Command Center cache", () => {
  test("entrega output equivalente ao build direto", () => {
    const direct = buildCommandCenter();
    clearCommandCenterCache();

    const cached = buildCommandCenterCached({ now: 1_000 });

    expect(cached).toEqual(direct);
  });

  test("reaproveita resultado quando assinatura e TTL não mudam", () => {
    const first = buildCommandCenterCached({ now: 1_000 });
    const second = buildCommandCenterCached({ now: 1_500 });

    expect(second).toBe(first);
  });

  test("invalida cache quando dados locais mudam", () => {
    const signatureBefore = getCommandCenterSignature("2026-06-05");
    const first = buildCommandCenterCached({ now: 1_000 });

    localStorage.setItem("amigo_pendencias", JSON.stringify([]));

    const signatureAfter = getCommandCenterSignature("2026-06-05");
    const second = buildCommandCenterCached({ now: 1_500 });

    expect(signatureAfter).not.toBe(signatureBefore);
    expect(second).not.toBe(first);
  });

  test("não cacheia erro de build", () => {
    expect(() =>
      buildCommandCenterCached({
        now: 1_000,
        build: () => {
          throw new Error("falha controlada");
        },
      })
    ).toThrow("falha controlada");

    const recovered = buildCommandCenterCached({ now: 1_500 });
    const reused = buildCommandCenterCached({ now: 1_800 });

    expect(reused).toBe(recovered);
  });
});
