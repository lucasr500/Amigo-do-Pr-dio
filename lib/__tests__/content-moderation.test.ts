import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { isSensitiveContent } from "@/lib/content-moderation";
import { addComment, getComments } from "@/lib/community-posts";

describe("isSensitiveContent — heurística determinística (defaults seguros)", () => {
  test("termos sensíveis disparam (com e sem acento)", () => {
    expect(isSensitiveContent("o vizinho é inadimplente")).toBe(true);
    expect(isSensitiveContent("isso é inadimplência crônica")).toBe(true);
    expect(isSensitiveContent("ele é um caloteiro")).toBe(true);
    expect(isSensitiveContent("vou processar o síndico")).toBe(true);
    expect(isSensitiveContent("a unidade 302 não paga há meses")).toBe(true);
    expect(isSensitiveContent("ele deve a taxa")).toBe(true);
    expect(isSensitiveContent("acho que houve desvio de verba")).toBe(true);
  });

  test("conteúdo comum NÃO dispara (sem falso positivo óbvio)", () => {
    expect(isSensitiveContent("obrigado pelo aviso")).toBe(false);
    expect(isSensitiveContent("combinado, até a assembleia")).toBe(false);
    expect(isSensitiveContent("deveria haver mais reuniões")).toBe(false); // "deveria" ≠ "deve"
    expect(isSensitiveContent("")).toBe(false);
    expect(isSensitiveContent(undefined)).toBe(false);
  });
});

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

describe("addComment — pré-moderação local (fecha por padrão)", () => {
  test("conteúdo sensível nasce 'pendente' MESMO com autoApprove=true", () => {
    const c = addComment("post-1", "Morador", "o vizinho é inadimplente", true);
    expect(c.status).toBe("pendente");
    expect(getComments()[0].status).toBe("pendente");
  });

  test("conteúdo comum com autoApprove=true publica (reativo)", () => {
    const c = addComment("post-1", "Morador", "obrigado pelo aviso", true);
    expect(c.status).toBe("publicado");
  });

  test("conteúdo comum sem autoApprove segue pendente (default)", () => {
    const c = addComment("post-1", "Morador", "ok combinado");
    expect(c.status).toBe("pendente");
  });
});
