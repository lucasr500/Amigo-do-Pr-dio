import { describe, expect, test } from "vitest";
import { can, canSeeVisibility, filterByVisibility } from "@/lib/community-permissions";

describe("community-permissions — capacidades críticas", () => {
  test("apenas gestão pode gerenciar aprovação/cancelamento de reservas", () => {
    expect(can("manager", "canManageReservations")).toBe(true);
    expect(can("council", "canManageReservations")).toBe(false);
    expect(can("resident", "canManageReservations")).toBe(false);
    expect(can("viewer", "canManageReservations")).toBe(false);
  });

  test("conselho visualiza solicitações agregadas sem atualizar status", () => {
    expect(can("council", "canViewAllRequests")).toBe(true);
    expect(can("council", "canUpdateRequestStatus")).toBe(false);
  });
});

describe("community-permissions — visibilidade", () => {
  test("morador não vê conteúdo de gestão ou conselho", () => {
    expect(canSeeVisibility("resident", "gestao")).toBe(false);
    expect(canSeeVisibility("resident", "conselho")).toBe(false);
    expect(canSeeVisibility("resident", "moradores")).toBe(true);
    expect(canSeeVisibility("resident", "publico")).toBe(true);
  });

  test("filtro preserva apenas itens visíveis ao perfil", () => {
    const items = [
      { id: "gestao", visibility: "gestao" as const },
      { id: "conselho", visibility: "conselho" as const },
      { id: "moradores", visibility: "moradores" as const },
      { id: "publico", visibility: "publico" as const },
    ];

    expect(filterByVisibility(items, "resident").map((item) => item.id)).toEqual(["moradores", "publico"]);
    expect(filterByVisibility(items, "council").map((item) => item.id)).toEqual(["conselho", "moradores", "publico"]);
  });
});
