import { describe, test, expect } from "vitest";
import { mergeAssemblies, mergeAgendaItems } from "@/lib/tenant/assembliesMerge";
import type { Assembly, AssemblyAgendaItem } from "@/lib/session-assembleias";

function asm(partial: Partial<Assembly> & { id: string }): Assembly {
  return {
    titulo: "Assembleia",
    tipo: "ago",
    status: "rascunho",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as Assembly;
}

function item(partial: Partial<AssemblyAgendaItem> & { id: string }): AssemblyAgendaItem {
  return {
    assemblyId: "asm_1",
    ordem: 0,
    titulo: "Item",
    tipo: "deliberacao",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as AssemblyAgendaItem;
}

describe("mergeAssemblies", () => {
  test("une registros distintos de local e remoto", () => {
    const merged = mergeAssemblies([asm({ id: "a" })], [asm({ id: "b" })]);
    expect(merged.map((a) => a.id).sort()).toEqual(["a", "b"]);
  });

  test("em conflito, vence o de timestamp mais recente (remoto mais novo)", () => {
    const local = [asm({ id: "a", titulo: "antigo", updatedAt: "2026-01-01T10:00:00.000Z" })];
    const remote = [asm({ id: "a", titulo: "novo", updatedAt: "2026-01-02T10:00:00.000Z" })];
    const merged = mergeAssemblies(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].titulo).toBe("novo");
  });

  test("em conflito, local mais novo prevalece sobre remoto mais antigo", () => {
    const local = [asm({ id: "a", titulo: "novo", updatedAt: "2026-01-03T00:00:00.000Z" })];
    const remote = [asm({ id: "a", titulo: "antigo", updatedAt: "2026-01-01T00:00:00.000Z" })];
    expect(mergeAssemblies(local, remote)[0].titulo).toBe("novo");
  });

  test("ausência no remoto NÃO apaga o registro local (sem tombstones)", () => {
    const merged = mergeAssemblies([asm({ id: "a" }), asm({ id: "b" })], []);
    expect(merged.map((a) => a.id).sort()).toEqual(["a", "b"]);
  });

  test("empate de timestamp preserva o local", () => {
    const local = [asm({ id: "a", titulo: "local", updatedAt: "2026-01-01T00:00:00.000Z" })];
    const remote = [asm({ id: "a", titulo: "remoto", updatedAt: "2026-01-01T00:00:00.000Z" })];
    expect(mergeAssemblies(local, remote)[0].titulo).toBe("local");
  });
});

describe("mergeAgendaItems", () => {
  test("une itens por id e resolve conflito por updatedAt", () => {
    const local = [item({ id: "i1", resultado: "v1", updatedAt: "2026-01-01T00:00:00.000Z" })];
    const remote = [
      item({ id: "i1", resultado: "v2", updatedAt: "2026-02-01T00:00:00.000Z" }),
      item({ id: "i2" }),
    ];
    const merged = mergeAgendaItems(local, remote);
    expect(merged.map((i) => i.id).sort()).toEqual(["i1", "i2"]);
    expect(merged.find((i) => i.id === "i1")?.resultado).toBe("v2");
  });
});
