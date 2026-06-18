import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  addAssemblyComment, getCommentsForItem, getPublishedCommentsForItem,
  countPublishedForItem, countPendingForItem,
  moderateAssemblyComment, deleteAssemblyComment,
  deleteCommentsForItem, deleteCommentsForAssembly,
} from "@/lib/assembly-discussion";

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

describe("addAssemblyComment", () => {
  test("gestor (autoApprove) entra publicado; morador entra pendente", () => {
    const a = addAssemblyComment("i1", "asm1", "Síndico", "manager", "Aprovo a pauta", true);
    const b = addAssemblyComment("i1", "asm1", "Morador", "resident", "Discordo", false);
    expect(a?.status).toBe("publicado");
    expect(b?.status).toBe("pendente");
  });

  test("corpo vazio → null, sem persistir", () => {
    expect(addAssemblyComment("i1", "asm1", "Síndico", "manager", "   ", true)).toBeNull();
    expect(getCommentsForItem("i1")).toHaveLength(0);
  });
});

describe("escopo por item", () => {
  test("getCommentsForItem retorna só do item, em ordem cronológica", () => {
    addAssemblyComment("i1", "asm1", "Síndico", "manager", "primeiro", true);
    addAssemblyComment("i2", "asm1", "Síndico", "manager", "outro item", true);
    addAssemblyComment("i1", "asm1", "Síndico", "manager", "segundo", true);
    const itens = getCommentsForItem("i1");
    expect(itens).toHaveLength(2);
    expect(itens.map((c) => c.body)).toEqual(["primeiro", "segundo"]);
  });

  test("getPublishedCommentsForItem exclui pendentes/ocultos", () => {
    addAssemblyComment("i1", "asm1", "Síndico", "manager", "pub", true);
    addAssemblyComment("i1", "asm1", "Morador", "resident", "pend", false);
    expect(getPublishedCommentsForItem("i1")).toHaveLength(1);
    expect(countPublishedForItem("i1")).toBe(1);
    expect(countPendingForItem("i1")).toBe(1);
  });
});

describe("moderação", () => {
  test("aprovar pendente o torna publicado e carimba moderatedAt", () => {
    const c = addAssemblyComment("i1", "asm1", "Morador", "resident", "ok?", false)!;
    moderateAssemblyComment(c.id, "publicado");
    const updated = getCommentsForItem("i1")[0];
    expect(updated.status).toBe("publicado");
    expect(updated.moderatedAt).toBeTruthy();
  });

  test("ocultar remove da contagem de publicados", () => {
    const c = addAssemblyComment("i1", "asm1", "Síndico", "manager", "x", true)!;
    moderateAssemblyComment(c.id, "oculto");
    expect(countPublishedForItem("i1")).toBe(0);
  });

  test("deleteAssemblyComment remove o comentário", () => {
    const c = addAssemblyComment("i1", "asm1", "Síndico", "manager", "x", true)!;
    deleteAssemblyComment(c.id);
    expect(getCommentsForItem("i1")).toHaveLength(0);
  });
});

describe("cascata", () => {
  test("deleteCommentsForItem limpa só o item alvo", () => {
    addAssemblyComment("i1", "asm1", "Síndico", "manager", "a", true);
    addAssemblyComment("i2", "asm1", "Síndico", "manager", "b", true);
    deleteCommentsForItem("i1");
    expect(getCommentsForItem("i1")).toHaveLength(0);
    expect(getCommentsForItem("i2")).toHaveLength(1);
  });

  test("deleteCommentsForAssembly limpa todos os itens da assembleia", () => {
    addAssemblyComment("i1", "asm1", "Síndico", "manager", "a", true);
    addAssemblyComment("i2", "asm1", "Síndico", "manager", "b", true);
    addAssemblyComment("i3", "asm2", "Síndico", "manager", "c", true);
    deleteCommentsForAssembly("asm1");
    expect(getCommentsForItem("i1")).toHaveLength(0);
    expect(getCommentsForItem("i2")).toHaveLength(0);
    expect(getCommentsForItem("i3")).toHaveLength(1);
  });
});
