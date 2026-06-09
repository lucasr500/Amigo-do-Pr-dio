import { describe, expect, test } from "vitest";
import { formatDateSafe } from "@/lib/date-format";

describe("formatDateSafe", () => {
  test("formata data ISO simples sem retornar fallback", () => {
    expect(formatDateSafe("2026-06-09", undefined, "Data inválida")).not.toBe("Data inválida");
  });

  test("retorna fallback para data inválida", () => {
    expect(formatDateSafe("nao-e-data", undefined, "Data inválida")).toBe("Data inválida");
  });

  test("retorna fallback para valor vazio", () => {
    expect(formatDateSafe("", undefined, "Sem data")).toBe("Sem data");
    expect(formatDateSafe(null, undefined, "Sem data")).toBe("Sem data");
  });
});
