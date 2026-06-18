import { describe, test, expect } from "vitest";
import { mergeAgendaEvents } from "@/lib/tenant/agendaMerge";
import type { AgendaEvent } from "@/lib/session-agenda";

function ev(partial: Partial<AgendaEvent> & { id: string }): AgendaEvent {
  return {
    title: "Evento",
    date: "2026-01-01",
    type: "outro",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as AgendaEvent;
}

describe("mergeAgendaEvents", () => {
  test("une eventos distintos de local e remoto", () => {
    const local = [ev({ id: "a" })];
    const remote = [ev({ id: "b" })];

    const merged = mergeAgendaEvents(local, remote);
    const ids = merged.map((e) => e.id).sort();

    expect(ids).toEqual(["a", "b"]);
  });

  test("em conflito, vence o de timestamp mais recente (remoto mais novo)", () => {
    const local = [ev({ id: "a", title: "antigo", updatedAt: "2026-01-01T10:00:00.000Z" })];
    const remote = [ev({ id: "a", title: "novo", updatedAt: "2026-01-02T10:00:00.000Z" })];

    const merged = mergeAgendaEvents(local, remote);

    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("novo");
  });

  test("em conflito, local mais novo prevalece sobre remoto mais antigo", () => {
    const local = [ev({ id: "a", title: "local-novo", updatedAt: "2026-02-01T00:00:00.000Z" })];
    const remote = [ev({ id: "a", title: "remoto-velho", updatedAt: "2026-01-01T00:00:00.000Z" })];

    const merged = mergeAgendaEvents(local, remote);

    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("local-novo");
  });

  test("usa createdAt quando updatedAt está ausente", () => {
    const local = [ev({ id: "a", title: "local", createdAt: "2026-01-01T00:00:00.000Z" })];
    const remote = [ev({ id: "a", title: "remoto", createdAt: "2026-03-01T00:00:00.000Z" })];

    const merged = mergeAgendaEvents(local, remote);

    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("remoto");
  });

  test("ausência de um id no remoto NÃO apaga o evento local", () => {
    const local = [ev({ id: "a" }), ev({ id: "b" })];
    const remote = [ev({ id: "a" })];

    const merged = mergeAgendaEvents(local, remote);
    const ids = merged.map((e) => e.id).sort();

    expect(ids).toEqual(["a", "b"]);
  });

  test("empate de timestamp preserva o evento local já presente", () => {
    const ts = "2026-01-05T00:00:00.000Z";
    const local = [ev({ id: "a", title: "local", updatedAt: ts })];
    const remote = [ev({ id: "a", title: "remoto", updatedAt: ts })];

    const merged = mergeAgendaEvents(local, remote);

    expect(merged[0].title).toBe("local");
  });

  test("listas vazias retornam vazio", () => {
    expect(mergeAgendaEvents([], [])).toEqual([]);
  });
});
