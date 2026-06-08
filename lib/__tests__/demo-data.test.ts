import { describe, expect, test } from "vitest";
import { getDemoUserBackup } from "@/lib/demo-data";

// Helpers para verificar offsets relativos
function daysBetween(isoA: string, isoB: string): number {
  return Math.round(
    (new Date(`${isoB}T12:00:00`).getTime() - new Date(`${isoA}T12:00:00`).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

describe("demo-data — primeiros 10 minutos", () => {
  test("usa o schema atual do backup", () => {
    const demo = getDemoUserBackup();
    expect(demo.app).toBe("amigo-do-predio");
    expect(demo.version).toBe("12");
  });

  test("alimenta a Home preparada do morador", () => {
    const demo = getDemoUserBackup();
    expect(demo.communityPosts?.some((post) => post.visibility === "moradores" && post.pinned)).toBe(true);
    expect(demo.communityRequests?.length).toBeGreaterThanOrEqual(2);
    expect(demo.communityPolls?.some((poll) => poll.status === "ativa")).toBe(true);
  });

  test("inclui documentos públicos e timeline institucional para demo", () => {
    const demo = getDemoUserBackup();
    expect(demo.communityDocuments?.some((doc) => doc.visibility === "moradores")).toBe(true);
    expect(demo.communityTimeline?.some((event) => event.visibility === "moradores")).toBe(true);
  });

  test("inclui snapshots financeiros para demonstrar cockpit recorrente", () => {
    const demo = getDemoUserBackup();
    expect(demo.financialSnapshots?.length).toBeGreaterThanOrEqual(2);
    expect(demo.financialSnapshots?.some((snapshot) => snapshot.delinquencyRate !== undefined)).toBe(true);
    expect(demo.financialSnapshots?.some((snapshot) => snapshot.liquidityReserve !== undefined)).toBe(true);
  });
});

describe("demo-data — datas dinâmicas (relativas a hoje)", () => {
  test("vencimentoAVCB está ~5 dias à frente de hoje", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.vencimentoAVCB).toBeDefined();
    const diff = daysBetween(todayIso(), memoria!.vencimentoAVCB!);
    expect(diff).toBeGreaterThanOrEqual(4);
    expect(diff).toBeLessThanOrEqual(6);
  });

  test("vencimentoSeguro está ~80 dias à frente de hoje", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.vencimentoSeguro).toBeDefined();
    const diff = daysBetween(todayIso(), memoria!.vencimentoSeguro!);
    expect(diff).toBeGreaterThanOrEqual(79);
    expect(diff).toBeLessThanOrEqual(81);
  });

  test("fimMandatoSindico está ~35 dias à frente de hoje", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.fimMandatoSindico).toBeDefined();
    const diff = daysBetween(todayIso(), memoria!.fimMandatoSindico!);
    expect(diff).toBeGreaterThanOrEqual(34);
    expect(diff).toBeLessThanOrEqual(36);
  });

  test("ultimaAGO está ~450 dias no passado", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.ultimaAGO).toBeDefined();
    const diff = daysBetween(memoria!.ultimaAGO!, todayIso());
    expect(diff).toBeGreaterThanOrEqual(449);
    expect(diff).toBeLessThanOrEqual(451);
  });

  test("ultimaLimpezaCaixaDAgua está ~265 dias no passado (vencida)", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.ultimaLimpezaCaixaDAgua).toBeDefined();
    const diff = daysBetween(memoria!.ultimaLimpezaCaixaDAgua!, todayIso());
    expect(diff).toBeGreaterThanOrEqual(264);
    expect(diff).toBeLessThanOrEqual(266);
  });

  test("snapshots financeiros usam mês atual e anterior (sem ano fixo)", () => {
    const { financialSnapshots } = getDemoUserBackup();
    expect(financialSnapshots?.length).toBeGreaterThanOrEqual(2);
    const currentYear = new Date().getFullYear();
    const allYearsValid = financialSnapshots!.every((s) => {
      const year = parseInt(s.month.slice(0, 4), 10);
      return year === currentYear || year === currentYear - 1;
    });
    expect(allYearsValid).toBe(true);
  });

  test("pendências da demo têm datas de criação no passado recente", () => {
    const { pendencias } = getDemoUserBackup();
    expect(pendencias?.length).toBeGreaterThanOrEqual(3);
    pendencias!.forEach((p) => {
      const created = p.createdAt.slice(0, 10);
      const diff = daysBetween(created, todayIso());
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThanOrEqual(60);
    });
  });

  test("evento AGO na agenda está ~42 dias à frente", () => {
    const { agenda } = getDemoUserBackup();
    const ago = agenda?.find((e) => e.id === "demo-a1");
    expect(ago).toBeDefined();
    const diff = daysBetween(todayIso(), ago!.date);
    expect(diff).toBeGreaterThanOrEqual(41);
    expect(diff).toBeLessThanOrEqual(43);
  });
});
