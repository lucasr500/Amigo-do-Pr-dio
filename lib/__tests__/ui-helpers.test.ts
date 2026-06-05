import { afterEach, describe, expect, test, vi } from "vitest";
import { buildDocumentosExecutiveText, buildDocumentosFilterOptions } from "@/components/documentos/documentos-ui-helpers";
import { buildFinancialFilterOptions, formatMoneyCompact } from "@/components/financial/financial-ui";
import { syncDebug } from "@/lib/sync/syncLogger";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("documentos UI helpers", () => {
  test("mantém filtros principais de documentos", () => {
    expect(buildDocumentosFilterOptions().map((option) => option.value)).toEqual([
      "todos",
      "criticos",
      "faltam",
      "vencidos",
      "proximos",
      "regulares",
      "sem_revisao",
    ]);
  });

  test("prioriza texto executivo por criticidade", () => {
    expect(buildDocumentosExecutiveText({
      total: 10,
      tenho: 4,
      faltam: 3,
      vencidos: 2,
      proximos: 1,
      criticos: 4,
      criticosPendentes: 2,
      semRevisao: 1,
    })).toContain("críticos");

    expect(buildDocumentosExecutiveText({
      total: 10,
      tenho: 8,
      faltam: 0,
      vencidos: 0,
      proximos: 0,
      criticos: 4,
      criticosPendentes: 0,
      semRevisao: 0,
    })).toBe("Documentos sem pendências críticas registradas no app.");
  });
});

describe("financial UI helpers", () => {
  test("mantém filtros do financeiro auxiliar", () => {
    expect(buildFinancialFilterOptions().map((option) => option.value)).toEqual([
      "todos",
      "receitas",
      "despesas",
      "contas",
      "vencidas",
      "pagas",
      "investimentos",
    ]);
  });

  test("compacta valores financeiros grandes", () => {
    expect(formatMoneyCompact(1500)).toBe("R$ 1.5K");
    expect(formatMoneyCompact(1_200_000)).toBe("R$ 1.2M");
  });
});

describe("sync logger", () => {
  test("não registra fora de development", () => {
    vi.stubEnv("NODE_ENV", "production");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    syncDebug("sync", "ignored");

    expect(debug).not.toHaveBeenCalled();
  });

  test("registra apenas em development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    syncDebug("autoSync", "ok", { attempt: 1 });

    expect(debug).toHaveBeenCalledWith("[autoSync] ok", { attempt: 1 });
  });
});
