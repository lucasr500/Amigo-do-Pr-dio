import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { clearActiveProfile, readActiveProfile, saveActiveProfile } from "@/lib/profile-mode";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => { localStorageMock.clear(); });

describe("profile-mode — seleção visual local", () => {
  test("retorna null quando não há perfil selecionado", () => {
    expect(readActiveProfile()).toBeNull();
  });

  test("salva e lê perfil de síndico", () => {
    saveActiveProfile("manager");
    expect(readActiveProfile()).toBe("manager");
  });

  test("salva e lê perfil de morador", () => {
    saveActiveProfile("resident");
    expect(readActiveProfile()).toBe("resident");
  });

  test("ignora valor inválido", () => {
    localStorage.setItem("amigo_active_profile", "admin");
    expect(readActiveProfile()).toBeNull();
  });

  test("limpa perfil selecionado", () => {
    saveActiveProfile("manager");
    clearActiveProfile();
    expect(readActiveProfile()).toBeNull();
  });
});
